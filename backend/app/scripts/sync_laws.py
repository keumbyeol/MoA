
import argparse
import re
from datetime import date

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.law import Law, LawVersion, LawArticle
from app.models.financial_guide import utc_now
from app.services.law_api import search_laws, fetch_law_detail


TARGET_LAWS = [
    "근로기준법",
    "최저임금법",
    "소득세법",
    "국민연금법",
    "국민건강보험법",
    "고용보험법",
]


def parse_date(value):
    if not value:
        return None

    text = (
        str(value)
        .strip()
        .replace("-", "")
        .replace(".", "")
    )

    if not re.fullmatch(r"\d{8}", text):
        return None

    try:
        return date(
            int(text[:4]),
            int(text[4:6]),
            int(text[6:8]),
        )
    except ValueError:
        return None


def as_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, dict):
        return [value]

    return []


def clean_text(value):
    if value is None:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, list):
        parts = [
            clean_text(item)
            for item in value
        ]
        return "\n".join(
            part for part in parts if part
        )

    if isinstance(value, dict):
        if "content" in value:
            return clean_text(value["content"])

        parts = [
            clean_text(item)
            for item in value.values()
        ]
        return "\n".join(
            part for part in parts if part
        )

    return str(value).strip()


def find_exact_law(keyword):
    response = search_laws(keyword)
    search_data = response.get("LawSearch", {})

    if not isinstance(search_data, dict):
        raise ValueError(
            "법령 검색 응답 형식이 올바르지 않습니다."
        )

    candidates = as_list(
        search_data.get("law")
    )

    matches = [
        item
        for item in candidates
        if (
            isinstance(item, dict)
            and clean_text(item.get("법령명한글")) == keyword
        )
    ]

    if not matches:
        raise ValueError(
            f"{keyword}: 정확히 일치하는 법령 없음"
        )

    current = [
        item
        for item in matches
        if clean_text(
            item.get("현행연혁코드")
        ) == "현행"
    ]

    if not current:
        raise ValueError(
            f"{keyword}: 현행 법령을 찾지 못했습니다."
        )

    if len(current) != 1:
        raise ValueError(
            f"{keyword}: 현행 법령이 여러 건입니다."
        )

    return current[0]


def extract_article_text(item):
    """조문 본문과 하위 항·호·목을 순서대로 결합한다."""
    parts = []

    def walk(node):
        if isinstance(node, list):
            for child in node:
                walk(child)
            return

        if not isinstance(node, dict):
            return

        # 국가법령정보센터 JSON: 조문내용과 항/호/목이 별도 중첩됨
        for key in ("조문내용", "항내용", "호내용", "목내용"):
            if key in node:
                value = clean_text(node[key])
                if value and (not parts or parts[-1] != value):
                    parts.append(value)

        for key in ("항", "호", "목"):
            if key in node:
                walk(node[key])

    walk(item)
    return "\n".join(parts)


def prepare_articles(detail):
    article_container = detail.get("조문") or {}

    if not isinstance(article_container, dict):
        raise ValueError("조문 응답 형식이 올바르지 않습니다.")

    raw_articles = as_list(article_container.get("조문단위"))
    articles = []
    seen_keys = set()

    for item in raw_articles:
        if not isinstance(item, dict):
            continue

        # 장·절 제목 제외
        if clean_text(item.get("조문여부")) != "조문":
            continue

        article_key = clean_text(item.get("조문키"))
        article_no = clean_text(item.get("조문번호"))
        article_text = extract_article_text(item)

        if not article_key or not article_no or not article_text:
            raise ValueError("조문에 필수 정보가 누락됐습니다.")

        if article_key in seen_keys:
            raise ValueError(f"중복 조문키 발견: {article_key}")
        seen_keys.add(article_key)

        articles.append({
            "article_key": article_key,
            "article_no": article_no,
            "paragraph_no": None,
            "heading": clean_text(item.get("조문제목")) or None,
            "official_text": article_text,
        })

    if not articles:
        raise ValueError("저장 가능한 조문이 없습니다.")

    return articles


