"""MOA DB 검색: AI 모델에 SQL 실행 권한을 주지 않는 검색 서비스."""

import re

from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.models.law import Law, LawArticle
from app.models.support_policies import SupportPolicy
from app.routers.guide import (
    TOPICS,
    TOPIC_CONTENT,
    get_current_version,
)


# 주제별로 우선 검색할 법령 조문
ARTICLE_NUMBERS = {
    "minimum-wage": ("6",),
    "wage-payment": ("43", "36", "48"),
    "national-pension": (),
    "weekly-holiday": ("55", "18"),
    "overtime": ("56", "50", "53"),
    "annual-leave": ("60", "61"),
    "income-tax": (),
    "tax-deduction": (),
    "health-insurance": (),
    "employment-insurance": (),
    "unemployment-benefit": (),
}


# 사용자가 입력할 수 있는 다양한 표현
ALIASES = {
    "minimum-wage": (
        "최저임금",
        "최저시급",
        "최저 시급",
    ),
    "wage-payment": (
        "임금체불",
        "월급날",
        "월급 안",
        "급여 지급",
        "퇴직금 정산",
        "임금 지급",
        "급여명세서",
    ),
    "national-pension": (
        "국민연금",
        "연금보험료",
    ),
    "weekly-holiday": (
        "주휴수당",
        "주휴일",
        "유급휴일",
        "주 15시간",
        "개근",
    ),
    "overtime": (
        "연장수당",
        "야간수당",
        "휴일수당",
        "연장근로",
        "야간근로",
        "휴일근로",
        "초과근무",
        "야근수당",
    ),
    "annual-leave": (
        "연차",
        "유급휴가",
        "휴가수당",
    ),
    "income-tax": (
        "근로소득세",
        "원천징수",
        "연말정산",
        "소득세",
    ),
    "tax-deduction": (
        "소득공제",
        "세액공제",
        "공제 항목",
        "연말정산",
    ),
    "health-insurance": (
        "건강보험",
        "건보료",
        "건강보험료",
    ),
    "employment-insurance": (
        "고용보험",
        "피보험자격",
    ),
    "unemployment-benefit": (
        "실업급여",
        "구직급여",
        "수급자격",
        "권고사직",
    ),
}


STOPWORDS = {
    "알려줘",
    "알려주세요",
    "어떻게",
    "무엇",
    "뭐야",
    "인가요",
    "있나요",
    "되나요",
    "받을",
    "제가",
    "저는",
    "관련",
    "대한",
    "조건",
    "신청",
    "지원",
    "제도",
    "정책",
    "궁금",
    "얼마",
    "금액",
    "기준",
    "방법",
    "경우",
}


def keywords(question: str) -> list[str]:
    """
    사용자 질문에서 정책 검색에 사용할 키워드를 추출합니다.
    """

    tokens = re.findall(
        r"[가-힣A-Za-z0-9]{2,}",
        question
    )

    return list(
        dict.fromkeys(
            token
            for token in tokens
            if token not in STOPWORDS
            and not token.isdigit()
        )
    )[:8]


def find_topics(question: str) -> list[tuple]:
    """
    질문과 관련된 MOA 가이드 주제를 최대 2개 검색합니다.
    """

    q = re.sub(
        r"\s+",
        "",
        question.casefold()
    )

    scored = []

    for topic in TOPICS:
        slug = topic[0]

        score = sum(
            3 if len(alias) >= 4 else 2
            for alias in ALIASES.get(slug, ())
            if re.sub(
                r"\s+",
                "",
                alias.casefold()
            ) in q
        )

        if score:
            scored.append((score, topic))

    scored.sort(
        key=lambda item: -item[0]
    )

    return [
        topic
        for _, topic in scored[:2]
    ]


