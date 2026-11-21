import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField, TextInput, SelectInput, FormActions, Notice } from '@/components/forms/FormField';
import { base44 as sdk } from '@/api/base44Client';
import { buildCustomerOpening } from '@/lib/accounting/postings';
import { postDocument } from '@/lib/accounting/posting-engine';
import { useRole } from '@/lib/role-context';
import { isoToday } from '@/lib/format';
import { CURRENCY_LABELS } from '@/lib/config';

const EMPTY = {
  full_name: '',
  code: '',
  mobile: '',
  city: '',
  customer_type: 'حقیقی',
  national_id: '',
  customer_group: '',
  account_details: '',
  notes: '',
  opening_balance: '',
  balance_currency: 'AFN',
};

export default function CustomerDialog({ open, onOpenChange, customer, onSaved }) {
  const { role, roleLabel } = useRole();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      customer
        ? {
            ...EMPTY,
            ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, customer[key] ?? EMPTY[key]])),
          }
        : EMPTY
    );
  }, [open, customer]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.full_name.trim()) {
      setError('نام مشتری الزامی است.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.full_name.trim(),
        full_name: form.full_name.trim(),
        code: form.code.trim(),
        mobile: form.mobile.trim(),
        city: form.city.trim(),
        customer_type: form.customer_type,
        national_id: form.national_id.trim(),
        customer_group: form.customer_group.trim(),
        account_details: form.account_details.trim(),
        notes: form.notes.trim(),
        balance_currency: form.balance_currency,
        status: customer?.status || 'active',
        opening_balance: Number(form.opening_balance) || 0,
      };

      if (customer) {
        await sdk.entities.Customer.update(customer.id, payload);
      } else {
        const created = await sdk.entities.Customer.create(payload);
        const opening = buildCustomerOpening({
          customer: created,
          amount: Number(form.opening_balance) || 0,
          currency: form.balance_currency,
          date: isoToday(),
        });
        if (opening) {
          await postDocument({ ...opening, actor: { name: roleLabel, role } });
        }
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'ثبت مشتری انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[15px]">
            {customer ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="نام کامل" className="col-span-2">
              <TextInput value={form.full_name} onChange={set('full_name')} placeholder="نام مشتری" />
            </FormField>
            <FormField label="کد مشتری">
              <TextInput value={form.code} onChange={set('code')} placeholder="اختیاری" />
            </FormField>
            <FormField label="نوع مشتری">
              <SelectInput
                value={form.customer_type}
                onChange={set('customer_type')}
                options={[
                  { value: 'حقیقی', label: 'حقیقی' },
                  { value: 'حقوقی', label: 'حقوقی' },
                ]}
              />
            </FormField>
            <FormField label="موبایل">
              <TextInput value={form.mobile} onChange={set('mobile')} inputMode="tel" placeholder="07xxxxxxxx" />
            </FormField>
            <FormField label="شماره تذکره / شناسه">
              <TextInput value={form.national_id} onChange={set('national_id')} />
            </FormField>
            <FormField label="شهر">
              <TextInput value={form.city} onChange={set('city')} />
            </FormField>
            <FormField label="گروه مشتری">
              <TextInput value={form.customer_group} onChange={set('customer_group')} placeholder="خرده / عمده" />
            </FormField>
            <FormField label="مانده آغازین" hint="مثبت: مشتری بدهکار است">
              <TextInput
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={set('opening_balance')}
                disabled={Boolean(customer)}
              />
            </FormField>
            <FormField label="ارز مانده">
              <SelectInput
                value={form.balance_currency}
                onChange={set('balance_currency')}
                options={Object.entries(CURRENCY_LABELS).map(([code, name]) => ({ value: code, label: `${code} — ${name}` }))}
                disabled={Boolean(customer)}
              />
            </FormField>
            <FormField label="مشخصات حساب" className="col-span-2">
              <TextInput value={form.account_details} onChange={set('account_details')} placeholder="شماره حساب / کارت" />
            </FormField>
            <FormField label="یادداشت" className="col-span-2">
              <TextInput value={form.notes} onChange={set('notes')} />
            </FormField>
          </div>

          {!customer ? (
            <Notice>
              با ثبت مانده آغازین، یک سند حسابداری خودکار در برابر حساب «مانده آغازین» صادر می‌شود.
            </Notice>
          ) : null}
          {error ? <Notice tone="rose">{error}</Notice> : null}

          <FormActions onCancel={() => onOpenChange(false)} submitting={submitting} submitLabel={customer ? 'ذخیره تغییرات' : 'ثبت مشتری'} />
        </form>
      </DialogContent>
    </Dialog>
  );
}