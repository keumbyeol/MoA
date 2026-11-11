
from datetime import date, time, datetime, timedelta
from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


WorkMode = Literal["FIXED", "FLEXIBLE"]
WorkplaceSize = Literal["UNDER_5", "AT_LEAST_5"]


class WorkShift(BaseModel):
    work_date: date
    start_time: time
    end_time: time

    break_minutes: int = Field(
        default=0, ge=0, le=1440
    )

    is_scheduled: bool = True
    attended: bool = True
    is_holiday: bool = False

    night_break_minutes: int | None = Field(
        default=None, ge=0, le=1440
    )

    @model_validator(mode="after")
    def validate_shift(self):
        start = datetime.combine(
            self.work_date, self.start_time
        )
        end = datetime.combine(
            self.work_date, self.end_time
        )

        if end <= start:
            end += timedelta(days=1)

        duration = int(
            (end - start).total_seconds() / 60
        )

        if self.break_minutes >= duration:
            raise ValueError(
                "휴게시간은 근무시간보다 짧아야 합니다."
            )

        if (
            self.night_break_minutes is not None
            and self.night_break_minutes > self.break_minutes
        ):
            raise ValueError(
                "야간 휴게시간은 전체 휴게시간을 "
                "초과할 수 없습니다."
            )

        return self


class WageDeductionOptions(BaseModel):
    # 사용자 선택에 따라 공제 항목 적용
    national_pension: bool = True
    health_insurance: bool = True
    long_term_care: bool = True
    employment_insurance: bool = True
    income_tax: bool = True
    local_income_tax: bool = True

    # 본인을 포함한 공제대상 가족 수
    dependents: int = Field(
        default=1, ge=1, le=20
    )

    # 8~20세 자녀 수
    children_8_to_20: int = Field(
        default=0, ge=0, le=20
    )

    # 비과세 월급여
    non_taxable_monthly_pay: int = Field(
        default=0, ge=0
    )

    @model_validator(mode="after")
    def validate_family(self):
        if self.children_8_to_20 > self.dependents - 1:
            raise ValueError(
                "자녀 수는 본인을 제외한 "
                "공제대상 가족 수를 초과할 수 없습니다."
            )
        return self


class WageCalculateRequest(BaseModel):
    employment_type: Literal["HOURLY"] = "HOURLY"
    work_mode: WorkMode = "FIXED"

    hourly_wage: int = Field(
        gt=0, description="시급 (원)"
    )

    workplace_employee_count: WorkplaceSize = (
        "AT_LEAST_5"
    )

    include_weekly_holiday_pay: bool = True

    # 고정 근무
    daily_work_hours: float | None = Field(
        default=None,
        gt=0,
        le=24,
    )

    weekly_work_days: int | None = Field(
        default=None,
        ge=1,
        le=7,
    )

    weekly_work_hours: float | None = Field(
        default=None,
        gt=0,
        le=40,
    )

    weekly_overtime_hours: float = Field(
        default=0,
        ge=0,
        le=52,
    )

    weekly_night_hours: float = Field(
        default=0,
        ge=0,
        le=168,
    )

    weekly_holiday_work_hours: float = Field(
        default=0,
        ge=0,
        le=168,
    )

    attendance_completed: bool = True

    # 유동 근무
    target_year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
    )

    target_month: int | None = Field(
        default=None,
        ge=1,
        le=12,
    )

    shifts: list[WorkShift] = Field(
        default_factory=list,
        max_length=31,
    )

    reference_date: date | None = None

    # 신규: 세금 및 보험 공제 설정
    deductions: WageDeductionOptions = Field(
        default_factory=WageDeductionOptions
    )

    @model_validator(mode="after")
    def validate_work_mode(self):
        if self.work_mode == "FIXED":
            if self.weekly_work_days is None:
                raise ValueError(
                    "고정 근무는 주 근무일수가 필요합니다."
                )

            if (
                self.daily_work_hours is None
                and self.weekly_work_hours is None
            ):
                raise ValueError(
                    "일 근무시간 또는 주 근무시간을 "
                    "입력해야 합니다."
                )

            if self.daily_work_hours is not None:
                weekly = (
                    self.daily_work_hours
                    * self.weekly_work_days
                )

                if weekly > 40:
                    raise ValueError(
                        "주 소정근로시간은 "
                        "40시간을 초과할 수 없습니다."
                    )

                if (
                    self.weekly_work_hours is not None
                    and abs(
                        self.weekly_work_hours - weekly
                    ) > 0.001
                ):
                    raise ValueError(
                        "일 근무시간과 주 근무시간이 "
                        "일치하지 않습니다."
                    )
            else:
                weekly = self.weekly_work_hours or 0

            if weekly + self.weekly_overtime_hours > 52:
                raise ValueError(
                    "주 소정근로시간과 연장근로시간의 "
                    "합은 52시간을 초과할 수 없습니다."
                )

        else:
            if (
                self.target_year is None
                or self.target_month is None
            ):
                raise ValueError(
                    "유동 근무는 계산할 연도와 월이 "
                    "필요합니다."
                )

            dates = [
                shift.work_date
                for shift in self.shifts
            ]

            if len(dates) != len(set(dates)):
                raise ValueError(
                    "같은 날짜의 근무 기록은 "
                    "한 번만 등록할 수 있습니다."
                )

            for shift in self.shifts:
                if (
                    shift.work_date.year != self.target_year
                    or shift.work_date.month
                    != self.target_month
                ):
                    raise ValueError(
                        "근무 날짜는 선택한 월에 "
                        "속해야 합니다."
                    )

            if self.reference_date is not None:
                if (
                    self.reference_date.year != self.target_year
                    or self.reference_date.month
                    != self.target_month
                ):
                    raise ValueError(
                        "주급 기준일은 선택한 월에 "
                        "속해야 합니다."
                    )

        return self


class WageBreakdown(BaseModel):
    base_pay: int
    weekly_holiday_pay: int
    overtime_pay: int
    night_pay: int = 0
    holiday_work_pay: int = 0
    total_pay: int


class WageDeductionBreakdown(BaseModel):
    national_pension: int = 0
    health_insurance: int = 0
    long_term_care: int = 0
    employment_insurance: int = 0
    income_tax: int = 0
    local_income_tax: int = 0

    total_deductions: int = 0
    gross_pay: int = 0
    net_pay: int = 0

    taxable_pay: int = 0
    estimated: bool = True


class WageCalculateResponse(BaseModel):
    employment_type: str
    work_mode: WorkMode
    hourly_wage: int

    weekly: WageBreakdown
    monthly: WageBreakdown

    weekly_holiday_eligible: bool
    overtime_premium_applied: bool
    monthly_week_multiplier: float

    total_work_hours: float = 0
    total_work_days: int = 0

    target_year: int | None = None
    target_month: int | None = None

    reference_week_start: date | None = None
    reference_week_end: date | None = None

    # 신규: 예상 공제 및 실수령액
    deductions: WageDeductionBreakdown | None = None
    net_monthly_pay: int | None = None

    notes: list[str]
    disclaimer: str


class WageRecordResponse(BaseModel):
    id: int
    user_id: int

    target_year: int
    target_month: int

    work_mode: WorkMode
    hourly_wage: int
    total_pay: int

    request_data: dict[str, Any]
    result_data: dict[str, Any]

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
