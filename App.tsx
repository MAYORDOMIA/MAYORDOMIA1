
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
import { ShoppingList } from './components/ShoppingList';
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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
        estimated_income: item.estimated_income,
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
    const { data, error } = await supabase.from('transactions').insert([{
      description, amount, type, category, date: new Date().toISOString(), user_id: session.user.id
    }]).select();
    if (error) return alert("Error: " + error.message);
    setTransactions(prev => [data[0], ...prev]);
  };

  const deleteFixedExpense = async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (!error) setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  const markFixedExpenseAsPaid = async (expense: FixedExpense) => {
    const { data, error: transError } = await supabase.from('transactions').insert([{
      description: `Pago: ${expense.description}`,
      amount: expense.amount,
      type: TransactionType.EXPENSE,
      category: expense.category,
      date: new Date().toISOString(),
      user_id: session.user.id
    }]).select();
    if (transError) return alert(transError.message);
    await supabase.from('fixed_expenses').update({
      last_paid_date: new Date().toISOString(),
      last_transaction_id: data[0].id
    }).eq('id', expense.id);
    fetchAllData();
  };

  const saveBudget = async (budget: Budget) => {
    const { error } = await supabase.from('budgets').upsert([{
      id: budget.id, year: budget.year, month: budget.month, estimated_income: budget.estimatedIncome, allocations: budget.allocations, user_id: session.user.id
    }]);
    if (!error) fetchAllData();
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
    <button 
      onClick={() => setView(viewName)} 
      className={`flex flex-col items-center justify-center h-full transition-all active:bg-slate-50 relative ${view === viewName ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <div className={`w-5 h-5 flex items-center justify-center mb-1 ${view === viewName ? 'scale-110' : 'scale-100'} transition-transform`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold leading-none uppercase tracking-tighter text-center truncate w-full px-0.5">
        {label}
      </span>
      {view === viewName && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-t-full"></div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar Desktop */}
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setView('DASHBOARD')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'DASHBOARD' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Resumen</button>
          <button onClick={() => setView('FIXED_EXPENSES')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'FIXED_EXPENSES' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Gastos Fijos</button>
          <button onClick={() => setView('SHOPPING_LIST')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'SHOPPING_LIST' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Lista Compras</button>
          <button onClick={() => setView('TRANSACTIONS')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'TRANSACTIONS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Movimientos</button>
          <button onClick={() => setView('BUDGET')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'BUDGET' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Presupuesto</button>
          <button onClick={() => setView('ADVISOR')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'ADVISOR' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>IA Consejero</button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pb-36 md:pb-8 h-screen scroll-smooth">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {view === 'DASHBOARD' && (
             <div className="space-y-5 animate-fade-in">
               <Reminders fixedExpenses={fixedExpenses} debts={debts} incomeReminders={incomeReminders} onAction={(v) => setView(v as ViewState)} />
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                 <SummaryCard title="Balance" amount={balance} colorClass={balance >= 0 ? "text-slate-800" : "text-rose-600"} icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7" /></svg>} />
                 <SummaryCard title="Fijos" amount={totalPendingFixedMonthly} colorClass="text-orange-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14" /></svg>} />
                 <SummaryCard title="Ingresos" amount={totalIncome} colorClass="text-emerald-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>} />
                 <SummaryCard title="Gastos" amount={totalExpense} colorClass="text-rose-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>} />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">Recientes</h3>
                     <div className="space-y-1">
                       {transactions.slice(0, 5).map(t => (
                         <div key={t.id} className="flex items-center justify-between p-3 active:bg-slate-50 rounded-xl">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-xs ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 truncate text-xs">{t.description}</p>
                                <p className="text-[10px] text-slate-400 truncate uppercase">{t.category}</p>
                              </div>
                           </div>
                           <span className={`font-black text-xs ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</span>
                         </div>
                       ))}
                     </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Gastos</h3>
                     <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={expenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                             {expenseData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <RechartsTooltip />
                         </PieChart>
                       </ResponsiveContainer>
                     </div>
                  </div>
               </div>
             </div>
          )}
          {view === 'FIXED_EXPENSES' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Gastos Fijos</h2>
                <button onClick={() => setShowFixedExpenseForm(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md">+ Nuevo</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedExpenses.map(expense => {
                  const paid = isPaidThisMonth(expense.lastPaidDate);
                  return (
                    <div key={expense.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group relative">
                      <button onClick={() => deleteFixedExpense(expense.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      <div>
                        <div className="flex justify-between items-start mb-2 pr-10">
                          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider">{expense.category}</span>
                          <span className="text-[10px] text-slate-400 font-bold">DÍA {expense.dayOfMonth}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{expense.description}</h3>
                        <p className="text-2xl font-black text-slate-900 mb-5">${expense.amount.toLocaleString()}</p>
                      </div>
                      <button onClick={() => !paid && markFixedExpenseAsPaid(expense)} disabled={paid} className={`w-full py-3 rounded-xl font-black text-sm transition-all ${paid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-600 text-white shadow-lg active:scale-95 shadow-indigo-100'}`}>
                        {paid ? '✓ PAGADO' : 'MARCAR PAGO'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view === 'SHOPPING_LIST' && <ShoppingList />}
          {view === 'TRANSACTIONS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-black text-slate-800">Movimientos</h2>
                <button onClick={() => setShowTransactionForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Nuevo</button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                      <tr><th className="p-4">Día</th><th className="p-4">Detalle</th><th className="p-4 text-right">Monto</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map(t => (
                        <tr key={t.id} className="active:bg-slate-50">
                          <td className="p-4 text-xs">{new Date(t.date).getDate()}</td>
                          <td className="p-4"><p className="font-bold text-slate-800 leading-none">{t.description}</p><span className="text-[10px] text-slate-400">{t.category}</span></td>
                          <td className={`p-4 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {view === 'BUDGET' && <BudgetPlanner budgets={budgets} onSave={saveBudget} />}
          {view === 'ADVISOR' && <BiblicalAdvisor transactions={transactions} debts={debts} fixedExpenses={fixedExpenses} budgets={budgets} />}
        </div>
      </main>

      {/* Botón flotante reubicado para no tapar el nav */}
      <button 
        onClick={() => setShowTransactionForm(true)} 
        className="md:hidden fixed bottom-20 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[100] active:scale-90 transition-transform border-4 border-white"
        aria-label="Agregar"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      {/* NAVEGACIÓN CORREGIDA: GRID 6 COLUMNAS FIJAS */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[90] pb-safe flex items-stretch h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-6 w-full h-full">
          <MobileNavItem viewName="DASHBOARD" label="Inicio" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" /></svg>} />
          <MobileNavItem viewName="FIXED_EXPENSES" label="Fijos" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" /></svg>} />
          <MobileNavItem viewName="TRANSACTIONS" label="Movs" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2" /></svg>} />
          <MobileNavItem viewName="BUDGET" label="Plan" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5" /></svg>} />
          <MobileNavItem viewName="SHOPPING_LIST" label="Lista" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4" /></svg>} />
          <MobileNavItem viewName="ADVISOR" label="IA" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2" /></svg>} />
        </div>
      </nav>

      {/* Forms & Modals */}
      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={() => fetchAllData()} onClose={() => setShowFixedExpenseForm(false)} />}
      {showDebtForm && <DebtForm onAdd={() => {}} onClose={() => setShowDebtForm(false)} />}
      {showIncomeReminderSettings && <IncomeReminderForm reminders={incomeReminders} onAdd={() => {}} onRemove={() => {}} onClose={() => setShowIncomeReminderSettings(false)} />}
    </div>
  );
};

export default App;
