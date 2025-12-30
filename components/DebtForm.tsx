
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
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white shrink-0">
          <h3 className="font-black text-lg uppercase tracking-tight">Registrar Deuda</h3>
          <button onClick={onClose} className="text-slate-400 font-black text-xs uppercase">CERRAR</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
            <input
              type="text"
              required
              className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
              placeholder="Ej: Banco"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto Total</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-black">$</span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-4 text-xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasa (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Día Pago</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  className="w-full px-4 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                />
             </div>
          </div>

          <div className="pt-4">
             <button
              type="submit"
              className="w-full bg-rose-600 text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-xs"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
