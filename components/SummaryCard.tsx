import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass }) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
      <div className="order-2 md:order-1">
        <p className="text-xs md:text-sm font-medium text-slate-500 mb-1 truncate">{title}</p>
        <h3 className={`text-xl md:text-2xl font-bold ${colorClass} truncate`}>
          ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className={`order-1 md:order-2 self-start md:self-center p-2 md:p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 md:w-6 md:h-6" })}
      </div>
    </div>
  );
};