def sync_one_law(db, keyword):
    print(f"\n[{keyword}] 검색 중...")

    search_item = find_exact_law(keyword)

    external_law_id = clean_text(
        search_item.get("법령ID")
    )

    external_version_id = clean_text(
        search_item.get("법령일련번호")
    )

    if (
        not external_law_id
        or not external_version_id
    ):
        raise ValueError(
            "법령 ID 또는 법령일련번호가 없습니다."
        )

    print(
        f"법령 ID: {external_law_id}"
    )

    print(
        f"법령일련번호: {external_version_id}"
    )

    # 법령 ID로 상세 조회
    response = fetch_law_detail(
        external_law_id
    )
    detail = response.get("법령", {})

    if not isinstance(detail, dict):
        raise ValueError(
            "법령 상세 응답 형식이 올바르지 않습니다."
        )

    info = detail.get("기본정보") or {}

    if not isinstance(info, dict):
        raise ValueError(
            "법령 기본정보 형식이 올바르지 않습니다."
        )

    detail_law_id = clean_text(
        info.get("법령ID")
    )

    detail_name = clean_text(
        info.get("법령명_한글")
    )

    # 검색 결과와 상세 결과 확인
    print(
        "검색 법령 ID:",
        repr(external_law_id)
    )

    print(
        "상세 법령 ID:",
        repr(detail_law_id)
    )

    print(
        "상세 법령명:",
        repr(detail_name)
    )

    # 앞자리 0 차이만 허용
    if (
        detail_law_id.lstrip("0")
        != external_law_id.lstrip("0")
    ):
        raise ValueError(
            "검색 결과와 상세 조회의 법령 ID가 다릅니다."
        )

    if detail_name != keyword:
        raise ValueError(
            f"법령명이 일치하지 않습니다: {detail_name}"
        )

    effective_from = parse_date(
        info.get("시행일자")
    )

    if not effective_from:
        raise ValueError(
            "유효한 시행일자가 없습니다."
        )

    articles = prepare_articles(detail)

    # API 응답 구조가 예상과 다르면 제목만 다시 저장하지 않도록 보호
    if keyword == "근로기준법":
        for number in ("55", "56", "70"):
            matches = [a for a in articles if a["article_no"] == number]
            if not matches or max(len(a["official_text"]) for a in matches) < 50:
                raise ValueError(
                    f"제{number}조 본문이 충분히 추출되지 않았습니다. "
                    "DB를 변경하지 않고 중단합니다. API 응답 구조를 확인하세요."
                )

    law_type = (
        clean_text(
            info.get("법종구분")
        ) or None
    )

    # 기존 법령 검색
    law = db.scalar(
        select(Law).where(
            Law.external_law_id
            == external_law_id
        )
    )

    # 없으면 신규 생성
    if law is None:
        law = Law(
            external_law_id=external_law_id,
            law_name=keyword,
        )

        db.add(law)
        db.flush()

    law.law_name = keyword
    law.law_type = law_type

    law.official_url = (
        "https://www.law.go.kr/법령/"
        f"{keyword}"
    )

    # 법령 버전 조회
    version = db.scalar(
        select(LawVersion).where(
            LawVersion.external_version_id
            == external_version_id
        )
    )

    if version is None:
        version = LawVersion(
            law_id=law.id,
            external_version_id=external_version_id,
            effective_from=effective_from,
        )

        db.add(version)
        db.flush()

    if version.law_id != law.id:
        raise ValueError(
            "법령 버전이 다른 법령에 연결돼 있습니다."
        )

    version.promulgation_no = (
        clean_text(
            info.get("공포번호")
        ) or None
    )

    version.promulgated_on = parse_date(
        info.get("공포일자")
    )

    version.effective_from = effective_from
    version.version_label = "현행"
    version.source_checked_at = utc_now()

    # 기존 조문 확인
    existing_articles = {
        article.article_key: article
        for article in db.scalars(
            select(LawArticle).where(
                LawArticle.law_version_id
                == version.id
            )
        ).all()
    }

    inserted = 0
    updated = 0

    # 조문 저장
    for data in articles:
        article_key = data["article_key"]

        article = existing_articles.get(
            article_key
        )

        if article is None:
            article = LawArticle(
                law_version_id=version.id,
                **data,
            )

            db.add(article)
            inserted += 1

        else:
            for field, value in data.items():
                setattr(
                    article,
                    field,
                    value,
                )

            updated += 1

    # 기존 다른 버전의 조문은 삭제하지 않음
    db.commit()

    print(
        f"[{keyword}] 저장 완료 "
        f"/ 조문 {len(articles)}건 "
        f"/ 신규 {inserted}건 "
        f"/ 갱신 {updated}건"
    )

    return {
        "law": keyword,
        "articles": len(articles),
        "inserted": inserted,
        "updated": updated,
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--limit",
        type=int,
        default=len(TARGET_LAWS),
    )

    args = parser.parse_args()

    if args.limit < 1:
        parser.error(
            "--limit은 1 이상이어야 합니다."
        )

    db = SessionLocal()

    results = []
    failures = []

    try:
        for keyword in TARGET_LAWS[:args.limit]:

            try:
                result = sync_one_law(
                    db,
                    keyword,
                )

                results.append(result)

            except Exception as error:
                db.rollback()

                failures.append(keyword)

                print(
                    f"[{keyword}] 수집 실패: {error}"
                )

    finally:
        db.close()

    print(
        "\n========== 법령 수집 결과 =========="
    )

    print(
        "성공:",
        len(results),
        "개",
    )

    print(
        "실패:",
        len(failures),
        "개",
    )

    print(
        "처리한 조문:",
        sum(
            item["articles"]
            for item in results
        ),
        "건",
    )

    if failures:
        print(
            "실패한 법령:",
            ", ".join(failures),
        )

        raise SystemExit(1)


if __name__ == "__main__":
    main()
