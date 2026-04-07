import React from 'react';

export const KpiCard = ({ label, value, tone = 'default', helper }) => {
  const toneClass = tone === 'danger'
    ? 'border-rose-900/40 bg-rose-950/20'
    : tone === 'success'
      ? 'border-emerald-900/40 bg-emerald-950/20'
      : tone === 'info'
        ? 'border-cyan-900/40 bg-cyan-950/20'
        : 'border-slate-800 bg-slate-900';

  const labelClass = tone === 'danger'
    ? 'text-rose-300/70'
    : tone === 'success'
      ? 'text-emerald-300/70'
      : tone === 'info'
        ? 'text-cyan-300/70'
        : 'text-slate-500';

  const valueClass = tone === 'danger'
    ? 'text-rose-300'
    : tone === 'success'
      ? 'text-emerald-300'
      : tone === 'info'
        ? 'text-cyan-300'
        : 'text-slate-100';

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className={`text-[10px] uppercase tracking-[0.2em] ${labelClass}`}>{label}</div>
      <div className={`mt-1 text-xl font-semibold ${valueClass}`}>{value}</div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
};
