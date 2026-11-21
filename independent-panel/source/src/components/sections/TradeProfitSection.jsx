// src/components/sections/TradeProfitSection.jsx — ماژول محاسباتی «مفاد معاملات»
// همان الگوی یکپارچهٔ بخش‌ها را دارد و در لپ‌تاپ/تبلت و موبایل یکسان است.
// فقط می‌خواند و محاسبه می‌کند؛ هیچ سند یا دفتری را تغییر نمی‌دهد.
// هر عددی که ورودی‌اش تعریف نشده باشد «نامشخص» گزارش می‌شود، نه حدس.
import React, { useMemo, useState } from 'react';
import { TrendingUp, Calculator } from 'lucide-react';
import SectionPage from '@/components/sections/SectionPage';
import { computeTradeProfit } from '@/core/domain/tradeProfit';
import { sectionNo } from '@/core/registry/modules';

const POLICY_KEY = 'a1-trade-profit-policy';
const readPolicy = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(POLICY_KEY) || '{}');
    return { baseCurrency: saved.baseCurrency || 'AFN', method: 'weighted_average' };
  } catch {
    return { baseCurrency: 'AFN', method: 'weighted_average' };
  }
};

export default function TradeProfitSection({ data, fmt, currencyLabel }) {
  const [policy, setPolicy] = useState(readPolicy);
  const currencies = data?.currencies || [];

  const updatePolicy = (next) => {
    setPolicy(next);
    try { window.localStorage.setItem(POLICY_KEY, JSON.stringify(next)); } catch { /* ذخیرهٔ نمایشی */ }
  };

  const result = useMemo(
    () => computeTradeProfit({
      trades: data?.exchange || [],
      currencies,
      remittances: data?.remittance || [],
      // موجودی آغازین صندوق‌ها همان مبنای ارزش‌گذاری فروش‌های بدون خرید ثبت‌شده است.
      openings: (data?.cash || []).map((row) => ({
        currency: row.currency || 'AFN',
        amount: Number(row.opening) || 0,
        // ارزش پایهٔ موجودی آغازین همان صندوق، مبنای بهای تمام‌شدهٔ آن ارز است.
        value: Number(row.openingValue ?? row.opening_value) || 0,
      })),
      policy,
    }),
    [data, currencies, policy],
  );

  const base = result.baseCurrency;
  const amountIn = (value, code) => (code ? fmt(value) + ' ' + currencyLabel(code) : fmt(value));
  const moneyInBase = (value) => (value === null || value === undefined ? 'نامشخص' : fmt(value) + ' ' + currencyLabel(base));

  const model = {
    no: sectionNo('profit'),
    label: 'مفاد معاملات',
    group: 'reports',
    metrics: [
      { key: 'trades', label: 'معاملات', value: fmt(result.totals.trades) },
      { key: 'computed', label: 'محاسبه‌شده', value: fmt(result.totals.computed) },
      { key: 'unknown', label: 'نامشخص', value: fmt(result.totals.unknown) },
      { key: 'profit', label: 'سود محاسبه‌شده', value: moneyInBase(result.totals.profitBase) },
      { key: 'fee', label: 'کارمزد', value: moneyInBase(result.totals.feeBase) },
    ],
    blocks: [
      {
        key: 'trades',
        label: 'سود و زیان هر معامله',
        empty: 'معامله‌ای برای محاسبه ثبت نشده است.',
        rows: result.rows.map((row) => ({
          id: row.id,
          title: (row.number || 'معامله') + ' · ' + row.kind,
          sub: [row.date, row.party].filter(Boolean).join(' · '),
          badge: row.status,
          meta: [
            ['داده‌شده', amountIn(row.givenAmount, row.givenCode)],
            ['گرفته‌شده', amountIn(row.takenAmount, row.takenCode)],
            ['بهای تمام‌شده', moneyInBase(row.costBase)],
            ['سود', moneyInBase(row.profit)],
            ['کارمزد', row.fee ? fmt(row.fee) + (row.feeCurrency ? ' ' + currencyLabel(row.feeCurrency) : '') : '—'],
            ['سند', row.number || 'ندارد'],
            ...(row.reasons.length ? [['دلیل نامشخص', row.reasons.join('؛ ')] ] : []),
          ],
        })),
      },
      {
        key: 'by-currency',
        label: 'جمع به تفکیک ارز',
        empty: 'جمع‌بندی ارزی وجود ندارد.',
        rows: result.byCurrency.map((row) => ({
          id: row.code,
          title: currencyLabel(row.code),
          sub: fmt(row.count) + ' معامله',
          meta: [
            ['مقدار داده‌شده', fmt(row.givenQty)],
            ['بهای تمام‌شده', moneyInBase(row.costBase)],
            ['دریافتی', moneyInBase(row.proceedsBase)],
            ['سود', moneyInBase(row.profit)],
          ],
        })),
      },
      {
        key: 'fees',
        label: 'کارمزدها',
        empty: 'کارمزدی ثبت نشده است.',
        rows: result.fees.map((row) => ({
          id: row.id,
          title: row.source + (row.number ? ' · ' + row.number : ''),
          sub: row.date,
          meta: [
            ['مبلغ', fmt(row.amount) + (row.currency ? ' ' + currencyLabel(row.currency) : ' · ارز نامشخص')],
            ['معادل ارز مبنا', moneyInBase(row.base)],
          ],
        })),
      },
      {
        key: 'definitions',
        label: 'تعاریف و موارد نامشخص',
        empty: 'موردی ثبت نشده است.',
        rows: result.definitions.map((row) => ({
          id: row.key,
          title: row.label,
          sub: row.value,
          badge: row.status,
          meta: [['توضیح', row.note]],
        })),
      },
    ],
  };

  return (
    <div dir="rtl" className="space-y-2">
      <div className="card-flat flex flex-wrap items-center gap-2 p-2.5">
        <span className="flex items-center gap-1 text-[10px] font-extrabold text-foreground sm:text-[11px]">
          <Calculator className="h-3.5 w-3.5 text-primary" />
          تنظیم محاسبه
        </span>
        <label className="flex items-center gap-1 text-[9px] text-muted-foreground sm:text-[10px]">
          ارز مبنا
          <select
            value={policy.baseCurrency}
            onChange={(event) => updatePolicy({ ...policy, baseCurrency: event.target.value })}
            className="h-7 rounded-lg border border-border bg-card px-1.5 text-[10px] font-bold text-foreground"
          >
            {[...new Set(['AFN', ...currencies.map((row) => String(row.code || '').toUpperCase()).filter(Boolean)])].map((code) => (
              <option key={code} value={code}>{currencyLabel(code)}</option>
            ))}
          </select>
        </label>
        <span className="rounded-lg border border-border/70 bg-muted/50 px-2 py-1 text-[9px] text-muted-foreground sm:text-[10px]">
          روش بهای تمام‌شده: میانگین موزون
        </span>
        <span className="text-[9px] leading-5 text-muted-foreground sm:text-[10px]">
          ورودی‌ها: معاملات اسعار، تعریف اسعار و کارمزدهای ثبت‌شده — این ماژول فقط می‌خواند و به دفتر روزنامه و دفتر کل وصل است.
        </span>
      </div>

      <SectionPage model={model} icon={TrendingUp} />
    </div>
  );
}