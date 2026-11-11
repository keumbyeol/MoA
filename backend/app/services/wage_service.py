
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.schemas.wage import (
    WageBreakdown,
    WageCalculateRequest,
    WageCalculateResponse,
    WageDeductionBreakdown,
    WorkShift,
)


MONTHLY_WEEKS = Decimal(365) / Decimal(7) / Decimal(12)

PENSION_RATE = Decimal("0.0475")
HEALTH_RATE = Decimal("0.03595")
LONG_TERM_CARE_RATIO = (
    Decimal("0.009448") / Decimal("0.0719")
)
EMPLOYMENT_RATE = Decimal("0.009")

DISCLAIMER = (
    "본 계산 결과는 2026년 기준 일반적인 근무 및 "
    "공제 조건을 적용한 참고용 예상 금액입니다. "
    "실제 급여와 실수령액은 근로계약, 근무기간, "
    "보험 가입 여부, 기준소득, 비과세 항목, "
    "부양가족 수 및 관계 법령에 따라 달라질 수 있습니다. "
    "소득세는 국세청 간이세액표가 아닌 임시 추정치입니다."
)


def dec(value: int | float | str) -> Decimal:
    return Decimal(str(value))


def round_won(value: Decimal) -> int:
    return int(
        value.quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )


def empty_amounts() -> dict[str, Decimal]:
    return {
        "base_pay": Decimal(0),
        "weekly_holiday_pay": Decimal(0),
        "overtime_pay": Decimal(0),
        "night_pay": Decimal(0),
        "holiday_work_pay": Decimal(0),
    }


def add_amounts(
    target: dict[str, Decimal],
    source: dict[str, Decimal],
) -> None:
    for key in target:
        target[key] += source[key]


def make_breakdown(
    amounts: dict[str, Decimal],
) -> WageBreakdown:
    rounded = {
        key: round_won(value)
        for key, value in amounts.items()
    }

    return WageBreakdown(
        **rounded,
        total_pay=sum(rounded.values()),
    )


def monday_of(day: date) -> date:
    return day - timedelta(days=day.weekday())


def shift_datetimes(
    shift: WorkShift,
) -> tuple[datetime, datetime]:
    start = datetime.combine(
        shift.work_date,
        shift.start_time,
    )

    end = datetime.combine(
        shift.work_date,
        shift.end_time,
    )

    if end <= start:
        end += timedelta(days=1)

    return start, end


def shift_hours(shift: WorkShift) -> Decimal:
    if not shift.attended:
        return Decimal(0)

    start, end = shift_datetimes(shift)

    minutes = (
        (end - start).total_seconds() / 60
        - shift.break_minutes
    )

    return dec(minutes) / Decimal(60)


def night_hours(
    shift: WorkShift,
) -> Decimal | None:
    if not shift.attended:
        return Decimal(0)

    if (
        shift.break_minutes > 0
        and shift.night_break_minutes is None
    ):
        return None

    start, end = shift_datetimes(shift)
    night_minutes = Decimal(0)

    for offset in range(-1, 2):
        current = (
            shift.work_date
            + timedelta(days=offset)
        )

        window_start = datetime.combine(
            current,
            datetime.min.time(),
        ) + timedelta(hours=22)

        window_end = (
            window_start + timedelta(hours=8)
        )

        overlap_start = max(start, window_start)
        overlap_end = min(end, window_end)

        if overlap_end > overlap_start:
            night_minutes += dec(
                (overlap_end - overlap_start)
                .total_seconds() / 60
            )

    night_minutes -= dec(
        shift.night_break_minutes or 0
    )

    return max(
        night_minutes, Decimal(0)
    ) / Decimal(60)


# =====================================================
# 예상 세금 및 4대보험 공제
# =====================================================

