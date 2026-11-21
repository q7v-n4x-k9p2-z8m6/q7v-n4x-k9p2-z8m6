// a1/mobile/MobileFormSheet.jsx — شیت تمام‌صفحهٔ فرم‌ها در پوستهٔ موبایل
// فیلدها از رجیستری مرکزی (core/registry) و قواعد ثبت از دامنه (core/domain/posting) می‌آیند.
// این فایل فقط لایهٔ نمایش است: هیچ اعتبارسنجی یا قاعدهٔ مالی این‌جا تکرار نشده است.
import React, { useEffect, useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { MobileField, MobileInput, MobileSelect, MobileNote } from '@/a1/mobile/MobileFormBits';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { CURRENCIES, currencyLabel } from '@/a1/mobile/demoData';
import { MASTER_FORMS } from '@/core/registry/masterForms';
import { buildDraft, validate, normalize, collectionFor } from '@/core/domain/posting';
import { isLocked } from '@/core/domain/reversal';
import { ExpenseFields, RemittanceFields, ExchangeFields, JournalFields, CashFlowFields } from '@/a1/mobile/MobilePostingForms';

const currencyOptions = CURRENCIES.map((code) => ({ value: code, label: currencyLabel(code) }));

const POSTING_TITLES = {
  expenses: 'مصرف',
  remittance: 'حواله',
  exchange: 'معامله اسعار',
  journal: 'سند روزنامچه',
  cashFlow: 'گردش صندوق',
};

// این اسناد برای ویرایش باید از موتور محلی خوانده شوند تا سطرهای دفتر و شناسهٔ سند درست باشد
const EDIT_LOAD_MODULES = new Set(['expenses', 'remittance', 'exchange', 'journal']);

function optionsFor(field, data, draft) {
  if (field.dynamic === 'parent') {
    return [
      { value: '', label: 'بدون حساب مادر' },
      ...(data.accounts || [])
        .filter((row) => !row.parentId && row.id !== draft.id && row.status !== 'غیرفعال')
        .map((row) => ({ value: row.code, label: row.code + ' — ' + row.name })),
    ];
  }
  if (field.dynamic === 'optionalCurrency') {
    return [{ value: '', label: 'بدون ارز اختصاصی' }, ...currencyOptions];
  }
  return field.options || [];
}

function MasterFields({ module, draft, setField }) {
  const { data } = useMobileDemo();
  const schema = MASTER_FORMS[module];
  return (
    <div className="a1m-formgrid">
      {schema.fields.map((field) => (
        <MobileField key={field.key} label={field.label} hint={field.hint}>
          {field.type === 'select' ? (
            <MobileSelect value={draft[field.key] ?? ''} onChange={(value) => setField(field.key, value)} options={optionsFor(field, data, draft)} />
          ) : (
            <MobileInput
              type={field.type}
              inputMode={field.type === 'number' ? 'decimal' : undefined}
              value={draft[field.key]}
              onChange={(value) => setField(field.key, value)}
            />
          )}
        </MobileField>
      ))}
      {module === 'accounts' ? (
        <MobileNote tone="info">حساب مادر باید حساب کل (بدون مادر)، فعال و غیر از همین حساب باشد؛ کد حساب یکتا است.</MobileNote>
      ) : null}
    </div>
  );
}

export default function MobileFormSheet({ form, onClose, notify }) {
  const demo = useMobileDemo();
  const { data } = demo;
  const { module, record, defaults } = form;
  const [draft, setDraft] = useState(() => buildDraft(module, record, defaults || {}, data));
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(record) && EDIT_LOAD_MODULES.has(module));

  useEffect(() => {
    if (!record || !EDIT_LOAD_MODULES.has(module) || !demo.loadForEdit) return undefined;
    let alive = true;
    demo.loadForEdit(module, record)
      .then((loaded) => { if (alive) { setDraft(loaded); setLoadingDraft(false); } })
      .catch((failure) => {
        if (!alive) return;
        setLoadingDraft(false);
        notify(failure?.message || 'سند اصلی برای ویرایش باز نشد.', 'error');
      });
    return () => { alive = false; };
  }, []);
  const setField = (key, value) => setDraft((current) => ({
    ...current,
    [key]: value,
    ...(key === 'accountType' ? { nature: ['revenue', 'liability', 'equity'].includes(value) ? 'بستانکار' : 'بدهکار' } : {}),
  }));

  const title = MASTER_FORMS[module] ? MASTER_FORMS[module].title : POSTING_TITLES[module];

  const save = async () => {
    if (saving || loadingDraft) return;
    if (record && isLocked(record)) { notify('سند ابطال‌شده یا سند معکوس قابل ویرایش نیست؛ برای اصلاح، سند جدید ثبت کنید.', 'error'); return; }
    const error = validate(module, draft, data);
    if (error) { notify(error, 'error'); return; }
    const collection = collectionFor(module);
    const payload = normalize(module, draft);
    const isMaster = Boolean(MASTER_FORMS[module]);
    setSaving(true);
    try {
      const saved = record
        ? await demo.update(collection, record.id, payload)
        : await demo.add(collection, payload);
      notify(
        isMaster
          ? (record ? 'رکورد ویرایش شد؛ سوابق مرتبط حفظ شد.' : 'رکورد جدید در حافظهٔ محلی ثبت شد.')
          : (record
            ? 'سند ویرایش شد؛ دفتر کل، گزارش عملیات و مفاد و زیان با همان سند به‌روز شد.'
            : 'سند ثبت شد؛ دفتر کل و گزارش عملیات به‌روز شد.'),
        'success'
      );
      onClose();
    } catch (failure) {
      notify(failure?.message || 'ثبت انجام نشد.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="a1m-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <header className="a1m-sheet__head">
        <span className="a1m-sheet__title">{record ? 'ویرایش ' : 'ثبت '}{title}</span>
        <span className="a1m-chip a1m-chip--gold">دموی محلی</span>
        <button type="button" onClick={onClose} className="a1m-sheet__close" aria-label="بستن فرم">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="a1m-sheet__body">
        {loadingDraft ? <MobileNote tone="info">در حال خواندن سند اصلی از موتور محلی…</MobileNote> : null}
        {MASTER_FORMS[module] ? <MasterFields module={module} draft={draft} setField={setField} /> : null}
        {module === 'expenses' ? <ExpenseFields draft={draft} setField={setField} /> : null}
        {module === 'remittance' ? <RemittanceFields draft={draft} setField={setField} /> : null}
        {module === 'exchange' ? <ExchangeFields draft={draft} setField={setField} /> : null}
        {module === 'journal' ? <JournalFields draft={draft} setField={setField} /> : null}
        {module === 'cashFlow' ? <CashFlowFields draft={draft} setField={setField} /> : null}
      </div>

      <footer className="a1m-sheet__foot">
        <button type="button" onClick={save} disabled={saving || loadingDraft} className="a1m-btn a1m-btn--primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving || loadingDraft ? 0.6 : 1 }}>
          <Check className="h-4 w-4" />{saving ? 'در حال ثبت...' : loadingDraft ? 'در حال آماده‌سازی...' : record ? 'ثبت ویرایش' : 'ثبت'}
        </button>
        <button
          type="button"
          onClick={() => setDraft(buildDraft(module, null, defaults || {}, data))}
          className="a1m-btn a1m-btn--ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RotateCcw className="h-4 w-4" />پاک‌کردن
        </button>
        <button type="button" onClick={onClose} className="a1m-btn a1m-btn--ghost">انصراف</button>
      </footer>
    </div>
  );
}