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
  // Initialize with first item of respective category list
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === TransactionType.INCOME) {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd(description, parseFloat(amount), type, category);
    onClose();
  };

  const currentCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0 safe-top">
          <h3 className="font-semibold text-lg">Nueva Transacción</h3>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="flex gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 ring-1 ring-emerald-100' : 'text-slate-500 hover:bg-slate-200 shadow-none'}`}
              onClick={() => handleTypeChange(TransactionType.INCOME)}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 ring-1 ring-rose-100' : 'text-slate-500 hover:bg-slate-200 shadow-none'}`}
              onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            >
              Gasto
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-4 text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Descripción</label>
            <input
              type="text"
              required
              className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Categoría</label>
            <div className="relative">
              <select
                className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
             <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200"
              >
                Guardar Transacción
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};