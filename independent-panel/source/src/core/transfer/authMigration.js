// src/core/transfer/authMigration.js — طرح مهاجرت احراز هویت و نقش‌ها (بدون اتصال واقعی)
// در این محیط هیچ ورود واقعی، رمز، توکن یا هویت بیرونی فعال نمی‌شود.
// این فایل فقط نگاشت نقش‌ها، نقاط اجرای مجوز و تصمیم‌های باقی‌مانده را ثبت می‌کند.

export const AUTH_ENFORCEMENT_POINTS = [
  { key: 'shell-guard', title: 'گیت پوسته', detail: 'A1Guard مسیرهای پنل صراف و پنل مشتری را بر پایهٔ نقش نشست می‌بندد.' },
  { key: 'section-permission', title: 'مجوز بخش‌ها', detail: 'checkPermission روی بخش هر ماژول، نمایش و دکمه‌های عملیات را تعیین می‌کند.' },
  { key: 'role-hierarchy', title: 'سلسله‌مراتب نقش', detail: 'canManageRole اجازهٔ مدیریت نقش پایین‌تر را می‌دهد و مدیریت نقش بالاتر را رد می‌کند.' },
  { key: 'demo-session', title: 'نشست آزمایشی', detail: 'نشست نمایشی فقط محلی است و هیچ درخواست احراز هویت ارسال نمی‌کند؛ در نسخهٔ واقعی جای خود را به نشست پلتفرم می‌دهد.' },
];

export const ROLE_MIGRATION = [
  {
    local: 'creator', level: 100, platformRole: 'admin', sarraafLevel: 'owner',
    target: 'مالک فضای کاری (Base44 workspace owner)',
    notes: 'دسترسی کامل؛ مدیریت کاربران و تنظیمات سطح بالا.',
  },
  {
    local: 'admin', level: 80, platformRole: 'admin', sarraafLevel: 'owner',
    target: 'نقش admin پلتفرم',
    notes: 'همان سطح مدیر صرافی؛ دسترسی کامل به داده و کاربران.',
  },
  {
    local: 'sarraaf', level: 50, platformRole: 'user', sarraafLevel: 'owner',
    target: 'نقش user با فیلد sarraaf_level = owner',
    notes: 'نقش صراف؛ نقش پلتفرم تغییر نمی‌کند و تخصص با فیلد جدا نگه داشته می‌شود.',
  },
  {
    local: 'employee', level: 30, platformRole: 'user', sarraafLevel: 'staff',
    target: 'نقش user با فیلد sarraaf_level = staff',
    notes: 'دسترسی بخش‌ها از جدول مجوز کارمند می‌آید، نه از نقش پلتفرم.',
  },
  {
    local: 'customer', level: 10, platformRole: 'user', sarraafLevel: 'customer',
    target: 'نقش user با فیلد sarraaf_level = customer',
    notes: 'فقط پوستهٔ مشتری؛ هیچ مسیر پنل صراف باز نیست.',
  },
];

export const AUTH_OPEN_DECISIONS = [
  {
    key: 'exchange-scope',
    question: 'جداسازی داده به‌ازای هر صرافی چگونه اعمال شود؟',
    options: ['فیلد exchange_code روی هر رکورد و شرط دسترسی', 'فضای کاری جدا برای هر صرافی'],
    impact: 'بدون این تصمیم، کاربر یک صرافی می‌تواند دادهٔ صرافی دیگر را ببیند.',
  },
  {
    key: 'permission-store',
    question: 'مجوز کارمند کجا نگه داشته شود؟',
    options: ['جدول مجوز اختصاصی', 'فیلد روی کاربر با فهرست بخش‌های مجاز'],
    impact: 'شکل ذخیره، قاعدهٔ RLS و صفحهٔ مدیریت کاربران را تعیین می‌کند.',
  },
  {
    key: 'session-source',
    question: 'نشست واقعی از کدام مسیر بیاید؟',
    options: ['ورود پلتفرم Base44', 'ورود سازمانی (SSO)'],
    impact: 'بازنشانی رمز، دعوت کاربر و بازبینی نشست به همان مسیر وابسته می‌شود.',
  },
  {
    key: 'invite-policy',
    question: 'کارمند جدید چگونه اضافه شود؟',
    options: ['دعوت مدیر صرافی', 'درخواست ثبت‌نام و تأیید'],
    impact: 'دعوت، فهرست کاربران و ایمیل پلتفرم را درگیر می‌کند؛ درخواست، صف تأیید می‌سازد.',
  },
];

export const isRoleMapped = (role) => ROLE_MIGRATION.some((row) => row.local === role);