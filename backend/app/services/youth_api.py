
import time

import requests

from app.core.config import settings


YOUTH_API_URL = "https://www.youthcenter.go.kr/go/ythip/getPlcy"


def fetch_youth_policies(
    page: int = 1,
    page_size: int = 100,
    max_retries: int = 3,
) -> tuple[list[dict], int]:

    if not settings.DATA_GO_KR_API_KEY:
        raise ValueError(
            "DATA_GO_KR_API_KEY가 .env에 설정되지 않았습니다."
        )

    params = {
        "apiKeyNm": settings.DATA_GO_KR_API_KEY,
        "pageNum": page,
        "pageSize": page_size,
        "rtnType": "json",
    }

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(
                YOUTH_API_URL,
                params=params,
                timeout=30,
            )

            if response.status_code != 200:
                raise RuntimeError(
                    f"HTTP {response.status_code}"
                )

            data = response.json()

            if str(data.get("resultCode")) != "200":
                raise RuntimeError(
                    "온통청년 API 오류: "
                    f"{data.get('resultCode')}"
                )

            result = data.get("result") or {}
            policies = result.get("youthPolicyList") or []
            paging = result.get("pagging") or {}

            if not isinstance(policies, list):
                raise ValueError(
                    "청년정책 목록 형식이 올바르지 않습니다."
                )

            return (
                policies,
                int(paging.get("totCount") or 0),
            )

        except (
            requests.RequestException,
            RuntimeError,
            ValueError,
        ) as error:

            print(
                f"{page}페이지 요청 실패 "
                f"({attempt}/{max_retries}): {error}"
            )

            if attempt == max_retries:
                raise RuntimeError(
                    f"{page}페이지 수집 실패: "
                    f"{max_retries}회 시도 후 중단"
                ) from None

            time.sleep(attempt * 3)

    raise RuntimeError("API 요청 실패")
