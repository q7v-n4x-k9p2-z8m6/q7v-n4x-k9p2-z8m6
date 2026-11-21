import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ArrowDownToLine,
  Send,
  Banknote,
  Landmark,
  BookOpen,
  ScrollText,
  Scale,
  FileBarChart,
  TrendingUp,
  Wallet,
  Network,
  ShieldCheck,
  Settings,
  History,
  Wrench,
  Map,
  UserRound,
} from 'lucide-react';

/**
 * نقشهٔ ناوبری برنامه. هر بخش یک شناسه، مسیر، آیکون و مجوز دارد.
 * نمایش منو بر اساس مجوز نقش انجام می‌شود.
 */
export const SECTIONS = [
  { id: 'dashboard', path: '/', label: 'داشبورد', icon: LayoutDashboard, permission: 'dashboard.view', group: 'عملیات' },
  { id: 'trade', path: '/trade', label: 'خرید و فروش ارز', icon: ArrowLeftRight, permission: 'trade.post', group: 'عملیات' },
  { id: 'cash', path: '/cash', label: 'صندوق و دریافت/پرداخت', icon: Banknote, permission: 'cash.view', group: 'عملیات' },
  { id: 'transfers', path: '/transfers', label: 'حواله‌ها', icon: Send, permission: 'transfers.view', group: 'عملیات' },
  { id: 'customers', path: '/customers', label: 'مشتریان', icon: Users, permission: 'customers.view', group: 'عملیات' },
  { id: 'bank', path: '/bank', label: 'بانک', icon: Landmark, permission: 'bank.view', group: 'عملیات' },
  { id: 'convert', path: '/convert', label: 'تبدیل ارز', icon: ArrowDownToLine, permission: 'convert.post', group: 'عملیات' },
  { id: 'agents', path: '/agents', label: 'نمایندگی‌ها', icon: Network, permission: 'agents.view', group: 'تعاریف' },
  { id: 'journal', path: '/journal', label: 'دفتر روزنامه', icon: BookOpen, permission: 'journal.view', group: 'حسابداری' },
  { id: 'general-ledger', path: '/general-ledger', label: 'دفتر کل', icon: ScrollText, permission: 'ledger.view', group: 'حسابداری' },
  { id: 'trial-balance', path: '/trial-balance', label: 'تراز آزمایشی', icon: Scale, permission: 'ledger.view', group: 'حسابداری' },
  { id: 'reports', path: '/reports', label: 'گزارش‌ها', icon: FileBarChart, permission: 'reports.view', group: 'حسابداری' },
  { id: 'profit-loss', path: '/profit-loss', label: 'سود و زیان', icon: TrendingUp, permission: 'profit.view', group: 'حسابداری' },
  { id: 'debtors', path: '/debtors', label: 'بدهکاران', icon: Wallet, permission: 'debtors.view', group: 'حسابداری' },
  { id: 'users', path: '/users', label: 'کاربران و نقش‌ها', icon: ShieldCheck, permission: 'users.view', group: 'مدیریت' },
  { id: 'audit', path: '/audit', label: 'رویدادها', icon: History, permission: 'audit.view', group: 'مدیریت' },
  { id: 'settings', path: '/settings', label: 'تنظیمات', icon: Settings, permission: 'settings.view', group: 'مدیریت' },
  { id: 'builder', path: '/builder', label: 'پنل سازنده', icon: Wrench, permission: 'builder.view', group: 'مدیریت' },
  { id: 'roadmap', path: '/roadmap', label: 'وضعیت و نگاشت', icon: Map, permission: 'roadmap.view', group: 'مدیریت' },
  { id: 'portal', path: '/portal', label: 'پنل مشتری', icon: UserRound, permission: 'customer.portal', group: 'مشتری' },
];

export const SECTION_MAP = SECTIONS.reduce((acc, section) => {
  acc[section.id] = section;
  return acc;
}, {});

export const GROUP_ORDER = ['عملیات', 'تعاریف', 'حسابداری', 'مدیریت', 'مشتری'];

export function navFor(role, allowedFn) {
  return SECTIONS.filter((section) => allowedFn(role, section.permission));
}