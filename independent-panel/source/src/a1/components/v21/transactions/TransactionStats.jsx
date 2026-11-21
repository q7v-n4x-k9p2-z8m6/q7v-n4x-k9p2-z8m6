// a1/components/v21/transactions/TransactionStats.jsx — کارت‌های آماری مرکز معاملات
import React from 'react';
import { STATUS_META } from './transactionCenter';
import { formatNumber } from '@/a1/lib/format';

const CARDS = [
  ['all', 'کل معاملات', 'border-border bg-card'],
  ['pending', 'در انتظار', STATUS_META.pending.tone],
  ['completed', 'تکمیل‌شده', STATUS_META.completed.tone],
  ['cancelled', 'لغوشده', STATUS_META.cancelled.tone],
  ['review', 'نیازمند بررسی', STATUS_META.review.tone],
];

export default function TransactionStats({ counts, statusFilter, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map(([key, label, tone]) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={'rounded-xl border p-2.5 text-right transition ' + (statusFilter === key ? 'border-primary bg-secondary' : tone + ' hover:border-primary/40')}
        >
          <span className="block text-[10px] text-slate-600">{label}</span>
          <b className="mt-1 block text-base font-extrabold text-foreground">
            {formatNumber(key === 'all' ? counts.total : (counts[key] || 0))}
          </b>
        </button>
      ))}
    </div>
  );
}