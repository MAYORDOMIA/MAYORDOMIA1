
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass }) => {
  const safeAmount = typeof amount === 'number' ? amount : 0;

  return (
    <div className="bg-white p-5 md:p-7 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
      <p className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-widest truncate">
        {title}
      </p>
      <h3 className={`text-2xl md:text-3xl font-black ${colorClass} truncate leading-tight tracking-tighter`}>
        ${safeAmount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </h3>
    </div>
  );
};
