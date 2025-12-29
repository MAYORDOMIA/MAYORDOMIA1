
import React, { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../types';

interface FixedExpenseFormProps {
  onAdd: (description: string, amount: number, category: string, dayOfMonth: number) => void;
  onClose: () => void;
}

export const FixedExpenseForm: React.FC<FixedExpenseFormProps> = ({ onAdd, onClose }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [dayOfMonth, setDayOfMonth] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd(description, parseFloat(amount), category, parseInt(dayOfMonth));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0 safe-top">
          <h3 className="font-semibold text-lg">Nuevo Gasto Fijo</h3>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            Registra gastos recurrentes (ej. Alquiler, Luz) para recordatorios y proyecciones.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Monto Mensual</label>
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
              placeholder="Ej: Internet Fibra Óptica"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-slate-600 mb-2">Categoría</label>
              <div className="relative">
                <select
                  className="w-full px-3 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-2">Día Pago</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                className="w-full px-3 py-4 text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
             <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-100"
            >
              Guardar Gasto Fijo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
