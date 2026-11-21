// a1/mobile/mobileModules.js — آیکون‌ها و ناوبری پوستهٔ موبایل روی رجیستری مرکزی
// فهرست بخش‌ها، گروه‌ها و بخش‌های «فقط بیشتر» یک منبع دارد: src/core/registry/modules.js
// این فایل فقط آیکون‌های نمایشی و ناوبری موبایل (تب‌ها و منوها) را اضافه می‌کند.
import { Home, BookText, Zap, MoreHorizontal } from 'lucide-react';
import { CORE_MODULES, HOME_GROUPS, MORE_ONLY, CENTERS } from '@/core/registry/modules';
// آیکون مرجع یکتای هر بخش — همان منبع میزکار دسکتاپ، میان‌برها و محیط آزمون
import { MODULE_ICONS, moduleIcon } from '@/a1/components/v21/moduleIcons';

export { MODULE_ICONS, moduleIcon };

export const MOBILE_MODULES = CORE_MODULES.map((module) => ({
  ...module,
  icon: moduleIcon(module.id),
}));

// مرکزهای مکمل (مرکز معاملات) — بیرون از شماره‌گذاری ۱ تا ۲۵
export const MOBILE_CENTERS = CENTERS.map((center) => ({ ...center, icon: moduleIcon(center.id) }));

export { HOME_GROUPS, MORE_ONLY };

export const moduleById = (id) => MOBILE_MODULES.find((item) => item.id === id) || MOBILE_MODULES[0];

// چهار تب پایین — صرفاً ناوبری
export const TABS = [
  { key: 'home', label: 'میزکار', icon: Home },
  { key: 'ops', label: 'عملیات', icon: Zap },
  { key: 'accounts', label: 'حسابات', icon: BookText },
  { key: 'more', label: 'بیشتر', icon: MoreHorizontal },
];

// هفت گروه منوی لپ‌تاپ، با همان عنوان و همان مقصدها برای موبایل
const RAW_MOBILE_MENUS = [
  {
    key: 'file',
    label: 'فایل',
    items: [
      { label: 'پشتیبان‌گیری', action: 'backup' },
      { label: 'بازیابی نمایشی', action: 'restore' },
      { label: 'پاک‌سازی نمایشی', action: 'reset' },
    ],
  },
  {
    key: 'define',
    label: 'تعریف',
    items: [
      { label: 'مشتریان', module: 'customers' },
      { label: 'نمایندگی‌ها', module: 'branches' },
      { label: 'صندوق‌ها', module: 'cash' },
      { label: 'بانک و چک', module: 'banks' },
      { label: 'اسعار', module: 'currencies' },
      { label: 'کدینگ حساب‌ها', module: 'accounts' },
    ],
  },
  {
    key: 'ops',
    label: 'عملیات',
    items: [
      { label: 'دخل صندوق', action: 'cashIn' },
      { label: 'خرج صندوق', action: 'cashOut' },
      { label: 'خرید و فروش اسعار', module: 'exchange' },
      { label: 'نرخ روز', module: 'rates' },
      { label: 'ثبت حواله', module: 'remittance' },
      { label: 'ثبت مصرف', module: 'expenses' },
      { label: 'مرکز معاملات', action: 'transactions' },
    ],
  },
  {
    key: 'accounts',
    label: 'حسابات',
    items: [
      { label: 'روزنامچه', module: 'journal' },
      { label: 'دفتر کل', module: 'ledger' },
      { label: 'دفتر حساب مشتریان', module: 'customerLedger' },
      { label: 'دفتر حساب نمایندگی‌ها', module: 'branchLedger' },
      { label: 'بدهکاران و بستانکاران', module: 'debtors' },
    ],
  },
  {
    key: 'reports',
    label: 'گزارشات',
    items: [
      { label: 'گزارش عملیات', module: 'reports' },
      { label: 'مفاد و زیان', module: 'profit' },
      { label: 'بیلانس عمومی', module: 'balance' },
      { label: 'سوابق فعالیت', module: 'activity' },
      { label: 'گزارش خطاها', module: 'errors' },
    ],
  },
  {
    key: 'settings',
    label: 'تنظیمات',
    items: [
      { label: 'تنظیمات محلی', action: 'settings' },
      { label: 'زبان برنامه', module: 'language' },
      { label: 'پشتیبانی', action: 'support' },
      { label: 'راهنما', action: 'help' },
    ],
  },
  {
    key: 'extras',
    label: 'امکانات تکمیلی',
    items: [
      { label: 'گروه و چت', module: 'sarraafGroups' },
      { label: 'هوش مصنوعی', module: 'assistant' },
      { label: 'محصولات آنلاین', module: 'products' },
    ],
  },
];

// برچسب هر ردیف منو از رجیستری مرکزی خوانده می‌شود تا نام‌ها در دسکتاپ و موبایل یکی بمانند
const registryLabel = (id) => (CORE_MODULES.find((module) => module.id === id) || {}).label;

export const MOBILE_MENUS = RAW_MOBILE_MENUS.map((menu) => ({
  ...menu,
  items: menu.items.map((item) => (item.module ? { ...item, label: registryLabel(item.module) || item.label } : item)),
}));