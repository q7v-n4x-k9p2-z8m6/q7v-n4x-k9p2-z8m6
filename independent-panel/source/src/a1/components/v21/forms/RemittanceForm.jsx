// a1/components/v21/forms/RemittanceForm.jsx — فرم ثبت و ویرایش حواله
import React from 'react';
import { Labeled, TextInput, SelectBox, FormNotice, FormFooter } from './FormBits';
import { currencyOptions, branchOptions, safeOptions, bankOptions } from '@/a1/lib/v21Options';
import { REMITTANCE_SETTLEMENTS } from '@/a1/lib/v21Domain';

export default function RemittanceForm({ draft, setField, data, saving, onSave, onCancel }) {
  const instant = draft.settlement === 'instant';
  const settleType = draft.settleType === 'bank' ? 'bank' : 'cash';
  const safes = safeOptions(data, draft.currency || 'AFN');
  const banks = bankOptions(data, draft.currency || 'AFN');

  const changeSettlement = value => {
    setField('settlement', value);
    if (value === 'instant') {
      const type = draft.settleType === 'bank' ? 'bank' : 'cash';
      setField('settleType', type);
      if (type === 'cash') setField('cash', (safes[0] || {}).value || '');
      else setField('bank', (banks[0] || {}).value || '');
    }
  };

  const changeSettleType = value => {
    setField('settleType', value);
    if (value === 'cash') setField('cash', (safes[0] || {}).value || '');
    else setField('bank', (banks[0] || {}).value || '');
  };

  const changeCurrency = value => {
    setField('currency', value);
    const nextSafes = safeOptions(data, value);
    const nextBanks = bankOptions(data, value);
    if (settleType === 'cash') setField('cash', (nextSafes[0] || {}).value || '');
    else setField('bank', (nextBanks[0] || {}).value || '');
  };

  return (
    <>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Labeled label="تاریخ"><TextInput type="date" value={draft.date} onChange={value => setField('date', value)} /></Labeled>
        <Labeled label="نوع حواله">
          <SelectBox
            value={draft.direction}
            onChange={value => setField('direction', value)}
            options={[{ value: 'ارسالی', label: 'ارسالی' }, { value: 'دریافتی', label: 'دریافتی' }]}
            placeholder="انتخاب نوع حواله"
          />
        </Labeled>
        <Labeled label="فرستنده"><TextInput value={draft.sender} onChange={value => setField('sender', value)} /></Labeled>
        <Labeled label="گیرنده"><TextInput value={draft.receiver} onChange={value => setField('receiver', value)} /></Labeled>
        <Labeled label="ارز">
          <SelectBox value={draft.currency} onChange={changeCurrency} options={currencyOptions()} />
        </Labeled>
        <Labeled label="مبلغ"><TextInput type="number" min="0" step="0.01" value={draft.amount} onChange={value => setField('amount', value)} /></Labeled>
        <Labeled label="کمیشن" hint="کمیشن به حساب درآمد کمیشن حواله ثبت می‌شود.">
          <TextInput type="number" min="0" step="0.01" value={draft.fee} onChange={value => setField('fee', value)} />
        </Labeled>
        <Labeled label="نمایندگی (اختیاری)">
          <SelectBox value={draft.branch} onChange={value => setField('branch', value)} options={branchOptions(data)} placeholder="بدون نمایندگی" />
        </Labeled>
        <Labeled label="روش تسویه" wide>
          <SelectBox value={draft.settlement || 'suspense'} onChange={changeSettlement} options={REMITTANCE_SETTLEMENTS} />
        </Labeled>
        {instant ? (
          <>
            <Labeled label="حساب تسویه">
              <SelectBox
                value={settleType}
                onChange={changeSettleType}
                options={[{ value: 'cash', label: 'صندوق' }, { value: 'bank', label: 'بانک' }]}
              />
            </Labeled>
            {settleType === 'cash' ? (
              <Labeled label="صندوق">
                <SelectBox value={draft.cash} onChange={value => setField('cash', value)} options={safes} placeholder="انتخاب صندوق" />
              </Labeled>
            ) : (
              <Labeled label="حساب بانکی">
                <SelectBox value={String(draft.bank || '')} onChange={value => setField('bank', value)} options={banks} placeholder="انتخاب حساب بانکی" />
              </Labeled>
            )}
          </>
        ) : null}
        <Labeled label="یادداشت" wide>
          <TextInput value={draft.note} onChange={value => setField('note', value)} placeholder="شرح حواله" />
        </Labeled>
      </div>
      <div className="space-y-2 px-4 pb-4">
        <FormNotice>
          {instant
            ? 'تسویهٔ فوری: مبلغ حواله هم‌زمان از/به صندوق یا بانک انتخاب‌شده ثبت می‌شود؛ اثر آن در موجودی و دفتر کل فوراً دیده می‌شود.'
            : 'حساب واسط: مبلغ در حساب «حواله در جریان» می‌ماند تا تسویهٔ نهایی در مرحلهٔ بعد ثبت شود.'}
        </FormNotice>
        <FormNotice tone="warning">
          طرف حساب باید از فهرست مشتریان ثبت‌شده انتخاب یا با همان نام موجود باشد؛ برای حوالهٔ ثبت‌شده، ویرایش از همین فرم و ابطال فقط با ثبت سند معکوس انجام می‌شود.
        </FormNotice>
      </div>
      <FormFooter saving={saving} onCancel={onCancel} onSave={onSave} saveLabel={draft.id ? 'ثبت ویرایش' : 'ثبت حواله'} canSaveNew={!draft.id} />
    </>
  );
}