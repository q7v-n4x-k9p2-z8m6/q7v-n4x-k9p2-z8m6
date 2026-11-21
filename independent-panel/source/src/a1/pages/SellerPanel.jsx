// a1/pages/SellerPanel.jsx — پنل فروشنده (ساختار: src/pages/seller/SellerPanel.jsx سورس A1)
// فقط خواندن جدول‌های محلی sellers، wallet_withdrawal_requests و recharge_orders؛ هیچ پرداختی انجام نمی‌شود.
import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { all } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

export default function SellerPanel() {
  const [state, setState] = useState({ loading: true, sellers: [], withdrawals: [], recharges: [], error: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = currentUser();
        const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
        const [sellers, withdrawals, recharges] = await Promise.all([
          all('sellers'), all('wallet_withdrawal_requests'), all('recharge_orders'),
        ]);
        const inTenant = row => !row.exchange_code || row.exchange_code === code;
        if (active) setState({ loading: false, sellers: sellers.filter(inTenant), withdrawals: withdrawals.filter(inTenant), recharges: recharges.filter(inTenant), error: '' });
      } catch (error) {
        if (active) setState({ loading: false, sellers: [], withdrawals: [], recharges: [], error: error?.message || 'خواندن پنل فروشنده ناموفق بود.' });
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Store className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">پنل فروشنده</h1>
          <p className="text-[10px] text-slate-500">گزارش محلی فروشندگان و درخواست‌های برداشت</p>
        </div>
      </header>

      {state.loading ? <p className="rounded-xl border border-[#c9d7e3] bg-white p-6 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
        : state.error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[11px] text-rose-800">{state.error}</p>
          : (
            <>
              <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
                <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">فروشندگان</h2>
                {!state.sellers.length ? <p className="p-5 text-center text-[11px] text-slate-500">فروشنده‌ای ثبت نشده است.</p>
                  : (
                    <ul className="divide-y divide-[#eef3f7]">
                      {state.sellers.map(row => (
                        <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                          <b className="min-w-0 flex-1 truncate text-[#102b4c]">{row.name || row.full_name || 'فروشنده'}</b>
                          <span className="shrink-0 text-slate-500">{row.currency || 'AFN'}</span>
                          <span className="shrink-0 rounded-full bg-[#e9f1f8] px-2 py-0.5 text-[9px] text-[#1e4776]">{row.status || 'فعال'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>

              <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
                <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">درخواست‌های برداشت</h2>
                {!state.withdrawals.length ? <p className="p-5 text-center text-[11px] text-slate-500">درخواست برداشتی ثبت نشده است.</p>
                  : (
                    <ul className="divide-y divide-[#eef3f7]">
                      {state.withdrawals.map(row => (
                        <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                          <span className="min-w-0 flex-1 truncate">{row.customer_name || row.user_name || 'مشتری'}</span>
                          <span className="shrink-0 tabular-nums">{money(row.amount)} {row.currency || 'AFN'}</span>
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-800">{row.status || 'pending'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>

              <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
                <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">سفارش‌های شارژ</h2>
                {!state.recharges.length ? <p className="p-5 text-center text-[11px] text-slate-500">سفارش شارژی ثبت نشده است.</p>
                  : (
                    <ul className="divide-y divide-[#eef3f7]">
                      {state.recharges.map(row => (
                        <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                          <span className="min-w-0 flex-1 truncate">{row.service_name || row.package_name || 'شارژ'}</span>
                          <span className="shrink-0 tabular-nums">{money(row.amount)} {row.currency || 'AFN'}</span>
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-800">{row.status || 'pending'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            </>
          )}
    </div>
  );
}