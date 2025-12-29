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
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-semibold text-lg">Recordatorios de Ingreso</h3>
          <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-800 italic">
            "El obrero es digno de su salario" (1 Timoteo 5:18). Configura los días que sueles recibir dinero para que no olvides registrarlo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Ej: Quincena, Freelance..."
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Día"
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                +
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {reminders.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No tienes fechas programadas.</p>
            )}
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-700">{r.description}</p>
                  <p className="text-xs text-slate-500">Día {r.dayOfMonth} de cada mes</p>
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};