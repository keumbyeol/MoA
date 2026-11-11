
import { apiClient } from './client'

import {
  DEFAULT_WAGE_DEDUCTIONS,
  type WageCalculateRequest,
  type WageCalculateResponse,
  type WageRecord,
  type WorkShift,
} from '../types/wage'

const BASE_URL = '/api/calculator/wage'

function normalizeShift(shift: WorkShift): WorkShift {
  return {
    work_date: shift.work_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    break_minutes: Number(shift.break_minutes),
    night_break_minutes: shift.night_break_minutes ?? null,
    is_scheduled: shift.is_scheduled,
    attended: shift.attended,
    is_holiday: shift.is_holiday,
  }
}

export function buildWagePayload(
  data: WageCalculateRequest,
): WageCalculateRequest {
  const deductions = {
    ...DEFAULT_WAGE_DEDUCTIONS,
    ...(data.deductions ?? {}),
  }

  const common = {
    employment_type: data.employment_type,
    work_mode: data.work_mode,
    hourly_wage: Number(data.hourly_wage),
    workplace_employee_count: data.workplace_employee_count,
    include_weekly_holiday_pay: data.include_weekly_holiday_pay,
    attendance_completed: data.attendance_completed,
    deductions: {
      ...deductions,
      dependents: Number(deductions.dependents),
      children_8_to_20: Number(deductions.children_8_to_20),
      non_taxable_monthly_pay: Number(
        deductions.non_taxable_monthly_pay,
      ),
    },
  }

  if (data.work_mode === 'FLEXIBLE') {
    const shifts = data.shifts
      .map(normalizeShift)
      .sort((a, b) => a.work_date.localeCompare(b.work_date))

    return {
      ...common,
      work_mode: 'FLEXIBLE',

      daily_work_hours: null,
      weekly_work_days: null,
      weekly_work_hours: null,

      weekly_overtime_hours: 0,
      weekly_night_hours: 0,
      weekly_holiday_work_hours: 0,

      target_year: data.target_year ?? null,
      target_month: data.target_month ?? null,
      reference_date:
        data.reference_date ??
        shifts[shifts.length - 1]?.work_date ??
        null,

      shifts,
    }
  }

  const dailyHours = Number(data.daily_work_hours ?? 0)
  const weeklyDays = Number(data.weekly_work_days ?? 0)

  return {
    ...common,
    work_mode: 'FIXED',

    daily_work_hours: dailyHours,
    weekly_work_days: weeklyDays,
    weekly_work_hours: dailyHours * weeklyDays,

    weekly_overtime_hours: Number(
      data.weekly_overtime_hours,
    ),
    weekly_night_hours: Number(
      data.weekly_night_hours,
    ),
    weekly_holiday_work_hours: Number(
      data.weekly_holiday_work_hours,
    ),

    target_year: null,
    target_month: null,
    reference_date: null,
    shifts: [],
  }
}

export async function calculateWage(
  data: WageCalculateRequest,
): Promise<WageCalculateResponse> {
  const response = await apiClient.post<WageCalculateResponse>(
    `${BASE_URL}/calculate`,
    buildWagePayload(data),
  )

  return response.data
}

export async function saveWageRecord(
  data: WageCalculateRequest,
): Promise<WageRecord> {
  const response = await apiClient.post<WageRecord>(
    `${BASE_URL}/records`,
    buildWagePayload(data),
  )

  return response.data
}

export async function getWageRecords(
  year?: number,
  month?: number,
): Promise<WageRecord[]> {
  const response = await apiClient.get<WageRecord[]>(
    `${BASE_URL}/records`,
    {
      params: {
        ...(year !== undefined ? { year } : {}),
        ...(month !== undefined ? { month } : {}),
      },
    },
  )

  return response.data
}

export async function getWageRecord(
  recordId: number,
): Promise<WageRecord> {
  const response = await apiClient.get<WageRecord>(
    `${BASE_URL}/records/${recordId}`,
  )

  return response.data
}

export async function deleteWageRecord(
  recordId: number,
): Promise<void> {
  await apiClient.delete(
    `${BASE_URL}/records/${recordId}`,
  )
}
