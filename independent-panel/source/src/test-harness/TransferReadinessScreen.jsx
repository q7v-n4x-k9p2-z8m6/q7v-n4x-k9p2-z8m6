// src/test-harness/TransferReadinessScreen.jsx — ماتریس آمادگی انتقال با PASS / FAIL / BLOCKED
// فقط خواندن و سنجش؛ هیچ سند، داده یا تنظیمی نوشته نمی‌شود.
import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Lock, RefreshCw } from 'lucide-react';
import { buildReadinessReport } from '@/core/transfer/readiness';

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');

const TONE = {
  PASS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAIL: 'bg-rose-50 text-rose-700 border-rose-200',
  BLOCKED: 'bg-amber-50 text-amber-800 border-amber-200',
};

const KIND_LABEL = { test: 'اجرا شده', code: 'بازبینی کد', browser: 'نیازمند مرورگر' };

function StatusIcon({ status }) {
  if (status === 'PASS') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'FAIL') return <XCircle className="h-3.5 w-3.5" />;
  return <Lock className="h-3.5 w-3.5" />;
}

export default function TransferReadinessScreen() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError('');
    try {
      setReport(await buildReadinessReport());
    } catch (failure) {
      setError(failure?.message || 'اجرای آزمون آمادگی ناموفق بود.');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { run(); }, []);

  const visibleGroups = useMemo(() => {
    if (!report) return [];
    return report.groups
      .map((group) => ({
        ...group,
        items: filter === 'ALL' ? group.items : group.items.filter((item) => item.status === filter),
      }))
      .filter((group) => group.items.length);
  }, [report, filter]);

  const summary = report?.summary;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <header className="rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <b className="flex items-center gap-1.5 text-[12px] font-extrabold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              آزمون آمادگی انتقال
            </b>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              ۲۵ بخش، موتور داده، دفاتر حساب، مجوزها، گزارش‌ها، چیدمان دو پوسته، بخش‌های سازمانی و طرح احراز هویت — بدون نوشتن هیچ داده‌ای.
            </p>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {running ? 'در حال اجرا...' : report ? 'اجرای دوباره' : 'اجرا'}
          </button>
        </div>

        {error ? <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">{error}</p> : null}

        {summary ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="rounded-lg bg-muted px-2 py-1">کل: <b>{fa(summary.total)}</b></span>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">PASS: <b>{fa(summary.passed)}</b></span>
              <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">FAIL: <b>{fa(summary.failed)}</b></span>
              <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">BLOCKED: <b>{fa(summary.blocked)}</b></span>
            </div>
            <p className={'mt-2 rounded-xl border px-2 py-1.5 text-[10px] font-bold ' + (summary.ready ? TONE.PASS : 'bg-amber-50 text-amber-900 border-amber-200')}>
              نتیجهٔ آمادگی انتقال: {summary.verdict}
            </p>
            <div className="mt-2 flex gap-1.5">
              {['ALL', 'PASS', 'FAIL', 'BLOCKED'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={'rounded-lg border px-2 py-1 text-[10px] font-bold ' + (filter === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}
                >
                  {key === 'ALL' ? 'همه' : key}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </header>

      {running && !report ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-6 text-[11px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> در حال اجرای آزمون‌ها...
        </p>
      ) : null}

      {visibleGroups.map((group) => (
        <section key={group.key} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-[12px] font-extrabold text-foreground">{group.title}</b>
            <span className={'rounded-lg border px-2 py-0.5 text-[10px] font-bold ' + (group.failed ? TONE.FAIL : group.blocked ? TONE.BLOCKED : TONE.PASS)}>
              {fa(group.passed)} از {fa(group.items.length)}
            </span>
          </div>
          <p className="mt-0.5 text-[9.5px] leading-5 text-muted-foreground">{group.note}</p>

          <ul className="mt-2 space-y-1">
            {group.items.map((item) => (
              <li key={group.key + item.id} className="rounded-xl border border-border/70 px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-[11px] font-bold text-foreground">{item.title}</span>
                  <span className={'flex shrink-0 items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ' + TONE[item.status]}>
                    <StatusIcon status={item.status} />
                    {item.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{KIND_LABEL[item.kind] || item.kind}</span>
                  <span className="leading-5">{item.evidence}</span>
                </div>
                {item.dependency ? (
                  <div className="mt-0.5 text-[9.5px] leading-5 text-amber-800">وابستگی: {item.dependency}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {report ? (
        <p className="px-1 text-[9px] leading-5 text-muted-foreground">
          اجرا در {new Date(report.generatedAt).toLocaleString('fa-IR')} — موارد «نیازمند مرورگر» در این محیط قابل تأیید نیستند و به‌عنوان BLOCKED ثبت شده‌اند.
        </p>
      ) : null}
    </div>
  );
}