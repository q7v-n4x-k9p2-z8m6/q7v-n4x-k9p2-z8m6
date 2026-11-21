import React, { useMemo, useState } from 'react';
import { BookOpen, RotateCcw, Search } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TextInput, FormField, Notice } from '@/components/forms/FormField';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { reverseDocument } from '@/lib/accounting/posting-engine';
import { dec, faDate } from '@/lib/format';

export default function Journal() {
  const { role, roleLabel, can } = useRole();
  const { items: documents, reload } = useRecords('Document');
  const { entries, reload: reloadLedger } = useLedger();
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim();
    return documents
      .filter((doc) => (type ? doc.doc_type === type : true))
      .filter((doc) =>
        term
          ? [doc.doc_number, doc.customer_name, doc.counter_name, doc.description].filter(Boolean).some((field) => String(field).includes(term))
          : true
      )
      .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));
  }, [documents, type, search]);

  const selectedEntries = useMemo(
    () => (selected ? entries.filter((entry) => entry.document_id === selected.id) : []),
    [entries, selected]
  );

  async function handleReverse() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const reversal = await reverseDocument(selected.id, { name: roleLabel, role }, reason);
      setMessage({ tone: 'emerald', text: `سند معکوس ${reversal.doc_number} صادر شد.` });
      reload();
      reloadLedger();
      setSelected(null);
      setReason('');
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ابطال سند انجام نشد.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="دفتر روزنامه"
        description="همهٔ اسناد مالی به ترتیب تاریخ. حذف مستقیم وجود ندارد؛ اصلاح هر سند با صدور سند معکوس انجام می‌شود تا ردّ حسابرسی باقی بماند."
        icon={BookOpen}
        badge="بدون حذف بی‌ردپا"
      />

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <SectionCard
        title={`اسناد (${rows.length})`}
        actions={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="شماره سند، مشتری، شرح"
                className="h-8 w-40 rounded-lg border border-input bg-background pr-7 pl-2 text-[11.5px] outline-none focus:ring-1 focus:ring-ring sm:w-52"
              />
            </div>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-[11px]"
            >
              <option value="">همه انواع</option>
              {Object.entries(DOC_TYPES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <DataTable
          rows={rows}
          onRowClick={(row) => setSelected(row)}
          empty={{ title: 'سندی ثبت نشده است', description: 'اسناد از صفحات معامله، صندوق و حواله ساخته می‌شوند.' }}
          columns={[
            { key: 'doc_number', label: 'شماره سند', render: (row) => <span className="num font-bold">{row.doc_number}</span> },
            {
              key: 'doc_type',
              label: 'نوع',
              render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label || row.doc_type} tone={DOC_TYPES[row.doc_type]?.tone} />,
            },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
            { key: 'customer_name', label: 'مشتری', hideOnMobile: true, render: (row) => row.customer_name || '—' },
            {
              key: 'amount',
              label: 'مبلغ',
              render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span>,
            },
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[15px]">
              سند {selected?.doc_number}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <Info label="نوع" value={DOC_TYPES[selected.doc_type]?.label || selected.doc_type} />
                <Info label="تاریخ" value={faDate(selected.date)} />
                <Info label="مبلغ" value={`${dec(selected.amount)} ${selected.currency}`} />
                <Info label="ارزش پایه" value={`${dec(selected.base_value)} AFN`} />
                <Info label="طرف حساب" value={selected.counter_name || '—'} />
                <Info label="مشتری" value={selected.customer_name || '—'} />
                <Info label="ثبت‌کننده" value={selected.registered_by_name || '—'} />
                <Info label="شرح" value={selected.description || '—'} />
              </div>

              <div className="rounded-lg border border-border/70">
                <p className="border-b border-border/70 bg-muted/40 px-2.5 py-1.5 text-[11px] font-bold">ردیف‌های دفتر</p>
                {selectedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 border-b border-border/40 px-2.5 py-1.5 last:border-0">
                    <span className="truncate text-[11px]">{entry.account_name}</span>
                    <span className={`num text-[11px] font-bold ${entry.side === 'debit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {entry.side === 'debit' ? 'بد' : 'بس'} {dec(entry.amount)} {entry.currency}
                    </span>
                  </div>
                ))}
              </div>

              {selected.status === 'posted' && can('document.reverse') ? (
                <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 p-2.5">
                  <FormField label="دلیل ابطال (اختیاری)">
                    <TextInput value={reason} onChange={(event) => setReason(event.target.value)} placeholder="مثلاً اشتباه در نرخ" />
                  </FormField>
                  <button
                    type="button"
                    onClick={handleReverse}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> {busy ? 'در حال صدور…' : 'صدور سند معکوس'}
                  </button>
                </div>
              ) : null}

              <div className="flex justify-end border-t border-border/70 pt-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[11.5px] font-bold text-foreground/80 hover:bg-secondary"
                >
                  بستن
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-border/60 px-2 py-1.5">
      <p className="text-[9.5px] text-muted-foreground">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}