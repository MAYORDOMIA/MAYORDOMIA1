
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface ResetDataModalProps {
  email: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({ email, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificamos la clave intentando un login silencioso
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Contraseña incorrecta. No se pueden reiniciar los datos.");
      }

      // Si la clave es correcta, procedemos al borrado
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-rose-100">
        <div className="bg-rose-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Zona de Peligro</h3>
          <p className="text-rose-100 text-xs mt-1 font-medium italic">"Examíname, oh Dios, y conoce mi corazón" - Salmos 139:23</p>
        </div>

        <div className="p-8">
          <p className="text-slate-600 text-sm mb-6 text-center leading-relaxed">
            Esta acción eliminará <strong>TODOS</strong> tus registros financieros de forma permanente. Para continuar, ingresa tu contraseña de acceso.
          </p>

          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl animate-pulse">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tu Contraseña</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-none transition-all font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-rose-100 uppercase tracking-widest text-sm disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar Borrado Total'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
