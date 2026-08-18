import * as XLSX from 'xlsx';
import type { Expense, Category, Friend, Settlement, Budget, SavingsGoal } from '../types';
import { calculateFriendBalance } from './index';

function catName(categories: Category[], id: string) {
  if (id === 'overall') return 'Overall';
  return categories.find((c) => c.id === id)?.name ?? 'Other';
}

export function exportToExcel(
  expenses: Expense[],
  categories: Category[],
  friends: Friend[],
  settlements: Settlement[],
  budgets: Budget[] = [],
  savingsGoals: SavingsGoal[] = []
) {
  const wb = XLSX.utils.book_new();

  // All-history sheet
  const allRows = expenses
    .slice()
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .map((e) => ({
      Date: e.date,
      Time: e.time,
      Name: e.name,
      Amount: e.amount,
      Category: catName(categories, e.categoryId),
      Mode: e.mode,
      'Paid By': e.paidBy === 'user' ? 'You' : friends.find((f) => f.id === e.paidBy)?.name ?? e.paidBy ?? '',
      'Paid For': e.paidFor === 'user' ? 'You' : friends.find((f) => f.id === e.paidFor)?.name ?? e.paidFor ?? '',
      Tags: (e.tagIds ?? []).join(', '),
      Notes: e.notes ?? '',
    }));
  const allSheet = XLSX.utils.json_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, allSheet, 'All History');

  // Personal expenses sheet (Single Mode)
  const personalRows = expenses
    .filter((e) => e.mode === 'single')
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .map((e) => ({
      Date: e.date,
      Time: e.time,
      Name: e.name,
      Amount: e.amount,
      Category: catName(categories, e.categoryId),
      Mode: e.mode,
      Tags: (e.tagIds ?? []).join(', '),
      Notes: e.notes ?? '',
    }));
  const personalSheet = XLSX.utils.json_to_sheet(personalRows);
  XLSX.utils.book_append_sheet(wb, personalSheet, 'Personal Expenses');

  // One sheet per active friend with running balance
  for (const f of friends) {
    const friendExpenses = expenses
      .filter((e) => e.mode === 'group' && (e.paidBy === f.id || e.paidFor === f.id))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    let running = 0;
    const rows: any[] = [];
    for (const e of friendExpenses) {
      if (e.paidBy === 'user' && e.paidFor === f.id) running += e.amount;
      else if (e.paidBy === f.id && e.paidFor === 'user') running -= e.amount;
      rows.push({
        Date: e.date,
        Name: e.name,
        Amount: e.amount,
        Category: catName(categories, e.categoryId),
        Mode: e.mode,
        Direction: e.paidBy === 'user' ? 'You paid' : `${f.name} paid`,
        'Running Balance': running,
      });
    }
    const finalBalance = calculateFriendBalance(f.id, expenses, settlements);
    rows.push({ Date: '', Name: 'FINAL BALANCE (after settlements)', Amount: '', Category: '', Mode: '', Direction: '', 'Running Balance': finalBalance });

    const sheetName = f.name.slice(0, 28).replace(/[\\/?*[\]:]/g, ''); // Excel sheet name limits
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, sheetName || 'Friend');
  }

  // Budgets sheet (only when Single Mode data is present)
  const hasSingleData = expenses.some((e) => e.mode === 'single');
  if (hasSingleData && budgets.length > 0) {
    const budgetRows = budgets.map((b) => ({
      Category: catName(categories, b.categoryId),
      'Monthly Limit': b.monthlyLimit,
      Recurring: b.recurring ? 'Yes' : 'No',
      Rollover: b.rollover ? 'Yes' : 'No',
      Month: b.month ?? '',
      Mode: 'single',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetRows), 'Budgets');
  }

  // Savings Goals sheet (only when Single Mode data is present)
  if (hasSingleData && savingsGoals.length > 0) {
    const goalRows = savingsGoals.map((g) => ({
      Goal: g.name,
      'Target Amount': g.targetAmount,
      'Current Amount': g.currentAmount,
      'Progress %': g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      'Target Date': g.targetDate ?? '',
      Category: '',
      Mode: 'single',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalRows), 'Savings Goals');
  }

  XLSX.writeFile(wb, `expense-manager-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
