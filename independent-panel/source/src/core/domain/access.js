// src/core/domain/access.js — قواعد مجوز (بدون وابستگی به پلتفرم)
// لایهٔ احراز هویت قابل تعویض است؛ اما شکل دادهٔ مجوز و قاعدهٔ بررسی آن ثابت و مشترک می‌ماند.
import { moduleSection } from '@/core/registry/modules';

export function checkPermission(permissions, section, action) {
  if (!permissions || permissions.length === 0) return false;
  const permission = permissions.find((item) => item.section === section);
  if (!permission) return false;
  return permission[`can_${action}`] === true;
}

export const ROLE_HIERARCHY = {
  creator: 100,
  admin: 80,
  sarraaf: 50,
  exchange: 50,
  employee: 30,
  customer: 10,
};

export function roleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

export function canManageRole(myRole, targetRole) {
  return roleLevel(myRole) > roleLevel(targetRole);
}

// ——— یک قاعدهٔ واحد برای هر دو پوسته ———
// فقط نقش «کارمند» به جدول مجوزها محدود می‌شود؛ مدیر، صراف و سازنده دسترسی کامل دارند.
export const isRestrictedRole = (role) => String(role || '').toLowerCase() === 'employee';

export function canViewSection(role, permissions, section) {
  if (!isRestrictedRole(role)) return true;
  return checkPermission(permissions, section, 'view');
}

export function canSectionAction(role, permissions, section, action) {
  if (!isRestrictedRole(role)) return true;
  return checkPermission(permissions, section, action);
}

// بخش مجوز هر ماژول از رجیستری مرکزی خوانده می‌شود (با پذیرش نام جایگزین Harness)
export function canViewModuleId(role, permissions, id) {
  return canViewSection(role, permissions, moduleSection(id));
}

export function canModuleActionId(role, permissions, id, action) {
  return canSectionAction(role, permissions, moduleSection(id), action);
}