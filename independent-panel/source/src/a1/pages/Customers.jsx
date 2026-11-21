// a1/pages/Customers.jsx — صفحهٔ مستقل دفتر مشتریان
// مبنا: src/components/sarraaf/v21/Version21Customers.jsx در سورس A1؛ داده از جدول‌های محلی.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Pencil, Eye, X, Save, Loader2, AlertTriangle } from 'lucide-react';
import { getDesktopGateway } from '@/app/container';

const {
  load: loadVersion21Database,
  save: saveVersion21Record,
} = getDesktopGateway();
const CURRENCIES = ['AFN', 'USD', 'EUR', 'AED', 'PKR', 'IRR'];
const EMPTY = { name: '', phone: '', code: '', kind: 'دائمی', currency: 'AFN', opening: '', status: 'فعال' };

export default function Customers() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, customers: [], error: '' });
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const bundle = await loadVersion21Database();
      setState({ loading: false, customers: bundle.data.customers || [], error: '' });
    } catch (error) {
      setState({ loading: false, customers: [], error: error?.message || 'بارگذاری مشتریان ناموفق بود.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => state.customers.filter(customer => {
    const text = query.trim().toLowerCase();
    const matchesText = !text || [customer.name, customer.phone, customer.code].join(' ').toLowerCase().includes(text);
    const matchesKind = kind === 'all' || (kind === 'permanent' ? customer.kind === 'دائمی' : customer.kind === 'موقتی');
    return matchesText && matchesKind;
  }), [state.customers, query, kind]);

  const openNew = () => { setDraft(EMPTY); setMessage(''); setOpen(true); };
  const openEdit = customer => {
    setDraft({
      id: customer.id, name: customer.name || '', phone: customer.phone || '', code: customer.code || '',
      kind: customer.kind || 'دائمی', currency: customer.currency || 'AFN',
      opening: String(customer.opening ?? ''), status: customer.status || 'فعال',
    });
    setMessage('');
    setOpen(true);
  };

  const submit = async event => {
    event.preventDefault();
    if (!draft.name.trim()) { setMessage('نام مشتری الزامی است.'); return; }
    setSaving(true);
    try {
      await saveVersion21Record('customers', draft);
      setOpen(false);
      await load();
      setMessage('اطلاعات مشتری ذخیره شد.');
    } catch (error) {
      setMessage('ثبت انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const field = (label, key, type = 'text') => (
    <label className="block space-y-1 text-[11px]">
      <span className="text-slate-600">{label}</span>
      <input type={type} value={draft[key] ?? ''} onChange={event => setDraft(prev => ({ ...prev, [key]: event.target.value }))}
        className="h-9 w-full rounded-lg border border-[#c9d7e3] bg-white px-2 outline-none focus:border-[#1e4776]" />
    </label>
  );

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white"><Users className="h-5 w-5" /></span>
          <div>
            <h1 className="text-sm font-extrabold text-[#1e4776]">دفتر مشتریان · نسخهٔ ۲۱</h1>
            <p className="text-[10px] text-slate-500">صفحهٔ مستقل روی داده‌های محلی همین دستگاه</p>
          </div>
        </div>
        <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4776] px-3 py-2 text-[11px] font-bold text-white">
          <Plus className="h-4 w-4" /> مشتری جدید
        </button>
      </header>

      {message ? <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">{message}</p> : null}

      <div className="grid gap-2 rounded-xl border border-[#c9d7e3] bg-white p-2 sm:grid-cols-[1fr_auto]">
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-[#e2eaf1] px-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی نام، موبایل یا کد"
            className="w-full bg-transparent text-[12px] outline-none" />
        </label>
        <select value={kind} onChange={event => setKind(event.target.value)} className="min-h-9 rounded-lg border border-[#e2eaf1] bg-white px-2 text-[11px]">
          <option value="all">همه انواع</option>
          <option value="permanent">دائمی</option>
          <option value="temporary">موقت</option>
        </select>
      </div>

      <div className="flex justify-between px-1 text-[11px]"><b>فهرست مشتریان</b><span className="text-slate-500">{rows.length} مورد</span></div>

      <div className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        {state.loading ? <p className="p-6 text-center text-[11px] text-slate-500">در حال دریافت اطلاعات…</p>
          : state.error ? <p className="flex items-center justify-center gap-1.5 p-6 text-center text-[11px] text-rose-700"><AlertTriangle className="h-4 w-4" /> {state.error}</p>
            : !rows.length ? <p className="p-6 text-center text-[11px] text-slate-500">مشتری‌ای یافت نشد.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[11px]">
                    <thead className="bg-gradient-to-l from-[#164b87] to-[#276bb2] text-white">
                      <tr>{['نام مشتری', 'موبایل', 'کد', 'نوع', 'وضعیت', 'عملیات'].map(title => <th key={title} className="p-2 text-right font-bold">{title}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map(customer => (
                        <tr key={customer.id} className="border-t border-[#eef3f7] even:bg-[#f7faff]">
                          <td className="p-2 font-semibold">{customer.name || '—'}</td>
                          <td className="p-2" dir="ltr">{customer.phone || '—'}</td>
                          <td className="p-2">{customer.code || '—'}</td>
                          <td className="p-2">{customer.kind || '—'}</td>
                          <td className="p-2">{customer.status || '—'}</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => navigate(`/customers/${customer.id}`)} title="مشاهده حساب" className="rounded-lg p-1.5 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                              <button type="button" onClick={() => openEdit(customer)} title="ویرایش" className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3">
          <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1e4776]">{draft.id ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="بستن"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {field('نام مشتری *', 'name')}
              {field('شماره موبایل', 'phone')}
              {field('کد مشتری', 'code')}
              <label className="block space-y-1 text-[11px]">
                <span className="text-slate-600">نوع مشتری</span>
                <select value={draft.kind} onChange={event => setDraft(prev => ({ ...prev, kind: event.target.value }))} className="h-9 w-full rounded-lg border border-[#c9d7e3] px-2">
                  <option>دائمی</option><option>موقتی</option>
                </select>
              </label>
              <label className="block space-y-1 text-[11px]">
                <span className="text-slate-600">ارز اصلی</span>
                <select value={draft.currency} onChange={event => setDraft(prev => ({ ...prev, currency: event.target.value }))} className="h-9 w-full rounded-lg border border-[#c9d7e3] px-2">
                  {CURRENCIES.map(code => <option key={code}>{code}</option>)}
                </select>
              </label>
              {field('ماندهٔ افتتاحیه', 'opening', 'number')}
              <label className="block space-y-1 text-[11px]">
                <span className="text-slate-600">وضعیت</span>
                <select value={draft.status} onChange={event => setDraft(prev => ({ ...prev, status: event.target.value }))} className="h-9 w-full rounded-lg border border-[#c9d7e3] px-2">
                  <option>فعال</option><option>غیرفعال</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#eef3f7] pt-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-[11px]">انصراف</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4776] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}