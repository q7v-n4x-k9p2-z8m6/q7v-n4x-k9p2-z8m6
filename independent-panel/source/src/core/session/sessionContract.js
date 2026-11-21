// src/core/session/sessionContract.js — قرارداد نشست و حفظ نقش‌ها
// هیچ رمز، توکن یا درخواست شبکه‌ای در این لایه نیست؛ فقط شکل نشست، اعتبارسنجی نقش،
// نگاشت به هویت پلتفرم و تصمیم پوسته/دسترسی تعریف و آزمون می‌شود.
// ورود واقعی (اتصال به هویت بیرونی) عمداً در این ماژول انجام نمی‌شود.
import { ROLE_MIGRATION } from '@/core/transfer/authMigration';
import { checkPermission, roleLevel, canManageRole } from '@/core/domain/access';

export const SESSION_SOURCES = { DEMO: 'demo', PLATFORM: 'platform', SSO: 'sso' };

const BY_LOCAL_ROLE = new Map(ROLE_MIGRATION.map((row) => [row.local, row]));

export const knownRoles = () => ROLE_MIGRATION.map((row) => row.local);

export const isKnownRole = (role) => BY_LOCAL_ROLE.has(String(role || ''));

// نشست خام (از هر منبعی) → نشست معتبر؛ نقش ناشناخته هرگز با پیش‌فرض پذیرفته نمی‌شود
export function resolveSession(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'نشست خالی است.' };
  const userId = String(raw.userId ?? raw.id ?? '');
  if (!userId) return { ok: false, reason: 'شناسهٔ کاربر در نشست نیست.' };
  const role = String(raw.role || '');
  const mapping = BY_LOCAL_ROLE.get(role);
  if (!mapping) return { ok: false, reason: 'نقش «' + (role || '—') + '» در نگاشت نقش‌ها نیست.' };
  return {
    ok: true,
    session: {
      userId,
      role,
      level: mapping.level,
      exchangeCode: String(raw.exchangeCode ?? raw.exchange_code ?? ''),
      source: raw.source || SESSION_SOURCES.DEMO,
      permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
      platformRole: mapping.platformRole,
      sarraafLevel: mapping.sarraafLevel,
      fullName: raw.fullName ?? raw.full_name ?? '',
    },
  };
}

// نگاشت رفت و برگشت: نقش محلی ← هویت پلتفرم (بدون تغییر نقش پلتفرم برای صراف و کارمند)
export function toPlatformIdentity(session) {
  if (!session) return null;
  return {
    platformRole: session.platformRole,
    sarraafLevel: session.sarraafLevel,
    exchangeCode: session.exchangeCode,
  };
}

export function roleFromIdentity(identity) {
  const match = ROLE_MIGRATION.find(
    (row) => row.platformRole === identity?.platformRole && row.sarraafLevel === identity?.sarraafLevel,
  );
  return match ? match.local : null;
}

export const can = (session, section, action) => Boolean(session) && checkPermission(session.permissions, section, action);

// پوسته: مشتری فقط پوستهٔ مشتری، نقش‌های صرافی پوستهٔ صراف، بقیه ورود
export function shellFor(session) {
  if (!session) return { shell: 'none', route: '/login' };
  if (session.role === 'customer') return { shell: 'customer', route: '/customer' };
  if (roleLevel(session.role) >= roleLevel('employee')) return { shell: 'sarraaf', route: '/dashboard' };
  return { shell: 'none', route: '/login' };
}

export const canManage = (actor, targetRole) => Boolean(actor) && canManageRole(actor.role, targetRole);

export const sessionKey = (exchangeCode) => 'a1_session:' + (exchangeCode || 'DEMO-EX');

// ذخیرهٔ نشست با کلید گره‌خورده به صرافی؛ خواندن نشست با کلید صرافی دیگر نشست نمی‌دهد
export function createSessionStore(storage) {
  return {
    save(session) {
      const key = sessionKey(session?.exchangeCode);
      storage.setItem(key, JSON.stringify({ version: 1, session }));
      return key;
    },
    load(exchangeCode) {
      let raw = null;
      try { raw = storage.getItem(sessionKey(exchangeCode)); } catch { return null; }
      if (!raw) return null;
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { return null; }
      const result = resolveSession(parsed?.session);
      return result.ok && result.session.exchangeCode === (exchangeCode || '') ? result.session : null;
    },
    clear(exchangeCode) {
      storage.removeItem(sessionKey(exchangeCode));
    },
  };
}

