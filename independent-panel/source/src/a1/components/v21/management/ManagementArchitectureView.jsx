// a1/components/v21/management/ManagementArchitectureView.jsx
// نمای سند معماری مرکز مدیریت: بخش‌ها، زیرصفحه‌ها، نقش‌ها، ماتریس نمایش و مرزهای امنیتی.
// فقط مستند درون‌برنامه‌ای؛ هیچ کاربر، نقش یا مجوزی نمی‌سازد و داده‌ای نمی‌خواند.
import React from 'react';
import {
  UserCog, UserPlus, KeyRound, ShieldCheck, EyeOff, Building2, Activity, Lock, Settings2,
  Info, ArrowLeftRight, ShieldAlert, GitBranch,
} from 'lucide-react';
import {
  MANAGEMENT_INTRO, MANAGEMENT_SECTIONS, ROLE_LADDER, VISIBILITY_MATRIX, VISIBILITY_LABELS,
  STAFF_HIDDEN_ITEMS, WORKFLOWS, MODULE_RELATIONS, SECURITY_RULES, BUILD_ROADMAP, REMAINING_ITEMS,
} from '@/a1/data/managementArchitecture';

const ICONS = {
  users: UserCog,
  staff: UserPlus,
  credentials: KeyRound,
  permissions: ShieldCheck,
  visibility: EyeOff,
  branches: Building2,
  activity: Activity,
  roles: Lock,
  settings: Settings2,
};

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 border-b border-border/60 pb-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <h2 className="text-[11px] font-extrabold text-primary">{title}</h2>
        {subtitle && <span className="ms-auto text-[9px] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

const EmployeeCell = ({ value }) => {
  const meta = VISIBILITY_LABELS[value] || VISIBILITY_LABELS.hidden;
  return (
    <span className={'inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold ' + meta.tone}>
      {meta.label}
    </span>
  );
};

export default function ManagementArchitectureView() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-[10px] leading-5 text-sky-900">
        <p className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            این صفحه سند معماری است، نه مرکز مدیریت عملیاتی. هیچ کاربر، کارمند، شعبه، نقش یا مجوزی ساخته
            نمی‌شود و هیچ جدول یا اتصال جدیدی به وجود نمی‌آید. مرجع: {MANAGEMENT_INTRO.owner}.
          </span>
        </p>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-3">
        {[
          { label: 'مالک مرکز', value: MANAGEMENT_INTRO.owner },
          { label: 'دامنهٔ تصمیم', value: 'کاربر، کارمند، شعبه، نقش، مجوز' },
          { label: 'این مرحله', value: MANAGEMENT_INTRO.boundary },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-2">
            <span className="block text-[9px] text-muted-foreground">{item.label}</span>
            <b className="mt-0.5 block text-[10px] leading-5 text-foreground">{item.value}</b>
          </div>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {MANAGEMENT_SECTIONS.map(section => {
          const Icon = ICONS[section.icon] || ShieldCheck;
          return (
            <section key={section.key} className="rounded-xl border border-border bg-card p-2.5">
              <div className="mb-1.5 flex items-start gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[11px] font-extrabold text-primary">{section.title}</h2>
                  <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">{section.purpose}</p>
                </div>
              </div>

              <div className="mb-1.5 rounded-lg border border-border bg-secondary/30 p-1.5">
                <b className="mb-1 block text-[9px] font-bold text-foreground">وظایف</b>
                <ul className="space-y-0.5 text-[9px] leading-5 text-muted-foreground">
                  {section.capabilities.map(item => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-right text-[9px]">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/60">
                      <th className="py-1 font-bold">زیرصفحه</th>
                      <th className="py-1 font-bold">مسئولیت</th>
                      <th className="py-1 font-bold">کارمند</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.subpages.map(page => (
                      <tr key={page.title} className="border-b border-border/40 last:border-0">
                        <td className="py-1 font-bold text-foreground">{page.title}</td>
                        <td className="py-1 leading-4 text-muted-foreground">{page.duty}</td>
                        <td className="py-1"><EmployeeCell value={page.employee} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-1 text-[9px] leading-4 text-slate-500">
                منبع اطلاعات (آینده): {section.source}
              </p>
              <p className="text-[9px] leading-4 text-slate-500">
                ارتباط: {section.related.join(' · ')}
              </p>
              {section.rule && (
                <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-1 text-[9px] leading-4 text-amber-900">
                  قاعده: {section.rule}
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card icon={Lock} title="نقش‌های پایه و سلسله‌مراتب" subtitle="بدون نقش سفارشی">
          <ul className="space-y-1">
            {ROLE_LADDER.map(item => (
              <li key={item.role} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-2 py-1.5">
                <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                  {item.level}
                </span>
                <div className="min-w-0">
                  <b className="block text-[10px] text-foreground">{item.role}</b>
                  <p className="text-[9px] leading-5 text-muted-foreground">{item.scope}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[9px] text-muted-foreground">
            فقط نقش‌های موجود برنامه استفاده می‌شود؛ نقش تازه در این مرحله تعریف نمی‌شود.
          </p>
        </Card>

        <Card icon={ShieldAlert} title="آنچه از کارمند پنهان می‌ماند" subtitle="پنهان کامل">
          <ul className="space-y-1">
            {STAFF_HIDDEN_ITEMS.map(item => (
              <li key={item} className="rounded-lg border border-rose-200 bg-rose-50/70 px-2 py-1 text-[9px] leading-5 text-rose-900">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card icon={EyeOff} title="ماتریس نمایش بخش‌ها" subtitle="رئیس / کارمند / مشتری">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-right text-[10px]">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-1 font-bold">بخش</th>
                <th className="py-1 font-bold">رئیس صراف</th>
                <th className="py-1 font-bold">کارمند</th>
                <th className="py-1 font-bold">مشتری</th>
              </tr>
            </thead>
            <tbody>
              {VISIBILITY_MATRIX.map(row => (
                <tr key={row.section} className="border-b border-border/40 last:border-0">
                  <td className="py-1 font-bold text-foreground">{row.section}</td>
                  <td className="py-1"><EmployeeCell value={row.owner} /></td>
                  <td className="py-1"><EmployeeCell value={row.staff} /></td>
                  <td className="py-1"><EmployeeCell value={row.customer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[9px] text-muted-foreground">
          «محدود» یعنی فقط دادهٔ خود کارمند یا شعبهٔ خودش؛ «پنهان» یعنی نه در منو و نه با آدرس مستقیم.
        </p>
      </Card>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card icon={GitBranch} title="جریان‌های کاری" subtitle="۴ جریان">
          <ol className="space-y-1.5">
            {WORKFLOWS.map((flow, index) => (
              <li key={flow.title} className="rounded-lg border border-border bg-secondary/30 p-2">
                <b className="text-[10px] text-foreground">{index + 1}. {flow.title}</b>
                <ol className="mt-1 space-y-0.5 text-[9px] leading-5 text-muted-foreground">
                  {flow.steps.map((step, stepIndex) => <li key={step}>{stepIndex + 1}) {step}</li>)}
                </ol>
              </li>
            ))}
          </ol>
        </Card>

        <Card icon={ArrowLeftRight} title="ارتباط با سایر ماژول‌ها" subtitle="مرز منطقی">
          <ul className="space-y-1">
            {MODULE_RELATIONS.map(item => (
              <li key={item.module} className="rounded-lg border border-border bg-secondary/30 px-2 py-1.5">
                <b className="block text-[10px] text-foreground">{item.module}</b>
                <p className="text-[9px] leading-5 text-muted-foreground">{item.relation}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card icon={ShieldCheck} title="مرزهای امنیتی" subtitle="قواعد غیرقابل‌عبور">
        <ul className="grid gap-1 sm:grid-cols-2">
          {SECURITY_RULES.map(item => (
            <li key={item} className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-[9px] leading-5 text-emerald-900">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card icon={Building2} title="مسیر تکمیل" subtitle="بدون تغییر پایگاه داده">
          <ol className="space-y-1">
            {BUILD_ROADMAP.map(item => (
              <li key={item.step} className="flex gap-1.5 rounded-lg border border-border bg-secondary/30 px-2 py-1.5">
                <span className="text-[10px] font-bold text-primary">{item.step}</span>
                <div className="min-w-0">
                  <b className="block text-[10px] text-foreground">{item.title}</b>
                  <p className="text-[9px] leading-5 text-muted-foreground">{item.body}</p>
                </div>
                <span className={'ms-auto shrink-0 self-start rounded-full border px-1.5 py-0.5 text-[9px] font-bold ' + (
                  item.state === 'done'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : item.state === 'next'
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                  {item.state === 'done' ? 'انجام‌شده' : item.state === 'next' ? 'مرحلهٔ بعد' : 'بعدتر'}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card icon={Info} title="موارد باقی‌مانده" subtitle="خارج از این مرحله">
          <ul className="space-y-1">
            {REMAINING_ITEMS.map(item => (
              <li key={item} className="rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1 text-[9px] leading-5 text-amber-900">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}