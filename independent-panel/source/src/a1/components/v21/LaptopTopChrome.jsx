// a1/components/v21/LaptopTopChrome.jsx — نوار عنوان، منوی اصلی و ردیف میان‌برهای چیدمان لپ‌تاپ
// در داشبورد درون قاب خودش (inline) و در صفحات داخلی به‌صورت نوار ثابت بالای صفحه (fixed).
import React, { useEffect, useRef, useState } from 'react';
import { Minus, Square, X, Minimize2 } from 'lucide-react';
import SarraafLogo from '@/a1/components/SarraafLogo';
import useExchangeStatus from '@/a1/lib/useExchangeStatus';
import { LAPTOP_MENUS, LAPTOP_SHORTCUTS, LAPTOP_MENU_MODULE_IDS } from './laptopHomeConfig';

export default function LaptopTopChrome({
  canViewModule, canModuleAction, goModule, menuAction, activeModule = 'home', fixed = false,
  exchangeName, exchangeCode, dbStatus, ltDate,
}) {
  const state = useExchangeStatus(dbStatus);
  // منویی که صفحهٔ جاری از آن باز شده، همان‌جا نشانه‌گذاری می‌شود؛
  // صفحه‌هایی مثل «مفاد و زیان» در ردیف میان‌بر نیستند و بی این نشانه، جای کاربر گم می‌شد.
  const activeMenu = LAPTOP_MENUS.find(menu => menu.items.some(([, act]) => act === activeModule))?.label || '';
  // صفحه‌هایی که میان‌بر اختصاصی در ردیف بالا دارند همان‌جا هایلایت می‌شوند؛
  // بقیهٔ صفحه‌ها نام خودشان را کنار منو نشان می‌دهند تا جای کاربر همیشه روشن باشد.
  const activeItemLabel = LAPTOP_MENUS.flatMap(menu => menu.items).find(([, act]) => act === activeModule)?.[0] || '';
  const railHasActive = LAPTOP_SHORTCUTS.some(item => item.id === activeModule);
  const showCurrentPage = Boolean(activeItemLabel) && !railHasActive;
  const [openMenu, setOpenMenu] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const barRef = useRef(null);

  // دکمهٔ «تمام‌صفحه» واقعی است؛ کوچک‌کردن و بستن در مرورگر ممکن نیست و نمایشی اعلام می‌شوند.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const request = document.documentElement.requestFullscreen?.();
    if (request && typeof request.catch === 'function') request.catch(() => {});
  };

  useEffect(() => {
    if (!openMenu) return undefined;
    const close = event => {
      if (barRef.current && !barRef.current.contains(event.target)) setOpenMenu('');
    };
    const onKey = event => { if (event.key === 'Escape') setOpenMenu(''); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  return (
    <div className={'a1-lap-chrome' + (fixed ? ' is-fixed' : '')}>
      <header className="a1-lap__titlebar">
        {/* شناسهٔ صرافی در نوار عنوان: نام و کد صرافی و وضعیت اتصال، هم‌ردیف با دکمه‌های پنجره */}
        <div className="a1-lap__brand" role="group" aria-label="شناسهٔ صرافی">
          <SarraafLogo size={20} />
          <span className="a1-lap__brand-title">{exchangeName || 'حساب صراف'}</span>
          {exchangeCode && (
            <>
              <span className="a1-lap__brand-sep">|</span>
              <bdi dir="ltr" className="a1-lap__brand-code">{exchangeCode}</bdi>
            </>
          )}
          <span className={`a1-lap__identity-status is-${state.key}`} aria-live="polite">
            <span className="a1-lap__identity-dot" aria-hidden="true" />
            <span>صراف {state.label}</span>
          </span>
          {ltDate && <span className="a1-lap__brand-date">{ltDate}</span>}
        </div>
        <div className="a1-lap__controls">
          {/* کوچک‌کردن و بستن در مرورگر ممکن نیست؛ به‌جای دکمهٔ بی‌اثر، نشانهٔ تزئینی و بدون تعامل */}
          <span className="a1-lap__ctrl-mark" aria-hidden="true"><Minus /></span>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه'}
            aria-label={isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 /> : <Square />}
          </button>
          <span className="a1-lap__ctrl-mark" aria-hidden="true"><X /></span>
        </div>
      </header>

      <nav className="a1-lap__menubar" aria-label="منوی اصلی" ref={barRef}>
        {LAPTOP_MENUS.map(menu => (
          <div key={menu.label} className="a1-lap__menu">
            <button
              type="button"
              aria-expanded={openMenu === menu.label}
              aria-current={activeMenu === menu.label ? 'true' : undefined}
              className={'a1-lap__menu-trigger ' + (openMenu === menu.label ? 'is-open ' : '') + (activeMenu === menu.label ? 'is-current' : '')}
              onClick={() => setOpenMenu(openMenu === menu.label ? '' : menu.label)}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && (
              <div className="a1-lap__menu-popover" role="menu" aria-label={`گزینه‌های منوی ${menu.label}`}>
                {menu.items.map(([label, act]) => {
                  const moduleAction = LAPTOP_SHORTCUTS.some(item => item.id === act) || LAPTOP_MENU_MODULE_IDS.includes(act);
                  const disabled = !act
                    || (moduleAction && !canViewModule(act))
                    || (['cashIn', 'cashOut'].includes(act) && !canModuleAction('cash', 'create'));
                  return (
                    <button
                      key={act || label}
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      onClick={event => { event.currentTarget.blur(); setOpenMenu(''); if (!disabled) menuAction(act); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {showCurrentPage ? (
          <span className="a1-lap__current" aria-current="page" title="صفحهٔ باز‌شده">
            <i aria-hidden="true" />{activeItemLabel}
          </span>
        ) : null}
      </nav>

      <div
        className="a1-lap__rail"
        role="toolbar"
        aria-label="میان‌برهای ماژول"
        style={{ gridTemplateColumns: `repeat(${LAPTOP_SHORTCUTS.length}, minmax(0, 1fr))` }}
      >
        {LAPTOP_SHORTCUTS.map(item => {
          const Icon = item.icon;
          const allowed = canViewModule(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={'a1-lap__rail-btn ' + (activeModule === item.id ? 'is-active' : '')}
              disabled={!allowed}
              title={allowed ? item.label : 'مجوز مشاهده این بخش برای حساب شما فعال نیست'}
              onClick={event => { event.currentTarget.blur(); if (allowed) goModule(item.id); }}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}