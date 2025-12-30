
import React, { useState } from 'react';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PaymentMethod } from '../types';

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
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id || '');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === TransactionType.INCOME ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd(description, parseFloat(amount), type, category, paymentMethodId);
    onClose();
  };

  const currentCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center">
      <div className="bg-white w-full h-[92vh] md:h-auto md:max-w-md md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up rounded-t-3xl">
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white shrink-0 pt-safe">
          <h3 className="font-black text-xl tracking-tight">Nueva Operación</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-black text-xs uppercase">
             CERRAR
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto pb-safe">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => handleTypeChange(TransactionType.INCOME)}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            >
              Gasto
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Importe</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-2xl font-black">$</span>
              <input
                type="number"
                step="0.01"
                required
                inputMode="decimal"
                className="w-full pl-12 pr-6 py-5 text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Concepto</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold"
              placeholder="¿En qué lo usaste?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
              <select
                className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none transition-all font-bold text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Método</label>
              <select
                className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none transition-all font-bold text-sm"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                <option value="">Ninguno</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-4">
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-sm">
                Confirmar Registro
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
