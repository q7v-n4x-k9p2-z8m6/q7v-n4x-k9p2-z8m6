// a1/pages/Transactions.jsx — مرکز مستقل معاملات
// فقط نمایش و تجمیع رکوردهای موجود؛ هیچ معامله، سند یا گردش مالی جدیدی نمی‌سازد.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react';
import { getDesktopGateway } from '@/app/container';
import TransactionsBoard from '@/a1/components/v21/transactions/TransactionsBoard';
import TransactionsArchitecture from '@/a1/components/v21/transactions/TransactionsArchitecture';
import { formatDate } from '@/a1/lib/format';

const { load: loadVersion21Database } = getDesktopGateway();

export default function Transactions() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  const [view, setView] = useState('list');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await loadVersion21Database();
      setData(result.data);
      setLoadedAt(result.loadedAt);
      setStatus('ready');
    } catch (err) {
      setError(err?.message || 'بارگذاری معاملات ناموفق بود.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ArrowLeftRight className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-primary">مرکز معاملات</h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              تجمیع و پیگیری معاملات ارزی، حواله، دریافت و پرداخت، مصارف و اسناد مرتبط — فقط نمایش.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
            دادهٔ ساختگی محلی
          </span>
          <button
            type="button"
            onClick={load}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {status === 'loading' ? 'در حال بارگذاری…' : 'تازه‌سازی'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700"
          >
            <ArrowRight className="h-3.5 w-3.5" /> میزکار
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="نمای مرکز معاملات" className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'list'}
          onClick={() => setView('list')}
          className={'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ' + (
            view === 'list' ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-secondary'
          )}
        >
          فهرست معاملات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'architecture'}
          onClick={() => setView('architecture')}
          className={'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ' + (
            view === 'architecture' ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-secondary'
          )}
        >
          معماری و منابع
        </button>
      </div>

      {view === 'architecture' ? (
        <TransactionsArchitecture />
      ) : (
        <>
      {status === 'error' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {error}
          <button type="button" onClick={load} className="mr-2 font-bold underline">تلاش دوباره</button>
        </div>
      )}

      {status === 'loading' && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">در حال بارگذاری معاملات…</div>
      )}

      {status === 'ready' && data && (
        <>
          <TransactionsBoard data={data} activity={data.activity || []} />
          <p className="text-[10px] text-muted-foreground">
            {loadedAt ? 'آخرین بارگذاری: ' + formatDate(loadedAt, true) + ' · ' : ''}
            رکوردها از ماژول‌های تخصصی خوانده می‌شوند؛ در این نسخه آزمایشی هیچ ثبت واقعی، پرداخت یا اتصال بیرونی انجام نمی‌شود.
          </p>
        </>
      )}
        </>
      )}
    </div>
  );
}