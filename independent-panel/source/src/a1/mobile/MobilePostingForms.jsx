// a1/mobile/MobilePostingForms.jsx — بدنهٔ فرم‌های مالی موبایل
// ترتیب فیلدها، شرط‌ها و اعتبارسنجی همان فرم‌های لپ‌تاپ است؛ فقط آرایش تک‌ستونی موبایل شده است.
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MobileField, MobileInput, MobileSelect, MobileNote } from '@/a1/mobile/MobileFormBits';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { CURRENCIES, fmt, currencyLabel } from '@/a1/mobile/demoData';

const activeSafeOptions = (data, currency) => (data.cash || [])
  .filter((row) => row.currency === currency && row.status !== 'غیرفعال')
  .map((row) => ({ value: row.name, label: row.name + ' (' + row.currency + ')' }));

const activeBankOptions = (data, currency) => (data.banks || [])
  .filter((row) => row.currency === currency && row.status !== 'غیرفعال')
  .map((row) => ({ value: row.name, label: row.name + ' (' + row.currency + ')' }));

const currencySelectOptions = CURRENCIES.map((code) => ({ value: code, label: currencyLabel(code) }));

export function ExpenseFields({ draft, setField }) {
  const { data } = useMobileDemo();
  const payerType = draft.payerType === 'bank' ? 'bank' : 'cash';
  const expenseAccounts = (data.accounts || [])
    .filter((row) => row.accountType === 'expense' && row.status !== 'غیرفعال')
    .map((row) => ({ value: row.code + ' — ' + row.name, label: row.code + ' — ' + row.name }));

  const changeCurrency = (currency) => {
    setField('currency', currency);
    if (payerType === 'cash') setField('cash', (activeSafeOptions(data, currency)[0] || {}).value || '');
    else setField('bank', (activeBankOptions(data, currency)[0] || {}).value || '');
  };

  const changePayerType = (value) => {
    setField('payerType', value);
    if (value === 'bank') setField('bank', (activeBankOptions(data, draft.currency || 'AFN')[0] || {}).value || '');
    else setField('cash', (activeSafeOptions(data, draft.currency || 'AFN')[0] || {}).value || '');
  };

  return (
    <div className="a1m-formgrid">
      <MobileField label="تاریخ">
        <MobileInput type="date" value={draft.date} onChange={(value) => setField('date', value)} />
      </MobileField>
      <MobileField label="شرح مصرف">
        <MobileInput value={draft.title} onChange={(value) => setField('title', value)} placeholder="مثلاً کرایه دفتر" />
      </MobileField>
      <MobileField label="حساب مصرف">
        <MobileSelect value={draft.expenseAccount} onChange={(value) => setField('expenseAccount', value)} options={expenseAccounts} placeholder="انتخاب حساب مصرف" />
      </MobileField>
      <MobileField label="ارز">
        <MobileSelect value={draft.currency} onChange={changeCurrency} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="مبلغ">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.amount} onChange={(value) => setField('amount', value)} />
      </MobileField>
      <MobileField label="پرداخت از">
        <MobileSelect
          value={payerType}
          onChange={changePayerType}
          options={[{ value: 'cash', label: 'صندوق' }, { value: 'bank', label: 'حساب بانکی' }]}
        />
      </MobileField>
      {payerType === 'cash' ? (
        <MobileField label="صندوق پرداخت">
          <MobileSelect value={draft.cash} onChange={(value) => setField('cash', value)} options={activeSafeOptions(data, draft.currency || 'AFN')} placeholder="انتخاب صندوق" />
        </MobileField>
      ) : (
        <MobileField label="حساب بانکی پرداخت">
          <MobileSelect value={draft.bank} onChange={(value) => setField('bank', value)} options={activeBankOptions(data, draft.currency || 'AFN')} placeholder="انتخاب حساب بانکی" />
        </MobileField>
      )}
      <MobileField label="یادداشت">
        <MobileInput value={draft.note} onChange={(value) => setField('note', value)} placeholder="توضیح اختیاری" />
      </MobileField>
      <MobileNote tone="info">سند مصرف: حساب مصرف بدهکار و صندوق یا بانک پرداخت‌کننده بستانکار می‌شود؛ هر دو با یک سند دوطرفه ثبت می‌شوند.</MobileNote>
      {!expenseAccounts.length ? (
        <MobileNote tone="error">هیچ حساب مصرف فعالی در کدینگ نیست؛ ابتدا در «کدینگ حساب‌ها» یک حساب از نوع مصرف بسازید.</MobileNote>
      ) : null}
    </div>
  );
}

