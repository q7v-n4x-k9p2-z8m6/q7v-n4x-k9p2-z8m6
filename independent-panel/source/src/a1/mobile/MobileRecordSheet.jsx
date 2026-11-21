// a1/mobile/MobileRecordSheet.jsx — پنجرهٔ درونی یک رکورد در موبایل
// سه دکمهٔ عملیات (ثبت، ویرایش، غیرفعال/ابطال) فقط داخل همین پنجره قرار دارند،
// نه در فهرست بخش‌ها. فهرست فقط برای انتخاب و باز کردن همین پنجره است.
import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function MobileRecordSheet({ title, sub, badge, badgeClass, pairs = [], links = [], actions = [], onClose }) {
  return (
    <section className="a1m-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <header className="a1m-sheet__head">
        <button type="button" className="a1m-sheet__close" onClick={onClose} aria-label="بازگشت به فهرست">
          <ArrowRight className="h-4 w-4" />
        </button>
        <span className="a1m-sheet__title">{title}</span>
        {badge ? <span className={'a1m-badge' + (badgeClass || '')}>{badge}</span> : null}
      </header>

      <div className="a1m-sheet__body" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <div className="a1m-card" style={{ margin: 0 }}>
          <div className="a1m-card__top">
            <div style={{ minWidth: 0 }}>
              <b className="a1m-card__title">{title}</b>
              {sub ? <div className="a1m-card__sub">{sub}</div> : null}
            </div>
          </div>
          {pairs.length ? (
            <div className="a1m-card__meta" style={{ marginTop: 7 }}>
              {pairs.map(([label, value]) => (
                <span key={label} className="a1m-card__pair">{label}: <b>{value}</b></span>
              ))}
            </div>
          ) : null}
        </div>

        {links.length ? (
          <div className="a1m-card" style={{ margin: 0 }}>
            <b className="a1m-card__title">حساب‌های مرتبط این رکورد</b>
            <div style={{ display: 'grid', gap: 6, marginTop: 7 }}>
              {links.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="a1m-badge a1m-badge--blue"
                  style={{ padding: '8px 10px', fontSize: 10, justifyContent: 'space-between', display: 'flex', textAlign: 'right' }}
                  onClick={item.onClick}
                >
                  <span>{item.label}</span>
                  {item.meta ? <b>{item.meta}</b> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {actions.length ? <p className="a1m-note">عملیات این رکورد فقط از همین پنجره انجام می‌شود.</p> : null}
      </div>

      {actions.length ? (
        <div className="a1m-sheet__foot">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={'a1m-btn' + (action.primary ? ' a1m-btn--primary' : '')}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}