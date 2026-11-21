// a1/components/v21/HomeCenter.jsx — «مرکز عملیات صرافی» میز کار نسخه ۲۱
// انتقال مستقیم بخش home از Version21Workspace.jsx سورس A1 (نسخهٔ دسکتاپ و موبایل).
import React from 'react';
import {
  CalendarDays, Home, Users, Vault, RefreshCw, BarChart3, User, Landmark, ArrowLeftRight,
  CreditCard, ShoppingCart, ClipboardList, Bot, Settings, Globe, LifeBuoy,
  ArrowDown, ArrowUp, Send, Download, TrendingUp,
} from 'lucide-react';
import MobileHome from './MobileHome';

export default function HomeCenter({
  data, modules, canViewModule, canModuleAction, dbStatus, dailyTransactions, ltDate, todayStr,
  goModule, cashAction, openNew, navigate, menuAction, fmt, onOpenAll, tradeProfit,
}) {
  // مفاد معاملات از ماژول محاسباتی همین برنامه خوانده می‌شود؛ تا وقتی هیچ معامله‌ای قابل محاسبه نباشد «نامشخص» می‌ماند.
  const profitValue = tradeProfit
    ? (tradeProfit.computed ? fmt(tradeProfit.profitBase) : 'نامشخص')
    : '—';

  const ltGroups = [
    { key: 'define-ledgers', title: 'تعاریف و دفاتر', items: [
      ['تعریف مشتریان', User, () => goModule('customers')],
      ['تعریف نمایندگی‌ها', User, () => goModule('branches')],
      ['دفتر حساب مشتریان', Users, () => goModule('customerLedger')],
    ] },
    { key: 'cash-bank', title: 'صندوق و بانک', items: [
      ['صندوق‌ها و موجودی', Vault, () => goModule('cash')],
      ['بانک و چک', Landmark, () => goModule('banks')],
      ['دفتر حواله‌ها', ArrowLeftRight, () => goModule('remittance')],
    ] },
    { key: 'exchange-ops', title: 'عملیات صرافی', items: [
      ['خرید و فروش اسعار', ArrowLeftRight, () => openNew('exchange')],
      ['مصارف و پرداخت‌ها', CreditCard, () => goModule('expenses')],
      ['معاملات', ArrowLeftRight, () => navigate('/transactions')],
    ] },
    { key: 'accounting-reports', title: 'حسابداری و گزارشات', items: [
      ['دفتر روزنامه ·', ShoppingCart, () => goModule('journal')],
      ['دفتر کل', ClipboardList, () => goModule('ledger')],
      ['نرخ روز', TrendingUp, () => goModule('rates')],
    ] },
    { key: 'extras', title: 'امکانات تکمیلی · اسکلت اولیه', items: [
      ['محصولات آنلاین', ShoppingCart, () => goModule('products')],
      ['گروه و چت', Users, () => goModule('sarraafGroups')],
      ['هوش مصنوعی', Bot, () => goModule('assistant')],
    ] },
    { key: 'settings', title: 'تنظیمات', items: [
      ['تنظیمات', Settings, () => menuAction('settings')],
      ['زبان برنامه', Globe, () => goModule('language')],
      ['درباره برنامه', LifeBuoy],
    ] },
  ];

  const permissionByLabel = {
    'تعریف مشتریان': 'customers', 'تعریف نمایندگی‌ها': 'branches', 'دفتر حساب مشتریان': 'customerLedger',
    'صندوق‌ها و موجودی': 'cash', 'بانک و چک': 'banks', 'دفتر حواله‌ها': 'remittance',
    'خرید و فروش اسعار': 'exchange', 'مصارف و پرداخت‌ها': 'expenses', 'دفتر روزنامه ·': 'journal',
    'دفتر کل': 'ledger', 'نرخ روز': 'rates', 'محصولات آنلاین': 'products', 'گروه و چت': 'sarraafGroups',
    'هوش مصنوعی': 'assistant', 'تنظیمات': 'language', 'زبان برنامه': 'language',
  };

  return (
    <>
      <div className="v21-lt-home hidden lg:block">
        <div className="v21-lt-band">
          <div className="v21-lt-band-date"><CalendarDays /><span>{ltDate}</span></div>
          <h2 className="v21-lt-band-title">مرکز عملیات صرافی</h2>
          <Home className="v21-lt-band-home" aria-hidden="true" />
        </div>
        <div className="v21-lt-stats">
          {[
            ['تعداد مشتریان', Users, canViewModule('customers') && dbStatus === 'connected' ? fmt(data.customers.length) : '-'],
            ['صندوق‌های تعریف‌شده', Vault, canViewModule('cash') && dbStatus === 'connected' ? fmt(data.cash.length) : '-'],
            ['عملیات امروز', RefreshCw, (canViewModule('reports') || canViewModule('cash')) && dbStatus === 'connected' ? fmt(dailyTransactions.length) : '-'],
            ['مفاد معاملات', BarChart3, profitValue],
          ].map(([label, I, value]) => (
            <div key={label} className="v21-lt-stat">
              <div className="v21-lt-stat-head"><I /><span>{label}</span></div>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <div className="v21-lt-groups">
          {ltGroups.map(group => (
            <div key={group.key} data-lt-group={group.key} className="v21-lt-group">
              <div className="v21-lt-group-title">{group.title}</div>
              <div className="v21-lt-group-tiles">
                {group.items.map(([label, I, run]) => {
                  const permissionId = permissionByLabel[label];
                  const createRestricted = ['خرید و فروش اسعار', 'مصارف و پرداخت‌ها'].includes(label);
                  const allowed = Boolean(run) && (!permissionId || canViewModule(permissionId)) && (!createRestricted || canModuleAction(permissionId, 'create'));
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={allowed ? run : undefined}
                      disabled={!allowed}
                      aria-disabled={!allowed}
                      title={allowed ? label : 'این گزینه برای حساب شما فعال نیست'}
                      className={'v21-lt-tile ' + (!allowed ? 'cursor-not-allowed opacity-40' : '')}
                    >
                      <I /><span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="v21-lt-group v21-lt-quick">
          <div className="v21-lt-group-title">عملیات سریع</div>
          <div className="v21-lt-quick-actions">
            <button type="button" disabled={!canModuleAction('cash', 'create')} aria-disabled={!canModuleAction('cash', 'create')} onClick={() => cashAction('دخل')} className="disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown /><span>ثبت دخل صندوق</span></button>
            <button type="button" disabled={!canModuleAction('cash', 'create')} aria-disabled={!canModuleAction('cash', 'create')} onClick={() => cashAction('خرج')} className="disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp /><span>ثبت خرج صندوق</span></button>
            <button type="button" disabled={!canModuleAction('remittance', 'create')} aria-disabled={!canModuleAction('remittance', 'create')} onClick={() => openNew('remittance', { direction: 'ارسالی' })} className="disabled:cursor-not-allowed disabled:opacity-40"><Send /><span>حواله ارسالی</span></button>
            <button type="button" disabled={!canModuleAction('remittance', 'create')} aria-disabled={!canModuleAction('remittance', 'create')} onClick={() => openNew('remittance', { direction: 'دریافتی' })} className="disabled:cursor-not-allowed disabled:opacity-40"><Download /><span>حواله دریافتی</span></button>
            <button type="button" disabled={!canModuleAction('exchange', 'create')} aria-disabled={!canModuleAction('exchange', 'create')} onClick={() => openNew('exchange')} className="disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeftRight /><span>معامله اسعار</span></button>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <MobileHome
          modules={modules}
          data={data}
          canViewModule={canViewModule}
          canModuleAction={canModuleAction}
          dbStatus={dbStatus}
          dailyTransactions={dailyTransactions}
          todayStr={todayStr}
          goModule={goModule}
          cashAction={cashAction}
          openNew={openNew}
          fmt={fmt}
          onOpenAll={onOpenAll}
          tradeProfit={tradeProfit}
        />
      </div>
    </>
  );
}