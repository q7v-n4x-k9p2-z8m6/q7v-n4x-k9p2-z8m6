import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const MOBILE_ITEMS = {
  home: { id: 'home', label: 'میزکار', description: 'نمای کلی و دسترسی به بخش‌های حسابداری' },
  customers: { id: 'customers', label: 'مشتریان', description: 'تعریف و مدیریت مشتریان' },
  customerLedger: { id: 'customerLedger', label: 'دفتر حساب مشتریان', description: 'گردش و مانده حساب مشتریان' },
  branches: { id: 'branches', label: 'نمایندگی‌ها', description: 'تعریف و مدیریت نمایندگی‌ها' },
  branchLedger: { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', description: 'گردش و مانده حساب نمایندگی‌ها' },
  cash: { id: 'cash', label: 'صندوق‌ها', description: 'صندوق‌های مستقل و موجودی هر صندوق' },
  banks: { id: 'banks', label: 'بانک و چک', description: 'حساب‌های بانکی و چک‌ها' },
  exchange: { id: 'exchange', label: 'خرید و فروش اسعار', description: 'ثبت معاملات خرید، فروش و تبدیل اسعار' },
  remittance: { id: 'remittance', label: 'حواله‌ها', description: 'حواله‌های ارسالی و دریافتی' },
  expenses: { id: 'expenses', label: 'مصارف و پرداخت‌ها', description: 'ثبت و پیگیری مصارف و پرداخت‌ها' },
  journal: { id: 'journal', label: 'دفتر روزنامچه', description: 'ثبت و مشاهده اسناد روزنامچه' },
  ledger: { id: 'ledger', label: 'دفتر کل', description: 'گردش حساب‌های دفتر کل' },
  accounts: { id: 'accounts', label: 'کدینگ حساب‌ها', description: 'ساختار حساب‌های کل، معین و تفصیلی' },
  currencies: { id: 'currencies', label: 'تعریف اسعار', description: 'تعریف و مدیریت ارزها' },
  reports: { id: 'reports', label: 'گزارش عملیات', description: 'گزارش عملیات و گردش‌ها' },
  profit: { id: 'profit', label: 'مفاد و زیان', description: 'گزارش مفاد و زیان' },
  balance: { id: 'balance', label: 'بیلانس عمومی', description: 'نمای کلی بیلانس حساب‌ها' },
  cashIn: { id: 'cashIn', label: 'دخل صندوق', description: 'ثبت دریافت وجه به صندوق' },
  cashOut: { id: 'cashOut', label: 'خرج صندوق', description: 'ثبت پرداخت از صندوق' },
  backup: { id: 'backup', label: 'پشتیبان‌گیری', description: 'گرفتن نسخه پشتیبان از اطلاعات آزمایشی' },
  restore: { id: 'restore', label: 'بازیابی پشتیبان', description: 'بازیابی نسخه پشتیبان آزمایشی' },
  print: { id: 'print', label: 'چاپ صفحه', description: 'چاپ محتوای صفحه جاری' },
  reset: { id: 'reset', label: 'بازنشانی داده‌های آزمایشی', description: 'بازنشانی فقط داده‌های پیش‌نمایش آزمایشی' },
  settings: { id: 'settings', label: 'تنظیمات', description: 'تنظیمات محیط آزمایشی' },
  help: { id: 'help', label: 'راهنما', description: 'راهنمای استفاده از بخش‌ها' },
};

const MOBILE_MENUS = [
  { id: 'definitions', label: 'تعاریف و حساب‌ها', items: ['customers', 'customerLedger', 'branches', 'branchLedger', 'cash', 'banks', 'currencies', 'accounts'] },
  { id: 'operations', label: 'عملیات مالی', items: ['cashIn', 'cashOut', 'exchange', 'remittance', 'expenses'] },
  { id: 'accounting', label: 'حسابداری', items: ['journal', 'ledger'] },
  { id: 'reports-tools', label: 'گزارش و ابزارها', items: ['reports', 'profit', 'balance', 'backup', 'restore', 'print', 'reset', 'settings', 'help'] },
];

export default function MobileLayoutPreview() {
  const [activeId, setActiveId] = useState('home');
  const [openMenu, setOpenMenu] = useState('');
  // داده‌های نمونه فقط برای پیش‌نمایش موبایل؛ هیچ اتصال یا تغییری در اطلاعات واقعی ندارد.
  const [ledgerRows, setLedgerRows] = useState([
    { id: 1, title: 'حواله دریافتی', usd: '120', afn: '0' },
    { id: 2, title: 'تبدیل اسعار', usd: '75', afn: '0' },
    { id: 3, title: 'پرداخت مشتری', usd: '0', afn: '8500' },
  ]);
  const [cashRows, setCashRows] = useState([
    { id: 1, title: 'صندوق اصلی', usd: '1250', afn: '18500' },
    { id: 2, title: 'صندوق شعبه', usd: '420', afn: '7200' },
    { id: 3, title: 'صندوق حواله', usd: '300', afn: '0' },
  ]);
  const sumField = (rows, field) => rows.reduce((sum, row) => sum + (Number(String(row[field]).replace(/,/g, '')) || 0), 0);
  const formatAmount = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(value);
  const active = MOBILE_ITEMS[activeId] || MOBILE_ITEMS.home;
  const activeMenu = MOBILE_MENUS.find(menu => menu.id === openMenu);
  const menuItems = useMemo(
    () => activeMenu ? activeMenu.items.map(id => MOBILE_ITEMS[id]).filter(Boolean) : [],
    [activeMenu]
  );

  const openWindow = id => {
    setActiveId(id);
    setOpenMenu('');
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <h3 className="text-sm font-bold">نسخه جدید چیدمان موبایل حساب صراف</h3>
            <p className="text-[11px] text-muted-foreground">نمایش کلاسیک و پنجره‌ای؛ بدون آیکون و بدون شبکه میانبرها</p>
          </div>

          <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border-[7px] border-slate-800 bg-slate-900 p-1 shadow-xl">
            <div className="overflow-hidden rounded-[1.55rem] bg-background">
              <div className="flex h-7 items-center justify-between bg-slate-900 px-4 text-[9px] text-white">
                <span>۹:۴۱</span><span>حساب صراف</span><span>●●●</span>
              </div>

              <div className="border-b border-border bg-card px-3 py-3">
                <p className="text-[10px] text-muted-foreground">سیستم حسابداری صرافی</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <b className="truncate text-sm">حساب صراف</b>
                  <button type="button" onClick={() => openWindow('home')} className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[10px] font-semibold">میزکار</button>
                </div>
              </div>

              <div className="flex flex-wrap border-b border-border bg-muted/50">
                {MOBILE_MENUS.map(menu => {
                  const isOpen = openMenu === menu.id;
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenMenu(current => current === menu.id ? '' : menu.id)}
                      className={`min-h-10 flex-1 whitespace-nowrap border-l border-border px-2 py-2 text-[10px] font-bold transition-colors ${isOpen ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                    >
                      {menu.label}
                    </button>
                  );
                })}
              </div>

              {activeMenu && (
                <div className="border-b border-border bg-card p-2 shadow-inner">
                  <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                    <b className="text-[11px]">{activeMenu.label}</b>
                    <button type="button" onClick={() => setOpenMenu('')} className="text-[10px] text-primary">بستن فهرست</button>
                  </div>
                  <div className="divide-y divide-border">
                    {menuItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openWindow(item.id)}
                        className="flex min-h-10 w-full items-center justify-between gap-3 px-2 py-2 text-right text-[11px] hover:bg-muted"
                      >
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">بازکردن پنجره</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="min-h-[370px] bg-muted/20 p-2.5">
                {activeId === 'home' ? (
                  <div className="min-h-[340px] rounded-md border border-border bg-card p-3">
                    <div className="border-b border-border pb-2">
                      <b className="text-xs">میزکار حساب صراف</b>
                    </div>
                    <p className="mt-3 text-[10px] leading-6 text-muted-foreground">
                      از نوار منو، بخش موردنظر را انتخاب کنید. هر گزینه در یک پنجره مستقل باز می‌شود.
                    </p>
                  </div>
                ) : (
                  <section className="min-h-[340px] overflow-hidden rounded-md border border-slate-400 bg-card shadow-md">
                    <header className="flex items-center justify-between gap-2 border-b border-slate-400 bg-slate-200 px-3 py-2 text-slate-800">
                      <b className="truncate text-[11px]">{active.label}</b>
                      <button type="button" onClick={() => openWindow('home')} className="shrink-0 rounded border border-slate-400 bg-white px-2 py-1 text-[10px]">بستن پنجره ×</button>
                    </header>
                    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
                      <div className="flex flex-wrap gap-1">
                        {['جدید', 'ویرایش', 'حذف', 'جستجو', 'چاپ'].map(action => (
                          <button key={action} type="button" className="rounded border border-border bg-card px-2.5 py-1.5 text-[9px] font-medium">{action}</button>
                        ))}
                      </div>
                      <div className="mr-auto rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[9px] leading-5">
                        <b>جمع کل فهرست</b>
                        <span className="mr-2 tabular-nums" dir="ltr">$ {formatAmount(activeId === 'cash' ? sumField(cashRows, 'usd') : sumField(ledgerRows, 'usd'))}</span>
                        <span className="mr-2 tabular-nums">{formatAmount(activeId === 'cash' ? sumField(cashRows, 'afn') : sumField(ledgerRows, 'afn'))} ؋</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] leading-6 text-muted-foreground">{active.description}</p>
                      {activeId === 'customerLedger' ? (
                        <div className="mt-3 overflow-hidden rounded-md border border-border">
                          <div className="grid grid-cols-[1.2fr_.7fr_.7fr] gap-1 bg-muted px-2 py-2 text-[9px] font-bold">
                            <span>شرح عملیات</span><span className="text-center">دالر</span><span className="text-center">افغانی</span>
                          </div>
                          {ledgerRows.map(row => (
                            <div key={row.id} className="grid grid-cols-[1.2fr_.7fr_.7fr] items-center gap-1 border-t border-border px-2 py-2">
                              <span className="text-[9px]">{row.title}</span>
                              <input aria-label={'مبلغ دالر ' + row.title} inputMode="decimal" value={row.usd} onChange={e => setLedgerRows(rows => rows.map(item => item.id === row.id ? {...item, usd:e.target.value} : item))} className="min-w-0 rounded border border-border bg-background px-1 py-1 text-center text-[10px] tabular-nums" />
                              <input aria-label={'مبلغ افغانی ' + row.title} inputMode="decimal" value={row.afn} onChange={e => setLedgerRows(rows => rows.map(item => item.id === row.id ? {...item, afn:e.target.value} : item))} className="min-w-0 rounded border border-border bg-background px-1 py-1 text-center text-[10px] tabular-nums" />
                            </div>
                          ))}
                          <div className="grid grid-cols-[1.2fr_.7fr_.7fr] gap-1 border-t-2 border-primary/30 bg-primary/5 px-2 py-2 text-[9px] font-bold">
                            <span>جمع حساب مشتری</span>
                            <span className="text-center tabular-nums" dir="ltr">$ {formatAmount(sumField(ledgerRows, 'usd'))}</span>
                            <span className="text-center tabular-nums">{formatAmount(sumField(ledgerRows, 'afn'))} ؋</span>
                          </div>
                        </div>
                      ) : activeId === 'cash' ? (
                        <div className="mt-3 overflow-hidden rounded-md border border-border">
                          <div className="grid grid-cols-[1.2fr_.7fr_.7fr] gap-1 bg-muted px-2 py-2 text-[9px] font-bold">
                            <span>نام صندوق</span><span className="text-center">دالر</span><span className="text-center">افغانی</span>
                          </div>
                          {cashRows.map(row => (
                            <div key={row.id} className="grid grid-cols-[1.2fr_.7fr_.7fr] items-center gap-1 border-t border-border px-2 py-2">
                              <span className="text-[9px]">{row.title}</span>
                              <input aria-label={'موجودی دالر ' + row.title} inputMode="decimal" value={row.usd} onChange={e => setCashRows(rows => rows.map(item => item.id === row.id ? {...item, usd:e.target.value} : item))} className="min-w-0 rounded border border-border bg-background px-1 py-1 text-center text-[10px] tabular-nums" />
                              <input aria-label={'موجودی افغانی ' + row.title} inputMode="decimal" value={row.afn} onChange={e => setCashRows(rows => rows.map(item => item.id === row.id ? {...item, afn:e.target.value} : item))} className="min-w-0 rounded border border-border bg-background px-1 py-1 text-center text-[10px] tabular-nums" />
                            </div>
                          ))}
                          <div className="grid grid-cols-[1.2fr_.7fr_.7fr] gap-1 border-t-2 border-primary/30 bg-primary/5 px-2 py-2 text-[9px] font-bold">
                            <span>جمع کل صندوق‌ها</span>
                            <span className="text-center tabular-nums" dir="ltr">$ {formatAmount(sumField(cashRows, 'usd'))}</span>
                            <span className="text-center tabular-nums">{formatAmount(sumField(cashRows, 'afn'))} ؋</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded border border-dashed border-border bg-muted/20 p-4 text-center">
                          <b className="text-[11px]">{active.label}</b>
                          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">محتوای فرم، جدول یا گزارش این بخش در داخل همین پنجره نمایش داده می‌شود.</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-bold">قواعد نمایش موبایل</p>
            <ul className="mt-2 list-disc space-y-1 pr-4 text-[10px] leading-5 text-muted-foreground">
              <li>هیچ آیکون یا شبکه میانبر در این چیدمان استفاده نمی‌شود.</li>
              <li>منوها به شکل نوشتاری و کلاسیک در بالای صفحه قرار دارند.</li>
              <li>با انتخاب هر گزینه، پنجره مستقل همان بخش باز می‌شود.</li>
              <li>پنجره در اندازه صفحه موبایل جا می‌گیرد و دکمه بستن دارد.</li>
              <li>این صفحه فقط پیش‌نمایش رابط است و به اطلاعات مالی زنده وصل نیست.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
