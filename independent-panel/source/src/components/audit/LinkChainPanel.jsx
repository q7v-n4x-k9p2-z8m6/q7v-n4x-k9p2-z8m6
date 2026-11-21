// src/components/audit/LinkChainPanel.jsx — ممیزی زنجیرهٔ ناوبری در هر دو محیط و همهٔ نقش‌ها
// ماتریس یک‌جا سنجیده می‌شود؛ نتیجهٔ ممیزی اولیه و بازآزمون جدا نگه داشته می‌شود
// و تغییر وضعیت هر مسیر کنار همان ردیف دیده می‌شود. فقط خواندن است.
import React, { useEffect, useMemo, useState } from 'react';
import { GitBranch, Play, Loader2, CheckCircle2, XCircle, SkipForward, RefreshCw } from 'lucide-react';
import { createSessionGateway } from '@/test-harness/sessionGateway';
import { runBothEnvironments, statusTone, AUDIT_STATUS } from '@/core/audit/linkAudit';
import { AUDIT_ROLES, LINK_ENVIRONMENTS } from '@/core/navigation/linkMatrix';

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');

const STATUS_ICON = {
  [AUDIT_STATUS.pass]: CheckCircle2,
  [AUDIT_STATUS.fail]: XCircle,
  [AUDIT_STATUS.skip]: SkipForward,
};

