// test-harness/isolation.js — نگهبان‌های محیط آزمون
// پیش از سوار شدن رابط آزمون نصب می‌شوند و هر تلاش نوشتن در حافظهٔ مرورگر یا
// هر درخواست تغییردهندهٔ شبکه را می‌بندند. هیچ داده‌ای ذخیره نمی‌شود.
const state = {
  installed: false,
  ok: false,
  checks: [],
  blocked: [],
};

const stamp = () => new Date().toISOString();

function log(api, method, detail) {
  state.blocked.push({ api, method, detail: detail || '', at: stamp() });
  if (state.blocked.length > 120) state.blocked.shift();
}

function define(target, key, descriptor) {
  if (!target) return false;
  try {
    Object.defineProperty(target, key, descriptor);
    return true;
  } catch {
    return false;
  }
}

function check(key, label, ok) {
  state.checks.push({ key, label, ok: Boolean(ok) });
}

function installStorage(name, real) {
  const facade = {
    getItem: (key) => {
      try { return real ? real.getItem(key) : null; } catch { return null; }
    },
    key: (index) => {
      try { return real ? real.key(index) : null; } catch { return null; }
    },
    get length() {
      try { return real ? real.length : 0; } catch { return 0; }
    },
    setItem: () => { log(name, 'setItem'); },
    removeItem: () => { log(name, 'removeItem'); },
    clear: () => { log(name, 'clear'); },
  };
  const ok = define(window, name, { configurable: true, get: () => facade });
  check(name, name === 'localStorage' ? 'localStorage — نوشتن مسدود' : 'sessionStorage — نوشتن مسدود', ok);
}

function installIndexedDb() {
  const idb = window.indexedDB;
  if (!idb) {
    check('indexedDB', 'IndexedDB در این مرورگر وجود ندارد', true);
    return;
  }
  const blockedOpen = define(idb, 'open', {
    configurable: true,
    writable: true,
    value: function blockedOpen() {
      log('indexedDB', 'open');
      throw new Error('باز کردن IndexedDB در محیط آزمون مسدود است.');
    },
  });
  const blockedDelete = define(idb, 'deleteDatabase', {
    configurable: true,
    writable: true,
    value: function blockedDelete() {
      log('indexedDB', 'deleteDatabase');
      throw new Error('حذف پایگاه دادهٔ محلی در محیط آزمون مسدود است.');
    },
  });

  // حتی اگر در جایی به پایگاه داده دسترسی پیدا شود، تراکنش نوشتنی به فقط‌خواندنی تبدیل می‌شود.
  const proto = window.IDBDatabase && window.IDBDatabase.prototype;
  let txOk = false;
  if (proto && typeof proto.transaction === 'function') {
    const original = proto.transaction;
    txOk = define(proto, 'transaction', {
      configurable: true,
      writable: true,
      value: function guardedTransaction(storeNames, mode) {
        const nextMode = String(mode || 'readonly').toLowerCase();
        if (nextMode !== 'readonly') {
          log('IDBDatabase', 'transaction', nextMode);
          return original.call(this, storeNames, 'readonly');
        }
        return original.call(this, storeNames, nextMode);
      },
    });
  }
  check('indexedDB', 'IndexedDB — باز کردن و تراکنش نوشتنی مسدود', blockedOpen && blockedDelete && txOk);
}

function installCookies() {
  const ok = define(Document.prototype, 'cookie', {
    configurable: true,
    get() { return ''; },
    set() { log('document', 'cookie'); },
  });
  check('cookie', 'کوکی — نوشتن مسدود', ok);
}

function installCaches() {
  if (!window.caches) {
    check('caches', 'Cache Storage در این مرورگر وجود ندارد', true);
    return;
  }
  const facade = {
    open: () => { log('caches', 'open'); return Promise.reject(new Error('Cache Storage مسدود است.')); },
    delete: () => { log('caches', 'delete'); return Promise.reject(new Error('Cache Storage مسدود است.')); },
    has: () => Promise.resolve(false),
    keys: () => Promise.resolve([]),
    match: () => Promise.resolve(undefined),
  };
  const ok = define(window, 'caches', { configurable: true, get: () => facade });
  check('caches', 'Cache Storage — نوشتن مسدود', ok);
}