def estimate_income_tax(
    taxable_pay: int,
    dependents: int,
    children: int,
) -> int:
    """
    임시 소득세 추정 모델.

    국세청 근로소득 간이세액표와 동일하지 않음.
    부양가족 수와 자녀 수는 간단한 보정에만 사용.

    정식 간이세액표 연동 시 이 함수 교체.
    """
    if taxable_pay <= 0:
        return 0

    # 실제 법정 면세 기준이 아닌 임시 추정 기준
    if taxable_pay <= 1060000:
        return 0

    excess = taxable_pay - 1060000

    # 시연용 근사 계산
    estimated = dec(excess) * Decimal("0.03")

    # 가족 수에 따른 임시 보정
    additional_dependents = max(
        dependents - 1, 0
    )

    estimated -= (
        dec(additional_dependents)
        * Decimal("3000")
    )

    estimated -= (
        dec(children) * Decimal("5000")
    )

    return max(
        round_won(estimated),
        0,
    )


def calculate_deductions(
    data: WageCalculateRequest,
    gross_monthly_pay: int,
) -> WageDeductionBreakdown:
    options = data.deductions

    gross = max(gross_monthly_pay, 0)

    taxable = max(
        gross - options.non_taxable_monthly_pay,
        0,
    )

    # 단순 추정: 비과세액 차감 후 금액을
    # 보험료 계산 기준으로도 사용.
    # 실제 보험별 산정 기준은 서로 다를 수 있음.
    insurance_base = dec(taxable)

    pension = (
        round_won(
            insurance_base * PENSION_RATE
        )
        if options.national_pension
        else 0
    )

    health = (
        round_won(
            insurance_base * HEALTH_RATE
        )
        if options.health_insurance
        else 0
    )

    long_term = (
        round_won(
            dec(health) * LONG_TERM_CARE_RATIO
        )
        if (
            options.long_term_care
            and options.health_insurance
        )
        else 0
    )

    employment = (
        round_won(
            insurance_base * EMPLOYMENT_RATE
        )
        if options.employment_insurance
        else 0
    )

    income_tax = (
        estimate_income_tax(
            taxable_pay=taxable,
            dependents=options.dependents,
            children=options.children_8_to_20,
        )
        if options.income_tax
        else 0
    )

    local_tax = (
        round_won(
            dec(income_tax) * Decimal("0.1")
        )
        if (
            options.local_income_tax
            and options.income_tax
        )
        else 0
    )

    total = (
        pension
        + health
        + long_term
        + employment
        + income_tax
        + local_tax
    )

    return WageDeductionBreakdown(
        national_pension=pension,
        health_insurance=health,
        long_term_care=long_term,
        employment_insurance=employment,
        income_tax=income_tax,
        local_income_tax=local_tax,
        total_deductions=total,
        gross_pay=gross,
        net_pay=max(gross - total, 0),
        taxable_pay=taxable,
        estimated=True,
    )


def attach_deductions(
    data: WageCalculateRequest,
    result: WageCalculateResponse,
) -> WageCalculateResponse:
    deduction_result = calculate_deductions(
        data=data,
        gross_monthly_pay=result.monthly.total_pay,
    )

    result.deductions = deduction_result
    result.net_monthly_pay = deduction_result.net_pay

    result.notes.append(
        "예상 공제액은 선택한 항목에 2026년 "
        "일반 보험요율을 적용한 단순 추정입니다."
    )

    result.notes.append(
        "국민연금·건강보험·고용보험 가입 대상 여부와 "
        "보험료 산정 기준은 실제 근로 조건에 따라 "
        "달라질 수 있습니다."
    )

    result.notes.append(
        "소득세는 국세청 간이세액표를 아직 "
        "연동하지 않은 임시 추정 금액입니다. "
        "정확한 원천징수세액으로 사용하면 안 됩니다."
    )

    result.disclaimer = DISCLAIMER

    return result


# =====================================================
# 고정 근무 계산
# =====================================================

