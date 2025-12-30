
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Debt, ViewState, TransactionType, FixedExpense, Budget, IncomeReminder, PaymentMethod, PaymentMethodType } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FixedExpenseForm } from './components/FixedExpenseForm';
import { DebtForm } from './components/DebtForm';
import { BudgetPlanner } from './components/BudgetPlanner';
import { SummaryCard } from './components/SummaryCard';
import { BiblicalAdvisor } from './components/BiblicalAdvisor';
import { Reminders } from './components/Reminders';
import { IncomeReminderForm } from './components/IncomeReminderForm';
import { ShoppingList } from './components/ShoppingList';
import { ResetDataModal } from './components/ResetDataModal';
import { PaymentMethodManager } from './components/PaymentMethodManager';
import { PaymentSelectionModal } from './components/PaymentSelectionModal';
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>([]);
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showIncomeReminderSettings, setShowIncomeReminderSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPaymentMethodManager, setShowPaymentMethodManager] = useState(false);
  const [expenseToPay, setExpenseToPay] = useState<FixedExpense | null>(null);

  const fetchAllData = useCallback(async (currentSession?: any) => {
    const user = currentSession?.user || session?.user;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const [tRes, dRes, fRes, bRes, iRes, pmRes] = await Promise.allSettled([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('fixed_expenses').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('income_reminders').select('*').eq('user_id', user.id),
        supabase.from('payment_methods').select('*').eq('user_id', user.id)
      ]);

      if (tRes.status === 'fulfilled' && tRes.value.data) setTransactions(tRes.value.data);
      
      if (dRes.status === 'fulfilled' && dRes.value.data) setDebts(dRes.value.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        totalAmount: item.total_amount,
        currentBalance: item.current_balance,
        interestRate: item.interest_rate,
        minPayment: item.min_payment,
        dayOfMonth: item.day_of_month,
        lastPaymentDate: item.last_payment_date
      })));

      if (fRes.status === 'fulfilled' && fRes.value.data) setFixedExpenses(fRes.value.data.map((item: any) => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        dayOfMonth: item.day_of_month,
        lastPaidDate: item.last_paid_date,
        lastTransactionId: item.last_transaction_id,
        payment_method_id: item.payment_method_id
      })));

      if (bRes.status === 'fulfilled' && bRes.value.data) setBudgets(bRes.value.data.map((item: any) => ({
        id: item.id,
        year: item.year,
        month: item.month,
        estimated_income: item.estimated_income,
        allocations: item.allocations
      })));

      if (iRes.status === 'fulfilled' && iRes.value.data) setIncomeReminders(iRes.value.data.map((item: any) => ({
        id: item.id,
        description: item.description,
        dayOfMonth: item.day_of_month,
        lastRegisteredDate: item.last_registered_date
      })));

      if (pmRes.status === 'fulfilled' && pmRes.value.data) {
        setPaymentMethods(pmRes.value.data);
      }
    } catch (err) {
      console.error("Error crítico al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) fetchAllData(initialSession);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchAllData(newSession);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  const addTransaction = async (description: string, amount: number, type: TransactionType, category: string, paymentMethodId?: string) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.from('transactions').insert([{
      description, 
      amount, 
      type, 
      category, 
      date: new Date().toISOString(), 
      user_id: session.user.id, 
      payment_method_id: paymentMethodId || null
    }]).select();
    if (error) return alert("Error: " + error.message);
    if (data) setTransactions(prev => [data[0], ...prev]);
  };

  const addPaymentMethod = async (name: string, type: PaymentMethodType) => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('payment_methods').insert([{
        name, 
        type, 
        user_id: session.user.id
      }]).select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPaymentMethods(prev => [...prev, data[0]]);
        fetchAllData(session);
      }
    } catch (error: any) {
      alert("Error al guardar método de pago: " + error.message);
    }
  };

  const removePaymentMethod = async (id: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) return alert("Error: " + error.message);
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  const addFixedExpense = async (description: string, amount: number, category: string, dayOfMonth: number, paymentMethodId?: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('fixed_expenses').insert([{
      description, amount, category, day_of_month: dayOfMonth, user_id: session.user.id, payment_method_id: paymentMethodId || null
    }]);
    if (error) return alert("Error: " + error.message);
    fetchAllData(session);
  };

  const deleteFixedExpense = async (id: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id).eq('user_id', session.user.id);
    if (!error) setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  const addDebt = async (name: string, amount: number, rate: number, minPayment: number, dayOfMonth: number) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('debts').insert([{
      name, 
      total_amount: amount, 
      current_balance: amount, 
      interest_rate: rate, 
      min_payment: minPayment, 
      day_of_month: dayOfMonth, 
      user_id: session.user.id
    }]);
    if (error) return alert("Error: " + error.message);
    fetchAllData(session);
  };

  const addIncomeReminder = async (description: string, day: number) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('income_reminders').insert([{
      description, day_of_month: day, user_id: session.user.id
    }]);
    if (error) return alert("Error: " + error.message);
    fetchAllData(session);
  };

  const removeIncomeReminder = async (id: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('income_reminders').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) return alert("Error: " + error.message);
    setIncomeReminders(prev => prev.filter(i => i.id !== id));
  };

  const handleFullReset = async () => {
    try {
      const userId = session.user.id;
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('fixed_expenses').delete().eq('user_id', userId),
        supabase.from('debts').delete().eq('user_id', userId),
        supabase.from('budgets').delete().eq('user_id', userId),
        supabase.from('income_reminders').delete().eq('user_id', userId),
        supabase.from('payment_methods').delete().eq('user_id', userId),
      ]);
      localStorage.removeItem('shopping_items');
      localStorage.removeItem('shopping_stores');
      await fetchAllData(session);
      setView('DASHBOARD');
      alert("Todos los datos han sido borrados correctamente.");
    } catch (err) {
      console.error("Error al reiniciar datos:", err);
      alert("Ocurrió un error al intentar borrar los datos.");
    }
  };

  const markFixedExpenseAsPaid = async (expense: FixedExpense, paymentMethodId: string) => {
    try {
      const { data: transData, error: transError } = await supabase.from('transactions').insert([{
        description: `Pago: ${expense.description}`,
        amount: expense.amount,
        type: TransactionType.EXPENSE,
        category: expense.category,
        date: new Date().toISOString(),
        user_id: session.user.id,
        payment_method_id: paymentMethodId
      }]).select();

      if (transError) throw transError;

      const { error: updateError } = await supabase.from('fixed_expenses').update({
        last_paid_date: new Date().toISOString(),
        last_transaction_id: transData[0].id
      }).eq('id', expense.id).eq('user_id', session.user.id);

      if (updateError) throw updateError;

      await fetchAllData(session);
      setExpenseToPay(null);
    } catch (err: any) {
      alert("Error al procesar pago: " + err.message);
    }
  };

  const saveBudget = async (budget: Budget) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('budgets').upsert([{
      id: budget.id, 
      year: budget.year, 
      month: budget.month, 
      estimated_income: budget.estimatedIncome, 
      allocations: budget.allocations, 
      user_id: session.user.id
    }]);
    if (!error) fetchAllData(session);
  };

  const isPaidThisMonth = (lastPaidDate?: string) => {
    if (!lastPaidDate) return false;
    const paidDate = new Date(lastPaidDate);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  };

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  
  // MODIFICACIÓN: Filtrar gastos para sumar SOLO EFECTIVO
  const totalExpense = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const pm = paymentMethods.find(m => m.id === t.payment_method_id);
    // Si no tiene método o el método es tipo CASH (Efectivo)
    return pm?.type === PaymentMethodType.CASH;
  }).reduce((acc, curr) => acc + curr.amount, 0);

  const totalPendingFixedMonthly = fixedExpenses.filter(f => !isPaidThisMonth(f.lastPaidDate)).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const paymentMethodBalances = useMemo(() => {
    return paymentMethods.map(pm => {
      const pmTransactions = transactions.filter(t => t.payment_method_id === pm.id);
      const income = pmTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const expense = pmTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      return {
        ...pm,
        balance: income - expense
      };
    });
  }, [paymentMethods, transactions]);

  if (!session && !loading) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const MobileNavItem = ({ viewName, label }: { viewName: ViewState, label: string }) => (
    <button 
      onClick={() => { setView(viewName); setIsMenuOpen(false); }} 
      className={`flex flex-col items-center justify-center h-full transition-all active:bg-slate-50 relative ${view === viewName ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <span className="text-[9px] font-black leading-none uppercase tracking-tighter text-center truncate w-full px-0.5">
        {label}
      </span>
      {view === viewName && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-t-full"></div>}
    </button>
  );

  const menuItems = [
    { id: 'DASHBOARD', label: 'Resumen' },
    { id: 'FIXED_EXPENSES', label: 'Gastos Fijos' },
    { id: 'SHOPPING_LIST', label: 'Lista Compras' },
    { id: 'TRANSACTIONS', label: 'Movimientos' },
    { id: 'BUDGET', label: 'Presupuesto' },
    { id: 'ADVISOR', label: 'IA Consejero' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="bg-white w-full md:w-64 border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">Mayordomía</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-400 font-bold hover:text-rose-500 transition-colors text-xs uppercase">
             SALIR
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as ViewState)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-slate-100 space-y-1">
            <button onClick={() => setShowPaymentMethodManager(true)} className="px-4 py-3 rounded-lg text-xs font-black w-full text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-widest text-left">
              Billeteras
            </button>
            <button onClick={() => setShowResetModal(true)} className="px-4 py-3 rounded-lg text-xs font-black w-full text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all uppercase tracking-widest text-left">
              Reiniciar
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[150] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between pt-safe">
            <div className="flex items-center gap-3">
              <span className="font-black tracking-tight text-lg">MENÚ</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 font-black text-xl">X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setView(item.id as ViewState); setIsMenuOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold w-full transition-all active:scale-[0.98] ${view === item.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
               <button onClick={() => { setShowPaymentMethodManager(true); setIsMenuOpen(false); }} className="px-4 py-4 rounded-2xl text-[10px] font-black w-full text-slate-500 hover:bg-slate-50 uppercase tracking-widest text-left">
                Cuentas
              </button>
              <button onClick={() => { setShowResetModal(true); setIsMenuOpen(false); }} className="px-4 py-4 rounded-2xl text-[10px] font-black w-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 uppercase tracking-widest text-left">
                Borrar Datos
              </button>
              <button onClick={() => supabase.auth.signOut()} className="px-4 py-4 rounded-2xl text-[10px] font-black w-full text-rose-400 hover:bg-rose-50 uppercase tracking-widest text-left">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between px-4 h-16 sticky top-0 z-50 shrink-0 pt-safe">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">M</div>
          <span className="font-black text-slate-800 tracking-tight">Mayordomía</span>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-500 font-bold uppercase text-[10px] border border-slate-100 rounded-lg">
          MENÚ
        </button>
      </header>

      <main className="flex-1 overflow-y-auto w-full pb-36 md:pb-8 h-screen scroll-smooth">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {view === 'DASHBOARD' && (
             <div className="space-y-5 animate-fade-in">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Mi Panel</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setShowPaymentMethodManager(true)} className="px-3 py-2 text-indigo-600 text-[10px] font-black bg-indigo-50 rounded-lg uppercase">Cuentas</button>
                    <button onClick={() => setShowIncomeReminderSettings(true)} className="px-3 py-2 text-slate-600 text-[10px] font-black bg-slate-50 rounded-lg uppercase">Config</button>
                 </div>
               </div>
               
               <Reminders fixedExpenses={fixedExpenses} debts={debts} incomeReminders={incomeReminders} onAction={(v) => {
                 if (v === 'FIXED_EXPENSES') setView('FIXED_EXPENSES');
                 else if (v === 'TRANSACTIONS') setView('TRANSACTIONS');
               }} />

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                 <SummaryCard title="Balance" amount={balance} colorClass={balance >= 0 ? "text-slate-800" : "text-rose-600"} />
                 <SummaryCard title="Fijos" amount={totalPendingFixedMonthly} colorClass="text-orange-600" />
                 <SummaryCard title="Ingresos" amount={totalIncome} colorClass="text-emerald-600" />
                 <SummaryCard title="Gastos (Efectivo)" amount={totalExpense} colorClass="text-rose-600" />
               </div>

               <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cuentas y Saldos</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {paymentMethodBalances.map(pm => (
                      <div key={pm.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tight">{pm.name}</p>
                        <p className={`text-xs font-black leading-none ${pm.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${pm.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  <div className="lg:col-span-2 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                     <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tighter">Recientes</h3>
                     <div className="space-y-1">
                       {transactions.slice(0, 5).map(t => (
                         <div key={t.id} className="flex items-center justify-between p-3 active:bg-slate-50 rounded-2xl transition-colors">
                            <div className="overflow-hidden">
                              <p className="font-bold text-slate-800 truncate text-xs leading-none mb-1">{t.description}</p>
                              <p className="text-[9px] text-slate-400 truncate uppercase font-bold">{t.category}</p>
                            </div>
                            <span className={`font-black text-xs ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</span>
                         </div>
                       ))}
                       {transactions.length === 0 && <p className="text-center text-slate-400 py-4 text-sm font-medium">Sin movimientos.</p>}
                     </div>
                  </div>
               </div>
             </div>
          )}
          {view === 'FIXED_EXPENSES' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gastos Fijos</h2>
                <button onClick={() => setShowFixedExpenseForm(true)} className="bg-orange-600 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl uppercase tracking-widest">+ NUEVO</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedExpenses.map(expense => {
                  const paid = isPaidThisMonth(expense.lastPaidDate);
                  return (
                    <div key={expense.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative">
                      <button onClick={() => deleteFixedExpense(expense.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 font-bold text-[10px]">BORRAR</button>
                      <div>
                        <div className="flex justify-between items-start mb-2 pr-10">
                          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-wider">{expense.category}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">DÍA {expense.dayOfMonth}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{expense.description}</h3>
                        <p className="text-2xl font-black text-slate-900 mb-5">${expense.amount.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => !paid && setExpenseToPay(expense)} 
                        disabled={paid} 
                        className={`w-full py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${paid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white shadow-xl'}`}
                      >
                        {paid ? 'PAGADO' : 'PAGAR'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view === 'SHOPPING_LIST' && <ShoppingList />}
          {view === 'TRANSACTIONS' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Movimientos</h2>
                <button onClick={() => setShowTransactionForm(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-xl uppercase tracking-widest">NUEVO</button>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                      <tr><th className="p-5">Día</th><th className="p-5">Detalle</th><th className="p-5 text-right">Monto</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="active:bg-slate-50 transition-colors">
                          <td className="p-5 text-xs font-black text-slate-400">{new Date(t.date).getDate()}</td>
                          <td className="p-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 leading-none mb-1">{t.description}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{t.category}</span>
                            </div>
                          </td>
                          <td className={`p-5 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</td>
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

      {/* Mobile FAB */}
      <button onClick={() => setShowTransactionForm(true)} className="md:hidden fixed bottom-24 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[100] border-4 border-white font-black text-2xl">+</button>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[140] pb-safe flex items-stretch h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 w-full h-full">
          <MobileNavItem viewName="DASHBOARD" label="Panel" />
          <MobileNavItem viewName="FIXED_EXPENSES" label="Fijos" />
          <MobileNavItem viewName="TRANSACTIONS" label="Movs" />
          <MobileNavItem viewName="SHOPPING_LIST" label="Lista" />
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center justify-center h-full text-slate-400 active:bg-slate-50 transition-colors">
             <span className="text-[9px] font-black uppercase tracking-tighter">Más</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} paymentMethods={paymentMethods} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={addFixedExpense} onClose={() => setShowFixedExpenseForm(false)} paymentMethods={paymentMethods} />}
      {showDebtForm && <DebtForm onAdd={addDebt} onClose={() => setShowDebtForm(false)} />}
      {showIncomeReminderSettings && <IncomeReminderForm reminders={incomeReminders} onAdd={addIncomeReminder} onRemove={removeIncomeReminder} onClose={() => setShowIncomeReminderSettings(false)} />}
      {showResetModal && <ResetDataModal email={session.user.email} onConfirm={handleFullReset} onClose={() => setShowResetModal(false)} />}
      {showPaymentMethodManager && <PaymentMethodManager paymentMethods={paymentMethods} onAdd={addPaymentMethod} onRemove={removePaymentMethod} onClose={() => setShowPaymentMethodManager(false)} />}
      
      {expenseToPay && (
        <PaymentSelectionModal 
          title={expenseToPay.description} 
          amount={expenseToPay.amount} 
          paymentMethods={paymentMethods} 
          onClose={() => setExpenseToPay(null)} 
          onConfirm={(pmId) => markFixedExpenseAsPaid(expenseToPay, pmId)} 
        />
      )}
    </div>
  );
};

export default App;
