
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else if (isSignUp) {
      setMessage({ text: '¡Registro exitoso! Revisa tu email.', type: 'success' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-slate-800 p-10 text-center text-white">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg">M</div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">MAYORDOMÍA</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Administración Sabia</p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-[10px] font-black uppercase ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {message.text}
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 ml-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 ml-1">Clave</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm text-center"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? 'CARGANDO...' : isSignUp ? 'REGISTRARME' : 'ENTRAR'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline"
            >
              {isSignUp ? 'YA TENGO CUENTA' : 'CREAR CUENTA NUEVA'}
            </button>
          </div>
        </form>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Mayordomía Digital v1.0</p>
        </div>
      </div>
    </div>
  );
};
