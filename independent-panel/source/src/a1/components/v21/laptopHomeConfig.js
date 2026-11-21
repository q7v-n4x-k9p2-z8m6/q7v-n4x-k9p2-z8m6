// a1/components/v21/laptopHomeConfig.js
// فهرست منو، میان‌برها و کاشی‌های داشبورد لپ‌تاپ — عیناً بر پایهٔ ساختار تصویر مرجع.
import {
  Home, Users, User, Vault, RefreshCw, BarChart3, Landmark,
  Settings, Globe, LifeBuoy,
} from 'lucide-react';
import { CORE_MODULES, CENTERS } from '@/core/registry/modules';
import { moduleIcon } from './moduleIcons';

// برچسب و آیکون هر بخش فقط از رجیستری مرکزی و آیکون مرجع خوانده می‌شود
const labelOf = (id) => (CORE_MODULES.find((module) => module.id === id) || {}).label || id;

// منوی اصلی افقی (نوار تیرهٔ بالای برنامه)
export const LAPTOP_MENUS = [
  { label: 'فایل', items: [['پشتیبان‌گیری', 'backup'], ['بازیابی پشتیبان', 'restore'], ['پاک‌سازی نمای محلی', 'reset']] },
  {
    label: 'تعریف',
    items: [['مشتریان', 'customers'], ['نمایندگی‌ها', 'branches'], ['صندوق‌ها', 'cash'], ['بانک و چک', 'banks'], ['اسعار', 'currencies'], ['کدینگ حساب‌ها', 'accounts'], ['دوره‌های مالی', 'fiscalPeriods']],
  },
  {
    label: 'عملیات',
    items: [['دوره‌های مالی', 'fiscalPeriods'], ['دخل صندوق', 'cashIn'], ['خرج صندوق', 'cashOut'], ['خرید و فروش اسعار', 'exchange'], ['نرخ روز', 'rates'], ['ثبت حواله', 'remittance'], ['ثبت مصرف', 'expenses'], ['مرکز معاملات', 'transactions']],
  },
  {
    label: 'حسابات',
    items: [['روزنامچه', 'journal'], ['دفتر کل', 'ledger'], ['حساب مشتریان', 'customerLedger'], ['حساب نمایندگی‌ها', 'branchLedger'], ['بدهکاران و بستانکاران', 'debtors']],
  },
  {
    label: 'گزارشات',
    items: [['گزارش عملیات روز', 'reports'], ['مفاد و زیان', 'profit'], ['بیلانس عمومی', 'balance'], ['سوابق فعالیت', 'activity'], ['گزارش خطاها', 'errors']],
  },
  {
    label: 'تنظیمات',
    items: [['تنظیمات محلی', 'settings'], ['انتخاب زبان', 'language'], ['پشتیبانی', 'support'], ['راهنما', 'help']],
  },
  {
    label: 'امکانات تکمیلی',
    items: [['گروه و چت', 'sarraafGroups'], ['هوش مصنوعی', 'assistant'], ['محصولات آنلاین', 'products']],
  },
];

// شناسهٔ ماژول‌هایی که از منوهای بالایی باز می‌شوند (برای کنترل دسترسی نقش)
export const LAPTOP_MENU_MODULE_IDS = [
  'customers', 'branches', 'cash', 'banks', 'currencies', 'accounts', 'exchange',
  'remittance', 'expenses', 'journal', 'ledger', 'customerLedger', 'branchLedger',
  'debtors', 'reports', 'profit', 'balance', 'activity', 'errors', 'language',
  'rates', 'sarraafGroups', 'assistant', 'products',
];

// ردیف میان‌برهای ماژول (یک ردیف). سه امکان «هوش مصنوعی»، «محصولات آنلاین» و «گروه و چت»
// عمداً در این ردیف نیستند؛ جایگاه آن‌ها مرکز عملیات صرافی (گروه «امکانات مرکزی صرافی») است
// و دسترسی‌شان از همان مرکز و منوی «امکانات تکمیلی» انجام می‌شود تا نمایش تکراری نباشد.
// ترتیب این ردیف عیناً همان ترتیب تصویر مرجع است (از راست به چپ).
// ترتیب ردیف از راست به چپ: میزکار، دفاتر، نمایندگی، بقیهٔ بخش‌ها.
// آیکون «زبان برنامه» از این ردیف برداشته شده و از منوی «تنظیمات» باز می‌شود؛
// جای آن «دفتر کل» آمده تا تعداد آیکون‌های ردیف همان ۱۲ عدد قبلی بماند.
// ترتیب نمایش حفظ شده است؛ نام و آیکون هر میان‌بر از همان ماژول مرجع می‌آید
export const LAPTOP_SHORTCUTS = [
  'home',
  // دفاتر: بلافاصله بعد از میزکار
  'customerLedger',
  'branchLedger',
  'journal',
  'remittance',
  'ledger',
  // نمایندگی، سپس بقیهٔ بخش‌ها
  'branches',
  'customers',
  'cash',
  'exchange',
  'expenses',
  'banks',
].map((id) => ({ id, label: labelOf(id), icon: moduleIcon(id) }));

