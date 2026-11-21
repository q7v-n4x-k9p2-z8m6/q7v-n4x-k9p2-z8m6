// a1/components/v21/access/EmployeeAccessCard.jsx — اطلاعات حساب و ماتریس مجوزهای یک کارمند (نمایشی)
import React from 'react';
import { Power, ShieldCheck, KeyRound, Ban } from 'lucide-react';
import { ROLE_LABELS } from './accessDemoData';
import {
  MODULE_MATRIX, CENTER_MATRIX, PERMISSION_ACTIONS,
  permissionSummary, sectionActionCount, accessCounts, SHARED_KEY_GROUPS, isRealOp, realOpsFor,
} from './accessMatrix';

function InfoCell({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e6eef5] bg-[#fbfdff] px-2 py-1.5">
      <span className="block text-[9px] text-slate-500">{label}</span>
      <b className="mt-0.5 block truncate text-[10.5px] font-bold text-[#253746]" dir="auto">{value || '—'}</b>
    </div>
  );
}

function PermissionRow({ row, permissions, locked, onToggle }) {
  const real = realOpsFor(row.id).length;
  return (
    <div className="rounded-lg border border-[#e6eef5] bg-[#fbfdff] px-2 py-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {row.no ? <span className="num shrink-0 text-[9px] text-slate-400">{row.no}.</span> : null}
          <b className="text-[10.5px] font-bold text-[#253746]">{row.label}</b>
          <code dir="ltr" className="rounded border border-[#dbe6f0] bg-white px-1 py-0.5 font-mono text-[9px] leading-4 text-[#2a5477]">{row.key}</code>
          {row.sharedWith && row.sharedWith.length ? (
            <span
              title={'کلید مشترک با: ' + row.sharedWith.join(' · ')}
              className="rounded-full border border-[#e6d9b8] bg-[#fdf8ec] px-1.5 py-0.5 text-[8.5px] text-[#8f7434]"
            >
              کلید مشترک
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[9px] text-slate-400">{real} عملیات واقعی</span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {PERMISSION_ACTIONS.map((action) => {
          const on = permissions?.[row.key]?.[action.key] === true;
          const executable = isRealOp(row.id, action.key);
          return (
            <button
              key={action.key}
              type="button"
              aria-pressed={on}
              disabled={locked}
              title={executable ? undefined : 'برای این مجوز در موتور مسیر اجرایی وجود ندارد؛ فقط نمایشی است.'}
              onClick={() => onToggle(row.key, action.key)}
              className={'rounded-md border px-1.5 py-1 text-[9.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' + (on ? 'border-[#1e4776] bg-[#e8f1fb] text-[#1e4776]' : 'border-[#dbe6f0] bg-white text-slate-400')}
            >
              {action.label}
              {executable ? null : <span className="mt-0.5 block text-[8px] font-normal text-amber-600">فقط نمایشی</span>}
            </button>
          );
        })}
      </div>
      {row.note ? (
        <p className="mt-1 flex items-start gap-1 text-[8.5px] leading-4 text-slate-500">
          <Ban className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-300" />
          <span>{row.note}</span>
        </p>
      ) : null}
    </div>
  );
}

function MatrixGroup({ title, hint, rows, permissions, locked, onToggle }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <b className="inline-flex items-center gap-1 text-[11px] text-[#1e4776]">
          <ShieldCheck className="h-3.5 w-3.5" /> {title}
        </b>
        <span className="text-[9px] text-slate-500">{hint}</span>
      </div>
      {rows.map((row) => (
        <PermissionRow key={row.id} row={row} permissions={permissions} locked={locked} onToggle={onToggle} />
      ))}
    </div>
  );
}

