
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass }) => {
  return (
    <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between gap-1">
      <div>
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5 truncate">{title}</p>
        <h3 className={`text-sm md:text-xl font-black ${colorClass} truncate leading-none`}>
          ${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </h3>
      </div>
    </div>
  );
};
