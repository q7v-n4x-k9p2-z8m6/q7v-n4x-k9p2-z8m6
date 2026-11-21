// a1/components/v21/transactions/TransactionAmount.jsx — تفکیک مبلغ اصلی، ارز و مبلغ مقابل
import React from 'react';
import { formatMoney, formatRateText } from './transactionCenter';

export default function TransactionAmount({ record, showRate = false, showBase = false }) {
  return (
    <div className="space-y-0.5">
      <div className="num text-[11px] font-bold text-foreground">{formatMoney(record.mainAmount, record.mainCurrency)}</div>
      {record.secondAmount ? (
        <div className="num text-[10px] text-muted-foreground">مقابل: {formatMoney(record.secondAmount, record.secondCurrency)}</div>
      ) : null}
      {record.fee > 0 ? (
        <div className="num text-[10px] text-muted-foreground">کارمزد: {formatMoney(record.fee, record.feeCurrency)}</div>
      ) : null}
      {showRate && record.rate ? (
        <div className="num text-[10px] text-primary">نرخ: {formatRateText(record.rate, record.mainCurrency, record.secondCurrency)}</div>
      ) : null}
      {showBase && record.base ? (
        <div className="num text-[10px] text-muted-foreground">
          معادل پایه: {formatMoney(record.base.amount, record.base.currency)}{record.base.approximate ? ' (تقریبی)' : ''}
        </div>
      ) : null}
    </div>
  );
}