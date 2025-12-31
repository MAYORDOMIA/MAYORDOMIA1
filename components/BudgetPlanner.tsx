
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

  // Uso de String() para prevenir errores si month fuese undefined
  const currentBudgetId = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    const existingBudget = budgets.find(b => b.id === currentBudgetId);
    if (existingBudget) {
      setEstimatedIncome(existingBudget.estimatedIncome != null ? String(existingBudget.estimatedIncome) : '');
      const loadedAllocations: { [key: string]: string } = {};
      
      if (existingBudget.allocations && typeof existingBudget.allocations === 'object') {
        Object.entries(existingBudget.allocations).forEach(([cat, amount]) => {
          loadedAllocations[cat] = amount != null ? String(amount) : '0';
        });
      }
      
      setAllocations(loadedAllocations);
      setActiveCategories(Object.keys(loadedAllocations).length > 0 ? Object.keys(loadedAllocations) : [...EXPENSE_CATEGORIES]);
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
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto px-4 md:px-0">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-6 mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Plan Mensual</h2>
          <div className="flex gap-3 bg-slate-100 p-2 rounded-2xl">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="flex-1 bg-white rounded-xl py-3 px-4 text-sm font-bold shadow-sm outline-none appearance-none">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-32 bg-white rounded-xl py-3 px-4 text-sm font-bold shadow-sm outline-none appearance-none">
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            </select>
          </div>
        </div>

        <div className="mb-10">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Ingreso Estimado</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400 text-2xl font-black">$</span>
            <input
              type="number"
              inputMode="decimal"
              className="w-full pl-12 pr-6 py-5 text-3xl font-black text-emerald-600 bg-emerald-50/20 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              placeholder="0.00"
              value={estimatedIncome}
              onChange={(e) => setEstimatedIncome(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Distribución de Gastos</label>
          {activeCategories.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <div className="flex-1 flex items-center justify-between p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700 truncate mr-4">{cat}</span>
                <div className="relative w-32">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full pl-8 pr-4 py-3 text-right font-black text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-base"
                    placeholder="0"
                    value={allocations[cat] || ''}
                    onChange={(e) => handleAllocationChange(cat, e.target.value)}
                  />
                </div>
              </div>
              <button onClick={() => handleDeleteCategory(cat)} className="p-3 text-rose-300 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest transition-colors">BORRAR</button>
            </div>
          ))}
          
          <div className="pt-6 border-t border-slate-100 mt-8">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="NUEVA CATEGORÍA..."
                className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 transition-colors uppercase"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button onClick={handleAddCategory} className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-xl hover:bg-slate-900 transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-3xl shadow-2xl border-4 transition-all duration-300 ${remaining < 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-900 border-indigo-600'} text-white`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Restante por asignar</p>
            <h3 className={`text-4xl font-black ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'} tracking-tighter`}>
              ${remaining.toLocaleString()}
            </h3>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total asignado</p>
            <p className="text-2xl font-black tracking-tight text-white/90">
              ${totalAllocated.toLocaleString()}
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-50 active:scale-[0.98] transition-all">
          GUARDAR PLAN MENSUAL
        </button>
      </div>
    </div>
  );
};
