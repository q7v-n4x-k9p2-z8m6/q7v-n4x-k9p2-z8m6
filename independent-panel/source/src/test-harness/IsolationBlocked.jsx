// test-harness/IsolationBlocked.jsx — توقف ایمن وقتی جدا‌سازی برقرار نشود
import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function IsolationBlocked({ isolation }) {
  const checks = isolation?.checks || [];
  return (
    <div className="th-root" dir="rtl" lang="fa">
      <div className="th-shell">
        <main className="th-main th-fail">
          <ShieldAlert className="h-8 w-8" />
          <h1>محیط آزمون متوقف شد</h1>
          <p>
            جدا‌سازی کامل حافظه و شبکه تأیید نشد؛ برای جلوگیری از هر تغییر، رابط آزمون بارگذاری نمی‌شود.
            این صفحه هیچ داده‌ای نمی‌خواند و نمی‌نویسد.
          </p>
          <ul className="th-checks">
            {checks.map((item) => (
              <li key={item.key} className={item.ok ? 'is-ok' : 'is-bad'}>
                {item.ok ? '✓' : <X className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}