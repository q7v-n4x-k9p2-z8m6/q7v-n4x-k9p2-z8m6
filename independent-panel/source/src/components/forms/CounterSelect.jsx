import React from 'react';
import { cn } from '@/lib/utils';

export default function CounterSelect({ counters, value, onChange, className, label = 'طرف حساب نقدی' }) {
  const safeCounters = counters.filter((counter) => counter.type === 'safe');
  const bankCounters = counters.filter((counter) => counter.type === 'bank');

  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[11px] font-bold text-foreground/85">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-[12px] outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">انتخاب صندوق یا بانک</option>
        {safeCounters.length ? (
          <optgroup label="صندوق‌ها">
            {safeCounters.map((counter) => (
              <option key={counter.key} value={counter.key}>
                {counter.label}
              </option>
            ))}
          </optgroup>
        ) : null}
        {bankCounters.length ? (
          <optgroup label="حساب‌های بانکی">
            {bankCounters.map((counter) => (
              <option key={counter.key} value={counter.key}>
                {counter.label}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </label>
  );
}