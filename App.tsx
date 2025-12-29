import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Transaction, Debt, ViewState, TransactionType, FixedExpense, Budget, IncomeReminder } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FixedExpenseForm } from './components/FixedExpenseForm';
import { DebtForm } from './components/DebtForm';
import { BudgetPlanner } from './components/BudgetPlanner';
import { SummaryCard } from './components/SummaryCard';
import { BiblicalAdvisor } from './components/BiblicalAdvisor';
import { Reminders } from './components/Reminders';
import { IncomeReminderForm } from './components/IncomeReminderForm';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>([]);
  
  // Modal States
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showIncomeReminderSettings, setShowIncomeReminderSettings] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const storedTrans = localStorage.getItem('mayordomia_transactions');
    const storedDebts = localStorage.getItem('mayordomia_debts');
    const storedFixed = localStorage.getItem('mayordomia_fixed_expenses');
    const storedBudgets = localStorage.getItem('mayordomia_budgets');
    const storedIncomeRem = localStorage.getItem('mayordomia_income_reminders');
    
    if (storedTrans) setTransactions(JSON.parse(storedTrans));
    if (storedDebts) setDebts(JSON.parse(storedDebts));
    if (storedFixed) setFixedExpenses(JSON.parse(storedFixed));
    if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
    if (storedIncomeRem) setIncomeReminders(JSON.parse(storedIncomeRem));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('mayordomia_transactions', JSON.stringify(transactions));
    localStorage.setItem('mayordomia_debts', JSON.stringify(debts));
    localStorage.setItem('mayordomia_fixed_expenses', JSON.stringify(fixedExpenses));
    localStorage.setItem('mayordomia_budgets', JSON.stringify(budgets));
    localStorage.setItem('mayordomia_income_reminders', JSON.stringify(incomeReminders));
  }, [transactions, debts, fixedExpenses, budgets, incomeReminders]);

  // --- Helpers ---
  const isPaidThisMonth = (lastPaidDate?: string) => {
    if (!lastPaidDate) return false;
    const paidDate = new Date(lastPaidDate);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  };

  // --- Handlers ---
  const addTransaction = (description: string, amount: number, type: TransactionType, category: string) => {
    const newTrans: Transaction = {
      id: Date.now().toString(),
      description,
      amount,
      type,
      category,
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTrans, ...prev]);

    // If it's income, check if it matches an income reminder and mark it as registered
    if (type === TransactionType.INCOME) {
      setIncomeReminders(prev => prev.map(rem => {
        // Simple heuristic: if description matches or it's just registered today, we clear the reminder for the month
        if (description.toLowerCase().includes(rem.description.toLowerCase()) || rem.dayOfMonth === new Date().getDate()) {
          return { ...rem, lastRegisteredDate: new Date().toISOString() };
        }
        return rem;
      }));
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addFixedExpense = (description: string, amount: number, category: string, dayOfMonth: number) => {
    const newFixed: FixedExpense = {
      id: Date.now().toString(),
      description,
      amount,
      category,
      dayOfMonth
    };
    setFixedExpenses(prev => [...prev, newFixed]);
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  const toggleFixedExpensePaid = (id: string) => {
    const expense = fixedExpenses.find(f => f.id === id);
    if (!expense) return;

    const currentlyPaid = isPaidThisMonth(expense.lastPaidDate);

    if (!currentlyPaid) {
      const newTransId = Date.now().toString();
      const newTransaction: Transaction = {
        id: newTransId,
        description: `Pago Fijo: ${expense.description}`,
        amount: expense.amount,
        type: TransactionType.EXPENSE,
        category: expense.category,
        date: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);
      setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, lastPaidDate: new Date().toISOString(), lastTransactionId: newTransId } : f));
    } else {
      if (expense.lastTransactionId) setTransactions(prev => prev.filter(t => t.id !== expense.lastTransactionId));
      setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, lastPaidDate: undefined, lastTransactionId: undefined } : f));
    }
  };

  const addDebt = (name: string, totalAmount: number, interestRate: number, minPayment: number, dayOfMonth: number) => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name,
      totalAmount,
      currentBalance: totalAmount,
      interestRate,
      minPayment: minPayment > 0 ? minPayment : totalAmount * 0.03,
      dayOfMonth,
      lastPaymentDate: undefined
    };
    setDebts(prev => [...prev, newDebt]);
  };

  const deleteDebt = (id: string) => {
    if(window.confirm("¿Estás seguro de eliminar esta deuda del registro?")) {
        setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const payDebt = (id: string, amount: number) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newBalance = Math.max(0, debt.currentBalance - amount);
    setDebts(prev => prev.map(d => d.id === id ? { ...d, currentBalance: newBalance, lastPaymentDate: new Date().toISOString() } : d));
    addTransaction(`Abono a Deuda: ${debt.name}`, amount, TransactionType.EXPENSE, 'Deudas');
  };

  const addIncomeReminder = (description: string, day: number) => {
    const newRem: IncomeReminder = {
      id: Date.now().toString(),
      description,
      dayOfMonth: day
    };
    setIncomeReminders(prev => [...prev, newRem]);
  };

  const removeIncomeReminder = (id: string) => {
    setIncomeReminders(prev => prev.filter(r => r.id !== id));
  };

  const saveBudget = (newBudget: Budget) => {
    setBudgets(prev => {
      const filtered = prev.filter(b => b.id !== newBudget.id);
      return [...filtered, newBudget];
    });
  };

  // --- Calculations ---
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPendingFixedMonthly = fixedExpenses
    .filter(f => !isPaidThisMonth(f.lastPaidDate))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [transactions]);

  // --- Render Components ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold text-slate-800 text-lg">Alertas y Recordatorios</h3>
        <button 
          onClick={() => setShowIncomeReminderSettings(true)}
          className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Configurar Cobros
        </button>
      </div>

      <Reminders 
        fixedExpenses={fixedExpenses} 
        debts={debts} 
        incomeReminders={incomeReminders}
        onAction={(view) => setView(view as ViewState)} 
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          title="Balance"
          amount={balance}
          colorClass={balance >= 0 ? "text-slate-800" : "text-rose-600"}
          icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <SummaryCard
          title="Fijos (Pendiente)"
          amount={totalPendingFixedMonthly}
          colorClass="text-orange-600"
          icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <SummaryCard
          title="Ingresos"
          amount={totalIncome}
          colorClass="text-emerald-600"
          icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
        />
        <SummaryCard
          title="Gastos Var."
          amount={totalExpense}
          colorClass="text-rose-600"
          icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recientes</h3>
              <button 
                onClick={() => setView('TRANSACTIONS')}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
           </div>
           <div className="space-y-4">
             {transactions.slice(0, 5).map(t => (
               <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {t.type === TransactionType.INCOME 
                        ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      }
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-800 truncate">{t.description}</p>
                      <p className="text-xs text-slate-500 truncate">{t.category} • {new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                    </div>
                 </div>
                 <span className={`font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(0)}
                 </span>
               </div>
             ))}
             {transactions.length === 0 && (
               <p className="text-center text-slate-400 py-4">No hay transacciones registradas.</p>
             )}
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
           <h3 className="text-lg font-bold text-slate-800 mb-4 w-full text-left">Distribución</h3>
           {expenseData.length > 0 ? (
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={expenseData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     fill="#8884d8"
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {expenseData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip />
                   <Legend wrapperStyle={{ fontSize: '11px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
               <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
               <p className="text-sm">Sin datos aún</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const renderFixedExpenses = () => (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-slate-800 md:hidden">Gastos Fijos</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 justify-between items-center bg-slate-50 hidden md:flex">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gastos Fijos Mensuales</h2>
          <p className="text-sm text-slate-500">Compromisos recurrentes. Se reinician cada mes.</p>
        </div>
        <button 
          onClick={() => setShowFixedExpenseForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Agregar
        </button>
      </div>
      
      <div className="md:hidden">
        {fixedExpenses.sort((a,b) => a.dayOfMonth - b.dayOfMonth).map(f => {
          const isPaid = isPaidThisMonth(f.lastPaidDate);
          return (
            <div key={f.id} className={`p-4 border-b border-slate-100 last:border-0 flex items-center justify-between transition-all duration-300 ${isPaid ? 'bg-slate-50 opacity-60' : ''}`}>
               <div className="flex items-center gap-3">
                 <button 
                    onClick={() => toggleFixedExpensePaid(f.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </button>
                 <div className={isPaid ? 'line-through text-slate-400' : ''}>
                   <p className="font-medium text-slate-800">{f.description}</p>
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase">Día {f.dayOfMonth}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{f.category}</span>
                   </div>
                 </div>
               </div>
               <div className="text-right">
                  <p className={`font-bold ${isPaid ? 'text-slate-400 line-through' : 'text-slate-800'}`}>${f.amount.toFixed(0)}</p>
                  <button onClick={() => deleteFixedExpense(f.id)} className="text-xs text-rose-500 p-1 opacity-50 hover:opacity-100">Eliminar</button>
               </div>
            </div>
          );
        })}
         {fixedExpenses.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No tienes gastos fijos.
            </div>
          )}
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4 w-16">Estado</th>
              <th className="p-4">Día de Pago</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Categoría</th>
              <th className="p-4 text-right">Monto</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fixedExpenses.sort((a,b) => a.dayOfMonth - b.dayOfMonth).map(f => {
              const isPaid = isPaidThisMonth(f.lastPaidDate);
              return (
                <tr key={f.id} className={`hover:bg-slate-50 transition-all ${isPaid ? 'bg-slate-50 opacity-50' : ''}`}>
                  <td className="p-4">
                     <button 
                      onClick={() => toggleFixedExpensePaid(f.id)}
                      className={`w-6 h-6 rounded border transition-colors flex items-center justify-center ${isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500'}`}
                      title={isPaid ? "Marcar como no pagado" : "Marcar como pagado"}
                    >
                      {isPaid && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  </td>
                  <td className={`p-4 text-slate-600 ${isPaid ? 'line-through' : ''}`}>Día {f.dayOfMonth}</td>
                  <td className={`p-4 font-medium text-slate-800 ${isPaid ? 'line-through' : ''}`}>{f.description}</td>
                  <td className="p-4">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                      {f.category}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${isPaid ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    ${f.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => deleteFixedExpense(f.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {fixedExpenses.length > 0 && (
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-100">
                 <td colSpan={4} className="p-4 text-right">Pendiente por pagar:</td>
                 <td className="p-4 text-right text-orange-600">${totalPendingFixedMonthly.toFixed(2)}</td>
                 <td></td>
              </tr>
            )}
            {fixedExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No tienes gastos fijos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-slate-800 md:hidden">Movimientos</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 justify-between items-center bg-slate-50 hidden md:flex">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Registro de Movimientos</h2>
          <p className="text-sm text-slate-500">Historial de ingresos y gastos variables.</p>
        </div>
        <button 
          onClick={() => setShowTransactionForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo
        </button>
      </div>

      <div className="md:hidden">
        {transactions.map(t => (
          <div key={t.id} className="p-4 border-b border-slate-100 last:border-0">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-slate-800 line-clamp-1">{t.description}</span>
              <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 text-xs text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded">{t.category}</span>
                <span>{new Date(t.date).toLocaleDateString()}</span>
              </div>
              <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
         {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No hay movimientos.
            </div>
          )}
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Categoría</th>
              <th className="p-4 text-right">Monto</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium text-slate-800">{t.description}</td>
                <td className="p-4">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                    {t.category}
                  </span>
                </td>
                <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No hay transacciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );

  const renderDebts = () => {
    const sortedDebts = [...debts].sort((a, b) => {
        if (a.currentBalance === 0 && b.currentBalance !== 0) return 1;
        if (a.currentBalance !== 0 && b.currentBalance === 0) return -1;
        return a.currentBalance - b.currentBalance;
    });

    const totalDebt = debts.reduce((acc, d) => acc + d.currentBalance, 0);
    const totalOriginal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
    const totalPaid = totalOriginal - totalDebt;
    const progress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

    return (
      <div className="space-y-6 pb-20 md:pb-0">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <h3 className="text-slate-500 text-sm font-medium">Deuda Total Actual</h3>
               <p className="text-3xl font-bold text-rose-600 mt-1">${totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <h3 className="text-slate-500 text-sm font-medium">Progreso Global</h3>
               <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-bold text-indigo-600">{progress.toFixed(1)}%</span>
                  <span className="text-slate-400 text-sm mb-1">libre</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white flex flex-col justify-center items-center text-center cursor-pointer hover:bg-indigo-700 transition-colors"
                 onClick={() => setShowDebtForm(true)}
            >
               <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="font-bold">Agregar Nueva Deuda</span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Tus Deudas (Ordenadas por Bola de Nieve)</h3>
              {sortedDebts.length === 0 && (
                 <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">"No debáis a nadie nada, sino el amaros unos a otros..."</p>
                    <p className="text-slate-500 font-medium mt-2">¡Eres libre de deudas!</p>
                 </div>
              )}
              {sortedDebts.map(debt => {
                 const debtProgress = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;
                 const isPaid = debt.currentBalance <= 0;
                 const isMonthlyPaid = isPaidThisMonth(debt.lastPaymentDate);

                 return (
                   <div key={debt.id} className={`bg-white p-6 rounded-xl border transition-all ${isPaid ? 'border-emerald-200 bg-emerald-50 opacity-75' : 'border-slate-100 shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-slate-800">{debt.name}</h4>
                              {isPaid && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">¡PAGADA!</span>}
                              {!isPaid && isMonthlyPaid && <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded-full">Pago mensual listo</span>}
                            </div>
                            <p className="text-sm text-slate-500">Interés: {debt.interestRate}% • Día de Pago: {debt.dayOfMonth}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm text-slate-400">Saldo Actual</p>
                            <p className={`text-2xl font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>${debt.currentBalance.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="mb-4">
                         <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progreso: {debtProgress.toFixed(0)}%</span>
                            <span>Original: ${debt.totalAmount.toLocaleString()}</span>
                         </div>
                         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${debtProgress}%` }}></div>
                         </div>
                      </div>

                      {!isPaid && (
                         <div className="flex gap-3 mt-4 border-t border-slate-50 pt-4">
                            <button 
                              onClick={() => {
                                 const amountStr = prompt(`¿Cuánto vas a abonar a ${debt.name}?`);
                                 const amount = parseFloat(amountStr || '0');
                                 if (amount > 0) payDebt(debt.id, amount);
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                            >
                              Abonar Capital
                            </button>
                            <button 
                              onClick={() => deleteDebt(debt.id)}
                              className="px-4 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Eliminar registro"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      )}
                   </div>
                 );
              })}
            </div>
         </div>
      </div>
    );
  };

  const MobileNavItem = ({ viewName, icon, label }: { viewName: ViewState, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setView(viewName)}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${view === viewName ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] font-medium mt-1 leading-none">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="bg-white w-full md:w-64 border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <h1 className="font-bold text-slate-800 text-lg tracking-tight">Mayordomía</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('DASHBOARD')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'DASHBOARD' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Resumen
          </button>
          
          <button onClick={() => setView('TRANSACTIONS')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'TRANSACTIONS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Movimientos
          </button>

          <button onClick={() => setView('FIXED_EXPENSES')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'FIXED_EXPENSES' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Gastos Fijos
          </button>

          <button onClick={() => setView('BUDGET')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'BUDGET' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Presupuesto
          </button>

          <button onClick={() => setView('DEBTS')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'DEBTS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            Salir de Deudas
          </button>

          <button onClick={() => setView('ADVISOR')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'ADVISOR' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            Consejero
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'TRANSACTIONS' && renderTransactions()}
        {view === 'FIXED_EXPENSES' && renderFixedExpenses()}
        {view === 'BUDGET' && <BudgetPlanner budgets={budgets} onSave={saveBudget} />}
        {view === 'DEBTS' && renderDebts()}
        {view === 'ADVISOR' && <BiblicalAdvisor transactions={transactions} debts={debts} fixedExpenses={fixedExpenses} budgets={budgets} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe flex justify-between px-4 py-1">
        <MobileNavItem viewName="DASHBOARD" label="Inicio" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <MobileNavItem viewName="TRANSACTIONS" label="Movim." icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <MobileNavItem viewName="BUDGET" label="Presup." icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
        <MobileNavItem viewName="FIXED_EXPENSES" label="Fijos" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <MobileNavItem viewName="ADVISOR" label="Consejero" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
      </nav>

      {/* Modals */}
      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={addFixedExpense} onClose={() => setShowFixedExpenseForm(false)} />}
      {showDebtForm && <DebtForm onAdd={addDebt} onClose={() => setShowDebtForm(false)} />}
      {showIncomeReminderSettings && (
        <IncomeReminderForm 
          reminders={incomeReminders} 
          onAdd={addIncomeReminder} 
          onRemove={removeIncomeReminder} 
          onClose={() => setShowIncomeReminderSettings(false)} 
        />
      )}

      {/* Floating Action Button for Transactions on Mobile */}
      <button 
         onClick={() => setShowTransactionForm(true)}
         className="md:hidden fixed bottom-20 right-4 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
};

export default App;