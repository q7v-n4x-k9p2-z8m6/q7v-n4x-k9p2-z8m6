// احراز هویت محدود پیش‌نمایش برای حساب آزمایشی صراف 33333333
// کلید زیر کلید عمومی anon پروژه است؛ هیچ کلید service-role یا رمز کاربر در مرورگر قرار نمی‌گیرد.
const SUPABASE_URL = 'https://tcivyztftnoodobsdxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaXZ5enRmdG5vb2RvYnNkeGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjIxMzgsImV4cCI6MjEwMTQzODEzOH0.eRpGnZpXil0IwyO8R7g9Dzu7aJp6AN5yKaOU-5gV34s';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sarraf-sandbox-auth`;
export const SANDBOX_TOKEN_KEY = 'a1_sandbox_auth_token';

const messages = {
  invalid_credentials: 'نام کاربری یا رمز عبور نادرست است.',
  sandbox_access_denied: 'این حساب برای ورود به این پیش‌نمایش مجاز نیست.',
  user_inactive: 'وضعیت این حساب فعال نیست.',
  too_many_attempts: 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.',
  invalid_or_expired_token: 'نشست ورود منقضی شده است؛ دوباره وارد شوید.',
  server_configuration_error: 'سرویس ورود موقتاً آماده نیست.',
};

async function request(action, values = {}) {
  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, ...values }),
      signal: controller.signal,
    });
  } catch {
    const error = new Error('پاسخی از سرویس ورود دریافت نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
    error.code = 'network_error';
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  let result = {};
  try { result = await response.json(); } catch { /* پاسخ نامعتبر */ }
  if (!response.ok || result.success !== true) {
    const code = result.error || 'sandbox_auth_error';
    const error = new Error(messages[code] || 'ورود انجام نشد؛ دوباره تلاش کنید.');
    error.code = code;
    error.status = response.status;
    throw error;
  }
  return result;
}

export function sandboxLogin(username, password) {
  return request('login', { username: String(username || '').trim(), password: String(password || '') });
}

export function sandboxVerify(token) {
  return request('verify', { token: String(token || '') });
}
