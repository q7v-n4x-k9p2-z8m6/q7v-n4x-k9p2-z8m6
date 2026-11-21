// test-harness/bootstrap.jsx — نقطهٔ ورود مستقل محیط آزمون
// این مسیر به App، Providerهای ریشه، demoAuth، seedIfEmpty یا درگاه داده وصل نمی‌شود.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { installIsolation, getIsolationStatus } from './isolation';
import HarnessRoot from './HarnessRoot';
import './harness.css';

export function mountHarness(element) {
  if (!element) return;
  installIsolation();
  ReactDOM.createRoot(element).render(<HarnessRoot isolation={getIsolationStatus()} />);
}