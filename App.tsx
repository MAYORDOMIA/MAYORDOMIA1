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
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>([]);
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showIncomeReminderSettings, setShowIncomeReminderSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [t, d, f, b, i] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('debts').select('*'),
        supabase.from('fixed_expenses').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('income_reminders').select('*')
      ]);

      if (t.data) setTransactions(t.data);
      
      if (d.data) setDebts(d.data.map(item => ({
        id: item.id,
        name: item.name,
        totalAmount: item.total_amount,
        currentBalance: item.current_balance,
        interestRate: item.interest_rate,
        minPayment: item.min_payment,
        dayOfMonth: item.day_of_month,
        lastPaymentDate: item.last_payment_date
      })));

      if (f.data) setFixedExpenses(f.data.map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        dayOfMonth: item.day_of_month,
        lastPaidDate: item.last_paid_date,
        lastTransactionId: item.last_transaction_id
      })));

      if (b.data) setBudgets(b.data.map(item => ({
        id: item.id,
        year: item.year,
        month: item.month,
        estimatedIncome: item.estimated_income,
        allocations: item.allocations
      })));

      if (i.data) setIncomeReminders(i.data.map(item => ({
        id: item.id,
        description: item.description,
        dayOfMonth: item.day_of_month,
        lastRegisteredDate: item.last_registered_date
      })));
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (description: string, amount: number, type: TransactionType, category: string) => {
    const newTrans = {
      description,
      amount,
      type,
      category,
      date: new Date().toISOString(),
      user_id: session.user.id
    };

    const { data, error } = await supabase.from('transactions').insert([newTrans]).select();
    if (error) return alert("Error al guardar transacción: " + error.message);
    
    setTransactions(prev => [data[0], ...prev]);

    if (type === TransactionType.INCOME) {
      const today = new Date().toISOString();
      const updatedReminders = await Promise.all(incomeReminders.map(async (rem) => {
        if (description.toLowerCase().includes(rem.description.toLowerCase()) || rem.dayOfMonth === new Date().getDate()) {
          await supabase.from('income_reminders').update({ last_registered_date: today }).eq('id', rem.id);
          return { ...rem, lastRegisteredDate: today };
        }
        return rem;
      }));
      setIncomeReminders(updatedReminders);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addFixedExpense = async (description: string, amount: number, category: string, dayOfMonth: number) => {
    const { data, error } = await supabase.from('fixed_expenses').insert([{
      description, 
      amount, 
      category, 
      day_of_month: dayOfMonth, 
      user_id: session.user.id
    }]).select();
    
    if (!error && data) {
      setFixedExpenses(prev => [...prev, {
        id: data[0].id,
        description: data[0].description,
        amount: data[0].amount,
        category: data[0].category,
        dayOfMonth: data[0].day_of_month
      }]);
    }
  };

  const deleteFixedExpense = async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (!error) setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  const toggleFixedExpensePaid = async (id: string) => {
    const expense = fixedExpenses.find(f => f.id === id);
    if (!expense) return;

    const currentlyPaid = isPaidThisMonth(expense.lastPaidDate);
    if (!currentlyPaid) {
      const newTrans = {
        description: `Pago Fijo: ${expense.description}`,
        amount: expense.amount,
        type: TransactionType.EXPENSE,
        category: expense.category,
        date: new Date().toISOString(),
        user_id: session.user.id
      };
      const { data: tData } = await supabase.from('transactions').insert([newTrans]).select();
      const { data: fData } = await supabase.from('fixed_expenses').update({ 
        last_paid_date: new Date().toISOString(), 
        last_transaction_id: tData?.[0].id 
      }).eq('id', id).select();
      
      if (tData) setTransactions(prev => [tData[0], ...prev]);
      if (fData) setFixedExpenses(prev => prev.map(f => f.id === id ? {
        ...f,
        lastPaidDate: fData[0].last_paid_date,
        lastTransactionId: fData[0].last_transaction_id
      } : f));
    } else {
      if (expense.lastTransactionId) await supabase.from('transactions').delete().eq('id', expense.lastTransactionId);
      const { data: fData } = await supabase.from('fixed_expenses').update({ 
        last_paid_date: null, 
        last_transaction_id: null 
      }).eq('id', id).select();
      
      setTransactions(prev => prev.filter(t => t.id !== expense.lastTransactionId));
      if (fData) setFixedExpenses(prev => prev.map(f => f.id === id ? {
        ...f,
        lastPaidDate: undefined,
        lastTransactionId: undefined
      } : f));
    }
  };

  const addDebt = async (name: string, totalAmount: number, interestRate: number, minPayment: number, dayOfMonth: number) => {
    const { data, error } = await supabase.from('debts').insert([{
      name, 
      total_amount: totalAmount, 
      current_balance: totalAmount, 
      interest_rate: interestRate, 
      min_payment: minPayment > 0 ? minPayment : totalAmount * 0.03, 
      day_of_month: dayOfMonth, 
      user_id: session.user.id
    }]).select();
    
    if (!error && data) {
      setDebts(prev => [...prev, {
        id: data[0].id,
        name: data[0].name,
        totalAmount: data[0].total_amount,
        currentBalance: data[0].current_balance,
        interestRate: data[0].interest_rate,
        minPayment: data[0].min_payment,
        dayOfMonth: data[0].day_of_month
      }]);
    }
  };

  const deleteDebt = async (id: string) => {
    if(window.confirm("¿Estás seguro de eliminar esta deuda?")) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (!error) setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const payDebt = async (id: string, amount: number) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newBalance = Math.max(0, debt.currentBalance - amount);
    const { data, error } = await supabase.from('debts').update({ 
      current_balance: newBalance, 
      last_payment_date: new Date().toISOString() 
    }).eq('id', id).select();
    
    if (!error && data) {
      setDebts(prev => prev.map(d => d.id === id ? {
        ...d,
        currentBalance: data[0].current_balance,
        lastPaymentDate: data[0].last_payment_date
      } : d));
      addTransaction(`Abono a Deuda: ${debt.name}`, amount, TransactionType.EXPENSE, 'Deudas');
    }
  };

  const addIncomeReminder = async (description: string, day: number) => {
    const { data, error } = await supabase.from('income_reminders').insert([{
      description, 
      day_of_month: day, 
      user_id: session.user.id
    }]).select();
    
    if (!error && data) {
      setIncomeReminders(prev => [...prev, {
        id: data[0].id,
        description: data[0].description,
        dayOfMonth: data[0].day_of_month
      }]);
    }
  };

  const removeIncomeReminder = async (id: string) => {
    const { error } = await supabase.from('income_reminders').delete().eq('id', id);
    if (!error) setIncomeReminders(prev => prev.filter(r => r.id !== id));
  };

  const saveBudget = async (newBudget: Budget) => {
    const { data, error } = await supabase.from('budgets').upsert({
      id: newBudget.id,
      year: newBudget.year,
      month: newBudget.month,
      estimated_income: newBudget.estimatedIncome,
      allocations: newBudget.allocations,
      user_id: session.user.id
    }).select();
    
    if (!error && data) {
      setBudgets(prev => {
        const filtered = prev.filter(b => b.id !== newBudget.id);
        return [...filtered, {
          id: data[0].id,
          year: data[0].year,
          month: data[0].month,
          estimatedIncome: data[0].estimated_income,
          allocations: data[0].allocations
        }];
      });
    }
  };

  const isPaidThisMonth = (lastPaidDate?: string) => {
    if (!lastPaidDate) return false;
    const paidDate = new Date(lastPaidDate);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  };

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingFixedMonthly = fixedExpenses.filter(f => !isPaidThisMonth(f.lastPaidDate)).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [transactions]);

  if (!session) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const MobileNavItem = ({ viewName, icon, label }: { viewName: ViewState, icon: React.ReactNode, label: string }) => (
    <button onClick={() => setView(viewName)} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${view === viewName ? 'text-indigo-600' : 'text-slate-400'}`}>
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] font-medium mt-1 leading-none">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="bg-white w-full md:w-64 border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">Mayordomía</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-rose-500 transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
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
        {view === 'DASHBOARD' && (
           <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h3 className="font-bold text-slate-800 text-lg">Alertas y Recordatorios</h3>
               <button onClick={() => setShowIncomeReminderSettings(true)} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                 Configurar Cobros
               </button>
             </div>
             <Reminders fixedExpenses={fixedExpenses} debts={debts} incomeReminders={incomeReminders} onAction={(v) => setView(v as ViewState)} />
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
               <SummaryCard title="Balance" amount={balance} colorClass={balance >= 0 ? "text-slate-800" : "text-rose-600"} icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
               <SummaryCard title="Fijos (Pendiente)" amount={totalPendingFixedMonthly} colorClass="text-orange-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
               <SummaryCard title="Ingresos" amount={totalIncome} colorClass="text-emerald-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>} />
               <SummaryCard title="Gastos Var." amount={totalExpense} colorClass="text-rose-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>} />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Recientes</h3>
                   <div className="space-y-4">
                     {transactions.slice(0, 5).map(t => (
                       <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === TransactionType.INCOME ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-medium text-slate-800 truncate">{t.description}</p>
                              <p className="text-xs text-slate-500 truncate">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(0)}
                         </span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                   <h3 className="text-lg font-bold text-slate-800 mb-4 w-full text-left">Distribución</h3>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart><Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">{expenseData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>
             </div>
           </div>
        )}
        {view === 'TRANSACTIONS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Movimientos</h2>
                <button onClick={() => setShowTransactionForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Nuevo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="p-4">Fecha</th><th className="p-4">Descripción</th><th className="p-4">Categoría</th><th className="p-4 text-right">Monto</th><th className="p-4 text-center">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-4">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium">{t.description}</td>
                        <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{t.category}</span></td>
                        <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}</td>
                        <td className="p-4 text-center"><button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-rose-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {view === 'FIXED_EXPENSES' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-800">Gastos Fijos</h2>
                  <button onClick={() => setShowFixedExpenseForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Agregar</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4 w-16">Estado</th><th className="p-4">Día</th><th className="p-4">Descripción</th><th className="p-4 text-right">Monto</th><th className="p-4 text-center">Acciones</th></tr></thead>
                   <tbody className="divide-y divide-slate-100">
                     {fixedExpenses.sort((a,b) => a.dayOfMonth - b.dayOfMonth).map(f => {
                       const isPaid = isPaidThisMonth(f.lastPaidDate);
                       return (
                        <tr key={f.id} className={`${isPaid ? 'bg-slate-50 opacity-50' : ''}`}>
                          <td className="p-4"><button onClick={() => toggleFixedExpensePaid(f.id)} className={`w-6 h-6 rounded border flex items-center justify-center ${isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>{isPaid && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}</button></td>
                          <td className="p-4">Día {f.dayOfMonth}</td>
                          <td className="p-4 font-medium">{f.description}</td>
                          <td className="p-4 text-right font-bold">${f.amount.toFixed(2)}</td>
                          <td className="p-4 text-center"><button onClick={() => deleteFixedExpense(f.id)} className="text-slate-400 hover:text-rose-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                        </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
        {view === 'BUDGET' && <BudgetPlanner budgets={budgets} onSave={saveBudget} />}
        {view === 'DEBTS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><h3 className="text-slate-500 text-sm">Deuda Total</h3><p className="text-3xl font-bold text-rose-600 mt-1">${debts.reduce((a,c) => a+c.currentBalance, 0).toLocaleString()}</p></div>
               <button onClick={() => setShowDebtForm(true)} className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white font-bold text-center hover:bg-indigo-700 transition-colors">Agregar Nueva Deuda</button>
            </div>
            <div className="space-y-4">
              {debts.map(debt => (
                <div key={debt.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg">{debt.name}</h4>
                      <p className="text-2xl font-bold text-rose-600">${debt.currentBalance.toLocaleString()}</p>
                   </div>
                   <div className="flex gap-3 pt-4 border-t border-slate-50">
                      <button onClick={() => { const a = prompt(`¿Cuánto abonar a ${debt.name}?`); if(a) payDebt(debt.id, parseFloat(a)); }} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">Abonar Capital</button>
                      <button onClick={() => deleteDebt(debt.id)} className="px-4 text-slate-300 hover:text-rose-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'ADVISOR' && <BiblicalAdvisor transactions={transactions} debts={debts} fixedExpenses={fixedExpenses} budgets={budgets} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe flex justify-between px-4 py-1">
        <MobileNavItem viewName="DASHBOARD" label="Inicio" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <MobileNavItem viewName="TRANSACTIONS" label="Movim." icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <MobileNavItem viewName="BUDGET" label="Presup." icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
        <MobileNavItem viewName="FIXED_EXPENSES" label="Fijos" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <MobileNavItem viewName="ADVISOR" label="Consejero" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
      </nav>

      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={addFixedExpense} onClose={() => setShowFixedExpenseForm(false)} />}
      {showDebtForm && <DebtForm onAdd={addDebt} onClose={() => setShowDebtForm(false)} />}
      {showIncomeReminderSettings && <IncomeReminderForm reminders={incomeReminders} onAdd={addIncomeReminder} onRemove={removeIncomeReminder} onClose={() => setShowIncomeReminderSettings(false)} />}
      
      <button onClick={() => setShowTransactionForm(true)} className="md:hidden fixed bottom-20 right-4 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
    </div>
  );
};

export default App;