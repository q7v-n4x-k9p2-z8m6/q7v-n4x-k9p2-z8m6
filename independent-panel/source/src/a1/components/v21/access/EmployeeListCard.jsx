// a1/components/v21/access/EmployeeListCard.jsx — فهرست کاربران و کارمندان (نمایشی)
import React from 'react';
import { Lock, UserRound } from 'lucide-react';
import { ROLE_LABELS, permissionSummary } from './accessDemoData';

const statusPill = (status) => (
  status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-slate-200 bg-slate-100 text-slate-600'
);

export default function EmployeeListCard({ employees, selectedId, onSelect }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-[#e2eaf1] bg-[#f2f7fb] px-3 py-2">
        <b className="text-xs text-[#1e4776]">فهرست کاربران و کارمندان</b>
        <span className="rounded-md border border-[#d9e5ef] bg-white px-1.5 py-0.5 text-[9px] text-slate-500">{employees.length} حساب نمایشی</span>
      </header>

      <ul className="divide-y divide-[#eef3f7]">
        {employees.map((employee) => {
          const active = employee.id === selectedId;
          const summary = permissionSummary(employee.permissions);
          return (
            <li key={employee.id}>
              <button
                type="button"
                onClick={() => onSelect(employee.id)}
                aria-pressed={active}
                className={'flex w-full items-center gap-2 px-3 py-2.5 text-right transition-colors ' + (active ? 'bg-[#eaf2fb]' : 'bg-white hover:bg-[#f7fafd]')}
              >
                <span className={'grid h-8 w-8 shrink-0 place-items-center rounded-lg border ' + (employee.role === 'owner' ? 'border-[#c6a65d]/40 bg-[#fbf5e6] text-[#8f7434]' : 'border-[#d9e5ef] bg-[#f5f9fc] text-[#2a5477]')}>
                  {employee.role === 'owner' ? <Lock className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                </span>

                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[11px] font-bold text-[#1e4776]">{employee.name}</b>
                  <small className="mt-0.5 block truncate text-[9.5px] text-slate-500">
                    {ROLE_LABELS[employee.role] || employee.role} · {summary.sections} بخش · {summary.actions} مجوز
                  </small>
                </span>

                <span className={'shrink-0 rounded-full border px-2 py-0.5 text-[9px] ' + statusPill(employee.status)}>
                  {employee.status === 'active' ? 'فعال' : 'غیرفعال'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-[#eef3f7] bg-[#fbfdff] px-3 py-2 text-[9.5px] leading-5 text-slate-500">
        ردیف رئیس صرافی همیشه دسترسی کامل دارد و از این صفحه قابل تغییر نیست. بقیهٔ ردیف‌ها نمونه‌اند.
      </p>
    </section>
  );
}