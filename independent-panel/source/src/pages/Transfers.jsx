import React, { useMemo, useState } from 'react';
import { Send, Download, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CounterSelect from '@/components/forms/CounterSelect';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { useCounters, findCounter } from '@/hooks/useCounters';
import { useRecords, useCurrencies } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { buildTransferPosting } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { TRANSFER_STATUS } from '@/lib/accounting/chart';
import { dec, faDate, isoToday } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';
import { cn } from '@/lib/utils';

const STATUS_FLOW = { pending: 'processing', processing: 'done' };

export default function Transfers() {
  const { role, roleLabel, can } = useRole();
  const { counters } = useCounters();
  const { items: customers } = useRecords('Customer', { status: 'active' });
  const { items: origins } = useRecords('Origin');
  const { items: transfers, reload } = useRecords('Transfer');
  const currencies = useCurrencies();

  const [direction, setDirection] = useState('send');
  const [showForm, setShowForm] = useState(false);
  const [filterDirection, setFilterDirection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    sender_name: '',
    sender_phone: '',
    sender_country: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_country: '',
    account_owner: '',
    currency: 'USD',
    amount: '',
    rate: '',
    fee: '',
    destination: '',
    customer_id: '',
    agent_id: '',
    description: '',
    counterKey: '',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const rows = useMemo(
    () =>
      transfers
        .filter((item) => (filterDirection ? item.direction === filterDirection : true))
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date))),
    [transfers, filterDirection]
  );

  const summary = useMemo(() => {
    const open = transfers.filter((item) => ['pending', 'processing'].includes(item.status)).length;
    const out = transfers.filter((item) => item.direction === 'send').length;
    return { open, out, in: transfers.length - out };
  }, [transfers]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    const counter = findCounter(counters, form.counterKey);
    if (!form.sender_name.trim() || !form.receiver_name.trim()) {
      return setMessage({ tone: 'rose', text: 'نام فرستنده و گیرنده الزامی است.' });
    }
    if (!counter) return setMessage({ tone: 'rose', text: 'صندوق/حساب مبدأ را انتخاب کنید.' });
    if (!Number(form.amount) || !Number(form.rate)) {
      return setMessage({ tone: 'rose', text: 'مبلغ و نرخ الزامی است.' });
    }

    setSubmitting(true);
    try {
      const customer = customers.find((item) => item.id === form.customer_id) || null;
      const agent = origins.find((item) => item.id === form.agent_id) || null;
      const transferNumber = `TX-${Date.now().toString().slice(-8)}`;
      const built = buildTransferPosting({
        direction,
        customer,
        counter,
        currency: form.currency,
        amount: Number(form.amount),
        rate: Number(form.rate),
        fee: Number(form.fee) || 0,
        date: isoToday(),
        description: form.description || `حواله ${direction === 'send' ? 'ارسالی' : 'دریافتی'} ${form.receiver_name}`,
      });
      const doc = await postDocument({ ...built, actor: { name: roleLabel, role } });

      await base44.entities.Transfer.create({
        transfer_number: transferNumber,
        direction,
        sender_name: form.sender_name.trim(),
        sender_phone: form.sender_phone.trim(),
        sender_country: form.sender_country.trim(),
        receiver_name: form.receiver_name.trim(),
        receiver_phone: form.receiver_phone.trim(),
        receiver_country: form.receiver_country.trim(),
        account_owner: form.account_owner.trim(),
        currency: form.currency,
        amount: Number(form.amount),
        rate: Number(form.rate),
        total: built.doc.base_value,
        fee: Number(form.fee) || 0,
        fee_currency: BASE_CURRENCY,
        destination: form.destination.trim(),
        customer_id: customer?.id || '',
        customer_name: customer?.full_name || '',
        agent_id: agent?.id || '',
        origin: agent?.name || '',
        status: 'pending',
        description: form.description.trim(),
        document_id: doc.id,
      });

      setMessage({ tone: 'emerald', text: `حواله ${transferNumber} و سند ${doc.doc_number} ثبت شد.` });
      setForm((prev) => ({ ...prev, sender_name: '', receiver_name: '', amount: '', rate: '', fee: '', description: '' }));
      reload();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت حواله انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceStatus(row) {
    const next = STATUS_FLOW[row.status] || 'done';
    await base44.entities.Transfer.update(row.id, { status: next, executed_date: next === 'done' ? isoToday() : row.executed_date });
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="حواله‌ها"
        description="ثبت حوالهٔ ارسالی و دریافتی همراه با سند مالی. تغییر وضعیت پیگیری، سند حسابداری را تغییر نمی‌دهد؛ ابطال مالی از دفتر روزنامه با سند معکوس انجام می‌شود."
        icon={Send}
        actions={
          can('transfers.post') ? (
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> {showForm ? 'بستن فرم' : 'حواله جدید'}
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">ارسالی</p>
          <p className="num font-heading text-base font-extrabold">{dec(summary.out)}</p>
        </div>
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">دریافتی</p>
          <p className="num font-heading text-base font-extrabold">{dec(summary.in)}</p>
        </div>
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">در جریان</p>
          <p className="num font-heading text-base font-extrabold text-amber-700">{dec(summary.open)}</p>
        </div>
      </div>

      {showForm ? (
        <SectionCard title="ثبت حواله">
          <div className="mb-3 flex gap-1">
            {[
              { key: 'send', label: 'حواله ارسالی', icon: Send },
              { key: 'receive', label: 'حواله دریافتی', icon: Download },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setDirection(item.key)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold',
                    direction === item.key
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <FormField label="نام فرستنده">
                <TextInput value={form.sender_name} onChange={set('sender_name')} />
              </FormField>
              <FormField label="موبایل فرستنده">
                <TextInput value={form.sender_phone} onChange={set('sender_phone')} />
              </FormField>
              <FormField label="کشور فرستنده">
                <TextInput value={form.sender_country} onChange={set('sender_country')} />
              </FormField>
              <FormField label="نام گیرنده">
                <TextInput value={form.receiver_name} onChange={set('receiver_name')} />
              </FormField>
              <FormField label="موبایل گیرنده">
                <TextInput value={form.receiver_phone} onChange={set('receiver_phone')} />
              </FormField>
              <FormField label="کشور گیرنده">
                <TextInput value={form.receiver_country} onChange={set('receiver_country')} />
              </FormField>
              <FormField label="صاحب حساب">
                <TextInput value={form.account_owner} onChange={set('account_owner')} />
              </FormField>
              <FormField label="مقصد / مسیر">
                <TextInput value={form.destination} onChange={set('destination')} />
              </FormField>
              <FormField label="مشتری (اختیاری)">
                <SelectInput
                  value={form.customer_id}
                  onChange={set('customer_id')}
                  placeholder="بدون مشتری"
                  options={customers.map((item) => ({ value: item.id, label: item.full_name }))}
                />
              </FormField>
              <FormField label="ارز">
                <SelectInput
                  value={form.currency}
                  onChange={set('currency')}
                  options={currencies.map((item) => ({ value: item.code, label: item.code }))}
                />
              </FormField>
              <FormField label="مبلغ">
                <TextInput type="number" step="0.01" value={form.amount} onChange={set('amount')} />
              </FormField>
              <FormField label={`نرخ (${BASE_CURRENCY})`}>
                <TextInput type="number" step="0.0001" value={form.rate} onChange={set('rate')} />
              </FormField>
              <FormField label={`کارمزد (${BASE_CURRENCY})`}>
                <TextInput type="number" step="0.01" value={form.fee} onChange={set('fee')} />
              </FormField>
              <FormField label="نمایندگی">
                <SelectInput
                  value={form.agent_id}
                  onChange={set('agent_id')}
                  placeholder="بدون نمایندگی"
                  options={origins.map((item) => ({ value: item.id, label: item.name }))}
                />
              </FormField>
              <CounterSelect counters={counters} value={form.counterKey} onChange={(value) => setForm((prev) => ({ ...prev, counterKey: value }))} label="صندوق/حساب مبدأ" />
              <FormField label="شرح" className="col-span-2 sm:col-span-3">
                <TextInput value={form.description} onChange={set('description')} />
              </FormField>
            </div>

            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setShowForm(false)} submitting={submitting} submitLabel="ثبت حواله و سند" />
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`دفتر حواله‌ها (${rows.length})`}
        actions={
          <select
            value={filterDirection}
            onChange={(event) => setFilterDirection(event.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-[11px]"
          >
            <option value="">همه</option>
            <option value="out">ارسالی</option>
            <option value="in">دریافتی</option>
          </select>
        }
      >
        <DataTable
          rows={rows}
          empty={{ title: 'حواله‌ای ثبت نشده است', description: 'با دکمهٔ «حواله جدید» شروع کنید.' }}
          columns={[
            {
              key: 'transfer_number',
              label: 'شماره حواله',
              render: (row) => (
                <div>
                  <p className="num font-bold">{row.transfer_number}</p>
                  <p className="text-[10px] text-muted-foreground">{row.direction === 'send' ? 'ارسالی' : 'دریافتی'}</p>
                </div>
              ),
            },
            {
              key: 'parties',
              label: 'فرستنده / گیرنده',
              render: (row) => (
                <div className="text-[11.5px]">
                  <p className="truncate">{row.sender_name}</p>
                  <p className="truncate text-muted-foreground">→ {row.receiver_name}</p>
                </div>
              ),
            },
            { key: 'destination', label: 'مقصد', hideOnMobile: true, render: (row) => row.destination || row.receiver_country || '—' },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.created_date) },
            {
              key: 'status',
              label: 'وضعیت',
              render: (row) => (
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge label={TRANSFER_STATUS[row.status]?.label || row.status} tone={TRANSFER_STATUS[row.status]?.tone} />
                  {can('transfers.post') && row.status !== 'done' && row.status !== 'cancelled' ? (
                    <button
                      type="button"
                      onClick={() => advanceStatus(row)}
                      className="text-[9.5px] font-bold text-primary hover:underline"
                    >
                      مرحله بعد
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}