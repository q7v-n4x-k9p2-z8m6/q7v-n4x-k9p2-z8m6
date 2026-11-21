// a1/components/v21/access/accessDemoData.js — دادهٔ نمایشی مدیریت کاربران
// این فایل هیچ حساب، اعتبار، مجوز یا رکوردی نمی‌سازد و به هیچ پایگاه داده‌ای وصل نیست.
// ساختار بخش‌ها و کلیدها از accessMatrix می‌آید که خودش رجیستری مرکزی بخش‌ها و مراکز را می‌خواند.
import { ACCESS_SECTIONS, emptyPermissions } from './accessMatrix';

export {
  PERMISSION_ACTIONS, ACCESS_SECTIONS, emptyPermissions, permissionSummary, sectionActionCount,
} from './accessMatrix';

export const ROLE_LABELS = { owner: 'رئیس صرافی', employee: 'کارمند' };

// ساخت نقشهٔ مجوز از فهرست فشرده، فقط برای دادهٔ نمایشی
const buildPermissions = (spec = {}) => {
  const map = emptyPermissions();
  ACCESS_SECTIONS.forEach(({ key }) => {
    const actions = spec[key] || [];
    map[key] = {
      view: actions.includes('view'),
      create: actions.includes('create'),
      edit: actions.includes('edit'),
      delete: actions.includes('delete'),
    };
  });
  return map;
};

// چهار کاربر نمایشی: یک رئیس و سه کارمند (یکی غیرفعال)
export const DEMO_EMPLOYEES = [
  {
    id: 'owner-demo',
    name: 'رئیس صرافی (نمایشی)',
    username: 'owner.demo',
    mobile: '۰۷۹۹ ۰۰۰ ۰۰۰',
    role: 'owner',
    status: 'active',
    joined: '۱۴۰۴/۰۱/۰۲',
    lastSeen: 'همین حالا',
    locked: true,
    permissions: buildPermissions(Object.fromEntries(
      ACCESS_SECTIONS.map(({ key }) => [key, ['view', 'create', 'edit', 'delete']]),
    )),
  },
  {
    id: 'emp-demo-1',
    name: 'احمد رحیمی (نمایشی)',
    username: 'ahmad.demo',
    mobile: '۰۷۰۰ ۱۲۳ ۴۵۶',
    role: 'employee',
    status: 'active',
    joined: '۱۴۰۴/۰۵/۱۸',
    lastSeen: 'امروز ۰۹:۱۲',
    permissions: buildPermissions({
      customers: ['view', 'create', 'edit'],
      cash: ['view', 'create', 'edit'],
      bank: ['view'],
      transfers: ['view', 'create'],
      trade: ['view', 'create'],
      reports: ['view'],
    }),
  },
  {
    id: 'emp-demo-2',
    name: 'صدیقه نوری (نمایشی)',
    username: 'sadiqa.demo',
    mobile: '۰۷۷۷ ۹۸۷ ۶۵۴',
    role: 'employee',
    status: 'active',
    joined: '۱۴۰۴/۰۶/۰۳',
    lastSeen: 'دیروز ۱۶:۴۰',
    permissions: buildPermissions({
      customers: ['view'],
      journal: ['view', 'create', 'edit'],
      general_ledger: ['view'],
      reports: ['view'],
      currencies: ['view'],
    }),
  },
  {
    id: 'emp-demo-3',
    name: 'نجیب‌الله کریمی (نمایشی)',
    username: 'najib.demo',
    mobile: '۰۷۸۸ ۱۱۱ ۲۲۲',
    role: 'employee',
    status: 'inactive',
    joined: '۱۴۰۴/۰۳/۲۱',
    lastSeen: '۱۲ روز پیش',
    permissions: buildPermissions({
      agents: ['view'],
      transfers: ['view'],
    }),
  },
];