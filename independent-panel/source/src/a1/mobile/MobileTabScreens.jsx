// a1/mobile/MobileTabScreens.jsx — تب «عملیات» و تب «حسابات»
import React from 'react';
import {
  ArrowDown, ArrowUp, Send, Download, ArrowLeftRight, Receipt, TrendingUp, ArrowLeftRight as TxIcon, ChevronLeft,
} from 'lucide-react';
import { moduleById } from '@/a1/mobile/mobileModules';

function TabHeader({ title, sub }) {
  return (
    <header className="a1m-screen__head" style={{ position: 'static' }}>
      <div className="a1m-screen__titles">
        <div className="a1m-screen__title">{title}</div>
        <div className="a1m-screen__sub">{sub}</div>
      </div>
      <span className="a1m-badge a1m-badge--gold">دموی محلی</span>
    </header>
  );
}

function ModuleRow({ id, hint, onOpenModule }) {
  const module = moduleById(id);
  const Icon = module.icon;
  return (
    <button type="button" className="a1m-listrow" onClick={() => onOpenModule(id)}>
      <span className="a1m-listrow__icon"><Icon className="h-4 w-4" /></span>
      <span className="a1m-listrow__body">
        <b className="a1m-listrow__title">{module.label}</b>
        <small className="a1m-listrow__sub">{hint}</small>
      </span>
      <ChevronLeft className="h-4 w-4" style={{ color: '#9bb0c4' }} />
    </button>
  );
}

export function OpsScreen({ canView, canAction, onOpenModule, onOpenForm, onNavigate }) {
  const quick = [
    { label: 'ثبت دخل صندوق', icon: ArrowDown, allowed: canAction('cash', 'create'), run: () => onOpenForm('cashFlow', { kind: 'دخل' }) },
    { label: 'ثبت خرج صندوق', icon: ArrowUp, allowed: canAction('cash', 'create'), run: () => onOpenForm('cashFlow', { kind: 'خرج' }) },
    { label: 'حواله ارسالی', icon: Send, allowed: canAction('remittance', 'create'), run: () => onOpenForm('remittance', { direction: 'ارسالی' }) },
    { label: 'حواله دریافتی', icon: Download, allowed: canAction('remittance', 'create'), run: () => onOpenForm('remittance', { direction: 'دریافتی' }) },
    { label: 'معامله اسعار', icon: ArrowLeftRight, allowed: canAction('exchange', 'create'), run: () => onOpenForm('exchange', {}) },
    { label: 'ثبت مصرف', icon: Receipt, allowed: canAction('expenses', 'create'), run: () => onOpenForm('expenses', {}) },
  ];

  return (
    <div className="a1m-screen">
      <TabHeader title="عملیات" sub="میان‌برهای عملیاتی موجود — بدون قابلیت تازه" />

      <div className="a1m-quick" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {quick.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} type="button" className="a1m-quick__btn" disabled={!action.allowed} onClick={action.run} style={{ minHeight: 70 }}>
              <Icon />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      <section className="a1m-section" style={{ marginTop: 6 }}>
        <div className="a1m-section__head"><h2 className="a1m-section__title">بخش‌های عملیاتی</h2></div>
        <div style={{ display: 'grid', gap: 7 }}>
          {['exchange', 'remittance', 'expenses', 'rates'].filter(canView).map((id) => (
            <ModuleRow key={id} id={id} hint="فهرست، فرم و سوابق نمایشی" onOpenModule={onOpenModule} />
          ))}
        </div>
      </section>

      <section className="a1m-section">
        <div className="a1m-section__head"><h2 className="a1m-section__title">مرکز معاملات</h2></div>
        <button type="button" className="a1m-listrow" onClick={() => onNavigate('/transactions')}>
          <span className="a1m-listrow__icon"><TxIcon className="h-4 w-4" /></span>
          <span className="a1m-listrow__body">
            <b className="a1m-listrow__title">مرکز معاملات</b>
            <small className="a1m-listrow__sub">فقط خواندنی · دادهٔ ساختگی محلی</small>
          </span>
          <span className="a1m-badge">فقط مشاهده</span>
        </button>
      </section>
    </div>
  );
}

export function AccountsScreen({ canView, onOpenModule }) {
  const ledgers = [
    ['journal', 'ثبت و مشاهدهٔ اسناد روزنامچه'],
    ['ledger', 'سطرهای ثبت‌شدهٔ دفتر کل'],
    ['customerLedger', 'مانده و گردش حساب مشتریان'],
    ['branchLedger', 'مانده و گردش حساب نمایندگی‌ها'],
    ['debtors', 'فهرست بدهکاران و بستانکاران'],
    ['accounts', 'کدینگ حساب‌ها و حساب‌های مادر'],
    ['reports', 'گزارش اسناد و عملیات'],
  ];

  return (
    <div className="a1m-screen">
      <TabHeader title="حسابات" sub="دفاتر و گزارش‌های حسابداری" />
      <div style={{ display: 'grid', gap: 7 }}>
        {ledgers.filter(([id]) => canView(id)).map(([id, hint]) => (
          <ModuleRow key={id} id={id} hint={hint} onOpenModule={onOpenModule} />
        ))}
      </div>
      <p className="a1m-note a1m-note--info">
        دفتر حساب نمایندگی‌ها از همین تب و از فهرست «بیشتر» به یک مقصد یکسان می‌رسد.
      </p>
    </div>
  );
}