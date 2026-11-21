import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function FormField({ label, hint, children, className }) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[11px] font-bold text-foreground/85">{label}</span>
      {children}
      {hint ? <span className="text-[10px] leading-4 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props) {
  return <Input {...props} className={cn('h-9 text-[12px]', props.className)} />;
}

export function SelectInput({ options = [], placeholder, className, ...props }) {
  return (
    <select
      {...props}
      className={cn(
        'h-9 rounded-md border border-input bg-background px-2 text-[12px] text-foreground outline-none focus:ring-1 focus:ring-ring',
        className
      )}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FormActions({ onCancel, submitting, submitLabel = 'ثبت سند' }) {
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? 'در حال ثبت…' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-3 py-2 text-[12px] font-bold text-foreground/80 transition-colors hover:bg-secondary"
      >
        انصراف
      </button>
    </div>
  );
}

export function Notice({ tone = 'amber', children }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    slate: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-[11px] leading-5', tones[tone])}>{children}</div>
  );
}