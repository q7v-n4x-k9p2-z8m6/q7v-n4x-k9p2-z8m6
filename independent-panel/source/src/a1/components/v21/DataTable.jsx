// a1/components/v21/DataTable.jsx — جدول داده، ستون‌های فرم و کاشی ماژول
// انتقال مستقیم Field/DataTable/Tile از Version21Workspace.jsx سورس A1.
// افزودهٔ این نسخه: مرتب‌سازی ستون‌ها با کلیک روی سرستون و بازکردن رکورد با دوبار کلیک.
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { toPersianDigits, currencyLabel } from '@/a1/lib/format';
import JalaliDateInput from './JalaliDateInput';

export function formatTableDate(value) {
  const raw = String(value ?? '');
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return toPersianDigits(raw) || '—';
  const [, year, month, day] = match.map(Number);
  return toPersianDigits(new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(year, month - 1, day)));
}

export function Field({ field, value, onChange, choices }) {
  const [key, label, type, opts] = field;
  const options = choices?.[key] || opts || [];
  return (
    <label className="block space-y-1 text-[11px]">
      <span className="font-semibold text-slate-700">{label}</span>
      {type === 'select' || choices?.[key] ? (
        <select
          value={value ?? options[0]?.value ?? options[0] ?? ''}
          onChange={e => onChange(key, e.target.value)}
          className="h-9 w-full border border-slate-300 bg-white px-2 text-xs"
        >
          {options.map(o => {
            const v = typeof o === 'object' ? o.value : o;
            const t = typeof o === 'object' ? o.label : o;
            return <option key={v} value={v}>{t}</option>;
          })}
        </select>
      ) : type === 'date' ? (
        <JalaliDateInput value={value} onChange={next => onChange(key, next)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs" />
      ) : (
        <input
          type={type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={e => onChange(key, e.target.value)}
          className="h-9 w-full border border-slate-300 bg-white px-2 text-xs"
        />
      )}
    </label>
  );
}

const numeric = value => {
  const text = String(value ?? '').replaceAll(',', '').trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareValues = (x, y) => {
  const nx = numeric(x);
  const ny = numeric(y);
  if (nx !== null && ny !== null) return nx - ny;
  const sx = String(x ?? '');
  const sy = String(y ?? '');
  if (!sx && !sy) return 0;
  if (!sx) return 1;
  if (!sy) return -1;
  return sx.localeCompare(sy, 'fa');
};

export function DataTable({ columns, rows, onSelect, selected, onOpen }) {
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [expandedId, setExpandedId] = useState(null);

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find(c => c.key === sort.key);
    if (!column) return rows;
    const valueOf = row => (column.sortValue ? column.sortValue(row) : row[sort.key]);
    const next = [...rows].sort((a, b) => compareValues(valueOf(a), valueOf(b)));
    return sort.dir === 'desc' ? next.reverse() : next;
  }, [rows, columns, sort]);

  const toggleSort = key => setSort(current => (
    current.key === key
      ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
  ));

  // ستون‌هایی که قالب‌بند اختصاصی ندارند هم با ارقام فارسی نمایش داده می‌شوند
  const renderValue = (column, row) => (column.render
    ? column.render(row)
    : column.key === 'date'
      ? formatTableDate(row[column.key])
      : column.key === 'currency'
        ? currencyLabel(row[column.key])
        : toPersianDigits(String(row[column.key] ?? '—')));

  if (!rows.length) return <div className="v21-data-table rounded-xl border border-[#cbd9e8] bg-white p-10 text-center text-sm text-slate-500">موردی برای نمایش وجود ندارد.</div>;
  return (
    <div className="v21-data-table rounded-xl border border-[#cbd9e8] bg-white shadow-sm">
      <div className="v21-data-table-desktop overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-right text-xs">
          <thead className="sticky top-0 bg-gradient-to-l from-[#164b87] to-[#2767a5] text-white">
            <tr>
              {columns.map(c => {
                const active = sort.key === c.key;
                return (
                  <th key={c.key} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className="border-l border-white/15 p-0 font-bold">
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      title={`مرتب‌سازی بر اساس ${c.label}`}
                      className="flex w-full items-center justify-between gap-1 px-3 py-3 text-right hover:bg-white/10"
                    >
                      <span>{c.label}</span>
                      {active
                        ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />)
                        : <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-45" />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r, i) => (
              <tr
                key={r.id || i}
                onClick={() => { onSelect(r); if (onOpen) onOpen(r); }}
                title={onOpen ? 'کلیک روی ردیف، جزئیات همان رکورد را باز می‌کند' : undefined}
                className={'cursor-pointer transition-colors ' + (selected?.id === r.id ? 'bg-blue-100' : i % 2 ? 'bg-[#f7faff]' : 'bg-white') + ' hover:bg-blue-50'}
              >
                {columns.map((c, index) => (
                  <td key={c.key} className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3 text-[#263c55]">
                    {onOpen && index === 0 ? (
                      <button
                        type="button"
                        onClick={event => { event.stopPropagation(); onSelect(r); onOpen(r); }}
                        className="text-right font-bold text-[#164b87] underline-offset-2 hover:underline"
                      >
                        {renderValue(c, r)}
                      </button>
                    ) : renderValue(c, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="v21-data-table-mobile">
        {sortedRows.map((r, i) => (
          <div
            role="button"
            tabIndex={0}
            key={r.id || i}
            onClick={() => { onSelect(r); if (onOpen) onOpen(r); }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(r);
                if (onOpen) onOpen(r);
              }
            }}
            aria-pressed={Boolean(selected && selected.id === r.id)}
            className={'v21-record-card w-full rounded-xl border p-3 text-right transition ' + (selected?.id === r.id ? 'is-selected' : '')}
          >
            <div className="v21-record-card-title block border-b pb-2 text-sm font-extrabold">
              {onOpen && columns[0] ? (
                <button
                  type="button"
                  onClick={event => { event.stopPropagation(); onSelect(r); onOpen(r); }}
                  className="text-right underline-offset-2 hover:underline"
                >
                  {renderValue(columns[0], r)}
                </button>
              ) : (columns[0] ? renderValue(columns[0], r) : 'رکورد ' + (i + 1))}
            </div>
            {columns[0] && <span className="v21-record-card-primary-label block pt-1 text-[10px]">{columns[0].label}</span>}
            <div className={'mt-2 grid-cols-2 gap-x-3 gap-y-2 text-xs ' + (expandedId === (r.id || i) ? 'grid' : 'grid md:hidden')}>
              {columns.slice(1).map(c => (
                <div key={c.key} className="v21-record-card-field flex min-w-0 flex-col gap-1">
                  <span className="v21-record-card-label">{c.label}</span>
                  <div className="v21-record-card-value break-words">{renderValue(c, r)}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setExpandedId(current => (current === (r.id || i) ? null : (r.id || i)));
              }}
              aria-expanded={expandedId === (r.id || i)}
              className="v21-record-card-select mt-3 hidden w-full items-center justify-center gap-1 rounded-lg border border-[#b6c4cf] bg-[#f2f6f9] px-2 py-2 text-[10px] font-bold text-[#294d69] hover:border-[#47799d] hover:bg-blue-50 md:flex"
            >
              {expandedId === (r.id || i) ? 'بستن جزئیات' : 'نمایش جزئیات'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const MODULE_TONES = {
  home: 'from-blue-700 to-indigo-700', customers: 'from-sky-600 to-blue-700', customerLedger: 'from-emerald-600 to-teal-700',
  branches: 'from-violet-600 to-indigo-700', branchLedger: 'from-cyan-600 to-blue-700', cash: 'from-amber-500 to-orange-600',
  banks: 'from-blue-600 to-indigo-700', exchange: 'from-fuchsia-600 to-purple-700', remittance: 'from-orange-500 to-amber-600',
  expenses: 'from-rose-600 to-red-700', journal: 'from-slate-600 to-slate-800', ledger: 'from-indigo-600 to-violet-700',
  accounts: 'from-cyan-600 to-teal-700', currencies: 'from-lime-600 to-green-700', reports: 'from-blue-600 to-cyan-700',
  profit: 'from-emerald-600 to-green-700', activity: 'from-slate-600 to-blue-700', errors: 'from-rose-600 to-pink-700',
  balance: 'from-violet-600 to-purple-700', debtors: 'from-rose-600 to-emerald-700', sarraafGroups: 'from-sky-600 to-cyan-700',
  assistant: 'from-indigo-600 to-blue-800', products: 'from-orange-500 to-pink-600', language: 'from-teal-600 to-cyan-700',
};

export function Tile({ icon: Icon, label, onClick, moduleId }) {
  const tone = MODULE_TONES[moduleId] || 'from-blue-600 to-indigo-700';
  return (
    <button
      onClick={onClick}
      className="v21-module-tile group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border border-[#d2deec] bg-gradient-to-b from-white to-[#f1f6fd] px-2 py-3 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:translate-y-px"
    >
      <span className={'v21-module-icon grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ' + tone + ' text-white shadow-md ring-1 ring-white/70 group-hover:scale-105'}>
        <Icon className="h-6 w-6" />
      </span>
      <b className="text-[11px] font-bold leading-tight text-[#203b5b]">{label}</b>
    </button>
  );
}