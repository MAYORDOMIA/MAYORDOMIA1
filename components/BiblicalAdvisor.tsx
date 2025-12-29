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
        <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Consejero Mayordomía
        </h2>
        <p className="text-amber-700 text-sm mt-1">
          "Lámpara es a mis pies tu palabra, y lumbrera a mi camino." - Salmos 119:105
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!response && (
          <div className="text-center py-10">
            <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
               </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700">¿En qué puedo orientarte hoy?</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              Utilizo inteligencia artificial basada en principios bíblicos para analizar tus finanzas y darte consejos.
            </p>
            
            <div className="mt-8 grid gap-2">
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(q); }}
                  className="text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm text-slate-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8 space-x-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            <span className="text-sm text-indigo-500 ml-2">Consultando sabiduría...</span>
          </div>
        )}

        {response && !loading && (
          <div className="prose prose-indigo max-w-none">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
               <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-light text-base">
                 {response}
               </div>
            </div>
            <button 
              onClick={() => setResponse('')} 
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Hacer otra consulta
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Escribe tu duda financiera..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            Preguntar
          </button>
        </div>
      </div>
    </div>
  );
};