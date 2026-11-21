// a1/components/v21/transactions/TransactionFilters.jsx — جست‌وجو و فیلترهای مرکز معاملات
import React from 'react';
import { Search, Filter, X, Download } from 'lucide-react';
import { STATUS_META, STATUS_ORDER } from './transactionCenter';
import { currencyLabel, formatNumber } from '@/a1/lib/format';
import JalaliDateInput from '@/a1/components/v21/JalaliDateInput';

export default function TransactionFilters({
  query, onQuery,
  type = 'all', onType, typeOptions = [],
  statusFilter = 'all', onStatus,
  currency = 'all', onCurrency, currencies = [],
  customer = 'all', onCustomer, customers = [],
  branch = 'all', onBranch, branches = [],
  registrar = 'all', onRegistrar, registrars = [],
  dateFrom = '', onDateFrom, dateTo = '', onDateTo, onQuickRange,
  onReset, onExport, total = 0,
}) {
  const quick = [
    ['today', 'امروز'],
    ['week', '۷ روز'],
    ['month', '۳۰ روز'],
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-2">
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <label className="col-span-2 flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 lg:col-span-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={event => onQuery(event.target.value)}
            placeholder="شماره، طرف معامله یا شرح..."
            className="h-full w-full border-0 bg-transparent p-0 text-[11px] outline-none"
          />
        </label>
        <select value={type} onChange={event => onType(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه انواع معامله</option>
          {typeOptions.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={statusFilter} onChange={event => onStatus(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه وضعیت‌ها</option>
          {STATUS_ORDER.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}
        </select>
        <select value={currency} onChange={event => onCurrency(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه ارزها</option>
          {currencies.map(code => <option key={code} value={code}>{currencyLabel(code)} ({code})</option>)}
        </select>
        <select value={customer} onChange={event => onCustomer(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه مشتریان</option>
          {customers.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={branch} onChange={event => onBranch(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه نمایندگی‌ها / شعب</option>
          {branches.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={registrar} onChange={event => onRegistrar(event.target.value)} className="h-8 w-full rounded-lg border border-border bg-white px-1.5 text-[11px]">
          <option value="all">همه ثبت‌کنندگان</option>
          {registrars.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <label className="flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-1.5 text-[10px] text-slate-600">
          از
          <JalaliDateInput value={dateFrom} onChange={onDateFrom} ariaLabel="از تاریخ" className="h-full w-full border-0 bg-transparent p-0 text-[10px] outline-none" />
        </label>
        <label className="flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-1.5 text-[10px] text-slate-600">
          تا
          <JalaliDateInput value={dateTo} onChange={onDateTo} ariaLabel="تا تاریخ" className="h-full w-full border-0 bg-transparent p-0 text-[10px] outline-none" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {quick.map(([key, label]) => (
          <button key={key} type="button" onClick={() => onQuickRange(key)} className="h-7 rounded-lg border border-border bg-white px-2 text-[10px] text-slate-700 hover:border-primary/40">
            {label}
          </button>
        ))}
        <button type="button" onClick={onReset} className="flex h-7 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[10px] font-bold text-slate-700">
          <X className="h-3.5 w-3.5" /> پاک‌کردن فیلتر
        </button>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> تعداد: {formatNumber(total)}
        </span>
        <button type="button" onClick={onExport} className="mr-auto flex h-7 items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 text-[10px] font-bold text-foreground">
          <Download className="h-3.5 w-3.5" /> خروجی CSV
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground">
        بازهٔ تاریخ با تاریخ معامله مقایسه می‌شود؛ تاریخ‌ها به تقویم هجری شمسی نمایش داده می‌شوند.
      </p>
    </div>
  );
}