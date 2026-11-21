import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, RefreshCw, Search } from 'lucide-react';
import { loadVersion21Database } from '@/components/sarraaf/Version21DataAdapter';
import { hasPermission } from '@/lib/permissions';

const fmt = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value || 0));
const dateLabel = value => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, y, m, d] = match.map(Number);
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(y, m - 1, d));
};

export default function TransactionsCenter() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadVersion21Database();
      const role = String(result?.data?.role || '').toLowerCase();
      const permissions = result?.permissions || result?.data?.permissions || [];
      if (role === 'employee' && !hasPermission(permissions, 'accounts_receivable', 'view')) {
        throw new Error('مجوز مشاهدهٔ مرکز معاملات برای حساب شما فعال نیست.');
      }
      setRows(Array.isArray(result?.data?.transactions) ? result.data.transactions.filter(row => !row.deleted) : []);
    } catch (cause) {
      setRows([]);
      setError(cause?.message || 'بارگذاری مرکز معاملات ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currencies = useMemo(() => ['all', ...new Set(rows.map(row => row.currency).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(row => (currency === 'all' || row.currency === currency) &&
      (!term || [row.number, row.type, row.party, row.account, row.description, row.cash].join(' ').toLowerCase().includes(term)));
  }, [rows, query, currency]);

  return (
    <main dir="rtl" className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#315e80] pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#b6c4cf] bg-[#edf3f7] text-[#315e80]">
            <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] text-slate-500">مرکزهای مکمل / نمای فقط‌خواندنی</p>
            <h1 className="text-lg font-extrabold text-[#24496d]">مرکز معاملات</h1>
            <p className="text-xs text-slate-500">فهرست گردش‌های ثبت‌شده از دفتر کل؛ ثبت و ویرایش در بخش تخصصی هر عملیات انجام می‌شود.</p>
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {loading ? 'در حال بارگذاری…' : 'تازه‌سازی'}
        </button>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجوی شماره سند، نوع، طرف حساب یا شرح..." className="h-10 w-full bg-transparent text-xs outline-none" />
        </label>
        <select value={currency} onChange={event => setCurrency(event.target.value)} className="h-10 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-xs">
          <option value="all">همهٔ ارزها</option>
          {currencies.filter(value => value !== 'all').map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <span className="text-xs text-slate-500">تعداد سطرهای دفتر: <b className="text-slate-800">{fmt(filtered.length)}</b></span>
      </section>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
      {loading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">در حال دریافت گردش‌های همین صراف…</div>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] border-collapse text-right text-xs">
            <thead className="bg-gradient-to-l from-[#164b87] to-[#2767a5] text-white">
              <tr>{['تاریخ','شماره سند','نوع عملیات','طرف حساب','حساب','شرح','ارز','بدهکار','بستانکار','وضعیت'].map(label => <th key={label} className="border-l border-white/15 px-3 py-3 font-bold">{label}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id} className={index % 2 ? 'bg-[#f7faff]' : 'bg-white'}>
                  <td className="border-b border-slate-100 px-3 py-2.5">{dateLabel(row.date)}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 font-semibold">{row.number || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.type || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.party || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.account || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.description || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.currency || '—'}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 tabular-nums">{fmt(row.debit)}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 tabular-nums">{fmt(row.credit)}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{row.status || '—'}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={10} className="p-10 text-center text-slate-500">موردی برای نمایش پیدا نشد.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-6 text-slate-600">
        این مرکز فقط داده‌های دفتر کل را می‌خواند و هیچ سند، مانده یا گردش مالی ایجاد، ویرایش یا حذف نمی‌کند. دسترسی به داده‌ها از نشست معتبر همان صراف و سیاست‌های موجود کنترل می‌شود.
      </p>
    </main>
  );
}
