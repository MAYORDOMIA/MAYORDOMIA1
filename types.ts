
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethodType {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET'
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  user_id?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  payment_method_id?: string;
  user_id?: string;
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
  payment_method_id?: string;
  user_id?: string;
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
  user_id?: string;
}

export interface IncomeReminder {
  id: string;
  description: string;
  dayOfMonth: number;
  lastRegisteredDate?: string;
  user_id?: string;
}

export interface Budget {
  id: string; 
  year: number;
  month: number;
  estimatedIncome: number;
  allocations: { [category: string]: number };
  user_id?: string;
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'FIXED_EXPENSES' | 'DEBTS' | 'BUDGET' | 'ADVISOR' | 'SHOPPING_LIST' | 'SETTINGS';

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
