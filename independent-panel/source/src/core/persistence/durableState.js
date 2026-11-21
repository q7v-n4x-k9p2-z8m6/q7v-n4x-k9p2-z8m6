// src/core/persistence/durableState.js — قرارداد ذخیره‌سازی پایدار مشترک موبایل و لپ‌تاپ
// یک شکل ذخیره، یک کلید گره‌خورده به صرافی و یک نسخهٔ داده برای هر دو پوسته.
// این ماژول به localStorage/IndexedDB وابسته نیست؛ هر حافظه‌ای که سه عملیات زیر را داشته باشد می‌پذیرد.
// در برنامه، موتور نسخهٔ ۲۱ با IndexedDB ذخیره می‌کند؛ این قرارداد همان شکل ذخیره را می‌سنجد.

export const STATE_VERSION = 1;

// کلید مشترک دو پوسته: کاربر + صرافی (همان قالبی که میز کار نسخهٔ ۲۱ استفاده می‌کند)
export const tenantStateKey = (user) => 'user:' + (user?.id || 'anonymous') + ':exchange:' + (user?.exchange_code || user?.exchangeCode || 'DEMO-EX');

export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

export function encodeState(payload) {
  return JSON.stringify({ version: STATE_VERSION, savedAt: new Date().toISOString(), payload });
}

// خواندن با نگهبان نسخه: نسخهٔ ناشناخته یا فایل خراب، دادهٔ خالی می‌دهد و خطا نمی‌سازد
export function decodeState(raw) {
  if (raw === null || raw === undefined || raw === '') return { ok: false, reason: 'EMPTY', payload: null };
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, reason: 'CORRUPT', payload: null }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'CORRUPT', payload: null };
  if (Number(parsed.version) !== STATE_VERSION) return { ok: false, reason: 'VERSION', payload: null };
  return { ok: true, reason: 'OK', payload: parsed.payload ?? null, savedAt: parsed.savedAt };
}

export function createPersistedState({ storage, user }) {
  const key = tenantStateKey(user);
  return {
    key,
    read() { try { return decodeState(storage.getItem(key)); } catch { return { ok: false, reason: 'UNAVAILABLE', payload: null }; } },
    write(payload) { try { storage.setItem(key, encodeState(payload)); return true; } catch { return false; } },
    clear() { try { storage.removeItem(key); return true; } catch { return false; } },
  };
}

// آزمون قرارداد: رفت و برگشت، جداسازی صرافی، نسخهٔ نادرست و دادهٔ خراب
export function runPersistenceTests(factory) {
  const results = [];
  const run = (name, fn) => {
    try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, message: error?.message || String(error) }); }
  };
  const expect = (condition, message) => { if (!condition) throw new Error(message); };
  const user = { id: 'u1', exchange_code: 'EX-1' };

  run('نوشتن و خواندن همان داده', () => {
    const store = createPersistedState({ storage: factory(), user });
    expect(store.write({ customers: [{ id: 'c1' }], settings: { theme: 'light' } }) === true, 'نوشتن انجام نشد.');
    const read = store.read();
    expect(read.ok && read.payload.customers[0].id === 'c1', 'داده بازخوانی نشد.');
    expect(read.payload.settings.theme === 'light', 'تنظیمات بازخوانی نشد.');
  });

  run('نشست صرافی‌ها از هم جدا می‌ماند', () => {
    const storage = factory();
    const first = createPersistedState({ storage, user });
    const second = createPersistedState({ storage, user: { id: 'u1', exchange_code: 'EX-2' } });
    first.write({ customers: [{ id: 'c1' }] });
    expect(second.read().ok === false, 'دادهٔ صرافی اول برای صرافی دوم خوانده شد.');
  });

  run('نسخهٔ نادرست داده نمی‌دهد و خطا نمی‌سازد', () => {
    const storage = factory();
    const store = createPersistedState({ storage, user });
    storage.setItem(store.key, JSON.stringify({ version: 99, payload: { customers: [] } }));
    const read = store.read();
    expect(read.ok === false && read.reason === 'VERSION', 'نسخهٔ نادرست پذیرفته شد.');
  });

  run('فایل خراب داده نمی‌دهد و خطا نمی‌سازد', () => {
    const storage = factory();
    const store = createPersistedState({ storage, user });
    storage.setItem(store.key, '{not-json');
    expect(store.read().ok === false, 'فایل خراب پذیرفته شد.');
    expect(store.read().reason === 'CORRUPT', 'دلیل خرابی گزارش نشد.');
  });

  run('پاک‌سازی داده را برمی‌دارد', () => {
    const store = createPersistedState({ storage: factory(), user });
    store.write({ customers: [] });
    store.clear();
    expect(store.read().ok === false, 'پاک‌سازی انجام نشد.');
  });

  run('کلید ذخیره به کاربر و صرافی گره خورده است', () => {
    expect(tenantStateKey(user) === 'user:u1:exchange:EX-1', 'قالب کلید تغییر کرد.');
    expect(tenantStateKey(null) === 'user:anonymous:exchange:DEMO-EX', 'کلید پیش‌فرض تغییر کرد.');
  });

  return results;
}