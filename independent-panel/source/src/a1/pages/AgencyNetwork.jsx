// a1/pages/AgencyNetwork.jsx — شبکهٔ نمایندگی‌ها (ساختار: src/pages/AgencyNetwork.jsx سورس A1)
// دادهٔ نمایندگی‌ها همان جدول origins است که میز کار هم از آن استفاده می‌کند؛ همه‌چیز محلی است.
import React, { useEffect, useState } from 'react';
import { Network, Loader2, Plus, Phone } from 'lucide-react';
import { all, insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

export default function AgencyNetwork() {
  const [state, setState] = useState({ loading: true, origins: [], links: [], error: '' });
  const [form, setForm] = useState({ name: '', city: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const [origins, links] = await Promise.all([all('origins'), all('agency_links')]);
      const inTenant = row => !row.exchange_code || row.exchange_code === code;
      setState({ loading: false, origins: origins.filter(inTenant), links: links.filter(inTenant), error: '' });
    } catch (error) {
      setState({ loading: false, origins: [], links: [], error: error?.message || 'خواندن شبکهٔ نمایندگی‌ها ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async event => {
    event.preventDefault();
    if (!form.name.trim()) { setNotice('نام نمایندگی لازم است.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('origins', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        name: form.name.trim(), city: form.city.trim(), phone: form.phone.trim(),
        type: 'agent', is_active: true, is_demo: true,
      });
      setForm({ name: '', city: '', phone: '' });
      setNotice('نمایندگی نمایشی ثبت شد و در دفتر حساب نمایندگی‌ها هم دیده می‌شود.');
      await load();
    } catch (error) {
      setNotice('ثبت نمایندگی انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Network className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">شبکهٔ نمایندگی‌ها</h1>
          <p className="text-[10px] text-slate-500">جدول origins و agency_links همین دستگاه · بدون همگام‌سازی بیرونی</p>
        </div>
      </header>

      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3 sm:grid-cols-3">
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">نام نمایندگی *</span>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">شهر</span>
          <input value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <label className="space-y-1 text-[11px]"><span className="text-slate-600">شماره تماس</span>
          <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} dir="ltr" className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2" />
        </label>
        <div className="flex items-center justify-between gap-2 sm:col-span-3">
          <span className="text-[10.5px] text-slate-500">{notice}</span>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[#164b87] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} ثبت نمایندگی
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">نمایندگی‌های فعال</h2>
        {state.loading ? <p className="p-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-5 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.origins.length ? <p className="p-5 text-center text-[11px] text-slate-500">نمایندگی ثبت نشده است.</p>
              : (
                <ul className="divide-y divide-[#eef3f7]">
                  {state.origins.map(row => (
                    <li key={row.id} className="flex items-center justify-between gap-2 p-3 text-[11px]">
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[#1e4776]">{row.name}</b>
                        <small className="text-slate-500">{row.city || '—'} · {row.type === 'agent' ? 'نمایندگی' : row.type || '—'}</small>
                      </span>
                      {row.phone ? <span className="shrink-0 inline-flex items-center gap-1 text-slate-500" dir="ltr"><Phone className="h-3 w-3" />{row.phone}</span> : null}
                      <span className={'shrink-0 rounded-full px-2 py-0.5 text-[9px] ' + (row.is_active !== false ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600')}>{row.is_active !== false ? 'فعال' : 'غیرفعال'}</span>
                    </li>
                  ))}
                </ul>
              )}
      </section>

      {state.links.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
          <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">پیوندهای ثبت‌شده</h2>
          <ul className="divide-y divide-[#eef3f7]">
            {state.links.map(row => (
              <li key={row.id} className="p-3 text-[11px] text-slate-600">{row.name || row.title || 'پیوند نمایندگی'} · {row.status || 'فعال'}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}