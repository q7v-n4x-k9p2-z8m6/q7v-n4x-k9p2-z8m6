import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const SOURCE_URL = 'https://dab.gov.af/exchange-rates';
const formatRate = value => value === null || value === undefined || value === ''
  ? '—'
  : new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 6 }).format(Number(value));
const formatStamp = value => value
  ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function DailyRates() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/rates/dab-latest.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('فایل آخرین دریافت نرخ در دسترس نیست.');
      const result = await response.json();
      setPayload(result);
      if (result.status !== 'ok') setError(result.message || 'در آخرین نوبت، دادهٔ معتبر از منبع رسمی دریافت نشد.');
    } catch (cause) {
      setPayload(null);
      setError(cause?.message || 'بارگذاری نرخ‌های رسمی ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const list = Array.isArray(payload?.rates) ? payload.rates : [];
    const term = query.trim().toLowerCase();
    return term ? list.filter(row => `${row.name} ${row.code}`.toLowerCase().includes(term)) : list;
  }, [payload, query]);

  return (
    <section dir="rtl" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#315e80] pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#b6c4cf] bg-[#edf3f7] text-[#315e80]">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="text-[9px] text-slate-500">سیستم حسابداری / منبع رسمی بانک مرکزی افغانستان</div>
            <h2 className="text-sm font-bold text-[#24496d]">نرخ روز</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجوی ارز..." className="h-8 w-36 border border-slate-300 bg-white px-2 text-[10px]" />
          <button type="button" onClick={load} disabled={loading} className="h-8 border border-[#9fb2c3] bg-white px-3 text-[10px] font-bold text-[#24496d] hover:bg-blue-50 disabled:opacity-60">
            {loading ? 'در حال بارگذاری...' : 'بارگذاری آخرین دریافت'}
          </button>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="h-8 border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-900">مشاهده منبع رسمی</a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="border border-slate-200 bg-white px-2 py-1">واحد مبنا: <b>افغانی (AFN)</b></span>
        <span className="border border-slate-200 bg-white px-2 py-1">تاریخ اعلام بانک مرکزی: <b>{payload?.lastUpdated || 'نامشخص'}</b></span>
        <span className="border border-slate-200 bg-white px-2 py-1">آخرین دریافت برنامه: <b>{formatStamp(payload?.fetchedAt)}</b></span>
      </div>

      {error && <div role="alert" className="border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-900">{error} هیچ نرخ تخمینی یا ساختگی نمایش داده نمی‌شود.</div>}

      {payload?.status === 'ok' && (
        <div className="overflow-auto rounded-xl border border-[#cbd9e8] bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-right text-xs">
            <thead className="bg-gradient-to-l from-[#164b87] to-[#2767a5] text-white">
              <tr>
                {['ارز', 'خرید نقدی', 'فروش نقدی', 'خرید حواله', 'فروش حواله'].map(label => <th key={label} className="border-l border-white/15 px-3 py-3 text-[11px] font-bold">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.code} className={index % 2 ? 'bg-[#f7faff]' : 'bg-white'}>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5 font-bold text-[#263c55]">{row.name} <span className="text-[10px] font-normal text-slate-500">({row.code})</span></td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5">{formatRate(row.cashBuy)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5">{formatRate(row.cashSell)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5">{formatRate(row.transferBuy)}</td>
                  <td className="border-b border-[#e5edf5] px-3 py-2.5">{formatRate(row.transferSell)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="p-5 text-center text-slate-500">ارزی با این عبارت پیدا نشد.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <p className="border border-slate-200 bg-[#f8fafc] px-3 py-2 text-[10px] leading-6 text-slate-600">
        نرخ‌ها مستقیماً از جدول رسمی بانک مرکزی افغانستان دریافت می‌شوند و بر مبنای افغانی‌اند. این اطلاعات فقط برای مشاهده است؛ هیچ نرخ معامله، سند حسابداری، موجودی صندوق یا حساب مشتری را تغییر نمی‌دهد. برخی ارزها فقط در صورت انتشار در جدول بانک مرکزی نمایش داده می‌شوند.
      </p>
    </section>
  );
}
