import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Home, Users, Wallet, BookOpen, BookText, Landmark, Building2, Send,
  BarChart3, Receipt, ScrollText, ClipboardList, ListChecks, Coins,
  FileSpreadsheet, Scale, ArrowLeftRight, MoreHorizontal, ChevronRight
} from 'lucide-react';

const MOBILE_MODULES = [
  { id: 'home', label: 'میزکار', icon: Home, group: 'عمومی', description: 'نمای کلی وضعیت و دسترسی سریع' },
  { id: 'customers', label: 'تعریف مشتریان', icon: Users, group: 'تعاریف و دفاتر', description: 'ثبت و مدیریت مشتریان' },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', icon: BookOpen, group: 'تعاریف و دفاتر', description: 'مشاهده گردش حساب مشتریان' },
  { id: 'branches', label: 'تعریف نمایندگی‌ها', icon: Building2, group: 'تعاریف و دفاتر', description: 'مدیریت نمایندگی‌ها' },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', icon: BookText, group: 'تعاریف و دفاتر', description: 'گردش حساب نمایندگی‌ها' },
  { id: 'cash', label: 'صندوق‌ها و موجودی', icon: Wallet, group: 'صندوق و بانک', description: 'صندوق‌های مستقل و موجودی هرکدام' },
  { id: 'banks', label: 'بانک و چک', icon: Landmark, group: 'صندوق و بانک', description: 'حساب‌های بانکی و چک‌ها' },
  { id: 'exchange', label: 'خرید و فروش اسعار', icon: ArrowLeftRight, group: 'عملیات صرافی', description: 'ثبت معاملات خرید، فروش و تبدیل' },
  { id: 'remittance', label: 'دفتر حواله‌ها', icon: Send, group: 'عملیات صرافی', description: 'حواله‌های ارسالی و دریافتی' },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', icon: Receipt, group: 'عملیات صرافی', description: 'ثبت مصارف و پرداخت‌ها' },
  { id: 'journal', label: 'دفتر روزنامچه', icon: ScrollText, group: 'حسابداری', description: 'اسناد روزنامچه' },
  { id: 'ledger', label: 'دفتر کل', icon: ClipboardList, group: 'حسابداری', description: 'گردش حساب‌های کل' },
  { id: 'accounts', label: 'کدینگ حساب‌ها', icon: ListChecks, group: 'حسابداری', description: 'ساختار حساب‌های کل، معین و تفصیلی' },
  { id: 'currencies', label: 'تعریف اسعار', icon: Coins, group: 'تنظیمات', description: 'مدیریت ارزها' },
  { id: 'reports', label: 'گزارش عملیات', icon: FileSpreadsheet, group: 'گزارشات', description: 'گزارش‌های عملیاتی' },
  { id: 'profit', label: 'مفاد و زیان', icon: BarChart3, group: 'گزارشات', description: 'گزارش مفاد و زیان' },
  { id: 'balance', label: 'بیلانس عمومی', icon: Scale, group: 'گزارشات', description: 'نمای کلی بیلانس' },
];

const QUICK_IDS = ['home', 'customers', 'cash', 'exchange'];

function PhoneIcon({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick} className={`min-w-0 min-h-[92px] rounded-xl border p-2 flex flex-col items-center justify-center gap-2 text-center transition-colors ${active ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-card text-foreground hover:bg-muted'}`}>
      <span className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" strokeWidth={1.9} />
      </span>
      <span className="text-[11px] font-semibold leading-4">{item.label}</span>
    </button>
  );
}