def calculate_fixed(
    data: WageCalculateRequest,
) -> WageCalculateResponse:
    wage = dec(data.hourly_wage)

    if data.daily_work_hours is not None:
        weekly_hours = (
            dec(data.daily_work_hours)
            * dec(data.weekly_work_days or 0)
        )
    else:
        weekly_hours = dec(
            data.weekly_work_hours or 0
        )

    overtime_hours = dec(
        data.weekly_overtime_hours
    )
    night = dec(data.weekly_night_hours)
    holiday = dec(
        data.weekly_holiday_work_hours
    )

    at_least_five = (
        data.workplace_employee_count
        == "AT_LEAST_5"
    )

    eligible = (
        weekly_hours >= Decimal(15)
        and data.attendance_completed
    )

    weekly = empty_amounts()

    weekly["base_pay"] = (
        wage * weekly_hours
    )

    if (
        data.include_weekly_holiday_pay
        and eligible
    ):
        holiday_hours = (
            min(weekly_hours, Decimal(40))
            / Decimal(40)
            * Decimal(8)
        )

        weekly["weekly_holiday_pay"] = (
            wage * holiday_hours
        )

    overtime_rate = (
        Decimal("1.5")
        if at_least_five
        else Decimal("1")
    )

    weekly["overtime_pay"] = (
        wage * overtime_hours * overtime_rate
    )

    if at_least_five:
        weekly["night_pay"] = (
            wage * night * Decimal("0.5")
        )

        weekly["holiday_work_pay"] = (
            wage * holiday * Decimal("0.5")
        )

    monthly = {
        key: amount * MONTHLY_WEEKS
        for key, amount in weekly.items()
    }

    notes = [
        "고정 근무의 월급은 평균 월 환산 주수를 "
        "적용한 예상 금액입니다.",
        "연장근로시간은 소정근로시간과 별도로 "
        "입력한 시간입니다.",
        "야간 및 휴일근로시간은 이미 기본급에 "
        "포함된 근무시간이라고 가정했습니다.",
        "고정 근무의 휴일근로 가산은 입력 시간에 "
        "50%를 적용한 단순 추정입니다. "
        "휴일 8시간 초과 등은 실제 근무일별 "
        "계산이 필요합니다.",
    ]

    if not data.include_weekly_holiday_pay:
        notes.append(
            "사용자 선택에 따라 주휴수당을 "
            "제외했습니다."
        )
    elif not eligible:
        notes.append(
            "주휴수당 계산 조건을 충족하지 않아 "
            "주휴수당을 제외했습니다."
        )

    if not at_least_five:
        notes.append(
            "5인 미만 사업장으로 입력되어 "
            "연장·야간·휴일 가산을 적용하지 않았습니다."
        )

    return WageCalculateResponse(
        employment_type=data.employment_type,
        work_mode="FIXED",
        hourly_wage=data.hourly_wage,
        weekly=make_breakdown(weekly),
        monthly=make_breakdown(monthly),
        weekly_holiday_eligible=eligible,
        overtime_premium_applied=at_least_five,
        monthly_week_multiplier=round(
            float(MONTHLY_WEEKS), 6
        ),
        total_work_hours=float(
            (weekly_hours + overtime_hours)
            * MONTHLY_WEEKS
        ),
        total_work_days=0,
        notes=notes,
        disclaimer=DISCLAIMER,
    )


# =====================================================
# 유동 근무 계산
# =====================================================

