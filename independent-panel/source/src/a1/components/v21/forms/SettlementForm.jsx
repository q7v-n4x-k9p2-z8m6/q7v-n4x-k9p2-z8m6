// a1/components/v21/forms/SettlementForm.jsx — فرم انتقال بین حساب‌های خود صراف
// صندوق ↔ صندوق، صندوق ↔ بانک و بانک ↔ بانک؛ هر انتقال یک شناسهٔ تسویهٔ مشترک دارد
// که روی هر دو سطر آینه‌ای همان سند می‌نشیند.
import React from 'react';
import { Labeled, TextInput, SelectBox, FormNotice, FormFooter } from './FormBits';
import { currencyOptions, safeOptions, bankOptions } from '@/a1/lib/v21Options';

const KIND_OPTIONS = [{ value: 'cash', label: 'صندوق' }, { value: 'bank', label: 'حساب بانکی' }];

export default function SettlementForm({ draft, setField, data, saving, onSave, onCancel }) {
  const currency = draft.currency || 'AFN';
  const safes = safeOptions(data, currency);
  const banks = bankOptions(data, currency);
  const fromKind = draft.fromKind === 'bank' ? 'bank' : 'cash';
  const toKind = draft.toKind === 'bank' ? 'bank' : 'cash';
  const accountsFor = kind => (kind === 'bank' ? banks : safes);

  // با تغییر نوع حساب، فهرست حساب‌ها عوض می‌شود؛ انتخاب قبلی اگر در فهرست تازه نباشد پاک می‌شود.
  const changeKind = (side, kind) => {
    const field = side === 'from' ? 'fromKind' : 'toKind';
    const accountField = side === 'from' ? 'fromAccount' : 'toAccount';
    setField(field, kind);
    const options = accountsFor(kind);
    if (!options.some(option => option.value === String(draft[accountField] || ''))) {
      setField(accountField, (options[0] || {}).value || '');
    }
  };

  const changeCurrency = value => {
    setField('currency', value);
    const nextSafes = safeOptions(data, value);
    const nextBanks = bankOptions(data, value);
    setField('fromAccount', ((fromKind === 'bank' ? nextBanks : nextSafes)[0] || {}).value || '');
    setField('toAccount', ((toKind === 'bank' ? nextBanks : nextSafes)[0] || {}).value || '');
  };

  return (
    <>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Labeled label="تاریخ"><TextInput type="date" value={draft.date} onChange={value => setField('date', value)} /></Labeled>
        <Labeled label="ارز"><SelectBox value={currency} onChange={changeCurrency} options={currencyOptions()} /></Labeled>

        <Labeled label="از (نوع حساب)">
          <SelectBox value={fromKind} onChange={value => changeKind('from', value)} options={KIND_OPTIONS} />
        </Labeled>
        <Labeled label="حساب مبدأ">
          <SelectBox value={String(draft.fromAccount || '')} onChange={value => setField('fromAccount', value)} options={accountsFor(fromKind)} placeholder="انتخاب حساب مبدأ" />
        </Labeled>

        <Labeled label="به (نوع حساب)">
          <SelectBox value={toKind} onChange={value => changeKind('to', value)} options={KIND_OPTIONS} />
        </Labeled>
        <Labeled label="حساب مقصد">
          <SelectBox value={String(draft.toAccount || '')} onChange={value => setField('toAccount', value)} options={accountsFor(toKind)} placeholder="انتخاب حساب مقصد" />
        </Labeled>

        <Labeled label="مبلغ انتقال">
          <TextInput type="number" min="0" step="0.01" value={draft.amount} onChange={value => setField('amount', value)} />
        </Labeled>
        <Labeled label="شناسهٔ تسویهٔ مشترک" hint="هر دو سطر سند همین شناسه را می‌گیرند؛ خالی بگذارید تا خودکار ساخته شود.">
          <TextInput value={draft.settlementId} onChange={value => setField('settlementId', value)} placeholder="مثلاً ST-20260101-A1B2" />
        </Labeled>

        <Labeled label="یادداشت" wide>
          <TextInput value={draft.note} onChange={value => setField('note', value)} placeholder="مثلاً انتقال نقدینگی به صندوق ارزی" />
        </Labeled>
      </div>
      <div className="space-y-2 px-4 pb-4">
        <FormNotice>
          مبدأ بستانکار و مقصد بدهکار می‌شود؛ هر دو سطر یک سند و یک شناسهٔ تسویه دارند، پس انتقال در دفتر هر دو حساب دقیقاً آینهٔ هم دیده می‌شود و ماندهٔ هر دو حساب فوراً به‌روز می‌شود.
        </FormNotice>
        {!safes.length && !banks.length ? (
          <FormNotice tone="warning">برای این ارز هیچ صندوق یا حساب بانکی فعالی وجود ندارد؛ نخست حساب را در بخش صندوق‌ها یا بانک و چک ثبت کنید.</FormNotice>
        ) : null}
      </div>
      <FormFooter saving={saving} onCancel={onCancel} onSave={onSave} saveLabel="ثبت انتقال" canSaveNew={false} />
    </>
  );
}