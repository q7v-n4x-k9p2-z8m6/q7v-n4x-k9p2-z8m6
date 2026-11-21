import React from 'react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui-kit/EmptyState';

/**
 * جدول واکنش‌گرا: در دسکتاپ جدول و در موبایل کارت‌های فشرده.
 * columns: [{ key, label, render(row), align, className, hideOnMobile }]
 */
export default function DataTable({ columns, rows, onRowClick, empty, rowKey = 'id', className }) {
  if (!rows?.length) {
    return <EmptyState title={empty?.title || 'موردی ثبت نشده است'} description={empty?.description} />;
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="border-b border-border/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-2 text-[10.5px] font-bold text-muted-foreground',
                    col.align === 'left' ? 'text-left' : 'text-right'
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border/50 last:border-0',
                  onRowClick && 'cursor-pointer transition-colors hover:bg-secondary/60'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-2.5 py-2.5 text-[12px] text-foreground',
                      col.align === 'left' && 'text-left',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <div
            key={row[rowKey]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'rounded-xl border border-border/80 bg-card p-3',
              onRowClick && 'active:bg-secondary/60'
            )}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col, index) => (
                <div
                  key={col.key}
                  className={cn(
                    'flex items-start justify-between gap-3 py-0.5',
                    index === 0 && 'mb-1 border-b border-border/50 pb-1.5'
                  )}
                >
                  <span className="shrink-0 text-[10.5px] text-muted-foreground">{col.label}</span>
                  <span
                    className={cn(
                      'text-left text-[12px] font-medium text-foreground',
                      index === 0 && 'text-[13px] font-bold'
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}