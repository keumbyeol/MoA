
export type EmploymentType = 'HOURLY'

export type WorkMode = 'FIXED' | 'FLEXIBLE'

export type WorkplaceSize = 'UNDER_5' | 'AT_LEAST_5'

export interface WorkShift {
  work_date: string
  start_time: string
  end_time: string
  break_minutes: number
  night_break_minutes?: number | null
  is_scheduled: boolean
  attended: boolean
  is_holiday: boolean
}

export interface WageDeductionOptions {
  national_pension: boolean
  health_insurance: boolean
  long_term_care: boolean
  employment_insurance: boolean
  income_tax: boolean
  local_income_tax: boolean

  dependents: number
  children_8_to_20: number
  non_taxable_monthly_pay: number
}

export interface WageDeductionBreakdown {
  national_pension: number
  health_insurance: number
  long_term_care: number
  employment_insurance: number
  income_tax: number
  local_income_tax: number

  total_deductions: number
  gross_pay: number
  net_pay: number
  taxable_pay: number
  estimated: boolean
}

export interface WageCalculateRequest {
  employment_type: EmploymentType
  work_mode: WorkMode
  hourly_wage: number
  workplace_employee_count: WorkplaceSize

  include_weekly_holiday_pay: boolean
  attendance_completed: boolean

  daily_work_hours?: number | null
  weekly_work_days?: number | null
  weekly_work_hours?: number | null

  weekly_overtime_hours: number
  weekly_night_hours: number
  weekly_holiday_work_hours: number

  target_year?: number | null
  target_month?: number | null
  reference_date?: string | null
  shifts: WorkShift[]

  deductions?: WageDeductionOptions
}

export interface WageBreakdown {
  base_pay: number
  weekly_holiday_pay: number
  overtime_pay: number
  night_pay: number
  holiday_work_pay: number
  total_pay: number
}

export interface WageCalculateResponse {
  employment_type: string
  work_mode: WorkMode
  hourly_wage: number

  weekly: WageBreakdown
  monthly: WageBreakdown

  weekly_holiday_eligible: boolean
  overtime_premium_applied: boolean
  monthly_week_multiplier: number

  total_work_hours: number
  total_work_days: number

  target_year: number | null
  target_month: number | null

  reference_week_start: string | null
  reference_week_end: string | null

  deductions?: WageDeductionBreakdown | null
  net_monthly_pay?: number | null

  notes: string[]
  disclaimer: string
}

export interface WageRecord {
  id: number
  user_id: number
  target_year: number
  target_month: number
  work_mode: WorkMode
  hourly_wage: number
  total_pay: number
  request_data: WageCalculateRequest
  result_data: WageCalculateResponse
  created_at: string
}

export const DEFAULT_WAGE_DEDUCTIONS: WageDeductionOptions = {
  national_pension: true,
  health_insurance: true,
  long_term_care: true,
  employment_insurance: true,
  income_tax: true,
  local_income_tax: true,
  dependents: 1,
  children_8_to_20: 0,
  non_taxable_monthly_pay: 0,
}

const today = new Date()

export const DEFAULT_WAGE_VALUES: WageCalculateRequest = {
  employment_type: 'HOURLY',
  work_mode: 'FIXED',
  hourly_wage: 10320,
  workplace_employee_count: 'AT_LEAST_5',

  include_weekly_holiday_pay: true,
  attendance_completed: true,

  daily_work_hours: 4,
  weekly_work_days: 5,
  weekly_work_hours: null,

  weekly_overtime_hours: 0,
  weekly_night_hours: 0,
  weekly_holiday_work_hours: 0,

  target_year: today.getFullYear(),
  target_month: today.getMonth() + 1,
  reference_date: null,
  shifts: [],

  deductions: { ...DEFAULT_WAGE_DEDUCTIONS },
}
