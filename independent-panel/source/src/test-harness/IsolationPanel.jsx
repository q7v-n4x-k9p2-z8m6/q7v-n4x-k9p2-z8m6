// test-harness/IsolationPanel.jsx — وضعیت جدا‌سازی، آزمایش نوشتن و محدودیت‌ها
import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, X, Lock, RefreshCw, FlaskConical } from 'lucide-react';
import { getIsolationStatus, probeStorageWrites } from './isolation';
import { createSessionGateway } from './sessionGateway';
import { TEST_IDENTITY } from './identity';

const LIMITATIONS = [
  'داده‌ها فقط در حافظهٔ همین تب‌اند؛ با تازه‌سازی صفحه به حالت اولیه بازمی‌گردند و چیزی ذخیره نمی‌شود.',
  'ویرایش سطر گردش و اطلاعات حساب فقط از فرم‌های صفحهٔ حساب و در حافظهٔ همین تب انجام می‌شود؛ ثبت سند جدید، حذف و ابطال وجود ندارد.',
  'هیچ اتصالی به دیتابیس، سرور یا سرویس بیرونی ندارد؛ پس احراز هویت واقعی و رفتار شبکه آزموده نمی‌شود.',
  'چیدمان لپ‌تاپ دست‌نخورده است؛ این محیط جایگزین آزمون رومیزی نیست.',
  'برای دسترسی، نشانی /harness (یا ?harness) لازم است؛ در ناوبری برنامه لینک عمومی ندارد.',
];

const VERIFICATION = [
  'بارگذاری /harness بدون اجرای seedIfEmpty و ensureDemoTransactions',
  'صفر نوشتن در localStorage، sessionStorage، IndexedDB و کوکی',
  'هیچ درخواست تغییردهندهٔ شبکه صادر نمی‌شود',
  'رد شدن عملیات عمومی درگاه (create، delete، reverse، reset…) و باز بودن فقط دو فرم ویرایش سطری و حسابی',
  'پیمایش ۹ سناریو و بازگشت به فهرست مبدأ',
  'تازه‌سازی صفحه: بازگشت به وضعیت اولیه بدون هیچ اثر ماندگار',
];

export default function IsolationPanel() {
  const [status, setStatus] = useState(() => getIsolationStatus());
  const [storageProbe, setStorageProbe] = useState(null);
  const [gatewayProbe, setGatewayProbe] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setStatus(getIsolationStatus()), 1500);
    return () => clearInterval(timer);
  }, []);

  const runStorageProbe = () => setStorageProbe(probeStorageWrites());
  const runGatewayProbe = () => setGatewayProbe(createSessionGateway().probe());

  return (
    <div className="th-screen">
      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">
            {status.ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            وضعیت جدا‌سازی
          </h2>
          <span className={`th-badge${status.ok ? ' is-green' : ' is-red'}`}>{status.ok ? 'برقرار' : 'ناقص'}</span>
        </div>

        <div className="th-identity-card">
          <b>{TEST_IDENTITY.name}</b>
          <span>نقش: {TEST_IDENTITY.role} · مجوز: {TEST_IDENTITY.permissions.join(', ')}</span>
          <small>{TEST_IDENTITY.note}</small>
        </div>

        <ul className="th-checks">
          {status.checks.map((item) => (
            <li key={item.key} className={item.ok ? 'is-ok' : 'is-bad'}>
              {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="th-probe-grid">
          <button type="button" className="th-btn" onClick={runStorageProbe}>
            <FlaskConical className="h-4 w-4" />
            آزمایش نوشتن در حافظه
          </button>
          <button type="button" className="th-btn th-btn--ghost" onClick={runGatewayProbe}>
            <Lock className="h-4 w-4" />
            آزمایش عملیات نوشتن
          </button>
        </div>

        {storageProbe ? (
          <div className="th-probe">
            <b>{storageProbe.results.every((row) => row.blocked) ? 'همهٔ تلاش‌های نوشتن مسدود شد' : 'یک مسیر نوشتن مسدود نشد'}</b>
            {storageProbe.results.map((row) => (
              <span key={row.name} className={row.blocked ? 'is-ok' : 'is-bad'}>
                {row.blocked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {row.name}
              </span>
            ))}
          </div>
        ) : null}

        {gatewayProbe ? (
          <div className="th-probe">
            <b>
              {gatewayProbe.allBlocked && gatewayProbe.unchanged
                ? 'همهٔ عملیات درگاه رد شد و دادهٔ نمونه تغییر نکرد'
                : 'نتیجهٔ درگاه نیاز به بررسی دارد'}
            </b>
            {gatewayProbe.results.map((row) => (
              <span key={row.operation} className={row.blocked ? 'is-ok' : 'is-bad'}>
                {row.blocked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {row.operation}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">
            <RefreshCw className="h-4 w-4" />
            تلاش‌های مسدودشده
          </h2>
          <span className="th-section__count">{status.blockedCount} مورد</span>
        </div>
        <div className="th-log">
          {status.blocked.length ? (
            status.blocked.slice(-8).reverse().map((row, index) => (
              <div key={`${row.at}-${index}`} className="th-log__row">
                <b>{row.api}</b>
                <span>{row.method}</span>
                <small>{new Date(row.at).toLocaleTimeString('fa-IR')}</small>
              </div>
            ))
          ) : (
            <div className="th-empty">تا حالا تلاشی برای نوشتن ثبت نشده است.</div>
          )}
        </div>
      </section>

      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">محدودیت‌ها</h2>
        </div>
        <ul className="th-bullets">
          {LIMITATIONS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">برنامهٔ راستی‌آزمایی</h2>
        </div>
        <ol className="th-bullets th-bullets--ordered">
          {VERIFICATION.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>
    </div>
  );
}