import type { Expense, Category, Budget } from '../types';
import { monthKey, sumAmount, todayIso, round2 } from './index';

export interface Insight {
  id: string;
  emoji: string;
  text: string;
}

function daysLeftInMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate();
}

function prevMonthKey(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function generateInsights(
  expenses: Expense[],
  categories: Category[],
  budgets: Budget[]
): Insight[] {
  const insights: Insight[] = [];
  const singleExpenses = expenses.filter((e) => e.mode === 'single');
  const thisMonth = monthKey(todayIso());
  const prevMonth = prevMonthKey();

  const thisMonthExpenses = singleExpenses.filter((e) => monthKey(e.date) === thisMonth);
  const prevMonthExpenses = singleExpenses.filter((e) => monthKey(e.date) === prevMonth);

  const catTotals = (list: Expense[]) => {
    const map = new Map<string, number>();
    for (const e of list) map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
    return map;
  };
  const thisTotals = catTotals(thisMonthExpenses);
  const prevTotals = catTotals(prevMonthExpenses);

  for (const [catId, thisTotal] of thisTotals) {
    const prevTotal = prevTotals.get(catId) ?? 0;
    if (prevTotal > 0) {
      const pctChange = Math.round(((thisTotal - prevTotal) / prevTotal) * 100);
      if (Math.abs(pctChange) >= 15) {
        const cat = categories.find((c) => c.id === catId);
        const dir = pctChange > 0 ? 'more' : 'less';
        insights.push({
          id: `mom-${catId}`,
          emoji: pctChange > 0 ? '📈' : '📉',
          text: `You spent ${Math.abs(pctChange)}% ${dir} on ${cat?.name ?? 'this category'} this month than last.`,
        });
      }
    }
  }

  const daysLeft = daysLeftInMonth();
  for (const b of budgets) {
    if (b.categoryId === 'overall') continue;
    const spent = thisTotals.get(b.categoryId) ?? 0;
    if (spent >= b.monthlyLimit) {
      const cat = categories.find((c) => c.id === b.categoryId);
      insights.push({
        id: `over-${b.id}`,
        emoji: '⚠️',
        text: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the month and you're already over budget on ${cat?.name ?? 'a category'}.`,
      });
    } else if (spent >= b.monthlyLimit * 0.8) {
      const cat = categories.find((c) => c.id === b.categoryId);
      insights.push({
        id: `near-${b.id}`,
        emoji: '🟡',
        text: `You're at ${Math.round((spent / b.monthlyLimit) * 100)}% of your ${cat?.name ?? ''} budget with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`,
      });
    }
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString().slice(0, 10);
  const thisWeek = singleExpenses.filter((e) => e.date >= weekAgoIso);
  if (thisWeek.length > 0) {
    const biggest = [...thisWeek].sort((a, b) => b.amount - a.amount)[0];
    insights.push({
      id: 'biggest-week',
      emoji: '💸',
      text: `Your biggest expense this week was ${biggest.name} (${round2(biggest.amount)}).`,
    });
  }

  const totalThis = sumAmount(thisMonthExpenses);
  const totalPrev = sumAmount(prevMonthExpenses);
  if (totalPrev > 0) {
    const pct = Math.round(((totalThis - totalPrev) / totalPrev) * 100);
    if (Math.abs(pct) >= 10) {
      insights.push({
        id: 'total-mom',
        emoji: pct > 0 ? '📊' : '✅',
        text: `Overall spending is ${Math.abs(pct)}% ${pct > 0 ? 'higher' : 'lower'} than last month so far.`,
      });
    }
  }

  return insights.slice(0, 6);
}
