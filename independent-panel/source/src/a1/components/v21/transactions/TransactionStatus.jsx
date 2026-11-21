// a1/components/v21/transactions/TransactionStatus.jsx — نشان وضعیت مرکزی معامله
import React from 'react';
import { STATUS_META } from './transactionCenter';

export default function TransactionStatus({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ' + meta.tone}>
      {meta.label}
    </span>
  );
}