export function RemittanceFields({ draft, setField }) {
  const { data } = useMobileDemo();
  const instant = draft.settlement === 'instant';
  const settleType = draft.settleType === 'bank' ? 'bank' : 'cash';
  const safes = activeSafeOptions(data, draft.currency || 'AFN');
  const banks = activeBankOptions(data, draft.currency || 'AFN');
  const branchOptions = (data.branches || []).map((row) => ({ value: row.name, label: row.name }));

  const changeCurrency = (currency) => {
    setField('currency', currency);
    if (settleType === 'cash') setField('cash', (activeSafeOptions(data, currency)[0] || {}).value || '');
    else setField('bank', (activeBankOptions(data, currency)[0] || {}).value || '');
  };

  const changeSettlement = (value) => {
    setField('settlement', value);
    if (value === 'instant') {
      if (settleType === 'cash') setField('cash', (safes[0] || {}).value || '');
      else setField('bank', (banks[0] || {}).value || '');
    }
  };

  const changeSettleType = (value) => {
    setField('settleType', value);
    if (value === 'cash') setField('cash', (safes[0] || {}).value || '');
    else setField('bank', (banks[0] || {}).value || '');
  };

  return (
    <div className="a1m-formgrid">
      <MobileField label="تاریخ">
        <MobileInput type="date" value={draft.date} onChange={(value) => setField('date', value)} />
      </MobileField>
      <MobileField label="نوع حواله">
        <MobileSelect
          value={draft.direction}
          onChange={(value) => setField('direction', value)}
          options={[{ value: 'ارسالی', label: 'ارسالی' }, { value: 'دریافتی', label: 'دریافتی' }]}
        />
      </MobileField>
      <MobileField label="فرستنده">
        <MobileInput value={draft.sender} onChange={(value) => setField('sender', value)} />
      </MobileField>
      <MobileField label="گیرنده">
        <MobileInput value={draft.receiver} onChange={(value) => setField('receiver', value)} />
      </MobileField>
      <MobileField label="ارز">
        <MobileSelect value={draft.currency} onChange={changeCurrency} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="مبلغ">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.amount} onChange={(value) => setField('amount', value)} />
      </MobileField>
      <MobileField label="کمیشن" hint="کمیشن به حساب درآمد کمیشن حواله ثبت می‌شود.">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.fee} onChange={(value) => setField('fee', value)} />
      </MobileField>
      <MobileField label="نمایندگی (اختیاری)">
        <MobileSelect value={draft.branch} onChange={(value) => setField('branch', value)} options={branchOptions} placeholder="بدون نمایندگی" />
      </MobileField>
      <MobileField label="روش تسویه">
        <MobileSelect
          value={draft.settlement}
          onChange={changeSettlement}
          options={[{ value: 'suspense', label: 'حساب واسط (حواله در جریان)' }, { value: 'instant', label: 'تسویهٔ فوری' }]}
        />
      </MobileField>
      {instant ? (
        <>
          <MobileField label="حساب تسویه">
            <MobileSelect
              value={settleType}
              onChange={changeSettleType}
              options={[{ value: 'cash', label: 'صندوق' }, { value: 'bank', label: 'بانک' }]}
            />
          </MobileField>
          {settleType === 'cash' ? (
            <MobileField label="صندوق">
              <MobileSelect value={draft.cash} onChange={(value) => setField('cash', value)} options={safes} placeholder="انتخاب صندوق" />
            </MobileField>
          ) : (
            <MobileField label="حساب بانکی">
              <MobileSelect value={draft.bank} onChange={(value) => setField('bank', value)} options={banks} placeholder="انتخاب حساب بانکی" />
            </MobileField>
          )}
        </>
      ) : null}
      <MobileField label="یادداشت">
        <MobileInput value={draft.note} onChange={(value) => setField('note', value)} placeholder="شرح حواله" />
      </MobileField>
      <MobileNote tone="info">
        {instant
          ? 'تسویهٔ فوری: مبلغ حواله هم‌زمان از/به صندوق یا بانک انتخاب‌شده ثبت می‌شود.'
          : 'حساب واسط: مبلغ در حساب «حواله در جریان» می‌ماند تا تسویهٔ نهایی در مرحلهٔ بعد ثبت شود.'}
      </MobileNote>
      <MobileNote>طرف حساب از فهرست مشتریان ثبت‌شده انتخاب یا با همان نام موجود باشد؛ ابطال حواله فقط با ثبت سند معکوس انجام می‌شود.</MobileNote>
    </div>
  );
}

