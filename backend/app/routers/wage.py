
from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.wage import (
    WageCalculateRequest,
    WageCalculateResponse,
    WageRecordResponse,
)

from app.services.wage_service import (
    calculate_wage,
    save_wage_record,
    list_wage_records,
    get_wage_record,
    delete_wage_record,
)


router = APIRouter(
    prefix="/api/calculator/wage",
    tags=["임금 계산기"],
)


# 비회원도 사용 가능한 계산 API
@router.post(
    "/calculate",
    response_model=WageCalculateResponse,
    summary="예상 주급, 월급 및 세후 실수령액 계산",
)
def calculate(
    data: WageCalculateRequest,
) -> WageCalculateResponse:
    return calculate_wage(data)


# 로그인한 회원만 저장
@router.post(
    "/records",
    response_model=WageRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="월별 급여 계산 결과 저장",
)
def save_record(
    data: WageCalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return save_wage_record(
        db=db,
        user_id=current_user.id,
        data=data,
    )


# 내 월별 급여 기록 목록
@router.get(
    "/records",
    response_model=list[WageRecordResponse],
    summary="내 월별 급여 기록 목록",
)
def list_records(
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    month: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_wage_records(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month,
    )


# 저장한 급여 상세 조회
@router.get(
    "/records/{record_id}",
    response_model=WageRecordResponse,
    summary="내 급여 기록 상세 조회",
)
def record_detail(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_wage_record(
        db=db,
        user_id=current_user.id,
        record_id=record_id,
    )


# 저장한 급여 기록 삭제
@router.delete(
    "/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="내 급여 기록 삭제",
)
def remove_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_wage_record(
        db=db,
        user_id=current_user.id,
        record_id=record_id,
    )
