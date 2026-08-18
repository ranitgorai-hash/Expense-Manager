import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type {
  Friend,
  Category,
  QuickExpense,
  Expense,
  Settlement,
  Budget,
  RecurringExpense,
  SavingsGoal,
  Tag,
  ReceiptImage,
  NetWorthSnapshot,
  Settings,
  AppMode,
} from '../types';
import { DEFAULT_CATEGORIES } from '../types';

const DB_NAME = 'expense-manager-db';
const DB_VERSION = 1;

interface EMSchema extends DBSchema {
  friends: { key: string; value: Friend; indexes: { active: number } };
  categories: { key: string; value: Category };
  quickExpenses: { key: string; value: QuickExpense };
  expenses: {
    key: string;
    value: Expense;
    indexes: { date: string; mode: string; categoryId: string };
  };
  settlements: { key: string; value: Settlement; indexes: { friendId: string } };
  budgets: { key: string; value: Budget; indexes: { categoryId: string } };
  recurringExpenses: { key: string; value: RecurringExpense; indexes: { nextDueDate: string } };
  savingsGoals: { key: string; value: SavingsGoal };
  tags: { key: string; value: Tag };
  receiptImages: { key: string; value: ReceiptImage; indexes: { expenseId: string } };
  netWorthSnapshots: { key: string; value: NetWorthSnapshot };
  settings: { key: string; value: Settings };
}

type StoreName =
  | 'friends'
  | 'categories'
  | 'quickExpenses'
  | 'expenses'
  | 'settlements'
  | 'budgets'
  | 'recurringExpenses'
  | 'savingsGoals'
  | 'tags'
  | 'receiptImages'
  | 'netWorthSnapshots'
  | 'settings';

