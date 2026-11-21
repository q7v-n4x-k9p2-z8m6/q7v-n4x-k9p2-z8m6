import React, { useState } from 'react';
import { Network, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { useRecords } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';

const EMPTY = { name: '', code: '', type: 'agent', phone: '', city: '', notes: '' };

export default function Agents() {
  const { can } = useRole();
  const { items, reload } = useRecords('Origin');
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (!form.name.trim()) return setMessage({ tone: 'rose', text: 'نام نمایندگی الزامی است.' });
    setSubmitting(true);
    try {
      await base44.entities.Origin.create({
        name: form.name.trim(),
        code: form.code.trim(),
        type: form.type,
        phone: form.phone.trim(),
        city: form.city.trim(),
        notes: form.notes.trim(),
        is_active: true,
      });
      setForm(EMPTY);
      setMessage({ tone: 'emerald', text: 'نمایندگی ثبت شد.' });
      reload();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت انجام نشد.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="نمایندگی‌ها"
        description="نمایندگی‌ها و مبدأهای حواله. در سورس A1 این بخش با جدول origins و شبکهٔ نمایندگی مرتبط است."
        icon={Network}
        actions={
          can('agents.manage') ? (
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> نمایندگی جدید
            </button>
          ) : null
        }
      />

      {showForm ? (
        <SectionCard title="ثبت نمایندگی">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <FormField label="نام">
                <TextInput value={form.name} onChange={set('name')} />
              </FormField>
              <FormField label="کد">
                <TextInput value={form.code} onChange={set('code')} />
              </FormField>
              <FormField label="نوع">
                <SelectInput
                  value={form.type}
                  onChange={set('type')}
                  options={[
                    { value: 'agent', label: 'نمایندگی' },
                    { value: 'origin', label: 'مبدأ حواله' },
                  ]}
                />
              </FormField>
              <FormField label="موبایل">
                <TextInput value={form.phone} onChange={set('phone')} />
              </FormField>
              <FormField label="شهر">
                <TextInput value={form.city} onChange={set('city')} />
              </FormField>
              <FormField label="یادداشت">
                <TextInput value={form.notes} onChange={set('notes')} />
              </FormField>
            </div>
            {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            <FormActions onCancel={() => setShowForm(false)} submitting={submitting} submitLabel="ثبت نمایندگی" />
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title={`فهرست نمایندگی‌ها (${items.length})`}>
        <DataTable
          rows={items}
          empty={{ title: 'نمایندگی ثبت نشده است' }}
          columns={[
            { key: 'name', label: 'نام', render: (row) => <span className="font-bold">{row.name}</span> },
            { key: 'code', label: 'کد', render: (row) => <span className="num">{row.code || '—'}</span> },
            { key: 'type', label: 'نوع', render: (row) => (row.type === 'agent' ? 'نمایندگی' : 'مبدأ حواله') },
            { key: 'phone', label: 'موبایل', hideOnMobile: true, render: (row) => <span className="num">{row.phone || '—'}</span> },
            { key: 'city', label: 'شهر', render: (row) => row.city || '—' },
            {
              key: 'is_active',
              label: 'وضعیت',
              render: (row) => <StatusBadge label={row.is_active ? 'فعال' : 'غیرفعال'} tone={row.is_active ? 'emerald' : 'slate'} />,
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}