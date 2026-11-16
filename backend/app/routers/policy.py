
from datetime import date, datetime
from decimal import Decimal
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.support_policies import SupportPolicy


router = APIRouter(
    prefix="/api/policies",
    tags=["정부지원 정책"],
)


def policy_to_dict(policy: SupportPolicy):
    return {
        "id": policy.id,
        "external_policy_no": policy.external_policy_no,
        "category_id": policy.category_id,
        "title": policy.title,
        "summary": policy.summary,
        "support_description": policy.support_description,
        "provider_name": policy.provider_name,
        "operator_name": policy.operator_name,
        "application_method": policy.application_method,
        "application_url": policy.application_url,
        "reference_url": policy.reference_url,
        "application_period_text": policy.application_period_text,
        "application_start": policy.application_start,
        "application_end": policy.application_end,
        "min_age": policy.min_age,
        "max_age": policy.max_age,
        "min_income": policy.min_income,
        "max_income": policy.max_income,
        "income_condition_text": policy.income_condition_text,
        "eligibility_text": policy.eligibility_text,
        "exclusion_text": policy.exclusion_text,
        "region_codes": policy.region_codes,
        "employment_codes": policy.employment_codes,
        "education_codes": policy.education_codes,
        "status": policy.status,
        "source_updated_at": policy.source_updated_at,
        "synced_at": policy.synced_at,
        "updated_at": policy.updated_at,
    }


@router.get("")
def get_policies(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=9, ge=1, le=100),
    keyword: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort: str = Query(
        default="latest",
        pattern="^(latest|oldest|title)$",
    ),
    db: Session = Depends(get_db),
):
    conditions = []

    if keyword and keyword.strip():
        search_text = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                SupportPolicy.title.ilike(search_text),
                SupportPolicy.summary.ilike(search_text),
                SupportPolicy.support_description.ilike(search_text),
                SupportPolicy.provider_name.ilike(search_text),
            )
        )

    if status and status.strip():
        conditions.append(
            SupportPolicy.status == status.strip()
        )

    total = db.scalar(
        select(func.count(SupportPolicy.id))
        .where(*conditions)
    ) or 0

    stmt = select(SupportPolicy).where(*conditions)

    if sort == "oldest":
        stmt = stmt.order_by(
            SupportPolicy.updated_at.asc(),
            SupportPolicy.id.asc(),
        )
    elif sort == "title":
        stmt = stmt.order_by(
            SupportPolicy.title.asc(),
            SupportPolicy.id.asc(),
        )
    else:
        stmt = stmt.order_by(
            SupportPolicy.updated_at.desc(),
            SupportPolicy.id.desc(),
        )

    policies = db.scalars(
        stmt.offset((page - 1) * size).limit(size)
    ).all()

    return {
        "items": [
            policy_to_dict(policy)
            for policy in policies
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


@router.get("/{policy_id}")
def get_policy_detail(
    policy_id: int,
    db: Session = Depends(get_db),
):
    policy = db.get(SupportPolicy, policy_id)

    if policy is None:
        raise HTTPException(
            status_code=404,
            detail="해당 지원정책을 찾을 수 없습니다.",
        )

    return policy_to_dict(policy)