export function ExchangeFields({ draft, setField }) {
  const { data } = useMobileDemo();
  const foreignAmount = Number(draft.foreignAmount) || 0;
  const baseAmount = Number(draft.baseAmount) || 0;
  const rate = foreignAmount > 0 ? baseAmount / foreignAmount : 0;
  const partyRequired = draft.kind === 'خرید' || draft.kind === 'فروش';
  const customerOptions = (data.customers || [])
    .filter((row) => row.status !== 'غیرفعال')
    .map((row) => ({ value: row.name, label: (row.code ? row.code + ' · ' : '') + row.name }));

  return (
    <div className="a1m-formgrid">
      <MobileField label="نوع عملیات">
        <MobileSelect
          value={draft.kind}
          onChange={(value) => setField('kind', value)}
          options={[{ value: 'خرید', label: 'خرید' }, { value: 'فروش', label: 'فروش' }, { value: 'تبدیل', label: 'تبدیل' }]}
        />
      </MobileField>
      <MobileField label="تاریخ">
        <MobileInput type="date" value={draft.date} onChange={(value) => setField('date', value)} />
      </MobileField>
      <MobileField label={partyRequired ? 'طرف حساب' : 'طرف حساب (اختیاری)'}>
        <MobileSelect value={draft.party} onChange={(value) => setField('party', value)} options={customerOptions} placeholder="انتخاب مشتری" />
      </MobileField>
      <MobileField label="ارز خارجی">
        <MobileSelect value={draft.foreignCurrency} onChange={(value) => setField('foreignCurrency', value)} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="مبلغ ارز خارجی">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.foreignAmount} onChange={(value) => setField('foreignAmount', value)} />
      </MobileField>
      <MobileField label="ارز پایه">
        <MobileSelect value={draft.baseCurrency} onChange={(value) => setField('baseCurrency', value)} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="مبلغ ارز پایه">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.baseAmount} onChange={(value) => setField('baseAmount', value)} />
      </MobileField>
      <MobileField label="صندوق ارز خارجی">
        <MobileSelect value={draft.foreignCash} onChange={(value) => setField('foreignCash', value)} options={activeSafeOptions(data, draft.foreignCurrency)} placeholder="انتخاب صندوق" />
      </MobileField>
      <MobileField label="صندوق ارز پایه">
        <MobileSelect value={draft.baseCash} onChange={(value) => setField('baseCash', value)} options={activeSafeOptions(data, draft.baseCurrency)} placeholder="انتخاب صندوق" />
      </MobileField>
      <MobileField label="کمیشن">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.fee} onChange={(value) => setField('fee', value)} />
      </MobileField>
      <MobileField label="یادداشت">
        <MobileInput value={draft.note} onChange={(value) => setField('note', value)} />
      </MobileField>
      <MobileNote tone="info">
        نرخ محاسبه‌شده (فقط نمایشی): {fmt(rate)} {currencyLabel(draft.baseCurrency)} برای هر واحد {currencyLabel(draft.foreignCurrency)} — نرخ فیلد قابل ثبت نیست و از تقسیم مبلغ ارز پایه بر مبلغ ارز خارجی به‌دست می‌آید.
      </MobileNote>
    </div>
  );
}

