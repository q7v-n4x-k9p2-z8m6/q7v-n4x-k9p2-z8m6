// a1/components/v21/management/ManagementSectionPanel.jsx
// پوستهٔ اولیهٔ هر بخش مرکز مدیریت: چیدمان و کنترل‌های نمایشی، بدون خواندن یا نوشتن داده.
// تمام اقدام‌ها فعلاً غیرفعال‌اند و در مرحلهٔ یکپارچه‌سازی فعال می‌شوند.
import React from 'react';
import {
  ArrowRight, Search, Plus, CircleSlash, Users, UserPlus, KeyRound, Building2, Activity, Settings2,
} from 'lucide-react';
import { ROLE_LADDER } from '@/a1/data/managementArchitecture';
import { MANAGEMENT_SECTIONS_UI } from '@/a1/data/managementSections';

const EmptyBox = ({ title, hint }) => (
  <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-6 text-center">
    <CircleSlash className="mx-auto h-5 w-5 text-muted-foreground" />
    <b className="mt-1 block text-[11px] text-foreground">{title}</b>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
  </div>
);

const TableHead = ({ columns }) => (
  <thead className="text-muted-foreground">
    <tr className="border-b border-border/60">
      {columns.map(column => <th key={column} className="py-1 font-bold">{column}</th>)}
    </tr>
  </thead>
);

function UsersPanel() {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex min-w-[180px] flex-1 items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>جست‌وجوی نام، نقش یا وضعیت — مرحلهٔ بعد</span>
        </div>
        <span className="rounded-lg border border-border bg-secondary/50 px-2 py-1.5 text-[10px] font-bold text-slate-600">کاربران</span>
        <span className="rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-bold text-slate-400">مشتریان</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[420px] text-right text-[10px]">
          <TableHead columns={['نام', 'نقش', 'وضعیت', 'آخرین ورود']} />
          <tbody>
            <tr>
              <td colSpan={4} className="py-4 text-center text-[10px] text-muted-foreground">
                در این مرحله هیچ کاربری خوانده یا ساخته نمی‌شود؛ این جدول جایگاه فهرست آینده است.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffPanel() {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] text-muted-foreground">کارکنان صراف، سمت و شعبهٔ هرکدام</span>
        <button type="button" disabled title="فعال‌سازی در مرحلهٔ بعد"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 text-[10px] font-bold text-slate-400">
          <Plus className="h-3.5 w-3.5" /> افزودن کارمند
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[420px] text-right text-[10px]">
          <TableHead columns={['نام کارمند', 'سمت', 'شعبه', 'وضعیت']} />
          <tbody>
            <tr>
              <td colSpan={4} className="py-4 text-center text-[10px] text-muted-foreground">
                هنوز کارمندی ثبت نشده است؛ ثبت کارمند در مرحلهٔ بعد فعال می‌شود.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesPanel() {
  return (
    <div className="space-y-1.5">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {ROLE_LADDER.map(item => (
          <div key={item.role} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-2 py-1.5">
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">{item.level}</span>
            <div className="min-w-0">
              <b className="block text-[10px] text-foreground">{item.role}</b>
              <p className="text-[9px] leading-5 text-muted-foreground">{item.scope}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] leading-5 text-amber-900">
        ماتریس مجوز بخش‌ها و پیش‌نمایش نمای کارمند در همین بخش قرار می‌گیرد؛ تغییر واقعی مجوز در این مرحله انجام نمی‌شود.
      </p>
    </div>
  );
}

function BranchesPanel() {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] text-muted-foreground">شعب داخلی و نمایندگی‌های طرف حساب</span>
        <button type="button" disabled title="فعال‌سازی در مرحلهٔ بعد"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 text-[10px] font-bold text-slate-400">
          <Plus className="h-3.5 w-3.5" /> تعریف شعبه
        </button>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <EmptyBox title="شعب داخلی" hint="فهرست شعب و مسئول هر شعبه اینجا نمایش داده می‌شود." />
        <EmptyBox title="نمایندگی‌ها" hint="نمایندگی‌ها طرف حساب‌اند و در این بخش پیگیری می‌شوند." />
      </div>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {['همهٔ رویدادها', 'ورود و خروج', 'تغییر دسترسی', 'عملیات حساس'].map((label, index) => (
          <span key={label} className={'rounded-full border px-2 py-1 text-[9px] font-bold ' + (
            index === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-slate-500'
          )}>{label}</span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[420px] text-right text-[10px]">
          <TableHead columns={['تاریخ', 'کاربر', 'رویداد', 'جزئیات']} />
          <tbody>
            <tr>
              <td colSpan={4} className="py-4 text-center text-[10px] text-muted-foreground">
                سوابق فعالیت در مرحلهٔ اتصال به ردپای حسابرسی نمایش داده می‌شود.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const items = [
    { title: 'سیاست رمز عبور', hint: 'طول، پیچیدگی و الزام تغییر دوره‌ای' },
    { title: 'مدت اعتبار نشست', hint: 'بستن خودکار نشست‌های بی‌استفاده' },
    { title: 'قفل حساب', hint: 'قفل پس از تلاش‌های ناموفق ورود' },
    { title: 'تأییدیهٔ عملیات حساس', hint: 'الزام تأیید برای ابطال و تغییر مجوز' },
  ];
  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.title} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-2 py-1.5">
          <div className="min-w-0">
            <b className="block text-[10px] text-foreground">{item.title}</b>
            <p className="text-[9px] leading-4 text-muted-foreground">{item.hint}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[9px] font-bold text-slate-400">
            مرحلهٔ بعد
          </span>
        </div>
      ))}
    </div>
  );
}

const SECTION_ICONS = {
  users: Users,
  staff: UserPlus,
  roles: KeyRound,
  branches: Building2,
  activity: Activity,
  settings: Settings2,
};

const PANELS = {
  users: UsersPanel,
  staff: StaffPanel,
  roles: RolesPanel,
  branches: BranchesPanel,
  activity: ActivityPanel,
  settings: SettingsPanel,
};

export default function ManagementSectionPanel({ sectionId, onBack }) {
  const section = MANAGEMENT_SECTIONS_UI.find(item => item.id === sectionId);
  if (!section) return null;
  const Panel = PANELS[section.id];
  const Icon = SECTION_ICONS[section.id] || Users;

  return (
    <section className="rounded-xl border border-border bg-card p-2.5">
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate text-[11px] font-extrabold text-primary">{section.title}</h2>
        </div>
        <span className="ms-auto rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-800">
          پوستهٔ اولیه — بدون داده
        </span>
      </div>
      <p className="mb-2 text-[10px] leading-5 text-muted-foreground">{section.description}</p>
      <Panel />
    </section>
  );
}