def calculate_flexible(
    data: WageCalculateRequest,
) -> WageCalculateResponse:
    wage = dec(data.hourly_wage)

    at_least_five = (
        data.workplace_employee_count
        == "AT_LEAST_5"
    )

    shifts = sorted(
        data.shifts,
        key=lambda item: item.work_date,
    )

    monthly = empty_amounts()

    weekly_groups: dict[
        date, list[WorkShift]
    ] = defaultdict(list)

    total_hours = Decimal(0)
    total_days = 0
    missing_night_break = False

    for shift in shifts:
        week_start = monday_of(
            shift.work_date
        )
        weekly_groups[week_start].append(
            shift
        )

    week_amounts: dict[
        date, dict[str, Decimal]
    ] = {}

    week_eligible: dict[
        date, bool
    ] = {}

    for week_start, week_shifts in (
        weekly_groups.items()
    ):
        amounts = empty_amounts()

        regular_hours = Decimal(0)
        scheduled_hours = Decimal(0)

        scheduled_shifts = [
            shift
            for shift in week_shifts
            if shift.is_scheduled
        ]

        all_attended = (
            len(scheduled_shifts) > 0
            and all(
                shift.attended
                for shift in scheduled_shifts
            )
        )

        for shift in week_shifts:
            hours = shift_hours(shift)

            if shift.is_scheduled:
                start, end = shift_datetimes(
                    shift
                )

                planned_minutes = (
                    (end - start)
                    .total_seconds() / 60
                    - shift.break_minutes
                )

                scheduled_hours += (
                    dec(planned_minutes)
                    / Decimal(60)
                )

            if not shift.attended:
                continue

            total_days += 1
            total_hours += hours

            amounts["base_pay"] += (
                wage * hours
            )

            if at_least_five:
                daily_overtime = max(
                    hours - Decimal(8),
                    Decimal(0),
                )

                daily_regular = (
                    hours - daily_overtime
                )

                remaining_weekly_regular = max(
                    Decimal(40) - regular_hours,
                    Decimal(0),
                )

                weekly_excess = max(
                    daily_regular
                    - remaining_weekly_regular,
                    Decimal(0),
                )

                regular_hours += (
                    daily_regular
                )

                overtime = (
                    daily_overtime
                    + weekly_excess
                )

                if not shift.is_holiday:
                    amounts["overtime_pay"] += (
                        wage
                        * overtime
                        * Decimal("0.5")
                    )

                night = night_hours(shift)

                if night is None:
                    missing_night_break = True
                else:
                    amounts["night_pay"] += (
                        wage
                        * night
                        * Decimal("0.5")
                    )

                if shift.is_holiday:
                    first_eight = min(
                        hours, Decimal(8)
                    )

                    excess_eight = max(
                        hours - Decimal(8),
                        Decimal(0),
                    )

                    amounts["holiday_work_pay"] += (
                        wage
                        * (
                            first_eight
                            * Decimal("0.5")
                            + excess_eight
                            * Decimal("1")
                        )
                    )

        eligible = (
            scheduled_hours >= Decimal(15)
            and all_attended
        )

        week_eligible[week_start] = (
            eligible
        )

        week_end = (
            week_start + timedelta(days=6)
        )

        full_week_in_month = (
            week_start.month
            == data.target_month
            and week_start.year
            == data.target_year
            and week_end.month
            == data.target_month
            and week_end.year
            == data.target_year
        )

        if (
            data.include_weekly_holiday_pay
            and eligible
            and full_week_in_month
        ):
            holiday_hours = (
                min(
                    scheduled_hours,
                    Decimal(40),
                )
                / Decimal(40)
                * Decimal(8)
            )

            amounts["weekly_holiday_pay"] = (
                wage * holiday_hours
            )

        week_amounts[week_start] = (
            amounts
        )

        add_amounts(
            monthly, amounts
        )

    if data.reference_date is not None:
        reference_date = (
            data.reference_date
        )
    elif shifts:
        reference_date = (
            shifts[-1].work_date
        )
    else:
        reference_date = date(
            data.target_year,
            data.target_month,
            1,
        )

    reference_start = monday_of(
        reference_date
    )

    reference_end = (
        reference_start
        + timedelta(days=6)
    )

    weekly = week_amounts.get(
        reference_start,
        empty_amounts(),
    )

    notes = [
        "월급은 선택한 월에 등록된 실제 근무 "
        "기록을 합산했습니다.",
        "주급은 기준일이 속한 월요일~일요일의 "
        "등록 기록을 기준으로 표시합니다.",
        "기본급에는 실제 유급 근무시간 전체를 "
        "포함했습니다.",
        "연장·야간·휴일근로수당에는 기본급과 "
        "중복되지 않도록 가산분만 표시했습니다.",
        "소정근로일은 is_scheduled, 출근 여부는 "
        "attended 값을 기준으로 판단합니다.",
    ]

    if missing_night_break:
        notes.append(
            "휴게시간 중 야간 휴게시간이 입력되지 "
            "않은 근무 기록은 야간 가산액에서 "
            "제외했습니다. night_break_minutes를 "
            "입력하면 계산할 수 있습니다."
        )

    notes.append(
        "월 경계에 걸친 주는 전월·익월 기록이 "
        "없으므로 해당 주의 주휴수당을 "
        "자동 합산하지 않았습니다."
    )

    notes.append(
        "주휴수당은 등록된 소정근로일 및 개근 "
        "여부를 이용한 추정치입니다. "
        "주휴일 배치, 계약상 소정근로시간, "
        "단시간근로자 적용 기준에 따라 "
        "실제 금액이 달라질 수 있습니다."
    )

    if not at_least_five:
        notes.append(
            "5인 미만 사업장으로 입력되어 "
            "연장·야간·휴일 가산을 적용하지 않았습니다."
        )

    if not data.include_weekly_holiday_pay:
        notes.append(
            "사용자 선택에 따라 주휴수당을 "
            "제외했습니다."
        )

    return WageCalculateResponse(
        employment_type=data.employment_type,
        work_mode="FLEXIBLE",
        hourly_wage=data.hourly_wage,
        weekly=make_breakdown(weekly),
        monthly=make_breakdown(monthly),
        weekly_holiday_eligible=(
            week_eligible.get(
                reference_start,
                False,
            )
        ),
        overtime_premium_applied=at_least_five,
        monthly_week_multiplier=round(
            float(MONTHLY_WEEKS), 6
        ),
        total_work_hours=float(total_hours),
        total_work_days=total_days,
        target_year=data.target_year,
        target_month=data.target_month,
        reference_week_start=reference_start,
        reference_week_end=reference_end,
        notes=notes,
        disclaimer=DISCLAIMER,
    )


