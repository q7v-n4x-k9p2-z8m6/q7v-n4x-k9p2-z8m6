// a1/pages/MainSettings.jsx — تنظیمات اصلی صرافی (مبنا: src/pages/MainSettings.jsx سورس A1)
// فقط جدول‌های محلی همین دستگاه را ویرایش می‌کند؛ هیچ اتصال بیرونی ندارد.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Save, Loader2, Check, Store, ShieldCheck } from 'lucide-react';
import { all, update } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import TransactionsCenter from '@/a1/components/v21/transactions/TransactionsCenter';
import UsersAccessPanel from '@/a1/components/v21/access/UsersAccessPanel';

const FIELDS = [
  ['exchange_name', 'نام صرافی'],
  ['mobile', 'شماره تماس'],
  ['city', 'شهر'],
  ['country', 'کشور'],
  ['email', 'ایمیل (اختیاری)'],
];

// تب‌های تنظیمات؛ «مدیریت کاربران و دسترسی‌ها» در همین صفحه و کنار تنظیمات صرافی قرار دارد
const SETTINGS_TABS = [
  { key: 'exchange', label: 'تنظیمات صرافی', icon: Store },
  { key: 'users', label: 'مدیریت کاربران و دسترسی‌ها', icon: ShieldCheck },
];

export default function MainSettings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'users' ? 'users' : 'exchange';
  const setTab = (nextTab) => {
    const params = new URLSearchParams(searchParams);
    if (nextTab === 'users') params.set('tab', 'users');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  };
  const user = currentUser();
  const exchangeCode = user?.exchange_code || DEMO_EXCHANGE_CODE;
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    const rows = await all('exchanges');
    const found = rows.find(row => row.exchange_code === exchangeCode) || rows[0] || null;
    setRecord(found);
    setForm({
      exchange_name: found?.exchange_name || found?.name || '',
      mobile: found?.mobile || '',
      city: found?.city || '',
      country: found?.country || '',
      email: found?.email || '',
    });
    setStatus('ready');
  }, [exchangeCode]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!record) return;
    setStatus('saving');
    try {
      await update('exchanges', record.id, {
        exchange_name: form.exchange_name,
        name: form.exchange_name,
        mobile: form.mobile,
        city: form.city,
        country: form.country,
        email: form.email,
      });
      await load();
      setMessage('تنظیمات صرافی ذخیره شد.');
    } catch (error) {
      setStatus('ready');
      setMessage('ذخیره انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">تنظیمات اصلی</h1>
          <p className="text-[10px] text-slate-500">این تنظیمات فقط در جدول exchanges همین دستگاه ذخیره می‌شود.</p>
        </div>
        <button type="button" onClick={() => navigate('/builder')} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] px-2.5 py-1.5 text-[11px]">
          <ArrowRight className="h-3.5 w-3.5" /> پنل سازنده
        </button>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="تب‌های تنظیمات">
        {SETTINGS_TABS.map((item) => {
          const Icon = item.icon;
          const activeTab = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={activeTab}
              className={'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold ' + (activeTab ? 'border-[#1e4776] bg-[#1e4776] text-white' : 'border-[#c9d7e3] bg-white text-[#2a5477]')}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          );
        })}
      </nav>

      {tab === 'users' ? <UsersAccessPanel /> : (
      <>
      {status === 'loading' ? <p className="p-6 text-center text-xs text-slate-500">در حال بارگذاری…</p> : (
        <section className="rounded-xl border border-[#c9d7e3] bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="space-y-1 text-[11px]">
                <span className="text-slate-600">{label}</span>
                <input value={form[key] || ''} onChange={event => setForm(prev => ({ ...prev, [key]: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-[#c9d7e3] bg-white px-2 outline-none focus:border-[#1e4776]" />
              </label>
            ))}
            <label className="space-y-1 text-[11px]">
              <span className="text-slate-600">کد صرافی (فقط خواندنی)</span>
              <input value={record?.exchange_code || exchangeCode} readOnly dir="ltr"
                className="h-9 w-full rounded-lg border border-[#e2eaf1] bg-[#f5f9fc] px-2 text-slate-500" />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#eef3f7] pt-3">
            {message ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700"><Check className="h-3.5 w-3.5" /> {message}</span> : <span />}
            <button type="button" onClick={save} disabled={status === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4776] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {status === 'saving' ? 'در حال ذخیره…' : 'ذخیره'}
            </button>
          </div>
        </section>
      )}

      <TransactionsCenter />
      </>
      )}
    </div>
  );
}