def retrieve_context(
    db: Session,
    question: str
) -> tuple[str, list[dict]]:
    """
    MOA 가이드, 법령, 정부지원 정책을 검색합니다.

    Returns:
        context: AI에게 전달할 참고 자료
        sources: 사용자에게 표시할 출처 목록
    """

    parts: list[str] = []
    sources: list[dict] = []

    # ----------------------------------
    # 1. 금융 가이드 검색
    # ----------------------------------

    topics = find_topics(question)

    for topic in topics:

        slug, title, _, _, law_name, terms = topic

        content = TOPIC_CONTENT.get(slug)

        if content:

            section_text = "\n".join(
                f"{section['title']}: {section['body']}"
                for section in content["sections"]
            )

            parts.append(
                f"[MOA 가이드: {title}]\n"
                f"요약: {content['summary']}\n"
                f"{section_text[:4200]}"
            )

            sources.append({
                "type": "guide",
                "title": title,
                "id": f"topic-{slug}",
                "url": None
            })

        # ----------------------------------
        # 2. 관련 법령 검색
        # ----------------------------------

        law = db.scalar(
            select(Law).where(
                Law.law_name == law_name
            )
        )

        if not law:
            continue

        version = get_current_version(
            db,
            law.id
        )

        if not version:
            continue

        numbers = ARTICLE_NUMBERS.get(
            slug,
            ()
        )

        if numbers:

            stmt = select(LawArticle).where(
                LawArticle.law_version_id == version.id,
                LawArticle.article_no.in_(numbers)
            )

        else:

            stmt = select(LawArticle).where(
                LawArticle.law_version_id == version.id,
                or_(
                    *(
                        LawArticle.heading.ilike(
                            f"%{term}%"
                        )
                        for term in terms
                    )
                )
            )

        articles = db.scalars(
            stmt.limit(4)
        ).all()

        for article in articles:

            if not article.official_text:
                continue

            parts.append(
                f"[법령: {law_name} "
                f"제{article.article_no}조 / "
                f"시행일 {version.effective_from}]\n"
                f"{article.official_text[:4500]}"
            )

            official_url = law.official_url

            if not (
                official_url
                and official_url.startswith(
                    ("https://", "http://")
                )
            ):
                official_url = None

            sources.append({
                "type": "law",
                "title": (
                    f"{law_name} "
                    f"제{article.article_no}조"
                ),
                "id": str(article.id),
                "url": official_url
            })

    # ----------------------------------
    # 3. 정부지원 정책 검색
    # ----------------------------------

    policy_intent = any(
        word in question
        for word in (
            "지원금",
            "지원사업",
            "정부지원",
            "청년정책",
            "지원 정책",
            "장려금",
            "지원제도",
            "지원 제도",
            "정책 추천",
            "정책 찾아",
        )
    )

    if policy_intent:

        words = [
            word
            for word in keywords(question)
            if len(word) >= 2
            and word not in {
                "정부",
                "청년",
                "사업",
            }
        ]

        if words:

            filters = or_(
                *(
                    or_(
                        SupportPolicy.title.ilike(
                            f"%{word}%"
                        ),
                        SupportPolicy.summary.ilike(
                            f"%{word}%"
                        ),
                        SupportPolicy.eligibility_text.ilike(
                            f"%{word}%"
                        ),
                    )
                    for word in words[:5]
                )
            )

            stmt = (
                select(SupportPolicy)
                .where(filters)
                .order_by(
                    SupportPolicy.id.desc()
                )
                .limit(5)
            )

            policies = db.scalars(
                stmt
            ).all()

            for policy in policies:

                detail = "\n".join(
                    f"{label}: {str(value)[:850]}"
                    for label, value in (
                        (
                            "요약",
                            policy.summary
                        ),
                        (
                            "지원내용",
                            policy.support_description
                        ),
                        (
                            "지원대상",
                            policy.eligibility_text
                        ),
                        (
                            "소득조건",
                            policy.income_condition_text
                        ),
                        (
                            "제외대상",
                            policy.exclusion_text
                        ),
                        (
                            "신청기간",
                            policy.application_period_text
                        ),
                        (
                            "신청방법",
                            policy.application_method
                        ),
                    )
                    if value
                )

                parts.append(
                    f"[MOA 정부지원 정책: "
                    f"{policy.title}]\n"
                    f"{detail[:3000]}\n"
                    f"자료갱신일: "
                    f"{policy.source_updated_at}"
                )

                url = (
                    policy.reference_url
                    or policy.application_url
                )

                if not (
                    url
                    and url.startswith(
                        ("https://", "http://")
                    )
                ):
                    url = None

                sources.append({
                    "type": "policy",
                    "title": policy.title,
                    "id": f"policy-{policy.id}",
                    "url": url
                })

    # ----------------------------------
    # 4. AI에게 전달할 데이터 반환
    # ----------------------------------

    context = "\n\n".join(parts)

    return context[:19000], sources