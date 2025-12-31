
import React, { useState } from 'react';
import { Transaction, Debt, FixedExpense, Budget } from '../types';
import { getBiblicalFinancialAdvice } from '../services/geminiService';

interface AdvisorProps {
  transactions: Transaction[];
  debts: Debt[];
  fixedExpenses: FixedExpense[];
  budgets: Budget[];
}

export const BiblicalAdvisor: React.FC<AdvisorProps> = ({ transactions, debts, fixedExpenses, budgets }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const advice = await getBiblicalFinancialAdvice(transactions, debts, fixedExpenses, budgets, query);
    setResponse(advice);
    setLoading(false);
  };

  const predefinedQuestions = [
    "¿Cómo puedo pagar mis deudas?",
    "¿Qué dice la Biblia sobre el ahorro?",
    "Analiza mi situación actual.",
    "¿Cuánto debería ofrendar hoy?"
  ];

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-900 uppercase tracking-tighter">
          Consejero Bíblico
        </h2>
        <p className="text-amber-700 text-sm mt-2 font-medium">
          "Lámpara es a mis pies tu palabra..." - Salmo 119
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {!response && (
          <div className="text-center py-12">
            <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight">¿En qué puedo orientarte hoy?</h3>
            <p className="text-slate-500 text-base mt-3 max-w-md mx-auto">
              Analizo tus finanzas bajo la luz de las Escrituras para darte una guía sabia.
            </p>
            
            <div className="mt-12 grid gap-3 max-w-lg mx-auto">
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(q); }}
                  className="text-left p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-base font-bold text-slate-600 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mb-4"></div>
            <span className="text-sm font-black text-indigo-500 uppercase tracking-widest animate-pulse">Buscando sabiduría...</span>
          </div>
        )}

        {response && !loading && (
          <div className="animate-fade-in-up">
            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 shadow-inner">
               <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-bold text-lg">
                 {response}
               </div>
            </div>
            <button 
              onClick={() => setResponse('')} 
              className="mt-8 mx-auto block px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              NUEVA CONSULTA
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            className="flex-1 px-6 py-5 border border-slate-200 rounded-[28px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-bold text-base shadow-inner"
            placeholder="Pregunta algo sobre tus finanzas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query}
            className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-[28px] uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            CONSULTAR
          </button>
        </div>
      </div>
    </div>
  );
};
