// a1/components/v21/rates/RatesCompare.jsx
// مقایسهٔ نرخ رسمی و نرخ بازار آزاد برای هر ارز.
// اگر یکی از دو طرف موجود نباشد، اختلاف محاسبه نمی‌شود و «—» نمایش داده می‌شود.
import React from 'react';
import { toPersianDigits } from '@/a1/lib/format';

const num = value => (value === null || value === undefined || value === ''
  ? null
  : Number(value));

const text = value => (num(value) === null
  ? <span className="text-[10px] text-slate-400">دریافت نشد</span>
  : toPersianDigits(new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 }).format(Number(value))));

const diffPercent = (official, market) => {
  const a = num(official);
  const b = num(market);
  if (a === null || b === null || a === 0) return null;
  return ((b - a) / a) * 100;
};

const diffText = value => {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return sign + toPersianDigits(new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Math.abs(value))) + '٪';
};

export default function RatesCompare({ official, market, base }) {
  const rows = official.map(item => ({
    ...item,
    market: market.find(entry => entry.code === item.code) || null,
  }));

  return (
    <section className="space-y-2">
      <div className="border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2">
        <b className="text-[11px] text-[#24496d]">مقایسهٔ نرخ رسمی و بازار آزاد</b>
        <div className="mt-0.5 text-[10px] text-slate-600">
          واحد پول مبنا: <b>{base}</b> — اختلاف، درصد تفاوت نرخ خرید بازار آزاد نسبت به نرخ رسمی است.
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-[#cbd9e8] bg-white shadow-sm">
        <table className="w-full min-w-[820px] border-collapse text-right text-xs">
          <thead className="bg-gradient-to-l from-[#164b87] to-[#2767a5] text-white">
            <tr>
              {['نام ارز', 'رسمی — خرید', 'رسمی — فروش', 'بازار آزاد — خرید', 'بازار آزاد — فروش', 'اختلاف خرید'].map(column => (
                <th key={column} className="border-l border-white/15 px-3 py-2.5 text-[11px] font-bold last:border-l-0">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const difference = diffPercent(row.buy, row.market?.buy);
              return (
                <tr key={row.code} className={index % 2 ? 'bg-[#f7faff]' : 'bg-white'}>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 font-bold text-[#263c55]">{row.name} <span className="text-[10px] font-normal text-slate-500">({row.code})</span></td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-blue-900">{text(row.buy)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-blue-900">{text(row.sell)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-amber-800">{text(row.market?.buy)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 text-amber-800">{text(row.market?.sell)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 font-bold text-slate-700">{diffText(difference)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}