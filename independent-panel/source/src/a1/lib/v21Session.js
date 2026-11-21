// نشست محلی محیط مستقل نسخهٔ ۲۲؛ مستقل از نشست نسخهٔ ۲۱
// فقط برای پیش‌نمایش محلی است و احراز هویت واقعی را فعال نمی‌کند.
export const DEMO_EXCHANGE_CODE = 'DEMO-EX';
const SESSION_KEY = 'hisab_sarraf_v22_session';

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || null;
  } catch {
    return null;
  }
}

export function sessionContext() {
  const user = currentUser();
  if (!user?.id) throw new Error('نشست معتبر صراف پیدا نشد. دوباره وارد حساب شوید.');
  return {
    exchangeCode: user.exchange_code || DEMO_EXCHANGE_CODE,
    userId: String(user.id),
    role: String(user.role || '').toLowerCase(),
    userName: user.full_name || user.name || user.username || 'کاربر',
    userType: user.role || 'admin',
  };
}