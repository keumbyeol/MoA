
from math import ceil
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.financial_guide import (
    Guide,
    GuideCategory,
    GuideReference,
)


router = APIRouter(
    prefix="/api/guides",
    tags=["금융정보 가이드"],
)


def guide_to_dict(guide: Guide, category: GuideCategory):
    return {
        "id": guide.id,
        "slug": guide.slug,
        "title": guide.title,
        "summary": guide.summary,
        "category": {
            "id": category.id,
            "slug": category.slug,
            "name": category.name,
        },
        "audience": guide.audience,
        "published_at": guide.published_at,
        "reviewed_at": guide.reviewed_at,
        "updated_at": guide.updated_at,
    }


# 카테고리 목록
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    guide_counts = (
        select(
            Guide.category_id,
            func.count(Guide.id).label("guide_count"),
        )
        .where(Guide.status == "PUBLISHED")
        .group_by(Guide.category_id)
        .subquery()
    )

    stmt = (
        select(
            GuideCategory,
            func.coalesce(guide_counts.c.guide_count, 0),
        )
        .outerjoin(
            guide_counts,
            GuideCategory.id == guide_counts.c.category_id,
        )
        .where(GuideCategory.is_active.is_(True))
        .order_by(
            GuideCategory.sort_order,
            GuideCategory.id,
        )
    )

    rows = db.execute(stmt).all()

    categories = [
        {
            "id": category.id,
            "slug": category.slug,
            "name": category.name,
            "count": count,
        }
        for category, count in rows
    ]

    return {
        "total": sum(item["count"] for item in categories),
        "categories": categories,
    }


# 가이드 목록
@router.get("")
def get_guides(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=9, ge=1, le=100),
    category: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    sort: Literal["latest", "oldest", "title"] = "latest",
    db: Session = Depends(get_db),
):
    conditions = [
        Guide.status == "PUBLISHED",
        GuideCategory.is_active.is_(True),
    ]

    if category and category != "all":
        conditions.append(
            GuideCategory.slug == category
        )

    if keyword and keyword.strip():
        search_text = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                Guide.title.ilike(search_text),
                Guide.summary.ilike(search_text),
            )
        )

    total_stmt = (
        select(func.count(Guide.id))
        .join(
            GuideCategory,
            Guide.category_id == GuideCategory.id,
        )
        .where(*conditions)
    )

    total = db.scalar(total_stmt) or 0

    stmt = (
        select(Guide, GuideCategory)
        .join(
            GuideCategory,
            Guide.category_id == GuideCategory.id,
        )
        .where(*conditions)
    )

    if sort == "oldest":
        stmt = stmt.order_by(
            Guide.published_at.asc(),
            Guide.id.asc(),
        )
    elif sort == "title":
        stmt = stmt.order_by(
            Guide.title.asc(),
            Guide.id.asc(),
        )
    else:
        stmt = stmt.order_by(
            Guide.published_at.desc(),
            Guide.id.desc(),
        )

    stmt = stmt.offset(
        (page - 1) * size
    ).limit(size)

    rows = db.execute(stmt).all()

    return {
        "items": [
            guide_to_dict(guide, guide_category)
            for guide, guide_category in rows
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


# 가이드 상세
@router.get("/{guide_id}")
def get_guide_detail(
    guide_id: int,
    db: Session = Depends(get_db),
):
    stmt = (
        select(Guide, GuideCategory)
        .join(
            GuideCategory,
            Guide.category_id == GuideCategory.id,
        )
        .where(
            Guide.id == guide_id,
            Guide.status == "PUBLISHED",
            GuideCategory.is_active.is_(True),
        )
    )

    row = db.execute(stmt).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="해당 금융정보 가이드를 찾을 수 없습니다.",
        )

    guide, category = row

    references = db.scalars(
        select(GuideReference)
        .where(GuideReference.guide_id == guide.id)
        .order_by(
            GuideReference.sort_order,
            GuideReference.id,
        )
    ).all()

    result = guide_to_dict(guide, category)

    result["body"] = guide.body
    result["references"] = [
        {
            "id": reference.id,
            "type": reference.reference_type,
            "title": reference.title,
            "url": reference.url,
            "accessed_at": reference.accessed_at,
            "effective_on": reference.effective_on,
        }
        for reference in references
    ]

    return result
