// a1/components/customer/PortalBits.jsx — اجزای مشترک پنل مشتری، هم‌ساخت با پوستهٔ V21
import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

export const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value ?? 0) || 0);
export const today = () => new Date().toLocaleDateString('en-CA');

export function PCard({ title, note, action, children }) {
  return (
    <section className="rounded-2xl border border-[#d5e2f0] bg-white shadow-sm">
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b border-[#eaf1f8] px-3 py-2.5">
          <div>
            <b className="text-xs text-[#102b4c]">{title}</b>
            {note ? <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{note}</p> : null}
          </div>
          {action}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function PEmpty({ children }) {
  return <p className="py-5 text-center text-[11px] leading-6 text-slate-500">{children}</p>;
}

export function PLoading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-[#164b87]" />
    </div>
  );
}

export function PError({ message }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">
      <AlertTriangle className="h-4 w-4 shrink-0" /> {message}
    </p>
  );
}

export function PField({ label, children }) {
  return (
    <label className="block space-y-1 text-[11px]">
      <span className="text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = 'h-9 w-full rounded-lg border border-[#d5e2f0] bg-white px-2 text-[12px] outline-none focus:border-[#164b87]';