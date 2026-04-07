import React from 'react';

export const PageHeader = ({ icon: Icon, chipLabel, title, description, rightContent }) => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {chipLabel}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-xs text-slate-400 md:text-sm">{description}</p>
          ) : null}
        </div>

        {rightContent ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
            {rightContent}
          </div>
        ) : null}
      </div>
    </section>
  );
};
