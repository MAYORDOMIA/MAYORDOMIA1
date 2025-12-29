
import React, { useState, useEffect } from 'react';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PaymentMethod, PaymentMethodType } from '../types';

interface TransactionFormProps {
  onAdd: (description: string, amount: number, type: TransactionType, category: string, paymentMethodId?: string) => void;
  onClose: () => void;
  paymentMethods: PaymentMethod[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose, paymentMethods }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efecto para inicializar el método de pago por defecto (Efectivo)
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const cashMethod = paymentMethods.find(m => m.type === PaymentMethodType.CASH);
      // Si hay efectivo, lo ponemos por defecto si aún no hay nada seleccionado
      if (cashMethod && !paymentMethodId) {
        setPaymentMethodId(cashMethod.id);
      } else if (!paymentMethodId) {
        // Si no hay efectivo, el primero de la lista
        setPaymentMethodId(paymentMethods[0].id);
      }
    }
  }, [paymentMethods, paymentMethodId]);

  // Efecto para cambiar categoría por defecto al cambiar tipo
  useEffect(() => {
    if (type === TransactionType.INCOME) {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) return alert("Ingresa un monto válido mayor a cero.");
    if (!description.trim()) return alert("Ingresa un detalle para el movimiento.");
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Asegurar que si paymentMethodId sigue vacío, intente buscar el efectivo
      let finalPmId = paymentMethodId;
      if (!finalPmId) {
        finalPmId = paymentMethods.find(m => m.type === PaymentMethodType.CASH)?.id || '';
      }
      
      await onAdd(description, cleanAmount, type, category, finalPmId);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Error al procesar: " + (err.message || "Fallo desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-[92vh] md:h-auto md:max-w-md md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-fade-in-up rounded-t-[40px]">
        <div className="bg-slate-800 p-6 flex justify-between items-center text-white shrink-0">
          <h3 className="font-black text-xl tracking-tight">Nueva Operación</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-3xl">
            <button
              type="button"
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setType(TransactionType.INCOME)}
            >
              Recibir Dinero
            </button>
            <button
              type="button"
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setType(TransactionType.EXPENSE)}
            >
              Gastar Dinero
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Monto de la Operación</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-3xl font-black">$</span>
              <input
                type="number"
                step="0.01"
                required
                inputMode="decimal"
                className="w-full pl-14 pr-6 py-6 text-4xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500/20 focus:bg-white outline-none transition-all"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Concepto / Detalle</label>
            <input
              type="text"
              required
              className="w-full px-6 py-5 text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500/20 focus:bg-white outline-none transition-all font-bold"
              placeholder="¿Qué ocurrió?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
              <select
                className="w-full px-5 py-5 text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500/20 outline-none appearance-none transition-all font-bold text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">¿De dónde sale?</label>
              <select
                className="w-full px-5 py-5 text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500/20 outline-none appearance-none transition-all font-bold text-sm"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {paymentMethods.length === 0 && <option value="">Cargando cuentas...</option>}
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} {pm.type === 'CASH' ? '💰' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-4 pb-8">
             <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl transition-all shadow-2xl uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
             >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : 'Confirmar Registro'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
