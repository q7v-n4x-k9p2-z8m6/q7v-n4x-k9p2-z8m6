// a1/pages/Backup.jsx — پشتیبان‌گیری محلی (ساختار: src/pages/Backup.jsx سورس A1)
// فایل پشتیبان فقط از جدول‌های IndexedDB همین مرورگر ساخته می‌شود؛ بازیابی در میز کار انجام می‌شود.
import React, { useEffect, useState } from 'react';
import { Database, Download, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { A1_TABLES, all, insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

const fmt = value => new Intl.NumberFormat('fa-IR').format(Number(value) || 0);

export default function Backup() {
  const [state, setState] = useState({ loading: true, records: [], counts: {}, error: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [records, ...tables] = await Promise.all([all('backup_records'), ...A1_TABLES.map(table => all(table))]);
      const counts = {};
      A1_TABLES.forEach((table, index) => { counts[table] = tables[index].length; });
      setState({ loading: false, records: records.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))), counts, error: '' });
    } catch (error) {
      setState({ loading: false, records: [], counts: {}, error: error?.message || 'خواندن جدول‌های محلی ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const user = currentUser();
      const payload = { version: 21, createdAt: new Date().toISOString(), exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE, tables: {} };
      for (const table of A1_TABLES) payload.tables[table] = await all(table);
      const text = JSON.stringify(payload, null, 2);
      const fileName = `hisab-sarraf-local-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([text], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      await insert('backup_records', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        type: 'manual', status: 'success', file_name: fileName, size_bytes: text.length,
        record_counts: Object.fromEntries(A1_TABLES.map(table => [table, (payload.tables[table] || []).length])),
        entity_types: A1_TABLES, notes: 'پشتیبان محلی مرورگر — بدون اتصال به سرور',
        user_name: user?.full_name || user?.username || 'کاربر نمایشی',
      });
      await load();
      setNotice('فایل پشتیبان از دادهٔ همین مرورگر ساخته و دانلود شد.');
    } catch (error) {
      setNotice('ساخت پشتیبان انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setBusy(false); }
  };

  const totalRows = Object.values(state.counts).reduce((sum, value) => sum + value, 0);

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Database className="h-5 w-5" /></span>
          <div>
            <h1 className="text-sm font-extrabold text-[#1e4776]">پشتیبان‌گیری و بازیابی</h1>
            <p className="text-[10px] text-slate-500">{fmt(A1_TABLES.length)} جدول محلی · {fmt(totalRows)} رکورد</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] bg-white px-2.5 py-1.5 text-[11px]"><RefreshCw className="h-3.5 w-3.5" /> تازه‌سازی</button>
          <button type="button" onClick={createBackup} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-[#164b87] px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} ساخت فایل پشتیبان
          </button>
        </div>
      </header>

      {notice ? <p className="rounded-xl border border-[#c9d7e3] bg-[#f2f7fc] px-3 py-2 text-[11px] text-[#1e4776]">{notice}</p> : null}

      <section className="rounded-xl border border-[#c9d7e3] bg-white p-3 text-[10.5px] leading-6 text-slate-600">
        <b className="mb-1 flex items-center gap-1 text-[11px] text-[#1e4776]"><ShieldCheck className="h-4 w-4" /> محدودهٔ پشتیبان</b>
        فایل خروجی شامل جدول‌های محلی همین دستگاه است و هیچ داده‌ای به سرور، Supabase یا حساب واقعی ارسال نمی‌شود. بازیابی از داخل میز کار و فقط به‌صورت پیش‌نمایش محلی انجام می‌شود.
      </section>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">سابقهٔ پشتیبان‌گیری</h2>
        {state.loading ? <p className="p-6 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-6 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.records.length ? <p className="p-6 text-center text-[11px] text-slate-500">هنوز پشتیبانی ساخته نشده است.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[11px]">
                    <thead className="bg-[#edf4fb] text-[#102b4c]">
                      <tr><th className="p-2 text-right">تاریخ</th><th className="p-2 text-right">فایل</th><th className="p-2">کاربر</th><th className="p-2">حجم</th><th className="p-2">وضعیت</th></tr>
                    </thead>
                    <tbody>
                      {state.records.map(row => (
                        <tr key={row.id} className="border-t border-[#eef3f7]">
                          <td className="p-2 whitespace-nowrap">{String(row.created_at || '').slice(0, 10)}</td>
                          <td className="p-2">{row.file_name || '—'}</td>
                          <td className="p-2 text-center">{row.user_name || '—'}</td>
                          <td className="p-2 text-center tabular-nums">{fmt(Math.round((Number(row.size_bytes) || 0) / 1024))} KB</td>
                          <td className="p-2 text-center">{row.status === 'success' ? 'موفق' : row.status || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </section>
    </div>
  );
}