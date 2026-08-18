import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from './useApp';
import { useBudgetData } from './useBudget';
import type { AppMode } from '../types';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  path: string;
  /** Returns true once the user has performed the real action this step asks for. */
  isComplete: (ctx: TourCheckContext) => boolean;
}

interface TourCheckContext {
  friendsCount: number;
  quickExpensesCount: number;
  groupExpensesCount: number;
  singleExpensesCount: number;
  budgetsCount: number;
  singleExpensesInBudgetedCategory: boolean;
}

const GROUP_STEPS: TourStep[] = [
  {
    id: 'add-friend',
    title: 'Add a friend',
    description: 'Group Mode is for splitting expenses. Start by adding a real friend.',
    ctaLabel: 'Go to Friends',
    path: '/friends',
    isComplete: (ctx) => ctx.friendsCount > 0,
  },
  {
    id: 'quick-add-shortcut',
    title: 'Create a Quick Add shortcut',
    description:
      'Log any expense, then tick "Save as a Quick Add shortcut" so it becomes a one-tap button next time.',
    ctaLabel: 'Go to Add Expense',
    path: '/add',
    isComplete: (ctx) => ctx.quickExpensesCount > 0,
  },
  {
    id: 'split-expense',
    title: 'Record a split expense',
    description: 'Log a real expense with Paid By / Paid For set, to see the balance math work.',
    ctaLabel: 'Go to Add Expense',
    path: '/add',
    isComplete: (ctx) => ctx.groupExpensesCount > 0,
  },
];

const SINGLE_STEPS: TourStep[] = [
  {
    id: 'quick-add-shortcut',
    title: 'Create a Quick Add shortcut',
    description:
      'Log any expense, then tick "Save as a Quick Add shortcut" so it becomes a one-tap button next time.',
    ctaLabel: 'Go to Add Expense',
    path: '/add',
    isComplete: (ctx) => ctx.quickExpensesCount > 0,
  },
  {
    id: 'first-budget',
    title: 'Set your first budget',
    description: 'Pick one category and set a monthly limit for it.',
    ctaLabel: 'Go to Budgets',
    path: '/budgets',
    isComplete: (ctx) => ctx.budgetsCount > 0,
  },
  {
    id: 'watch-budget-move',
    title: 'Log an expense in that category',
    description: 'Log a real expense in the category you just budgeted, and watch the progress bar move.',
    ctaLabel: 'Go to Add Expense',
    path: '/add',
    isComplete: (ctx) => ctx.budgetsCount > 0 && ctx.singleExpensesInBudgetedCategory,
  },
];

export function useTourState() {
  const { mode, friends, quickExpenses, expenses, settings, updateSettings } = useApp();
  const { budgets } = useBudgetData();

  const [active, setActive] = useState(false);
  const [tourMode, setTourMode] = useState<AppMode>(mode);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = tourMode === 'group' ? GROUP_STEPS : SINGLE_STEPS;
  const currentStep = steps[stepIndex];

  const ctx: TourCheckContext = useMemo(() => {
    const groupExpensesCount = expenses.filter((e) => e.mode === 'group').length;
    const singleExpenses = expenses.filter((e) => e.mode === 'single');
    const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
    return {
      friendsCount: friends.length,
      quickExpensesCount: quickExpenses.length,
      groupExpensesCount,
      singleExpensesCount: singleExpenses.length,
      budgetsCount: budgets.length,
      singleExpensesInBudgetedCategory: singleExpenses.some(
        (e) => budgetedCategoryIds.has(e.categoryId) || budgetedCategoryIds.has('overall')
      ),
    };
  }, [friends, quickExpenses, expenses, budgets]);

  // Auto-start once per mode, the first time settings finish loading.
  useEffect(() => {
    if (!settings) return;
    const completed = mode === 'group' ? settings.tourCompletedGroup : settings.tourCompletedSingle;
    if (!completed && !active) {
      setTourMode(mode);
      setStepIndex(0);
      setActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.tourCompletedGroup, settings?.tourCompletedSingle, mode]);

  const finish = useCallback(async () => {
    setActive(false);
    await updateSettings(
      tourMode === 'group' ? { tourCompletedGroup: true } : { tourCompletedSingle: true }
    );
  }, [tourMode, updateSettings]);

  // Auto-advance when the current step's real-world condition is satisfied.
  useEffect(() => {
    if (!active || !currentStep) return;
    if (currentStep.isComplete(ctx)) {
      if (stepIndex < steps.length - 1) {
        const t = setTimeout(() => setStepIndex((i) => i + 1), 900);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => finish(), 1200);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, currentStep, ctx, stepIndex, steps.length, finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const start = useCallback((m: AppMode) => {
    setTourMode(m);
    setStepIndex(0);
    setActive(true);
  }, []);

  return {
    active,
    tourMode,
    steps,
    stepIndex,
    currentStep,
    stepComplete: currentStep ? currentStep.isComplete(ctx) : false,
    skip,
    start,
  };
}

type TourContextValue = ReturnType<typeof useTourState>;

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const value = useTourState();
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
