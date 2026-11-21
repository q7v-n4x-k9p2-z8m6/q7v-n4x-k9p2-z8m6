// a1/pages/CustomerDetail.jsx — پروندهٔ مشتری و دفتر حساب مستقل
// مبنا: src/pages/CustomerDetail.jsx سورس A1؛ داده از دفتر کل محلی.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getDesktopGateway } from '@/app/container';
import { withRunningPartyBalances } from '@/a1/lib/v21Rules';
import { displayDate } from '@/core/domain/dates';

const { load: loadVersion21Database } = getDesktopGateway();
const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value ?? 0) || 0);

export default function CustomerDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, customer: null, lines: [], error: '' });

  useEffect(() => {
    let active = true;
    loadVersion21Database()
      .then(bundle => {
        if (!active) return;
        const customer = (bundle.data.customers || []).find(item => String(item.id) === String(id)) || null;
        const lines = (bundle.data.transactions || []).filter(line => line.partyType === 'customer' && line.party === customer?.name);
        setState({ loading: false, customer, lines, error: '' });
      })
      .catch(error => { if (active) setState({ loading: false, customer: null, lines: [], error: error?.message || 'بارگذاری حساب ناموفق بود.' }); });
    return () => { active = false; };
  }, [id]);

  const rows = useMemo(() => {
    if (!state.customer) return [];
    return withRunningPartyBalances(state.lines, { [state.customer.currency || 'AFN']: Number(state.customer.opening ?? 0) || 0 });
  }, [state.customer, state.lines]);

  const totals = useMemo(() => {
    const map = new Map();
    rows.forEach(row => {
      const currency = row.currency || 'AFN';
      const item = map.get(currency) || { currency, debit: 0, credit: 0 };
      item.debit += Number(row.debit) || 0;
      item.credit += Number(row.credit) || 0;
      map.set(currency, item);
    });
    return [...map.values()].map(item => ({ ...item, net: item.debit - item.credit }));
  }, [rows]);

  if (state.loading) return <p className="p-6 text-center text-xs text-slate-500">در حال بارگذاری…</p>;
  if (state.error) return <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">{state.error}</p>;
  if (!state.customer) {
    return (
      <div className="space-y-2 rounded-xl border border-[#c9d7e3] bg-white p-6 text-center">
        <p className="text-[12px] text-slate-600">این مشتری در دادهٔ محلی پیدا نشد.</p>
        <Link to="/customers" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1e4776]"><ArrowRight className="h-3.5 w-3.5" /> بازگشت به دفتر مشتریان</Link>
      </div>
    );
  }

  const customer = state.customer;

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><BookOpen className="h-5 w-5" /></span>
          <div>
            <h1 className="text-sm font-extrabold text-[#1e4776]">{customer.name}</h1>
            <p className="text-[10px] text-slate-500">کد {customer.code || '—'} · {customer.phone || '—'} · {customer.kind}</p>
          </div>
        </div>
        <Link to="/customers" className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] px-2.5 py-1.5 text-[11px]">
          <ArrowRight className="h-3.5 w-3.5" /> دفتر مشتریان
        </Link>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-[#c9d7e3] bg-white p-3 text-[11px]">
          <b className="block text-[#1e4776]">مشخصات</b>
          <span className="mt-1 block text-slate-600">ارز اصلی: {customer.currency}</span>
          <span className="block text-slate-600">ماندهٔ افتتاحیه: <span className="tabular-nums">{money(customer.opening)}</span></span>
          <span className="block text-slate-600">وضعیت: {customer.status}</span>
        </div>
        <div className="rounded-xl border border-[#c9d7e3] bg-white p-3 text-[11px]">
          <b className="block text-[#1e4776]">جمع‌ها</b>
          {totals.length ? totals.map(item => (
            <span key={item.currency} className="mt-1 flex justify-between text-slate-600">
              <span>{item.currency}</span>
              <span className="tabular-nums">بدهکار {money(item.debit)} · بستانکار {money(item.credit)}</span>
            </span>
          )) : <span className="mt-1 block text-slate-500">گردشی ثبت نشده است.</span>}
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <header className="border-b border-[#e2eaf1] bg-[#f2f7fb] px-3 py-2 text-[11px] font-bold text-[#1e4776]">دفتر حساب مشتری</header>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[11px]">
              <thead className="bg-gradient-to-l from-[#164b87] to-[#276bb2] text-white">
                <tr>{['تاریخ', 'نوع', 'شرح', 'بدهکار', 'بستانکار', 'مانده', 'ارز'].map(title => <th key={title} className="p-2 text-right font-bold">{title}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-t border-[#eef3f7] even:bg-[#f7faff]">
                    <td className="p-2 whitespace-nowrap">{displayDate(row.date) || '—'}</td>
                    <td className="p-2">{row.type}</td>
                    <td className="p-2">{row.description || '—'}</td>
                    <td className="p-2 text-center tabular-nums text-rose-700">{money(row.debit)}</td>
                    <td className="p-2 text-center tabular-nums text-emerald-700">{money(row.credit)}</td>
                    <td className="p-2 text-center font-bold tabular-nums text-[#1e4776]">{money(row.runningBalance)} · {row.runningSide}</td>
                    <td className="p-2 text-center">{row.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-6 text-center text-[11px] text-slate-500">برای این مشتری گردشی ثبت نشده است.</p>}
      </section>
    </div>
  );
}