export default function MobileLayoutPreview() {
  const [activeId, setActiveId] = useState('home');
  const [showAll, setShowAll] = useState(false);
  const active = MOBILE_MODULES.find(item => item.id === activeId) || MOBILE_MODULES[0];
  const groups = useMemo(() => [...new Set(MOBILE_MODULES.map(item => item.group))], []);
  const quickItems = QUICK_IDS.map(id => MOBILE_MODULES.find(item => item.id === id)).filter(Boolean);
  const Icon = active.icon;

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">چیدمان مستقل موبایل حساب صراف</h3>
              <p className="text-[11px] text-muted-foreground">بر پایه همان بخش‌های نسخه لپ‌تاپ، با اندازه مناسب لمس و صفحه گوشی</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border-[7px] border-slate-800 bg-slate-900 p-1 shadow-xl">
            <div className="overflow-hidden rounded-[1.55rem] bg-background">
              <div className="h-7 bg-slate-900 text-white flex items-center justify-between px-4 text-[9px]">
                <span>۹:۴۱</span><span>حساب صراف · نسخه موبایل</span><span>●●●</span>
              </div>
              <div className="bg-card border-b border-border px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">پنل حسابداری صراف</p>
                    <h4 className="text-sm font-bold truncate">{active.label}</h4>
                  </div>
                  <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                </div>
              </div>
              {activeId === 'home' ? (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['مشتریان', '—'], ['صندوق‌ها', '—'], ['عملیات امروز', '—'], ['گزارش‌ها', '—']
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border bg-card p-2.5">
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <b className="text-base">{value}</b>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <b className="text-xs">دسترسی سریع</b>
                    <span className="text-[9px] text-muted-foreground">امکانات حسابداری</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MOBILE_MODULES.slice(1, 10).map(item => <PhoneIcon key={item.id} item={item} active={false} onClick={() => setActiveId(item.id)} />)}
                  </div>
                  <button onClick={() => setShowAll(true)} className="w-full rounded-lg border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary">نمایش همه بخش‌ها</button>
                </div>
              ) : (
                <div className="min-h-[390px] p-3 space-y-3">
                  <button onClick={() => setActiveId('home')} className="flex items-center gap-1 text-xs text-primary"><ChevronRight className="w-4 h-4" /> بازگشت به میزکار</button>
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-6 h-6" /></span>
                    <div><b className="text-sm">{active.label}</b><p className="text-[10px] text-muted-foreground mt-1">{active.description}</p></div>
                  </div>
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">پیش‌نمایش مسیر و جایگاه این بخش در نسخه موبایل</div>
                  <button onClick={() => setShowAll(true)} className="w-full rounded-lg border py-2 text-xs">فهرست همه بخش‌ها</button>
                </div>
              )}
              <div className="grid grid-cols-5 border-t border-border bg-card px-1 py-2">
                {quickItems.map(item => {
                  const ItemIcon = item.icon;
                  return <button key={item.id} onClick={() => { setActiveId(item.id); setShowAll(false); }} className={`flex flex-col items-center gap-1 min-w-0 ${activeId === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    <ItemIcon className="w-5 h-5" />
                    <span className="text-[9px] font-medium">{item.label === 'خرید و فروش اسعار' ? 'معامله' : item.label === 'تعریف مشتریان' ? 'مشتری' : item.label === 'صندوق‌ها و موجودی' ? 'صندوق' : 'میزکار'}</span>
                  </button>;
                })}
                <button onClick={() => setShowAll(v => !v)} className={`flex flex-col items-center gap-1 ${showAll ? 'text-primary' : 'text-muted-foreground'}`}>
                  <MoreHorizontal className="w-5 h-5" /><span className="text-[9px]">بیشتر</span>
                </button>
              </div>
              {showAll && <div className="border-t border-border bg-card p-3 space-y-3 max-h-[320px] overflow-y-auto">
                <div className="flex items-center justify-between"><b className="text-xs">همه بخش‌های حسابداری</b><button onClick={() => setShowAll(false)} className="text-xs text-primary">بستن</button></div>
                {groups.map(group => <section key={group} className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground">{group}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MOBILE_MODULES.filter(item => item.group === group).map(item => <PhoneIcon key={item.id} item={item} active={activeId === item.id} onClick={() => { setActiveId(item.id); setShowAll(false); }} />)}
                  </div>
                </section>)}
              </div>}
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">نمونه چیدمان موبایل · داده‌ها و تراکنش‌های زنده در این پیش‌نمایش دست‌کاری نمی‌شوند.</p>
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <p className="text-xs font-bold">اصول چیدمان</p>
            <ul className="list-disc pr-4 text-[10px] text-muted-foreground space-y-1">
              <li>آیکون‌ها و نام بخش‌ها با نسخه لپ‌تاپ یکسان هستند.</li>
              <li>شبکه سه‌ستونه با فاصله و اندازه مناسب لمس.</li>
              <li>چهار میانبر پرکاربرد در نوار پایین و بقیه در فهرست دسته‌بندی‌شده.</li>
              <li>میزکار همیشه نقطه شروع و راه بازگشت است.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
