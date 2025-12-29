
import React, { useState } from 'react';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

interface TransactionFormProps {
  onAdd: (description: string, amount: number, type: TransactionType, category: string) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === TransactionType.INCOME ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd(description, parseFloat(amount), type, category);
    onClose();
  };

  const currentCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center">
      <div className="bg-white w-full h-[92vh] md:h-auto md:max-w-md md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up rounded-t-3xl">
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white shrink-0 pt-safe">
          <h3 className="font-black text-xl tracking-tight">Nueva Operación</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
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

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
            <div className="relative">
              <select
                className="w-full px-5 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none transition-all font-bold"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
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
