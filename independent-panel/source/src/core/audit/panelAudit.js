// src/core/audit/panelAudit.js — ممیزی سرتاسری پنل صراف روی دادهٔ ساختگی و محلی
// هر آزمون یک درگاه تازه می‌سازد تا نتیجه‌ها به هم وابسته نباشند.
// این فایل فقط قاعده و داده را می‌خواند؛ هیچ نوشتنی روی دیتابیس، حافظهٔ مرورگر یا سرویس بیرونی ندارد.
import { createMemoryGateway } from '@/core/gateway/memoryGateway';
import { createDemoData, DEMO_EMPLOYEE_PERMISSIONS } from '@/demo/seed';
import { CORE_MODULES, HOME_GROUPS, MORE_ONLY } from '@/core/registry/modules';
import { MOBILE_MODULES, MODULE_ICONS, MOBILE_MENUS } from '@/a1/mobile/mobileModules';
import { LAPTOP_MENU_MODULE_IDS, LAPTOP_SHORTCUTS } from '@/a1/components/v21/laptopHomeConfig';
import { SCHEMAS, MASTER_FORM_MODULES, CURRENCIES } from '@/core/registry/schemas';
import { MASTER_FORMS } from '@/core/registry/masterForms';
import { buildDraft, validate, normalize, collectionFor, num, cashFlowDraft } from '@/core/domain/posting';
import { isLocked, REVERSIBLE_COLLECTIONS } from '@/core/domain/reversal';
import { cashBalance, partyTotals } from '@/core/domain/balances';
import { POSTING_COLLECTIONS } from '@/core/domain/ledger';
import { buildCsv, columnsFor, findSourceDocument } from '@/a1/mobile/mobileExport';
import { checkPermission, canManageRole } from '@/core/domain/access';
import { daysAgo, todayISO } from '@/core/domain/dates';

const NOW = todayISO();
const fresh = () => createMemoryGateway({ seed: createDemoData(), idPrefix: 'audit-' });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const eq = (actual, expected, message) => assert(actual === expected, `${message} (${actual} ≠ ${expected})`);

export const MASTER_SAMPLES = {
  customers: { code: 'T-900', name: 'مشتری آزمون', kind: 'دائمی', phone: '0700', currency: 'AFN', opening: 1000, status: 'فعال' },
  branches: { code: 'B-90', name: 'نمایندگی آزمون', city: 'کابل', phone: '040', status: 'فعال' },
  cash: { name: 'صندوق آزمون', currency: 'AFN', opening: 5000, status: 'فعال' },
  banks: { name: 'بانک آزمون', account: '999-000', currency: 'AFN', opening: 0, status: 'فعال', description: '' },
  currencies: { code: 'TST', name: 'ارز آزمون', symbol: 'T', rate: 1.5, active: 'فعال' },
  accounts: { code: '6100', name: 'حساب مصرف آزمون', accountType: 'expense', nature: 'بدهکار', parentId: '', currency: '', status: 'فعال', description: '' },
};

export const POSTING_SAMPLES = {
  expenses: {
    date: NOW, title: 'مصرف آزمون', expenseAccount: '5000 — مصارف اداری', currency: 'AFN',
    amount: 1200, payerType: 'cash', cash: 'صندوق افغانی مرکزی', bank: '', note: '',
  },
  remittance: {
    date: NOW, direction: 'ارسالی', sender: 'فرستندهٔ آزمون', receiver: 'گیرندهٔ آزمون', branch: 'نمایندگی هرات',
    currency: 'USD', amount: 1000, fee: 20, settlement: 'instant', settleType: 'cash', cash: 'صندوق دالر', bank: '', note: '',
  },
  exchange: {
    date: NOW, kind: 'خرید', party: 'شرکت الفتح', foreignCurrency: 'USD', foreignAmount: 100,
    baseCurrency: 'AFN', baseAmount: 7100, foreignCash: 'صندوق دالر', baseCash: 'صندوق افغانی مرکزی', fee: 10, note: '',
  },
  journal: {
    date: NOW, description: 'سند آزمون', currency: 'AFN', journalMode: 'simple',
    rows: [{ account: '1010 — صندوق‌ها', debit: 500, credit: '' }, { account: '4000 — درآمد کمیشن', debit: '', credit: 500 }],
  },
  cashFlow: {
    date: NOW, kind: 'دخل', partyType: 'customer', party: 'حاجی نصیر احمد', currency: 'AFN',
    amount: 25000, cash: 'صندوق افغانی مرکزی', description: 'گردش آزمون',
  },
};

