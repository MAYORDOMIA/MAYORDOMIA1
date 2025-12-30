
import React from 'react';
import { PaymentMethod, PaymentMethodType } from '../types';

interface PaymentSelectionModalProps {
  title: string;
  amount: number;
  paymentMethods: PaymentMethod[];
  onConfirm: (paymentMethodId: string) => void;
  onClose: () => void;
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({ title, amount, paymentMethods, onConfirm, onClose }) => {
  const getTypeLabel = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.CARD: return 'TARJETA';
      case PaymentMethodType.WALLET: return 'WALLET';
      default: return 'EFECTIVO';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Confirmar Pago</p>
          <h3 className="text-lg font-black uppercase tracking-tight truncate">{title}</h3>
          <p className="text-2xl font-black mt-2 text-emerald-300">${amount.toLocaleString()}</p>
        </div>

        <div className="p-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Seleccionar Método:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => onConfirm(pm.id)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-2xl transition-all"
              >
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{pm.name}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase">{getTypeLabel(pm.type)}</p>
                </div>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">ELEGIR</span>
              </button>
            ))}
            
            {paymentMethods.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-[10px] font-black uppercase">Sin métodos</p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};
