import React from 'react';

function tone(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'UP') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (normalized === 'DOWN') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (normalized === 'PAUSED') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
}

export const StatusBadge = ({ status, className = '' }) => {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone(status)} ${className}`}>
      {status || 'UNKNOWN'}
    </span>
  );
};
