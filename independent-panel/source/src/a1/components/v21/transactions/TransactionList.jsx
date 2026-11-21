// a1/components/v21/transactions/TransactionList.jsx — فهرست معاملات (جدول و کارت‌های واکنش‌گرا)
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { displayDate } from './transactionCenter';
import TransactionAmount from './TransactionAmount';
import TransactionStatus from './TransactionStatus';
import { toPersianDigits } from '@/a1/lib/format';

export default function TransactionList({ records, onOpen }) {
  if (!records.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-[11px] text-muted-foreground">
        برای فیلترهای انتخاب‌شده معامله‌ای یافت نشد.
      </div>
    );
  }

  return (
    <>
      {/* جدول لپ‌تاپ و تبلت */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full table-fixed text-right text-[11px]">
          <thead className="bg-secondary text-[10px] text-slate-700">
            <tr>
              <th className="w-[86px] p-2 font-bold">شماره</th>
              <th className="w-[86px] p-2 font-bold">تاریخ</th>
              <th className="w-[132px] p-2 font-bold">نوع عملیات</th>
              <th className="w-[132px] p-2 font-bold">طرف معامله</th>
              <th className="p-2 font-bold">مبلغ و ارز</th>
              <th className="w-[104px] p-2 font-bold">وضعیت</th>
              <th className="w-[30px] p-2" />
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr
                key={record.key}
                onClick={() => onOpen(record)}
                className="cursor-pointer border-t border-border align-top transition hover:bg-secondary/60"
              >
                <td className="p-2 num text-slate-700" dir="ltr">{record.number ? toPersianDigits(record.number) : '—'}</td>
                <td className="p-2 num text-slate-600">{displayDate(record.date)}</td>
                <td className="p-2">
                  <span className="block font-bold text-foreground">{record.kind}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{record.sourceLabel}</span>
                </td>
                <td className="p-2">
                  <span className="line-clamp-2 block text-slate-700">{record.party}</span>
                  {(record.customer || record.branch) && (
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {record.customer || record.branch}
                    </span>
                  )}
                </td>
                <td className="p-2"><TransactionAmount record={record} /></td>
                <td className="p-2"><TransactionStatus status={record.status} /></td>
                <td className="p-2 text-muted-foreground"><ChevronLeft className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* کارت‌های موبایل */}
      <div className="space-y-2 md:hidden">
        {records.map(record => (
          <button
            key={record.key}
            type="button"
            onClick={() => onOpen(record)}
            className="block w-full rounded-xl border border-border bg-card p-2.5 text-right transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <b className="block text-[11px] font-bold text-foreground">{record.kind}</b>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {record.number ? 'شمارهٔ ' + toPersianDigits(record.number) + ' · ' : ''}{displayDate(record.date)}
                </span>
              </div>
              <TransactionStatus status={record.status} />
            </div>
            <div className="mt-2 flex items-end justify-between gap-2 border-t border-border pt-2">
              <span className="min-w-0 truncate text-[10px] text-slate-600">{record.party}</span>
              <TransactionAmount record={record} />
            </div>
            <span className="mt-1 block text-[9px] text-muted-foreground">منبع ثبت: {record.sourceLabel}</span>
          </button>
        ))}
      </div>
    </>
  );
}