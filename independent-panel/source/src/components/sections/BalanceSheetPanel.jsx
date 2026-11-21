// src/components/sections/BalanceSheetPanel.jsx — بیلانس عمومی (ترازنامه) با گیت سیاست
// تا وقتی سیاست حسابداری انتخاب نشود هیچ رقم مالی نمایش داده نمی‌شود؛
// پس از انتخاب، ترازنامه فقط از مانده‌های دفتر کل همین صراف محاسبه می‌شود.
// ماژول «نمونهٔ مرجع قرارداد محاسبه» دادهٔ ساختگی مستند است و به دفتر صراف دست نمی‌زند.
import React, { useMemo, useState } from 'react';
import { Scale, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { buildBalanceSheet, BALANCE_SHEET_POLICY } from '@/core/reports/balanceSheet';
import { buildTrialBalanceViews } from '@/core/reports/trialBalance';
import { APPROVED_BALANCE_SHEET_POLICY, APPROVED_TRIAL_BALANCE_POLICY, ratesFromCurrencyRecords, trialBalanceLinesFromAccounts } from '@/core/reports/approvedPolicies';
import { FINANCIAL_FIXTURE } from '@/core/transfer/financialContracts';

const STORAGE_KEY = 'hisab-sarraf-v22-balance-sheet-policy';

// سیاست پیش‌فرض همان قرارداد مستند است: طبقه‌بندی با کدینگ، سود دوره جدا، تسعیر با نرخ حسابداری ثبت‌شده یا میانگین خرید و فروش
export const DEFAULT_BALANCE_POLICY = APPROVED_BALANCE_SHEET_POLICY;

const readPolicy = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_BALANCE_POLICY };
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return { ...DEFAULT_BALANCE_POLICY };
  }
};

// ارقام این پنل با رقم لاتین خوانده می‌شوند تا معادلهٔ ترازنامه بی‌ابهام باشد
const money = (value) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const SECTION_TITLES = { asset: 'دارایی', liability: 'بدهی', equity: 'سرمایه' };

