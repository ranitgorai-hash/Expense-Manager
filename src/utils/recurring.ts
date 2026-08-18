import type { RecurringExpense } from '../types';
import { todayIso } from './index';

/** Compute the next due date after a given due date, based on frequency. */
export function computeNextDueDate(re: Pick<RecurringExpense, 'frequency' | 'customDays'>, fromDate: string): string {
  const d = new Date(fromDate + 'T00:00:00');
  if (re.frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (re.frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + (re.customDays ?? 30));
  }
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateIso: string): number {
  const today = new Date(todayIso() + 'T00:00:00');
  const target = new Date(dateIso + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function isOverdue(re: RecurringExpense): boolean {
  return re.active && daysUntil(re.nextDueDate) < 0;
}

export function isDueToday(re: RecurringExpense): boolean {
  return re.active && re.nextDueDate === todayIso();
}

/** Recurring items due within the next N days, sorted by due date. */
export function upcomingWithinDays(recurring: RecurringExpense[], days: number): RecurringExpense[] {
  return recurring
    .filter((r) => r.active && daysUntil(r.nextDueDate) <= days)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}

/** Total forecasted cost of active recurring expenses due within N days (each counted once per due occurrence in range). */
export function forecastCost(recurring: RecurringExpense[], days: number): number {
  let total = 0;
  for (const r of recurring) {
    if (!r.active) continue;
    let due = r.nextDueDate;
    let guard = 0;
    while (daysUntil(due) <= days && guard < 200) {
      if (daysUntil(due) >= 0) total += r.amount;
      due = computeNextDueDate(r, due);
      guard++;
    }
  }
  return Math.round(total * 100) / 100;
}
