// a1/components/v21/forms/ExpenseForm.jsx — فرم ثبت و ویرایش مصرف با پرداخت از صندوق یا بانک
import React from 'react';
import { Labeled, TextInput, SelectBox, FormNotice, FormFooter } from './FormBits';
import { currencyOptions, safeOptions, bankOptions, expenseAccountOptions } from '@/a1/lib/v21Options';

export default function ExpenseForm({ draft, setField, data, saving, onSave, onCancel }) {
  const payerType = draft.payerType === 'bank' ? 'bank' : 'cash';
  const safes = safeOptions(data, draft.currency || 'AFN');
  const banks = bankOptions(data, draft.currency || 'AFN');
  const expenseAccounts = expenseAccountOptions(data);

  const changeCurrency = value => {
    setField('currency', value);
    if (payerType === 'cash') setField('cash', (safeOptions(data, value)[0] || {}).value || '');
    else setField('bank', (bankOptions(data, value)[0] || {}).value || '');
  };

  const changePayerType = value => {
    setField('payerType', value);
    if (value === 'bank') setField('bank', (banks[0] || {}).value || '');
    else setField('cash', (safes[0] || {}).value || '');
  };

  return (
    <>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Labeled label="تاریخ"><TextInput type="date" value={draft.date} onChange={value => setField('date', value)} /></Labeled>
        <Labeled label="شرح مصرف"><TextInput value={draft.title} onChange={value => setField('title', value)} /></Labeled>
        <Labeled label="حساب مصرف">
          <SelectBox value={draft.expenseAccount} onChange={value => setField('expenseAccount', value)} options={expenseAccounts} placeholder="انتخاب حساب مصرف" />
        </Labeled>
        <Labeled label="ارز">
          <SelectBox value={draft.currency} onChange={changeCurrency} options={currencyOptions()} />
        </Labeled>
        <Labeled label="مبلغ"><TextInput type="number" min="0" step="0.01" value={draft.amount} onChange={value => setField('amount', value)} /></Labeled>
        <Labeled label="پرداخت از">
          <SelectBox
            value={payerType}
            onChange={changePayerType}
            options={[{ value: 'cash', label: 'صندوق' }, { value: 'bank', label: 'حساب بانکی' }]}
          />
        </Labeled>
        {payerType === 'cash' ? (
          <Labeled label="صندوق پرداخت">
            <SelectBox value={draft.cash} onChange={value => setField('cash', value)} options={safes} placeholder="انتخاب صندوق" />
          </Labeled>
        ) : (
          <Labeled label="حساب بانکی پرداخت">
            <SelectBox value={String(draft.bank || '')} onChange={value => setField('bank', value)} options={banks} placeholder="انتخاب حساب بانکی" />
          </Labeled>
        )}
        <Labeled label="یادداشت" wide>
          <TextInput value={draft.note} onChange={value => setField('note', value)} placeholder="توضیح اختیاری" />
        </Labeled>
      </div>
      <div className="space-y-2 px-4 pb-4">
        <FormNotice>
          سند مصرف: حساب مصرف بدهکار و صندوق یا بانک پرداخت‌کننده بستانکار می‌شود؛ هر دو با یک سند دوطرفه ثبت می‌شوند.
        </FormNotice>
        {!expenseAccounts.length ? (
          <FormNotice tone="error">هیچ حساب مصرف فعالی در کدینگ نیست؛ ابتدا در «کدینگ حساب‌ها» یک حساب از نوع مصرف بسازید یا کدینگ پایه را ایجاد کنید.</FormNotice>
        ) : null}
      </div>
      <FormFooter saving={saving} onCancel={onCancel} onSave={onSave} saveLabel={draft.id ? 'ثبت ویرایش' : 'ثبت مصرف'} canSaveNew={!draft.id} />
    </>
  );
}