// test-harness/ScenarioHome.jsx — سناریوها و فهرست بخش‌ها
import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { HARNESS_MODULES, MODULE_GROUPS } from './harnessModules';
import { fmt } from './format';

export default function ScenarioHome({ gateway, onOpenList, asIndex }) {
  const groups = MODULE_GROUPS;

  if (asIndex) {
    return (
      <div className="th-screen">
        <section className="th-section">
          <div className="th-section__head">
            <h2 className="th-section__title">فهرست بخش‌های قابل پیمایش</h2>
            <span className="th-section__count">{fmt(HARNESS_MODULES.length)} بخش</span>
          </div>
          <div className="th-list">
            {HARNESS_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className="th-row" onClick={() => onOpenList(item.id)}>
                  <div className="th-row__top">
                    <div className="th-row__head">
                      <b className="th-row__title">{item.label}</b>
                      <span className="th-row__sub">{item.note}</span>
                    </div>
                    <span className="th-badge is-blue">{fmt(gateway.list(item.id).length)} رکورد</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="th-note th-note--tight">
            <Lock className="h-3.5 w-3.5" />
            این ۹ سناریو جایگزین فهرست ۲۵ بخش پنل نیستند؛ هر ردیف به شناسهٔ مرجع همان بخش وصل است.
            هر حساب با کلیک روی ردیفش صفحهٔ اختصاصی خودش را باز می‌کند؛ ویرایش فقط در همان صفحه و در حافظهٔ همین تب است.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="th-screen">
      <section className="th-hero">
        <span className="th-hero__eyebrow">
          <ShieldCheck className="h-3.5 w-3.5" />
          محیط جدا و بدون ذخیرهٔ ماندگار
        </span>
        <h1>پیمایش موبایل با صفحهٔ اختصاصی هر حساب</h1>
        <p>
          همهٔ رکوردها سناریوسازی‌شده و فقط در حافظهٔ همین صفحه‌اند. ویرایش‌ها هم در همین تب می‌مانند؛
          نه نشستی ساخته می‌شود، نه داده‌ای ذخیره می‌گردد و نه به دیتابیس یا سرویس بیرونی وصل می‌شود.
        </p>
      </section>

      {groups.map((group) => {
        const items = HARNESS_MODULES.filter((item) => item.group === group);
        if (!items.length) return null;
        return (
          <section key={group} className="th-section">
            <div className="th-section__head">
              <h2 className="th-section__title">{group}</h2>
              <span className="th-section__count">{fmt(items.length)} بخش</span>
            </div>
            <div className="th-grid">
              {items.map((item) => {
                const Icon = item.icon;
                const rows = gateway.list(item.id);
                return (
                  <button key={item.id} type="button" className="th-card th-card--tap" onClick={() => onOpenList(item.id)}>
                    <span className="th-card__icon"><Icon className="h-4 w-4" /></span>
                    <b className="th-card__title">{item.label}</b>
                    <span className="th-card__sub">{item.note}</span>
                    <span className="th-card__count">{fmt(rows.length)} رکورد</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="th-note">
        <Lock className="h-3.5 w-3.5" />
        ثبت سند جدید، حذف، ابطال و ارسال در این محیط وجود ندارند؛ درگاه پیش از هر اثر جانبی آن‌ها را رد می‌کند.
        ویرایش سطر و اطلاعات حساب فقط در صفحهٔ همان حساب و در حافظهٔ این تب اعمال می‌شود.
      </p>
    </div>
  );
}