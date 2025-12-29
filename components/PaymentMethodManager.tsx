
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(name, type);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.CARD:
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case PaymentMethodType.WALLET:
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      default:
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7" /></svg>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up border border-slate-100">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <h3 className="font-black text-lg uppercase tracking-tight">Mis Billeteras y Tarjetas</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Método</label>
              <input
                type="text"
                placeholder="Ej: Mercado Pago, Visa Oro..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Cuenta</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: PaymentMethodType.CASH, label: 'Efectivo' },
                  { id: PaymentMethodType.CARD, label: 'Tarjeta' },
                  { id: PaymentMethodType.WALLET, label: 'Billetera' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${type === t.id ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  >
                    {getIcon(t.id)}
                    <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Agregar Método'}
            </button>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Configurados actualmente</h4>
            {paymentMethods.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Sin cuentas registradas</p>
              </div>
            )}
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                    {getIcon(pm.type)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-none mb-1">{pm.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-tight">
                      {pm.type === 'CASH' ? 'Dinero Físico' : pm.type === 'CARD' ? 'Tarjeta Bancaria' : 'Billetera Virtual'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(pm.id)}
                  className="text-slate-200 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
