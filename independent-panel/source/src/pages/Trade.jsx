import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Info } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CounterSelect from '@/components/forms/CounterSelect';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { useCounters, findCounter } from '@/hooks/useCounters';
import { useRecords, useCurrencies } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { buildTrade, validateBalanced } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { dec, faDate, isoToday } from '@/lib/format';
import { BASE_CURRENCY, CURRENCY_LABELS } from '@/lib/config';
import { cn } from '@/lib/utils';

export default function Trade() {
  const { role, roleLabel } = useRole();
  const { counters } = useCounters();
  const { items: customers } = useRecords('Customer', { status: 'active' });
  const { items: documents, reload: reloadDocs } = useRecords('Document');
  const currencies = useCurrencies();

  const [mode, setMode] = useState('buy');
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [counterKey, setCounterKey] = useState('');
  const [fee, setFee] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const customer = customers.find((item) => item.id === customerId);
  const counter = findCounter(counters, counterKey);
  const settleAmount = Number(amount) * Number(rate);

  const preview = useMemo(() => {
    if (!customer || !counter || !amount || !rate) return null;
    try {
      const built = buildTrade({
        mode,
        customer,
        currency,
        amount: Number(amount),
        rate: Number(rate),
        counter,
        fee: Number(fee) || 0,
        date: isoToday(),
        description,
      });
      return { ...built, check: validateBalanced(built.lines) };
    } catch (error) {
      return null;
    }
  }, [mode, customer, counter, amount, rate, currency, fee, description]);

  const recent = useMemo(
    () =>
      documents
        .filter((doc) => ['trade_buy', 'trade_sell'].includes(doc.doc_type))
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))
        .slice(0, 6),
    [documents]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (!customer) return setMessage({ tone: 'rose', text: 'مشتری را انتخاب کنید.' });
    if (!counter) return setMessage({ tone: 'rose', text: 'صندوق یا حساب بانکی طرف معامله را انتخاب کنید.' });
    if (!Number(amount) || !Number(rate)) return setMessage({ tone: 'rose', text: 'مبلغ و نرخ توافقی الزامی است.' });
    if (currency === BASE_CURRENCY) return setMessage({ tone: 'rose', text: 'ارز معامله باید غیر از ارز پایه باشد.' });

    setSubmitting(true);
    try {
      const built = buildTrade({
        mode,
        customer,
        currency,
        amount: Number(amount),
        rate: Number(rate),
        counter,
        fee: Number(fee) || 0,
        date: isoToday(),
        description: description || `${mode === 'buy' ? 'خرید' : 'فروش'} ${currency}`,
      });
      const created = await postDocument({ ...built, actor: { name: roleLabel, role } });
      setMessage({ tone: 'emerald', text: `سند ${created.doc_number} با موفقیت ثبت شد.` });
      setAmount('');
      setRate('');
      setFee('');
      setDescription('');
      reloadDocs();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت معامله انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="خرید و فروش ارز"
        description="هر معامله یک سند مالی با دو طرف بدهکار و بستانکار ایجاد می‌کند. نرخ توافقی را خودتان وارد می‌کنید؛ هیچ نرخ خودکاری در این نسخه وجود ندارد."
        icon={ArrowLeftRight}
        badge="ثبت دوطرفه"
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard title="فرم معامله" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('buy')}
                className={cn(
                  'rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors',
                  mode === 'buy'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                خرید ارز از مشتری
              </button>
              <button
                type="button"
                onClick={() => setMode('sell')}
                className={cn(
                  'rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors',
                  mode === 'sell'
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                فروش ارز به مشتری
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <FormField label="مشتری" className="col-span-2">
                <SelectInput
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="انتخاب مشتری"
                  options={customers.map((item) => ({ value: item.id, label: `${item.full_name}${item.code ? ` — ${item.code}` : ''}` }))}
                />
              </FormField>
              <FormField label="ارز معامله">
                <SelectInput
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  options={currencies.map((item) => ({ value: item.code, label: `${item.code} — ${item.name}` }))}
                />
              </FormField>
              <CounterSelect counters={counters} value={counterKey} onChange={setCounterKey} />
              <FormField label="مبلغ ارز">
                <TextInput type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </FormField>
              <FormField label={`نرخ توافقی (${BASE_CURRENCY} برای هر واحد)`}>
                <TextInput type="number" step="0.0001" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
              </FormField>
              <FormField label={`مبلغ تسویه (${BASE_CURRENCY})`} hint="محاسبهٔ خودکار از مبلغ × نرخ">
                <TextInput value={settleAmount ? dec(settleAmount) : ''} readOnly className="bg-muted" />
              </FormField>
              <FormField label={`کارمزد (${BASE_CURRENCY})`}>
                <TextInput type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
              </FormField>
              <FormField label="شرح" className="col-span-2">
                <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" />
              </FormField>
            </div>

            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setMessage(null)} submitting={submitting} submitLabel="ثبت معامله" />
          </form>
        </SectionCard>

        <div className="space-y-3">
          <SectionCard title="پیش‌نمایش اثر حسابداری" description="پیش از ثبت، ردیف‌های دفتر را ببینید">
            {preview ? (
              <div className="flex flex-col gap-2">
                {preview.lines.map((line, index) => (
                  <div key={index} className="rounded-lg border border-border/70 p-2">
                    <p className="flex items-center justify-between text-[11px] font-bold">
                      <span className="truncate">{line.account_name}</span>
                      <span className={line.side === 'debit' ? 'text-emerald-700' : 'text-rose-700'}>
                        {line.side === 'debit' ? 'بدهکار' : 'بستانکار'}
                      </span>
                    </p>
                    <p className="num mt-0.5 text-[10.5px] text-muted-foreground">
                      {dec(line.amount)} {line.currency}
                    </p>
                  </div>
                ))}
                <Notice tone={preview.check.balanced ? 'emerald' : 'rose'}>
                  {preview.check.balanced
                    ? `سند متوازن است (${dec(preview.check.debit)} = ${dec(preview.check.credit)} ${BASE_CURRENCY})`
                    : `سند متوازن نیست؛ اختلاف ${dec(preview.check.diff)}`}
                </Notice>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  با انتخاب مشتری، صندوق، مبلغ و نرخ، ردیف‌های بدهکار و بستانکار همین‌جا نمایش داده می‌شود.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="قاعدهٔ ثبت" bodyClassName="text-[11px] leading-6 text-muted-foreground space-y-1.5">
            <p>خرید: ارز وارد صندوق می‌شود و حساب مشتری بستانکار می‌گردد.</p>
            <p>فروش: ارز از صندوق خارج می‌شود و حساب مشتری بدهکار می‌گردد.</p>
            <p>کارمزد به‌صورت جداگانه در برابر «درآمد کارمزد» ثبت می‌شود.</p>
            {(CURRENCY_LABELS[currency] && currency !== BASE_CURRENCY) ? (
              <p className="pt-1 text-[10.5px]">ارز پایهٔ این نسخه: {BASE_CURRENCY} — {CURRENCY_LABELS[BASE_CURRENCY]}</p>
            ) : null}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="آخرین معاملات">
        <DataTable
          rows={recent}
          empty={{ title: 'معامله‌ای ثبت نشده است' }}
          columns={[
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            {
              key: 'doc_type',
              label: 'نوع',
              render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label} tone={DOC_TYPES[row.doc_type]?.tone} />,
            },
            { key: 'customer_name', label: 'مشتری' },
            {
              key: 'amount',
              label: 'مبلغ',
              render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span>,
            },
            { key: 'rate', label: 'نرخ', hideOnMobile: true, render: (row) => <span className="num">{dec(row.rate)}</span> },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
            {
              key: 'status',
              label: 'وضعیت',
              render: (row) => (
                <StatusBadge label={row.status === 'posted' ? 'ثبت‌شده' : 'ابطال‌شده'} tone={row.status === 'posted' ? 'emerald' : 'rose'} />
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}