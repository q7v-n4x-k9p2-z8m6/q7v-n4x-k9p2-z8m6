import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Home, Users, Wallet, BookOpen, BookText, Landmark, Building2, Send,
  BarChart3, Receipt, ScrollText, ClipboardList, ListChecks, Coins,
  FileSpreadsheet, Scale, ArrowLeftRight, ChevronDown, ChevronLeft,
  Folder, Settings, Archive, Upload, Printer, RotateCcw, CircleHelp,
  ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';

// این فهرست از همان ماژول‌ها و آیکون‌های موجود در آزمایشگاه لپ‌تاپ استفاده می‌کند.
// فقط نحوه دسته‌بندی و نمایش در موبایل متفاوت است.
const MOBILE_ITEMS = {
  home: { id: 'home', label: 'میزکار', icon: Home, description: 'نمای کلی و دسترسی به بخش‌های حسابداری' },
  customers: { id: 'customers', label: 'مشتریان', icon: Users, description: 'تعریف و مدیریت مشتریان' },
  customerLedger: { id: 'customerLedger', label: 'دفتر حساب مشتریان', icon: BookOpen, description: 'گردش و مانده حساب مشتریان' },
  branches: { id: 'branches', label: 'نمایندگی‌ها', icon: Building2, description: 'تعریف و مدیریت نمایندگی‌ها' },
  branchLedger: { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', icon: BookText, description: 'گردش و مانده حساب نمایندگی‌ها' },
  cash: { id: 'cash', label: 'صندوق‌ها و موجودی', icon: Wallet, description: 'صندوق‌های مستقل و موجودی هر صندوق' },
  banks: { id: 'banks', label: 'بانک و چک', icon: Landmark, description: 'حساب‌های بانکی و چک‌ها' },
  exchange: { id: 'exchange', label: 'خرید و فروش اسعار', icon: ArrowLeftRight, description: 'ثبت معاملات خرید، فروش و تبدیل اسعار' },
  remittance: { id: 'remittance', label: 'حواله‌ها', icon: Send, description: 'حواله‌های ارسالی و دریافتی' },
  expenses: { id: 'expenses', label: 'مصارف و پرداخت‌ها', icon: Receipt, description: 'ثبت و پیگیری مصارف و پرداخت‌ها' },
  journal: { id: 'journal', label: 'دفتر روزنامچه', icon: ScrollText, description: 'ثبت و مشاهده اسناد روزنامچه' },
  ledger: { id: 'ledger', label: 'دفتر کل', icon: ClipboardList, description: 'گردش حساب‌های دفتر کل' },
  accounts: { id: 'accounts', label: 'کدینگ حساب‌ها', icon: ListChecks, description: 'ساختار حساب‌های کل، معین و تفصیلی' },
  currencies: { id: 'currencies', label: 'تعریف اسعار', icon: Coins, description: 'تعریف و مدیریت ارزها' },
  reports: { id: 'reports', label: 'گزارش عملیات', icon: FileSpreadsheet, description: 'گزارش عملیات و گردش‌ها' },
  profit: { id: 'profit', label: 'مفاد و زیان', icon: BarChart3, description: 'گزارش مفاد و زیان' },
  balance: { id: 'balance', label: 'بیلانس عمومی', icon: Scale, description: 'نمای کلی بیلانس حساب‌ها' },
  cashIn: { id: 'cashIn', label: 'دخل صندوق', icon: ArrowDownCircle, description: 'ثبت دریافت وجه به صندوق' },
  cashOut: { id: 'cashOut', label: 'خرج صندوق', icon: ArrowUpCircle, description: 'ثبت پرداخت از صندوق' },
  backup: { id: 'backup', label: 'پشتیبان‌گیری', icon: Archive, description: 'گرفتن نسخه پشتیبان از اطلاعات آزمایشی' },
  restore: { id: 'restore', label: 'بازیابی پشتیبان', icon: Upload, description: 'بازیابی نسخه پشتیبان آزمایشی' },
  print: { id: 'print', label: 'چاپ صفحه', icon: Printer, description: 'چاپ محتوای صفحه جاری' },
  reset: { id: 'reset', label: 'بازنشانی داده‌های آزمایشی', icon: RotateCcw, description: 'بازنشانی فقط داده‌های پیش‌نمایش آزمایشی' },
  settings: { id: 'settings', label: 'تنظیمات', icon: Settings, description: 'تنظیمات محیط آزمایشی' },
  help: { id: 'help', label: 'راهنما', icon: CircleHelp, description: 'راهنمای استفاده از بخش‌ها' },
};

const MOBILE_MENUS = [
  {
    id: 'definitions', label: 'تعاریف و حساب‌ها', icon: Folder,
    items: ['customers', 'customerLedger', 'branches', 'branchLedger', 'cash', 'banks', 'currencies', 'accounts']
  },
  {
    id: 'operations', label: 'عملیات مالی', icon: ArrowLeftRight,
    items: ['cashIn', 'cashOut', 'exchange', 'remittance', 'expenses']
  },
  {
    id: 'accounting', label: 'حسابداری', icon: ScrollText,
    items: ['journal', 'ledger']
  },
  {
    id: 'reports-tools', label: 'گزارش و ابزارها', icon: BarChart3,
    items: ['reports', 'profit', 'balance', 'backup', 'restore', 'print', 'reset', 'settings', 'help']
  },
];

function MenuItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-right transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:bg-muted'}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 text-xs font-semibold leading-5">{item.label}</span>
      <ChevronLeftIcon />
    </button>
  );
}