const Field = ({ label, value, onChange, options }) => (
  <label className="flex min-w-0 flex-col gap-1 text-[10px] text-muted-foreground">
    {label}
    <select
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-lg border border-border bg-card px-1.5 text-[10px] font-bold text-foreground"
    >
      <option value="">— انتخاب کنید —</option>
      {options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
    </select>
  </label>
);

export default function BalanceSheetPanel({ data }) {
  const [policy, setPolicy] = useState(readPolicy);
  const [trialView, setTrialView] = useState('split');

  const update = (next) => {
    setPolicy(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* ذخیرهٔ نمایشی سیاست */ }
  };

  const baseCurrency = policy?.baseCurrency || DEFAULT_BALANCE_POLICY.baseCurrency;
  const rates = useMemo(
    () => ratesFromCurrencyRecords(data?.currencies || []),
    [data],
  );

  // سطرهای دفتر: هر حساب کل با مانده‌اش؛ مانده‌های افتتاحیهٔ صندوق/بانک/مشتری در همان حساب کل لحاظ شده است.
  const { lines, excluded } = useMemo(() => {
    const tops = (data?.accounts || []).filter((row) => !row.parentId);
    const skipped = new Set();
    const rows = [];
    tops.forEach((account) => {
      (account.balanceByCurrency || []).forEach((balance) => {
        const currency = String(balance.currency || baseCurrency).toUpperCase();
        if (policy?.valuation !== 'current' && currency !== baseCurrency) { skipped.add(currency); return; }
        rows.push({ accountCode: account.code, currency, debit: balance.debit, credit: balance.credit });
      });
    });
    return { lines: rows, excluded: [...skipped] };
  }, [data, policy, baseCurrency]);

  const live = useMemo(
    () => (policy ? buildBalanceSheet(lines, { ...policy, baseCurrency, rates }) : null),
    [policy, lines, baseCurrency, rates],
  );

  const trialSource = useMemo(
    () => trialBalanceLinesFromAccounts(data?.accounts || []),
    [data?.accounts],
  );
  const trialReports = useMemo(
    () => trialSource.status === 'ready'
      ? buildTrialBalanceViews(trialSource.lines, APPROVED_TRIAL_BALANCE_POLICY, rates)
      : null,
    [trialSource, rates],
  );
  const trialReport = trialReports?.[trialView] || null;

  // نمونهٔ مستند قرارداد محاسبه — روی دادهٔ ساختگی، مستقل از دفتر صراف
  const reference = useMemo(() => buildBalanceSheet(FINANCIAL_FIXTURE, DEFAULT_BALANCE_POLICY), []);
  const locked = !policy;

  return (
    <section dir="rtl" className="mb-2 space-y-2" aria-label="گزارش‌های مالی نسخهٔ ۲۲">
      <div className="card-flat p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <b className="block text-[12px] font-extrabold text-foreground">تراز آزمایشی چهارستونی</b>
            <span className="text-[9px] text-muted-foreground">گردش و ماندهٔ بدهکار/بستانکار؛ جمع‌ها جداگانه برای هر ارز</span>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setTrialView('split')} className={'rounded-lg border px-2 py-1 text-[10px] font-bold ' + (trialView === 'split' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground')}>تفکیک ارز</button>
            <button type="button" onClick={() => setTrialView('base')} className={'rounded-lg border px-2 py-1 text-[10px] font-bold ' + (trialView === 'base' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground')}>تجمیع ارز پایه</button>
          </div>
        </div>
        {trialSource.status !== 'ready' ? (
          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-2 py-2 text-[10px] leading-5 text-amber-900">
            کدینگ برای ساخت تراز کامل نیست؛ هیچ رقم حدسی نمایش داده نمی‌شود.
            <ul className="mt-1 list-inside list-disc">{trialSource.missing.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : trialReport?.status === 'blocked' ? (
          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-2 py-2 text-[10px] leading-5 text-amber-900">
            نمای تجمیعی تا ثبت نرخ معتبر همهٔ ارزها ساخته نمی‌شود.
            <ul className="mt-1 list-inside list-disc">{trialReport.missing.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : trialReport?.status === 'ready' ? (
          <>
            <div className="mt-2 flex flex-wrap gap-2">
              {trialReport.totals.byCurrency.map((item) => (
                <div key={item.currency} className="rounded-lg border border-border/70 bg-background/60 px-2 py-1 text-[9px]">
                  <b>{item.currency}</b> · بدهکار {money(item.debit)} · بستانکار {money(item.credit)}
                  <span className={item.balanced ? 'mr-1 text-emerald-700' : 'mr-1 text-rose-700'}>{item.balanced ? 'متوازن' : 'نامتوازن'}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[9px]">
                <thead><tr className="bg-muted/60 text-right">
                  <th className="border border-border p-1.5">کد / حساب</th><th className="border border-border p-1.5">ارز</th>
                  <th className="border border-border p-1.5">گردش بدهکار</th><th className="border border-border p-1.5">گردش بستانکار</th>
                  <th className="border border-border p-1.5">مانده بدهکار</th><th className="border border-border p-1.5">مانده بستانکار</th>
                </tr></thead>
                <tbody>{trialReport.rows.map((row) => (
                  <tr key={row.code + '::' + row.currency} className="odd:bg-background even:bg-muted/20">
                    <td className="border border-border p-1.5 font-bold">{row.code}</td><td className="border border-border p-1.5">{row.currency}</td>
                    <td className="border border-border p-1.5 text-left num">{money(row.debitTurnover)}</td>
                    <td className="border border-border p-1.5 text-left num">{money(row.creditTurnover)}</td>
                    <td className="border border-border p-1.5 text-left num">{money(row.debitBalance)}</td>
                    <td className="border border-border p-1.5 text-left num">{money(row.creditBalance)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
      <div className="card-flat p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-secondary text-primary"><Scale className="h-4 w-4" /></span>
            <div className="min-w-0">
              <b className="block text-[12px] font-extrabold text-foreground sm:text-[13px]">بیلانس عمومی (ترازنامه)</b>
              <span className="block text-[9px] text-muted-foreground sm:text-[10px]">طبقه‌بندی، سود دوره و مبنای ارزیابی از سیاست انتخابی خوانده می‌شود.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => update({ ...DEFAULT_BALANCE_POLICY, baseCurrency })}
              className="h-8 rounded-lg bg-primary px-2.5 text-[10px] font-bold text-primary-foreground"
            >
              انتخاب سیاست پیش‌فرض
            </button>
            <button
              type="button"
              onClick={() => update(null)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-[10px] font-bold text-muted-foreground"
            >
              حذف سیاست
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
          <Field
            label={BALANCE_SHEET_POLICY.classification}
            value={policy?.classification}
            onChange={(value) => update({ ...(policy || DEFAULT_BALANCE_POLICY), classification: value || undefined })}
            options={[['code', 'کدینگ حساب‌ها'], ['manual', 'نگاشت دستی']]}
          />
          <Field
            label={BALANCE_SHEET_POLICY.periodResult}
            value={policy?.periodResult}
            onChange={(value) => update({ ...(policy || DEFAULT_BALANCE_POLICY), periodResult: value || undefined })}
            options={[['separate', 'سود دوره جدا'], ['equity', 'افزودن به سرمایه']]}
          />
          <Field
            label={BALANCE_SHEET_POLICY.valuation}
            value={policy?.valuation}
            onChange={(value) => update({ ...(policy || DEFAULT_BALANCE_POLICY), valuation: value || undefined })}
            options={[['book', 'بهای ثبت‌شده'], ['current', 'تسعیر با نرخ حسابداری (میانگین خرید و فروش)']]}
          />
          <Field
            label="ارز پایه"
            value={policy?.baseCurrency || DEFAULT_BALANCE_POLICY.baseCurrency}
            onChange={(value) => update({ ...(policy || DEFAULT_BALANCE_POLICY), baseCurrency: value })}
            options={[...new Set([DEFAULT_BALANCE_POLICY.baseCurrency, ...((data?.currencies || []).map((row) => String(row.currency || row.code || '').toUpperCase()))])].filter(Boolean).map((code) => [code, code])}
          />
        </div>

        {locked ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2 py-2 text-[10px] leading-5 text-amber-900">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>سیاست حسابداری انتخاب نشده است؛ تا انتخاب سیاست، هیچ رقم مالی در ترازنامه نمایش داده نمی‌شود. برای دیدن مانده‌ها «انتخاب سیاست پیش‌فرض» را بزنید.</span>
          </div>
        ) : null}

        {!locked && live?.status === 'blocked' ? (
          <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] leading-5 text-rose-800">
            <b className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />ترازنامه با این سیاست ساخته نمی‌شود</b>
            <ul className="mt-1 list-inside list-disc">
              {live.missing.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[['assets', 'دارایی'], ['liabilities', 'بدهی'], ['equity', 'سرمایه'], ['profit', 'سود دوره']].map(([key, label]) => (
            <div key={key} className="rounded-xl border border-border/70 bg-background/60 px-2 py-1.5">
              <span className="block text-[9px] text-muted-foreground sm:text-[10px]">{label}</span>
              <b className="num mt-0.5 block text-[13px] font-extrabold text-foreground">
                {!locked && live?.status === 'ready' ? money(live.totals[key]) : '—'}
              </b>
            </div>
          ))}
        </div>

        <div className={'mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-2 py-1.5 text-[10px] ' + (
          !locked && live?.status === 'ready'
            ? (live.totals.balanced ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')
            : 'border-border/70 bg-muted/40 text-muted-foreground'
        )}>
          <span className="font-bold">معادلهٔ ترازنامه:</span>
          <span className="num">
            {!locked && live?.status === 'ready'
              ? money(live.totals.assets) + ' = ' + money(live.totals.liabilities) + ' + ' + money(live.totals.equity) + ' + ' + money(live.totals.profit)
              : '— = — + — + —'}
          </span>
          {!locked && live?.status === 'ready' ? (
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {live.totals.balanced ? 'تراز برقرار است' : 'تراز نیست'}
            </span>
          ) : null}
          {live?.status === 'ready' ? <span className="opacity-80">· ارز پایه: {baseCurrency}</span> : null}
        </div>

        {excluded.length ? (
          <p className="mt-1 text-[9px] leading-5 text-muted-foreground">
            در مبنای فعلی، مانده‌های {excluded.join('، ')} در این مبنا کنار گذاشته شده‌اند. برای دیدن همهٔ ارزها «ارزیابی به نرخ روز» را انتخاب کنید.
          </p>
        ) : null}

        {!locked && live?.status === 'ready' && live.sections ? (
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
            {Object.entries(SECTION_TITLES).map(([key, title]) => (
              <div key={key} className="rounded-xl border border-border/60 bg-background/60 px-2 py-1.5">
                <b className="block text-[10px] font-bold text-foreground">{title}</b>
                {live.sections[key]?.length ? live.sections[key].map((row) => (
                  <div key={key + row.account} className="mt-0.5 flex items-center justify-between gap-2 text-[9px] text-muted-foreground">
                    <span className="num truncate">{row.account}</span>
                    <b className="num text-[10px] text-foreground">{money(row.balance)}</b>
                  </div>
                )) : <span className="mt-0.5 block text-[9px] text-muted-foreground">موردی ثبت نشده است.</span>}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card-flat p-2.5 sm:p-3">
        <b className="block text-[11px] font-extrabold text-foreground">نمونهٔ مرجع قرارداد محاسبه (ارقام مستند)</b>
        <p className="mt-0.5 text-[9px] leading-5 text-muted-foreground">
          همین موتور محاسبه روی نمونهٔ مستند قرارداد اجرا می‌شود تا صحت معادله مستقل از دادهٔ صراف بررسی شود.
        </p>
        {reference.status === 'ready' ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border/70 bg-muted/40 px-2 py-1.5 text-[10px] text-foreground">
            <span className="num">
              {money(reference.totals.assets)} = {money(reference.totals.liabilities)} + {money(reference.totals.equity)} + {money(reference.totals.profit)}
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="h-3 w-3" />
              دارایی = بدهی + سرمایه + سود دوره
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}