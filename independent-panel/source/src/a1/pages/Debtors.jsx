// a1/pages/Debtors.jsx — بدهکاران و بستانکاران (ساختار: src/pages/Debtors.jsx سورس A1)
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleDollarSign, Printer } from 'lucide-react';
import { getDesktopGateway } from '@/app/container';

const { load: loadVersion21Database } = getDesktopGateway();
const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value ?? 0) || 0);

export default function Debtors() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  // فیلتر بدهکار/بستانکار روی همان فهرست محاسبه‌شده — بدون تغییر مبدأ داده
  const [side, setSide] = useState('همه');

  useEffect(() => {
    let active = true;
    loadVersion21Database()
      .then(bundle => {
        if (!active) return;
        const rows = (bundle.data.customers || []).map(customer => {
          const lines = (bundle.data.transactions || []).filter(line => line.partyType === 'customer' && line.party === customer.name);
          const currency = customer.currency || 'AFN';
          const balance = (Number(customer.opening) || 0) - lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
          return {
            id: customer.id, name: customer.name, phone: customer.phone, currency,
            debit: Math.max(balance, 0), credit: Math.max(-balance, 0), net: balance,
          };
        }).filter(row => row.net !== 0);
        setState({ loading: false, rows, error: '' });
      })
      .catch(error => { if (active) setState({ loading: false, rows: [], error: error?.message || 'بارگذاری ناموفق بود.' }); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const map = new Map();
    state.rows.forEach(row => {
      const item = map.get(row.currency) || { currency: row.currency, debit: 0, credit: 0 };
      item.debit += row.debit; item.credit += row.credit;
      map.set(row.currency, item);
    });
    return [...map.values()];
  }, [state.rows]);

  // شمار هر طرف جدا و همیشه کنار هم نمایش داده می‌شود تا بدون تغییر فیلتر هم دیده شود
  const debtorRows = state.rows.filter(row => row.net > 0);
  const creditorRows = state.rows.filter(row => row.net < 0);
  const visibleRows = state.rows.filter(row => side === 'همه' || (side === 'بدهکار' ? row.net > 0 : row.net < 0));

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><CircleDollarSign className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">بدهکاران و بستانکاران</h1>
          <p className="text-[10px] text-slate-500">مانده از دفتر کل محلی و ماندهٔ افتتاحیهٔ مشتری محاسبه می‌شود.</p>
        </div>
      </header>

      {totals.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {totals.map(item => (
            <div key={item.currency} className="min-w-[180px] rounded-xl border border-[#c9d7e3] bg-white p-3 text-[11px]">
              <b className="block text-[#1e4776]">{item.currency}</b>
              <span className="mt-1 block text-rose-700">بدهکار: <span className="tabular-nums">{money(item.debit)}</span></span>
              <span className="block text-emerald-700">بستانکار: <span className="tabular-nums">{money(item.credit)}</span></span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#c9d7e3] bg-white p-2 text-[11px]">
        <span className="font-bold text-[#1e4776]">نمایش:</span>
        {['همه', 'بدهکار', 'بستانکار'].map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setSide(item)}
            aria-pressed={side === item}
            className={'rounded-lg border px-3 py-1.5 font-bold ' + (side === item ? 'border-[#276bb2] bg-[#e8f1fa] text-[#164b87]' : 'border-slate-200 bg-white text-slate-600')}
          >
            {item}
          </button>
        ))}
        <span className="flex flex-wrap items-center gap-x-2 text-slate-600">
          <span>تعداد بدهکاران: <b className="tabular-nums text-rose-700">{debtorRows.length}</b></span>
          <span>تعداد بستانکاران: <b className="tabular-nums text-emerald-700">{creditorRows.length}</b></span>
          <span className="text-slate-500">نمایش‌داده‌شده: <b className="tabular-nums">{visibleRows.length}</b></span>
        </span>
        <button type="button" onClick={() => window.print()} className="mr-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-[#1e4776]">
          <Printer className="h-3.5 w-3.5" />چاپ
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        {state.loading ? <p className="p-6 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-6 text-center text-[11px] text-rose-700">{state.error}</p>
            : !visibleRows.length ? <p className="p-6 text-center text-[11px] text-slate-500">مانده‌ای برای نمایش نیست.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[11px]">
                    <thead className="bg-gradient-to-l from-[#164b87] to-[#276bb2] text-white">
                      <tr>{['مشتری', 'موبایل', 'ارز', 'بدهکار', 'بستانکار', 'وضعیت'].map(title => <th key={title} className="p-2 text-right font-bold">{title}</th>)}</tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(row => (
                        <tr
                          key={row.id}
                          onClick={() => navigate(`/customers/${row.id}`)}
                          title="کلیک روی ردیف، دفتر حساب همین مشتری را باز می‌کند"
                          className="cursor-pointer border-t border-[#eef3f7] transition hover:bg-blue-50 even:bg-[#f7faff]"
                        >
                          <td className="p-2"><Link to={`/customers/${row.id}`} onClick={event => event.stopPropagation()} className="font-semibold text-[#1e4776] hover:underline">{row.name}</Link></td>
                          <td className="p-2" dir="ltr">{row.phone || '—'}</td>
                          <td className="p-2">{row.currency}</td>
                          <td className="p-2 tabular-nums text-rose-700">{money(row.debit)}</td>
                          <td className="p-2 tabular-nums text-emerald-700">{money(row.credit)}</td>
                          <td className="p-2">{row.net > 0 ? 'بدهکار' : 'بستانکار'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </div>
    </div>
  );
}