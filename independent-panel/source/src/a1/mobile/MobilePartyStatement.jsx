// a1/mobile/MobilePartyStatement.jsx — گردش حساب یک طرف حساب در موبایل (مشتری یا نمایندگی)
// فقط نمایش است: ردیف‌ها از سطرهای دفتر حساب همان طرف حساب در موتور محلی خوانده می‌شوند،
// پس اعداد با دفتر حساب لپ‌تاپ یکی است. ستون بدهکار و بستانکار جدا نمایش داده می‌شود.
import React, { useMemo, useState } from 'react';
import { ArrowRight, Ban, BookOpen, BookText, FileText, Landmark, Pencil, Plus, Search, Wallet } from 'lucide-react';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { fmt, currencyLabel, CURRENCIES } from '@/a1/mobile/demoData';
import { partyStatement, accountStatement, findSourceForLine } from '@/core/domain/statement';
import { displayDate } from '@/core/domain/dates';
import MobileDocumentDetail from '@/a1/mobile/MobileDocumentDetail';
import useKeyboardInset from '@/a1/mobile/useKeyboardInset';

const BALANCE_TONE = { بدهکار: ' a1m-badge--red', بستانکار: ' a1m-badge--green', تسویه: '' };

// فیلترهای گردش حساب در گام ناوبری نگهداری می‌شوند تا با رفتن به حساب مقابل و برگشت، همان فیلترها سر جایشان باشند
export const EMPTY_STATEMENT_FILTERS = { query: '', dateFrom: '', dateTo: '', currency: 'همه', type: 'همه', limit: 30 };

