
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

const VERSES = [
  { text: "Mía es la plata, y mío es el oro, dice Jehová de los ejércitos.", ref: "Hageo 2:8" },
  { text: "El que es fiel en lo muy poco, también en lo más es fiel.", ref: "Lucas 16:10" },
  { text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.", ref: "Salmo 119:105" },
  { text: "Poned la mira en las cosas de arriba, no en las de la tierra.", ref: "Colosenses 3:2" },
  { text: "Donde esté vuestro tesoro, allí estará también vuestro corazón.", ref: "Mateo 6:21" },
  { text: "Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.", ref: "Proverbios 16:3" },
  { text: "Todo lo que hagáis, hacedlo de corazón, como para el Señor.", ref: "Colosenses 3:23" }
];

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
  const [versePopup, setVersePopup] = useState<{text: string, ref: string} | null>(null);

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
        id: item.id, name: item.name, totalAmount: item.total_amount, currentBalance: item.current_balance,
        interestRate: item.interest_rate, minPayment: item.min_payment, dayOfMonth: item.day_of_month,
        lastPaymentDate: item.last_payment_date
      })));
      if (fRes.status === 'fulfilled' && fRes.value.data) setFixedExpenses(fRes.value.data.map((item: any) => ({
        id: item.id, description: item.description, amount: item.amount, category: item.category,
        dayOfMonth: item.day_of_month, lastPaidDate: item.last_paid_date, lastTransactionId: item.last_transaction_id,
        payment_method_id: item.payment_method_id
      })));
      if (bRes.status === 'fulfilled' && bRes.value.data) setBudgets(bRes.value.data.map((item: any) => ({
        id: item.id, year: item.year, month: item.month, estimatedIncome: item.estimated_income, allocations: item.allocations || {}
      })));
      if (iRes.status === 'fulfilled' && iRes.value.data) setIncomeReminders(iRes.value.data.map((item: any) => ({
        id: item.id, description: item.description, dayOfMonth: item.day_of_month, lastRegisteredDate: item.last_registered_date
      })));
      if (pmRes.status === 'fulfilled' && pmRes.value.data) setPaymentMethods(pmRes.value.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        fetchAllData(initialSession);
        const randomVerse = VERSES[Math.floor(Math.random() * VERSES.length)];
        setVersePopup(randomVerse);
        setTimeout(() => setVersePopup(null), 6000);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchAllData(newSession);
        const randomVerse = VERSES[Math.floor(Math.random() * VERSES.length)];
        setVersePopup(randomVerse);
        setTimeout(() => setVersePopup(null), 6000);
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  const addTransaction = async (description: string, amount: number, type: TransactionType, category: string, paymentMethodId?: string) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.from('transactions').insert([{
      description, amount, type, category, date: new Date().toISOString(), user_id: session.user.id, payment_method_id: paymentMethodId || null
    }]).select();
    if (error) return alert("Error: " + error.message);
    if (data) setTransactions(prev => [data[0], ...prev]);
  };

  const addPaymentMethod = async (name: string, type: PaymentMethodType) => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('payment_methods').insert([{
        name, type, user_id: session.user.id
      }]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setPaymentMethods(prev => [...prev, data[0]]);
        fetchAllData(session);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
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
      name, total_amount: amount, current_balance: amount, interest_rate: rate, min_payment: minPayment, day_of_month: dayOfMonth, user_id: session.user.id
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
    if (error) return alert("Error: " + error.message);
    fetchAllData(session);
  };

  const resetAllData = async () => {
    if (!session?.user?.id) return;
    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', session.user.id),
        supabase.from('debts').delete().eq('user_id', session.user.id),
        supabase.from('fixed_expenses').delete().eq('user_id', session.user.id),
        supabase.from('budgets').delete().eq('user_id', session.user.id),
        supabase.from('income_reminders').delete().eq('user_id', session.user.id),
        supabase.from('payment_methods').delete().eq('user_id', session.user.id),
      ]);
      fetchAllData(session);
      alert("Todos tus datos han sido reiniciados.");
    } catch (err: any) {
      alert("Error al reiniciar datos: " + err.message);
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
      alert("Error: " + err.message);
    }
  };

  const isPaidThisMonth = (lastPaidDate?: string) => {
    if (!lastPaidDate) return false;
    const paidDate = new Date(lastPaidDate);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  };

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpense = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const pm = paymentMethods.find(m => m.id === t.payment_method_id);
    return pm?.type === PaymentMethodType.CASH;
  }).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPendingFixedMonthly = fixedExpenses.filter(f => !isPaidThisMonth(f.lastPaidDate)).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const paymentMethodBalances = useMemo(() => {
    return paymentMethods.map(pm => {
      const pmTransactions = transactions.filter(t => t.payment_method_id === pm.id);
      const income = pmTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + (t.amount || 0), 0);
      const expense = pmTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + (t.amount || 0), 0);
      return { ...pm, balance: income - expense };
    });
  }, [paymentMethods, transactions]);

  if (!session && !loading) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const MobileNavItem = ({ viewName, label }: { viewName: ViewState, label: string }) => (
    <button onClick={() => { setView(viewName); setIsMenuOpen(false); }} className={`flex flex-col items-center justify-center h-full transition-all active:bg-slate-50 relative ${view === viewName ? 'text-indigo-600' : 'text-slate-400'}`}>
      <span className="text-xs font-black leading-none uppercase tracking-tighter text-center truncate w-full px-1">{label}</span>
      {view === viewName && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-t-full"></div>}
    </button>
  );

  const menuItems = [
    { id: 'DASHBOARD', label: 'Resumen' },
    { id: 'FIXED_EXPENSES', label: 'Gastos Fijos' },
    { id: 'SHOPPING_LIST', label: 'Lista Mandado' },
    { id: 'TRANSACTIONS', label: 'Movimientos' },
    { id: 'BUDGET', label: 'Presupuesto' },
    { id: 'ADVISOR', label: 'IA Consejero' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Popup de Versículo */}
      {versePopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center border-4 border-indigo-50 animate-fade-in-up">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-6">Palabra de sabiduría</p>
            <p className="text-2xl font-bold text-slate-800 leading-snug italic mb-6">"{versePopup.text}"</p>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">— {versePopup.ref}</p>
          </div>
        </div>
      )}

      {/* Sidebar Escritorio */}
      <aside className="bg-white w-full md:w-72 border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-indigo-100 shadow-xl">M</div>
            <h1 className="font-black text-slate-800 text-xl tracking-tighter uppercase">Mayordomía</h1>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id as ViewState)} className={`flex items-center gap-4 px-6 py-5 rounded-2xl text-base font-bold w-full transition-all ${view === item.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>{item.label}</button>
          ))}
          <div className="pt-10 mt-10 border-t border-slate-100 space-y-3">
            <button onClick={() => setShowPaymentMethodManager(true)} className="px-6 py-4 rounded-2xl text-xs font-black w-full text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-widest text-left">Billeteras</button>
            <button onClick={() => setShowResetModal(true)} className="px-6 py-4 rounded-2xl text-xs font-black w-full text-rose-400 hover:bg-rose-50 hover:text-rose-600 uppercase tracking-widest text-left">Reiniciar</button>
            <button onClick={() => supabase.auth.signOut()} className="px-6 py-4 rounded-2xl text-xs font-black w-full text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest text-left">Salir</button>
          </div>
        </nav>
      </aside>

      {/* Menú Móvil Lateral */}
      <div className={`fixed inset-0 z-[150] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 bottom-0 w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between pt-safe">
            <span className="font-black tracking-tight text-2xl uppercase">Menú</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-4 font-black text-2xl hover:bg-white/10 rounded-full transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setView(item.id as ViewState); setIsMenuOpen(false); }} className={`flex items-center gap-5 px-6 py-6 rounded-3xl text-lg font-bold w-full transition-all active:scale-[0.98] ${view === item.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>{item.label}</button>
            ))}
            <div className="pt-10 mt-10 border-t border-slate-100 space-y-3">
               <button onClick={() => { setShowPaymentMethodManager(true); setIsMenuOpen(false); }} className="px-6 py-6 rounded-3xl text-sm font-black w-full text-slate-500 hover:bg-slate-50 uppercase tracking-widest text-left">Cuentas y Tarjetas</button>
               <button onClick={() => supabase.auth.signOut()} className="px-6 py-6 rounded-3xl text-sm font-black w-full text-rose-600 hover:bg-rose-50 uppercase tracking-widest text-left mt-6 border border-rose-100 text-center">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Superior Móvil */}
      <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between px-6 h-20 sticky top-0 z-50 shrink-0 pt-safe shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-100">M</div>
          <span className="font-black text-slate-800 tracking-tighter uppercase text-lg">Mayordomía</span>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-3 text-slate-500 font-black uppercase text-xs border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">MENÚ</button>
      </header>

      {/* Área de Contenido Principal */}
      <main className="flex-1 overflow-y-auto w-full pb-36 md:pb-16 h-screen scroll-smooth bg-slate-50">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {view === 'DASHBOARD' && (
             <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center px-1">
                 <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Mi Panel</h2>
                 <div className="flex gap-3">
                    <button onClick={() => setShowPaymentMethodManager(true)} className="px-5 py-3 text-indigo-600 text-xs font-black bg-white border border-indigo-100 shadow-sm rounded-2xl uppercase tracking-wider transition-all hover:bg-indigo-50">Cuentas</button>
                    <button onClick={() => setShowIncomeReminderSettings(true)} className="px-5 py-3 text-slate-600 text-xs font-black bg-white border border-slate-200 shadow-sm rounded-2xl uppercase tracking-wider transition-all hover:bg-slate-50">Config</button>
                 </div>
               </div>
               
               {/* BALANCE Y ESTADOS DE CUENTA (ARRIBA) */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 <SummaryCard title="Balance Disponible" amount={balance} colorClass={balance >= 0 ? "text-slate-800" : "text-rose-600"} />
                 <SummaryCard title="Gastos Fijos" amount={totalPendingFixedMonthly} colorClass="text-orange-600" />
                 <SummaryCard title="Ingresos" amount={totalIncome} colorClass="text-emerald-600" />
                 <SummaryCard title="Efectivo Gastado" amount={totalExpense} colorClass="text-rose-600" />
               </div>

               <div className="space-y-5">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldos por Cuenta</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paymentMethodBalances.map(pm => (
                      <div key={pm.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-black text-slate-400 truncate leading-none mb-3 uppercase tracking-tight">{pm.name}</p>
                        <p className={`text-xl font-black leading-tight tracking-tight ${pm.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>${(pm.balance || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
               </div>

               {/* PENDIENTES (DEBAJO) */}
               <Reminders fixedExpenses={fixedExpenses} debts={debts} incomeReminders={incomeReminders} onAction={(v) => {
                 if (v === 'FIXED_EXPENSES') setView('FIXED_EXPENSES');
                 else if (v === 'TRANSACTIONS') setView('TRANSACTIONS');
               }} />

               <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter border-b border-slate-50 pb-6">Actividad Reciente</h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 6).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 truncate text-base leading-tight mb-2 uppercase tracking-tight">{t.description}</p>
                          <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{t.category}</p>
                        </div>
                        <span className={`font-black text-lg tracking-tight ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${(t.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center text-slate-400 py-12 text-sm font-black uppercase tracking-widest italic">No se han registrado movimientos.</p>}
                  </div>
               </div>
             </div>
          )}
          {view === 'FIXED_EXPENSES' && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Gastos Fijos</h2>
                <button onClick={() => setShowFixedExpenseForm(true)} className="bg-orange-600 text-white px-8 py-5 rounded-3xl font-black text-sm shadow-xl shadow-orange-100 uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95">+ NUEVO GASTO</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {fixedExpenses.map(expense => {
                  const paid = isPaidThisMonth(expense.lastPaidDate);
                  return (
                    <div key={expense.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between relative transition-all hover:shadow-md">
                      <button onClick={() => deleteFixedExpense(expense.id)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 font-black text-xs uppercase tracking-tighter p-2">BORRAR</button>
                      <div>
                        <div className="flex justify-between items-start mb-6 pr-14">
                          <span className="text-xs font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-xl uppercase tracking-wider">{expense.category}</span>
                          <span className="text-xs text-slate-400 font-black uppercase tracking-widest border border-slate-100 px-3 py-1.5 rounded-xl">DÍA {expense.dayOfMonth}</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3 leading-tight uppercase truncate">{expense.description}</h3>
                        <p className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">${(expense.amount || 0).toLocaleString()}</p>
                      </div>
                      <button onClick={() => !paid && setExpenseToPay(expense)} disabled={paid} className={`w-full py-6 rounded-3xl font-black text-sm transition-all uppercase tracking-widest shadow-sm ${paid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
                        {paid ? '✓ PAGADO' : 'MARCAR COMO PAGADO'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view === 'SHOPPING_LIST' && <ShoppingList />}
          {view === 'TRANSACTIONS' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Movimientos</h2>
                <button onClick={() => setShowTransactionForm(true)} className="bg-indigo-600 text-white px-8 py-5 rounded-3xl text-sm font-black shadow-xl shadow-indigo-100 uppercase tracking-widest active:scale-95">+ NUEVO</button>
              </div>
              <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-100">
                      <tr><th className="p-8">Fecha</th><th className="p-8">Concepto</th><th className="p-8 text-right">Monto</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-8 text-sm font-black text-slate-400">{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</td>
                          <td className="p-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-base mb-1 uppercase leading-tight">{t.description}</span>
                              <span className="text-xs text-slate-400 uppercase font-black tracking-widest">{t.category}</span>
                            </div>
                          </td>
                          <td className={`p-8 text-right font-black text-lg tracking-tight ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${(t.amount || 0).toLocaleString()}</td>
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

      {/* Botón Flotante Móvil (+) */}
      <button onClick={() => setShowTransactionForm(true)} className="md:hidden fixed bottom-28 right-8 bg-indigo-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center z-[100] border-4 border-white font-black text-4xl hover:bg-indigo-700 active:scale-90 transition-all shadow-indigo-200">+</button>

      {/* Navegación Inferior Móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[140] pb-safe flex items-stretch h-20 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-5 w-full h-full">
          <MobileNavItem viewName="DASHBOARD" label="Inicio" />
          <MobileNavItem viewName="FIXED_EXPENSES" label="Fijos" />
          <MobileNavItem viewName="TRANSACTIONS" label="Movs" />
          <MobileNavItem viewName="SHOPPING_LIST" label="Lista" />
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center justify-center h-full text-slate-400 active:bg-slate-50 transition-colors">
             <span className="text-xs font-black uppercase tracking-tighter">Más</span>
          </button>
        </div>
      </nav>

      {/* Modales */}
      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} paymentMethods={paymentMethods} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={addFixedExpense} onClose={() => setShowFixedExpenseForm(false)} paymentMethods={paymentMethods} />}
      {showDebtForm && <DebtForm onAdd={addDebt} onClose={() => setShowDebtForm(false)} />}
      {showIncomeReminderSettings && <IncomeReminderForm reminders={incomeReminders} onAdd={addIncomeReminder} onRemove={removeIncomeReminder} onClose={() => setShowIncomeReminderSettings(false)} />}
      {showResetModal && <ResetDataModal email={session?.user?.email} onConfirm={resetAllData} onClose={() => setShowResetModal(false)} />}
      {showPaymentMethodManager && <PaymentMethodManager paymentMethods={paymentMethods} onAdd={addPaymentMethod} onRemove={removePaymentMethod} onClose={() => setShowPaymentMethodManager(false)} />}
      {expenseToPay && (
        <PaymentSelectionModal title={expenseToPay.description} amount={expenseToPay.amount} paymentMethods={paymentMethods} onClose={() => setExpenseToPay(null)} onConfirm={(pmId) => markFixedExpenseAsPaid(expenseToPay, pmId)} />
      )}
    </div>
  );
};

export default App;
