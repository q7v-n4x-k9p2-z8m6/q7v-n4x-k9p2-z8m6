// a1/components/v21/BranchMobileBoard.jsx — فهرست نمایندگی‌ها در نمای باریک (زیر ۷۶۸ پیکسل)
// همان ردیف‌های میزکار را به شکل کارت‌های قابل‌لمس نشان می‌دهد؛ فقط نمایش، بدون تغییر داده.
import React from 'react';
import { ArrowRight, Building2, ChevronLeft, Plus, Search } from 'lucide-react';

export default function BranchMobileBoard({
  rows, query, onQuery, selected, onOpen, onBack, onNew, canCreate, fmt, currencyLabel,
}) {
  return (
    <section className="space-y-3 pb-24" aria-label="فهرست نمایندگی‌ها">
      <header className="flex items-center gap-2 border-b-2 border-[#315e80] pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-bold text-[#24496d]"
        >
          <ArrowRight className="h-3.5 w-3.5" />بازگشت
        </button>
        <Building2 className="h-4 w-4 shrink-0 text-[#315e80]" />
        <h2 className="min-w-0 flex-1 truncate text-xs font-bold text-[#24496d]">تعریف نمایندگی‌ها</h2>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{fmt(rows.length)} مورد</span>
      </header>

      <div className="flex items-center gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="جستجوی نمایندگی..."
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[11px] focus:outline-none"
          />
        </label>
        {canCreate && (
          <button
            type="button"
            onClick={onNew}
            className="flex h-9 shrink-0 items-center gap-1 rounded-xl border border-blue-300 bg-blue-50 px-3 text-[11px] font-bold text-blue-900"
          >
            <Plus className="h-3.5 w-3.5" />نمایندگی جدید
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-[11px] text-slate-500">
          نمایندگی‌ای با این مشخصات پیدا نشد.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const active = selected && selected.id === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onOpen(row)}
                className={'w-full rounded-xl border bg-white p-3 text-right transition ' + (active ? 'border-[#315e80] ring-1 ring-[#315e80]/30' : 'border-slate-200 active:bg-blue-50')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-xs font-bold text-slate-800">{row.name || 'بدون نام'}</b>
                    <span className="mt-1 block truncate text-[10px] text-slate-500">
                      {[row.code, row.city, row.phone].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                  <span className={'shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ' + (row.status === 'غیرفعال' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700')}>
                    {row.status || 'فعال'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span className="text-slate-500">مانده افتتاحیه</span>
                  <span className="flex items-center gap-1 font-bold text-[#24496d]">
                    {fmt(row.opening)} {currencyLabel(row.currency || 'AFN')}
                    <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}