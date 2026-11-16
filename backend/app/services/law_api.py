
import requests

from app.core.config import settings


LAW_SEARCH_URL = "https://www.law.go.kr/DRF/lawSearch.do"
LAW_DETAIL_URL = "https://www.law.go.kr/DRF/lawService.do"


def request_law_api(url: str, params: dict) -> dict:
    if not settings.LAW_API_OC:
        raise ValueError("LAW_API_OC가 .env에 설정되지 않았습니다.")

    response = requests.get(
        url,
        params={
            "OC": settings.LAW_API_OC,
            **params,
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"국가법령정보센터 HTTP {response.status_code}"
        )

    # 점검 페이지나 오류 페이지가 HTML로 반환되는 경우 확인
    content = response.text.lstrip()

    if content.startswith("<"):
        raise RuntimeError(
            "API가 JSON 대신 HTML/XML을 반환했습니다. "
            "서버 점검 또는 요청 오류 가능성이 있습니다."
        )

    try:
        data = response.json()
    except ValueError:
        raise RuntimeError(
            "법령 API 응답을 JSON으로 변환할 수 없습니다."
        ) from None

    if not isinstance(data, dict):
        raise RuntimeError("예상하지 못한 법령 API 응답 형식입니다.")

    return data


def search_laws(keyword: str) -> dict:
    return request_law_api(
        LAW_SEARCH_URL,
        {
            "target": "law",
            "type": "JSON",
            "query": keyword,
            "display": 20,
            "page": 1,
        },
    )



def fetch_law_detail(law_serial_number: str) -> dict:
    return request_law_api(
        LAW_DETAIL_URL,
        {
            "target": "law",
            "type": "JSON",
            "ID": law_serial_number,
        },
    )
