// src/app/container.js — ریشهٔ ترکیب (Composition Root)
// تنها جایی که پیاده‌سازی درگاه انتخاب می‌شود. رابط کاربری فقط از این‌جا درگاه می‌گیرد.
// برای اتصال نسخهٔ واقعی کافی است آداپتر آن در همین فایل ثبت شود؛ فرم‌ها و صفحه‌ها تغییر نمی‌کنند.
import { createMemoryGateway } from '@/core/gateway/memoryGateway';
import { createDemoData } from '@/demo/seed';
import { a1EngineGateway } from '@/adapters/a1/a1EngineGateway';
import { createMobileEngineGateway } from '@/adapters/mobile/mobileEngineGateway';

let demoGateway = null;

// درگاه دمو: تک‌نمونه در طول عمر صفحه، فقط در حافظه (بارگذاری مجدد = بازگشت به دادهٔ اولیه)
export function getDemoGateway() {
  if (!demoGateway) demoGateway = createMemoryGateway({ seed: createDemoData(), idPrefix: 'm-' });
  return demoGateway;
}

export function resetDemoGateway() {
  if (demoGateway) demoGateway.reset();
  else demoGateway = createMemoryGateway({ seed: createDemoData(), idPrefix: 'm-' });
  return demoGateway;
}

// درگاه میزکار لپ‌تاپ: موتور محلی نسخهٔ ۲۱ (IndexedDB) از طریق آداپتر
export const getDesktopGateway = () => a1EngineGateway;

// درگاه موبایل: همان موتور محلی و همان دادهٔ لپ‌تاپ، با نگاشت شکل نمایش موبایل
let mobileGateway = null;
export function getMobileGateway() {
  if (!mobileGateway) mobileGateway = createMobileEngineGateway();
  return mobileGateway;
}

// بررسی خودکار قرارداد درگاه در محیط توسعه (در نسخهٔ منتشرشده اجرا نمی‌شود)
if (import.meta.env?.DEV) {
  import('@/core/registry/validate')
    .then(({ validateRegistry }) => {
      const report = validateRegistry();
      if (report.errors.length) console.warn('Registry validation failed:', report.errors);
      else console.info(`Registry validation passed (${report.checked} checks)`);
    })
    .catch((error) => console.error('Registry validation error:', error));

  import('@/core/gateway/contractTests')
    .then(({ runGatewayContractTests }) => runGatewayContractTests((seed) => createMemoryGateway({ seed })))
    .then((report) => {
      if (report.failed) console.warn('Gateway contract tests failed:', report.results.filter((item) => !item.ok));
      else console.info(`Gateway contract tests passed (${report.passed}/${report.total})`);
    })
    .catch((error) => console.error('Gateway contract tests error:', error));
}