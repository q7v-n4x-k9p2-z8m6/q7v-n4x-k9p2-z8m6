// a1/components/v21/forms/ExchangeForm.jsx — فرم تبدیل دو ارز، خرید و فروش اسعار
import React, { useMemo, useState } from 'react';
import { Labeled, TextInput, SelectBox, FormNotice, FormFooter } from './FormBits';
import { currencyOptions, safeOptions, customerOptions } from '@/a1/lib/v21Options';
import { EXCHANGE_KINDS } from '@/a1/lib/v21Domain';

const n = value => Number(String(value ?? 0).replaceAll(',', '')) || 0;

export default function ExchangeForm({ draft, setField, data, saving, onSave, onCancel }) {
  const kind = ['convert', 'buy', 'sell'].includes(draft.kind) ? draft.kind : 'convert';
  const needsParty = kind !== 'convert';
  const foreignCurrency = draft.foreignCurrency || 'USD';
  const baseCurrency = draft.baseCurrency || 'AFN';
  const foreignSafes = safeOptions(data, foreignCurrency);
  const baseSafes = safeOptions(data, baseCurrency);
  // خطاها فقط پس از نخستین تلاش برای ثبت نشان داده می‌شوند؛ پیش از آن فرم تازه باز شده است.
  const [attempted, setAttempted] = useState(false);

  // همان قواعدی که موتور ثبت سند می‌سنجد، پیش از فرستادن فرم بررسی می‌شود؛
  // پیام هر مورد زیر همان فیلد می‌نشیند تا کاربر بداند کدام ورودی را کامل کند.
  const errors = useMemo(() => {
    const list = {};
    if (!foreignSafes.length) list.foreignCash = 'صندوق فعالی برای ارز اول تعریف نشده است.';
    else if (!draft.foreignCash) list.foreignCash = 'انتخاب صندوق ارز اول الزامی است.';
    if (!baseSafes.length) list.baseCash = 'صندوق فعالی برای ارز دوم تعریف نشده است.';
    else if (!draft.baseCash) list.baseCash = 'انتخاب صندوق ارز دوم الزامی است.';
    if (foreignCurrency === baseCurrency) list.baseCurrency = 'ارز دو طرف معامله باید متفاوت باشد.';
    if (n(draft.foreignAmount) <= 0) list.foreignAmount = 'مبلغ ارز اول باید عددی بزرگ‌تر از صفر باشد.';
    if (n(draft.baseAmount) <= 0) list.baseAmount = 'مبلغ ارز دوم باید عددی بزرگ‌تر از صفر باشد.';
    if (needsParty && !draft.party) list.party = 'برای خرید و فروش اسعار، انتخاب طرف حساب الزامی است.';
    if (n(draft.fee) < 0) list.fee = 'کمیشن نمی‌تواند منفی باشد.';
    return list;
  }, [draft.foreignCash, draft.baseCash, draft.foreignAmount, draft.baseAmount, draft.party, draft.fee, foreignCurrency, baseCurrency, needsParty, foreignSafes.length, baseSafes.length]);

  const errorList = Object.values(errors);
  const showError = field => (attempted ? errors[field] : '');
  const visibleErrors = attempted ? errorList : [];

  const handleSave = keepOpen => {
    setAttempted(true);
    if (errorList.length) return;
    onSave(keepOpen);
  };

  const rate = useMemo(() => {
    const foreignAmount = n(draft.foreignAmount);
    const baseAmount = n(draft.baseAmount);
    if (!foreignAmount || !baseAmount) return '';
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 }).format(baseAmount / foreignAmount);
  }, [draft.foreignAmount, draft.baseAmount]);

  const changeForeignCurrency = value => {
    setField('foreignCurrency', value);
    setField('foreignCash', (safeOptions(data, value)[0] || {}).value || '');
  };
  const changeBaseCurrency = value => {
    setField('baseCurrency', value);
    setField('baseCash', (safeOptions(data, value)[0] || {}).value || '');
  };

  return (
    <>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Labeled label="نوع عملیات" wide>
          <SelectBox value={kind} onChange={value => setField('kind', value)} options={EXCHANGE_KINDS} />
        </Labeled>
        <Labeled label="تاریخ"><TextInput type="date" value={draft.date} onChange={value => setField('date', value)} /></Labeled>
        <Labeled label="طرف حساب" error={showError('party')} hint={needsParty ? 'برای خرید و فروش اسعار الزامی است.' : 'اختیاری؛ بدون آن حساب واسط استفاده می‌شود.'}>
          <SelectBox value={draft.party} onChange={value => setField('party', value)} options={customerOptions(data)} placeholder="بدون طرف حساب" />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'ارز پرداختی صراف' : 'ارز خارجی'} error={showError('foreignCurrency')}>
          <SelectBox value={foreignCurrency} onChange={changeForeignCurrency} options={currencyOptions()} />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'مبلغ پرداختی' : 'مبلغ ارز خارجی'} error={showError('foreignAmount')}>
          <TextInput type="number" min="0" step="0.01" value={draft.foreignAmount} onChange={value => setField('foreignAmount', value)} />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'ارز دریافتی صراف' : 'ارز پایه'} error={showError('baseCurrency')}>
          <SelectBox value={baseCurrency} onChange={changeBaseCurrency} options={currencyOptions()} />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'مبلغ دریافتی' : 'مبلغ ارز پایه'} error={showError('baseAmount')}>
          <TextInput type="number" min="0" step="0.01" value={draft.baseAmount} onChange={value => setField('baseAmount', value)} />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'صندوق پرداخت' : 'صندوق ارز خارجی'} error={showError('foreignCash')}>
          <SelectBox value={draft.foreignCash} onChange={value => setField('foreignCash', value)} options={foreignSafes} placeholder="انتخاب صندوق" />
        </Labeled>
        <Labeled label={kind === 'convert' ? 'صندوق دریافت' : 'صندوق ارز پایه'} error={showError('baseCash')}>
          <SelectBox value={draft.baseCash} onChange={value => setField('baseCash', value)} options={baseSafes} placeholder="انتخاب صندوق" />
        </Labeled>
        <Labeled label="کمیشن معامله (ارز پایه)" error={showError('fee')} hint="کمیشن به حساب درآمد ثبت می‌شود؛ سود معامله از نرخ به‌تنهایی محاسبه نمی‌شود.">
          <TextInput type="number" min="0" step="0.01" value={draft.fee} onChange={value => setField('fee', value)} />
        </Labeled>
        <Labeled label="نرخ محاسبه‌شده" hint="فقط نمایشی؛ از تقسیم مبلغ ارز پایه بر ارز خارجی به‌دست می‌آید.">
          <div className="flex h-9 items-center border border-slate-200 bg-slate-50 px-2 text-[11px] tabular-nums text-slate-700">{rate || '—'}</div>
        </Labeled>
        <Labeled label="یادداشت" wide>
          <TextInput value={draft.note} onChange={value => setField('note', value)} placeholder="شرح معامله" />
        </Labeled>
      </div>
      <div className="space-y-2 px-4 pb-4">
        {visibleErrors.length ? (
          <FormNotice tone="error">
            <b className="block">این معامله ثبت نشد؛ موارد زیر را کامل کنید:</b>
            <ul className="mt-1 list-inside list-disc">
              {visibleErrors.map(message => <li key={message}>{message}</li>)}
            </ul>
          </FormNotice>
        ) : null}
        <FormNotice>
          {kind === 'convert'
            ? 'تبدیل دو ارز: صندوق ارز خارجی و صندوق ارز پایه هر دو در یک سند چهارسطری ثبت می‌شوند و هر ارز جداگانه تراز می‌شود.'
            : kind === 'buy'
              ? 'خرید اسعار: ارز خارجی از مشتری دریافت و ارز پایه به او پرداخت می‌شود.'
              : 'فروش اسعار: ارز خارجی به مشتری پرداخت و ارز پایه از او دریافت می‌شود.'}
        </FormNotice>
      </div>
      <FormFooter saving={saving} onCancel={onCancel} onSave={handleSave} saveLabel={draft.id ? 'ثبت ویرایش' : 'ثبت معامله'} canSaveNew={!draft.id} />
    </>
  );
}