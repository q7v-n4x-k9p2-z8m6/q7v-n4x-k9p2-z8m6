// a1/components/v21/transactions/TransactionsCenter.jsx
// نمایش فشردهٔ مرکز معاملات در تنظیمات صراف؛ همان بدنهٔ مرکز مستقل را استفاده می‌کند.
// این بخش فقط خواندنی است و هیچ سند یا گردش مالی جدیدی نمی‌سازد.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react';
import { getDesktopGateway } from '@/app/container';
import TransactionsBoard from './TransactionsBoard';

const { load: loadVersion21Database } = getDesktopGateway();

export default function TransactionsCenter() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await loadVersion21Database();
      setData(result.data);
      setStatus('ready');
    } catch (err) {
      setError(err?.message || 'بارگذاری معاملات ناموفق بود.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="space-y-2 rounded-xl border border-border bg-card p-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-primary">
            <ArrowLeftRight className="h-4 w-4" /> مرکز معاملات
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            نمای تجمیعی و پیگیری معاملات؛ ثبت و ویرایش در ماژول تخصصی هر عملیات انجام می‌شود.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {status === 'loading' ? 'در حال بارگذاری…' : 'تازه‌سازی'}
        </button>
      </header>

      {status === 'loading' && <p className="p-6 text-center text-xs text-muted-foreground">در حال بارگذاری معاملات…</p>}

      {status === 'error' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {error}
          <button type="button" onClick={load} className="mr-2 font-bold underline">تلاش دوباره</button>
        </div>
      )}

      {status === 'ready' && data && <TransactionsBoard data={data} activity={data.activity || []} />}
    </section>
  );
}