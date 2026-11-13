
import json

import requests

from app.core.config import settings


def print_response(name: str, response: requests.Response):
    print(f"\n===== {name} =====")
    print("상태 코드:", response.status_code)
    print("응답 형식:", response.headers.get("Content-Type"))

    try:
        data = response.json()
        print(
            json.dumps(
                data,
                ensure_ascii=False,
                indent=2,
            )[:5000]
        )
    except ValueError:
        print(response.text[:3000])


def test_law_api():
    if not settings.LAW_API_OC:
        print("LAW_API_OC가 설정되지 않았습니다.")
        return

    url = "https://www.law.go.kr/DRF/lawSearch.do"

    params = {
        "OC": settings.LAW_API_OC,
        "target": "law",
        "type": "JSON",
        "query": "근로기준법",
        "display": 3,
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=20,
        )
        print_response("국가법령정보 API", response)
    except requests.RequestException as error:
        print("국가법령정보 API 연결 실패:", error)


def test_youth_api():
    if not settings.DATA_GO_KR_API_KEY:
        print("DATA_GO_KR_API_KEY가 설정되지 않았습니다.")
        return

    url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"

    params = {
        "apiKeyNm": settings.DATA_GO_KR_API_KEY,
        "pageNum": 1,
        "pageSize": 3,
        "rtnType": "json",
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=20,
        )
        print_response("온통청년 정책 API", response)
    except requests.RequestException as error:
        print("온통청년 정책 API 연결 실패:", error)


if __name__ == "__main__":
    test_law_api()
    test_youth_api()
