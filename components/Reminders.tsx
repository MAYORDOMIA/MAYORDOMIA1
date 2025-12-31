
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
  
  const activeIncomeReminders = incomeReminders.filter(r => {
    const diff = Math.abs(r.dayOfMonth - currentDay);
    return diff <= 1 && !isPaidThisMonth(r.lastRegisteredDate);
  });

  const alerts = [
    ...activeIncomeReminders.map(r => ({
      id: `i-${r.id}`,
      type: 'INCOME' as const,
      title: `COBRO: ${r.description}`,
      day: r.dayOfMonth,
      amount: 0,
      isOverdue: false,
      isUrgent: true,
      statusLabel: 'RECIBIDO'
    })),
    ...pendingFixed.map(f => ({
      id: `f-${f.id}`,
      type: 'FIXED' as const,
      title: f.description,
      day: f.dayOfMonth,
      amount: f.amount || 0,
      isOverdue: f.dayOfMonth < currentDay,
      isUrgent: f.dayOfMonth >= currentDay && f.dayOfMonth <= currentDay + 3,
      statusLabel: 'GASTO'
    })),
    ...pendingDebts.map(d => ({
      id: `d-${d.id}`,
      type: 'DEBT' as const,
      title: `DEUDA: ${d.name}`,
      day: d.dayOfMonth,
      amount: d.minPayment || ((d.currentBalance || 0) * 0.05),
      isOverdue: d.dayOfMonth < currentDay,
      isUrgent: d.dayOfMonth >= currentDay && d.dayOfMonth <= currentDay + 3,
      statusLabel: 'PAGO'
    }))
  ];

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.type === 'INCOME') return -1;
    if (b.type === 'INCOME') return 1;
    return a.day - b.day;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pendientes por pagar</h3>
        {activeIncomeReminders.length > 0 && (
          <span className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter">INGRESOS PRÓXIMOS</span>
        )}
      </div>
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {sortedAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${alert.type === 'INCOME' ? 'bg-emerald-50/20' : ''}`}
            onClick={() => onAction(alert.type === 'INCOME' ? 'TRANSACTIONS' : (alert.type === 'FIXED' ? 'FIXED_EXPENSES' : 'DEBTS'))}
          >
            <div className="flex items-center gap-5">
              <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl ${alert.type === 'INCOME' ? 'bg-emerald-600 text-white' : alert.isOverdue ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {alert.statusLabel}
              </span>
              <div>
                <p className="text-base font-bold text-slate-800 leading-tight">{alert.title}</p>
                <p className={`text-xs font-black uppercase tracking-widest mt-1.5 ${alert.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                  VENCE EL DÍA {alert.day}
                </p>
              </div>
            </div>
            <div className="text-right">
              {alert.type !== 'INCOME' ? (
                <p className="text-lg font-black text-slate-900 tracking-tight">
                  ${(alert.amount || 0).toLocaleString()}
                </p>
              ) : (
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">PENDIENTE</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
