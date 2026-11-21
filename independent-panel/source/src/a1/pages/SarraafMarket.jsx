// a1/pages/SarraafMarket.jsx — بازار صراف‌ها (ساختار: src/pages/SarraafMarket.jsx سورس A1)
// نرخ‌ها از جدول rates همین دستگاه خوانده می‌شوند؛ هیچ نرخ زندهٔ بیرونی یا API نرخی فراخوانی نمی‌شود.
import React, { useEffect, useState } from 'react';
import { LineChart, RefreshCw } from 'lucide-react';
import { all } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 6 }).format(Number(value) || 0);

export default function SarraafMarket() {
  const [state, setState] = useState({ loading: true, rates: [], error: '' });

  const load = async () => {
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const rates = await all('rates');
      setState({
        loading: false,
        rates: rates
          .filter(row => (!row.exchange_code || row.exchange_code === code) && row.is_active !== false)
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)),
        error: '',
      });
    } catch (error) {
      setState({ loading: false, rates: [], error: error?.message || 'خواندن نرخ‌ها ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><LineChart className="h-5 w-5" /></span>
          <div>
            <h1 className="text-sm font-extrabold text-[#1e4776]">بازار صراف‌ها</h1>
            <p className="text-[10px] text-slate-500">نرخ‌های ثبت‌شده در همین دستگاه · بدون نرخ زنده</p>
          </div>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] bg-white px-2.5 py-1.5 text-[11px]"><RefreshCw className="h-3.5 w-3.5" /> تازه‌سازی</button>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        {state.loading ? <p className="p-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-5 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.rates.length ? <p className="p-5 text-center text-[11px] text-slate-500">نرخی ثبت نشده است.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-[11px]">
                    <thead className="bg-[#edf4fb] text-[#102b4c]">
                      <tr><th className="p-2 text-right">ارز</th><th className="p-2">نرخ خرید</th><th className="p-2">نرخ فروش</th><th className="p-2">نرخ روز</th><th className="p-2">وضعیت</th></tr>
                    </thead>
                    <tbody>
                      {state.rates.map(row => (
                        <tr key={row.id} className="border-t border-[#eef3f7]">
                          <td className="p-2 text-right font-bold text-[#1e4776]">{row.currency}</td>
                          <td className="p-2 text-center tabular-nums">{money(row.buy_rate)}</td>
                          <td className="p-2 text-center tabular-nums">{money(row.sell_rate)}</td>
                          <td className="p-2 text-center tabular-nums">{row.daily_rate ? money(row.daily_rate) : '—'}</td>
                          <td className="p-2 text-center text-[9px] text-slate-500">محلی</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </section>

      <p className="rounded-xl border border-[#c9d7e3] bg-[#f2f7fc] p-3 text-[10.5px] leading-6 text-[#1e4776]">
        این جدول همان نرخ‌هایی است که در تعریف اسعار ثبت می‌شود. تغییر نرخ بازار بیرونی، دریافت خودکار نرخ یا معاملهٔ آنلاین در این پیش‌نمایش انجام نمی‌شود.
      </p>
    </div>
  );
}