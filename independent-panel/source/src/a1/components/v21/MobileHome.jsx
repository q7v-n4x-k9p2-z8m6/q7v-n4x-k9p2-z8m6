// a1/components/v21/MobileHome.jsx — میز کار موبایل (فقط نمای کوچک)
// ساختار سالم قبلی میز کار موبایل: عنوان روز، چهار کارت خلاصه، میان‌برهای پرکاربرد،
// عملیات سریع و دکمهٔ «همه امکانات». چیدمان لپ‌تاپ از این فایل استفاده نمی‌کند.
import React from 'react';
import { ArrowDown, ArrowUp, Send, Download, ArrowLeftRight, Layers } from 'lucide-react';
import { displayDate } from '@/core/domain/dates';
import './mobile-home.css';

// میان‌برهای پرکاربرد صفحهٔ خانهٔ موبایل — دو گروه چهارتایی با همان ترتیب دفتر کار
const SHORTCUT_GROUPS = [
  { key: 'daily', title: 'عملیات روزانه', ids: ['cash', 'exchange', 'remittance', 'expenses'] },
  { key: 'parties', title: 'طرف‌حساب‌ها و دفاتر', ids: ['customers', 'customerLedger', 'banks', 'rates'] },
];

export default function MobileHome({
  modules, data, canViewModule, canModuleAction, dbStatus, dailyTransactions, todayStr,
  goModule, cashAction, openNew, fmt, onOpenAll, tradeProfit,
}) {
  // سود خالص معاملات از ماژول محاسباتی خوانده می‌شود؛ فقط وقتی هیچ معامله‌ای قابل محاسبه نباشد «نامشخص» است.
  const profitValue = tradeProfit && tradeProfit.computed ? fmt(tradeProfit.profitBase) : 'نامشخص';

  const quickActions = [
    { label: 'ثبت دخل صندوق', icon: ArrowDown, ok: canModuleAction('cash', 'create'), run: () => cashAction('دخل') },
    { label: 'ثبت خرج صندوق', icon: ArrowUp, ok: canModuleAction('cash', 'create'), run: () => cashAction('خرج') },
    { label: 'حواله ارسالی', icon: Send, ok: canModuleAction('remittance', 'create'), run: () => openNew('remittance', { direction: 'ارسالی' }) },
    { label: 'حواله دریافتی', icon: Download, ok: canModuleAction('remittance', 'create'), run: () => openNew('remittance', { direction: 'دریافتی' }) },
    { label: 'معامله اسعار', icon: ArrowLeftRight, ok: canModuleAction('exchange', 'create'), run: () => openNew('exchange') },
  ];

  const stats = [
    { label: 'تعداد مشتریان', value: canViewModule('customers') ? fmt(data.customers.length) : '—' },
    { label: 'صندوق‌های تعریف‌شده', value: canViewModule('cash') ? fmt(data.cash.length) : '—' },
    { label: 'عملیات امروز', value: canViewModule('reports') || canViewModule('cash') ? fmt(dailyTransactions.length) : '—' },
    { label: 'سود خالص', value: profitValue, tone: tradeProfit && tradeProfit.computed ? 'text-emerald-700' : 'text-amber-700' },
  ];

  return (
    <div className="a1-mobile-home">
      <div className="v21-reference-dashboard-title mb-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#315e80] pb-2">
        <div>
          <div className="text-[9px] text-slate-500">سیستم حسابداری صراف / مرکز عملیات</div>
          <h2 className="a1-mobile-home__title text-sm font-bold text-[#24496d]">مرکز عملیات صرافی</h2>
        </div>
        <div className="text-left text-[10px]">
          <b className="block text-[#24496d]">{displayDate(todayStr) || todayStr}</b>
          <span className={dbStatus === 'connected' ? 'text-emerald-700' : 'text-amber-700'}>
            {dbStatus === 'connected' ? 'اتصال دیتابیس برقرار است' : 'در انتظار اتصال دیتابیس'}
          </span>
        </div>
      </div>

      <div className="v21-reference-stat-grid mb-3 grid grid-cols-2 gap-2">
        {stats.map(item => (
          <div key={item.label} className="v21-reference-stat border border-[#b6c4cf] bg-white px-3 py-2 shadow-sm">
            <span className="text-[10px] text-slate-500">{item.label}</span>
            <b className={'mt-1 block text-lg ' + (item.tone || 'text-[#24496d]')}>{item.value}</b>
          </div>
        ))}
      </div>

      {SHORTCUT_GROUPS.map(group => {
        const items = group.ids
          .filter(canViewModule)
          .map(id => modules.find(item => item.id === id))
          .filter(Boolean);
        if (!items.length) return null;
        return (
          <section key={group.key} className="a1-mobile-home__section">
            <h3 className="a1-mobile-home__section-title">{group.title}</h3>
            <div className="a1-m-shortcuts">
              {items.map(module => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    type="button"
                    className="a1-m-shortcut"
                    title={module.label}
                    onClick={() => goModule(module.id)}
                  >
                    <Icon />
                    <span>{module.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="v21-reference-quick mt-1 border border-[#9aabb9] bg-white p-2">
        <div className="mb-2 border-b border-slate-200 pb-1 text-[11px] font-bold text-[#294d69]">عملیات سریع</div>
        <div className="v21-reference-quick-actions flex flex-wrap gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                disabled={!action.ok}
                aria-disabled={!action.ok}
                onClick={action.run}
                className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="ml-1 inline h-4 w-4" />{action.label}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={onOpenAll} className="a1-mobile-home__all">
        <Layers className="h-4 w-4" /> همه امکانات — تمام بخش‌ها
      </button>
    </div>
  );
}