const emptyRow = () => ({ account: '', debit: '', credit: '' });

export function JournalFields({ draft, setField }) {
  const { data } = useMobileDemo();
  const rows = Array.isArray(draft.rows) && draft.rows.length ? draft.rows : [emptyRow(), emptyRow()];
  const mode = draft.journalMode === 'multi' ? 'multi' : 'simple';
  const accountOptions = [
    ...(data.accounts || []).map((row) => ({ value: row.code + ' — ' + row.name, label: row.code + ' — ' + row.name })),
    ...(data.cash || []).filter((row) => row.currency === draft.currency).map((row) => ({ value: 'صندوق: ' + row.name, label: 'صندوق: ' + row.name })),
    ...(data.banks || []).filter((row) => row.currency === draft.currency && row.status !== 'غیرفعال').map((row) => ({ value: 'بانک: ' + row.name, label: 'بانک: ' + row.name })),
  ];

  const setRows = (next) => setField('rows', next);
  const updateRow = (index, key, value) => setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  const visibleRows = mode === 'simple' ? rows.slice(0, 2) : rows;
  const debit = visibleRows.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
  const credit = visibleRows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
  const balanced = (debit > 0 || credit > 0) && Math.abs(debit - credit) < 0.005;

  return (
    <div className="a1m-formgrid">
      <MobileField label="تاریخ">
        <MobileInput type="date" value={draft.date} onChange={(value) => setField('date', value)} />
      </MobileField>
      <MobileField label="ارز سند" hint="همهٔ سطرهای این سند در همین ارز ثبت می‌شوند.">
        <MobileSelect value={draft.currency} onChange={(value) => setField('currency', value)} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="شرح سند">
        <MobileInput value={draft.description} onChange={(value) => setField('description', value)} />
      </MobileField>
      <MobileField label="حالت سند">
        <MobileSelect
          value={mode}
          onChange={(value) => {
            setField('journalMode', value);
            if (value === 'simple') setRows(rows.slice(0, 2));
          }}
          options={[{ value: 'simple', label: 'سند سادهٔ دو سطری' }, { value: 'multi', label: 'سند چندسطری' }]}
        />
      </MobileField>

      {visibleRows.map((row, index) => (
        <div key={index} className="a1m-group" style={{ marginBottom: 0 }}>
          <div className="a1m-group__title">
            <span className="a1m-group__dot" />
            سطر {fmt(index + 1)}
            {mode === 'multi' && rows.length > 2 ? (
              <button
                type="button"
                onClick={() => setRows(rows.filter((item, itemIndex) => itemIndex !== index))}
                aria-label="حذف سطر"
                className="mr-auto flex h-7 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 text-[9px] font-bold text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />حذف
              </button>
            ) : null}
          </div>
          <div className="a1m-formgrid" style={{ gap: 8 }}>
            <MobileSelect value={row.account} onChange={(value) => updateRow(index, 'account', value)} options={accountOptions} placeholder="انتخاب حساب" />
            <div className="a1m-toolbar__row">
              <MobileField label="بدهکار">
                <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={row.debit} onChange={(value) => updateRow(index, 'debit', value)} />
              </MobileField>
              <MobileField label="بستانکار">
                <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={row.credit} onChange={(value) => updateRow(index, 'credit', value)} />
              </MobileField>
            </div>
          </div>
        </div>
      ))}

      {mode === 'multi' ? (
        <button
          type="button"
          onClick={() => setRows([...rows, emptyRow()])}
          className="a1m-btn"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Plus className="h-4 w-4" />افزودن سطر
        </button>
      ) : null}

      <MobileNote tone={balanced ? 'info' : 'warning'}>
        جمع بدهکار: {fmt(debit)} · جمع بستانکار: {fmt(credit)} — {balanced ? 'سند تراز است.' : 'تا زمانی که جمع بدهکار و بستانکار برابر نشود، سند ثبت نمی‌شود.'}
      </MobileNote>
      <MobileNote>هر سطر فقط یک طرف (بدهکار یا بستانکار) دارد؛ سند ساده دقیقاً دو سطر دارد.</MobileNote>
    </div>
  );
}