export default function LinkChainPanel({ data, compact = false, only = null }) {
  const [initial, setInitial] = useState(null);
  const [latest, setLatest] = useState(null);
  const [running, setRunning] = useState(false);
  const [environment, setEnvironment] = useState(only === 'harness' ? 'harness' : 'preview');
  const [role, setRole] = useState('admin');
  const [statusFilter, setStatusFilter] = useState('all');

  const run = () => {
    if (running) return;
    if (!data && only !== 'harness') return;
    setRunning(true);
    try {
      // محیط هارنس با دادهٔ ساختگی در حافظه ساخته می‌شود؛ هیچ نوشتنی انجام نمی‌شود.
      const harness = createSessionGateway();
      const report = runBothEnvironments({
        previewSource: only === 'harness' ? null : data,
        harnessSource: harness,
      });
      setInitial((current) => current || report);
      setLatest(report);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    run();
    // فقط یک‌بار با دادهٔ اولیهٔ همین نشست
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRun = (latest || initial)?.runs.find((item) => item.environment === environment) || null;
  const activeRole = activeRun?.roles.find((item) => item.role === role) || activeRun?.roles[0] || null;

  const previousIndex = useMemo(() => {
    if (!latest || !initial || latest === initial) return new Map();
    const index = new Map();
    initial.runs.forEach((runItem) => {
      runItem.roles.forEach((roleItem) => {
        roleItem.items.forEach((item) => index.set(runItem.environment + '::' + roleItem.role + '::' + item.id, item.status));
      });
    });
    return index;
  }, [initial, latest]);

  const rows = (activeRole?.items || []).filter((item) => statusFilter === 'all' || item.status === statusFilter);
  const totals = (latest || initial)?.runs.reduce((sum, runItem) => {
    runItem.roles.forEach((roleItem) => {
      sum.pass += roleItem.summary.pass;
      sum.fail += roleItem.summary.fail;
      sum.skip += roleItem.summary.skip;
    });
    return sum;
  }, { pass: 0, fail: 0, skip: 0 }) || { pass: 0, fail: 0, skip: 0 };

  const isRetest = Boolean(initial && latest && initial !== latest);

  return (
    <section dir="rtl" className="card-flat p-3" aria-label="ممیزی زنجیرهٔ ناوبری">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <b className="flex items-center gap-1.5 text-[12px] font-extrabold text-foreground">
            <GitBranch className="h-4 w-4 text-primary" />
            ممیزی زنجیرهٔ ناوبری در همهٔ بخش‌ها
          </b>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            هر مسیر از ماتریس یکتا، در پیش‌نمایش میز کار و در هارنس آزمایشگاهی و برای همهٔ نقش‌های نمایشی سنجیده می‌شود؛
            فقط خواندن است و هیچ سند یا سابقه‌ای تغییر نمی‌کند.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running || (!data && only !== 'harness')}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : isRetest ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'در حال سنجش...' : isRetest ? 'بازآزمون مسیرها' : 'اجرای ممیزی'}
        </button>
      </div>

      {(latest || initial) ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">PASS: <b>{fa(totals.pass)}</b></span>
            <span className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">FAIL: <b>{fa(totals.fail)}</b></span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">SKIP: <b>{fa(totals.skip)}</b></span>
            <span className="rounded-lg border border-border/70 bg-muted/50 px-2 py-1 text-muted-foreground">
              {isRetest ? 'نتیجهٔ بازآزمون' : 'ممیزی اولیه'} · {new Date((latest || initial).generatedAt).toLocaleTimeString('fa-IR')}
            </span>
          </div>

          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {LINK_ENVIRONMENTS.filter((item) => !only || item.id === only).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEnvironment(item.id)}
                className={
                  'shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold '
                  + (environment === item.id ? 'border-primary/40 bg-primary text-primary-foreground' : 'border-border/70 bg-card text-muted-foreground')
                }
              >
                {item.label}
              </button>
            ))}
            <span className="mx-1 w-px shrink-0 self-stretch bg-border/70" />
            {AUDIT_ROLES.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => setRole(item.role)}
                className={
                  'shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold '
                  + (role === item.role ? 'border-primary/40 bg-primary text-primary-foreground' : 'border-border/70 bg-card text-muted-foreground')
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeRole ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-lg bg-muted px-2 py-1">مسیرهای این نقش: <b>{fa(activeRole.summary.total)}</b></span>
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">PASS: <b>{fa(activeRole.summary.pass)}</b></span>
                <span className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">FAIL: <b>{fa(activeRole.summary.fail)}</b></span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">SKIP: <b>{fa(activeRole.summary.skip)}</b></span>
                {['all', AUDIT_STATUS.fail, AUDIT_STATUS.skip, AUDIT_STATUS.pass].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={
                      'rounded-lg border px-2 py-1 font-bold '
                      + (statusFilter === value ? 'border-primary/40 bg-secondary text-primary' : 'border-border/70 bg-card text-muted-foreground')
                    }
                  >
                    {value === 'all' ? 'همه' : value}
                  </button>
                ))}
              </div>
              {activeRole.note ? (
                <p className="mt-1.5 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[10px] leading-5 text-muted-foreground">{activeRole.note}</p>
              ) : null}

              <div className="mt-2 overflow-auto rounded-xl border border-border/70">
                <table className="w-full text-right text-[10px]">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-2 py-1.5 font-bold">مسیر (مبدأ → مقصد)</th>
                      {!compact ? <th className="px-2 py-1.5 font-bold">تعریف زنجیره</th> : null}
                      <th className="whitespace-nowrap px-2 py-1.5 font-bold">ردیف‌ها</th>
                      <th className="whitespace-nowrap px-2 py-1.5 font-bold">وضعیت</th>
                      <th className="px-2 py-1.5 font-bold">شرح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => {
                      const Icon = STATUS_ICON[item.status] || SkipForward;
                      const before = previousIndex.get(environment + '::' + activeRole.role + '::' + item.id);
                      return (
                        <tr key={item.id} className="border-t border-border/60 align-top">
                          <td className="px-2 py-1.5">
                            <b className="block text-[10px] font-bold text-foreground">{item.from}</b>
                            <span className="block text-[9px] text-muted-foreground">→ {item.to}</span>
                          </td>
                          {!compact ? <td className="px-2 py-1.5 text-[9px] leading-5 text-muted-foreground">{item.definition}</td> : null}
                          <td className="whitespace-nowrap px-2 py-1.5">
                            <span className="num">{fa(item.counts.linked)}/{fa(item.counts.total)}</span>
                            {item.counts.noref ? <span className="block text-[9px] text-muted-foreground">بدون مرجع: {fa(item.counts.noref)}</span> : null}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5">
                            <span className={'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ' + statusTone(item.status)}>
                              <Icon className="h-3 w-3" />
                              {item.status}
                            </span>
                            {before && before !== item.status ? (
                              <span className="mt-0.5 block text-[8px] text-muted-foreground">قبلی: {before}</span>
                            ) : null}
                          </td>
                          <td className="px-2 py-1.5 text-[9px] leading-5 text-muted-foreground">{item.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!rows.length ? (
                <p className="mt-2 rounded-xl border border-dashed border-border/70 px-2 py-2 text-[10px] text-muted-foreground">مسیری با این وضعیت در این نقش نیست.</p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}