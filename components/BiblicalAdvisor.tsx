
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
    "¿Cómo puedo empezar a pagar mis deudas?",
    "¿Qué dice la Biblia sobre el ahorro?",
    "Analiza mi presupuesto actual.",
    "¿Cuánto debería estar dando de diezmo u ofrenda?"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-amber-50 rounded-t-xl">
        <h2 className="text-xl font-bold text-amber-900 uppercase tracking-tighter">
          Consejero Sabio
        </h2>
        <p className="text-amber-700 text-sm mt-1">
          "Lámpara es a mis pies tu palabra, y lumbrera a mi camino." - Salmos 119:105
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!response && (
          <div className="text-center py-10">
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">¿En qué puedo orientarte hoy?</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              Uso IA basada en principios bíblicos para analizar tus finanzas.
            </p>
            
            <div className="mt-8 grid gap-2">
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(q); }}
                  className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm font-bold text-slate-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <span className="text-sm font-black text-indigo-500 uppercase tracking-widest animate-pulse">Consultando sabiduría...</span>
          </div>
        )}

        {response && !loading && (
          <div className="prose prose-indigo max-w-none">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
               <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-bold text-sm">
                 {response}
               </div>
            </div>
            <button 
              onClick={() => setResponse('')} 
              className="mt-4 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
            >
              NUEVA CONSULTA
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            placeholder="Escribe tu duda..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl uppercase tracking-widest text-xs"
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
};
