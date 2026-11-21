// src/adapters/a1/laptopEngineGateway.js — درگاه دادهٔ لپ‌تاپ روی همان موتور نسخهٔ ۲۱
// قرارداد کامل درگاه (۱۳ عملیات) روی موتور مشترک پیاده می‌شود؛ دادهٔ موازی ساخته نمی‌شود.
// پل پیش‌فرض همان a1EngineGateway است (خواندن/نوشتن نسخهٔ ۲۱) و برای آزمون می‌توان پل حافظه‌ای داد.
import { a1EngineGateway } from '@/adapters/a1/a1EngineGateway';
import { matchesQuery, createId, GatewayError } from '@/core/gateway/contract';

// مجموعه‌هایی که موتور نسخهٔ ۲۱ مالک آن‌هاست
const ENGINE_COLLECTIONS = new Set([
  'customers', 'branches', 'cash', 'banks', 'currencies', 'accounts',
  'expenses', 'remittance', 'exchange', 'journal', 'ledger', 'reports',
  'transactions', 'activity', 'errors',
]);

const normalizeReverse = (result) => (result?.counter
  ? result
  : {
    reversedCount: result?.reversedCount || 0,
    counter: { number: result?.documents?.[0]?.reversalNumber || '' },
  });

export function createLaptopEngineGateway({ bridge = a1EngineGateway } = {}) {
  let extras = {};
  // اگر پل، عکس فوری همگام داشته باشد درگاه از همان لحظهٔ ساخت خواندنی است
  let data = typeof bridge.snapshot === 'function' ? { ...bridge.snapshot() } : {};
  let revision = 0;
  const listeners = new Set();
  let readyPromise = null;

  const emit = () => {
    revision += 1;
    listeners.forEach((listener) => listener(data, revision));
  };

  const load = async () => {
    const result = await bridge.load();
    data = { ...(result?.data || {}), ...extras };
    emit();
    return data;
  };

  const reload = async () => {
    readyPromise = load();
    try {
      return await readyPromise;
    } catch (error) {
      readyPromise = null;
      throw error;
    }
  };

  const findRecord = (collection, id) => (data[collection] || []).find((row) => String(row.id) === String(id)) || null;
  const isEngine = (collection) => ENGINE_COLLECTIONS.has(collection);

  const writeExtra = (collection, updater) => {
    const current = Array.isArray(extras[collection]) ? extras[collection] : (Array.isArray(data[collection]) ? data[collection] : []);
    const next = updater(current);
    extras = { ...extras, [collection]: next };
    data = { ...data, [collection]: next };
    emit();
    return next;
  };

  return {
    kind: 'a1-engine-laptop',
    // دو پوسته روی یک موتور می‌خوانند و می‌نویسند؛ این نشانه برای سنجش اشتراک است
    engine: 'a1-engine',

    snapshot() { return data; },
    revision() { return revision; },

    list(collection, query) {
      return (data[collection] || []).filter((row) => matchesQuery(row, query));
    },
    get(collection, id) { return findRecord(collection, id); },
    count(collection, query) {
      return (data[collection] || []).filter((row) => matchesQuery(row, query)).length;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    ready() {
      if (!readyPromise) readyPromise = load().catch((error) => { readyPromise = null; throw error; });
      return readyPromise;
    },

    reload,

    async loadForEdit(module, record) {
      if (!bridge.loadForEdit) return { ...record };
      return bridge.loadForEdit(module, record);
    },

    async create(collection, record) {
      if (!isEngine(collection)) {
        const row = { ...record, id: record?.id || createId('x-') };
        writeExtra(collection, (rows) => [row, ...rows]);
        return row;
      }
      const result = await bridge.save(collection, record);
      await reload();
      return result || {};
    },

    async update(collection, id, patch) {
      if (!isEngine(collection)) {
        if (!findRecord(collection, id)) throw new GatewayError('NOT_FOUND', 'رکورد برای ویرایش پیدا نشد.');
        writeExtra(collection, (rows) => rows.map((row) => (String(row.id) === String(id) ? { ...row, ...patch, id: row.id } : row)));
        return findRecord(collection, id);
      }
      const record = findRecord(collection, id);
      if (!record) throw new GatewayError('NOT_FOUND', 'رکورد برای ویرایش پیدا نشد.');
      const result = await bridge.edit(collection, { ...record, ...patch, id: record.id });
      await reload();
      return result || {};
    },

    async remove(collection, id) {
      if (!isEngine(collection)) {
        if (!findRecord(collection, id)) throw new GatewayError('NOT_FOUND', 'رکورد برای حذف پیدا نشد.');
        writeExtra(collection, (rows) => rows.filter((row) => String(row.id) !== String(id)));
        return true;
      }
      throw new GatewayError('LOCKED', 'حذف فیزیکی اطلاعات حسابداری غیرفعال است؛ سند را ابطال یا رکورد را غیرفعال کنید.');
    },

    async deactivate(collection, id) {
      const record = findRecord(collection, id);
      if (!record) throw new GatewayError('NOT_FOUND', 'رکورد برای غیرفعال‌سازی پیدا نشد.');
      if (!isEngine(collection)) {
        writeExtra(collection, (rows) => rows.map((row) => (String(row.id) === String(id) ? { ...row, status: 'غیرفعال' } : row)));
        return findRecord(collection, id);
      }
      const result = await bridge.deactivate(collection, record);
      await reload();
      return result || {};
    },

    async reverse(collection, id, reason) {
      const record = findRecord(collection, id);
      if (!record) throw new GatewayError('NOT_FOUND', 'سند برای ابطال پیدا نشد.');
      if (!isEngine(collection)) {
        throw new GatewayError('INVALID_TARGET', 'ابطال فقط برای اسناد مالی است؛ رکورد تعریف‌شده غیرفعال می‌شود.');
      }
      const result = await bridge.reverse(collection, record, reason);
      await reload();
      return normalizeReverse(result);
    },

    async replaceAll(collection, value) {
      if (bridge.replaceAll) {
        await bridge.replaceAll(collection, value);
        await reload();
        return value;
      }
      if (isEngine(collection)) {
        throw new GatewayError('LOCKED', 'دادهٔ حسابداری از موتور محلی خوانده می‌شود و با جایگزینی پاک نمی‌شود.');
      }
      extras = { ...extras, [collection]: value };
      data = { ...data, [collection]: value };
      emit();
      return value;
    },

    async clearExcept(keep = []) {
      if (bridge.clearExcept) {
        await bridge.clearExcept(keep);
        await reload();
        return data;
      }
      const next = { ...extras };
      Object.keys(next).forEach((key) => {
        if (!keep.includes(key) && Array.isArray(next[key])) next[key] = [];
      });
      extras = next;
      data = { ...data, ...next };
      emit();
      return data;
    },

    async reset() {
      extras = {};
      if (bridge.reset) {
        await bridge.reset();
      }
      await reload();
      return data;
    },
  };
}