
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice?: number;
  store?: string;
  url?: string;
  checked: boolean;
}

export interface StoreConfig {
  id: string;
  name: string;
  url: string;
}

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  lastPaidDate?: string; 
  lastTransactionId?: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minPayment: number;
  dayOfMonth: number;
  lastPaymentDate?: string;
}

export interface IncomeReminder {
  id: string;
  description: string;
  dayOfMonth: number;
  lastRegisteredDate?: string;
}

export interface Budget {
  id: string; 
  year: number;
  month: number;
  estimatedIncome: number;
  allocations: { [category: string]: number };
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'FIXED_EXPENSES' | 'DEBTS' | 'BUDGET' | 'ADVISOR' | 'SHOPPING_LIST';

export const EXPENSE_CATEGORIES = [
  'Diezmo/Ofrenda',
  'Vivienda',
  'Servicios',
  'Alimentación',
  'Transporte',
  'Deudas',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Seguros',
  'Ropa',
  'Ahorro',
  'Varios'
];

export const INCOME_CATEGORIES = ['Salario', 'Negocio', 'Regalo', 'Otros'];
