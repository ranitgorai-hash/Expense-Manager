import type { Expense, Settlement, Friend, SortOrder } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // 'YYYY-MM'
}

export function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out.reverse();
}

export function sortExpenses(expenses: Expense[], order: SortOrder): Expense[] {
  const arr = [...expenses];
  switch (order) {
    case 'date-desc':
      return arr.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    case 'date-asc':
      return arr.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    case 'amount-desc':
      return arr.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return arr.sort((a, b) => a.amount - b.amount);
  }
}

export function groupByDate(expenses: Expense[]): { date: string; items: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

/**
 * Balance calculation (Group Mode).
 *
 * Convention: a positive result means the FRIEND owes the USER money.
 * A negative result means the USER owes the FRIEND money.
 *
 * Expense contribution:
 *   - paidBy === 'user' && paidFor === friendId  -> friend owes user the full amount (+amount)
 *   - paidBy === friendId && paidFor === 'user'  -> user owes friend the full amount (-amount)
 *   - anything else involving this friend is ignored for balance purposes
 *
 * Settlement contribution:
 *   - settlement.amount is added directly (positive = friend paid user, i.e. reduces what
 *     friend owes user / increases what user owes friend depending on sign convention used
 *     when the settlement was recorded — see settlementsApi.create call sites).
 */
export function calculateFriendBalance(
  friendId: string,
  expenses: Expense[],
  settlements: Settlement[]
): number {
  let balance = 0;
  for (const e of expenses) {
    if (e.mode !== 'group') continue;
    if (e.paidBy === 'user' && e.paidFor === friendId) {
      balance += e.amount;
    } else if (e.paidBy === friendId && e.paidFor === 'user') {
      balance -= e.amount;
    }
  }
  for (const s of settlements) {
    if (s.friendId === friendId) {
      balance -= s.amount; // recording a settlement reduces the outstanding balance
    }
  }
  return round2(balance);
}

export function calculateAllBalances(
  friends: Friend[],
  expenses: Expense[],
  settlements: Settlement[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of friends) {
    map.set(f.id, calculateFriendBalance(f.id, expenses, settlements));
  }
  return map;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumAmount(expenses: Expense[]): number {
  return round2(expenses.reduce((acc, e) => acc + e.amount, 0));
}

export function filterByDateRange(expenses: Expense[], from?: string, to?: string): Expense[] {
  return expenses.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
}

export function filterByCategory(expenses: Expense[], categoryId?: string): Expense[] {
  if (!categoryId) return expenses;
  return expenses.filter((e) => e.categoryId === categoryId);
}

/** Consecutive days (counting back from today) with at least one Single Mode expense logged. */
export function calculateLoggingStreak(expenses: Expense[]): number {
  const dates = new Set(expenses.filter((e) => e.mode === 'single').map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  // If nothing logged today yet, streak still counts prior consecutive days.
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Consecutive days (counting back from today) where total Single Mode spend stayed under the overall daily budget derived from monthly limit. */
export function calculateUnderBudgetStreak(
  expenses: Expense[],
  dailyLimit: number | null
): number {
  if (!dailyLimit || dailyLimit <= 0) return 0;
  const byDate = new Map<string, number>();
  for (const e of expenses) {
    if (e.mode !== 'single') continue;
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount);
  }
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // count only fully completed days
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    const spent = byDate.get(iso) ?? 0;
    if (spent > 0 && spent <= dailyLimit) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (spent === 0) {
      // no spending that day still counts as "under budget"
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 365) break; // safety guard
  }
  return streak;
}

export function searchExpenses(expenses: Expense[], query: string): Expense[] {
  if (!query.trim()) return expenses;
  const q = query.toLowerCase();
  return expenses.filter(
    (e) => e.name.toLowerCase().includes(q) || (e.notes ?? '').toLowerCase().includes(q)
  );
}