export function CashFlowFields({ draft, setField }) {
  const { data } = useMobileDemo();
  const customerOptions = (data.customers || [])
    .filter((row) => row.status !== 'غیرفعال')
    .map((row) => ({ value: row.name, label: (row.code ? row.code + ' · ' : '') + row.name }));
  const branchOptions = (data.branches || [])
    .filter((row) => row.status !== 'غیرفعال')
    .map((row) => ({ value: row.name, label: (row.code ? row.code + ' · ' : '') + row.name }));

  const changeCurrency = (currency) => {
    const first = (data.cash || []).find((row) => row.currency === currency && row.status !== 'غیرفعال');
    setField('currency', currency);
    setField('cash', first?.name || '');
  };

  return (
    <div className="a1m-formgrid">
      <MobileField label="تاریخ">
        <MobileInput type="date" value={draft.date} onChange={(value) => setField('date', value)} />
      </MobileField>
      <MobileField label="نوع عملیات">
        <MobileSelect value={draft.kind} onChange={(value) => setField('kind', value)} options={['دخل', 'خرج']} />
      </MobileField>
      <MobileField label="نوع طرف حساب">
        <MobileSelect
          value={draft.partyType}
          onChange={(value) => { setField('partyType', value); setField('party', ''); }}
          options={[{ value: 'customer', label: 'مشتری' }, { value: 'branch', label: 'نمایندگی' }, { value: 'other', label: 'سایر' }]}
        />
      </MobileField>
      <MobileField label="طرف حساب">
        {draft.partyType === 'customer' ? (
          <MobileSelect value={draft.party} onChange={(value) => setField('party', value)} options={customerOptions} placeholder="انتخاب مشتری" />
        ) : draft.partyType === 'branch' ? (
          <MobileSelect value={draft.party} onChange={(value) => setField('party', value)} options={branchOptions} placeholder="انتخاب نمایندگی" />
        ) : (
          <MobileInput value={draft.party} onChange={(value) => setField('party', value)} placeholder="شرح طرف حساب" />
        )}
      </MobileField>
      <MobileField label="ارز">
        <MobileSelect value={draft.currency} onChange={changeCurrency} options={currencySelectOptions} />
      </MobileField>
      <MobileField label="مبلغ">
        <MobileInput type="number" min="0" step="0.01" inputMode="decimal" value={draft.amount} onChange={(value) => setField('amount', value)} />
      </MobileField>
      <MobileField label="صندوق">
        <MobileSelect value={draft.cash} onChange={(value) => setField('cash', value)} options={activeSafeOptions(data, draft.currency || 'AFN')} placeholder="انتخاب صندوق" />
      </MobileField>
      <MobileField label="شرح">
        <MobileInput value={draft.description} onChange={(value) => setField('description', value)} />
      </MobileField>
      <MobileNote tone="info">ثبت نمایشی: گردش به فهرست همین حافظه اضافه می‌شود و با بارگذاری مجدد پاک می‌شود.</MobileNote>
    </div>
  );
}