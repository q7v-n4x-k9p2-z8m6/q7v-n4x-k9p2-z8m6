// a1/components/v21/DailyRates.jsx — بخش مستقل «نرخ روز»
// ساختار و رابط کاربری دریافت نرخ ارزهای روز از سرویس جهانی.
// نرخ‌ها به‌صورت زنده از سرویس جهانی خوانده می‌شوند و هیچ عدد ساختگی ساخته نمی‌شود.
// نرخ‌های این صفحه فقط اطلاع‌رسانی‌اند و هیچ سند حسابداری، صندوق یا حساب مشتری را تغییر نمی‌دهند.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, RefreshCw, Search, TrendingUp, Globe, AlertCircle, Check, Clock, Database,
} from 'lucide-react';
import { toPersianDigits } from '@/a1/lib/format';
import { fetchDailyRates, RATE_SERVICE_ID } from '@/a1/lib/ratesService';
import {
  BASE_CURRENCIES, RATE_SOURCES, RATE_CURRENCIES, SOURCE_STATUS_META, STALE_AFTER_MINUTES, emptyRateRows,
} from './rates/ratesConfig';
import RatesTable from './rates/RatesTable';
import RatesCompare from './rates/RatesCompare';

const TABS = [
  { id: 'official', label: 'نرخ رسمی' },
  { id: 'market', label: 'نرخ بازار آزاد' },
  { id: 'compare', label: 'مقایسهٔ دو دسته' },
];

const stamp = value => (value
  ? toPersianDigits(new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(value))
  : 'دریافت نشد');

