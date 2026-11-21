import React from 'react';
import { ShieldCheck, UserCog } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { Notice } from '@/components/forms/FormField';
import { useRole } from '@/lib/role-context';
import { PERMISSIONS, ROLE_ORDER, ROLES, ROLE_SUMMARY, can } from '@/lib/rbac';
import { cn } from '@/lib/utils';

const PERMISSION_LABELS = {
  'dashboard.view': 'مشاهدهٔ داشبورد',
  'customers.view': 'مشاهدهٔ مشتریان',
  'customers.manage': 'ایجاد و ویرایش مشتری',
  'trade.post': 'ثبت معامله',
  'cash.view': 'مشاهدهٔ صندوق',
  'cash.post': 'ثبت دخل و خرج صندوق',
  'bank.view': 'مشاهدهٔ بانک',
  'bank.post': 'مدیریت حساب بانکی',
  'transfers.view': 'مشاهدهٔ حواله‌ها',
  'transfers.post': 'ثبت حواله',
  'convert.post': 'تبدیل ارز',
  'journal.view': 'دفتر روزنامه',
  'journal.post': 'ثبت سند دستی',
  'ledger.view': 'دفاتر و تراز',
  'reports.view': 'گزارش‌ها',
  'profit.view': 'سود و زیان',
  'debtors.view': 'بدهکاران',
  'agents.view': 'مشاهدهٔ نمایندگی‌ها',
  'agents.manage': 'مدیریت نمایندگی‌ها',
  'users.view': 'مشاهدهٔ کاربران',
  'users.manage': 'مدیریت کاربران',
  'settings.view': 'مشاهدهٔ تنظیمات',
  'settings.manage': 'تغییر تنظیمات',
  'audit.view': 'رویدادهای سیستم',
  'builder.view': 'پنل سازنده',
  'roadmap.view': 'وضعیت و نگاشت',
  'document.reverse': 'ابطال سند',
};

const DEMO_USERS = [
  { name: 'سازنده سیستم', role: 'creator', status: 'فعال' },
  { name: 'مدیر صرافی', role: 'admin', status: 'فعال' },
  { name: 'صراف ارشد', role: 'sarraaf', status: 'فعال' },
  { name: 'کارمند صندوق', role: 'employee', status: 'فعال' },
  { name: 'مشتری نمونه', role: 'customer', status: 'فعال' },
];

export default function Users() {
  const { role, setRole } = useRole();

  return (
    <div className="space-y-4">
      <PageHeader
        title="کاربران و نقش‌ها"
        description="نقش‌ها و مجوزهای استخراج‌شده از سورس A1. در این نسخهٔ آزمایشی احراز هویت واقعی وجود ندارد و نقش فعال از نوار بالا شبیه‌سازی می‌شود."
        icon={ShieldCheck}
        badge="شبیه‌سازی"
      />

      <Notice>
        هیچ کاربر واقعی، رمز عبور یا نشست در این برنامه ذخیره نمی‌شود. مدیریت کاربران در نسخهٔ نهایی به سرویس احراز هویت
        متصل خواهد شد؛ ساختار نقش‌ها و ماتریس دسترسی آماده است.
      </Notice>

      <SectionCard title="نقش‌ها" description="برای بررسی رابط کاربری، نقش فعال را تغییر دهید">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_SUMMARY.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => setRole(item.role)}
              className={cn(
                'rounded-xl border p-2.5 text-right transition-colors',
                role === item.role ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-card hover:bg-secondary/50'
              )}
            >
              <p className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold">{ROLES[item.role].label}</span>
                <StatusBadge label={role === item.role ? 'فعال' : `سطح ${ROLES[item.role].level}`} tone={role === item.role ? 'emerald' : 'slate'} />
              </p>
              <p className="mt-1 text-[10.5px] leading-5 text-muted-foreground">{item.scope}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="ماتریس دسترسی" description="علامت ✓ یعنی نقش به این عملیات مجاز است">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-right">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-[10.5px] font-bold text-muted-foreground">مجوز</th>
                {ROLE_ORDER.map((key) => (
                  <th key={key} className="px-1 py-2 text-center text-[10px] font-bold text-muted-foreground">
                    {ROLES[key].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(PERMISSIONS).map((permission) => (
                <tr key={permission} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-1.5 text-[11px]">{PERMISSION_LABELS[permission] || permission}</td>
                  {ROLE_ORDER.map((key) => (
                    <td key={key} className="px-1 py-1.5 text-center">
                      {can(key, permission) ? (
                        <span className="text-[12px] font-bold text-emerald-600">✓</span>
                      ) : (
                        <span className="text-[12px] text-border">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="کاربران نمونه" description="فهرست نمایشی برای بررسی سناریوها">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_USERS.map((user) => (
            <div key={user.name} className="flex items-center justify-between rounded-lg border border-border/70 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-primary">
                  <UserCog className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11.5px] font-bold">{user.name}</p>
                  <p className="text-[9.5px] text-muted-foreground">{ROLES[user.role].label}</p>
                </div>
              </div>
              <StatusBadge label={user.status} tone="emerald" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}