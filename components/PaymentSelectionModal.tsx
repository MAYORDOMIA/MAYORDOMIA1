
import React, { useState } from 'react';
import { PaymentMethod, PaymentMethodType } from '../types';

interface PaymentSelectionModalProps {
  title: string;
  amount: number;
  paymentMethods: PaymentMethod[];
  onConfirm: (paymentMethodId: string) => void;
  onClose: () => void;
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({ title, amount, paymentMethods, onConfirm, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = (id: string) => {
    setIsProcessing(true);
    onConfirm(id);
  };

  const getIcon = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.CASH: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>;
      case PaymentMethodType.CARD: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case PaymentMethodType.WALLET: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      default: return null;
    }
  };

  // Ordenar para que Cash vaya primero
  const sortedMethods = [...paymentMethods].sort((a, b) => {
    if (a.type === PaymentMethodType.CASH) return -1;
    if (b.type === PaymentMethodType.CASH) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-fade-in-up border-4 border-indigo-600/10">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Confirmar Pago de Gasto</p>
          <h3 className="text-xl font-black truncate">{title}</h3>
          <p className="text-3xl font-black mt-2">${amount.toLocaleString()}</p>
        </div>

        <div className="p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Elegir método de pago:</p>
          
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-500">Registrando pago...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sortedMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => handleConfirm(pm.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group active:scale-[0.98] border-2 ${pm.type === PaymentMethodType.CASH ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                >
                  <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center ${pm.type === PaymentMethodType.CASH ? 'bg-white text-emerald-600' : 'bg-white text-indigo-600'}`}>
                    {getIcon(pm.type)}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-sm font-black uppercase tracking-tight truncate ${pm.type === PaymentMethodType.CASH ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {pm.name} {pm.type === PaymentMethodType.CASH ? '💰' : ''}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{pm.type === 'CASH' ? 'Efectivo Físico' : pm.type === 'CARD' ? 'Tarjeta' : 'Billetera'}</p>
                  </div>
                  <svg className={`w-5 h-5 ml-auto ${pm.type === PaymentMethodType.CASH ? 'text-emerald-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancelar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
