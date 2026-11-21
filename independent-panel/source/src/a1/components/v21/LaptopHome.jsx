// a1/components/v21/LaptopHome.jsx — داشبورد اصلی در چیدمان لپ‌تاپ
// ترکیب تمام‌پنجره: نوار عنوان و منو و میان‌برها (LaptopTopChrome)، عنوان داشبورد، چهار کارت خلاصه،
// شش گروه امکانات، عملیات سریع و نوار تماس/دستورات — همان ساختار تصویر مرجع.
// فقط در عرض لپ‌تاپ نمایش داده می‌شود؛ نمای موبایل دست‌نخورده می‌ماند.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, CalendarDays, Check, Pencil, Trash2, Printer,
  ArrowDown, ArrowUp, Send, Download, ArrowLeftRight,
} from 'lucide-react';
import LaptopTopChrome from './LaptopTopChrome';
import { LAPTOP_GROUPS, LAPTOP_STATS } from './laptopHomeConfig';
import './laptop-home.css';

export default function LaptopHome({
  data, fmt, ltDate, ltUserName, dbStatus,
  canViewModule, canModuleAction, goModule, openNew, cashAction, menuAction, printPage,
  exchangeName, exchangeCode, tradeProfit,
}) {
  const navigate = useNavigate();
  const connected = dbStatus === 'connected';
  const todayKey = new Date().toLocaleDateString('en-CA');

  // «عملیات امروز» سندهای امروز است، نه سطرهای دفتر؛ هر سند چند سطر دارد.
  const todayDocuments = new Set();
  (data.transactions || []).forEach((row) => {
    if (row.date !== todayKey) return;
    todayDocuments.add(String(row.documentId ?? row.number ?? row.id));
  });

  const statValue = key => {
    if (key === 'customers') return connected ? fmt((data.customers || []).length) : '-';
    if (key === 'cash') return connected ? fmt((data.cash || []).length) : '-';
    if (key === 'today') return connected ? fmt(todayDocuments.size) : '-';
    // مفاد معاملات از ماژول محاسباتی خوانده می‌شود؛ فقط در نبود معاملهٔ قابل محاسبه «نامشخص» می‌ماند.
    if (key === 'profit') return tradeProfit && tradeProfit.computed ? fmt(tradeProfit.profitBase) : 'نامشخص';
    return '-';
  };

  const runTile = tile => {
    if (tile.unavailable) return;
    if (tile.path) { navigate(tile.path); return; }
    if (tile.module) { if (canViewModule(tile.module)) goModule(tile.module); return; }
    if (tile.create) {
      if (canViewModule(tile.need) && canModuleAction(tile.need, 'create')) openNew(tile.create);
      return;
    }
    if (tile.action) menuAction(tile.action);
  };

  return (
    <div dir="rtl" lang="fa" className="a1-lap" role="region" aria-label="داشبورد حساب صراف — چیدمان لپ‌تاپ">
      {/* ردیف شناسهٔ مستقل حذف شد؛ نام، کد و تاریخ در نوار عنوان آبی هستند */}
      <LaptopTopChrome
        homeMode
        ltDate={ltDate}
        canViewModule={canViewModule}
        canModuleAction={canModuleAction}
        goModule={goModule}
        menuAction={menuAction}
        activeModule="home"
        exchangeName={exchangeName}
        exchangeCode={exchangeCode}
        dbStatus={dbStatus}
      />

      <main className="a1-lap__main print-area">
        <div className="a1-lap__band">
          <div className="a1-lap__band-date"><CalendarDays /><span>{ltDate}</span></div>
          <h1 className="a1-lap__band-title">مرکز عملیات صرافی</h1>
          <Home className="a1-lap__band-home" aria-hidden="true" />
        </div>

        <div className="a1-lap__stats">
          {LAPTOP_STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="a1-lap__stat">
                <div className="a1-lap__stat-head"><Icon /><span>{stat.label}</span></div>
                <b className={stat.unknown ? 'a1-lap__stat-unknown' : undefined}>{statValue(stat.key)}</b>
              </div>
            );
          })}
        </div>

        <div className="a1-lap__groups">
          {LAPTOP_GROUPS.map(group => (
            <section key={group.key} className="a1-lap__group">
              <div className="a1-lap__group-title">{group.title}</div>
              <div className="a1-lap__group-tiles">
                {group.tiles.map(tile => {
                  const Icon = tile.icon;
                  const allowed = tile.unavailable
                    ? false
                    : tile.path
                      ? true
                      : tile.module
                      ? canViewModule(tile.module)
                      : tile.create
                        ? canViewModule(tile.need) && canModuleAction(tile.need, 'create')
                        : Boolean(tile.action);
                  const reason = tile.unavailable
                    ? tile.unavailable
                    : allowed ? tile.label : 'این گزینه برای حساب شما فعال نیست';
                  return (
                    <button
                      key={tile.label}
                      type="button"
                      className={'a1-lap__tile' + (tile.unavailable ? ' is-unavailable' : '')}
                      data-off={tile.unavailable ? 'true' : undefined}
                      disabled={!allowed}
                      title={reason}
                      aria-disabled={!allowed}
                      onClick={() => { if (allowed) runTile(tile); }}
                    >
                      <Icon />
                      <span>{tile.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="a1-lap__quick">
          <div className="a1-lap__quick-title">عملیات سریع</div>
          <div className="a1-lap__quick-actions">
            <button type="button" disabled={!canModuleAction('cash', 'create')} onClick={() => cashAction('دخل')}>
              <ArrowDown /><span>ثبت دخل صندوق</span>
            </button>
            <button type="button" disabled={!canModuleAction('cash', 'create')} onClick={() => cashAction('خرج')}>
              <ArrowUp /><span>ثبت خرج صندوق</span>
            </button>
            <button type="button" disabled={!canModuleAction('remittance', 'create')} onClick={() => openNew('remittance', { direction: 'ارسالی' })}>
              <Send /><span>حواله ارسالی</span>
            </button>
            <button type="button" disabled={!canModuleAction('remittance', 'create')} onClick={() => openNew('remittance', { direction: 'دریافتی' })}>
              <Download /><span>حواله دریافتی</span>
            </button>
            <button type="button" disabled={!canModuleAction('exchange', 'create')} onClick={() => openNew('exchange')}>
              <ArrowLeftRight /><span>معامله اسعار</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="a1-lap__status">
        <div className="a1-lap__status-actions">
          <button type="button" className="a1-lap__action" disabled title="برای ثبت، ابتدا بخش مورد نظر را از منو یا میان‌برها باز کنید">
            <Check color="#2ea043" /><span>ثبت</span>
          </button>
          <button type="button" className="a1-lap__action" disabled title="برای ویرایش، ابتدا یک ردیف را در بخش مورد نظر انتخاب کنید">
            <Pencil color="#2f6fdb" /><span>ویرایش</span>
          </button>
          <button type="button" className="a1-lap__action" disabled title="برای حذف یا ابطال، ابتدا یک ردیف را در بخش مورد نظر انتخاب کنید">
            <Trash2 color="#d83a3a" /><span>حذف</span>
          </button>
          <button type="button" className="a1-lap__action" onClick={printPage}>
            <Printer color="#14213d" /><span>چاپ</span>
          </button>
        </div>
        <div className="a1-lap__status-info" dir="rtl">
          <span id="sb-info-user">کاربر: <b>{ltUserName || 'کاربر'}</b></span>
          <i aria-hidden="true" />
          <span id="sb-info-date">تاریخ: <b>{ltDate}</b></span>
          <i aria-hidden="true" />
          <span id="sb-info-version">نسخه: <b>۲۲</b></span>
        </div>
      </footer>
    </div>
  );
}