// Isolated client for the HEX library stored in B2 Supabase.
// Reads B2's public browser config without loading it into A1's global config.
import { createClient } from '@supabase/supabase-js';

let clientPromise;

export function getLayoutHexSupabase() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const response = await fetch(
        'https://raw.githubusercontent.com/roohalla41-blip/B2/backup/a1-copy-review/public/runtime-config.js',
        { cache: 'no-store' }
      );
      if (!response.ok) throw new Error('تنظیمات اتصال فضای HEX در B2 دریافت نشد.');
      const source = await response.text();
      const url = source.match(/url:\s*["']([^"']+)["']/)?.[1];
      const key = source.match(/key:\s*["']([^"']+)["']/)?.[1];
      if (!url || !key || !url.includes('wwlyvojtsrklcpqsloqz.supabase.co')) {
        throw new Error('تنظیمات معتبر پروژه ذخیره‌سازی HEX در B2 پیدا نشد.');
      }

      const appTokenFetch = async (requestUrl, options = {}) => {
        const headers = new Headers(options.headers || {});
        try {
          const token = localStorage.getItem('auth_token');
          if (token) headers.set('x-app-token', token);
        } catch { /* localStorage may be unavailable */ }
        return fetch(requestUrl, { ...options, headers });
      };

      return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: appTokenFetch },
      });
    })();
  }
  return clientPromise;
}
