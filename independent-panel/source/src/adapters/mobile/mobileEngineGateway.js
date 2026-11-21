// src/adapters/mobile/mobileEngineGateway.js — درگاه دادهٔ موبایل روی همان موتور محلی لپ‌تاپ
// موبایل دیگر دادهٔ جداگانه ندارد: می‌خواند و می‌نویسد روی همان IndexedDB و همان توابع نسخهٔ ۲۱.
// هیچ دیتابیس، سرویس بیرونی یا ساختار تازه‌ای ساخته نمی‌شود؛ فقط نگاشت شکل داده برای نمایش موبایل.
import { a1EngineGateway } from '@/adapters/a1/a1EngineGateway';
import {
  saveVersion21Record, editVersion21Record, deactivateVersion21MasterRecord,
  reverseVersion21Record, loadVersion21RecordForEdit,
} from '@/a1/lib/v21Write';
import { createDemoData } from '@/demo/seed';
import { matchesQuery } from '@/core/gateway/contract';

const num = (value) => Number(String(value ?? '').replaceAll(',', '')) || 0;

// مجموعه‌هایی که از موتور محلی خوانده می‌شوند (همهٔ دادهٔ حسابداری)
const ENGINE_COLLECTIONS = new Set([
  'customers', 'branches', 'cash', 'banks', 'currencies', 'accounts',
  'expenses', 'remittance', 'exchange', 'journal', 'ledger', 'reports',
  'transactions', 'activity', 'errors',
]);
const MASTER_COLLECTIONS = new Set(['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts']);

const EXCHANGE_KIND_TO_ENGINE = { 'خرید': 'buy', 'فروش': 'sell', 'تبدیل': 'convert', buy: 'buy', sell: 'sell', convert: 'convert' };
const EXCHANGE_KIND_TO_MOBILE = { buy: 'خرید', sell: 'فروش', convert: 'تبدیل' };

const settlementToMobile = (value) => (value === 'instant' || value === 'فوری' ? 'instant' : 'suspense');
const settleTypeToMobile = (value) => (value === 'bank' || value === 'بانک' ? 'bank' : 'cash');

const EMPTY = {
  customers: [], branches: [], cash: [], banks: [], currencies: [], accounts: [],
  expenses: [], remittance: [], exchange: [], journal: [], ledger: [], reports: [],
  transactions: [], activity: [], errors: [], rates: [], profitRows: [],
  chatGroups: [], products: [], orders: [], settings: {},
};

// بخش‌های نمایشی غیرحسابداری (چت، محصولات، تنظیمات) در همین مرورگر و فقط در حافظه می‌مانند
function initialExtras() {
  const seed = createDemoData();
  return { chatGroups: seed.chatGroups, products: seed.products, orders: seed.orders, settings: seed.settings };
}

function shapeForMobile(engineData, extras) {
  const currencies = engineData.currencies || [];
  // حساب مادر در فرم موبایل با کد نمایش داده می‌شود؛ هنگام نوشتن دوباره به شناسه برمی‌گردد
  const accountCodeById = new Map((engineData.accounts || []).map((row) => [String(row.id), row.code]));
  return {
    ...EMPTY,
    ...engineData,
    // آدرس مشتری در موتور در ستون توضیحات نگه داشته می‌شود؛ فرم موبایل فیلد آدرس دارد
    customers: (engineData.customers || []).map((row) => ({
      ...row,
      address: row.description || row.address || '',
    })),
    accounts: (engineData.accounts || []).map((row) => ({
      ...row,
      parentId: row.parentId ? (accountCodeById.get(String(row.parentId)) || '') : '',
    })),
    // نرخ روز برای نمایش: همان ارزهای تعریف‌شده در موتور
    rates: currencies.map((row) => ({ id: row.id, code: row.code, name: row.name, buy: row.rate, sell: row.rate })),
    profitRows: engineData.profitByCurrency || [],
    // نگاشت شکل سند برای فیلدهای فرم موبایل (نام‌های موتور حفظ می‌شوند)
    exchange: (engineData.exchange || []).map((row) => ({
      ...row,
      kind: EXCHANGE_KIND_TO_MOBILE[row.kind] || row.kind,
      foreignCurrency: row.fromCurrency,
      foreignAmount: row.fromAmount,
      baseCurrency: row.toCurrency,
      baseAmount: row.toAmount,
      foreignCash: row.cashFrom,
      baseCash: row.cashTo,
    })),
    remittance: (engineData.remittance || []).map((row) => ({
      ...row,
      settlement: settlementToMobile(row.settlement),
      settleType: settleTypeToMobile(row.settleType),
    })),
    ...extras,
  };
}

// ورودی فرم موبایل → فراخوانی همان تابع نوشتن نسخهٔ ۲۱
function toEngineWrite(data, collection, record, editing) {
  if (MASTER_COLLECTIONS.has(collection)) {
    if (collection === 'accounts') {
      const parent = (data.accounts || []).find(
        (row) => String(row.code) === String(record.parentId) || String(row.id) === String(record.parentId)
      );
      return { module: 'accounts', draft: { ...record, parentId: parent ? parent.id : '' } };
    }
    return { module: collection, draft: record };
  }
  if (collection === 'transactions') {
    if (editing) return { module: 'transactions', draft: record };
    const amount = num(record.amount);
    return {
      module: 'cashAction',
      draft: { ...record, kind: amount < 0 ? 'خرج' : 'دخل', amount: Math.abs(amount) },
    };
  }
  if (collection === 'exchange') {
    return { module: 'exchange', draft: { ...record, kind: EXCHANGE_KIND_TO_ENGINE[record.kind] || 'convert' } };
  }
  if (collection === 'remittance') {
    return {
      module: 'remittance',
      draft: { ...record, settlement: settlementToMobile(record.settlement), settleType: settleTypeToMobile(record.settleType) },
    };
  }
  return { module: collection, draft: record };
}

