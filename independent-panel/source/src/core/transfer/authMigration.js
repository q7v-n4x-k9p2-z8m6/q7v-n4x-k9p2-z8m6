// src/core/transfer/authMigration.js — سیاست قطعی هویت نسخهٔ ۲۲؛ اتصال واقعی هنوز غیرفعال است.
// هیچ رمز، توکن یا درخواست احراز هویت واقعی در محیط مستقل ساخته یا ذخیره نمی‌شود.
export const AUTH_DEFAULT_POLICY = Object.freeze({
  tenantIsolation: 'exchange_code + membership + RLS',
  permissionStore: 'user_permissions',
  sessionSource: 'Supabase Edge Function with username/password',
  employeeInvite: 'owner-created',
  sessionPersistence: 'until-explicit-logout',
  loginFields: ['username', 'password'],
  emailRequired: false,
  otpRequired: false,
  passwordStorage: 'server-side salted password hash; never plaintext',
  clientSecretStorage: false,
});

export const AUTH_ENFORCEMENT_POINTS = [
  { key: 'shell-guard', title: 'گیت پوسته', detail: 'A1Guard مسیرهای پنل صراف و پنل مشتری را بر پایهٔ نقش نشست می‌بندد.' },
  { key: 'section-permission', title: 'مجوز بخش‌ها', detail: 'checkPermission روی بخش هر ماژول، نمایش و دکمه‌های عملیات را تعیین می‌کند.' },
  { key: 'role-hierarchy', title: 'سلسله‌مراتب نقش', detail: 'canManageRole اجازهٔ مدیریت نقش پایین‌تر را می‌دهد و مدیریت نقش بالاتر را رد می‌کند.' },
  { key: 'demo-session', title: 'نشست آزمایشی', detail: 'نشست نمایشی فقط محلی است؛ در نسخهٔ واقعی توکن فقط از درگاه سرور و با انقضا/خروج صریح مدیریت می‌شود.' },
  { key: 'tenant-rls', title: 'جداسازی سمت سرور', detail: 'هر درخواست با exchange_code نشست و عضویت همان صرافی محدود و در RLS دوباره کنترل می‌شود.' },
  { key: 'server-permission', title: 'مجوز سمت سرور', detail: 'مجوز هر بخش و عملیات از user_permissions خوانده می‌شود؛ مخفی‌کردن دکمه به‌تنهایی کنترل امنیت نیست.' },
];

export const ROLE_MIGRATION = [
  {
    local: 'creator', level: 100, platformRole: 'creator', sarraafLevel: 'owner',
    target: 'V22 users.role = creator با سطح مالک صرافی',
    notes: 'دسترسی کامل؛ مدیریت کاربران و تنظیمات سطح بالا.',
  },
  {
    local: 'admin', level: 80, platformRole: 'admin', sarraafLevel: 'owner',
    target: 'V22 users.role = admin با سطح مدیر',
    notes: 'همان سطح مدیر صرافی؛ دسترسی کامل به داده و کاربران.',
  },
  {
    local: 'sarraaf', level: 50, platformRole: 'sarraaf', sarraafLevel: 'owner',
    target: 'V22 users.role = sarraaf با سطح مالک صرافی',
    notes: 'نقش صراف؛ نقش پلتفرم تغییر نمی‌کند و تخصص با فیلد جدا نگه داشته می‌شود.',
  },
  {
    local: 'employee', level: 30, platformRole: 'employee', sarraafLevel: 'staff',
    target: 'V22 users.role = employee با مجوزهای user_permissions',
    notes: 'دسترسی بخش‌ها از جدول مجوز کارمند می‌آید، نه از نقش پلتفرم.',
  },
  {
    local: 'customer', level: 10, platformRole: 'customer', sarraafLevel: 'customer',
    target: 'V22 users.role = customer با پوستهٔ محدود مشتری',
    notes: 'فقط پوستهٔ مشتری؛ هیچ مسیر پنل صراف باز نیست.',
  },
];

export const AUTH_OPEN_DECISIONS = [];

export const isRoleMapped = (role) => ROLE_MIGRATION.some((row) => row.local === role);