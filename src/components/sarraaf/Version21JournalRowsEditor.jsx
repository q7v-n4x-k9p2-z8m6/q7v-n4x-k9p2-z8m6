import React, { useEffect, useMemo, useState } from 'react';

const emptyRows = () => [
  { account: '', debit: '', credit: 0 },
  { account: '', debit: 0, credit: '' },
];

export default function Version21JournalRowsEditor({ draft, setDraft, data }) {
  const [rows, setRows] = useState(Array.isArray(draft.rows) && draft.rows.length >= 2 ? draft.rows : emptyRows());
  const currency = draft.currency || 'AFN';
  const mode = draft.journalMode === 'multi' || rows.length > 2 ? 'multi' : 'simple';

  useEffect(() => {
    if (Array.isArray(draft.rows) && draft.rows.length >= 2) {
      setRows(current => JSON.stringify(current) === JSON.stringify(draft.rows) ? current : draft.rows);
    } else {
      const initial = emptyRows();
      setRows(current => current.length >= 2 ? current : initial);
      setDraft(current => ({ ...current, rows: current.rows?.length >= 2 ? current.rows : initial }));
    }
  }, [draft.rows]);

  const accountOptions = useMemo(() => [
    { value: '', label: 'انتخاب حساب' },
    ...data.accounts.filter(account => account.status !== 'غیرفعال').map(account => ({
      value: account.code + ' — ' + account.name,
      label: account.code + ' — ' + account.name,
    })),
    ...data.cash.filter(account => account.currency === currency).map(account => ({
      value: 'صندوق: ' + account.name,
      label: 'صندوق: ' + account.name + ' (' + account.currency + ')',
    })),
    ...data.banks.filter(account => account.status !== 'غیرفعال' && account.currency === currency).map(account => ({
      value: 'بانک: ' + account.id,
      label: 'بانک: ' + account.name + ' (' + account.currency + ')',
    })),
  ], [data.accounts, data.cash, data.banks, currency]);

  const update = next => {
    setRows(next);
    setDraft(current => ({ ...current, rows: next }));
  };
  const changeRow = (index, key, value) => update(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const addRow = () => update([...rows, { account: '', debit: 0, credit: 0 }]);
  const removeRow = index => {
    if (rows.length <= 2) return;
    update(rows.filter((_, rowIndex) => rowIndex !== index));
  };
  const visibleRows = mode === 'simple' ? rows.slice(0, 2) : rows;
  const debit = visibleRows.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
  const credit = visibleRows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
  const balanced = Math.abs(debit - credit) < 0.005;

  return (
    <section dir="rtl" className="mx-4 mb-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-800">سطرهای سند روزنامچه</h3>
          <p className="text-[10px] text-slate-500">هر سطر فقط یک طرف بدهکار یا بستانکار دارد؛ توازن در هر ارز کنترل می‌شود.</p>
        </div>
        {mode === 'multi' && <button type="button" onClick={addRow} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-800">افزودن سطر</button>}
      </div>
      <div className="space-y-2">
        {visibleRows.map((row, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
            <label className="space-y-1 text-[10px]">
              <span className="font-semibold text-slate-600">حساب سطر {index + 1}</span>
              <select value={row.account || ''} onChange={event => changeRow(index, 'account', event.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs">
                {accountOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="font-semibold text-slate-600">بدهکار</span>
              <input type="number" min="0" step="any" value={row.debit ?? ''} onChange={event => changeRow(index, 'debit', event.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs" />
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="font-semibold text-slate-600">بستانکار</span>
              <input type="number" min="0" step="any" value={row.credit ?? ''} onChange={event => changeRow(index, 'credit', event.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs" />
            </label>
            <div className="flex items-end">
              {mode === 'multi' && rows.length > 2 && <button type="button" onClick={() => removeRow(index)} className="h-9 rounded-lg border border-rose-200 px-3 text-[10px] text-rose-700">حذف</button>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px]">
        <span>جمع بدهکار: <b>{debit.toLocaleString('fa-IR')} {currency}</b></span>
        <span>جمع بستانکار: <b>{credit.toLocaleString('fa-IR')} {currency}</b></span>
        <span className={balanced ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>{balanced ? 'سند متوازن است' : 'اختلاف: ' + Math.abs(debit - credit).toLocaleString('fa-IR') + ' ' + currency}</span>
      </div>
      {mode === 'simple' && rows.length > 2 && <p className="mt-2 text-[10px] text-amber-700">برای دیدن همهٔ سطرهای موجود، حالت چندسطری را انتخاب کنید.</p>}
    </section>
  );
}
