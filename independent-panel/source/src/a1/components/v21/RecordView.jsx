// a1/components/v21/RecordView.jsx — مشاهدهٔ جزئیات رکورد انتخاب‌شده
// همان ستون‌ها و برچسب‌های جدول را نشان می‌دهد تا مقدار نمایش‌داده‌شده با جدول یکی باشد.
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Pencil, ArrowRight, Link2 } from 'lucide-react';
import { formatTableDate } from './DataTable';

export default function RecordView({ open, title, columns, record, links = [], onEdit, canEdit, onPrint, onClose }) {
  if (!open || !record) return null;

  const valueOf = column => {
    if (column.render) return column.render(record);
    if (column.key === 'date') return formatTableDate(record.date);
    const value = record[column.key];
    return value === undefined || value === null || value === '' ? '—' : String(value);
  };

  // رندر در بدنهٔ صفحه تا هیچ لایه، نوار پایین یا پوستهٔ چیدمان روی پنجرهٔ جزئیات قرار نگیرد
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-3" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl overflow-auto border-2 border-[#5b7a97] bg-[#f7f9fb] shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white">
          <b className="text-xs">{title}</b>
          <button type="button" aria-label="بستن جزئیات" onClick={onClose}><X className="h-4 w-4" /></button>
        </header>

        <div className="p-3">
          <table className="w-full border border-slate-200 text-[11px]">
            <tbody>
              {columns.map(column => (
                <tr key={column.key} className="border-b border-slate-200 last:border-b-0">
                  <th className="w-1/3 border-l border-slate-200 bg-slate-100 px-2 py-2 text-right font-bold text-slate-600">{column.label}</th>
                  <td className="px-2 py-2 text-slate-800">{valueOf(column)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {links.length ? (
          <div className="border-t bg-white p-3">
            <b className="mb-2 block text-[11px] text-[#24496d]">پیوندهای مرتبط این رکورد</b>
            <div className="flex flex-wrap gap-2">
              {links.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-1 border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-900"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {item.label}
                  {item.meta ? <span className="text-[9px] font-normal opacity-70">({item.meta})</span> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <footer className="flex justify-end gap-2 border-t bg-slate-100 p-3">
          {onEdit && (
            <button type="button" disabled={!canEdit} onClick={onEdit} className="flex items-center gap-1 border bg-white px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40">
              <Pencil className="h-4 w-4" />ویرایش
            </button>
          )}
          <button type="button" onClick={onPrint} className="flex items-center gap-1 border bg-white px-3 py-2 text-xs">
            <Printer className="h-4 w-4" />چاپ
          </button>
          <button type="button" onClick={onClose} className="flex items-center gap-1 rounded-lg border border-[#17466c] bg-[#17466c] px-3 py-2 text-xs font-bold text-white">
            <ArrowRight className="h-4 w-4" />بازگشت به فهرست
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}