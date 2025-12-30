
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass }) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between gap-1">
      <div>
        <p className="text-[12px] md:text-sm font-black text-slate-400 uppercase tracking-wider mb-1 truncate">{title}</p>
        <h3 className={`text-lg md:text-2xl font-black ${colorClass} truncate leading-none`}>
          ${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </h3>
      </div>
    </div>
  );
};
