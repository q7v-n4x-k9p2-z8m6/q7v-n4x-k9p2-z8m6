import React from 'react';
import { cn } from '@/lib/utils';

export default function StatTile({ label, value, unit, tone }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3">
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
      <p className={cn('num mt-1 text-[15px] font-bold leading-tight', tone || 'text-foreground')}>{value}</p>
      {unit && <p className="mt-0.5 text-[9.5px] text-muted-foreground">{unit}</p>}
    </div>
  );
}