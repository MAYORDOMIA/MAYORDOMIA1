import React from 'react';
import { FixedExpense, Debt, IncomeReminder } from '../types';

interface RemindersProps {
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  incomeReminders: IncomeReminder[];
  onAction: (view: 'FIXED_EXPENSES' | 'DEBTS' | 'TRANSACTIONS') => void;
}

export const Reminders: React.FC<RemindersProps> = ({ fixedExpenses, debts, incomeReminders, onAction }) => {
  const today = new Date();
  const currentDay = today.getDate();

  const isPaidThisMonth = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const pendingFixed = fixedExpenses.filter(f => !isPaidThisMonth(f.lastPaidDate));
  const pendingDebts = debts.filter(d => d.currentBalance > 0 && !isPaidThisMonth(d.lastPaymentDate));
  
  // Show income reminders if today is within +/- 1 day of the scheduled day
  const activeIncomeReminders = incomeReminders.filter(r => {
    const diff = Math.abs(r.dayOfMonth - currentDay);
    // Also check if they already registered income today or very recently this month
    return diff <= 1 && !isPaidThisMonth(r.lastRegisteredDate);
  });

  const alerts = [
    ...activeIncomeReminders.map(r => ({
      id: `i-${r.id}`,
      type: 'INCOME' as const,
      title: `Registrar: ${r.description}`,
      day: r.dayOfMonth,
      amount: 0,
      isOverdue: false,
      isUrgent: true,
      icon: (
        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    })),
    ...pendingFixed.map(f => ({
      id: `f-${f.id}`,
      type: 'FIXED' as const,
      title: f.description,
      day: f.dayOfMonth,
      amount: f.amount,
      isOverdue: f.dayOfMonth < currentDay,
      isUrgent: f.dayOfMonth >= currentDay && f.dayOfMonth <= currentDay + 3,
      icon: null
    })),
    ...pendingDebts.map(d => ({
      id: `d-${d.id}`,
      type: 'DEBT' as const,
      title: `Deuda: ${d.name}`,
      day: d.dayOfMonth,
      amount: d.minPayment || (d.currentBalance * 0.05),
      isOverdue: d.dayOfMonth < currentDay,
      isUrgent: d.dayOfMonth >= currentDay && d.dayOfMonth <= currentDay + 3,
      icon: null
    }))
  ];

  // If there's an income reminder, prioritize it
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.type === 'INCOME') return -1;
    if (b.type === 'INCOME') return 1;
    return a.day - b.day;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800">Pendientes de Mayordomía</h3>
        </div>
        {activeIncomeReminders.length > 0 && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            ¡Día de Bendición!
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
        {sortedAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${alert.type === 'INCOME' ? 'bg-emerald-50/30' : ''}`}
            onClick={() => onAction(alert.type === 'INCOME' ? 'TRANSACTIONS' : (alert.type === 'FIXED' ? 'FIXED_EXPENSES' : 'DEBTS'))}
          >
            <div className="flex items-center gap-3">
              {alert.icon || (
                <div className={`w-2 h-2 rounded-full ${alert.isOverdue ? 'bg-rose-500 animate-pulse' : alert.isUrgent ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                <p className={`text-xs ${alert.isOverdue ? 'text-rose-600 font-bold' : (alert.type === 'INCOME' ? 'text-emerald-600 font-medium' : 'text-slate-500')}`}>
                  {alert.type === 'INCOME' 
                    ? '"El obrero es digno de su salario"' 
                    : (alert.isOverdue ? 'Vencido' : 'Vence') + ` el día ${alert.day}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {alert.type !== 'INCOME' ? (
                <p className="text-sm font-bold text-slate-700">${alert.amount.toLocaleString()}</p>
              ) : (
                <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Registrar</div>
              )}
              {alert.type !== 'INCOME' && (
                <span className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Pagar</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};