export default function EmployeeAccessCard({ employee, onToggleStatus, onTogglePermission }) {
  const summary = permissionSummary(employee.permissions);
  const counts = accessCounts();
  const locked = employee.locked === true;

  return (
    <section className="rounded-xl border border-[#c9d7e3] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2eaf1] bg-[#f2f7fb] px-3 py-2">
        <div className="min-w-0">
          <b className="block truncate text-xs text-[#1e4776]">اطلاعات حساب و مجوزها</b>
          <span className="mt-0.5 block truncate text-[9.5px] text-slate-500">
            {employee.name} · {ROLE_LABELS[employee.role] || employee.role}
          </span>
        </div>
        <span className={'shrink-0 rounded-full border px-2 py-0.5 text-[9px] ' + (employee.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600')}>
          {employee.status === 'active' ? 'فعال' : 'غیرفعال'}
        </span>
      </header>

      <div className="space-y-2.5 p-3">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <InfoCell label="نام کاربری" value={employee.username} />
          <InfoCell label="شماره تماس" value={employee.mobile} />
          <InfoCell label="تاریخ افزودن" value={employee.joined} />
          <InfoCell label="آخرین ورود" value={employee.lastSeen} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e6eef5] bg-[#fbfdff] px-2 py-2">
          <div className="min-w-0">
            <b className="block text-[10.5px] text-[#253746]">وضعیت دسترسی</b>
            <span className="mt-0.5 block text-[9.5px] text-slate-500">
              {summary.sections} مورد قابل مشاهده از {summary.totalSections} · {summary.actions} مجوز انتخاب‌شده از {summary.totalActions}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={locked}
            className={'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold disabled:cursor-not-allowed disabled:opacity-50 ' + (employee.status === 'active' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}
          >
            <Power className="h-3.5 w-3.5" />
            {employee.status === 'active' ? 'غیرفعال کردن حساب' : 'فعال کردن حساب'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <b className="inline-flex items-center gap-1 text-[11px] text-[#1e4776]">
            <KeyRound className="h-3.5 w-3.5" /> ماتریس مجوزها
          </b>
          <span className="text-[9px] text-slate-500">
            {counts.rows} مورد · {counts.slots} جایگاه · {counts.uniqueKeys} کلید یکتا
          </span>
        </div>

        <MatrixGroup
          title="بخش‌های اصلی پنل"
          hint={MODULE_MATRIX.length + ' بخش · ۱ تا ۲۵'}
          rows={MODULE_MATRIX}
          permissions={employee.permissions}
          locked={locked}
          onToggle={onTogglePermission}
        />

        <MatrixGroup
          title="مراکز مستقل پنل"
          hint={CENTER_MATRIX.length + ' مرکز'}
          rows={CENTER_MATRIX}
          permissions={employee.permissions}
          locked={locked}
          onToggle={onTogglePermission}
        />

        <p className="rounded-lg border border-dashed border-[#d5e2f0] bg-[#f7fafd] px-2 py-1.5 text-[9px] leading-5 text-slate-500">
          کلید فنی هر سطر همان «بخش» مجوز در موتور است: {counts.storedPermissions} مجوز متمایز ذخیره می‌شود. {counts.sharedGroups} کلید میان {counts.sharedRows} سطر مشترک است؛ تغییر آن، همهٔ سطرهای همان کلید را با هم تغییر می‌دهد و سطر تکراری حذف نشده است.
        </p>

        <p className="rounded-lg border border-dashed border-[#e6d9b8] bg-[#fdf8ec] px-2 py-1.5 text-[9px] leading-5 text-[#8f7434]">
          {counts.realPermissions} جایگاه اجرایی است؛ {counts.displayOnlyPermissions} جایگاه فقط نمایشی است، چون موتور برای آن‌ها مسیر نوشتن یا ابطال ندارد.
        </p>

        {locked ? (
          <p className="rounded-lg border border-dashed border-[#e6d9b8] bg-[#fdf8ec] px-2 py-1.5 text-[9.5px] leading-5 text-[#8f7434]">
            مجوزهای رئیس صرافی ثابت است و از این صفحه تغییر نمی‌کند.
          </p>
        ) : null}
      </div>
    </section>
  );
}