// a1/components/v21/transactions/TransactionsBoard.jsx — بدنهٔ مشترک مرکز معاملات
// فهرست، آمار، فیلتر، جمع به تفکیک ارز، خروجی و جزئیات؛ هیچ داده‌ای نمی‌نویسد.
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ShieldCheck } from 'lucide-react';
import { buildCenterRecords, totalsByCurrency, formatMoney } from './transactionCenter';
import TransactionStats from './TransactionStats';
import TransactionFilters from './TransactionFilters';
import TransactionList from './TransactionList';
import TransactionDetail from './TransactionDetail';
import { formatNumber, toPersianDigits } from '@/a1/lib/format';

const todayIso = () => new Date().toLocaleDateString('en-CA');
const shiftDays = days => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('en-CA');
};

export default function TransactionsBoard({ data, activity = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [customer, setCustomer] = useState('all');
  const [branch, setBranch] = useState('all');
  const [registrar, setRegistrar] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);

  const records = useMemo(() => buildCenterRecords(data), [data]);

  const typeOptions = useMemo(() => [...new Set(records.map(record => record.kind))].sort(), [records]);
  const currencies = useMemo(() => {
    const set = new Set();
    records.forEach(record => {
      if (record.mainCurrency) set.add(record.mainCurrency);
      if (record.secondCurrency) set.add(record.secondCurrency);
    });
    return [...set].sort();
  }, [records]);
  const customerOptions = useMemo(() => {
    const set = new Set((data?.customers || []).map(item => item.name).filter(Boolean));
    records.forEach(record => { if (record.customer) set.add(record.customer); });
    return [...set].sort();
  }, [data, records]);
  const branchOptions = useMemo(() => {
    const set = new Set((data?.branches || []).map(item => item.name).filter(Boolean));
    records.forEach(record => { if (record.branch) set.add(record.branch); });
    return [...set].sort();
  }, [data, records]);
  const registrarOptions = useMemo(() => {
    const set = new Set(records.map(record => record.registrar).filter(Boolean));
    return [...set].sort();
  }, [records]);

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(record => {
      if (type !== 'all' && record.kind !== type) return false;
      if (currency !== 'all' && record.mainCurrency !== currency && record.secondCurrency !== currency) return false;
      if (customer !== 'all' && record.customer !== customer) return false;
      if (branch !== 'all' && record.branch !== branch) return false;
      if (registrar !== 'all' && record.registrar !== registrar) return false;
      if (dateFrom && record.date && record.date < dateFrom) return false;
      if (dateTo && record.date && record.date > dateTo) return false;
      if (!q) return true;
      return [record.number, record.uniqueId, record.party, record.customer, record.branch, record.registrar,
        record.description, record.kind, record.sourceLabel, record.mainCurrency, record.secondCurrency]
        .join(' ').toLowerCase().includes(q);
    });
  }, [records, query, type, currency, customer, branch, registrar, dateFrom, dateTo]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? scoped : scoped.filter(record => record.status === statusFilter)),
    [scoped, statusFilter],
  );

  const counts = useMemo(() => {
    const result = { total: scoped.length, pending: 0, completed: 0, cancelled: 0, review: 0 };
    scoped.forEach(record => { result[record.status] = (result[record.status] || 0) + 1; });
    return result;
  }, [scoped]);

  const totals = useMemo(() => totalsByCurrency(visible), [visible]);

  const resetFilters = () => {
    setQuery(''); setType('all'); setStatusFilter('all'); setCurrency('all');
    setCustomer('all'); setBranch('all'); setRegistrar('all'); setDateFrom(''); setDateTo('');
  };

  const quickRange = key => {
    if (key === 'today') { setDateFrom(todayIso()); setDateTo(todayIso()); return; }
    if (key === 'week') { setDateFrom(shiftDays(6)); setDateTo(todayIso()); return; }
    if (key === 'month') { setDateFrom(shiftDays(29)); setDateTo(todayIso()); }
  };

  const exportCsv = () => {
    const headers = ['شناسه یکتا', 'شماره', 'تاریخ', 'نوع عملیات', 'طرف معامله', 'مشتری', 'نمایندگی/شعبه',
      'مبلغ اصلی', 'ارز مبدأ', 'مبلغ مقصد', 'ارز مقصد', 'نرخ', 'کارمزد', 'ارز کارمزد',
      'وضعیت', 'وضعیت مبدأ', 'منبع ثبت', 'ثبت‌کننده'];
    const rows = visible.map(record => [
      record.uniqueId, record.number, record.date, record.kind, record.party, record.customer, record.branch,
      record.mainAmount, record.mainCurrency, record.secondAmount ?? '', record.secondCurrency || '', record.rate || '',
      record.fee || '', record.feeCurrency || '', record.status, record.documentStatus, record.sourceLabel, record.registrar,
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions-' + todayIso() + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-2">
      <TransactionStats counts={counts} statusFilter={statusFilter} onSelect={setStatusFilter} />

      <div className="space-y-1 rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-[10px] leading-5 text-muted-foreground">
        <p className="flex items-start gap-1">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          این مرکز فقط تجمیع و پیگیری است؛ ثبت، ویرایش و ابطال در ماژول تخصصی هر عملیات انجام می‌شود و هیچ سند یا گردش مالی تکراری ساخته نمی‌شود.
        </p>
        <p className="flex items-start gap-1">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          شناسهٔ یکتای هر معامله از منبع آن ساخته می‌شود (مثلاً EXC-… یا TRF-…)؛ هشدار تشابه جایگزین یکتایی نیست.
          دسترسی شعب و کارکنان در مرحلهٔ آینده افزوده می‌شود و مجوزهای نهایی هنوز تعیین نشده‌اند.
        </p>
      </div>

      <TransactionFilters
        query={query} onQuery={setQuery}
        type={type} onType={setType} typeOptions={typeOptions}
        statusFilter={statusFilter} onStatus={setStatusFilter}
        currency={currency} onCurrency={setCurrency} currencies={currencies}
        customer={customer} onCustomer={setCustomer} customers={customerOptions}
        branch={branch} onBranch={setBranch} branches={branchOptions}
        registrar={registrar} onRegistrar={setRegistrar} registrars={registrarOptions}
        dateFrom={dateFrom} onDateFrom={setDateFrom} dateTo={dateTo} onDateTo={setDateTo}
        onQuickRange={quickRange}
        onReset={resetFilters} onExport={exportCsv} total={visible.length}
      />

      <TransactionList records={visible} onOpen={setSelected} />

      <section className="rounded-xl border border-border bg-card p-2">
        <h3 className="mb-1.5 text-[10px] font-extrabold text-primary">جمع مبلغ اصلی به تفکیک ارز</h3>
        {totals.length ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {totals.map(item => (
              <div key={item.currency} className="rounded-lg border border-border bg-secondary/40 px-2 py-1.5">
                <span className="block text-[10px] text-muted-foreground">{formatNumber(item.count)} معامله</span>
                <b className="num mt-0.5 block text-[11px] text-foreground">{formatMoney(item.amount, item.currency)}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">برای نمایش جمع، حداقل یک معامله در فیلتر فعلی لازم است.</p>
        )}
        <p className="mt-1.5 text-[9px] text-muted-foreground">
          ارزهای مختلف در یک عدد جمع نمی‌شوند؛ این جمع فقط مبلغ اصلی هر معامله را در ارز خودش نشان می‌دهد.
          {' '}مجموع نمایش‌داده‌شده: {toPersianDigits(String(visible.length))} معامله.
        </p>
      </section>

      <TransactionDetail
        record={selected}
        activity={activity}
        onClose={() => setSelected(null)}
        onOpenModule={record => {
          setSelected(null);
          navigate('/dashboard?module=' + record.module);
        }}
      />
    </div>
  );
}