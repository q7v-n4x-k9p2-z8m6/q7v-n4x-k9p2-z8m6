// a1/pages/PaymentGateway.jsx — درگاه پرداخت محلی (ساختار: src/pages/PaymentGateway.jsx سورس A1)
// درگاه‌ها فقط در جدول bank_gateways همین دستگاه ثبت می‌شوند؛ هیچ کلید یا اتصال واقعی ذخیره نمی‌شود.
import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { all, insert, update } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

export default function PaymentGateway() {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const [form, setForm] = useState({ gateway_name: '', bank_name: '', currency: 'AFN' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const rows = await all('bank_gateways');
      setState({ loading: false, rows: rows.filter(row => !row.exchange_code || row.exchange_code === code), error: '' });
    } catch (error) {
      setState({ loading: false, rows: [], error: error?.message || 'خواندن درگاه‌ها ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async event => {
    event.preventDefault();
    if (!form.gateway_name.trim()) { setNotice('نام درگاه لازم است.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('bank_gateways', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        gateway_name: form.gateway_name.trim(), bank_name: form.bank_name.trim(),
        currency: form.currency, active: true, mode: 'local-demo',
      });
      setForm({ gateway_name: '', bank_name: '', currency: 'AFN' });
      setNotice('درگاه نمایشی ثبت شد؛ اتصال واقعی برقرار نمی‌شود.');
      await load();
    } catch (error) {
      setNotice('ثبت درگاه انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const toggle = async row => {
    try {
      await update('bank_gateways', row.id, { active: !row.active });
      await load();
    } catch (error) {
      setNotice('تغییر وضعیت انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><CreditCard className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">درگاه پرداخت</h1>
          <p className="text-[10px] text-slate-500">فقط ثبت محلی مشخصات درگاه · بدون کلید، توکن یا اتصال بانکی</p>
        </div>
      </header>

      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10.5px] leading-6 text-amber-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        این بخش ساختار درگاه را در نسخهٔ ۲۱ نمایش می‌دهد. در این پیش‌نمایش هیچ تراکنش بانکی انجام نمی‌شود و اطلاعات محرمانهٔ درگاه ذخیره نمی‌گردد.
      </p>

      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3 sm:grid-cols-2">
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">نام درگاه *</span>
          <input value={form.gateway_name} onChange={e => setForm(prev => ({ ...prev, gateway_name: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">بانک</span>
          <input value={form.bank_name} onChange={e => setForm(prev => ({ ...prev, bank_name: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">ارز</span>
          <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2">
            {['AFN', 'USD', 'EUR'].map(code => <option key={code}>{code}</option>)}
          </select>
        </label>
        <div className="flex items-end justify-between gap-2 sm:col-span-2">
          <span className="text-[10.5px] text-slate-500">{notice}</span>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[#164b87] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} ثبت درگاه
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">درگاه‌های ثبت‌شده</h2>
        {state.loading ? <p className="p-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-5 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.rows.length ? <p className="p-5 text-center text-[11px] text-slate-500">درگاهی ثبت نشده است.</p>
              : (
                <ul className="divide-y divide-[#eef3f7]">
                  {state.rows.map(row => (
                    <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[#1e4776]">{row.gateway_name || row.name || 'درگاه'}</b>
                        <small className="text-slate-500">{row.bank_name || '—'} · {row.currency || 'AFN'}</small>
                      </span>
                      <button type="button" onClick={() => toggle(row)}
                        className={'shrink-0 rounded-full px-2 py-0.5 text-[9px] ' + (row.active !== false ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                        {row.active !== false ? 'فعال' : 'غیرفعال'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
      </section>
    </div>
  );
}