function installServiceWorker() {
  const sw = navigator.serviceWorker;
  if (!sw || !sw.register) {
    check('serviceWorker', 'Service Worker در این مرورگر وجود ندارد', true);
    return;
  }
  const ok = define(sw, 'register', {
    configurable: true,
    writable: true,
    value: () => {
      log('serviceWorker', 'register');
      return Promise.reject(new Error('ثبت Service Worker در محیط آزمون مسدود است.'));
    },
  });
  check('serviceWorker', 'Service Worker — ثبت مسدود', ok);
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function methodOf(input, init) {
  const candidate = (init && init.method) || (input && typeof input === 'object' && input.method) || 'GET';
  return String(candidate).toUpperCase();
}

function installNetwork() {
  if (typeof window.fetch === 'function') {
    const original = window.fetch.bind(window);
    const ok = define(window, 'fetch', {
      configurable: true,
      writable: true,
      value: function guardedFetch(input, init) {
        const method = methodOf(input, init);
        if (!SAFE_METHODS.includes(method)) {
          log('fetch', method);
          return Promise.reject(new Error('درخواست تغییردهندهٔ شبکه در محیط آزمون مسدود است.'));
        }
        return original(input, init);
      },
    });
    check('fetch', 'شبکه — فقط درخواست خواندنی', ok);
  }

  const xhrProto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
  let xhrOk = false;
  if (xhrProto) {
    const originalOpen = xhrProto.open;
    const originalSend = xhrProto.send;
    xhrOk = define(xhrProto, 'open', {
      configurable: true,
      writable: true,
      value: function guardedOpen(method, url, ...rest) {
        this.__harnessMethod = String(method || 'GET').toUpperCase();
        return originalOpen.call(this, method, url, ...rest);
      },
    });
    xhrOk = define(xhrProto, 'send', {
      configurable: true,
      writable: true,
      value: function guardedSend(...args) {
        const method = this.__harnessMethod || 'GET';
        if (!SAFE_METHODS.includes(method)) {
          log('XMLHttpRequest', method);
          throw new Error('درخواست تغییردهندهٔ شبکه در محیط آزمون مسدود است.');
        }
        return originalSend.apply(this, args);
      },
    }) && xhrOk;
    check('xhr', 'XMLHttpRequest — فقط درخواست خواندنی', xhrOk);
  }

  if (typeof navigator.sendBeacon === 'function') {
    define(navigator, 'sendBeacon', {
      configurable: true,
      writable: true,
      value: () => { log('navigator', 'sendBeacon'); return false; },
    });
  }
}

export function installIsolation() {
  if (state.installed) return getIsolationStatus();
  state.installed = true;

  installStorage('localStorage', window.localStorage);
  installStorage('sessionStorage', window.sessionStorage);
  installIndexedDb();
  installCookies();
  installCaches();
  installServiceWorker();
  installNetwork();

  state.ok = state.checks.length > 0 && state.checks.every((item) => item.ok);
  return getIsolationStatus();
}

export function getIsolationStatus() {
  return {
    installed: state.installed,
    ok: state.ok,
    checks: state.checks.slice(),
    blocked: state.blocked.slice(),
    blockedCount: state.blocked.length,
  };
}

// آزمایش عملی: تلاش برای نوشتن در هر مسیر حافظه؛ همه باید مسدود شوند.
export function probeStorageWrites() {
  const before = state.blocked.length;
  const attempts = [
    { name: 'localStorage.setItem', run: () => window.localStorage.setItem('__harness_probe__', '1') },
    { name: 'sessionStorage.setItem', run: () => window.sessionStorage.setItem('__harness_probe__', '1') },
    { name: 'document.cookie', run: () => { document.cookie = '__harness_probe__=1'; } },
    { name: 'indexedDB.open', run: () => window.indexedDB.open('__harness_probe__') },
  ];
  const results = attempts.map((attempt) => {
    const mark = state.blocked.length;
    try { attempt.run(); } catch { /* مسدودشدن با خطا هم نتیجهٔ درست است */ }
    return { name: attempt.name, blocked: state.blocked.length > mark };
  });
  return {
    results,
    newEntries: state.blocked.slice(before),
    allBlocked: results.every((row) => row.blocked),
  };
}