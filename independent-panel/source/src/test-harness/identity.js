// test-harness/identity.js — هویت آزمایشی ثابت و فقط‌خواندنی
// این هویت در حافظهٔ همین صفحه ساخته می‌شود؛ نه نشست، نه توکن، نه رمز و نه کوکی.
export const TEST_IDENTITY = Object.freeze({
  id: 'harness-readonly-viewer',
  name: 'بازدیدکنندهٔ آزمایشی',
  role: 'test_viewer',
  permissions: Object.freeze(['view']),
  canWrite: false,
  session: 'in-memory-only',
  note: 'بدون ورود، نشست ذخیره‌شده و توکن؛ پیمایش و ویرایش موقت فقط در حافظهٔ همین تب.',
});