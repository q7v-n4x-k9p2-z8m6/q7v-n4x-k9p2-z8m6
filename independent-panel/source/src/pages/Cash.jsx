import React, { useMemo, useState } from 'react';
import { Banknote, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatCard from '@/components/ui-kit/StatCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CounterSelect from '@/components/forms/CounterSelect';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { useCounters, findCounter } from '@/hooks/useCounters';
import { useRecords, useLedger, useCurrencies } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { buildCashMovement, buildReceivePay } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { nativeBalances } from '@/lib/accounting/queries';
import { dec, faDate, isoToday } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';
import { cn } from '@/lib/utils';

const MODES = [
  { key: 'in', label: 'دخل صندوق' },
  { key: 'out', label: 'خرج صندوق' },
  { key: 'expense', label: 'هزینه' },
  { key: 'receive', label: 'دریافت از مشتری' },
  { key: 'pay', label: 'پرداخت به مشتری' },
];

export default function Cash() {
  const { role, roleLabel } = useRole();
  const { counters } = useCounters();
  const { items: customers } = useRecords('Customer', { status: 'active' });
  const { entries, reload: reloadLedger } = useLedger();
  const { items: documents, reload: reloadDocs } = useRecords('Document');
  const currencies = useCurrencies();

  const [mode, setMode] = useState('in');
  const [counterKey, setCounterKey] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState(BASE_CURRENCY);
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('1');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const counter = findCounter(counters, counterKey);
  const needsCustomer = mode === 'receive' || mode === 'pay';

  const safeBalances = useMemo(() => {
    return nativeBalances(entries.filter((entry) => entry.account_type === 'safe'));
  }, [entries]);

  const recent = useMemo(
    () =>
      documents
        .filter((doc) => ['cash_in', 'cash_out', 'expense', 'receive', 'pay'].includes(doc.doc_type))
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))
        .slice(0, 8),
    [documents]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (!counter) return setMessage({ tone: 'rose', text: 'صندوق یا حساب را انتخاب کنید.' });
    if (!Number(amount)) return setMessage({ tone: 'rose', text: 'مبلغ الزامی است.' });
    const customer = customers.find((item) => item.id === customerId);
    if (needsCustomer && !customer) return setMessage({ tone: 'rose', text: 'مشتری را انتخاب کنید.' });

    setSubmitting(true);
    try {
      const payload = needsCustomer
        ? buildReceivePay({
            type: mode,
            customer,
            counter,
            currency,
            amount: Number(amount),
            rate: Number(rate) || 1,
            date: isoToday(),
            description: description || (mode === 'receive' ? 'دریافت از مشتری' : 'پرداخت به مشتری'),
          })
        : buildCashMovement({
            direction: mode === 'out' || mode === 'expense' ? 'out' : 'in',
            counter,
            currency,
            amount: Number(amount),
            rate: Number(rate) || 1,
            date: isoToday(),
            description: description || MODES.find((item) => item.key === mode)?.label,
            expense: mode === 'expense',
          });

      const created = await postDocument({ ...payload, actor: { name: roleLabel, role } });
      setMessage({ tone: 'emerald', text: `سند ${created.doc_number} ثبت شد.` });
      setAmount('');
      setDescription('');
      reloadDocs();
      reloadLedger();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="صندوق و دریافت/پرداخت"
        description="دخل و خرج صندوق، ثبت هزینه و تسویه با مشتری. هر عملیات یک سند دوطرفه در دفتر ایجاد می‌کند."
        icon={Banknote}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {safeBalances.slice(0, 4).map((safe) => {
          const balanceText = Object.entries(safe.balances)
            .map(([currencyCode, value]) => `${dec(value)} ${currencyCode}`)
            .join(' | ');
          return (
            <StatCard key={safe.key} label={safe.account_name} value={balanceText} icon={Wallet} tone="emerald" />
          );
        })}
        {!safeBalances.length ? (
          <StatCard label="موجودی صندوق‌ها" value="—" hint="هنوز گردشی ثبت نشده" icon={Wallet} tone="slate" />
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard title="ثبت عملیات" className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-1">
            {MODES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors',
                  mode === item.key
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <CounterSelect counters={counters} value={counterKey} onChange={setCounterKey} className="col-span-2" />
              {needsCustomer ? (
                <FormField label="مشتری" className="col-span-2">
                  <SelectInput
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    placeholder="انتخاب مشتری"
                    options={customers.map((item) => ({ value: item.id, label: item.full_name }))}
                  />
                </FormField>
              ) : null}
              <FormField label="ارز">
                <SelectInput
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  options={currencies.map((item) => ({ value: item.code, label: `${item.code} — ${item.name}` }))}
                />
              </FormField>
              <FormField label="مبلغ">
                <TextInput type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </FormField>
              {currency !== BASE_CURRENCY ? (
                <FormField label={`نرخ تبدیل به ${BASE_CURRENCY}`}>
                  <TextInput type="number" step="0.0001" min="0" value={rate} onChange={(event) => setRate(event.target.value)} />
                </FormField>
              ) : null}
              <FormField label="شرح" className={currency !== BASE_CURRENCY ? '' : 'col-span-2'}>
                <TextInput value={description} onChange={(event) => setDescription(event.target.value)} placeholder="اختیاری" />
              </FormField>
            </div>

            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setMessage(null)} submitting={submitting} submitLabel="ثبت سند" />
          </form>
        </SectionCard>

        <SectionCard title="راهنمای عملیات" bodyClassName="space-y-1.5 text-[11px] leading-6 text-muted-foreground">
          <p>دخل: صندوق بدهکار و حساب تعدیل بستانکار می‌شود.</p>
          <p>خرج: صندوق بستانکار و حساب تعدیل بدهکار می‌شود.</p>
          <p>هزینه: صندوق بستانکار و حساب هزینه بدهکار می‌شود.</p>
          <p>دریافت از مشتری: صندوق بدهکار و حساب مشتری بستانکار می‌شود.</p>
          <p>پرداخت به مشتری: صندوق بستانکار و حساب مشتری بدهکار می‌شود.</p>
        </SectionCard>
      </div>

      <SectionCard title="آخرین عملیات صندوق">
        <DataTable
          rows={recent}
          empty={{ title: 'عملیاتی ثبت نشده است' }}
          columns={[
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            {
              key: 'doc_type',
              label: 'نوع',
              render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label} tone={DOC_TYPES[row.doc_type]?.tone} />,
            },
            { key: 'counter_name', label: 'صندوق/بانک', render: (row) => row.counter_name || '—' },
            { key: 'customer_name', label: 'مشتری', hideOnMobile: true, render: (row) => row.customer_name || '—' },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
          ]}
        />
      </SectionCard>
    </div>
  );
}