export const createMemoryStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
};

// آزمون رفت و برگشت نقش و پوسته برای همهٔ نقش‌های نگاشت‌شده
export function runSessionTests() {
  const results = [];
  const run = (name, fn) => {
    try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, message: error?.message || String(error) }); }
  };
  const expect = (condition, message) => { if (!condition) throw new Error(message); };
  const staff = ROLE_MIGRATION.find((row) => row.local === 'sarraaf');
  const makeSession = (role, extra = {}) => resolveSession({ userId: 'u-' + role, role, exchangeCode: 'EX-1', ...extra }).session;

  run('نقش ناشناخته پذیرفته نمی‌شود', () => {
    expect(resolveSession({ userId: 'u1', role: 'root' }).ok === false, 'نقش ناشناخته پذیرفته شد.');
    expect(resolveSession(null).ok === false, 'نشست خالی پذیرفته شد.');
  });

  run('هر پنج نقش در نگاشت رفت و برگشت', () => {
    ROLE_MIGRATION.forEach((row) => {
      const session = makeSession(row.local);
      const identity = toPlatformIdentity(session);
      const back = roleFromIdentity(identity);
      const backRow = ROLE_MIGRATION.find((item) => item.local === back) || {};
      expect(Boolean(session), 'نشست نقش ' + row.local + ' ساخته نشد.');
      expect(session.exchangeCode === 'EX-1', 'صرافی نشست حفظ نشد.');
      // نقش پلتفرم عمداً کلی‌تر است؛ بازگشت باید همان نقش پلتفرم و همان سطح تخصص را بدهد
      expect(backRow.platformRole === row.platformRole && backRow.sarraafLevel === row.sarraafLevel,
        'نگاشت رفت و برگشت ' + row.local + ' نادرست است.');
      expect(session.level === staffLevel(row.local), 'سطح نقش ' + row.local + ' حفظ نشد.');
    });
  });

  run('پوسته و مسیر بر پایهٔ نقش', () => {
    expect(shellFor(makeSession('customer')).shell === 'customer', 'مشتری پوستهٔ خودش را نگرفت.');
    expect(shellFor(makeSession('employee')).shell === 'sarraaf', 'کارمند پوستهٔ صراف را نگرفت.');
    expect(shellFor(null).shell === 'none', 'نشست خالی پوسته گرفت.');
  });

  run('مجوز بخش با نشست اعمال می‌شود', () => {
    const employee = makeSession('employee', { permissions: [] });
    expect(can(employee, 'cash', 'view') === false, 'بدون مجوز، دسترسی باز شد.');
    const allowed = makeSession('employee', { permissions: [{ section: 'cash', can_view: true }] });
    expect(can(allowed, 'cash', 'view') === true, 'مجوز داده‌شده اعمال نشد.');
  });

  run('مدیریت نقش پایین‌تر و رد نقش بالاتر', () => {
    expect(canManage(makeSession('sarraaf'), 'employee') === true, 'مدیریت کارمند رد شد.');
    expect(canManage(makeSession('employee'), 'sarraaf') === false, 'کارمند مدیر را مدیریت کرد.');
  });

  run('نشست ذخیره و در همان صرافی بازخوانی می‌شود', () => {
    const storage = createMemoryStorage();
    const store = createSessionStore(storage);
    const session = makeSession('admin');
    store.save(session);
    expect(store.load('EX-1')?.role === 'admin', 'نشست ذخیره‌شده بازخوانی نشد.');
    expect(store.load('EX-2') === null, 'نشست یک صرافی برای صرافی دیگر خوانده شد.');
    store.clear('EX-1');
    expect(store.load('EX-1') === null, 'پاک‌کردن نشست کار نکرد.');
  });

  run('نشست ذخیره‌شدهٔ نامعتبر کنار گذاشته می‌شود', () => {
    const storage = createMemoryStorage();
    const store = createSessionStore(storage);
    storage.setItem(sessionKey('EX-1'), JSON.stringify({ version: 1, session: { id: 'u1', role: 'root' } }));
    expect(store.load('EX-1') === null, 'نقش نامعتبر از حافظه پذیرفته شد.');
  });

  return results;
}

function staffLevel(role) {
  const row = ROLE_MIGRATION.find((item) => item.local === role);
  return row ? row.level : 0;
}