const sumBy = (rows, key) => rows.reduce((sum, row) => sum + num(row[key]), 0);
const netByCurrency = (rows) => {
  const totals = new Map();
  rows.forEach((line) => {
    const currency = line.currency || 'AFN';
    totals.set(currency, (totals.get(currency) || 0) + num(line.debit) - num(line.credit));
  });
  return [...totals.values()];
};
const partyNet = (data, party) => partyTotals(data, 'customer', party, 0, 'AFN')
  .reduce((sum, row) => sum + row.net, 0);

async function createPosting(gateway, collection) {
  const sample = POSTING_SAMPLES[collection];
  eq(validate(collection, sample, gateway.snapshot()), '', `اعتبارسنجی نمونهٔ ${collection}`);
  const saved = await gateway.create(collectionFor(collection), normalize(collection, sample));
  assert(saved.id, 'شناسهٔ سند ساخته نشد.');
  return saved;
}

async function postingRoundTrip(collection) {
  const gateway = fresh();
  const saved = await createPosting(gateway, collection);
  assert(saved.number, 'سند شمارهٔ یکتا نگرفت.');
  assert(saved.status === 'قطعی', 'وضعیت سند قطعی نیست.');

  const data = gateway.snapshot();
  const lines = data.ledger.filter((line) => line.documentId === saved.id);
  assert(lines.length >= 2, 'سطرهای دفتر کل برای سند ساخته نشد.');
  if (collection !== 'exchange') {
    netByCurrency(lines).forEach((net) => assert(Math.abs(net) < 0.005, 'سند در یک ارز تراز نیست.'));
  }

  const report = data.reports.find((row) => row.documentId === saved.id);
  assert(report, 'ردیف گزارش عملیات برای سند ساخته نشد.');
  eq(report.number, saved.number, 'شمارهٔ گزارش با سند یکی نیست.');
  const source = findSourceDocument(data, report);
  assert(source && source.record.id === saved.id, 'ردیف گزارش به سند اصلی وصل نیست.');
  lines.forEach((line) => {
    const linked = findSourceDocument(data, line);
    assert(linked && linked.record.id === saved.id, 'سطر دفتر کل به سند اصلی وصل نیست.');
  });

  assert(buildCsv(collection, [saved]).split('\n').length === 2, 'خروجی CSV سند ساخته نشد.');

  const second = await gateway.create(collectionFor(collection), normalize(collection, POSTING_SAMPLES[collection]));
  assert(second.number !== saved.number, 'شمارهٔ سند تکراری صادر شد.');
  return gateway;
}

async function masterRoundTrip(collection) {
  const gateway = fresh();
  const sample = MASTER_SAMPLES[collection];
  eq(validate(collection, sample, gateway.snapshot()), '', 'اعتبارسنجی نمونهٔ تعریف');
  const before = (gateway.snapshot()[collection] || []).length;
  const created = await gateway.create(collection, sample);
  eq((gateway.snapshot()[collection] || []).length, before + 1, 'رکورد اضافه نشد.');

  const duplicate = validate(collection, { ...sample }, gateway.snapshot());
  assert(Boolean(duplicate), 'ثبت رکورد تکراری رد نشد.');

  await gateway.update(collection, created.id, { name: sample.name + ' ویرایش' });
  eq(gateway.snapshot()[collection].find((row) => row.id === created.id).name, sample.name + ' ویرایش', 'ویرایش اعمال نشد.');

  await gateway.deactivate(collection, created.id);
  const kept = gateway.snapshot()[collection].find((row) => row.id === created.id);
  assert(Boolean(kept), 'رکورد پایه پس از غیرفعال‌سازی حذف شد.');
  assert(
    collection === 'currencies' ? kept.active === 'غیرفعال' : kept.status === 'غیرفعال',
    'وضعیت غیرفعال ثبت نشد.'
  );
  return gateway;
}

// بررسی‌ای که پیش‌نیازش موجود نیست، اجرا را متوقف نمی‌کند: با skip ثبت می‌شود،
// بقیهٔ بررسی‌ها ادامه می‌یابند و در گزارش پایانی جدا از «ناموفق» نشان داده می‌شود.
export class SkippedCheck extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'SkippedCheck';
    this.skipped = true;
  }
}

export const skip = (reason) => {
  throw new SkippedCheck(reason || 'پیش‌نیاز این بررسی در دادهٔ ساختگی موجود نیست.');
};