# =====================================================
# 계산 API 진입점
# =====================================================

def calculate_wage(
    data: WageCalculateRequest,
) -> WageCalculateResponse:
    if data.work_mode == "FLEXIBLE":
        result = calculate_flexible(data)
    else:
        result = calculate_fixed(data)

    return attach_deductions(
        data=data,
        result=result,
    )


# =====================================================
# 월별 급여 기록 저장 / 조회 / 삭제
# =====================================================

def save_wage_record(
    db: Session,
    user_id: int,
    data: WageCalculateRequest,
):
    from app.models.user import WageRecord

    result = calculate_wage(data)
    today = date.today()

    if data.work_mode == "FLEXIBLE":
        year = data.target_year
        month = data.target_month
    else:
        year = today.year
        month = today.month

    record = WageRecord(
        user_id=user_id,
        target_year=year,
        target_month=month,
        work_mode=data.work_mode,
        hourly_wage=data.hourly_wage,
        total_pay=result.monthly.total_pay,
        request_data=data.model_dump(
            mode="json"
        ),
        result_data=result.model_dump(
            mode="json"
        ),
    )

    db.add(record)

    try:
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        raise

    return record


def list_wage_records(
    db: Session,
    user_id: int,
    year: int | None = None,
    month: int | None = None,
):
    from app.models.user import WageRecord

    stmt = select(WageRecord).where(
        WageRecord.user_id == user_id
    )

    if year is not None:
        stmt = stmt.where(
            WageRecord.target_year == year
        )

    if month is not None:
        stmt = stmt.where(
            WageRecord.target_month == month
        )

    stmt = stmt.order_by(
        WageRecord.target_year.desc(),
        WageRecord.target_month.desc(),
        WageRecord.created_at.desc(),
        WageRecord.id.desc(),
    )

    return list(
        db.scalars(stmt).all()
    )


def get_wage_record(
    db: Session,
    user_id: int,
    record_id: int,
):
    from app.models.user import WageRecord

    record = db.scalar(
        select(WageRecord).where(
            WageRecord.id == record_id,
            WageRecord.user_id == user_id,
        )
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="급여 기록을 찾을 수 없습니다.",
        )

    return record


def delete_wage_record(
    db: Session,
    user_id: int,
    record_id: int,
):
    record = get_wage_record(
        db=db,
        user_id=user_id,
        record_id=record_id,
    )

    try:
        db.delete(record)
        db.commit()
    except Exception:
        db.rollback()
        raise
