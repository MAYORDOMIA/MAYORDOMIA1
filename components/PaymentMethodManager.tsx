
import React, { useState } from 'react';
import { PaymentMethod, PaymentMethodType } from '../types';

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  onAdd: (name: string, type: PaymentMethodType) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ paymentMethods, onAdd, onRemove, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>(PaymentMethodType.WALLET);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, type);
    setName('');
  };

  const getTypeLabel = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.CARD: return 'TARJETA';
      case PaymentMethodType.WALLET: return 'WALLET';
      default: return 'EFECTIVO';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <h3 className="font-black text-lg uppercase tracking-widest">Cuentas</h3>
          <button onClick={onClose} className="font-black text-[10px] uppercase opacity-80">CERRAR</button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <input
              type="text"
              placeholder="NOMBRE (EJ: VISA)"
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none font-black text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PaymentMethodType).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-tighter ${type === t ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
                >
                  {getTypeLabel(t)}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
            >
              AGREGAR
            </button>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">{pm.name}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{getTypeLabel(pm.type)}</p>
                </div>
                <button
                  onClick={() => onRemove(pm.id)}
                  className="text-[9px] font-black text-rose-400 uppercase tracking-widest"
                >
                  QUITAR
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
