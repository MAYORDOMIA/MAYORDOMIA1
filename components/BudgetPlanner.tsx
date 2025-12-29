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
  const [month, setMonth] = useState(nextMonthDate.getMonth() + 1); // 1-12
  const [estimatedIncome, setEstimatedIncome] = useState<string>('');
  const [allocations, setAllocations] = useState<{ [key: string]: string }>({});
  
  // State for managing the list of categories currently being edited
  const [activeCategories, setActiveCategories] = useState<string[]>([]); 
  const [newCategoryName, setNewCategoryName] = useState('');

  // Track the current budget ID to detect month/year changes
  const currentBudgetId = `${year}-${month.toString().padStart(2, '0')}`;

  // Load existing budget if present - only when year, month or the global budgets list truly changes
  useEffect(() => {
    const existingBudget = budgets.find(b => b.id === currentBudgetId);
    
    if (existingBudget) {
      setEstimatedIncome(existingBudget.estimatedIncome.toString());
      const loadedAllocations: { [key: string]: string } = {};
      const loadedCategories = Object.keys(existingBudget.allocations);

      Object.entries(existingBudget.allocations).forEach(([cat, amount]) => {
        loadedAllocations[cat] = amount.toString();
      });
      
      setAllocations(loadedAllocations);
      
      if (loadedCategories.length > 0) {
        setActiveCategories(loadedCategories);
      } else {
        setActiveCategories([...EXPENSE_CATEGORIES]);
      }
    } else {
      // New budget for this month: Start with defaults
      setEstimatedIncome('');
      setAllocations({});
      setActiveCategories([...EXPENSE_CATEGORIES]);
    }
  }, [currentBudgetId, budgets]);

  const handleAllocationChange = (category: string, value: string) => {
    setAllocations(prev => ({ ...prev, [category]: value }));
  };

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName && !activeCategories.includes(trimmedName)) {
      setActiveCategories(prev => [...prev, trimmedName]);
      setNewCategoryName('');
    } else if (activeCategories.includes(trimmedName)) {
      alert('Esta categoría ya existe en tu lista.');
    }
  };

  const handleDeleteCategory = (category: string) => {
    // Removed window.confirm to avoid environment-specific blocks
    // and provide a smoother experience
    setActiveCategories(prev => prev.filter(c => c !== category));
    
    // Also remove from allocations state immediately
    setAllocations(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
    });
  };

  const calculateTotalAllocated = () => {
    // Only count categories that are actually in activeCategories
    return activeCategories.reduce((acc, cat) => {
      const val = allocations[cat];
      return acc + (parseFloat(val) || 0);
    }, 0);
  };

  const handleSave = () => {
    const income = parseFloat(estimatedIncome);
    if (!income && income !== 0) {
      alert('Por favor, ingresa un monto de ingreso válido.');
      return;
    }

    const numericAllocations: { [key: string]: number } = {};
    
    // Only save allocations for categories that are currently active in the list
    activeCategories.forEach(cat => {
        const val = allocations[cat];
        numericAllocations[cat] = val ? parseFloat(val) : 0;
    });

    const newBudget: Budget = {
      id: currentBudgetId,
      year,
      month,
      estimatedIncome: income,
      allocations: numericAllocations
    };

    onSave(newBudget);
    alert('¡Presupuesto guardado correctamente!');
  };

  const totalAllocated = calculateTotalAllocated();
  const incomeNum = parseFloat(estimatedIncome) || 0;
  const remaining = incomeNum - totalAllocated;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-20 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Planificador de Presupuesto</h2>
              <p className="text-sm text-slate-500">Define tus prioridades cada mes.</p>
            </div>
            
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg">
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-transparent font-medium text-slate-700 py-1 px-2 outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-transparent font-medium text-slate-700 py-1 px-2 outline-none cursor-pointer"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Ingreso Mensual Estimado</label>
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                className="w-full pl-8 pr-4 py-3 text-lg font-bold text-emerald-600 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="0.00"
                value={estimatedIncome}
                onChange={(e) => setEstimatedIncome(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-4">
               <h3 className="font-bold text-slate-700">Asignación de Gastos</h3>
               <span className="text-xs text-slate-500">Elimina las categorías que no uses.</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCategories.map(cat => (
                <div key={cat} className="flex items-center gap-2 group">
                    <div className="flex-1 relative flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                      <label className="flex-1 text-sm font-medium text-slate-600 cursor-pointer truncate" htmlFor={`cat-${cat}`}>{cat}</label>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                        <input
                          id={`cat-${cat}`}
                          type="number"
                          className="w-full pl-5 pr-2 py-1.5 text-right text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                          placeholder="0"
                          value={allocations[cat] || ''}
                          onChange={(e) => handleAllocationChange(cat, e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-3 bg-white text-slate-300 hover:text-rose-600 border border-slate-100 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                        title="Eliminar categoría"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
              ))}
            </div>

            {/* Add New Category Section */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col md:flex-row gap-3 items-end md:items-center">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-indigo-800 mb-1">Agregar Nueva Categoría</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Mantenimiento Auto"
                        className="w-full px-4 py-2 rounded-lg border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                </div>
                <button 
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors h-10"
                >
                    + Agregar
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
         <div className={`p-6 rounded-xl border shadow-sm sticky top-6 ${remaining < 0 ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
           <h3 className="font-bold text-slate-800 mb-4">Resumen del Plan</h3>
           
           <div className="space-y-3 text-sm">
             <div className="flex justify-between">
               <span className="text-slate-500">Ingreso Estimado</span>
               <span className="font-bold text-emerald-600">${incomeNum.toLocaleString()}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Total Asignado</span>
               <span className="font-bold text-slate-700">${totalAllocated.toLocaleString()}</span>
             </div>
             <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
               <span className="font-medium text-slate-700">Restante</span>
               <span className={`text-xl font-bold ${remaining < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                 ${remaining.toLocaleString()}
               </span>
             </div>
           </div>

           {remaining < 0 && (
             <div className="mt-4 p-3 bg-rose-100 text-rose-800 rounded-lg text-xs flex items-start gap-2">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p>¡Cuidado! Estás gastando más de lo que ingresas. Reduce gastos en categorías no esenciales.</p>
             </div>
           )}

           {remaining > 0 && (
             <div className="mt-4 p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs flex items-start gap-2">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               <p>¡Buen trabajo! Tienes un excedente. Considera asignarlo a "Ahorro" o "Deudas" para que cada centavo tenga un propósito.</p>
             </div>
           )}

           <button
             type="button"
             onClick={handleSave}
             className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
           >
             Guardar Presupuesto
           </button>
         </div>

         <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               Consejo
            </h4>
            <p className="text-sm text-amber-800 leading-relaxed">
               El presupuesto no es para restringirte, sino para darte libertad. Cuando le dices a tu dinero a dónde ir, dejas de preguntarte a dónde se fue. Prioriza el diezmo, luego necesidades básicas, y finalmente deseos.
            </p>
         </div>
      </div>
    </div>
  );
};