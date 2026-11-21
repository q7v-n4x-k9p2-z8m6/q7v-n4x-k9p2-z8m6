// a1/mobile/MobileMoreScreen.jsx — تب «بیشتر»: فهرست کامل بخش‌های مجاز و هفت گروه منو
import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { HOME_GROUPS, MORE_ONLY, MOBILE_MENUS, moduleById } from '@/a1/mobile/mobileModules';

export default function MobileMoreScreen({ canView, onOpenModule, onAction }) {
  const [openMenu, setOpenMenu] = useState('ops');

  const sectionGroups = [
    ...HOME_GROUPS,
    { key: 'more', title: 'سایر بخش‌ها', ids: MORE_ONLY },
  ];

  const runItem = (item) => {
    if (item.module) onOpenModule(item.module);
    else onAction(item.action);
  };

  return (
    <div className="a1m-screen">
      <header className="a1m-screen__head" style={{ position: 'static' }}>
        <div className="a1m-screen__titles">
          <div className="a1m-screen__title">همهٔ امکانات</div>
          <div className="a1m-screen__sub">فهرست کامل بخش‌های مجاز و هفت گروه منو</div>
        </div>
        <span className="a1m-badge a1m-badge--gold">دموی محلی</span>
      </header>

      {sectionGroups.map((group) => {
        const items = group.ids.filter(canView).map(moduleById);
        if (!items.length) return null;
        return (
          <section key={group.key} className="a1m-group" style={{ marginBottom: 0 }}>
            <h3 className="a1m-group__title"><span className="a1m-group__dot" />{group.title}</h3>
            <div style={{ display: 'grid', gap: 5 }}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" className="a1m-menu__item" onClick={() => onOpenModule(item.id)} style={{ borderRadius: 10, borderBottom: 0, background: '#f7fafd' }}>
                    <Icon className="h-4 w-4" style={{ color: '#17527f' }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <ChevronLeft className="h-3.5 w-3.5" style={{ color: '#a9bccd' }} />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="a1m-section">
        <div className="a1m-section__head"><h2 className="a1m-section__title">منوهای برنامه</h2></div>
        <div style={{ display: 'grid', gap: 8 }}>
          {MOBILE_MENUS.map((menu) => {
            const items = menu.items.filter((item) => !item.module || canView(item.module));
            if (!items.length) return null;
            const open = openMenu === menu.key;
            return (
              <div key={menu.key} className="a1m-menu">
                <button type="button" className="a1m-menu__head" onClick={() => setOpenMenu(open ? '' : menu.key)} aria-expanded={open}>
                  <span>{menu.label}</span>
                  <ChevronDown className="h-4 w-4" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease', color: '#7f97ad' }} />
                </button>
                {open ? (
                  <div className="a1m-menu__items">
                    {items.map((item) => (
                      <button key={item.label} type="button" className="a1m-menu__item" onClick={() => runItem(item)}>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ChevronLeft className="h-3.5 w-3.5" style={{ color: '#b1c2d2' }} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <p className="a1m-note">
        پشتیبان‌گیری، بازیابی و پاک‌سازی در این نسخه فقط نمایشی‌اند: هیچ فایلی ساخته یا خوانده نمی‌شود و هیچ رکوردی از هیچ پایگاه داده‌ای حذف نمی‌گردد.
      </p>
    </div>
  );
}