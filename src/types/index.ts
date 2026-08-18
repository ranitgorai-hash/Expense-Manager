// ---------------------------------------------------------------------------
// Expense Manager — shared type definitions
// ---------------------------------------------------------------------------

export type AppMode = 'single' | 'group';

export type ConfirmationStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export interface Friend {
  id: string;
  name: string;
  email?: string;
  active: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex
  isDefault: boolean;
  createdAt: number;
}

export interface QuickExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  createdAt: number;
}

/**
 * paidBy / paidFor semantics (Group Mode only):
 *  - paidBy: 'user' | friendId
 *  - paidFor: 'user' | friendId
 *  Rules enforced in the UI layer (see ManualExpenseForm):
 *    - if a friend paid, paidFor defaults to 'user' and is not editable
 *    - if the user paid, paidFor is chosen ('user' or a friendId)
 */
export interface Expense {
  id: string;
  mode: AppMode;
  name: string;
  amount: number;
  categoryId: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  notes?: string;

  // Group Mode only
  paidBy?: 'user' | string; // 'user' or friendId
  paidFor?: 'user' | string; // 'user' or friendId
  confirmationStatus?: ConfirmationStatus;
  notificationId?: string; // link to notifications row once synced

  // Single Mode only
  tagIds?: string[];
  receiptImageId?: string; // key into receiptImages store
  reimbursed?: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface Settlement {
  id: string;
  friendId: string;
  amount: number; // positive = friend paid user, negative = user paid friend (convention documented in utils)
  note?: string;
  date: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string | 'overall';
  monthlyLimit: number;
  month?: string; // 'YYYY-MM'; omitted if recurring/no-expiry
  recurring: boolean;
  rollover: boolean;
  createdAt: number;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'custom-days';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  frequency: RecurringFrequency;
  customDays?: number; // used when frequency === 'custom-days'
  nextDueDate: string; // ISO date
  autoLog: boolean;
  active: boolean;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon: string;
  color: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface ReceiptImage {
  id: string;
  expenseId: string;
  blob: Blob;
  createdAt: number;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  accounts: { name: string; balance: number }[];
  createdAt: number;
}

export type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
export type ViewFilter = 'combined' | 'single' | 'group';

export interface Settings {
  id: 'settings'; // single row
  darkMode: boolean;
  lastUsedMode: AppMode;
  tourCompletedSingle: boolean;
  tourCompletedGroup: boolean;
  driveConnected: boolean;
  driveEncrypted: boolean;
  driveFileId?: string;
  driveLastBackupAt?: number;
  streakDaysUnderBudget: number;
  streakDaysLogged: number;
  lastLogDate?: string;
  updatedAt: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Food', icon: '🍔', color: '#E8895A', isDefault: true },
  { name: 'Transport', icon: '🚌', color: '#4C9A6E', isDefault: true },
  { name: 'Shopping', icon: '🛍️', color: '#D6A44A', isDefault: true },
  { name: 'Rent', icon: '🏠', color: '#8B5E3C', isDefault: true },
  { name: 'Medical', icon: '💊', color: '#C25B5B', isDefault: true },
  { name: 'Education', icon: '📚', color: '#4A7FBF', isDefault: true },
  { name: 'Entertainment', icon: '🎬', color: '#9B6BB0', isDefault: true },
  { name: 'Bills', icon: '🧾', color: '#5A8FA0', isDefault: true },
  { name: 'Other', icon: '📦', color: '#8A8A8A', isDefault: true },
];
