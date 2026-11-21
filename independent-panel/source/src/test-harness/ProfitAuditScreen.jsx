// src/test-harness/ProfitAuditScreen.jsx — آزمون عملی محاسبات «مفاد معاملات» در محیط آزمون
// فقط نمایش نتیجهٔ محاسبه روی دادهٔ ساختگی؛ هیچ سند، دادهٔ مالی یا تنظیمی نوشته نمی‌شود.
import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, FlaskConical, Sigma } from 'lucide-react';
import { runTradeProfitAudit } from '@/core/audit/tradeProfitAudit';

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');

function StatusBadge({ status }) {
  const pass = status === 'PASS';
  return (
    <span className={'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ' + (pass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
      {pass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

export default function ProfitAuditScreen() {
  const report = useMemo(() => runTradeProfitAudit(), []);
  const { summary } = report;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <header className="rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <b className="flex items-center gap-1.5 text-[12px] font-extrabold text-foreground">
              <Sigma className="h-4 w-4 text-primary" />
              آزمون محاسبات مفاد معاملات
            </b>
            <p className="mt-1 flex items-center gap-1 text-[10px] leading-5 text-muted-foreground">
              <FlaskConical className="h-3 w-3 shrink-0" />
              چهار سناریوی خرید، فروش، تبدیل و برگشت/اصلاح، به‌همراه موارد نامشخص؛ روی دادهٔ ساختگی و بدون هیچ نوشتنی در دفاتر.
            </p>
          </div>
          <StatusBadge status={summary.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="rounded-lg bg-muted px-2 py-1">سناریو: <b>{fa(summary.scenarios)}</b></span>
          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">PASS: <b>{fa(summary.passedScenarios)}</b></span>
          <span className={'rounded-lg px-2 py-1 ' + (summary.failedScenarios ? 'bg-rose-50 text-rose-700' : 'bg-muted text-muted-foreground')}>FAIL: <b>{fa(summary.failedScenarios)}</b></span>
          <span className="rounded-lg bg-muted px-2 py-1">بررسی: <b>{fa(summary.passed)}</b> از <b>{fa(summary.checks)}</b></span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: (summary.checks ? (summary.passed / summary.checks) * 100 : 0) + '%' }} />
        </div>
      </header>

      {report.scenarios.map((scenario) => (
        <section key={scenario.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-[12px] font-extrabold text-foreground">{scenario.title}</b>
            <StatusBadge status={scenario.status} />
          </div>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{scenario.goal}</p>

          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {scenario.inputs.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-2 py-1 text-[10px]">
                <span className="text-muted-foreground">{label}</span>
                <b className="num text-foreground">{value}</b>
              </div>
            ))}
          </div>

          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 px-2 py-1.5 text-[10px] leading-5 text-amber-900">
            محاسبهٔ دستی: {scenario.manual}
          </p>

          <ul className="mt-2 space-y-1">
            {scenario.checks.map((check) => (
              <li key={check.label} className={'rounded-lg border px-2 py-1 text-[10px] leading-5 ' + (check.pass ? 'border-border/70' : 'border-rose-200 bg-rose-50/60')}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-start gap-1 font-bold text-foreground">
                    {check.pass ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-rose-600" />}
                    {check.label}
                  </span>
                  <span className={'shrink-0 font-bold ' + (check.pass ? 'text-emerald-600' : 'text-rose-600')}>{check.pass ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                  <span>انتظار: <b className="num text-foreground">{check.expected}</b></span>
                  <span>واقعی: <b className="num text-foreground">{check.actual}</b></span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="px-1 text-[9px] leading-5 text-muted-foreground">
        اجرا در {new Date(report.generatedAt).toLocaleString('fa-IR')} — نتیجهٔ این آزمون فقط برای دادهٔ ساختگی همین لحظه است؛ دفترها، اسناد و تنظیمات برنامه دست‌نخورده می‌مانند.
      </p>
    </div>
  );
}