import React, { useState } from 'react';

interface DebtFormProps {
  onAdd: (name: string, amount: number, rate: number, minPayment: number, dayOfMonth: number) => void;
  onClose: () => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    onAdd(
        name, 
        parseFloat(amount), 
        parseFloat(rate) || 0, 
        parseFloat(minPayment) || 0,
        parseInt(dayOfMonth) || 1
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0 safe-top">
          <h3 className="font-semibold text-lg">Registrar Deuda</h3>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          <p className="text-sm text-slate-500 bg-rose-50 p-3 rounded-lg border border-rose-100 text-rose-800">
            "No debáis a nadie nada..." (Romanos 13:8). Identificar al enemigo es el primer paso para vencerlo.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Nombre de la Deuda</label>
            <input
              type="text"
              required
              className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Tarjeta de Crédito Visa"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Monto Total Adeudado</label>
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

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tasa Interés (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="0%"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Día de Pago</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Día del mes"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Pago Mínimo Sugerido</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-6 pr-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Opcional"
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value)}
                />
            </div>
          </div>

          <div className="pt-4">
             <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-rose-200"
            >
              Registrar Deuda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};