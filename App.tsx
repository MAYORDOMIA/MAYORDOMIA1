
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Debt, ViewState, TransactionType, FixedExpense, Budget, IncomeReminder, PaymentMethod, PaymentMethodType } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FixedExpenseForm } from './components/FixedExpenseForm';
import { SummaryCard } from './components/SummaryCard';
import { BiblicalAdvisor } from './components/BiblicalAdvisor';
import { Reminders } from './components/Reminders';
import { PaymentMethodManager } from './components/PaymentMethodManager';
import { PaymentSelectionModal } from './components/PaymentSelectionModal';
import { ResetDataModal } from './components/ResetDataModal';
import { ShoppingList } from './components/ShoppingList';
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>([]);
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [showPaymentMethodManager, setShowPaymentMethodManager] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [expenseToPay, setExpenseToPay] = useState<FixedExpense | null>(null);

  const fetchAllData = useCallback(async (currentSession?: any) => {
    const user = currentSession?.user || session?.user;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const [tRes, dRes, fRes, bRes, iRes, pmRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('fixed_expenses').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('income_reminders').select('*').eq('user_id', user.id),
        supabase.from('payment_methods').select('*').eq('user_id', user.id)
      ]);

      let methods = pmRes.data || [];
      
      const cashMethod = methods.find(m => m.type === PaymentMethodType.CASH);
      if (!cashMethod) {
        const { data: newCash } = await supabase.from('payment_methods').insert([{
          name: 'Efectivo',
          type: PaymentMethodType.CASH,
          user_id: user.id
        }]).select();
        
        if (newCash) {
          methods = [...methods, newCash[0]];
        }
      }

      setPaymentMethods(methods);
      if (tRes.data) setTransactions(tRes.data);
      
      if (dRes.data) setDebts(dRes.data.map((item: any) => ({
        id: item.id, name: item.name, totalAmount: item.total_amount,
        currentBalance: item.current_balance, interestRate: item.interest_rate,
        minPayment: item.min_payment, dayOfMonth: item.day_of_month, lastPaymentDate: item.last_payment_date
      })));

      if (fRes.data) setFixedExpenses(fRes.data.map((item: any) => ({
        id: item.id, description: item.description, amount: item.amount,
        category: item.category, dayOfMonth: item.day_of_month,
        lastPaidDate: item.last_paid_date, lastTransactionId: item.last_transaction_id,
        payment_method_id: item.payment_method_id
      })));

      if (bRes.data) setBudgets(bRes.data.map((item: any) => ({
        id: item.id, year: item.year, month: item.month,
        estimatedIncome: item.estimated_income, allocations: item.allocations
      })));

      if (iRes.data) setIncomeReminders(iRes.data.map((item: any) => ({
        id: item.id, description: item.description, dayOfMonth: item.day_of_month,
        lastRegisteredDate: item.last_registered_date
      })));
    } catch (err) {
      console.error("Error crítico de carga:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchAllData(s);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchAllData(newSession);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  const handleResetAllData = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Borramos de todas las tablas relacionadas al usuario
      const tables = ['transactions', 'fixed_expenses', 'debts', 'budgets', 'income_reminders', 'payment_methods'];
      
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', session.user.id);
        if (error) throw error;
      }
      
      // Recargar para que se cree la cuenta de efectivo por defecto y todo quede en cero
      await fetchAllData(session);
      setView('DASHBOARD');
      alert("Todos tus datos han sido eliminados correctamente.");
    } catch (err: any) {
      console.error("Error al reiniciar datos:", err);
      alert("Hubo un error al intentar borrar los datos: " + err.message);
    }
  };

  const addTransaction = async (description: string, amount: number, type: TransactionType, category: string, paymentMethodId?: string) => {
    if (!session?.user?.id) return;
    
    let pmId = (paymentMethodId && paymentMethodId.trim().length > 10) ? paymentMethodId : null;
    
    if (!pmId) {
      const cash = paymentMethods.find(m => m.type === PaymentMethodType.CASH);
      pmId = cash?.id || null;
    }

    const { data, error } = await supabase.from('transactions').insert([{
      description: description.trim(), 
      amount, 
      type, 
      category, 
      date: new Date().toISOString(), 
      user_id: session.user.id, 
      payment_method_id: pmId
    }]).select();
    
    if (error) {
      console.error("Error Supabase:", error);
      const msg = error.message || error.details || "Fallo desconocido.";
      return alert(`Error: ${msg}`);
    }

    if (data) {
      setTransactions(prev => [data[0], ...prev]);
      fetchAllData(session);
    }
  };

  const isPaidThisMonth = useCallback((dateString?: string) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }, []);

  const markFixedExpenseAsPaid = async (expense: FixedExpense, paymentMethodId: string) => {
    if (!session?.user?.id) return;

    try {
      const { data: tData, error: tError } = await supabase.from('transactions').insert([{
        description: `Pago: ${expense.description}`,
        amount: expense.amount,
        type: TransactionType.EXPENSE,
        category: expense.category,
        date: new Date().toISOString(),
        user_id: session.user.id,
        payment_method_id: paymentMethodId
      }]).select();

      if (tError) throw tError;

      const { error: fError } = await supabase.from('fixed_expenses').update({
        last_paid_date: new Date().toISOString(),
        last_transaction_id: tData?.[0]?.id
      }).eq('id', expense.id);

      if (fError) throw fError;

      setExpenseToPay(null);
      await fetchAllData(session);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const totalIncome = useMemo(() => transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;

  const paymentMethodBalances = useMemo(() => {
    return paymentMethods.map(pm => {
      const pmTransactions = transactions.filter(t => t.payment_method_id === pm.id);
      const inc = pmTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const exp = pmTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      return { ...pm, balance: inc - exp };
    });
  }, [paymentMethods, transactions]);

  const cashBalance = useMemo(() => paymentMethodBalances.find(m => m.type === PaymentMethodType.CASH)?.balance || 0, [paymentMethodBalances]);

  if (!session && !loading) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const getPMIcon = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.CASH: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>;
      case PaymentMethodType.CARD: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case PaymentMethodType.WALLET: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      <aside className="bg-white w-full md:w-64 border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">Mayordomía</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-rose-500 transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('DASHBOARD')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'DASHBOARD' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Dashboard</button>
          <button onClick={() => setView('FIXED_EXPENSES')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'FIXED_EXPENSES' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Gastos Fijos</button>
          <button onClick={() => setView('TRANSACTIONS')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'TRANSACTIONS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Movimientos</button>
          <button onClick={() => setView('SHOPPING_LIST')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'SHOPPING_LIST' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Lista Mandado</button>
          <button onClick={() => setView('ADVISOR')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'ADVISOR' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Consejero IA</button>
          <button onClick={() => setView('SETTINGS')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors ${view === 'SETTINGS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Ajustes</button>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <button onClick={() => setShowPaymentMethodManager(true)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black w-full text-indigo-600 hover:bg-indigo-50 uppercase tracking-widest">Cuentas y Efectivo</button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen pb-24 md:pb-8">
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {view === 'DASHBOARD' && (
            <>
              <Reminders fixedExpenses={fixedExpenses} debts={debts} incomeReminders={incomeReminders} onAction={(v) => setView(v)} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-slate-900 rounded-[32px] p-6 text-white shadow-xl flex flex-col justify-between border-b-4 border-indigo-500">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Efectivo en Mano</span>
                    <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black">${cashBalance.toLocaleString()}</h3>
                  <p className="text-[9px] text-slate-400 mt-2 italic">"Paga a todos lo que debéis..." - Rom 13:7</p>
                </div>
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <SummaryCard title="Balance Total" amount={balance} colorClass="text-slate-800" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                  <SummaryCard title="Ingresos Mes" amount={totalIncome} colorClass="text-emerald-600" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>} />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  Otras Cuentas y Saldos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {paymentMethodBalances.filter(m => m.type !== PaymentMethodType.CASH).map(pm => (
                    <div key={pm.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">{getPMIcon(pm.type)}</div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-tighter">{pm.name}</p>
                        <p className={`text-sm font-black ${pm.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>${pm.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {paymentMethodBalances.filter(m => m.type !== PaymentMethodType.CASH).length === 0 && (
                    <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 text-[10px] font-black uppercase tracking-widest">No hay tarjetas registradas</div>
                  )}
                </div>
              </div>
            </>
          )}

          {view === 'FIXED_EXPENSES' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Gastos Fijos</h2>
                <button onClick={() => setShowFixedExpenseForm(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">+ Nuevo</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {fixedExpenses.map(expense => {
                  const paid = isPaidThisMonth(expense.lastPaidDate);
                  return (
                    <div key={expense.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block">{expense.category}</span>
                        <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight">{expense.description}</h3>
                        <p className="text-2xl font-black text-slate-900 mb-6">${expense.amount.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => !paid && setExpenseToPay(expense)} 
                        disabled={paid}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${paid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white shadow-xl'}`}
                      >
                        {paid ? '✓ Pagado' : 'Elegir Cuenta y Pagar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'TRANSACTIONS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Movimientos</h2>
                <button onClick={() => setShowTransactionForm(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">+ Nueva Operación</button>
              </div>
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <tr><th className="p-5">Fecha</th><th className="p-5">Detalle</th><th className="p-5 text-right">Monto</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(t => {
                      const pm = paymentMethods.find(m => m.id === t.payment_method_id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-5 text-[11px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-5">
                            <span className="font-black text-slate-800 block leading-tight">{t.description}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                               <div className={`w-1.5 h-1.5 rounded-full ${pm?.type === PaymentMethodType.CASH ? 'bg-emerald-500' : 'bg-indigo-400'}`}></div>
                               <span className="text-[9px] text-slate-400 font-bold uppercase">{pm?.name || 'Efectivo'}</span>
                            </div>
                          </td>
                          <td className={`p-5 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No hay movimientos registrados</div>
                )}
              </div>
            </div>
          )}

          {view === 'SHOPPING_LIST' && <ShoppingList />}

          {view === 'ADVISOR' && <BiblicalAdvisor transactions={transactions} debts={debts} fixedExpenses={fixedExpenses} budgets={budgets} />}

          {view === 'SETTINGS' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-800">Ajustes del Perfil</h2>
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuenta Activa</p>
                    <p className="text-lg font-black text-slate-800">{session?.user?.email}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Zona de Peligro</h3>
                  <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
                    <h4 className="font-black text-rose-800 text-sm mb-2">Borrar todos mis datos</h4>
                    <p className="text-rose-700 text-xs leading-relaxed mb-6">Esta acción eliminará permanentemente todos tus movimientos, deudas, presupuestos y cuentas configuradas. No se puede deshacer.</p>
                    <button 
                      onClick={() => setShowResetModal(true)}
                      className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all"
                    >
                      Borrar Todo Definitivamente
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full py-5 border-2 border-slate-200 rounded-[32px] text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </main>

      <button onClick={() => setShowTransactionForm(true)} className="md:hidden fixed bottom-24 right-6 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform active:scale-90"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>

      {showTransactionForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowTransactionForm(false)} paymentMethods={paymentMethods} />}
      {showFixedExpenseForm && <FixedExpenseForm onAdd={(d, a, c, dom, pm) => {
        if (!session?.user?.id) return;
        const finalPmId = (pm && pm.trim().length > 10) ? pm : null;
        supabase.from('fixed_expenses').insert([{ description: d, amount: a, category: c, day_of_month: dom, user_id: session.user.id, payment_method_id: finalPmId }]).then(({error}) => {
          if (error) alert("Error al guardar: " + error.message);
          setShowFixedExpenseForm(false);
          fetchAllData(session);
        });
      }} onClose={() => setShowFixedExpenseForm(false)} paymentMethods={paymentMethods} />}
      
      {showPaymentMethodManager && <PaymentMethodManager 
        paymentMethods={paymentMethods} 
        onAdd={async (n, t) => {
          const { error } = await supabase.from('payment_methods').insert([{ name: n, type: t, user_id: session.user.id }]).select();
          if (error) alert("Error: " + error.message);
          else fetchAllData(session);
        }} 
        onRemove={(id) => {
          const pm = paymentMethods.find(m => m.id === id);
          const cashCount = paymentMethods.filter(m => m.type === PaymentMethodType.CASH).length;
          if (pm?.type === PaymentMethodType.CASH && cashCount <= 1) {
            return alert("No puedes eliminar la única cuenta de Efectivo, el sistema la necesita.");
          }
          supabase.from('payment_methods').delete().eq('id', id).then(() => fetchAllData(session));
        }} 
        onClose={() => setShowPaymentMethodManager(false)} 
      />}
      
      {expenseToPay && (
        <PaymentSelectionModal 
          title={expenseToPay.description} 
          amount={expenseToPay.amount} 
          paymentMethods={paymentMethods} 
          onClose={() => setExpenseToPay(null)} 
          onConfirm={(pmId) => markFixedExpenseAsPaid(expenseToPay, pmId)} 
        />
      )}

      {showResetModal && (
        <ResetDataModal 
          email={session?.user?.email || ''} 
          onConfirm={handleResetAllData} 
          onClose={() => setShowResetModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
