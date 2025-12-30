
import React, { useState } from 'react';
import { IncomeReminder } from '../types';

interface IncomeReminderFormProps {
  reminders: IncomeReminder[];
  onAdd: (description: string, day: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const IncomeReminderForm: React.FC<IncomeReminderFormProps> = ({ reminders, onAdd, onRemove, onClose }) => {
  const [description, setDescription] = useState('');
  const [day, setDay] = useState('15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !day) return;
    onAdd(description, parseInt(day));
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <h3 className="font-black text-lg uppercase tracking-tight">Recordatorios</h3>
          <button onClick={onClose} className="font-black text-xs uppercase opacity-80">CERRAR</button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nombre (ej: Salario)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Día"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-black text-center"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
              >
                Añadir
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.description}</p>
                  <p className="text-[9px] font-bold text-slate-400">DÍA {r.dayOfMonth}</p>
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-[9px] font-black text-rose-400 uppercase tracking-widest"
                >
                  QUITAR
                </button>
              </div>
            ))}
            {reminders.length === 0 && <p className="text-center text-slate-400 text-[10px] font-black uppercase py-4">VACÍO</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
