// a1/components/v21/access/accessMatrix.js — معماری ماتریس مجوزها (فقط ساختار نمایشی)
// منبع ساختار: CORE_MODULES و CENTERS در src/core/registry/modules.js
// کلید هر مجوز همان «بخش» جدول user_permissions در موتور است (seed.js و PERMISSION_SECTION_BY_MODULE در v21Write).
// هیچ کلید تازه‌ای ساخته نمی‌شود و کلید موجود تغییر نمی‌کند.
import { CORE_MODULES, CENTERS } from '@/core/registry/modules';

export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'مشاهده' },
  { key: 'create', label: 'ثبت' },
  { key: 'edit', label: 'ویرایش' },
  { key: 'delete', label: 'ابطال' },
];

const transactionCenter = CENTERS.find((item) => item.id === 'transactions');

// دو مرکز مستقل پنل، جدا از فهرست ۲۵ بخش و بدون ادغام
// «مرکز معاملات» صفحهٔ مستقل /transactions است.
// «مرکز عملیات» صفحهٔ مستقل جداگانه ندارد؛ همان میزکار بخش ۱ است، پس کلید dashboard را با آن شریک می‌شود
// و یک کلید تازه برایش ساخته نمی‌شود (جلوگیری از دوباره‌شماری مجوز).
export const CENTER_ROWS = [
  {
    id: 'transactions',
    label: transactionCenter?.label || 'مرکز معاملات',
    key: transactionCenter?.section || 'accounts_receivable',
    path: '/transactions',
    standalone: true,
    note: 'صفحهٔ مستقل /transactions با کلید accounts_receivable؛ فهرست معاملات ثبت‌شده و جدا از «مفاد معاملات».',
  },
  {
    id: 'operations',
    label: 'مرکز عملیات',
    key: 'dashboard',
    path: '/dashboard',
    standalone: false,
    note: 'صفحهٔ مستقل جداگانه ندارد؛ همان میزکار بخش ۱ «مرکز عملیات» است و کلید dashboard را با آن شریک است.',
  },
];

export const MODULE_ROWS = CORE_MODULES.map((module, index) => ({
  id: module.id,
  no: index + 1,
  label: module.label,
  key: module.section,
  group: module.group,
}));

const attachShared = (rows) => rows.map((row) => ({
  ...row,
  sharedWith: rows.filter((other) => other.key === row.key && other.id !== row.id).map((other) => other.label),
}));

export const MODULE_MATRIX = attachShared(MODULE_ROWS);
export const CENTER_MATRIX = attachShared(CENTER_ROWS);
export const MATRIX_ROWS = [...MODULE_MATRIX, ...CENTER_MATRIX];

// کلیدهای یکتای مجوز = همان رکوردهای section در جدول user_permissions
export const ACCESS_SECTIONS = [...new Set(MATRIX_ROWS.map((row) => row.key))].map((key) => ({
  key,
  label: MATRIX_ROWS.find((row) => row.key === key).label,
}));

export const SHARED_KEY_GROUPS = ACCESS_SECTIONS
  .map(({ key }) => ({ key, rows: MATRIX_ROWS.filter((row) => row.key === key) }))
  .filter((group) => group.rows.length > 1);

// عملیات واقعی هر بخش، بر پایهٔ مسیرهای موجود در موتور:
// مشاهده = گارد نمایش (permissions.js + moduleSection)، ثبت/ویرایش = saveVersion21Record/editVersion21Record،
// ابطال = reverseVersion21Record برای اسناد و deactivateVersion21MasterRecord برای بخش‌های تعریف.
// بخش‌هایی که در PERMISSION_SECTION_BY_MODULE نوشتن ندارند، مجوز اجرایی برای کارمند ندارند.
export const REAL_OPS = {
  home: ['view'],
  customers: ['view', 'create', 'edit', 'delete'],
  customerLedger: ['view'],
  debtors: ['view'],
  branches: ['view', 'create', 'edit', 'delete'],
  branchLedger: ['view'],
  cash: ['view', 'create', 'edit', 'delete'],
  banks: ['view', 'create', 'edit', 'delete'],
  exchange: ['view', 'create', 'edit', 'delete'],
  remittance: ['view', 'create', 'edit', 'delete'],
  rates: ['view'],
  expenses: ['view', 'create', 'edit', 'delete'],
  journal: ['view', 'create', 'edit', 'delete'],
  ledger: ['view'],
  accounts: ['view', 'create', 'edit', 'delete'],
  currencies: ['view', 'create', 'edit', 'delete'],
  reports: ['view'],
  profit: ['view'],
  activity: ['view'],
  errors: ['view'],
  balance: ['view'],
  sarraafGroups: ['view'],
  assistant: ['view'],
  products: ['view'],
  language: ['view'],
  transactions: ['view', 'create', 'edit', 'delete'],
  operations: ['view'],
};

export const realOpsFor = (rowId) => REAL_OPS[rowId] || ['view'];
export const isRealOp = (rowId, actionKey) => realOpsFor(rowId).includes(actionKey);

const countRealOps = () => MATRIX_ROWS.reduce((total, row) => total + realOpsFor(row.id).length, 0);

export const accessCounts = () => {
  const rows = MATRIX_ROWS.length;
  const slots = rows * PERMISSION_ACTIONS.length;
  const real = countRealOps();
  const sharedRows = SHARED_KEY_GROUPS.reduce((total, group) => total + group.rows.length, 0);
  return {
    modules: MODULE_MATRIX.length,
    centers: CENTER_MATRIX.length,
    rows,
    slots,
    uniqueKeys: ACCESS_SECTIONS.length,
    storedPermissions: ACCESS_SECTIONS.length * PERMISSION_ACTIONS.length,
    sharedGroups: SHARED_KEY_GROUPS.length,
    sharedRows,
    realPermissions: real,
    displayOnlyPermissions: slots - real,
  };
};

const blankRow = () => ({ view: false, create: false, edit: false, delete: false });

export const emptyPermissions = () => {
  const map = {};
  ACCESS_SECTIONS.forEach(({ key }) => { map[key] = blankRow(); });
  return map;
};

export const sectionActionCount = (permissions, sectionKey) => (
  PERMISSION_ACTIONS.filter((action) => permissions?.[sectionKey]?.[action.key] === true).length
);

// شمارش روی همان سطرهای ماتریس است؛ کلید مشترک در هر سطر جدا شمرده می‌شود و این در کارت هم نوشته شده است.
export const permissionSummary = (permissions) => ({
  sections: MATRIX_ROWS.filter((row) => permissions?.[row.key]?.view === true).length,
  actions: MATRIX_ROWS.reduce((total, row) => total + sectionActionCount(permissions, row.key), 0),
  totalSections: MATRIX_ROWS.length,
  totalActions: MATRIX_ROWS.length * PERMISSION_ACTIONS.length,
});