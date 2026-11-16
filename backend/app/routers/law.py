
from datetime import date
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.law import Law, LawVersion, LawArticle


router = APIRouter(
    prefix="/api/laws",
    tags=["법령 정보"],
)


def law_to_dict(law: Law):
    return {
        "id": law.id,
        "external_law_id": law.external_law_id,
        "law_name": law.law_name,
        "law_type": law.law_type,
        "official_url": law.official_url,
        "updated_at": law.updated_at,
    }


def version_to_dict(version: LawVersion):
    return {
        "id": version.id,
        "law_id": version.law_id,
        "promulgation_no": version.promulgation_no,
        "promulgated_on": version.promulgated_on,
        "effective_from": version.effective_from,
        "effective_to": version.effective_to,
        "version_label": version.version_label,
        "source_checked_at": version.source_checked_at,
    }


def article_to_dict(article: LawArticle):
    return {
        "id": article.id,
        "law_version_id": article.law_version_id,
        "article_key": article.article_key,
        "article_no": article.article_no,
        "paragraph_no": article.paragraph_no,
        "heading": article.heading,
        "official_text": article.official_text,
    }


def get_selected_version(
    db: Session,
    law_id: int,
    version_id: int | None = None,
):
    stmt = select(LawVersion).where(
        LawVersion.law_id == law_id
    )

    if version_id is not None:
        version = db.scalar(
            stmt.where(LawVersion.id == version_id)
        )
        if version is None:
            raise HTTPException(
                status_code=404,
                detail="해당 법령 버전을 찾을 수 없습니다.",
            )
        return version

    today = date.today()

    current_version = db.scalar(
        stmt.where(
            LawVersion.effective_from <= today,
            or_(
                LawVersion.effective_to.is_(None),
                LawVersion.effective_to >= today,
            ),
        ).order_by(
            LawVersion.effective_from.desc(),
            LawVersion.id.desc(),
        ).limit(1)
    )

    if current_version is not None:
        return current_version

    return db.scalar(
        stmt.order_by(
            LawVersion.effective_from.desc(),
            LawVersion.id.desc(),
        ).limit(1)
    )


@router.get("")
def get_laws(
    keyword: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Law)

    if keyword and keyword.strip():
        stmt = stmt.where(
            Law.law_name.ilike(f"%{keyword.strip()}%")
        )

    laws = db.scalars(
        stmt.order_by(Law.law_name.asc(), Law.id.asc())
    ).all()

    return {
        "total": len(laws),
        "items": [law_to_dict(law) for law in laws],
    }


@router.get("/{law_id}")
def get_law_detail(
    law_id: int,
    version_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
):
    law = db.get(Law, law_id)

    if law is None:
        raise HTTPException(
            status_code=404,
            detail="해당 법령을 찾을 수 없습니다.",
        )

    versions = db.scalars(
        select(LawVersion)
        .where(LawVersion.law_id == law_id)
        .order_by(
            LawVersion.effective_from.desc(),
            LawVersion.id.desc(),
        )
    ).all()

    selected_version = get_selected_version(
        db, law_id, version_id
    )

    return {
        **law_to_dict(law),
        "versions": [
            version_to_dict(version)
            for version in versions
        ],
        "selected_version": (
            version_to_dict(selected_version)
            if selected_version is not None
            else None
        ),
    }


@router.get("/{law_id}/articles")
def get_law_articles(
    law_id: int,
    version_id: int | None = Query(default=None, ge=1),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    keyword: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    law = db.get(Law, law_id)

    if law is None:
        raise HTTPException(
            status_code=404,
            detail="해당 법령을 찾을 수 없습니다.",
        )

    version = get_selected_version(
        db, law_id, version_id
    )

    if version is None:
        return {
            "law": law_to_dict(law),
            "version": None,
            "items": [],
            "pagination": {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "has_next": False,
                "has_previous": page > 1,
            },
        }

    conditions = [
        LawArticle.law_version_id == version.id
    ]

    if keyword and keyword.strip():
        search_text = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                LawArticle.heading.ilike(search_text),
                LawArticle.official_text.ilike(search_text),
                LawArticle.article_no.ilike(search_text),
            )
        )

    total = db.scalar(
        select(func.count(LawArticle.id))
        .where(*conditions)
    ) or 0

    articles = db.scalars(
        select(LawArticle)
        .where(*conditions)
        .order_by(
            LawArticle.article_key.asc(),
            LawArticle.id.asc(),
        )
        .offset((page - 1) * size)
        .limit(size)
    ).all()

    return {
        "law": law_to_dict(law),
        "version": version_to_dict(version),
        "items": [
            article_to_dict(article)
            for article in articles
        ],
        "pagination": {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": ceil(total / size),
            "has_next": page * size < total,
            "has_previous": page > 1,
        },
    }