function ChevronLeftIcon() {
  return <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export default function MobileLayoutPreview() {
  const [activeId, setActiveId] = useState('home');
  const [openMenu, setOpenMenu] = useState('');
  const active = MOBILE_ITEMS[activeId] || MOBILE_ITEMS.home;
  const ActiveIcon = active.icon;
  const activeMenu = MOBILE_MENUS.find(menu => menu.id === openMenu);
  const menuItems = useMemo(() => activeMenu ? activeMenu.items.map(id => MOBILE_ITEMS[id]).filter(Boolean) : [], [activeMenu]);

  const chooseItem = (id) => {
    setActiveId(id);
    setOpenMenu('');
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">چیدمان منویی موبایل حساب صراف</h3>
              <p className="text-[11px] text-muted-foreground">چهار منوی اصلی؛ همه امکانات آزمایشگاه لپ‌تاپ در زیرمنوهای مرتب</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border-[7px] border-slate-800 bg-slate-900 p-1 shadow-xl">
            <div className="overflow-hidden rounded-[1.55rem] bg-background">
              <div className="flex h-7 items-center justify-between bg-slate-900 px-4 text-[9px] text-white">
                <span>۹:۴۱</span><span>حساب صراف</span><span>●●●</span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ActiveIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-muted-foreground">پنل حسابداری صراف</p>
                    <h4 className="truncate text-sm font-bold">{active.label}</h4>
                  </div>
                </div>
                <button type="button" onClick={() => chooseItem('home')} className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-[10px] font-semibold">
                  میزکار
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 border-b border-border bg-card p-2">
                {MOBILE_MENUS.map(menu => {
                  const Icon = menu.icon;
                  const isOpen = openMenu === menu.id;
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenMenu(current => current === menu.id ? '' : menu.id)}
                      className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px] font-bold leading-3">{menu.label}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </div>

              {activeMenu && (
                <div className="border-b border-border bg-muted/30 p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <b className="text-[11px]">{activeMenu.label}</b>
                    <button type="button" onClick={() => setOpenMenu('')} className="text-[10px] font-semibold text-primary">بستن</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {menuItems.map(item => (
                      <MenuItem key={item.id} item={item} active={activeId === item.id} onClick={() => chooseItem(item.id)} />
                    ))}
                  </div>
                </div>
              )}

              <div className="min-h-[300px] space-y-3 p-3">
                {activeId === 'home' ? (
                  <>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <b className="text-xs">میزکار حساب صراف</b>
                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">برای دسترسی به امکانات، یکی از چهار منوی بالا را انتخاب کنید.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['مشتریان', Users], ['صندوق‌ها', Wallet], ['عملیات امروز', Receipt], ['گزارش‌ها', FileSpreadsheet]
                      ].map(([label, Icon]) => (
                        <div key={label} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-semibold">{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ActiveIcon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <b className="text-sm">{active.label}</b>
                        <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{active.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-center text-[10px] text-muted-foreground">
                      جایگاه محتوای «{active.label}» در پیش‌نمایش موبایل
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-bold">قواعد این چیدمان</p>
            <ul className="mt-2 list-disc space-y-1 pr-4 text-[10px] leading-5 text-muted-foreground">
              <li>چهار منوی اصلی در بالای صفحه موبایل قرار دارند.</li>
              <li>زیرمنوی هر دسته دقیقاً زیر همان نوار و رو به پایین باز می‌شود.</li>
              <li>نام‌ها و آیکون‌ها از ماژول‌های موجود در آزمایشگاه لپ‌تاپ گرفته شده‌اند.</li>
              <li>همه گزینه‌های منوی آزمایشگاه لپ‌تاپ در چهار دسته موبایل قابل دسترسی‌اند.</li>
              <li>آیکون‌های متعدد لپ‌تاپ در صفحه موبایل تکرار نمی‌شوند و فضای صفحه خلوت می‌ماند.</li>
              <li>این پیش‌نمایش مستقل است و به اطلاعات یا تراکنش‌های زنده متصل نیست.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