export function createMobileEngineGateway() {
  let extras = initialExtras();
  let data = { ...EMPTY, ...extras };
  let revision = 0;
  const listeners = new Set();
  let readyPromise = null;

  const emit = () => {
    revision += 1;
    listeners.forEach((listener) => listener(data, revision));
  };

  const load = async () => {
    const result = await a1EngineGateway.load();
    data = shapeForMobile(result.data || {}, extras);
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

  const ensureCollection = (collection) => {
    if (!Array.isArray(data[collection])) data = { ...data, [collection]: [] };
  };

  const writeExtra = (collection, updater) => {
    const current = Array.isArray(extras[collection]) ? extras[collection] : [];
    const next = updater(current);
    extras = { ...extras, [collection]: next };
    ensureCollection(collection);
    data = { ...data, [collection]: next };
    emit();
    return next;
  };

  const findRecord = (collection, id) => (data[collection] || []).find((row) => String(row.id) === String(id)) || null;

  return {
    kind: 'a1-engine-mobile',
    // هر دو پوسته روی همین یک موتور می‌خوانند و می‌نویسند
    engine: 'a1-engine',

    snapshot() { return data; },
    revision() { return revision; },

    // خواندن با همان پرس‌وجوی استاندارد درگاه، تا موبایل و لپ‌تاپ یک قرارداد داشته باشند
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
      const draft = await loadVersion21RecordForEdit(module, record);
      if (module === 'exchange') {
        return { ...draft, kind: EXCHANGE_KIND_TO_MOBILE[draft.kind] || draft.kind || 'تبدیل' };
      }
      if (module === 'remittance') {
        return { ...draft, settlement: settlementToMobile(draft.settlement), settleType: settleTypeToMobile(draft.settleType) };
      }
      return draft;
    },

    async create(collection, record) {
      if (!ENGINE_COLLECTIONS.has(collection)) {
        return writeExtra(collection, (rows) => [{ ...record, id: record.id || 'x-' + Date.now() }, ...rows])[0];
      }
      const { module, draft } = toEngineWrite(data, collection, record, false);
      const result = await saveVersion21Record(module, draft);
      await reload();
      return result || {};
    },

    async update(collection, id, patch) {
      if (!ENGINE_COLLECTIONS.has(collection)) {
        writeExtra(collection, (rows) => rows.map((row) => (String(row.id) === String(id) ? { ...row, ...patch, id: row.id } : row)));
        return findRecord(collection, id);
      }
      const { module, draft } = toEngineWrite(data, collection, { ...patch, id: patch?.id ?? id }, true);
      const result = await editVersion21Record(module, draft);
      await reload();
      return result || {};
    },

    async remove(collection, id) {
      if (!ENGINE_COLLECTIONS.has(collection)) {
        writeExtra(collection, (rows) => rows.filter((row) => String(row.id) !== String(id)));
        return true;
      }
      throw new Error('حذف فیزیکی اطلاعات حسابداری غیرفعال است؛ برای حفظ سوابق، سند را ابطال یا رکورد را غیرفعال کنید.');
    },

    async deactivate(collection, id) {
      const record = findRecord(collection, id);
      if (!record) throw new Error('رکورد برای غیرفعال‌سازی پیدا نشد.');
      const result = await deactivateVersion21MasterRecord(collection, record);
      await reload();
      return result || {};
    },

    async reverse(collection, id, reason) {
      const record = findRecord(collection, id);
      if (!record) throw new Error('سند برای ابطال پیدا نشد.');
      const result = await reverseVersion21Record(collection, record, reason);
      await reload();
      return {
        reversedCount: result?.reversedCount || 0,
        counter: { number: result?.documents?.[0]?.reversalNumber || '' },
      };
    },

    async replaceAll(collection, value) {
      if (ENGINE_COLLECTIONS.has(collection)) {
        throw new Error('دادهٔ حسابداری از موتور محلی خوانده می‌شود و با جایگزینی پاک نمی‌شود.');
      }
      extras = { ...extras, [collection]: value };
      data = { ...data, [collection]: value };
      emit();
      return value;
    },

    // پاک‌سازی نمایشی فقط بخش‌های غیرحسابداری را خالی می‌کند؛ هیچ مشتری یا سندی حذف نمی‌شود
    async clearExcept(keep = []) {
      const next = { ...extras };
      Object.keys(next).forEach((key) => {
        if (!keep.includes(key) && Array.isArray(next[key])) next[key] = [];
      });
      extras = next;
      data = { ...data, ...next };
      emit();
      return data;
    },

    // بازیابی نمایشی: دادهٔ حسابداری از موتور دوباره خوانده می‌شود و بخش‌های نمایشی به حالت اولیه برمی‌گردند
    async reset() {
      extras = initialExtras();
      await reload();
      return data;
    },
  };
}