// a1/components/v21/rates/RatesTable.jsx
// جدول یک دستهٔ نرخ (رسمی یا بازار آزاد). هیچ عددی ساخته نمی‌شود:
// اگر نرخی دریافت نشده باشد، «دریافت نشد» نمایش داده می‌شود.
import React from 'react';
import { toPersianDigits } from '@/a1/lib/format';
import { VALIDITY_META } from './ratesConfig';

const numberOrMissing = value => {
  if (value === null || value === undefined || value === '') return 'دریافت نشد';
  const numeric = Number(value);
  return toPersianDigits(new Intl.NumberFormat('fa-IR', { maximumFractionDigits: numeric > 0 && numeric < 1 ? 6 : 4 }).format(numeric));
};

const stamp = value => (value
  ? toPersianDigits(new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)))
  : 'دریافت نشد');

const TONES = {
  official: {
    title: 'نرخ رسمی',
    head: 'from-[#164b87] to-[#2767a5]',
    box: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  market: {
    title: 'نرخ بازار آزاد',
    head: 'from-[#8a5a06] to-[#b8860b]',
    box: 'border-amber-200 bg-amber-50 text-amber-900',
  },
};

const Cell = ({ value }) => (
  value === 'دریافت نشد'
    ? <span className="text-[10px] text-slate-400">دریافت نشد</span>
    : <span>{value}</span>
);

export default function RatesTable({ kind, rows, base }) {
  const tone = TONES[kind] || TONES.official;
  const hasAnyRate = rows.some(row => row.mid !== null && row.mid !== undefined);
  const baseName = base === 'AFN' ? 'افغانی' : base === 'USD' ? 'دالر امریکایی' : base;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2">
        <div>
          <b className="text-[11px] text-[#24496d]">{tone.title}</b>
          <div className="mt-0.5 text-[10px] text-slate-600">
            واحد پول مبنا: <b>{baseName}</b> — این دسته جدا از دستهٔ دیگر نمایش داده می‌شود.
          </div>
        </div>
        <span className="text-[10px] text-slate-600">تعداد ارز: {toPersianDigits(rows.length)}</span>
      </div>

      {!hasAnyRate && (
        <div className={'border px-3 py-2 text-[10px] leading-5 ' + tone.box}>
          برای این دسته هنوز هیچ نرخی از منبع اینترنتی دریافت نشده است؛ به‌جای عدد ساختگی، وضعیت «دریافت نشد» نمایش داده می‌شود.
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-[#cbd9e8] bg-white shadow-sm">
        <table className="w-full min-w-[880px] border-collapse text-right text-xs">
          <thead className={'bg-gradient-to-l text-white ' + tone.head}>
            <tr>
              {['نام ارز', 'نماد / کد', 'نرخ (یک واحد ارز به واحد مبنا)', 'واحد مبنا', 'منبع دریافت نرخ', 'آخرین به‌روزرسانی', 'وضعیت اعتبار'].map(column => (
                <th key={column} className="border-l border-white/15 px-3 py-2.5 text-[11px] font-bold last:border-l-0">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const validity = VALIDITY_META[row.validity] || VALIDITY_META.missing;
              return (
                <tr key={row.code} className={index % 2 ? 'bg-[#f7faff]' : 'bg-white'}>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 font-bold text-[#263c55]">{row.name}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-slate-600">{row.symbol} · {row.code}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5"><Cell value={numberOrMissing(row.mid ?? row.buy)} /></td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-slate-600">{row.base}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-slate-600">{row.source || <span className="text-[10px] text-slate-400">بدون منبع</span>}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-slate-600"><Cell value={stamp(row.updatedAt)} /></td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5">
                    <span className={'chip border border-transparent px-2 py-0.5 text-[10px] font-bold ' + validity.badge}>{validity.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasAnyRate && kind === 'official' && (
        <p className="text-[10px] leading-5 text-slate-500">
          منبع جهانی فقط نرخ میانی روز را اعلام می‌کند؛ به همین دلیل نرخ خرید و فروش در این جدول یکسان نمایش داده می‌شود.
        </p>
      )}
    </section>
  );
}