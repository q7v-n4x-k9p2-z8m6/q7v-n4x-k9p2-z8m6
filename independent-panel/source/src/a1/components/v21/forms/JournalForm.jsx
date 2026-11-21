// a1/components/v21/forms/JournalForm.jsx — روزنامچهٔ دو سطری و چندسطری
// سطرها و مبالغ در همین فرم نگه داشته می‌شوند و با هر کلید، کل میز کار دوباره ساخته نمی‌شود؛
// مقدار نهایی هنگام ثبت به لایهٔ ذخیره فرستاده می‌شود تا ورودی هیچ‌گاه عقب نماند.
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Labeled, TextInput, SelectBox, FormNotice, FormFooter } from './FormBits';
import { currencyOptions, ledgerAccountOptions } from '@/a1/lib/v21Options';
import { journalTotals } from '@/a1/lib/v21Domain';

const emptyRow = () => ({ account: '', debit: '', credit: '' });
const n = value => Number(String(value ?? 0).replaceAll(',', '')) || 0;
const normalizeRows = rows => (Array.isArray(rows) && rows.length ? rows : [emptyRow(), emptyRow()]);

export default function JournalForm({ draft, setField, data, saving, onSave, onCancel }) {
  const mode = draft.journalMode === 'multi' ? 'multi' : 'simple';
  const [rows, setRows] = useState(() => normalizeRows(draft.rows));
  const options = useMemo(() => ledgerAccountOptions(data, draft.currency || 'AFN'), [data, draft.currency]);
  // خطای اعتبارسنجی فقط هنگام تلاش برای ثبت نشان داده می‌شود؛ ورودی‌ها همیشه آزاد می‌مانند.
  const [error, setError] = useState('');

  // پیش‌نویس تازه (سند جدید، ویرایش یا پاک‌کردن فرم) جای سطرهای جاری را می‌گیرد
  useEffect(() => {
    const incoming = normalizeRows(draft.rows);
    if (JSON.stringify(incoming) !== JSON.stringify(rows)) setRows(incoming);
    // فقط تغییر پیش‌نویس بیرونی بررسی می‌شود، نه تایپ خودِ فرم
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.rows]);

  const updateRow = (index, key, value) => {
    setError('');
    setRows(current => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => { setError(''); setRows(current => [...current, emptyRow()]); };
  const removeRow = index => { setError(''); setRows(current => current.filter((item, itemIndex) => itemIndex !== index)); };

  const changeMode = value => {
    setField('journalMode', value);
    if (value === 'simple') setRows(current => current.slice(0, 2).concat(current.length < 2 ? [emptyRow()] : []).slice(0, 2));
  };

  const totals = useMemo(() => journalTotals(rows.filter(row => n(row.debit) || n(row.credit))), [rows]);
  const balanced = totals.length > 0 && totals.every(total => total.balanced);
  const visibleRows = mode === 'simple' ? rows.slice(0, 2) : rows;
  const postedRows = mode === 'simple' ? rows.slice(0, 2) : rows;

  // کنترل پیش از ارسال: ناترازی و سطر ناقص همین‌جا با پیام روشن گزارش می‌شود،
  // نه این‌که دکمهٔ ثبت پیش از هر تلاشی غیرفعال و شبیه «در حال ثبت» بماند.
  const submit = keepOpen => {
    const filled = postedRows.filter(row => n(row.debit) || n(row.credit));
    if (filled.length < 2) { setError('برای ثبت سند، دست‌کم دو سطر با مبلغ بدهکار یا بستانکار لازم است.'); return; }
    if (filled.some(row => !row.account)) { setError('برای هر سطری که مبلغ دارد، حساب همان سطر را انتخاب کنید.'); return; }
    if (filled.some(row => n(row.debit) > 0 && n(row.credit) > 0)) { setError('هر سطر فقط یک طرف دارد؛ در یک سطر هم بدهکار و هم بستانکار وارد نکنید.'); return; }
    if (!balanced) {
      const detail = totals.map(total => `${total.currency}: بدهکار ${total.debit.toLocaleString('fa-IR')} / بستانکار ${total.credit.toLocaleString('fa-IR')}`).join(' — ');
      setError('سند ناتراز است و ثبت نمی‌شود؛ جمع بدهکار و بستانکار باید برابر باشد. ' + detail);
      return;
    }
    setError('');
    // مبالغِ همین فرم همراه ثبت فرستاده می‌شوند تا ذخیره هرگز مقدار قدیمی نگیرد
    onSave(keepOpen, { rows: postedRows });
  };

  return (
    <>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Labeled label="تاریخ"><TextInput type="date" value={draft.date} onChange={value => setField('date', value)} /></Labeled>
        <Labeled label="ارز سند" hint="همهٔ سطرهای این سند در همین ارز ثبت می‌شوند.">
          <SelectBox value={draft.currency} onChange={value => setField('currency', value)} options={currencyOptions()} />
        </Labeled>
        <Labeled label="شرح سند" wide><TextInput value={draft.description} onChange={value => setField('description', value)} /></Labeled>
        <Labeled label="حالت سند" wide>
          <SelectBox
            value={mode}
            onChange={changeMode}
            options={[{ value: 'simple', label: 'سند سادهٔ دو سطری' }, { value: 'multi', label: 'سند چندسطری' }]}
          />
        </Labeled>
      </div>

      <div className="space-y-2 px-4">
        {visibleRows.map((row, index) => (
          <div key={index} className="grid grid-cols-12 items-end gap-1 border border-slate-200 bg-white p-2">
            <div className="col-span-12 sm:col-span-6">
              <SelectBox value={row.account} onChange={value => updateRow(index, 'account', value)} options={options} placeholder="انتخاب حساب" />
            </div>
            <div className="col-span-5 sm:col-span-2">
              <span className="mb-1 block text-[10px] font-semibold text-rose-700">بدهکار</span>
              <TextInput type="number" min="0" step="0.01" value={row.debit} onChange={value => updateRow(index, 'debit', value)} />
            </div>
            <div className="col-span-5 sm:col-span-2">
              <span className="mb-1 block text-[10px] font-semibold text-emerald-700">بستانکار</span>
              <TextInput type="number" min="0" step="0.01" value={row.credit} onChange={value => updateRow(index, 'credit', value)} />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 2}
                className="flex h-9 w-full items-center justify-center border border-rose-200 bg-rose-50 text-[10px] text-rose-700 disabled:opacity-40"
                aria-label="حذف سطر"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {mode === 'multi' ? (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 border border-blue-300 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-900"
          >
            <Plus className="h-4 w-4" />افزودن سطر
          </button>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-3 border border-slate-200 bg-slate-50 px-3 py-2 text-[10px]">
          {totals.length ? totals.map(total => (
            <span key={total.currency} className={total.balanced ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
              {total.currency}: بدهکار {total.debit.toLocaleString('fa-IR')} / بستانکار {total.credit.toLocaleString('fa-IR')} — {total.balanced ? 'تراز' : 'ناتراز'}
            </span>
          )) : <span className="text-slate-500">مبالغ سطرها را وارد کنید.</span>}
        </div>
        {error ? <FormNotice tone="error">{error}</FormNotice> : null}
        {!balanced ? <FormNotice tone="warning">تا زمانی که جمع بدهکار و بستانکار برابر نشود، سند ثبت نمی‌شود.</FormNotice> : null}
        <FormNotice>دو سطر و چند سطر با یک سند حسابداری ثبت می‌شوند؛ هر سطر فقط یک طرف (بدهکار یا بستانکار) دارد.</FormNotice>
      </div>

      <FormFooter saving={saving} onCancel={onCancel} onSave={submit} saveLabel={draft.id ? 'ثبت ویرایش' : 'ثبت سند'} canSaveNew={!draft.id} />
    </>
  );
}