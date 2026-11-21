// a1/mobile/MobileDocumentDetail.jsx — جزئیات خواندنی سند اصلی یک سطر گردش حساب
// فقط نمایش است: نه ثبت، نه ویرایش، نه ابطال. اگر سطر به سند اصلی متصل نباشد، همان را صریح می‌گوید
// و هیچ سندی حدس زده نمی‌شود.
import React from 'react';
import { X, FileText, Link2Off, ListTree } from 'lucide-react';
import { fmt, currencyLabel } from '@/a1/mobile/demoData';
import { statementSource, documentSiblings } from '@/core/domain/statement';
import { lineAccountLink, counterAccountLinks, ACCOUNT_KIND_LABELS } from '@/core/navigation/chain';

const DOC_FIELDS = [
  ['date', 'تاریخ'], ['number', 'شماره سند'], ['type', 'نوع عملیات'], ['description', 'شرح'],
  ['party', 'طرف حساب', 'party'], ['direction', 'نوع حواله'], ['sender', 'فرستنده'], ['receiver', 'گیرنده'],
  ['kind', 'نوع معامله'], ['title', 'عنوان مصرف'], ['expenseAccount', 'حساب مصرف'],
  ['amount', 'مبلغ', 'money'], ['fee', 'کمیشن', 'money'], ['total', 'جمع', 'money'], ['rate', 'نرخ', 'money'],
  ['currency', 'ارز', 'currency'], ['cash', 'صندوق'], ['bank', 'بانک'], ['status', 'وضعیت سند'],
];

