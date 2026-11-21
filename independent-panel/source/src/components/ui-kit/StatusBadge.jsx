import React from 'react';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  slate: 'border-border bg-muted text-muted-foreground',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  yellow: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-sky-200 bg-sky-50 text-sky-700',
  purple: 'border-violet-200 bg-violet-50 text-violet-700',
  gray: 'border-border bg-muted text-muted-foreground',
};

export default function StatusBadge({ label, tone = 'slate', className }) {
  if (!label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold',
        TONE_CLASS[tone] || TONE_CLASS.slate,
        className
      )}
    >
      {label}
    </span>
  );
}