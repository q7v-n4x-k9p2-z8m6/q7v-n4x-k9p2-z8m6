// a1/lib/permissions.js — پوستهٔ سازگاری مجوزها روی قواعد مرکزی
// قاعدهٔ بررسی مجوز و سلسله‌مراتب نقش یک منبع دارد: src/core/domain/access.js
import { checkPermission } from '@/core/domain/access';

export {
  ROLE_HIERARCHY, roleLevel as getRoleLevel, canManageRole,
  isRestrictedRole, canViewSection, canSectionAction, canViewModuleId, canModuleActionId,
} from '@/core/domain/access';

export const hasPermission = checkPermission;