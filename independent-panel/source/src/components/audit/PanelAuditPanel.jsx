// src/components/audit/PanelAuditPanel.jsx — پنل اجرای ممیزی سرتاسری پنل صراف
// همان مجموعهٔ آزمون‌های خودکار (core/audit) را روی دادهٔ ساختگی محلی اجرا و نتیجه را نشان می‌دهد.
// هیچ داده‌ای از حساب واقعی خوانده یا نوشته نمی‌شود.
import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, XCircle, Loader2, ChevronDown, SkipForward } from 'lucide-react';
import { runPanelAudit } from '@/core/audit/panelAudit';

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');

export default function PanelAuditPanel() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [showPassed, setShowPassed] = useState(false);

  const start = async () => {
    if (running) return;
    setRunning(true);
    setError('');
    try {
      setReport(await runPanelAudit());
    } catch (failure) {
      setError(failure?.message || 'اجرای ممیزی ناموفق بود.');
    } finally {
      setRunning(false);
    }
  };

  const failed = (report?.results || []).filter((item) => !item.ok);
  const skipped = (report?.results || []).filter((item) => item.skipped);
  const passed = (report?.results || []).filter((item) => item.ok && !item.skipped);

  return (
    <section className="rounded-2xl border border-border bg-card p-3 text-right" dir="rtl" aria-label="ممیزی سرتاسری پنل صراف">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <b className="flex items-center gap-1.5 text-[12px] font-extrabold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            ممیزی سرتاسری پنل صراف
          </b>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            ۲۵ بخش، عملیات، محاسبات، ابطال، گزارش‌ها، مجوزها و هم‌خوانی دو پوسته — روی دادهٔ ساختگی محلی و بدون اتصال بیرونی.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'در حال اجرا...' : report ? 'اجرای دوباره' : 'اجرای ممیزی'}
        </button>
      </div>

      {error ? <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">{error}</p> : null}

      {report ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-lg bg-muted px-2 py-1">کل آزمون: <b>{fa(report.total)}</b></span>
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">موفق: <b>{fa(report.passed)}</b></span>
            <span className={'rounded-lg px-2 py-1 ' + (report.failed ? 'bg-rose-50 text-rose-700' : 'bg-muted text-muted-foreground')}>ناموفق: <b>{fa(report.failed)}</b></span>
            <span className={'rounded-lg px-2 py-1 ' + (report.skipped ? 'bg-amber-50 text-amber-800' : 'bg-muted text-muted-foreground')}>رد شد: <b>{fa(report.skipped)}</b></span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: (report.total ? (report.passed / report.total) * 100 : 0) + '%' }} />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            {report.groups.map((group) => (
              <div key={group.name} className="rounded-xl border border-border/70 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="min-w-0 truncate font-bold text-foreground">{group.name}</span>
                  <span className={group.failed ? 'text-rose-600' : group.skipped ? 'text-amber-700' : 'text-emerald-600'}>
                    {fa(group.passed)}/{fa(group.total)}{group.skipped ? ' · ' + fa(group.skipped) + ' رد شد' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {failed.length ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2">
              <b className="text-[10px] text-rose-800">آزمون‌های ناموفق ({fa(failed.length)})</b>
              <ul className="mt-1 space-y-1">
                {failed.map((item) => (
                  <li key={item.group + item.name} className="flex items-start gap-1 text-[10px] leading-5 text-rose-800">
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span><b>{item.group} · {item.name}</b>{item.message ? ' — ' + item.message : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {skipped.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2">
              <b className="text-[10px] text-amber-900">آزمون‌های رد‌شده ({fa(skipped.length)}) — اجرا متوقف نشد</b>
              <ul className="mt-1 space-y-1">
                {skipped.map((item) => (
                  <li key={item.group + item.name} className="flex items-start gap-1 text-[10px] leading-5 text-amber-900">
                    <SkipForward className="mt-0.5 h-3 w-3 shrink-0" />
                    <span><b>{item.group} · {item.name}</b>{item.message ? ' — ' + item.message : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!failed.length ? (
            <p className={'flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[10px] ' + (skipped.length ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {skipped.length
                ? 'همهٔ آزمون‌های اجراشده موفق بودند؛ ' + fa(skipped.length) + ' آزمون به‌دلیل نبود پیش‌نیاز رد شد و بالا فهرست شده است.'
                : 'همهٔ آزمون‌ها موفق بودند؛ هیچ ایرادی در این اجرا پیدا نشد.'}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setShowPassed((current) => !current)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 px-2 py-1.5 text-[10px] text-muted-foreground"
            aria-expanded={showPassed}
          >
            <span>فهرست آزمون‌های موفق ({fa(passed.length)})</span>
            <ChevronDown className={'h-3.5 w-3.5 transition-transform ' + (showPassed ? 'rotate-180' : '')} />
          </button>
          {showPassed ? (
            <ul className="space-y-1">
              {passed.map((item) => (
                <li key={item.group + item.name} className="flex items-start gap-1 text-[10px] leading-5 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                  <span>{item.group} · {item.name}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="text-[9px] leading-5 text-muted-foreground">
            زمان اجرا: {new Date(report.generatedAt).toLocaleString('fa-IR')} — نتیجهٔ این اجرا فقط برای دادهٔ ساختگی همان لحظه معتبر است.
          </p>
        </div>
      ) : null}
    </section>
  );
}