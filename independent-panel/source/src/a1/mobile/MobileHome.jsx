// a1/mobile/MobileHome.jsx — خانهٔ مستقل موبایل: چهار آمار، شش گروه کاشی و پنج عملیات سریع
import React from 'react';
import { Users, Wallet, RefreshCw, BarChart3, ArrowDown, ArrowUp, Send, Download, ArrowLeftRight, Info } from 'lucide-react';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { HOME_GROUPS, moduleById } from '@/a1/mobile/mobileModules';
import { fmt, todayISO, currencyLabel } from '@/a1/mobile/demoData';

const persianDate = () => new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date());

export default function MobileHome({ canView, canAction, onOpenModule, onOpenForm, onOpenMore, userName }) {
  const { data } = useMobileDemo();
  const today = todayISO();
  // هر سند چند سطر دفتر دارد؛ شمردن سطرها عدد «عملیات امروز» را چند برابر نشان می‌داد.
  const todayDocs = new Set();
  ['expenses', 'remittance', 'exchange', 'journal', 'transactions'].forEach((collection) => {
    (data[collection] || []).forEach((row) => {
      if (row.date !== today) return;
      todayDocs.add(String(row.documentId ?? row.number ?? row.id));
    });
  });
  const todayOps = todayDocs.size;
  const profit = (data.profitRows || [])[0];

  const stats = [
    { key: 'customers', label: 'تعداد مشتریان', value: canView('customers') ? fmt((data.customers || []).length) : '—', icon: Users },
    { key: 'cash', label: 'صندوق‌های تعریف‌شده', value: canView('cash') ? fmt((data.cash || []).length) : '—', icon: Wallet },
    { key: 'today', label: 'عملیات امروز', value: canView('reports') ? fmt(todayOps) : '—', icon: RefreshCw },
    {
      key: 'profit',
      label: 'مفاد و زیان',
      value: canView('profit') ? (profit ? fmt(profit.revenue - profit.expense) + ' ' + currencyLabel(profit.currency) : 'بدون سند درآمد/مصرف') : '—',
      muted: !profit,
      icon: BarChart3,
    },
  ];

  const quickActions = [
    { label: 'دخل صندوق', icon: ArrowDown, allowed: canAction('cash', 'create'), run: () => onOpenForm('cashFlow', { kind: 'دخل' }) },
    { label: 'خرج صندوق', icon: ArrowUp, allowed: canAction('cash', 'create'), run: () => onOpenForm('cashFlow', { kind: 'خرج' }) },
    { label: 'حواله ارسالی', icon: Send, allowed: canAction('remittance', 'create'), run: () => onOpenForm('remittance', { direction: 'ارسالی' }) },
    { label: 'حواله دریافتی', icon: Download, allowed: canAction('remittance', 'create'), run: () => onOpenForm('remittance', { direction: 'دریافتی' }) },
    { label: 'معامله اسعار', icon: ArrowLeftRight, allowed: canAction('exchange', 'create'), run: () => onOpenForm('exchange', {}) },
  ];

  return (
    <div className="a1m-screen">
      <header className="a1m-hero">
        <div className="a1m-hero__top">
          <div>
            <div className="a1m-hero__eyebrow">سیستم حسابداری صراف</div>
            <h1 className="a1m-hero__title">مرکز عملیات صرافی</h1>
            <div className="a1m-hero__date">{persianDate()}</div>
          </div>
          <span className="a1m-chip a1m-chip--gold">دموی محلی</span>
        </div>
        <div className="a1m-hero__top" style={{ marginTop: 12 }}>
          <span className="a1m-chip">{userName || 'کاربر نمایشی'}</span>
          <span className="a1m-chip">داده‌ها موقت‌اند</span>
        </div>
      </header>

      <div className="a1m-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="a1m-stat">
              <span className="a1m-stat__label">
                <Icon className="ml-1 inline h-3 w-3" style={{ verticalAlign: '-2px', opacity: 0.6 }} />
                {item.label}
              </span>
              <b className={'a1m-stat__value' + (item.muted ? ' a1m-stat__value--muted' : '')}>{item.value}</b>
            </div>
          );
        })}
      </div>

      <section className="a1m-section">
        <div className="a1m-section__head">
          <h2 className="a1m-section__title">عملیات سریع</h2>
          <span className="a1m-section__hint">فرم موجود با مقدار اولیه</span>
        </div>
        <div className="a1m-quick">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} type="button" className="a1m-quick__btn" disabled={!action.allowed} onClick={action.run}>
                <Icon />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {HOME_GROUPS.map((group) => {
        const items = group.ids.filter(canView).map(moduleById);
        if (!items.length) return null;
        return (
          <section key={group.key} className="a1m-group">
            <h3 className="a1m-group__title"><span className="a1m-group__dot" />{group.title}</h3>
            <div className="a1m-tiles">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" className="a1m-tile" style={{ position: 'relative' }} onClick={() => onOpenModule(item.id)}>
                    <span className="a1m-tile__icon"><Icon className="h-4 w-4" /></span>
                    <span className="a1m-tile__label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <button type="button" className="a1m-listrow" onClick={onOpenMore} style={{ marginTop: 4 }}>
        <span className="a1m-listrow__icon"><Info className="h-4 w-4" /></span>
        <span className="a1m-listrow__body">
          <b className="a1m-listrow__title">هفت بخش دیگر در تب «بیشتر»</b>
          <small className="a1m-listrow__sub">دفتر نمایندگی‌ها، نرخ روز، اسعار، سوابق، خطاها، بیلانس و زبان</small>
        </span>
        <span className="a1m-badge">بیشتر</span>
      </button>

      <p className="a1m-note" style={{ marginTop: 12 }}>
        این پوسته دموی محلی است؛ هیچ اتصالی به دیتابیس، Supabase یا سرویس بیرونی ندارد و همهٔ داده‌ها با بارگذاری مجدد صفحه پاک می‌شوند.
      </p>
    </div>
  );
}