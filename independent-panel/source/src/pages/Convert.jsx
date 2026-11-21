import React, { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CounterSelect from '@/components/forms/CounterSelect';
import { FormField, TextInput, FormActions, Notice } from '@/components/forms/FormField';
import { useCounters, findCounter } from '@/hooks/useCounters';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { buildConversion, validateBalanced } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { balanceFor } from '@/lib/accounting/queries';
import { dec, faDate, isoToday } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';

export default function Convert() {
  const { role, roleLabel } = useRole();
  const { counters } = useCounters();
  const { entries, reload: reloadLedger } = useLedger();
  const { items: documents, reload: reloadDocs } = useRecords('Document');

  const [fromKey, setFromKey] = useState('');
  const [toKey, setToKey] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const from = findCounter(counters, fromKey);
  const to = findCounter(counters, toKey);
  const toAmount = Number(amount) * Number(rate);

  const preview = useMemo(() => {
    if (!from || !to || !amount || !rate) return null;
    const built = buildConversion({
      fromCounter: from,
      toCounter: to,
      fromCurrency: from.currency,
      fromAmount: Number(amount),
      toCurrency: to.currency,
      toAmount: Number(amount) * Number(rate),
      rate: Number(rate),
      date: isoToday(),
      description,
    });
    return { ...built, check: validateBalanced(built.lines) };
  }, [from, to, amount, rate, description]);

  const recent = useMemo(
    () =>
      documents
        .filter((doc) => doc.doc_type === 'conversion')
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))
        .slice(0, 8),
    [documents]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (!from || !to) return setMessage({ tone: 'rose', text: 'صندوق/حساب مبدأ و مقصد را انتخاب کنید.' });
    if (from.key === to.key) return setMessage({ tone: 'rose', text: 'مبدأ و مقصد باید متفاوت باشند.' });
    if (!Number(amount) || !Number(rate)) return setMessage({ tone: 'rose', text: 'مبلغ و نرخ تبدیل الزامی است.' });

    setSubmitting(true);
    try {
      const built = buildConversion({
        fromCounter: from,
        toCounter: to,
        fromCurrency: from.currency,
        fromAmount: Number(amount),
        toCurrency: to.currency,
        toAmount: Number(amount) * Number(rate),
        rate: Number(rate),
        date: isoToday(),
        description: description || `تبدیل ${from.currency} به ${to.currency}`,
      });
      const created = await postDocument({ ...built, actor: { name: roleLabel, role } });
      setMessage({ tone: 'emerald', text: `سند تبدیل ${created.doc_number} ثبت شد.` });
      setAmount('');
      setRate('');
      reloadDocs();
      reloadLedger();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت تبدیل انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="تبدیل ارز"
        description="جابه‌جایی ارزش بین دو صندوق یا حساب با ارزهای متفاوت. نرخ را دستی وارد می‌کنید و سند بدون سود/زیان خودکار ثبت می‌شود."
        icon={ArrowLeftRight}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard title="فرم تبدیل" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <CounterSelect counters={counters} value={fromKey} onChange={setFromKey} label="از صندوق/حساب" />
              <CounterSelect counters={counters} value={toKey} onChange={setToKey} label="به صندوق/حساب" />
              <FormField label="مبلغ مبدأ" hint={from ? `ارز: ${from.currency}` : ''}>
                <TextInput type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </FormField>
              <FormField label="نرخ تبدیل" hint={from && to ? `1 ${from.currency} = ? ${to.currency}` : ''}>
                <TextInput type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} />
              </FormField>
              <FormField label="مبلغ مقصد" className="col-span-2">
                <TextInput value={toAmount ? dec(toAmount) : ''} readOnly className="bg-muted" />
              </FormField>
              <FormField label="شرح" className="col-span-2">
                <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormField>
            </div>

            {from ? (
              <Notice tone="slate">
                موجودی فعلی مبدأ: {dec(balanceFor(entries, from.type, from.id, from.currency))} {from.currency}
              </Notice>
            ) : null}
            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setMessage(null)} submitting={submitting} submitLabel="ثبت سند تبدیل" />
          </form>
        </SectionCard>

        <SectionCard title="پیش‌نمایش سند" description={`ارز پایه: ${BASE_CURRENCY}`}>
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
                  <p className="num text-[10.5px] text-muted-foreground">{dec(line.amount)} {line.currency}</p>
                </div>
              ))}
              <Notice tone={preview.check.balanced ? 'emerald' : 'rose'}>
                {preview.check.balanced ? 'سند متوازن است' : `اختلاف ${dec(preview.check.diff)}`}
              </Notice>
            </div>
          ) : (
            <p className="text-[11px] leading-6 text-muted-foreground">
              با انتخاب مبدأ، مقصد، مبلغ و نرخ، ردیف‌های سند نمایش داده می‌شود.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="آخرین تبدیل‌ها">
        <DataTable
          rows={recent}
          empty={{ title: 'تبدیلی ثبت نشده است' }}
          columns={[
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            { key: 'counter_name', label: 'مبدأ', render: (row) => row.counter_name || '—' },
            { key: 'pair_currency', label: 'به ارز', render: (row) => row.pair_currency || '—' },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
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