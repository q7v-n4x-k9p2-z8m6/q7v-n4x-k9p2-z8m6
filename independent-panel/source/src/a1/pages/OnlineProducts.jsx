// a1/pages/OnlineProducts.jsx — محصولات آنلاین (ساختار: src/pages/OnlineProducts.jsx سورس A1)
// شارژ، بستهٔ اینترنت و خدمات دیجیتال به‌صورت محلی و نمایشی ثبت می‌شوند؛ هیچ اتصال به سرویس بیرونی نیست.
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Plus, ShoppingBag } from 'lucide-react';
import { all, insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

const KINDS = [
  { id: 'wallet', label: 'کیف و اعتبار' },
  { id: 'recharge', label: 'شارژ و بستهٔ اینترنت' },
  { id: 'games', label: 'بازی و UC' },
];
const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

export default function OnlineProducts({ kind: kindProp }) {
  const { kind: kindParam } = useParams();
  const kind = kindProp || kindParam || 'all';
  const [state, setState] = useState({ loading: true, products: [], orders: [], error: '' });
  const [form, setForm] = useState({ product_name: '', amount: '', currency: 'AFN', customer_name: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const [products, requests] = await Promise.all([all('online_products'), all('online_requests')]);
      const inTenant = row => !row.exchange_code || row.exchange_code === code;
      setState({
        loading: false,
        products: products.filter(row => inTenant(row) && (kind === 'all' || (row.kind || 'wallet') === kind)),
        orders: requests.filter(row => inTenant(row) && (kind === 'all' || (row.kind || 'wallet') === kind)),
        error: '',
      });
    } catch (error) {
      setState({ loading: false, products: [], orders: [], error: error?.message || 'خواندن محصولات ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, [kind]);

  const submit = async event => {
    event.preventDefault();
    if (!form.product_name.trim() || !(Number(form.amount) > 0)) { setNotice('نام محصول و مبلغ مثبت لازم است.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('online_requests', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        kind, product_name: form.product_name.trim(), amount: Number(form.amount),
        currency: form.currency, customer_name: form.customer_name.trim() || 'مشتری نقدی',
        status: 'pending', channel: 'local-demo',
      });
      setForm({ product_name: '', amount: '', currency: 'AFN', customer_name: '' });
      setNotice('سفارش نمایشی در همین دستگاه ثبت شد.');
      await load();
    } catch (error) {
      setNotice('ثبت سفارش انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><ShoppingBag className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">محصولات آنلاین</h1>
          <p className="text-[10px] text-slate-500">فروش محلی و نمایشی · بدون اتصال به اپراتور یا فروشندهٔ بیرونی</p>
        </div>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {KINDS.map(item => (
          <Link key={item.id} to={`/online-products/${item.id}`}
            className={'shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ' + ((kind === item.id) ? 'border-[#164b87] bg-[#164b87] text-white' : 'border-[#c9d7e3] bg-white text-[#1e4776]')}>
            {item.label}
          </Link>
        ))}
      </nav>

      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3 sm:grid-cols-2">
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">نام محصول *</span>
          <input value={form.product_name} onChange={e => setForm(prev => ({ ...prev, product_name: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">مبلغ *</span>
          <input value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} inputMode="decimal" className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">ارز</span>
          <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2">
            {['AFN', 'USD', 'EUR', 'AED'].map(code => <option key={code}>{code}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">مشتری</span>
          <input value={form.customer_name} onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <div className="flex items-center justify-between gap-2 border-t border-[#eef3f7] pt-2 sm:col-span-2">
          <span className="text-[10.5px] text-slate-500">{notice}</span>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[#164b87] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} ثبت سفارش
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">فهرست محصولات</h2>
        {state.loading ? <p className="p-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-5 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.products.length ? <p className="p-5 text-center text-[11px] text-slate-500">محصولی برای این بخش ثبت نشده است.</p>
              : (
                <ul className="divide-y divide-[#eef3f7]">
                  {state.products.map(row => (
                    <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                      <b className="min-w-0 flex-1 truncate text-[#1e4776]">{row.name || row.product_name || 'محصول'}</b>
                      <span className="shrink-0 tabular-nums">{money(row.price ?? row.amount)} {row.currency || 'AFN'}</span>
                      <span className="shrink-0 rounded-full bg-[#e9f1f8] px-2 py-0.5 text-[9px] text-[#1e4776]">نمایشی</span>
                    </li>
                  ))}
                </ul>
              )}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">سفارش‌های ثبت‌شده</h2>
        {!state.orders.length ? <p className="p-5 text-center text-[11px] text-slate-500">سفارشی ثبت نشده است.</p>
          : (
            <ul className="divide-y divide-[#eef3f7]">
              {state.orders.map(row => (
                <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                  <span className="min-w-0 flex-1 truncate">{row.product_name || 'سفارش'} · {row.customer_name || '—'}</span>
                  <span className="shrink-0 tabular-nums">{money(row.amount)} {row.currency || 'AFN'}</span>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-800">{row.status === 'pending' ? 'در انتظار' : row.status}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}