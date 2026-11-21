import React, { useMemo, useState } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatCard from '@/components/ui-kit/StatCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { useRecords, useLedger, useCurrencies } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { buildOpening } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { balanceFor } from '@/lib/accounting/queries';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { dec, faDate, isoToday } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';

const EMPTY = {
  bank_name: '',
  account_number: '',
  holder: '',
  branch: '',
  currency: BASE_CURRENCY,
  opening_balance: '',
  opening_value: '',
  card_number: '',
  sheba: '',
  note: '',
};

export default function Bank() {
  const { role, roleLabel, can } = useRole();
  const { items: accounts, reload } = useRecords('BankAccount');
  const { entries, reload: reloadLedger } = useLedger();
  const { items: documents } = useRecords('Document');
  const currencies = useCurrencies();

  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const totalValue = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        if (entry.account_type !== 'bank') return sum;
        return sum + (entry.side === 'debit' ? Number(entry.value) : -Number(entry.value));
      }, 0),
    [entries]
  );

  const bankDocs = useMemo(
    () =>
      documents
        .filter((doc) => doc.counter_type === 'bank')
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))
        .slice(0, 8),
    [documents]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (!form.bank_name.trim() || !form.account_number.trim()) {
      return setMessage({ tone: 'rose', text: 'نام بانک و شماره حساب الزامی است.' });
    }
    setSubmitting(true);
    try {
      const created = await base44.entities.BankAccount.create({
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        holder: form.holder.trim(),
        branch: form.branch.trim(),
        currency: form.currency,
        opening_balance: Number(form.opening_balance) || 0,
        opening_value: Number(form.opening_value) || Number(form.opening_balance) || 0,
        card_number: form.card_number.trim(),
        sheba: form.sheba.trim(),
        note: form.note.trim(),
        active: true,
      });

      if (Number(form.opening_balance) > 0) {
        const opening = buildOpening({
          counter: { type: 'bank', id: created.id, name: `${created.bank_name} — ${created.account_number}` },
          currency: form.currency,
          amount: Number(form.opening_balance),
          value: Number(form.opening_value) || Number(form.opening_balance),
          date: isoToday(),
        });
        await postDocument({ ...opening, actor: { name: roleLabel, role } });
      }

      setMessage({ tone: 'emerald', text: 'حساب بانکی ثبت شد.' });
      setForm(EMPTY);
      reload();
      reloadLedger();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت حساب انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="بانک"
        description="تعریف حساب‌های بانکی و مشاهدهٔ ماندهٔ آن‌ها. واریز و برداشت از همین حساب‌ها در صفحهٔ صندوق ثبت می‌شود."
        icon={Landmark}
        actions={
          can('bank.post') ? (
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> حساب جدید
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="حساب‌های بانکی" value={accounts.length} hint={`${accounts.filter((a) => a.active).length} فعال`} icon={Landmark} tone="sky" />
        <StatCard label="ارزش موجودی بانکی" value={`${dec(totalValue)} ${BASE_CURRENCY}`} hint="بر پایهٔ ردیف‌های دفتر" tone="emerald" />
      </div>

      {showForm ? (
        <SectionCard title="ثبت حساب بانکی">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <FormField label="نام بانک">
                <TextInput value={form.bank_name} onChange={set('bank_name')} />
              </FormField>
              <FormField label="شماره حساب">
                <TextInput value={form.account_number} onChange={set('account_number')} />
              </FormField>
              <FormField label="صاحب حساب">
                <TextInput value={form.holder} onChange={set('holder')} />
              </FormField>
              <FormField label="شعبه">
                <TextInput value={form.branch} onChange={set('branch')} />
              </FormField>
              <FormField label="ارز">
                <SelectInput
                  value={form.currency}
                  onChange={set('currency')}
                  options={currencies.map((item) => ({ value: item.code, label: item.code }))}
                />
              </FormField>
              <FormField label="موجودی آغازین">
                <TextInput type="number" step="0.01" value={form.opening_balance} onChange={set('opening_balance')} />
              </FormField>
              <FormField label={`ارزش معادل (${BASE_CURRENCY})`} hint="برای ارز غیرپایه">
                <TextInput type="number" step="0.01" value={form.opening_value} onChange={set('opening_value')} />
              </FormField>
              <FormField label="شماره کارت">
                <TextInput value={form.card_number} onChange={set('card_number')} />
              </FormField>
              <FormField label="شبا">
                <TextInput value={form.sheba} onChange={set('sheba')} />
              </FormField>
            </div>
            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setShowForm(false)} submitting={submitting} submitLabel="ثبت حساب" />
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="حساب‌های بانکی">
        <DataTable
          rows={accounts}
          empty={{ title: 'حساب بانکی ثبت نشده است' }}
          columns={[
            {
              key: 'bank_name',
              label: 'بانک',
              render: (row) => (
                <div>
                  <p className="font-bold">{row.bank_name}</p>
                  <p className="num text-[10px] text-muted-foreground">{row.account_number}</p>
                </div>
              ),
            },
            { key: 'holder', label: 'صاحب حساب', hideOnMobile: true, render: (row) => row.holder || '—' },
            { key: 'currency', label: 'ارز' },
            {
              key: 'balance',
              label: 'مانده',
              render: (row) => {
                const balance = balanceFor(entries, 'bank', row.id, row.currency);
                return <span className="num font-bold">{dec(balance)} {row.currency}</span>;
              },
            },
            {
              key: 'active',
              label: 'وضعیت',
              render: (row) => <StatusBadge label={row.active ? 'فعال' : 'غیرفعال'} tone={row.active ? 'emerald' : 'slate'} />,
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="آخرین گردش بانکی">
        <DataTable
          rows={bankDocs}
          empty={{ title: 'گردش بانکی ثبت نشده است' }}
          columns={[
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            {
              key: 'doc_type',
              label: 'نوع',
              render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label || row.doc_type} tone={DOC_TYPES[row.doc_type]?.tone} />,
            },
            { key: 'counter_name', label: 'حساب', hideOnMobile: true, render: (row) => row.counter_name || '—' },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
          ]}
        />
      </SectionCard>
    </div>
  );
}