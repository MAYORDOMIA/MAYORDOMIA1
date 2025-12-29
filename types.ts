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

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  lastPaidDate?: string; // ISO Date string to track payment month
  lastTransactionId?: string; // ID of the transaction created when marked as paid
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minPayment: number;
  dayOfMonth: number; // Added for reminders
  lastPaymentDate?: string; // Added to track if paid this month
}

export interface IncomeReminder {
  id: string;
  description: string;
  dayOfMonth: number;
  lastRegisteredDate?: string;
}

export interface Budget {
  id: string; // Format: "YYYY-MM"
  year: number;
  month: number;
  estimatedIncome: number;
  allocations: { [category: string]: number };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  tithe: number; // 10% of income logic
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'FIXED_EXPENSES' | 'DEBTS' | 'BUDGET' | 'ADVISOR';

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