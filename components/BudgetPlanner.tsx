
import React, { useState, useEffect } from 'react';
import { Budget, EXPENSE_CATEGORIES } from '../types';

interface BudgetPlannerProps {
  budgets: Budget[];
  onSave: (budget: Budget) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ budgets, onSave }) => {
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const [year, setYear] = useState(nextMonthDate.getFullYear());
  const [month, setMonth] = useState(nextMonthDate.getMonth() + 1);
  const [estimatedIncome, setEstimatedIncome] = useState<string>('');
  const [allocations, setAllocations] = useState<{ [key: string]: string }>({});
  const [activeCategories, setActiveCategories] = useState<string[]>([]); 
  const [newCategoryName, setNewCategoryName] = useState('');

  const currentBudgetId = `${year}-${month.toString().padStart(2, '0')}`;

  useEffect(() => {
    const existingBudget = budgets.find(b => b.id === currentBudgetId);
    if (existingBudget) {
      setEstimatedIncome(existingBudget.estimatedIncome?.toString() || '');
      const loadedAllocations: { [key: string]: string } = {};
      const safeAllocations = existingBudget.allocations || {};
      Object.entries(safeAllocations).forEach(([cat, amount]) => {
        loadedAllocations[cat] = amount?.toString() || '0';
      });
      setAllocations(loadedAllocations);
      setActiveCategories(Object.keys(safeAllocations).length > 0 ? Object.keys(safeAllocations) : [...EXPENSE_CATEGORIES]);
    } else {
      setEstimatedIncome('');
      setAllocations({});
      setActiveCategories([...EXPENSE_CATEGORIES]);
    }
  }, [currentBudgetId, budgets]);

  const handleAllocationChange = (category: string, value: string) => {
    setAllocations(prev => ({ ...prev, [category]: value }));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !activeCategories.includes(trimmed)) {
      setActiveCategories(prev => [...prev, trimmed]);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (category: string) => {
    setActiveCategories(prev => prev.filter(c => c !== category));
    setAllocations(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
    });
  };

  const totalAllocated = activeCategories.reduce((acc, cat) => acc + (parseFloat(allocations[cat]) || 0), 0);
  const incomeNum = parseFloat(estimatedIncome) || 0;
  const remaining = incomeNum - totalAllocated;

  const handleSave = () => {
    const income = parseFloat(estimatedIncome);
    if (isNaN(income)) return alert('Ingresa un ingreso válido');
    const numericAllocations: { [key: string]: number } = {};
    activeCategories.forEach(cat => numericAllocations[cat] = parseFloat(allocations[cat]) || 0);
    onSave({ id: currentBudgetId, year, month, estimatedIncome: income, allocations: numericAllocations });
    alert('¡Presupuesto guardado!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-black text-slate-800">Plan Mensual</h2>
            <div className="text-right max-w-[200px]">
              <p className="text-[10px] font-bold text-slate-400 italic">"Los pensamientos del diligente ciertamente tienden a la abundancia." - Prov. 21:5</p>
            </div>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="flex-1 bg-white rounded-lg py-2 px-2 text-sm font-bold shadow-sm outline-none">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-24 bg-white rounded-lg py-2 px-2 text-sm font-bold shadow-sm outline-none">
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingreso Estimado</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-xl font-black">$</span>
            <input
              type="number"
              inputMode="decimal"
              className="w-full pl-10 pr-4 py-4 text-2xl font-black text-emerald-600 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none"
              placeholder="0.00"
              value={estimatedIncome}
              onChange={(e) => setEstimatedIncome(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {activeCategories.map(cat => (
            <div key={cat} className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700 truncate mr-2">{cat}</span>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full pl-7 pr-3 py-2 text-right font-black text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm"
                    placeholder="0"
                    value={allocations[cat] || ''}
                    onChange={(e) => handleAllocationChange(cat, e.target.value)}
                  />
                </div>
              </div>
              <button onClick={() => handleDeleteCategory(cat)} className="p-4 text-slate-300 active:text-rose-500 font-bold text-xs">X</button>
            </div>
          ))}
          
          <div className="pt-4 border-t border-slate-100 mt-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nueva categoría..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button onClick={handleAddCategory} className="bg-slate-800 text-white px-5 py-3 rounded-xl font-black text-lg">+</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl shadow-xl border-4 ${remaining < 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-900 border-indigo-600'} text-white`}>
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restante para asignar</p>
            <h3 className={`text-3xl font-black ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${remaining.toLocaleString()}</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total asignado</p>
            <p className="text-lg font-bold">${totalAllocated.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={handleSave} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform">Guardar Plan Mensual</button>
      </div>
    </div>
  );
};
