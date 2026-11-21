// a1/components/v21/transactions/TransactionDetail.jsx — جزئیات فقط‌خواندنی یک معامله
import React, { useEffect, useMemo } from 'react';
import { X, ExternalLink, Info, History, FileText } from 'lucide-react';
import { displayDate, formatMoney, formatRateText, historyFor, SOURCE_META } from './transactionCenter';
import TransactionStatus from './TransactionStatus';
import { toPersianDigits } from '@/a1/lib/format';

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-left text-[11px] font-medium text-foreground">{children}</span>
    </div>
  );
}

export default function TransactionDetail({ record, activity = [], onClose, onOpenModule }) {
  useEffect(() => {
    if (!record) return undefined;
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [record, onClose]);

  const history = useMemo(() => historyFor(record, activity), [record, activity]);
  if (!record) return null;
  const source = SOURCE_META[record.source];

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-950/45 p-3 sm:items-center" role="presentation" onClick={onClose}>
      <section
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="جزئیات معامله"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-border bg-secondary px-3 py-2.5">
          <div className="min-w-0">
            <b className="block truncate text-xs font-extrabold text-foreground">جزئیات معامله — {record.kind}</b>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{record.sourceLabel}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TransactionStatus status={record.status} />
            <button type="button" onClick={onClose} aria-label="بستن جزئیات" className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-white text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="max-h-[72vh] overflow-y-auto p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 text-[10px] font-extrabold text-primary">مشخصات معامله</h3>
              <Row label="شناسهٔ یکتا"><bdi dir="ltr">{record.uniqueId}</bdi></Row>
              <Row label="شماره">{record.number ? toPersianDigits(record.number) : '—'}</Row>
              <Row label="تاریخ">{displayDate(record.date)}</Row>
              <Row label="ماژول مبدأ">{source?.label || record.sourceLabel}</Row>
              <Row label="وضعیت مبدأ">{record.documentStatus}</Row>
            </div>

            <div>
              <h3 className="mb-1 text-[10px] font-extrabold text-primary">طرفین معامله</h3>
              <Row label={record.partyLabel}>{record.party}</Row>
              <Row label="مشتری">{record.customer || '—'}</Row>
              <Row label="نمایندگی / شعبه">{record.branch || '—'}</Row>
              <Row label="ثبت‌کننده">{record.registrar || '—'}</Row>
              <Row label="تأییدکننده">گردش تأیید در این نسخه فعال نیست</Row>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="mb-1 text-[10px] font-extrabold text-primary">مبالغ، ارز و نرخ</h3>
            <Row label="مبلغ اصلی">{formatMoney(record.mainAmount, record.mainCurrency)}</Row>
            <Row label="ارز مبدأ"><bdi dir="ltr">{record.mainCurrency}</bdi></Row>
            {record.secondAmount ? (
              <>
                <Row label="مبلغ مقصد">{formatMoney(record.secondAmount, record.secondCurrency)}</Row>
                <Row label="ارز مقصد"><bdi dir="ltr">{record.secondCurrency}</bdi></Row>
              </>
            ) : null}
            {record.rate ? (
              <Row label="نرخ تبدیل (با جهت)">{formatRateText(record.rate, record.mainCurrency, record.secondCurrency)}</Row>
            ) : null}
            {record.fee > 0 ? (
              <Row label="کارمزد">{formatMoney(record.fee, record.feeCurrency)}</Row>
            ) : null}
            <Row label="معادل ارز پایه">
              {record.base
                ? formatMoney(record.base.amount, record.base.currency) + (record.base.approximate ? ' (تقریبی، بر پایهٔ نرخ ثبت‌شده)' : '')
                : 'نامشخص — نرخ پایه برای این ارز ثبت نشده است'}
            </Row>
          </div>

          {record.accounts.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-1 text-[10px] font-extrabold text-primary">حساب‌های مرتبط</h3>
              {record.accounts.map(item => <Row key={item.label} label={item.label}>{item.value}</Row>)}
            </div>
          )}

          {record.extra.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-1 text-[10px] font-extrabold text-primary">اطلاعات تکمیلی</h3>
              {record.extra.map(item => <Row key={item.label} label={item.label}>{item.value}</Row>)}
            </div>
          )}

          {record.documents.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-1 flex items-center gap-1 text-[10px] font-extrabold text-primary"><FileText className="h-3.5 w-3.5" /> اسناد مرتبط</h3>
              {record.documents.map(item => <Row key={item.label} label={item.label}>{item.value}</Row>)}
              <p className="mt-1 text-[9px] text-muted-foreground">این اسناد توسط ماژول مبدأ ساخته شده‌اند و مرکز معاملات سند جدیدی ایجاد نمی‌کند.</p>
            </div>
          )}

          {record.description && (
            <div className="mt-3">
              <h3 className="mb-1 text-[10px] font-extrabold text-primary">توضیحات</h3>
              <p className="rounded-lg border border-border bg-secondary/50 px-2 py-1.5 text-[11px] leading-5 text-slate-700">{record.description}</p>
            </div>
          )}

          <div className="mt-3">
            <h3 className="mb-1 flex items-center gap-1 text-[10px] font-extrabold text-primary"><History className="h-3.5 w-3.5" /> تاریخچهٔ تغییرات</h3>
            {history.length ? (
              <div className="space-y-1">
                {history.map((item, index) => (
                  <div key={index} className="rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-[10px] text-slate-700">
                    <b className="font-bold">{displayDate(item.date)}</b> · {item.action}
                    {item.description ? ' — ' + item.description : ''}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-[10px] text-muted-foreground">
                سابقهٔ تغییری برای این معامله در سوابق محلی ثبت نشده است؛ وضعیت نمایش داده‌شده از ماژول مبدأ خوانده می‌شود.
              </p>
            )}
          </div>

          <p className="mt-3 flex items-start gap-1 rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-[10px] leading-5 text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            این صفحه فقط نمایش و پیگیری است. ثبت، ویرایش و ابطال در ماژول تخصصی انجام می‌شود و سند یا گردش مالی تکراری ساخته نمی‌شود.
          </p>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-border bg-secondary/40 px-3 py-2">
          <button type="button" onClick={() => onOpenModule(record)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground">
            <ExternalLink className="h-3.5 w-3.5" /> پیگیری در ماژول
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px]">بستن</button>
        </footer>
      </section>
    </div>
  );
}