// شش گروه در دو ردیف و سه ستون
const RAW_LAPTOP_GROUPS = [
  {
    key: 'define-ledgers',
    title: 'تعاریف و دفاتر',
    tiles: [
      { module: 'customers' },
      { module: 'branches' },
      { module: 'customerLedger' },
    ],
  },
  {
    key: 'cash-bank',
    title: 'صندوق و بانک',
    tiles: [
      { module: 'cash' },
      { module: 'banks' },
      { module: 'remittance' },
    ],
  },
  {
    key: 'exchange-ops',
    title: 'عملیات صرافی',
    tiles: [
      { label: 'خرید و فروش اسعار', icon: moduleIcon('exchange'), create: 'exchange', need: 'exchange' },
      { module: 'expenses' },
      { path: '/transactions' },
    ],
  },
  {
    key: 'accounting-reports',
    title: 'حسابداری و گزارشات',
    tiles: [
      { module: 'journal' },
      { module: 'ledger' },
      { module: 'rates' },
    ],
  },
  {
    key: 'extras',
    title: 'امکانات مرکزی صرافی',
    tiles: [
      { module: 'products' },
      { module: 'sarraafGroups' },
      { module: 'assistant' },
    ],
  },
  {
    key: 'settings',
    title: 'تنظیمات',
    tiles: [
      { label: 'تنظیمات', icon: Settings, action: 'settings' },
      { module: 'language' },
      { label: 'درباره برنامه', icon: LifeBuoy, action: 'help' },
    ],
  },
];

// کاشی‌های هر ماژول، نام و آیکون مرجع خودش را از رجیستری می‌گیرند؛
// کاشی «مرکز معاملات» هم به همان مرکز مکمل وصل می‌شود.
export const LAPTOP_GROUPS = RAW_LAPTOP_GROUPS.map((group) => ({
  ...group,
  tiles: group.tiles.map((tile) => {
    if (tile.module) return { ...tile, label: labelOf(tile.module) || tile.label, icon: moduleIcon(tile.module) };
    if (tile.path === CENTERS[0]?.path) return { ...tile, label: CENTERS[0].label, icon: moduleIcon(CENTERS[0].id) };
    return tile;
  }),
}));

// کارت‌های خلاصهٔ بالای صفحه — هر کارت منبع دادهٔ خودش را هم نشان می‌دهد.
// «مفاد معاملات» تا وقتی سود واقعی از کدینگ درآمد/مصرف محاسبه نشود عدد نمایش نمی‌دهد.
export const LAPTOP_STATS = [
  { key: 'customers', label: 'تعداد مشتریان', icon: Users, note: 'منبع: فهرست مشتریان این صراف' },
  { key: 'cash', label: 'صندوق‌های تعریف‌شده', icon: Vault, note: 'منبع: تعریف صندوق‌ها' },
  { key: 'today', label: 'عملیات امروز', icon: RefreshCw, note: 'منبع: گردش‌های تاریخ امروز' },
  { key: 'profit', label: 'مفاد معاملات', icon: BarChart3, unknown: true, note: 'محاسبه‌نشده؛ برای سود واقعی، درآمد و مصرف باید به کدینگ حساب‌ها وصل شوند' },
];

// نوار تماس پایین صفحه
export const LAPTOP_CONTACTS = [
  { label: 'https://hisabsarraf.new.tg', href: 'https://hisabsarraf.new.tg' },
  { label: '@Rohullah11' },
  { label: 'https://t.me/hisabsarraf', href: 'https://t.me/hisabsarraf' },
  { label: 'roohalla41@gmail.com', href: 'mailto:roohalla41@gmail.com' },
];