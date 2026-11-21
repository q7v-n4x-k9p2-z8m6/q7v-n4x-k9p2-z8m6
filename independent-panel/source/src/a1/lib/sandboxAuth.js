// ورود سروری تا مرحلهٔ اتصال رسمی نسخهٔ ۲۲ عمداً غیرفعال است.
// این فایل هیچ نشانی، کلید یا درخواست شبکه‌ای ندارد؛ ظاهر صفحهٔ ورود در LoginOriginal حفظ می‌شود.
// برای پیش‌نمایش محلی از مسیر /login-demo استفاده می‌شود.

export const SANDBOX_TOKEN_KEY = 'hisab_sarraf_v22_sandbox_token';

function unavailable() {
  const error = new Error(
    'ورود نام کاربری و رمز تا زمان اتصال رسمی سرویس هویت نسخهٔ ۲۲ فعال نیست. برای پیش‌نمایش از «ورود محلی» استفاده کنید.'
  );
  error.code = 'auth_not_connected';
  throw error;
}

export async function sandboxLogin() {
  return unavailable();
}

export async function sandboxVerify() {
  return unavailable();
}