export default function DailyRates({ onBack }) {
  const [base, setBase] = useState('AFN');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('official');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sourceState, setSourceState] = useState('not_configured');
  const [lastSync, setLastSync] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [status, setStatus] = useState(null);

  // ردیف‌های جدول از نرخ دریافتی ساخته می‌شوند. سرویس نرخ میانی می‌دهد (چند واحد مبنا برای یک واحد ارز)،
  // پس برای خوانایی نرخ برعکس می‌شود: «چند واحد مبنا برای یک واحد ارز».
  // اعتبار و تاریخ ردیف از زمان همین دریافت سنجیده می‌شود، نه از تاریخ اعلام سرویس،
  // وگرنه بعد از هر تازه‌سازی موفق هم ردیف‌ها «کهنه» می‌مانند.
  const buildRows = useCallback((kind, baseCode, result) => {
    const fetchedAt = result?.fetchedAt || null;
    const ageMinutes = fetchedAt ? (Date.now() - new Date(fetchedAt).getTime()) / 60000 : Infinity;
    const validity = !result ? 'missing' : ageMinutes > STALE_AFTER_MINUTES ? 'stale' : 'valid';
    return RATE_CURRENCIES
      .filter(currency => currency.code !== baseCode)
      .map(currency => {
        const raw = result?.rates?.[currency.code];
        const mid = Number.isFinite(Number(raw)) && Number(raw) > 0 ? 1 / Number(raw) : null;
        return {
          kind,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          base: baseCode,
          mid,
          buy: mid,
          sell: mid,
          source: mid === null ? '' : result.source,
          updatedAt: mid === null ? null : fetchedAt,
          providerUpdatedAt: result?.providerUpdatedAt || null,
          validity: mid === null ? 'missing' : validity,
        };
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLastAttempt(new Date());
    try {
      const result = await fetchDailyRates(base);
      setPayload({ ...result, providerUpdatedAt: result.updatedAt, fetchedAt: new Date() });
      setLastSync(new Date());
      setSourceState('connected');
      setStatus({
        tone: 'success',
        message: `نرخ روز از ${result.source} دریافت شد؛ عدد جدول «چند ${base === 'AFN' ? 'افغانی' : base} برای یک واحد ارز خارجی» است.`,
      });
    } catch (error) {
      setPayload(null);
      setSourceState('error');
      setStatus({ tone: 'error', message: error?.message || 'دریافت نرخ ناموفق بود.' });
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const rates = useMemo(() => ({
    official: payload ? buildRows('official', base, payload) : emptyRateRows('official', base),
    market: emptyRateRows('market', base),
  }), [base, payload, buildRows]);

  const term = query.trim().toLowerCase();
  const visible = rows => (term
    ? rows.filter(row => (row.name + ' ' + row.code + ' ' + row.symbol).toLowerCase().includes(term))
    : rows);

  const sources = RATE_SOURCES.map(source => (source.id === RATE_SERVICE_ID ? { ...source, status: sourceState } : source));
  const connectedSources = sources.filter(source => source.status === 'connected').length;

  return (
    <div dir="rtl" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="بازگشت به بخش قبلی"
              className="flex items-center gap-1 border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-[#24496d] hover:border-[#47799d] hover:bg-blue-50"
            >
              <ArrowRight className="h-3.5 w-3.5" />بازگشت
            </button>
          )}
          <TrendingUp className="h-5 w-5 text-[#315e80]" />
          <div>
            <div className="text-[9px] text-slate-500">سیستم حسابداری / عملیات صرافی</div>
            <h2 className="text-sm font-bold text-[#24496d]">نرخ روز</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <label className="flex items-center gap-1 text-slate-700">
            واحد مبنا:
            <select value={base} onChange={event => setBase(event.target.value)} className="h-7 border border-slate-300 bg-white px-1">
              {BASE_CURRENCIES.map(currency => <option key={currency.code} value={currency.code}>{currency.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="جست‌وجوی ارز..."
              className="h-7 w-32 border border-slate-300 bg-white px-2 sm:w-40"
            />
          </label>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-7 items-center gap-1 border border-[#9fb2c3] bg-white px-2 font-bold text-[#24496d] hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshCw className={'h-3.5 w-3.5' + (loading ? ' animate-spin' : '')} />{loading ? 'در حال دریافت...' : 'به‌روزرسانی دستی'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="chip border border-slate-200 bg-white text-slate-700">
          <Clock className="h-3 w-3" />آخرین دریافت موفق: <b>{stamp(lastSync)}</b>
        </span>
        <span className="chip border border-slate-200 bg-white text-slate-700">
          <RefreshCw className="h-3 w-3" />آخرین تلاش: <b>{stamp(lastAttempt)}</b>
        </span>
        <span className="chip border border-slate-200 bg-white text-slate-700">
          <Database className="h-3 w-3" />منابع متصل: <b>{toPersianDigits(connectedSources)}</b> از {toPersianDigits(sources.length)}
        </span>
      </div>

      <section className="border border-[#b6c4cf] bg-[#edf3f7] p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
          <b className="text-[11px] text-[#24496d]">منابع دریافت نرخ</b>
          <span className="text-[9px] text-slate-500">هر منبع مستقل است؛ قطع شدن یک منبع، نمایش نرخ سایر منابع را متوقف نمی‌کند.</span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {sources.map(source => {
            const meta = SOURCE_STATUS_META[source.status] || SOURCE_STATUS_META.not_configured;
            return (
              <div key={source.id} className="flex items-start justify-between gap-2 border border-slate-200 bg-white px-2 py-1.5">
                <div className="min-w-0">
                  <b className="block truncate text-[10px] text-slate-800">{source.label}</b>
                  <span className="text-[9px] text-slate-500">{source.kind === 'official' ? 'دستهٔ نرخ رسمی' : 'دستهٔ بازار آزاد'}</span>
                </div>
                <span className={'chip shrink-0 border px-2 py-0.5 text-[9px] font-bold ' + meta.badge}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-1">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={'border px-3 py-1.5 text-[11px] font-bold ' + (tab === item.id
              ? 'border-[#4d7cb2] bg-[#e2e8f2] text-[#1a4f80]'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-blue-50')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {status && (
        <div
          role={status.tone === 'error' ? 'alert' : 'status'}
          className={'flex items-start gap-2 border px-3 py-2 text-[11px] leading-5 ' + (status.tone === 'error'
            ? 'border-rose-300 bg-rose-50 text-rose-900'
            : status.tone === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-amber-300 bg-amber-50 text-amber-900')}
        >
          {status.tone === 'success'
            ? <Check className="mt-0.5 h-4 w-4 shrink-0" />
            : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}

      {tab === 'compare' ? (
        <RatesCompare official={visible(rates.official)} market={visible(rates.market)} base={base} />
      ) : (
        <RatesTable kind={tab} rows={visible(rates[tab])} base={base} />
      )}

      <div className="flex items-start gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">
        <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          قانون حسابداری: نرخ‌های این صفحه فقط برای اطلاع‌رسانی و مقایسه‌اند. دریافت نرخ از اینترنت هیچ نرخ معامله، سند حسابداری،
          موجودی صندوق یا حساب مشتری را به‌صورت خودکار تغییر نمی‌دهد و ثبت نرخ معاملاتی در کنترل صراف است.
        </span>
      </div>
    </div>
  );
}