// a1/components/v21/LedgerSummaryDock.jsx — نوار جمع‌بندی ثابت پایین صفحه
// در چیدمان لپ‌تاپ/تبلت به لبهٔ پایین پنجره می‌چسبد (بالای نوار عملیات) و با
// جدول رکوردها جابه‌جا نمی‌شود؛ فقط با تغییر بخش فعال، محتوایش عوض می‌شود.
// اگر ارزها بیشتر از فضای موجود باشند، همین نوار کشویی می‌شود و دو دکمهٔ جابه‌جایی
// در دو سر آن ظاهر می‌شوند؛ با تعداد کم ارز، دکمه‌ای نمایش داده نمی‌شود.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { currencyLabel } from '@/a1/lib/format';

export default function LedgerSummaryDock({ open, totals, debitLabel, creditLabel, showRemittance, fmt }) {
  const rowRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!open || !el) { setHasOverflow(false); return undefined; }
    const measure = () => setHasOverflow(el.scrollWidth - el.clientWidth > 2);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, totals.length, showRemittance]);

  const slide = direction => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  if (!open) return null;

  return (
    <div className="v21-summary-dock shrink-0 border-t border-slate-400 bg-[#e9edf1] p-2" role="status" aria-label="جمع‌بندی دفتر">
      {totals.length === 0 ? (
        <div className="rounded-lg border border-[#d3deeb] bg-white px-3 py-1.5 text-center text-[10px] text-slate-500">در بازهٔ انتخاب‌شده ردیفی برای جمع‌بندی وجود ندارد.</div>
      ) : (
        <div className="relative flex h-full min-w-0 flex-1 items-stretch">
          {hasOverflow && (
            <button
              type="button"
              onClick={() => slide(-1)}
              aria-label="ارزهای بعدی"
              title="ارزهای بعدی"
              className="absolute left-0 top-1/2 z-10 grid h-7 w-6 -translate-y-1/2 place-items-center rounded border border-slate-300 bg-white/95 text-[#24496d] shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div ref={rowRef} className="v21-summary-dock-row flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth px-0.5">
            {totals.map(x => (
              <div key={x.currency} className="v21-ledger-summary-card flex min-w-[236px] flex-1 items-stretch gap-2 rounded-lg border border-[#d3deeb] bg-white px-2 py-1 text-right shadow-sm">
                <div className="flex shrink-0 flex-col items-center justify-center border-l border-slate-200 pl-2">
                  <b className="text-[11px] font-extrabold leading-tight text-[#1e4776]">{currencyLabel(x.currency)}</b>
                  {showRemittance && <span className="mt-0.5 whitespace-nowrap text-[9px] text-slate-500">تعداد: {fmt(x.count)}</span>}
                </div>
                <div className="grid flex-1 grid-cols-3 gap-1">
                  <div className="rounded bg-rose-50 px-1.5 py-0.5">
                    <span className="block text-[9px] font-semibold leading-tight text-rose-700">{debitLabel}</span>
                    <b className="block text-[11px] leading-tight tabular-nums text-rose-800">{fmt(x.debit)}</b>
                  </div>
                  <div className="rounded bg-emerald-50 px-1.5 py-0.5">
                    <span className="block text-[9px] font-semibold leading-tight text-emerald-700">{creditLabel}</span>
                    <b className="block text-[11px] leading-tight tabular-nums text-emerald-800">{fmt(x.credit)}</b>
                  </div>
                  <div className="rounded bg-blue-50 px-1.5 py-0.5">
                    <span className="block text-[9px] font-semibold leading-tight text-blue-700">{x.net > 0 ? 'مانده بدهکار' : x.net < 0 ? 'مانده بستانکار' : 'تراز'}</span>
                    <b className="block text-[11px] leading-tight tabular-nums text-blue-800">{fmt(Math.abs(x.net))}</b>
                  </div>
                </div>
                {showRemittance && (
                  <div className="flex shrink-0 flex-col justify-center gap-0.5 border-r border-slate-200 pr-2 text-[9px] leading-tight text-slate-600">
                    <span className="whitespace-nowrap">کمیشن: <b className="tabular-nums text-slate-800">{fmt(x.fee)}</b></span>
                    {/* جمع کل همان مبلغ هر حواله به‌همراه کمیشن آن است تا با جمع ردیف‌ها یکی باشد */}
                    <span className="whitespace-nowrap">جمع کل: <b className="tabular-nums text-slate-800">{fmt((x.debit || 0) + (x.credit || 0) + (x.fee || 0))}</b></span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasOverflow && (
            <button
              type="button"
              onClick={() => slide(1)}
              aria-label="ارزهای قبلی"
              title="ارزهای قبلی"
              className="absolute right-0 top-1/2 z-10 grid h-7 w-6 -translate-y-1/2 place-items-center rounded border border-slate-300 bg-white/95 text-[#24496d] shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}