let dbPromise: Promise<IDBPDatabase<EMSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<EMSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<EMSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // ---- Stage 1 (v1) stores ----
        if (!db.objectStoreNames.contains('friends')) {
          const s = db.createObjectStore('friends', { keyPath: 'id' });
          s.createIndex('active', 'active');
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('quickExpenses')) {
          db.createObjectStore('quickExpenses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          const s = db.createObjectStore('expenses', { keyPath: 'id' });
          s.createIndex('date', 'date');
          s.createIndex('mode', 'mode');
          s.createIndex('categoryId', 'categoryId');
        }
        if (!db.objectStoreNames.contains('settlements')) {
          const s = db.createObjectStore('settlements', { keyPath: 'id' });
          s.createIndex('friendId', 'friendId');
        }
        if (!db.objectStoreNames.contains('budgets')) {
          const s = db.createObjectStore('budgets', { keyPath: 'id' });
          s.createIndex('categoryId', 'categoryId');
        }
        if (!db.objectStoreNames.contains('recurringExpenses')) {
          const s = db.createObjectStore('recurringExpenses', { keyPath: 'id' });
          s.createIndex('nextDueDate', 'nextDueDate');
        }
        if (!db.objectStoreNames.contains('savingsGoals')) {
          db.createObjectStore('savingsGoals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('receiptImages')) {
          const s = db.createObjectStore('receiptImages', { keyPath: 'id' });
          s.createIndex('expenseId', 'expenseId');
        }
        if (!db.objectStoreNames.contains('netWorthSnapshots')) {
          db.createObjectStore('netWorthSnapshots', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        // Future migrations: bump DB_VERSION and add `if (oldVersion < N)` blocks here.
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Change notification — every write fires this so the (future) sync layer,
// dashboards, etc. can subscribe without polling.
// ---------------------------------------------------------------------------
type ChangeListener = (store: StoreName) => void;
const listeners = new Set<ChangeListener>();

export function onDbChange(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(store: StoreName) {
  listeners.forEach((l) => l(store));
}

function genId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Generic CRUD helpers
// ---------------------------------------------------------------------------
async function getAll<K extends StoreName>(store: K): Promise<EMSchema[K]['value'][]> {
  const db = await getDb();
  return db.getAll(store);
}

async function put<K extends StoreName>(store: K, value: EMSchema[K]['value']): Promise<void> {
  const db = await getDb();
  await db.put(store, value);
  notify(store);
}

async function remove<K extends StoreName>(store: K, key: string): Promise<void> {
  const db = await getDb();
  await db.delete(store, key);
  notify(store);
}

// ---------------------------------------------------------------------------
// Bootstrap: seed default categories + settings row on first run
// ---------------------------------------------------------------------------
export async function ensureSeeded(): Promise<void> {
  const db = await getDb();
  const existingCats = await db.getAll('categories');
  if (existingCats.length === 0) {
    const tx = db.transaction('categories', 'readwrite');
    for (const c of DEFAULT_CATEGORIES) {
      await tx.store.put({ ...c, id: genId(), createdAt: Date.now() });
    }
    await tx.done;
  }
  const existingSettings = await db.get('settings', 'settings');
  if (!existingSettings) {
    const settings: Settings = {
      id: 'settings',
      darkMode: false,
      lastUsedMode: 'group',
      tourCompletedSingle: false,
      tourCompletedGroup: false,
      driveConnected: false,
      driveEncrypted: false,
      streakDaysUnderBudget: 0,
      streakDaysLogged: 0,
      updatedAt: Date.now(),
    };
    await db.put('settings', settings);
  }
}

// ---------------------------------------------------------------------------
// Friends (Group Mode)
// ---------------------------------------------------------------------------
export const friendsApi = {
  getAll: () => getAll('friends'),
  create: async (name: string, email?: string) => {
    const friend: Friend = { id: genId(), name, email, active: true, createdAt: Date.now() };
    await put('friends', friend);
    return friend;
  },
  update: (friend: Friend) => put('friends', friend),
  setActive: async (id: string, active: boolean) => {
    const db = await getDb();
    const f = await db.get('friends', id);
    if (f) await put('friends', { ...f, active });
  },
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categoriesApi = {
  getAll: () => getAll('categories'),
  create: async (name: string, icon: string, color: string) => {
    const cat: Category = { id: genId(), name, icon, color, isDefault: false, createdAt: Date.now() };
    await put('categories', cat);
    return cat;
  },
  update: (cat: Category) => put('categories', cat),
  delete: (id: string) => remove('categories', id),
};

// ---------------------------------------------------------------------------
// Quick Expenses
// ---------------------------------------------------------------------------
export const quickExpensesApi = {
  getAll: () => getAll('quickExpenses'),
  create: async (name: string, amount: number, categoryId: string) => {
    const qe: QuickExpense = { id: genId(), name, amount, categoryId, createdAt: Date.now() };
    await put('quickExpenses', qe);
    return qe;
  },
  delete: (id: string) => remove('quickExpenses', id),
};

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export const expensesApi = {
  getAll: () => getAll('expenses'),
  getByMode: async (mode: AppMode | 'combined') => {
    const all = await getAll('expenses');
    if (mode === 'combined') return all;
    return all.filter((e) => e.mode === mode);
  },
  create: async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const expense: Expense = { ...data, id: genId(), createdAt: now, updatedAt: now };
    await put('expenses', expense);
    return expense;
  },
  update: async (expense: Expense) => {
    await put('expenses', { ...expense, updatedAt: Date.now() });
  },
  delete: (id: string) => remove('expenses', id),
};

// ---------------------------------------------------------------------------
// Settlements (Group Mode)
// ---------------------------------------------------------------------------
export const settlementsApi = {
  getAll: () => getAll('settlements'),
  create: async (friendId: string, amount: number, note?: string, date?: string) => {
    const s: Settlement = {
      id: genId(),
      friendId,
      amount,
      note,
      date: date ?? new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    };
    await put('settlements', s);
    return s;
  },
  delete: (id: string) => remove('settlements', id),
};

// ---------------------------------------------------------------------------
// Budgets (Single Mode)
// ---------------------------------------------------------------------------
export const budgetsApi = {
  getAll: () => getAll('budgets'),
  create: async (data: Omit<Budget, 'id' | 'createdAt'>) => {
    const budget: Budget = { ...data, id: genId(), createdAt: Date.now() };
    await put('budgets', budget);
    return budget;
  },
  update: (budget: Budget) => put('budgets', budget),
  delete: (id: string) => remove('budgets', id),
};

// ---------------------------------------------------------------------------
// Recurring Expenses (Single Mode)
// ---------------------------------------------------------------------------
export const recurringExpensesApi = {
  getAll: () => getAll('recurringExpenses'),
  create: async (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const re: RecurringExpense = { ...data, id: genId(), createdAt: Date.now() };
    await put('recurringExpenses', re);
    return re;
  },
  update: (re: RecurringExpense) => put('recurringExpenses', re),
  delete: (id: string) => remove('recurringExpenses', id),
};

// ---------------------------------------------------------------------------
// Savings Goals (Single Mode)
// ---------------------------------------------------------------------------
export const savingsGoalsApi = {
  getAll: () => getAll('savingsGoals'),
  create: async (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const goal: SavingsGoal = { ...data, id: genId(), createdAt: Date.now() };
    await put('savingsGoals', goal);
    return goal;
  },
  update: (goal: SavingsGoal) => put('savingsGoals', goal),
  delete: (id: string) => remove('savingsGoals', id),
};

// ---------------------------------------------------------------------------
// Tags (Single Mode)
// ---------------------------------------------------------------------------
export const tagsApi = {
  getAll: () => getAll('tags'),
  create: async (name: string, color: string) => {
    const tag: Tag = { id: genId(), name, color, createdAt: Date.now() };
    await put('tags', tag);
    return tag;
  },
  delete: (id: string) => remove('tags', id),
};

// ---------------------------------------------------------------------------
// Receipt Images (Single Mode) — stored as blobs, never uploaded unless the
// user explicitly includes them in an encrypted Drive backup (Stage 6).
// ---------------------------------------------------------------------------
export const receiptImagesApi = {
  getByExpense: async (expenseId: string): Promise<ReceiptImage | undefined> => {
    const db = await getDb();
    const all = await db.getAllFromIndex('receiptImages', 'expenseId', expenseId);
    return all[0];
  },
  save: async (expenseId: string, blob: Blob) => {
    const img: ReceiptImage = { id: genId(), expenseId, blob, createdAt: Date.now() };
    await put('receiptImages', img);
    return img;
  },
  delete: (id: string) => remove('receiptImages', id),
};

// ---------------------------------------------------------------------------
// Net Worth Snapshots (Single Mode, optional)
// ---------------------------------------------------------------------------
export const netWorthApi = {
  getAll: () => getAll('netWorthSnapshots'),
  create: async (date: string, accounts: { name: string; balance: number }[]) => {
    const snap: NetWorthSnapshot = { id: genId(), date, accounts, createdAt: Date.now() };
    await put('netWorthSnapshots', snap);
    return snap;
  },
  delete: (id: string) => remove('netWorthSnapshots', id),
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const settingsApi = {
  get: async (): Promise<Settings> => {
    const db = await getDb();
    const s = await db.get('settings', 'settings');
    if (s) return s;
    await ensureSeeded();
    return (await db.get('settings', 'settings'))!;
  },
  update: async (patch: Partial<Settings>) => {
    const db = await getDb();
    const current = await db.get('settings', 'settings');
    const next: Settings = { ...(current as Settings), ...patch, id: 'settings', updatedAt: Date.now() };
    await db.put('settings', next);
    notify('settings');
    return next;
  },
};

// ---------------------------------------------------------------------------
// Full export / import (local JSON backup) — covers both modes
// ---------------------------------------------------------------------------
export interface FullExport {
  version: number;
  exportedAt: number;
  friends: Friend[];
  categories: Category[];
  quickExpenses: QuickExpense[];
  expenses: Expense[];
  settlements: Settlement[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  tags: Tag[];
  netWorthSnapshots: NetWorthSnapshot[];
  settings: Settings;
}

export async function exportAll(): Promise<FullExport> {
  const [
    friends,
    categories,
    quickExpenses,
    expenses,
    settlements,
    budgets,
    recurringExpenses,
    savingsGoals,
    tags,
    netWorthSnapshots,
    settings,
  ] = await Promise.all([
    getAll('friends'),
    getAll('categories'),
    getAll('quickExpenses'),
    getAll('expenses'),
    getAll('settlements'),
    getAll('budgets'),
    getAll('recurringExpenses'),
    getAll('savingsGoals'),
    getAll('tags'),
    getAll('netWorthSnapshots'),
    settingsApi.get(),
  ]);
  return {
    version: DB_VERSION,
    exportedAt: Date.now(),
    friends,
    categories,
    quickExpenses,
    expenses,
    settlements,
    budgets,
    recurringExpenses,
    savingsGoals,
    tags,
    netWorthSnapshots,
    settings,
  };
}

export async function importAll(data: FullExport): Promise<void> {
  const db = await getDb();
  const stores: StoreName[] = [
    'friends',
    'categories',
    'quickExpenses',
    'expenses',
    'settlements',
    'budgets',
    'recurringExpenses',
    'savingsGoals',
    'tags',
    'netWorthSnapshots',
  ];
  for (const store of stores) {
    const rows = (data as any)[store] as any[] | undefined;
    if (!rows) continue;
    const tx = db.transaction(store, 'readwrite');
    for (const row of rows) await tx.store.put(row);
    await tx.done;
    notify(store);
  }
  if (data.settings) {
    await db.put('settings', data.settings);
    notify('settings');
  }
}

export { getDb };
