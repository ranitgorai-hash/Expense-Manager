import { useCallback, useEffect, useState } from 'react';
import type { Budget, RecurringExpense, SavingsGoal, Tag, NetWorthSnapshot } from '../types';
import {
  budgetsApi,
  recurringExpensesApi,
  savingsGoalsApi,
  tagsApi,
  netWorthApi,
  onDbChange,
  expensesApi,
} from '../db';
import { computeNextDueDate, isDueToday } from '../utils/recurring';

export function useBudgetData() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [netWorthSnapshots, setNetWorthSnapshots] = useState<NetWorthSnapshot[]>([]);

  const refresh = useCallback(async () => {
    const [b, r, g, t, n] = await Promise.all([
      budgetsApi.getAll(),
      recurringExpensesApi.getAll(),
      savingsGoalsApi.getAll(),
      tagsApi.getAll(),
      netWorthApi.getAll(),
    ]);
    setBudgets(b);
    setRecurringExpenses(r);
    setSavingsGoals(g);
    setTags(t);
    setNetWorthSnapshots(n);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = onDbChange(() => refresh());
    return unsub;
  }, [refresh]);

  // Auto-log recurring expenses whose autoLog flag is set and are due today,
  // then roll their nextDueDate forward. Runs once per mount (i.e. once per app open).
  useEffect(() => {
    (async () => {
      const all = await recurringExpensesApi.getAll();
      for (const re of all) {
        if (re.autoLog && isDueToday(re)) {
          await expensesApi.create({
            mode: 'single',
            name: re.name,
            amount: re.amount,
            categoryId: re.categoryId,
            date: re.nextDueDate,
            time: '09:00',
            notes: 'Auto-logged recurring expense',
          });
          await recurringExpensesApi.update({ ...re, nextDueDate: computeNextDueDate(re, re.nextDueDate) });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { budgets, recurringExpenses, savingsGoals, tags, netWorthSnapshots, refresh };
}