export default function MobileDocumentDetail({ line, data, onClose, onOpenAccount }) {
  if (!line) return null;
  const source = statementSource(data, line);
  const siblings = documentSiblings(data, line.documentId);
  const record = source.record || {};
  // حسابِ طرف مقابل همان سند؛ کلیک روی آن گردش همان حساب را باز می‌کند
  // حساب کدینگ در پوستهٔ موبایل صفحهٔ گردش جدا ندارد؛ پیوند آن در همین نسخه نمایش داده نمی‌شود.
  const counterLinks = onOpenAccount ? counterAccountLinks(data, line).filter((item) => item.kind !== 'chart') : [];
  const openAccount = (kind, account) => {
    onClose();
    onOpenAccount(kind, account);
  };

  const pairs = DOC_FIELDS
    .filter(([key]) => record[key] !== undefined && record[key] !== null && record[key] !== '')
    .map(([key, label, kind]) => [
      label,
      kind === 'money' ? fmt(record[key]) : kind === 'currency' ? currencyLabel(record[key]) : String(record[key]),
    ]);

  const ledgerPairs = [
    ['تاریخ', line.date || line.record?.date || '—'],
    ['شماره سند', line.number || '—'],
    ['نوع عملیات', line.type || '—'],
    ['حساب', line.record?.account || line.record?.account_name || '—'],
    ['شرح', line.description || '—'],
    ['بدهکار', line.debit ? fmt(line.debit) : '—'],
    ['بستانکار', line.credit ? fmt(line.credit) : '—'],
    ['ارز', currencyLabel(line.currency)],
  ];

  return (
    <div
      className="a1m-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="جزئیات سند"
      style={{ background: 'rgba(11, 39, 66, 0.55)' }}
      onClick={onClose}
    >
      <section
        className="a1m-sheet"
        style={{ position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '84dvh', borderRadius: '18px 18px 0 0', overflow: 'hidden' }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="a1m-sheet__head">
          <span className="a1m-sheet__title">جزئیات سند</span>
          <button type="button" className="a1m-sheet__close" onClick={onClose} aria-label="بستن"><X className="h-4 w-4" /></button>
        </header>

        <div className="a1m-sheet__body" style={{ display: 'grid', gap: 10 }}>
          <div className="a1m-card" style={{ margin: 0 }}>
            <div className="a1m-card__top">
              <b className="a1m-card__title">سطر دفتر حساب</b>
              <span className="a1m-badge a1m-badge--blue">خواندنی</span>
            </div>
            <div className="a1m-card__meta" style={{ marginTop: 7 }}>
              {ledgerPairs.map(([label, value]) => (
                <span key={label} className="a1m-card__pair">{label}: <b>{value}</b></span>
              ))}
            </div>
          </div>

          <div className="a1m-card" style={{ margin: 0 }}>
            <div className="a1m-card__top">
              <b className="a1m-card__title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {source.linked ? <FileText className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                {source.linked ? 'سند اصلی · ' + source.label : 'سند اصلی'}
              </b>
              {source.linked ? null : <span className="a1m-badge a1m-badge--gold">اتصال‌نیافته</span>}
            </div>
            {source.linked ? (
              <div className="a1m-card__meta" style={{ marginTop: 7 }}>
                {pairs.map(([label, value]) => (
                  <span key={label} className="a1m-card__pair">{label}: <b>{value}</b></span>
                ))}
              </div>
            ) : (
              <p className="a1m-note" style={{ marginTop: 7 }}>
                {source.label}؛ برای جلوگیری از نمایش سند اشتباه، هیچ سند دیگری حدس زده نمی‌شود.
                این سطر فقط در دفتر حساب همین طرف حساب ثبت شده است.
              </p>
            )}
          </div>

          <div className="a1m-card" style={{ margin: 0 }}>
            <div className="a1m-card__top">
              <b className="a1m-card__title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ListTree className="h-3.5 w-3.5" />سابقهٔ همین سند در دفتر کل
              </b>
              <span className="a1m-badge">{fmt(siblings.length)} سطر</span>
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 7 }}>
              {siblings.map((item) => {
                const candidate = onOpenAccount ? lineAccountLink(data, item) : null;
                const siblingLink = candidate && candidate.kind !== 'chart' ? candidate : null;
                return (
                  <div key={item.id} style={{ display: 'grid', gap: 2, borderTop: '1px dashed #dbe5ef', paddingTop: 6 }}>
                    <div className="a1m-card__meta">
                      <span className="a1m-card__pair">حساب: <b>{item.account_name || item.account || item.accountType || '—'}</b></span>
                      <span className="a1m-card__pair">ارز: <b>{currencyLabel(item.currency)}</b></span>
                    </div>
                    <div className="a1m-card__meta">
                      <span className="a1m-card__pair">بدهکار: <b>{item.debit ? fmt(item.debit) : '—'}</b></span>
                      <span className="a1m-card__pair">بستانکار: <b>{item.credit ? fmt(item.credit) : '—'}</b></span>
                    </div>
                    {siblingLink ? (
                      <button
                        type="button"
                        className="a1m-badge a1m-badge--blue"
                        style={{ padding: '4px 8px', fontSize: 9, justifySelf: 'start' }}
                        onClick={() => openAccount(siblingLink.kind, siblingLink.record)}
                      >
                        باز کردن {ACCOUNT_KIND_LABELS[siblingLink.kind] || 'حساب'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {!siblings.length ? (
                <div className="a1m-empty">سطر دیگری با همین سند در دفتر کل پیدا نشد.</div>
              ) : null}
            </div>
          </div>

          {counterLinks.length ? (
            <div className="a1m-card" style={{ margin: 0 }}>
              <b className="a1m-card__title">حساب طرف مقابل همین سند</b>
              <div style={{ display: 'grid', gap: 6, marginTop: 7 }}>
                {counterLinks.map((item) => (
                  <button
                    key={item.kind + '::' + item.record.id}
                    type="button"
                    className="a1m-badge a1m-badge--green"
                    style={{ padding: '8px 10px', fontSize: 10, display: 'flex', justifyContent: 'space-between', textAlign: 'right' }}
                    onClick={() => openAccount(item.kind, item.record)}
                  >
                    <span>{(ACCOUNT_KIND_LABELS[item.kind] || 'حساب') + ' · ' + item.label}</span>
                    <b>{item.line?.debit ? fmt(item.line.debit) : item.line?.credit ? fmt(item.line.credit) : ''}</b>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="a1m-note">
            این پنجره فقط برای مشاهده است؛ از اینجا سندی ثبت، ویرایش یا ابطال نمی‌شود.
          </p>
        </div>
      </section>
    </div>
  );
}