
import hashlib
import json
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_guide import (
    DataSource,
    SourceRecord,
    SyncJob,
    utc_now,
)

from app.models.support_policies import SupportPolicy
from app.services.youth_api import (
    YOUTH_API_URL,
    fetch_youth_policies,
)


SOURCE_CODE = "YOUTH_CENTER"


def clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def parse_int(value):
    try:
        text = clean_text(value)
        return int(text) if text is not None else None
    except (ValueError, TypeError):
        return None


def parse_decimal(value):
    try:
        text = clean_text(value)
        return Decimal(text) if text is not None else None
    except (InvalidOperation, ValueError):
        return None


def parse_date(value):
    text = clean_text(value)
    if not text:
        return None

    for fmt in ("%Y%m%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue

    return None


def parse_datetime(value):
    text = clean_text(value)
    if not text:
        return None

    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def parse_codes(value):
    text = clean_text(value)
    if not text:
        return None

    return [
        item.strip()
        for item in text.split(",")
        if item.strip()
    ]


def make_hash(payload):
    serialized = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(
        serialized.encode("utf-8")
    ).hexdigest()


def get_or_create_source(db):
    source = db.scalar(
        select(DataSource).where(
            DataSource.source_code == SOURCE_CODE
        )
    )

    if source is None:
        source = DataSource(
            source_code=SOURCE_CODE,
            name="온통청년 청년정책",
            base_url=YOUTH_API_URL,
            source_type="API",
            update_policy="DAILY",
            enabled=True,
        )
        db.add(source)
        db.flush()

    return source


def policy_fields(raw, source_id):
    reference_url = (
        clean_text(raw.get("refUrlAddr1"))
        or clean_text(raw.get("refUrlAddr2"))
    )

    period = clean_text(raw.get("aplyYmd"))
    if not period:
        period = clean_text(raw.get("bizPrdEtcCn"))

    return {
        "title": clean_text(raw.get("plcyNm")) or "정책명 없음",
        "summary": clean_text(raw.get("plcyExplnCn")),
        "support_description": clean_text(raw.get("plcySprtCn")),
        "provider_name": (
            clean_text(raw.get("sprvsnInstCdNm"))
            or "기관 정보 없음"
        ),
        "operator_name": clean_text(raw.get("operInstCdNm")),
        "application_method": clean_text(raw.get("plcyAplyMthdCn")),
        "application_url": clean_text(raw.get("aplyUrlAddr")),
        "reference_url": reference_url,
        "application_period_text": period,
        "min_age": parse_int(raw.get("sprtTrgtMinAge")),
        "max_age": parse_int(raw.get("sprtTrgtMaxAge")),
        "income_condition_text": clean_text(raw.get("earnEtcCn")),
        "eligibility_text": clean_text(
            raw.get("addAplyQlfcCndCn")
        ),
        "region_codes": parse_codes(raw.get("zipCd")),
        "employment_codes": parse_codes(raw.get("jobCd")),
        "education_codes": parse_codes(raw.get("schoolCd")),
        "source_updated_at": parse_datetime(
            raw.get("lastMdfcnDt")
        ),
        "source_id": source_id,
    }


def sync_youth_policies(
    db: Session,
    page_size: int = 100,
    max_pages: int = 100,
) -> dict:
    if not 1 <= page_size <= 100:
        raise ValueError("page_size는 1~100이어야 합니다.")

    if not 1 <= max_pages <= 100:
        raise ValueError("max_pages는 1~100이어야 합니다.")

    source = get_or_create_source(db)

    job = SyncJob(
        data_source_id=source.id,
        dataset="youth_policies",
        status="RUNNING",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    fetched = 0
    inserted = 0
    updated = 0
    total_count = 0

    try:
        for page in range(1, max_pages + 1):
            policies, total_count = fetch_youth_policies(
                page=page,
                page_size=page_size,
            )

            if not policies:
                break

            for raw in policies:
                external_id = clean_text(raw.get("plcyNo"))
                if not external_id:
                    continue

                fetched += 1
                content_hash = make_hash(raw)

                record = db.scalar(
                    select(SourceRecord).where(
                        SourceRecord.data_source_id == source.id,
                        SourceRecord.external_id == external_id,
                        SourceRecord.entity_type == "YOUTH_POLICY",
                    )
                )

                policy = db.scalar(
                    select(SupportPolicy).where(
                        SupportPolicy.external_policy_no == external_id
                    )
                )

                fields = policy_fields(raw, source.id)

                if policy is None:
                    policy = SupportPolicy(
                        external_policy_no=external_id,
                        **fields,
                    )
                    db.add(policy)
                    db.flush()
                    inserted += 1

                elif record is None or record.content_hash != content_hash:
                    for field, value in fields.items():
                        setattr(policy, field, value)
                    updated += 1

                policy.synced_at = utc_now()

                if record is None:
                    record = SourceRecord(
                        data_source_id=source.id,
                        external_id=external_id,
                        entity_type="YOUTH_POLICY",
                        content_hash=content_hash,
                        raw_payload=raw,
                        fetched_at=utc_now(),
                    )
                    db.add(record)

                elif record.content_hash != content_hash:
                    record.content_hash = content_hash
                    record.raw_payload = raw
                    record.fetched_at = utc_now()

                db.flush()
                record.entity_id = policy.id

            db.commit()

            job.fetched_count = fetched
            job.inserted_count = inserted
            job.updated_count = updated
            db.commit()

            print(
                f"{page}페이지 완료 / "
                f"처리 {fetched}건 / "
                f"신규 {inserted}건 / "
                f"수정 {updated}건"
            )

            if page * page_size >= total_count:
                break

        job.status = "SUCCESS"
        job.finished_at = utc_now()
        job.fetched_count = fetched
        job.inserted_count = inserted
        job.updated_count = updated
        db.commit()

        return {
            "status": "SUCCESS",
            "total_available": total_count,
            "fetched": fetched,
            "inserted": inserted,
            "updated": updated,
        }

    except Exception as exc:
        db.rollback()

        job.status = "FAILED"
        job.finished_at = utc_now()
        job.fetched_count = fetched
        job.inserted_count = inserted
        job.updated_count = updated
        job.error_summary = str(exc)[:2000]
        db.commit()
        raise
