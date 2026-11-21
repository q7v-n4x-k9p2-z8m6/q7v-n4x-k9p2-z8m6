// src/core/audit/linkAudit.js — اجرای ماتریس زنجیرهٔ ناوبری روی هر دو محیط و همهٔ نقش‌ها
// هر مسیر از ماتریس یک بار برای هر نقش سنجیده می‌شود و نتیجه PASS / FAIL / SKIP می‌گیرد.
// قاعده: مرجع موجود ولی مقصد ناموجود = FAIL · مرجع ثبت‌نشده = SKIP با دلیل · همه پیوندخورده = PASS.
// این ماژول هیچ داده‌ای نمی‌نویسد و هیچ سندی نمی‌سازد.
import { LINK_CHAIN, AUDIT_ROLES, ROW, countRows } from '@/core/navigation/linkMatrix';
import { canViewModuleId } from '@/core/domain/access';
import { moduleSection } from '@/core/registry/modules';

export const AUDIT_STATUS = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };

const text = (value) => String(value ?? '').trim();

// نقش کارمند روی جدول مجوزها محدود می‌شود؛ در دادهٔ نمایشی همهٔ بخش‌ها برای او مجاز شده‌اند.
// نقش مشتری وارد میز کار صراف نمی‌شود، پس مسیرهای میز کار برای او SKIP است، نه FAIL.
const ROLE_NOTE = {
  employee: 'کارمند روی جدول مجوزها کار می‌کند؛ در دادهٔ نمایشی مشاهدهٔ همهٔ بخش‌ها برای او مجاز است.',
  customer: 'پنل مشتری به میز کار صراف دسترسی ندارد؛ مسیرهای میز کار برای این نقش سنجیده نمی‌شود.',
};

// مجوزهای نمونهٔ نقش کارمند در دادهٔ نمایشی: مشاهدهٔ همهٔ بخش‌های همین ماتریس
const EMPLOYEE_PERMISSIONS = [...new Set(LINK_CHAIN.map((route) => moduleSection(route.fromModule)))]
  .map((section) => ({ section, can_view: true }));

const permissionsForRole = (role) => (role === 'employee' ? EMPLOYEE_PERMISSIONS : null);

function statusOf(counts) {
  if (!counts.total) return { status: AUDIT_STATUS.skip, reason: 'داده‌ای برای این مسیر ثبت نشده است.' };
  if (counts.missing) {
    return {
      status: AUDIT_STATUS.fail,
      reason: `${counts.missing} ردیف مرجع دارد اما مقصدش پیدا نشد (${counts.linked} پیوند سالم).`,
    };
  }
  if (!counts.linked) return { status: AUDIT_STATUS.skip, reason: 'همهٔ ردیف‌ها مرجع مرتبط ندارند؛ مسیر نمایشی است.' };
  if (counts.noref) {
    return {
      status: AUDIT_STATUS.pass,
      reason: `${counts.linked} پیوند سالم؛ ${counts.noref} ردیف بدون مرجع مرتبط (به‌درستی SKIP شد).`,
    };
  }
  return { status: AUDIT_STATUS.pass, reason: `${counts.linked} پیوند سالم و بدون ردیف بی‌پیوند.` };
}

export function auditRoute(route, environment, source, role) {
  const base = {
    id: route.id,
    from: route.from,
    fromModule: route.fromModule,
    to: route.to,
    toModule: route.toModule,
    definition: route.definition,
  };
  if (role === 'customer') {
    return { ...base, counts: { total: 0, linked: 0, missing: 0, noref: 0 }, status: AUDIT_STATUS.skip, reason: ROLE_NOTE.customer };
  }
  if (!canViewModuleId(role, permissionsForRole(role), route.fromModule)) {
    return { ...base, counts: { total: 0, linked: 0, missing: 0, noref: 0 }, status: AUDIT_STATUS.skip, reason: 'این بخش برای این نقش مجاز نیست.' };
  }
  let counts;
  try {
    counts = countRows(route[environment](source));
  } catch (failure) {
    return {
      ...base,
      counts: { total: 0, linked: 0, missing: 0, noref: 0 },
      status: AUDIT_STATUS.fail,
      reason: failure?.message ? 'خطا در سنجش: ' + failure.message : 'خطا در سنجش این مسیر.',
    };
  }
  const result = statusOf(counts);
  return { ...base, counts, status: result.status, reason: result.reason };
}

export function runLinkAudit({ environment, source, roles = AUDIT_ROLES }) {
  return roles.map((role) => {
    const items = LINK_CHAIN.map((route) => auditRoute(route, environment, source, role.role));
    return {
      role: role.role,
      label: role.label,
      note: ROLE_NOTE[role.role] || '',
      items,
      summary: {
        total: items.length,
        pass: items.filter((item) => item.status === AUDIT_STATUS.pass).length,
        fail: items.filter((item) => item.status === AUDIT_STATUS.fail).length,
        skip: items.filter((item) => item.status === AUDIT_STATUS.skip).length,
      },
    };
  });
}

export function runBothEnvironments({ previewSource, harnessSource, roles = AUDIT_ROLES }) {
  const runs = [];
  if (previewSource) runs.push({ environment: 'preview', roles: runLinkAudit({ environment: 'preview', source: previewSource, roles }) });
  if (harnessSource) runs.push({ environment: 'harness', roles: runLinkAudit({ environment: 'harness', source: harnessSource, roles }) });
  return { generatedAt: new Date().toISOString(), runs };
}

// وضعیت‌ها برای نشان دادن تغییر پس از اصلاح
export function statusIndex(report) {
  const index = new Map();
  (report?.runs || []).forEach((run) => {
    run.roles.forEach((role) => {
      role.items.forEach((item) => index.set(run.environment + '::' + role.role + '::' + item.id, item.status));
    });
  });
  return index;
}

export const statusTone = (status) => {
  if (status === AUDIT_STATUS.pass) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === AUDIT_STATUS.fail) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === AUDIT_STATUS.skip) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-border bg-muted text-muted-foreground';
};

export const rowTone = ROW;
export const auditText = text;