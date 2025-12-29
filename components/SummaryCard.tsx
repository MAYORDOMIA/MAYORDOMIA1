
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass }) => {
  return (
    <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between gap-1">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-1 bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 md:w-5 md:h-5" })}
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5 truncate">{title}</p>
        <h3 className={`text-sm md:text-xl font-black ${colorClass} truncate leading-none`}>
          ${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </h3>
      </div>
    </div>
  );
};
