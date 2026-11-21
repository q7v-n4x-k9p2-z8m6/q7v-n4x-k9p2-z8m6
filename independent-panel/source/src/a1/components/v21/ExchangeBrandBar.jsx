// a1/components/v21/ExchangeBrandBar.jsx — پنجرهٔ نوار بالای قاب لپ‌تاپ
// دو حالت دارد:
//  • variant="exchange" (پیش‌فرض): نام و کد صرافی و وضعیت اتصال.
//  • variant="brand": عنوان «حساب صراف» و تاریخ روز (در داشبورد، شناسهٔ صرافی به نوار عنوان رفته است).
// فقط نمایشی است؛ هیچ داده‌ای را تغییر نمی‌دهد.
import React from 'react';
import SarraafLogo from '@/a1/components/SarraafLogo';
import useExchangeStatus from '@/a1/lib/useExchangeStatus';

export default function ExchangeBrandBar({ exchangeName, exchangeCode, dbStatus, variant = 'exchange', date }) {
  const state = useExchangeStatus(dbStatus);

  if (variant === 'brand') {
    return (
      <div className="a1-lap__identity" role="group" aria-label="شناسهٔ برنامه">
        <div className="a1-lap__identity-window">
          <div className="a1-lap__identity-brand">
            <SarraafLogo size={16} />
            <div className="a1-lap__identity-name is-inline">
              <b>حساب صراف</b>
              {date && <span className="a1-lap__identity-date">{date}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="a1-lap__identity" role="group" aria-label="شناسهٔ صرافی">
      <div className="a1-lap__identity-window">
        <div className="a1-lap__identity-brand">
          <SarraafLogo size={16} />
          <div className="a1-lap__identity-name">
            <b>{exchangeName || 'صرافی'}</b>
            <span>
              {exchangeCode
                ? <>کد صرافی: <bdi dir="ltr">{exchangeCode}</bdi></>
                : 'کد صرافی ثبت نشده است'}
            </span>
          </div>
        </div>
        <div className={`a1-lap__identity-status is-${state.key}`} aria-live="polite">
          <span className="a1-lap__identity-dot" aria-hidden="true" />
          <span>صراف {state.label}</span>
        </div>
      </div>
    </div>
  );
}