export const need = (value, reason) => (value === undefined || value === null ? skip(reason) : value);

export async function runPanelAudit() {
  const results = [];
  const run = async (group, name, fn) => {
    try {
      await fn();
      results.push({ group, name, ok: true });
    } catch (error) {
      results.push(error?.skipped
        ? { group, name, ok: true, skipped: true, message: error.message }
        : { group, name, ok: false, message: error?.message || String(error) });
    }
  };

  // ——— ۲۵ بخش: ساختار، آیکون، ناوبری، فرم و ستون گزارش ———
  const nav = new Set([...HOME_GROUPS.flatMap((group) => group.ids), ...MORE_ONLY]);
  const HANDLED_KINDS = ['home', 'master', 'posting', 'ledger', 'debtors', 'activity', 'errors', 'rates', 'profit', 'balance', 'linked'];
  const base = fresh().snapshot();
  for (const module of CORE_MODULES) {
    await run('ساختار ۲۵ بخش', module.label, () => {
      assert(Boolean(module.section), 'بخش مجوز ندارد.');
      assert(Boolean(module.label), 'برچسب ندارد.');
      assert(HANDLED_KINDS.includes(module.kind), 'نوع نمایش پشتیبانی نمی‌شود.');
      const mobile = MOBILE_MODULES.find((item) => item.id === module.id);
      assert(mobile, 'در فهرست بخش‌های موبایل نیست.');
      assert(mobile.icon === MODULE_ICONS[module.id], 'آیکون مرجع یکتا ندارد.');
      if (module.id !== 'home') assert(nav.has(module.id), 'در ناوبری هیچ مسیری ندارد.');
      if (module.kind === 'master') {
        const form = MASTER_FORMS[module.id];
        assert(form && form.fields.length, 'فرم تعریف ندارد.');
        eq(form.fields.map((field) => field.key).join(','), (SCHEMAS[module.id]?.fields || []).map((field) => field[0]).join(','), 'فیلدهای موبایل و لپ‌تاپ یکی نیستند.');
      }
      if (module.kind === 'posting') {
        const draft = buildDraft(module.id, null, {}, base);
        assert(Object.keys(draft).length > 3, 'فرم ثبت پیش‌نویس معتبر نمی‌سازد.');
      }
      if (['master', 'posting', 'ledger', 'debtors', 'activity', 'errors'].includes(module.kind)) {
        assert(Boolean(columnsFor(module.id)), 'ستون‌های گزارش و CSV تعریف نشده است.');
      }
    });
  }

  // ——— ثبت، ویرایش، جستجو، مشاهده و غیرفعال‌سازی ———
  for (const collection of MASTER_FORM_MODULES) {
    await run('ثبت و ویرایش تعاریف', 'چرخهٔ کامل ' + collection, () => masterRoundTrip(collection));
  }
  for (const collection of ['expenses', 'remittance', 'exchange', 'journal', 'cashFlow']) {
    await run('ثبت اسناد و پیوندها', 'ثبت و پیوند ' + collection, () => postingRoundTrip(collection));
  }

  // ——— ارتباط تعاریف با معاملات و اعتبارسنجی رابطه‌ها ———
  await run('ارتباط تعاریف و معاملات', 'رد صندوق با ارز ناهم‌خوان', () => {
    const data = fresh().snapshot();
    const error = validate('expenses', { ...POSTING_SAMPLES.expenses, currency: 'USD' }, data);
    assert(Boolean(error), 'مصرف با صندوق ارز دیگر پذیرفته شد.');
  });
  await run('ارتباط تعاریف و معاملات', 'رد طرف حساب ناشناخته', () => {
    const data = fresh().snapshot();
    const error = validate('exchange', { ...POSTING_SAMPLES.exchange, party: 'مشتری ناموجود' }, data);
    assert(Boolean(error), 'معامله با طرف حساب ناشناخته پذیرفته شد.');
  });
  await run('ارتباط تعاریف و معاملات', 'رد حساب مصرف غیرمرتبط', () => {
    const data = fresh().snapshot();
    const error = validate('expenses', { ...POSTING_SAMPLES.expenses, expenseAccount: '1010 — صندوق‌ها' }, data);
    assert(Boolean(error), 'حساب غیر از نوع مصرف پذیرفته شد.');
  });
  await run('ارتباط تعاریف و معاملات', 'غیرفعال‌سازی مشتری، مانده و سوابق را حفظ می‌کند', async () => {
    const gateway = fresh();
    const before = partyNet(gateway.snapshot(), 'حاجی نصیر احمد');
    await gateway.deactivate('customers', 'c1');
    const data = gateway.snapshot();
    assert(data.customers.some((row) => row.id === 'c1'), 'رکورد مشتری حذف شد.');
    eq(partyNet(data, 'حاجی نصیر احمد'), before, 'ماندهٔ مشتری پس از غیرفعال‌سازی تغییر کرد.');
  });

  // ——— محاسبات مبلغ، کمیشن، بدهکاری/بستانکاری و مانده ———
  await run('محاسبات و مانده‌ها', 'ماندهٔ صندوق با گردش صندوق', async () => {
    const gateway = fresh();
    const safe = need(gateway.snapshot().cash.find((row) => row.name === 'صندوق افغانی مرکزی'), 'صندوق افغانی مرکزی در دادهٔ ساختگی نیست؛ این بررسی رد شد.');
    const before = cashBalance(gateway.snapshot(), safe);
    const saved = await createPosting(gateway, 'cashFlow');
    eq(cashBalance(gateway.snapshot(), safe), before + 25000, 'موجودی صندوق با گردش هم‌خوان نیست.');
    eq(saved.amount, 25000, 'مبلغ گردش درست ثبت نشد.');
  });
  await run('محاسبات و مانده‌ها', 'ماندهٔ مشتری با گردش صندوق', async () => {
    const gateway = fresh();
    const before = partyNet(gateway.snapshot(), 'حاجی نصیر احمد');
    await createPosting(gateway, 'cashFlow');
    eq(partyNet(gateway.snapshot(), 'حاجی نصیر احمد'), before + 25000, 'ماندهٔ مشتری با گردش هم‌خوان نیست.');
  });
  await run('محاسبات و مانده‌ها', 'کمیشن حواله به درآمد می‌رود', async () => {
    const gateway = fresh();
    const saved = await createPosting(gateway, 'remittance');
    const revenue = gateway.snapshot().ledger.filter((line) => line.documentId === saved.id && line.code === '4000');
    eq(sumBy(revenue, 'credit'), 20, 'کمیشن حواله در حساب درآمد ثبت نشد.');
  });
  await run('محاسبات و مانده‌ها', 'مبالغ دو ارز معامله اسعار', async () => {
    const gateway = fresh();
    const saved = await createPosting(gateway, 'exchange');
    const lines = gateway.snapshot().ledger.filter((line) => line.documentId === saved.id);
    eq(sumBy(lines.filter((line) => line.currency === 'USD'), 'debit'), 100, 'مبلغ ارز اول ثبت نشد.');
    eq(sumBy(lines.filter((line) => line.currency === 'AFN' && line.code === '1010'), 'credit'), 7100, 'مبلغ ارز دوم ثبت نشد.');
    eq(sumBy(lines.filter((line) => line.code === '4000'), 'credit'), 10, 'کمیشن معامله ثبت نشد.');
  });
  await run('محاسبات و مانده‌ها', 'تراز سند روزنامچه', async () => {
    const gateway = fresh();
    const saved = await createPosting(gateway, 'journal');
    eq(saved.debitTotal, saved.creditTotal, 'جمع بدهکار و بستانکار سند برابر نیست.');
    const lines = gateway.snapshot().ledger.filter((line) => line.documentId === saved.id);
    eq(sumBy(lines, 'debit'), sumBy(lines, 'credit'), 'سطرهای دفتر سند تراز نیستند.');
  });
  await run('محاسبات و مانده‌ها', 'رد سند روزنامچهٔ ناتراز', () => {
    const data = fresh().snapshot();
    const error = validate('journal', {
      ...POSTING_SAMPLES.journal,
      rows: [{ account: '1010 — صندوق‌ها', debit: 500, credit: '' }, { account: '4000 — درآمد کمیشن', debit: '', credit: 400 }],
    }, data);
    assert(Boolean(error), 'سند ناتراز پذیرفته شد.');
  });

  // ——— سند معکوس و عملیات تکراری ———
  const reversalSetup = async () => {
    const gateway = fresh();
    const saved = await createPosting(gateway, 'expenses');
    return { gateway, saved };
  };
  await run('ابطال و سند معکوس', 'علت کوتاه رد می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    let message = '';
    try { await gateway.reverse('expenses', saved.id, 'a'); } catch (error) { message = error.message; }
    assert(Boolean(message), 'ابطال با علت کوتاه پذیرفته شد.');
  });
  await run('ابطال و سند معکوس', 'سند اصلی قفل و سند معکوس ثبت می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    const result = await gateway.reverse('expenses', saved.id, 'مبلغ اشتباه');
    const data = gateway.snapshot();
    eq(data.expenses.find((row) => row.id === saved.id).status, 'ابطال شده', 'سند اصلی ابطال نشد.');
    assert(result.counter.reversalOf === saved.id, 'سند معکوس به سند اصلی وصل نیست.');
    assert(String(result.counter.number).startsWith('RV-'), 'شمارهٔ سند معکوس درست نیست.');
    eq(result.counter.amount, -saved.amount, 'مبلغ سند معکوس منفی نشد.');
    assert(isLocked(data.expenses.find((row) => row.id === saved.id)), 'سند ابطال‌شده قفل نیست.');
  });
  await run('ابطال و سند معکوس', 'دفتر کل با ابطال تراز می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    const result = await gateway.reverse('expenses', saved.id, 'مبلغ اشتباه');
    const lines = gateway.snapshot().ledger.filter((line) => line.documentId === saved.id || line.documentId === result.counter.id);
    netByCurrency(lines).forEach((net) => assert(Math.abs(net) < 0.005, 'سند اصل و معکوس در دفتر صفر نشدند.'));
    eq(sumBy(lines.filter((line) => line.code === '5000'), 'debit') - sumBy(lines.filter((line) => line.code === '5000'), 'credit'), 0, 'حساب مصرف صفر نشد.');
  });
  await run('ابطال و سند معکوس', 'ابطال دوباره رد می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    await gateway.reverse('expenses', saved.id, 'مبلغ اشتباه');
    let message = '';
    try { await gateway.reverse('expenses', saved.id, 'دوباره'); } catch (error) { message = error.message; }
    assert(Boolean(message), 'ابطال دوباره پذیرفته شد.');
  });
  await run('ابطال و سند معکوس', 'ویرایش سند ابطال‌شده رد می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    await gateway.reverse('expenses', saved.id, 'مبلغ اشتباه');
    let code = '';
    try { await gateway.update('expenses', saved.id, { title: 'تغییر' }); } catch (error) { code = error.code; }
    eq(code, 'LOCKED', 'سند ابطال‌شده قابل ویرایش ماند.');
  });
  await run('ابطال و سند معکوس', 'ابطال سند معکوس رد می‌شود', async () => {
    const { gateway, saved } = await reversalSetup();
    const result = await gateway.reverse('expenses', saved.id, 'مبلغ اشتباه');
    let message = '';
    try { await gateway.reverse('expenses', result.counter.id, 'ابطال معکوس'); } catch (error) { message = error.message; }
    assert(Boolean(message), 'سند معکوس دوباره ابطال شد.');
  });
  await run('ابطال و سند معکوس', 'ابطال رکورد پایه ممنوع است', async () => {
    const gateway = fresh();
    let message = '';
    try { await gateway.reverse('customers', 'c1', 'آزمون'); } catch (error) { message = error.message; }
    assert(Boolean(message), 'رکورد پایه ابطال شد.');
    eq(REVERSIBLE_COLLECTIONS.includes('customers'), false, 'رکورد پایه در فهرست ابطال‌شدنی است.');
  });

  // ——— گزارش‌ها، دفتر کل و پیوند سند اصلی ———
  await run('گزارش‌ها و دفتر کل', 'هر سطر دفتر کل سند اصلی دارد', () => {
    const data = fresh().snapshot();
    assert(data.ledger.length > 0, 'دفتر کل خالی است.');
    data.ledger.forEach((line) => {
      const found = findSourceDocument(data, line);
      assert(found && found.record.id === line.documentId, 'سطر دفتر کل سند اصلی ندارد.');
    });
  });
  await run('گزارش‌ها و دفتر کل', 'هر ردیف گزارش سند اصلی دارد', () => {
    const data = fresh().snapshot();
    assert(data.reports.length > 0, 'گزارش عملیات خالی است.');
    data.reports.forEach((row) => {
      const found = findSourceDocument(data, row);
      assert(found, 'ردیف گزارش سند اصلی ندارد.');
    });
  });
  await run('گزارش‌ها و دفتر کل', 'اسناد اولیه در یک ارز تراز هستند', () => {
    const data = fresh().snapshot();
    POSTING_COLLECTIONS.filter((collection) => collection !== 'exchange').forEach((collection) => {
      (data[collection] || []).forEach((doc) => {
        const lines = data.ledger.filter((line) => line.documentId === doc.id);
        netByCurrency(lines).forEach((net) => assert(Math.abs(net) < 0.005, 'سند ' + (doc.number || doc.id) + ' تراز نیست.'));
      });
    });
  });
  await run('گزارش‌ها و دفتر کل', 'ویرایش سند، دفتر و گزارش را به‌روز می‌کند', async () => {
    const gateway = fresh();
    const saved = await createPosting(gateway, 'expenses');
    await gateway.update('expenses', saved.id, { amount: 2000 });
    const lines = gateway.snapshot().ledger.filter((line) => line.documentId === saved.id);
    eq(sumBy(lines.filter((line) => line.code === '5000'), 'debit'), 2000, 'دفتر کل با ویرایش سند به‌روز نشد.');
    eq(gateway.snapshot().reports.find((row) => row.documentId === saved.id).debit, 2000, 'گزارش با ویرایش سند به‌روز نشد.');
  });
  await run('گزارش‌ها و دفتر کل', 'سطر دفتر فقط از سند اصلی ویرایش می‌شود', async () => {
    const gateway = fresh();
    const line = gateway.snapshot().ledger[0];
    const found = findSourceDocument(gateway.snapshot(), line);
    assert(found, 'سند اصلی سطر دفتر پیدا نشد.');
    assert(POSTING_COLLECTIONS.includes(found.moduleId), 'سند اصلی از نوع سند مالی نیست.');
    let message = '';
    try { await gateway.update('ledger', line.id, { debit: 1 }); } catch (error) { message = error.message; }
    assert(Boolean(message), 'سطر دفتر کل مستقیماً ویرایش شد.');
  });

  // ——— چاپ، خروجی، جستجو و فیلتر ———
  await run('جستجو، فیلتر و خروجی', 'جستجوی نام', async () => {
    const gateway = fresh();
    const found = await gateway.list('customers', { search: 'الفتح' });
    eq(found.length, 1, 'جستجو نتیجهٔ درست نداد.');
  });
  await run('جستجو، فیلتر و خروجی', 'فیلتر ارز', async () => {
    const gateway = fresh();
    const found = await gateway.list('customers', { currency: 'USD' });
    assert(found.length > 0 && found.every((row) => row.currency === 'USD'), 'فیلتر ارز کار نکرد.');
  });
  await run('جستجو، فیلتر و خروجی', 'فیلتر بازهٔ تاریخ', async () => {
    const gateway = fresh();
    const found = await gateway.list('expenses', { from: daysAgo(2), to: daysAgo(0) });
    assert(found.every((row) => row.date >= daysAgo(2) && row.date <= daysAgo(0)), 'فیلتر تاریخ کار نکرد.');
  });
  await run('جستجو، فیلتر و خروجی', 'خروجی CSV با فرار نقل‌قول', () => {
    const csv = buildCsv('customers', [{ code: 'X', name: 'آزمون "کوچک"' }]);
    const [header, row] = csv.split('\n');
    eq(header.split(',').length, (columnsFor('customers') || []).length, 'تعداد ستون‌های CSV درست نیست.');
    assert(row.includes('""'), 'نقل‌قول در CSV فرار داده نشد.');
  });
  await run('جستجو، فیلتر و خروجی', 'ستون گزارش فقط برای بخش‌های قابل خروجی', () => {
    CORE_MODULES.filter((module) => ['master', 'posting', 'ledger', 'debtors', 'activity', 'errors'].includes(module.kind))
      .forEach((module) => assert(Boolean(columnsFor(module.id)), 'ستون گزارش برای ' + module.id + ' نیست.'));
    ['rates', 'profit', 'balance'].forEach((id) => eq(columnsFor(id), null, 'برای ' + id + ' ستون گزارش غیرمنتظره است.'));
  });

  // ——— مجوزها ———
  await run('مجوزها', 'کارمند بانک و دفتر کل را نمی‌بیند', () => {
    eq(checkPermission(DEMO_EMPLOYEE_PERMISSIONS, 'bank', 'view'), false, 'مجوز بانک برای کارمند باز است.');
    eq(checkPermission(DEMO_EMPLOYEE_PERMISSIONS, 'journal', 'view'), false, 'مجوز روزنامچه برای کارمند باز است.');
    eq(checkPermission(DEMO_EMPLOYEE_PERMISSIONS, 'customers', 'edit'), true, 'ویرایش مشتری برای کارمند بسته است.');
  });
  await run('مجوزها', 'بخش‌های مجاز از یک قاعده خوانده می‌شوند', () => {
    const visible = CORE_MODULES.filter((module) => checkPermission(DEMO_EMPLOYEE_PERMISSIONS, module.section, 'view')).map((module) => module.id);
    assert(visible.includes('customers') && visible.includes('cash'), 'بخش‌های مجاز ناقص‌اند.');
    assert(!visible.includes('banks') && !visible.includes('ledger'), 'بخش غیرمجاز در فهرست مجاز است.');
  });
  await run('مجوزها', 'سلسله‌مراتب نقش', () => {
    eq(canManageRole('admin', 'employee'), true, 'مدیر نمی‌تواند کارمند را مدیریت کند.');
    eq(canManageRole('employee', 'admin'), false, 'کارمند می‌تواند مدیر را مدیریت کند.');
    eq(checkPermission([], 'cash', 'view'), false, 'مجوز خالی پذیرفته شد.');
  });

  // ——— هم‌خوانی موبایل و لپ‌تاپ ———
  await run('هم‌خوانی دو پوسته', 'فیلدهای تعریف یکسان', () => {
    MASTER_FORM_MODULES.forEach((id) => {
      eq(
        (MASTER_FORMS[id]?.fields || []).map((field) => field.key).join(','),
        (SCHEMAS[id]?.fields || []).map((field) => field[0]).join(','),
        'فیلدهای ' + id + ' یکسان نیستند.'
      );
    });
  });
  await run('هم‌خوانی دو پوسته', 'همهٔ فیلدهای فرم‌های ثبت پوشش داده شده‌اند', () => {
    ['expenses', 'remittance', 'exchange', 'journal'].forEach((id) => {
      const sampleKeys = new Set(Object.keys(POSTING_SAMPLES[id]));
      (SCHEMAS[id]?.fields || []).forEach((field) => assert(sampleKeys.has(field[0]), 'فیلد ' + field[0] + ' در آزمون ' + id + ' پوشش ندارد.'));
    });
  });
  await run('هم‌خوانی دو پوسته', 'ارزها و نوع معامله یکسان', () => {
    const data = fresh().snapshot();
    data.currencies.forEach((row) => assert(CURRENCIES.includes(row.code), 'ارز ' + row.code + ' در فهرست ارزها نیست.'));
    const kinds = (SCHEMAS.exchange?.fields || []).find((field) => field[0] === 'kind')?.[3] || [];
    data.exchange.forEach((row) => assert(kinds.includes(row.kind), 'نوع معامله ' + row.kind + ' در فرم نیست.'));
    assert(kinds.includes('خرید') && kinds.includes('فروش'), 'نوع معاملهٔ فارسی در فرم لپ‌تاپ نیست.');
  });
  await run('هم‌خوانی دو پوسته', 'شناسهٔ میان‌برهای لپ‌تاپ معتبر', () => {
    const ids = new Set(CORE_MODULES.map((module) => module.id));
    LAPTOP_MENU_MODULE_IDS.forEach((id) => assert(ids.has(id), 'میان‌بر ' + id + ' در فهرست بخش‌ها نیست.'));
    LAPTOP_SHORTCUTS.forEach((item) => assert(ids.has(item.id), 'آیکون ' + item.id + ' در فهرست بخش‌ها نیست.'));
  });

  // ——— ناوبری و منوها ———
  await run('ناوبری و منوها', 'منوهای موبایل به بخش یا عملیات معتبر می‌رسند', () => {
    const ids = new Set(CORE_MODULES.map((module) => module.id));
    const actions = new Set(['backup', 'restore', 'reset', 'transactions', 'settings', 'support', 'help', 'cashIn', 'cashOut']);
    MOBILE_MENUS.forEach((menu) => menu.items.forEach((item) => {
      if (item.module) assert(ids.has(item.module), 'منو به بخش نامعتبر اشاره می‌کند.');
      else assert(actions.has(item.action), 'عملیات منو تعریف نشده است: ' + item.action);
    }));
  });
  await run('ناوبری و منوها', 'همهٔ بخش‌ها در گروه‌های خانه یا بیشتر هستند', () => {
    CORE_MODULES.filter((module) => module.id !== 'home').forEach((module) => {
      assert(nav.has(module.id), 'بخش ' + module.id + ' در هیچ گروهی نیست.');
    });
  });
  await run('ناوبری و منوها', 'گروه‌های خانه شناسهٔ معتبر دارند', () => {
    const ids = new Set(CORE_MODULES.map((module) => module.id));
    HOME_GROUPS.forEach((group) => group.ids.forEach((id) => assert(ids.has(id), 'گروه ' + group.key + ' شناسهٔ نامعتبر دارد.')));
    MORE_ONLY.forEach((id) => assert(ids.has(id), 'فهرست بیشتر شناسهٔ نامعتبر دارد.'));
  });

  await run('محاسبات و مانده‌ها', 'مصرف از صندوق، موجودی را کم می‌کند', async () => {
    const gateway = fresh();
    const safe = need(gateway.snapshot().cash.find((row) => row.name === 'صندوق افغانی مرکزی'), 'صندوق افغانی مرکزی در دادهٔ ساختگی نیست؛ این بررسی رد شد.');
    const before = cashBalance(gateway.snapshot(), safe);
    await createPosting(gateway, 'expenses');
    eq(cashBalance(gateway.snapshot(), safe), before - 1200, 'موجودی صندوق با سند مصرف هم‌خوان نیست.');
  });
  await run('محاسبات و مانده‌ها', 'معامله اسعار صندوق دو ارز را جابه‌جا می‌کند', async () => {
    const gateway = fresh();
    const data = gateway.snapshot();
    const usd = need(data.cash.find((row) => row.name === 'صندوق دالر'), 'صندوق دالر در دادهٔ ساختگی نیست؛ این بررسی رد شد.');
    const afn = need(data.cash.find((row) => row.name === 'صندوق افغانی مرکزی'), 'صندوق افغانی مرکزی در دادهٔ ساختگی نیست؛ این بررسی رد شد.');
    const beforeUsd = cashBalance(data, usd);
    const beforeAfn = cashBalance(data, afn);
    await createPosting(gateway, 'exchange');
    eq(cashBalance(gateway.snapshot(), usd), beforeUsd + 100, 'ارز دریافتی به صندوق اضافه نشد.');
    eq(cashBalance(gateway.snapshot(), afn), beforeAfn - 7100 + 10, 'ارز پرداختی و کمیشن از صندوق کم نشد.');
  });
  await run('محاسبات و مانده‌ها', 'ویرایش گردش صندوق از سند اصلی', () => {
    const data = fresh().snapshot();
    const voucher = data.transactions.find((row) => num(row.amount) < 0) || data.transactions[0];
    const draft = cashFlowDraft(voucher);
    eq(draft.amount, Math.abs(num(voucher.amount)), 'مبلغ گردش برای فرم درست تبدیل نشد.');
    eq(draft.kind, num(voucher.amount) < 0 ? 'خرج' : 'دخل', 'نوع گردش برای فرم درست تبدیل نشد.');
    eq(validate('cashFlow', draft, data), '', 'پیش‌نویس گردش صندوق معتبر نیست.');
  });

  await run('ثبت اسناد و پیوندها', 'ویرایش اسناد اولیه معتبر است', () => {
    const data = fresh().snapshot();
    ['expenses', 'remittance', 'exchange', 'journal'].forEach((module) => {
      (data[module] || []).forEach((doc) => {
        eq(validate(module, doc, data), '', 'سند ' + (doc.number || doc.id) + ' قابل ویرایش نیست');
      });
    });
    (data.transactions || []).forEach((doc) => {
      eq(validate('cashFlow', cashFlowDraft(doc), data), '', 'گردش ' + (doc.number || doc.id) + ' قابل ویرایش نیست');
    });
  });

  const failed = results.filter((item) => !item.ok);
  const skipped = results.filter((item) => item.skipped);
  const passed = results.filter((item) => item.ok && !item.skipped);
  const groups = [...new Set(results.map((item) => item.group))].map((group) => {
    const rows = results.filter((item) => item.group === group);
    return {
      name: group,
      total: rows.length,
      passed: rows.filter((item) => item.ok && !item.skipped).length,
      failed: rows.filter((item) => !item.ok).length,
      skipped: rows.filter((item) => item.skipped).length,
    };
  });
  const sections = CORE_MODULES.map((module) => {
    const row = results.find((item) => item.group === 'ساختار ۲۵ بخش' && item.name === module.label);
    return { id: module.id, label: module.label, ok: Boolean(row?.ok), message: row?.message || '' };
  });

  return {
    total: results.length,
    passed: passed.length,
    failed: failed.length,
    skipped: skipped.length,
    results,
    groups,
    sections,
    generatedAt: new Date().toISOString(),
  };
}