export default function MobilePartyStatement({ party, kind = 'customer', backLabel, onBack, canEdit, onEditAccount, onNewEntry, onDeactivate, onOpenSource, onOpenAccount, filters, onFiltersChange }) {
  const demo = useMobileDemo();
  // نوار سه دکمه با باز شدن صفحه‌کلید بالای آن می‌نشیند و با بستن آن برمی‌گردد
  const keyboardInset = useKeyboardInset();
  const [view, setView] = useState(() => ({ ...EMPTY_STATEMENT_FILTERS, ...(filters || {}) }));
  const { query, dateFrom, dateTo, currency, type, limit } = view;
  const update = (patch) => {
    const next = { ...view, ...patch };
    setView(next);
    onFiltersChange?.(next);
  };
  const [details, setDetails] = useState(null);

  // صندوق و بانک از همان گردش دفتر کل همان حساب خوانده می‌شوند؛ مشتری و نمایندگی بدون تغییر
  const statement = useMemo(() => ((kind === 'bank' || kind === 'cash')
    ? accountStatement(demo.data, party, kind)
    : partyStatement(demo.data, party, kind)), [demo.data, party, kind]);

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return statement.rows.filter((row) => {
      if (currency !== 'همه' && row.currency !== currency) return false;
      if (type !== 'همه' && row.type !== type) return false;
      if (dateFrom && row.date && row.date < dateFrom) return false;
      if (dateTo && row.date && row.date > dateTo) return false;
      if (!text) return true;
      return [row.number, row.description, row.type].join(' ').toLowerCase().includes(text);
    });
  }, [statement.rows, query, currency, type, dateFrom, dateTo]);

  const visible = rows.slice(0, limit);
  const totalCount = statement.rows.length;

  // جمع بدهکار/بستانکار از همان ردیف‌های فهرست (پس از فیلتر) ساخته می‌شود تا با اعداد روی صفحه یکی باشد؛
  // ماندهٔ نهایی حساب از جمع‌بندی کامل گردش همان حساب خوانده می‌شود.
  const shownTotals = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const code = row.currency || 'AFN';
      const item = map.get(code) || { currency: code, debit: 0, credit: 0, count: 0 };
      item.debit += Number(row.debit) || 0;
      item.credit += Number(row.credit) || 0;
      item.count += 1;
      map.set(code, item);
    });
    return [...map.values()].map((item) => ({
      ...item,
      account: statement.totals.find((total) => total.currency === item.currency) || null,
    }));
  }, [rows, statement.totals]);  const mainStatus = statement.totals.find((row) => row.currency === (party.currency || 'AFN'))?.status
    || statement.totals[0]?.status
    || 'تسویه';
  const isBranch = kind === 'branch';
  const isBank = kind === 'bank';
  const isCash = kind === 'cash';
  const Icon = isBank ? Landmark : isCash ? Wallet : isBranch ? BookText : BookOpen;
  const kindLabel = isBank ? 'گردش حساب بانکی' : isCash ? 'گردش حساب صندوق' : isBranch ? 'گردش حساب نمایندگی' : 'گردش حساب مشتری';
  const currencyOptions = [...new Set([...CURRENCIES, ...statement.totals.map((row) => row.currency)])];

  const openSource = (row) => {
    const source = findSourceForLine(demo.data, row);
    onOpenSource(source.module, source.record);
  };

  const resetFilters = () => update(EMPTY_STATEMENT_FILTERS);

  // سه دکمهٔ عملیات حساب در نواری ثابت بالای تب‌های اصلی می‌نشینند؛
  // فضای پایین صفحه هم به اندازهٔ همان نوار باز می‌ماند تا روی آخرین تراکنش‌ها نیفتد.
  const actions = [onNewEntry, onEditAccount, onDeactivate].filter(Boolean).length;

  return (
    <div className="a1m-screen" style={{ paddingBottom: actions ? 78 : 16 }}>
      <header className="a1m-screen__head">
        <button type="button" className="a1m-back" onClick={onBack} aria-label={backLabel || (isBranch ? 'بازگشت به فهرست نمایندگی‌ها' : 'بازگشت به فهرست مشتریان')}>
          <ArrowRight className="h-4 w-4" />
        </button>
        <span className="a1m-screen__icon"><Icon className="h-4 w-4" /></span>
        <div className="a1m-screen__titles">
          <div className="a1m-screen__title">
            {party.name}
          </div>
          <div className="a1m-screen__sub">
            {[party.code, party.phone, kindLabel].filter(Boolean).join(' · ')}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gap: 8 }}>
        <div className="a1m-card">
          <div className="a1m-card__top">
            <b className="a1m-card__title">خلاصهٔ حساب</b>
            <span className={'a1m-badge' + (BALANCE_TONE[mainStatus] || '')}>{mainStatus}</span>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {shownTotals.map((row) => (
              <div key={row.currency} style={{ display: 'grid', gap: 4, borderTop: '1px dashed #dbe5ef', paddingTop: 8 }}>
                <div className="a1m-card__meta">
                  <span className="a1m-card__pair">ارز: <b>{currencyLabel(row.currency)}</b></span>
                  <span className="a1m-card__pair">ردیف‌های همین فهرست: <b>{fmt(row.count)}</b></span>
                </div>
                <div className="a1m-card__meta">
                  <span className="a1m-card__pair">جمع بدهکار: <b>{fmt(row.debit)}</b></span>
                  <span className="a1m-card__pair">جمع بستانکار: <b>{fmt(row.credit)}</b></span>
                </div>
                {row.account ? (
                  <div className="a1m-card__meta">
                    <span className="a1m-card__pair">مانده نهایی حساب: <b>{fmt(Math.abs(row.account.balance))} {currencyLabel(row.account.currency)}</b></span>
                    <span className="a1m-card__pair">وضعیت: <b>{row.account.status}</b></span>
                  </div>
                ) : null}
              </div>
            ))}
            {!shownTotals.length ? <div className="a1m-empty">گردشی برای این حساب ثبت نشده است.</div> : null}
          </div>
          <p className="a1m-note" style={{ marginTop: 8 }}>جمع بدهکار و بستانکار از همان ردیف‌های این فهرست، پس از اعمال جستجو و فیلترها، ساخته می‌شود.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#7c90a5', padding: '0 2px' }}>
          <span>تعداد کل تراکنش‌ها: {fmt(totalCount)}</span>
          <span>نمایش: {fmt(rows.length)} ردیف</span>
        </div>

        <div className="a1m-toolbar">
          <div className="a1m-toolbar__row">
            <div className="a1m-search">
              <Search />
              <input value={query} onChange={(event) => update({ query: event.target.value })} placeholder="جستجوی شماره سند یا شرح..." />
            </div>
          </div>
          <div className="a1m-toolbar__row">
            <input type="date" className="a1m-input" style={{ height: 34, fontSize: 11 }} value={dateFrom} onChange={(event) => update({ dateFrom: event.target.value })} aria-label="از تاریخ" />
            <input type="date" className="a1m-input" style={{ height: 34, fontSize: 11 }} value={dateTo} onChange={(event) => update({ dateTo: event.target.value })} aria-label="تا تاریخ" />
            <select className="a1m-input" value={currency} onChange={(event) => update({ currency: event.target.value })} style={{ height: 34, fontSize: 11, flex: '0 0 auto', width: 92 }}>
              <option value="همه">همه ارز</option>
              {currencyOptions.map((code) => <option key={code} value={code}>{currencyLabel(code)}</option>)}
            </select>
            <button type="button" className="a1m-badge" onClick={resetFilters} style={{ flex: '0 0 auto' }}>پاک</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              className={'a1m-badge' + (type === 'همه' ? ' a1m-badge--blue' : '')}
              style={{ padding: '7px 10px', fontSize: 10 }}
              onClick={() => { update({ type: 'همه', limit: 30 }); }}
            >
              همه ({fmt(totalCount)})
            </button>
            {statement.types.map((label) => (
              <button
                key={label}
                type="button"
                className={'a1m-badge' + (type === label ? ' a1m-badge--blue' : '')}
                style={{ padding: '7px 10px', fontSize: 10 }}
                onClick={() => { update({ type: label, limit: 30 }); }}
              >
                {label} ({fmt(statement.counts[label] || 0)})
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 7 }}>
          {visible.map((row) => (
            <div key={row.id} className="a1m-card">
              <div className="a1m-card__top">
                <div style={{ minWidth: 0 }}>
                  <div className="a1m-card__title">{row.type}</div>
                  <div className="a1m-card__sub">{[displayDate(row.date), row.number].filter(Boolean).join(' · ')}</div>
                </div>
                <span className="a1m-badge">{currencyLabel(row.currency)}</span>
              </div>
              {row.description ? <div className="a1m-card__sub" style={{ marginTop: 4 }}>{row.description}</div> : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 7 }}>
                <div style={{ borderRadius: 8, background: '#fdf1f1', padding: '5px 7px' }}>
                  <span style={{ display: 'block', fontSize: 9, color: '#a15a5a' }}>بدهکار</span>
                  <b style={{ fontSize: 11, color: '#b64545' }}>{row.debit ? fmt(row.debit) : '—'}</b>
                </div>
                <div style={{ borderRadius: 8, background: '#eef8f2', padding: '5px 7px' }}>
                  <span style={{ display: 'block', fontSize: 9, color: '#4d8a6b' }}>بستانکار</span>
                  <b style={{ fontSize: 11, color: '#1f7a4d' }}>{row.credit ? fmt(row.credit) : '—'}</b>
                </div>
                <div style={{ borderRadius: 8, background: '#eef4fb', padding: '5px 7px' }}>
                  <span style={{ display: 'block', fontSize: 9, color: '#5f7f9d' }}>مانده پس از سند</span>
                  <b style={{ fontSize: 11, color: '#0c213a' }}>{fmt(Math.abs(row.balance))}</b>
                </div>
              </div>
              <div className="a1m-card__meta" style={{ marginTop: 7 }}>
                <button type="button" className="a1m-badge a1m-badge--blue" style={{ padding: '5px 9px' }} onClick={() => setDetails(row)}>
                  <FileText className="h-3 w-3" style={{ marginInlineEnd: 3 }} />
                  جزئیات سند
                </button>
                {canEdit ? (
                  <button type="button" className="a1m-badge" style={{ padding: '5px 9px' }} onClick={() => openSource(row)}>
                    ویرایش سند
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {!rows.length ? <div className="a1m-empty">در این فیلترها ردیفی برای این حساب وجود ندارد.</div> : null}
        </div>

        {rows.length > visible.length ? (
          <button type="button" className="a1m-btn" onClick={() => update({ limit: limit + 30 })}>
            نمایش بیشتر ({fmt(rows.length - visible.length)} ردیف باقی‌مانده)
          </button>
        ) : null}

        <p className="a1m-note">
          این گردش از سطرهای دفتر حساب همین طرف حساب در موتور محلی خوانده می‌شود و با دفتر حساب لپ‌تاپ یکسان است.
          سندهای روزنامچه فقط وقتی به این حساب می‌رسند که سطر آن‌ها به همین حساب وصل شده باشد.
        </p>
      </div>

      {actions ? (
        <div
          className="a1m-actionbar"
          role="toolbar"
          aria-label="عملیات ثبت، ویرایش و غیرفعال‌سازی حساب"
          style={{
            gridTemplateColumns: `repeat(${actions}, minmax(0, 1fr))`,
            ...(keyboardInset ? { bottom: `calc(${keyboardInset}px + 8px)` } : {}),
          }}
        >
          {onNewEntry ? (
            <button type="button" className="a1m-actionbar__btn a1m-actionbar__btn--primary" onClick={onNewEntry}>
              <Plus className="h-4 w-4" /><span>ثبت</span>
            </button>
          ) : null}
          {onEditAccount ? (
            <button type="button" className="a1m-actionbar__btn" onClick={onEditAccount}>
              <Pencil className="h-4 w-4" /><span>ویرایش</span>
            </button>
          ) : null}
          {onDeactivate ? (
            <button type="button" className="a1m-actionbar__btn" onClick={onDeactivate}>
              <Ban className="h-4 w-4" /><span>غیرفعال</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {details ? (
        <MobileDocumentDetail line={details} data={demo.data} onClose={() => setDetails(null)} onOpenAccount={onOpenAccount} />
      ) : null}
    </div>
  );
}