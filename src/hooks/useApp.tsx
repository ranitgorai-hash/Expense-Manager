import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Friend, Category, QuickExpense, Expense, Settlement, Settings, AppMode, ViewFilter } from '../types';
import {
  ensureSeeded,
  friendsApi,
  categoriesApi,
  quickExpensesApi,
  expensesApi,
  settlementsApi,
  settingsApi,
  onDbChange,
} from '../db';

interface AppContextValue {
  loading: boolean;
  mode: AppMode;
  setMode: (m: AppMode) => Promise<void>;
  viewFilter: ViewFilter;
  setViewFilter: (v: ViewFilter) => void;

  friends: Friend[];
  categories: Category[];
  quickExpenses: QuickExpense[];
  expenses: Expense[];
  settlements: Settlement[];
  settings: Settings | null;

  visibleExpenses: Expense[]; // expenses filtered by viewFilter

  refreshAll: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [mode, setModeState] = useState<AppMode>('group');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('combined');

  const [friends, setFriends] = useState<Friend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quickExpenses, setQuickExpenses] = useState<QuickExpense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const refreshAll = useCallback(async () => {
    const [f, c, qe, e, s, st] = await Promise.all([
      friendsApi.getAll(),
      categoriesApi.getAll(),
      quickExpensesApi.getAll(),
      expensesApi.getAll(),
      settlementsApi.getAll(),
      settingsApi.get(),
    ]);
    setFriends(f);
    setCategories(c);
    setQuickExpenses(qe);
    setExpenses(e);
    setSettlements(s);
    setSettings(st);
    setModeState(st.lastUsedMode);
    setViewFilter(st.lastUsedMode === 'single' ? 'single' : 'group');
  }, []);

  useEffect(() => {
    (async () => {
      await ensureSeeded();
      await refreshAll();
      setLoading(false);
    })();
  }, [refreshAll]);

  useEffect(() => {
    const unsub = onDbChange(() => {
      refreshAll();
    });
    return unsub;
  }, [refreshAll]);

  const setMode = useCallback(
    async (m: AppMode) => {
      setModeState(m);
      setViewFilter(m === 'single' ? 'single' : 'group');
      await settingsApi.update({ lastUsedMode: m });
    },
    []
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await settingsApi.update(patch);
    setSettings(next);
  }, []);

  const visibleExpenses = useMemo(() => {
    if (viewFilter === 'combined') return expenses;
    return expenses.filter((e) => e.mode === viewFilter);
  }, [expenses, viewFilter]);

  const value: AppContextValue = {
    loading,
    mode,
    setMode,
    viewFilter,
    setViewFilter,
    friends,
    categories,
    quickExpenses,
    expenses,
    settlements,
    settings,
    visibleExpenses,
    refreshAll,
    updateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
