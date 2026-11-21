import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  emerald: 'text-emerald-700',
  rose: 'text-rose-700',
  sky: 'text-sky-700',
  amber: 'text-amber-700',
  violet: 'text-violet-700',
  slate: 'text-slate-600',
};

export default function StatCard({ label, value, hint, icon: Icon, tone = 'slate', className }) {
  return (
    <div className={cn('card-flat flex items-start justify-between gap-3 p-3.5', className)}>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className={cn('num mt-1.5 truncate font-heading text-lg font-extrabold', TONES[tone] || TONES.slate)}>
          {value}
        </p>
        {hint ? <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted', TONES[tone] || TONES.slate)}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
      ) : null}
    </div>
  );
}