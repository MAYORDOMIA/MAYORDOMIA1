
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Contraseña incorrecta.");
      }

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
        <div className="bg-rose-600 p-8 text-white text-center">
          <h3 className="text-xl font-black uppercase tracking-widest">Peligro</h3>
          <p className="text-rose-100 text-[10px] mt-1 font-black uppercase tracking-tighter italic">"Examíname, oh Dios..."</p>
        </div>

        <div className="p-8">
          <p className="text-slate-600 text-xs font-bold mb-6 text-center uppercase tracking-tight">
            ESTA ACCIÓN BORRARÁ TODO.
          </p>

          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-xl uppercase">
                {error}
              </div>
            )}
            
            <input
              type="password"
              required
              className="w-full px-5 py-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center"
              placeholder="CONTRASEÑA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {loading ? 'BORRANDO...' : 'CONFIRMAR BORRADO'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
