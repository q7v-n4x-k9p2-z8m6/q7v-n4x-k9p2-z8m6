/**
 * rbac.js — کنترل دسترسی مبتنی بر نقش
 * نقش‌ها از سورس A1 استخراج شده‌اند: سازنده، مدیر صرافی، صراف، کارمند، مشتری.
 * در این نسخهٔ آزمایشی نقش‌ها شبیه‌سازی می‌شوند و احراز هویت واقعی وجود ندارد.
 */

export const ROLES = {
  creator: { level: 100, label: 'سازنده سیستم', panel: 'builder', tone: 'purple' },
  admin: { level: 80, label: 'مدیر صرافی', panel: 'sarraaf', tone: 'blue' },
  sarraaf: { level: 50, label: 'صراف', panel: 'sarraaf', tone: 'green' },
  employee: { level: 30, label: 'کارمند', panel: 'sarraaf', tone: 'yellow' },
  customer: { level: 10, label: 'مشتری', panel: 'customer', tone: 'gray' },
};

export const ROLE_ORDER = ['creator', 'admin', 'sarraaf', 'employee', 'customer'];

export const STAFF_ROLES = ['creator', 'admin', 'sarraaf', 'employee'];

export function roleLabel(role) {
  return ROLES[role]?.label || 'کاربر';
}

export function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

/**
 * ماتریس مجوزها. کلید هر مجوز یک عملیات یا بخش است.
 * «همهٔ کارکنان» به معنی creator/admin/sarraaf/employee است.
 */
const ALL_STAFF = STAFF_ROLES;
const MANAGERS = ['creator', 'admin'];
const OPERATORS = ['creator', 'admin', 'sarraaf'];

export const PERMISSIONS = {
  'dashboard.view': ALL_STAFF,
  'customers.view': ALL_STAFF,
  'customers.manage': OPERATORS,
  'trade.post': ALL_STAFF,
  'cash.view': ALL_STAFF,
  'cash.post': ALL_STAFF,
  'bank.view': ALL_STAFF,
  'bank.post': OPERATORS,
  'transfers.view': ALL_STAFF,
  'transfers.post': ALL_STAFF,
  'convert.post': OPERATORS,
  'journal.view': OPERATORS,
  'journal.post': MANAGERS,
  'ledger.view': OPERATORS,
  'reports.view': ALL_STAFF,
  'profit.view': OPERATORS,
  'debtors.view': OPERATORS,
  'agents.view': OPERATORS,
  'agents.manage': MANAGERS,
  'users.view': MANAGERS,
  'users.manage': MANAGERS,
  'settings.view': ALL_STAFF,
  'settings.manage': MANAGERS,
  'audit.view': MANAGERS,
  'builder.view': ['creator'],
  'roadmap.view': ALL_STAFF,
  'document.post': ALL_STAFF,
  'document.reverse': MANAGERS,
  'customer.portal': ['customer'],
};

export function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

export const ROLE_SUMMARY = [
  { role: 'creator', scope: 'دسترسی کامل + پنل سازنده، تنظیمات سیستم، مدیریت کاربران و رویدادها' },
  { role: 'admin', scope: 'کل عملیات صرافی، دفاتر، کاربران و تنظیمات (بدون پنل سازنده)' },
  { role: 'sarraaf', scope: 'عملیات روزانه، مشتریان، صندوق، حواله، دفاتر و گزارش‌ها (بدون مدیریت کاربران)' },
  { role: 'employee', scope: 'ثبت معامله، صندوق، حواله و مشاهدهٔ گزارش‌ها؛ بدون دفاتر و تنظیمات حساس' },
  { role: 'customer', scope: 'فقط پنل مشتری: مشاهدهٔ حواله‌ها و وضعیت حساب خود' },
];