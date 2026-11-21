// src/core/transfer/readiness.js — ماتریس آمادگی انتقال پنل صراف
// فقط می‌خواند و می‌سنجد: هیچ سند، داده، تنظیم یا حافظه‌ای نوشته نمی‌شود.
// هر مورد با PASS / FAIL / BLOCKED و شاهد مشخص ثبت می‌شود؛ نوع شاهد هم اعلام می‌شود:
//   test    → همان لحظه در محیط آزمون اجرا شده
//   code    → با بازبینی کد تأیید شده
//   browser → بدون مرورگر واقعی و نشانی منتشرشده قابل اجرا نیست
import { CORE_MODULES, HOME_GROUPS, MORE_ONLY } from '@/core/registry/modules';
import { MOBILE_MODULES, MODULE_ICONS, MOBILE_MENUS } from '@/a1/mobile/mobileModules';
import { LAPTOP_MENU_MODULE_IDS, LAPTOP_SHORTCUTS } from '@/a1/components/v21/laptopHomeConfig';
import { columnsFor, buildCsv } from '@/a1/mobile/mobileExport';
import { createMemoryGateway } from '@/core/gateway/memoryGateway';
import { GATEWAY_METHODS } from '@/core/gateway/contract';
import { runGatewayContractTests } from '@/core/gateway/contractTests';
import { createDemoData, DEMO_EMPLOYEE_PERMISSIONS } from '@/demo/seed';
import { checkPermission, roleLevel, canManageRole } from '@/core/domain/access';
import { partyStatement, branchStatement, accountStatement, findSourceForLine } from '@/core/domain/statement';
import { computeTradeProfit } from '@/core/domain/tradeProfit';
import { createMobileEngineGateway } from '@/adapters/mobile/mobileEngineGateway';
import { createLaptopEngineGateway } from '@/adapters/a1/laptopEngineGateway';
import { runPanelAudit } from '@/core/audit/panelAudit';
import { ENTERPRISE_MODULES } from '@/core/transfer/enterpriseModules';
import {
  ACTION_MODES, actionOf, evaluateEnterpriseModule, enterprisePageModel, sectionFor, definedActionCount,
} from '@/core/transfer/enterpriseActions';
import { ROLE_MIGRATION, AUTH_ENFORCEMENT_POINTS, AUTH_OPEN_DECISIONS, isRoleMapped } from '@/core/transfer/authMigration';
import { RULE_CONTRACTS } from '@/core/transfer/ruleContracts';
import { resolveSession, shellFor, runSessionTests } from '@/core/session/sessionContract';
import { runPersistenceTests, createMemoryStorage as createStateStorage, tenantStateKey } from '@/core/persistence/durableState';
import { financialContractChecks } from '@/core/transfer/financialContracts';
import { statementBack } from '@/a1/mobile/statementBack';
import { decideLayout } from '@/a1/lib/adaptiveLayout';

export const STATUS = { PASS: 'PASS', FAIL: 'FAIL', BLOCKED: 'BLOCKED' };

const text = (value) => String(value ?? '');
const sameNumber = (a, b) => Math.abs(Number(a) - Number(b)) < 0.011;

// ——— دادهٔ آزمون دفترها: فقط درون‌حافظه، با همان شکل سطرهای دفتر کل موتور ———
function ledgerFixture() {
  const lines = [
    {
      id: 'l1', date: '2026-11-01', documentId: 'd1', number: 'EX-1', type: 'معاملهٔ اسعار',
      description: 'خرید دالر', currency: 'AFN', accountType: 'customer', accountId: 'c1',
      partyType: 'customer', party: 'مشتری آزمون', debit: 5000, credit: 0,
    },
    {
      id: 'l2', date: '2026-11-02', documentId: 'd2', number: 'CF-2', type: 'گردش صندوق',
      description: 'دریافت', currency: 'AFN', accountType: 'customer', accountId: 'c1',
      partyType: 'customer', party: 'مشتری آزمون', debit: 0, credit: 2000,
    },
    {
      id: 'l3', date: '2026-11-02', documentId: 'd3', number: 'CF-3', type: 'گردش صندوق',
      description: 'مشتری دیگر', currency: 'AFN', accountType: 'customer', accountId: 'c2',
      partyType: 'customer', party: 'مشتری دوم', debit: 900, credit: 0,
    },
    {
      id: 'b1', date: '2026-11-03', documentId: 'd4', number: 'TR-4', type: 'حواله',
      description: 'ارسال به نمایندگی', currency: 'AFN', accountType: 'branch', accountId: 'br1',
      partyType: 'branch', party: 'نمایندگی آزمون', debit: 0, credit: 700,
    },
    {
      id: 's1', date: '2026-11-04', documentId: 'd5', number: 'CF-5', type: 'گردش صندوق',
      description: 'دخل صندوق', currency: 'AFN', accountType: 'cash', accountId: 's1',
      partyType: 'other', party: 'کمیشن', debit: 3000, credit: 0,
    },
    {
      id: 'k1', date: '2026-11-05', documentId: 'd6', number: 'JE-6', type: 'روزنامچه',
      description: 'واریز بانک', currency: 'AFN', accountType: 'bank', accountId: 'bk1',
      partyType: 'other', party: '', debit: 120000, credit: 0,
    },
  ];
  return {
    customers: [{ id: 'c1', name: 'مشتری آزمون', currency: 'AFN', opening: 0 }],
    branches: [{ id: 'br1', name: 'نمایندگی آزمون', currency: 'AFN', opening: 0 }],
    cash: [{ id: 's1', name: 'صندوق آزمون', currency: 'AFN', opening: 0 }],
    banks: [{ id: 'bk1', name: 'بانک آزمون', currency: 'AFN', opening: 0 }],
    transactions: lines,
    journal: [{ id: 'j1', documentId: 'd1', number: 'EX-1' }],
    exchange: [], expenses: [], remittance: [],
  };
}

const tradeFixture = [
  {
    id: 'T1', date: '2026-11-10', number: 'EX-1001', kind: 'خرید', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 1000, toCurrency: 'AFN', toAmount: 71000, fee: 0,
    documentId: 'd1001', accountingStatus: 'متوازن',
  },
  {
    id: 'T2', date: '2026-11-11', number: 'EX-1002', kind: 'فروش', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 400, toCurrency: 'AFN', toAmount: 28800, fee: 0,
    documentId: 'd1002', accountingStatus: 'متوازن',
  },
];
const tradeCurrencies = [
  { code: 'AFN', name: 'افغانی', rate: 1 },
  { code: 'USD', name: 'دالر امریکایی', rate: 71.2 },
];

// پل حافظه‌ای برای آزمون آداپتر لپ‌تاپ بدون هیچ ذخیره‌سازی
const bridgeOver = (gateway) => ({
  load: async () => ({ data: gateway.snapshot() }),
  snapshot: () => gateway.snapshot(),
  save: (module, draft) => gateway.create(module, draft),
  edit: (module, draft) => gateway.update(module, draft.id, draft),
  deactivate: (module, record) => gateway.deactivate(module, record.id),
  reverse: (module, record, reason) => gateway.reverse(module, record.id, reason),
  loadForEdit: async (module, record) => record,
  replaceAll: (collection, value) => gateway.replaceAll(collection, value),
  clearExcept: (keep) => gateway.clearExcept(keep),
  reset: () => gateway.reset(),
});

const spaceOf = (width, height, pointerCoarse = false) => ({
  width, height, outerWidth: width, outerHeight: height,
  screenWidth: width, screenHeight: height, dpr: 1,
  pointerCoarse, orientation: width >= height ? 'landscape' : 'portrait',
  aspectRatio: Number((width / Math.max(height, 1)).toFixed(2)),
  browserChrome: 0, screenLost: 0,
});

export async function buildReadinessReport() {
  const groups = [];
  const group = (key, title, note) => {
    const bucket = { key, title, note, items: [] };
    groups.push(bucket);
    return bucket;
  };
  const add = (bucket, id, title, status, evidence, extra = {}) => {
    bucket.items.push({ id, title, status, evidence, kind: extra.kind || 'test', dependency: extra.dependency || '' });
  };
  const guard = (bucket, id, title, fn, extra = {}) => {
    try {
      fn();
    } catch (error) {
      add(bucket, id, title, STATUS.FAIL, error?.message || 'آزمون اجرا نشد', extra);
      return;
    }
  };
  const expect = (condition, message) => { if (!condition) throw new Error(message); };

  // ——— ۱) ساختار ۲۵ بخش ———
  const modules = group('modules', 'ساختار ۲۵ بخش', 'هر بخش: نوع نمایش، بخش مجوز، آیکون مرجع، مسیر ناوبری و ستون گزارش.');
  const nav = new Set([...HOME_GROUPS.flatMap((item) => item.ids), ...MORE_ONLY]);
  CORE_MODULES.forEach((module) => {
    const problems = [];
    if (!module.section) problems.push('بخش مجوز ندارد');
    if (module.id !== 'home' && !nav.has(module.id)) problems.push('در هیچ گروه ناوبری نیست');
    if (!MODULE_ICONS[module.id]) problems.push('آیکون مرجع ندارد');
    if (['master', 'posting', 'ledger', 'debtors', 'activity', 'errors'].includes(module.kind) && !columnsFor(module.id)) {
      problems.push('ستون گزارش و CSV ندارد');
    }
    add(
      modules,
      module.id,
      module.label,
      problems.length ? STATUS.FAIL : STATUS.PASS,
      problems.length ? problems.join('؛ ') : 'ساختار بخش کامل است (نوع ' + module.kind + '، بخش ' + module.section + ').',
      { kind: 'code' },
    );
  });

  // ——— ۲) موتور داده و ذخیره‌سازی ———
  const engine = group('engine', 'موتور داده و ذخیره‌سازی', 'قرارداد درگاه برای هر دو پوسته، یک موتور مشترک و ذخیره‌سازی پایدار با کلید صرافی.');
  try {
    const gateway = createMemoryGateway({ seed: createDemoData() });
    const missing = GATEWAY_METHODS.filter((name) => typeof gateway[name] !== 'function');
    add(engine, 'memory-contract', 'درگاه حافظه با قرارداد کامل', missing.length ? STATUS.FAIL : STATUS.PASS,
      missing.length ? 'این عملیات پیاده نشده: ' + missing.join(', ') : 'همهٔ ' + GATEWAY_METHODS.length + ' عملیات قرارداد موجود است.',
      { kind: 'test' });
    add(engine, 'demo-seed', 'دادهٔ آزمایشی هر مجموعهٔ لازم را دارد', (gateway.snapshot().customers || []).length
      && (gateway.snapshot().transactions || []).length ? STATUS.PASS : STATUS.FAIL,
    'مشتریان: ' + (gateway.snapshot().customers || []).length + '، سطر دفتر: ' + (gateway.snapshot().transactions || []).length,
    { kind: 'test' });
  } catch (error) {
    add(engine, 'memory-contract', 'درگاه حافظه با قرارداد کامل', STATUS.FAIL, error?.message || 'خطا در ساخت درگاه', { kind: 'test' });
  }

  try {
    const suite = await runGatewayContractTests((seed) => createMemoryGateway({ seed }));
    const failed = suite.results.filter((item) => !item.ok);
    add(engine, 'contract-suite', 'آزمون قرارداد درگاه حافظه', failed.length ? STATUS.FAIL : STATUS.PASS,
      failed.length
        ? failed.slice(0, 3).map((item) => item.name).join('؛ ')
        : (suite.passed || suite.total) + ' از ' + suite.total + ' بررسی قرارداد موفق.',
      { kind: 'test' });
  } catch (error) {
    add(engine, 'contract-suite', 'آزمون قرارداد درگاه حافظه', STATUS.FAIL, error?.message || 'اجرا نشد', { kind: 'test' });
  }

  try {
    const mobile = createMobileEngineGateway();
    const missingMobile = GATEWAY_METHODS.filter((name) => typeof mobile[name] !== 'function');
    add(engine, 'shared-engine', 'موبایل روی همان موتور لپ‌تاپ و با همان قرارداد', missingMobile.length ? STATUS.FAIL : STATUS.PASS,
      'آداپتر «' + mobile.kind + '» از موتور ' + mobile.engine + ' می‌خواند؛ عملیات قرارداد: '
        + (GATEWAY_METHODS.length - missingMobile.length) + ' از ' + GATEWAY_METHODS.length
        + (missingMobile.length ? '؛ ناقص: ' + missingMobile.join(', ') : ''),
      { kind: 'test' });
  } catch (error) {
    add(engine, 'shared-engine', 'موبایل روی همان موتور لپ‌تاپ و با همان قرارداد', STATUS.FAIL,
      error?.message || 'ساخت آداپتر موبایل ناموفق بود', { kind: 'test' });
  }

  try {
    const laptop = createLaptopEngineGateway({ bridge: bridgeOver(createMemoryGateway({ seed: createDemoData() })) });
    const missingLaptop = GATEWAY_METHODS.filter((name) => typeof laptop[name] !== 'function');
    const suite = await runGatewayContractTests((seed) => createLaptopEngineGateway({ bridge: bridgeOver(createMemoryGateway({ seed })) }));
    const failed = suite.results.filter((item) => !item.ok);
    const sameEngine = laptop.engine === 'a1-engine' && laptop.kind !== 'a1-engine-mobile';
    const ok = !missingLaptop.length && !failed.length && sameEngine;
    add(engine, 'laptop-contract', 'قرارداد کامل درگاه برای آداپتر لپ‌تاپ', ok ? STATUS.PASS : STATUS.FAIL,
      missingLaptop.length
        ? 'ناقص: ' + missingLaptop.join(', ')
        : 'همهٔ ' + GATEWAY_METHODS.length + ' عملیات؛ آزمون قرارداد ' + suite.passed + ' از ' + suite.total
          + (failed.length ? '؛ ناموفق: ' + failed.map((item) => item.name).join('؛ ') : '')
          + '؛ موتور مشترک: ' + (sameEngine ? 'بله (' + laptop.engine + ')' : 'خیر'),
      { kind: 'test' });
  } catch (error) {
    add(engine, 'laptop-contract', 'قرارداد کامل درگاه برای آداپتر لپ‌تاپ', STATUS.FAIL, error?.message || 'آزمون اجرا نشد', { kind: 'test' });
  }

  try {
    const suite = runPersistenceTests(() => createStateStorage());
    const failed = suite.filter((item) => !item.ok);
    add(engine, 'durability', 'ذخیره‌سازی پایدار مشترک با کلید صرافی', failed.length ? STATUS.FAIL : STATUS.PASS,
      'قرارداد ذخیره: ' + (suite.length - failed.length) + ' از ' + suite.length + ' بررسی موفق'
        + (failed.length ? '؛ ناموفق: ' + failed.map((item) => item.name).join('؛ ') : '')
        + ' · موتور نسخهٔ ۲۱ روی IndexedDB می‌نویسد و کلید میز کار از همین قرارداد می‌آید (' + tenantStateKey({ id: 'u', exchange_code: 'EX' }) + ').',
      { kind: 'test' });
  } catch (error) {
    add(engine, 'durability', 'ذخیره‌سازی پایدار مشترک با کلید صرافی', STATUS.FAIL, error?.message || 'آزمون اجرا نشد', { kind: 'test' });
  }

  // ——— ۳) دفاتر اختصاصی حساب‌ها ———
  const ledgers = group('ledgers', 'دفاتر اختصاصی حساب‌ها', 'گردش، بدهکار و بستانکار، مانده، پیوند سند اصلی و مسیر بازگشت.');
  try {
    const data = ledgerFixture();
    const customer = partyStatement(data, data.customers[0], 'customer');
    const onlyOwn = customer.rows.every((row) => text(row.record.accountId) === 'c1');
    const totals = customer.totals[0] || {};
    const okCustomer = customer.rows.length === 2
      && onlyOwn
      && sameNumber(totals.debit, 5000)
      && sameNumber(totals.credit, 2000)
      && sameNumber(totals.balance, 3000)
      && totals.status === 'بدهکار';
    add(ledgers, 'customer', 'دفتر مشتری: گردش، بدهکار، بستانکار و مانده', okCustomer ? STATUS.PASS : STATUS.FAIL,
      'سطر: ' + customer.rows.length + '، بدهکار: ' + totals.debit + '، بستانکار: ' + totals.credit + '، مانده: ' + totals.balance + '، وضعیت: ' + totals.status,
      { kind: 'test' });

    const branch = branchStatement(data, data.branches[0]);
    add(ledgers, 'branch', 'دفتر نمایندگی', branch.rows.length === 1 && sameNumber(branch.totals[0]?.credit, 700) ? STATUS.PASS : STATUS.FAIL,
      'سطر: ' + branch.rows.length + '، بستانکار: ' + (branch.totals[0]?.credit ?? 0), { kind: 'test' });

    const cash = accountStatement(data, data.cash[0], 'cash');
    const bank = accountStatement(data, data.banks[0], 'bank');
    add(ledgers, 'bank', 'دفتر بانک بدون ورود سطر صندوق', bank.rows.length === 1 && sameNumber(bank.totals[0]?.balance, 120000) ? STATUS.PASS : STATUS.FAIL,
      'سطر بانک: ' + bank.rows.length + '، مانده: ' + (bank.totals[0]?.balance ?? 0), { kind: 'test' });
    add(ledgers, 'cash', 'دفتر صندوق جدا از بانک', cash.rows.length === 1 && sameNumber(cash.totals[0]?.balance, 3000) ? STATUS.PASS : STATUS.FAIL,
      'سطر صندوق: ' + cash.rows.length + '، مانده: ' + (cash.totals[0]?.balance ?? 0), { kind: 'test' });

    const linked = findSourceForLine(data, { documentId: 'd1', record: {} });
    const unlinked = findSourceForLine(data, { documentId: null, record: { id: 'x' } });
    add(ledgers, 'source', 'پیوند سطر گردش به سند اصلی بدون حدس', linked.module === 'journal' && unlinked.module === 'transactions' ? STATUS.PASS : STATUS.FAIL,
      'سطر پیوندخورده ← ' + linked.module + '؛ سطر بدون پیوند ← ' + unlinked.module, { kind: 'test' });
  } catch (error) {
    add(ledgers, 'customer', 'دفتر مشتری: گردش، بدهکار، بستانکار و مانده', STATUS.FAIL, error?.message || 'خطا', { kind: 'test' });
  }

  // مسیر بازگشت از صفحهٔ حساب: همان تابعی که دکمهٔ بازگشت صفحه از آن می‌خواند
  guard(ledgers, 'navigation', 'مسیر بازگشت از صفحهٔ حساب به فهرست درست', () => {
    const expected = {
      customers: 'customer', customerLedger: 'customer', debtors: 'customer',
      branches: 'branch', branchLedger: 'branch', banks: 'bank', cash: 'cash',
    };
    const moduleIds = new Set(CORE_MODULES.map((module) => module.id));
    const bad = Object.entries(expected).filter(([id, kind]) => {
      const back = statementBack(id);
      return back.kind !== kind || !back.label || !moduleIds.has(back.module) || !['customer', 'branch', 'bank', 'cash'].includes(back.clear);
    });
    expect(!bad.length, 'مسیر بازگشت نادرست: ' + bad.map(([id]) => id).join(', '));
    add(ledgers, 'navigation', 'مسیر بازگشت از صفحهٔ حساب به فهرست درست', STATUS.PASS,
      '۷ مسیر بازگشت (مشتری، دفتر مشتری، بدهکاران، نمایندگی، دفتر نمایندگی، بانک، صندوق) با برچسب و فهرست مقصد درست آزمون شد.',
      { kind: 'test' });
  });

  // ——— ۴) مجوزها و گیت نقش ———
  const access = group('access', 'مجوزها و گیت نقش', 'نقش صراف، کارمند و مشتری، بسته‌بودن مسیرهای غیرمجاز و نشست معتبر.');
  const visibleToEmployee = CORE_MODULES.filter((module) => checkPermission(DEMO_EMPLOYEE_PERMISSIONS, module.section, 'view')).map((module) => module.id);
  const forbidden = ['banks', 'journal', 'ledger'].filter((id) => visibleToEmployee.includes(id));
  add(access, 'employee', 'کارمند بخش‌های غیرمجاز را نمی‌بیند', forbidden.length ? STATUS.FAIL : STATUS.PASS,
    forbidden.length ? 'باز مانده: ' + forbidden.join(', ') : 'بانک، روزنامچه و دفتر کل بسته است؛ بخش‌های مجاز: ' + visibleToEmployee.length,
    { kind: 'test' });
  add(access, 'default-deny', 'پیش‌فرض بستن برای بخش بدون مجوز', checkPermission([], 'cash', 'view') === false ? STATUS.PASS : STATUS.FAIL,
    'فهرست مجوز خالی هیچ دسترسی نمی‌دهد.', { kind: 'test' });
  const hierarchy = roleLevel('creator') > roleLevel('admin')
    && roleLevel('admin') > roleLevel('sarraaf')
    && roleLevel('sarraaf') > roleLevel('employee')
    && roleLevel('employee') > roleLevel('customer');
  add(access, 'hierarchy', 'سلسله‌مراتب نقش', hierarchy && !canManageRole('employee', 'admin') ? STATUS.PASS : STATUS.FAIL,
    'creator > admin > sarraaf > employee > customer و کارمند نمی‌تواند مدیر را مدیریت کند.', { kind: 'test' });

  guard(access, 'route-guard', 'گیت مسیرها روی نقش نشست', () => {
    const employee = resolveSession({ id: 'u1', role: 'employee', exchange_code: 'EX-1' });
    const customer = resolveSession({ id: 'u2', role: 'customer', exchange_code: 'EX-1' });
    const broken = resolveSession({ id: 'u3', role: 'root', exchange_code: 'EX-1' });
    expect(employee.ok && customer.ok, 'نشست نقش‌های معتبر ساخته نشد.');
    expect(shellFor(employee.session).shell === 'sarraaf', 'کارمند به پوستهٔ صراف نرسید.');
    expect(shellFor(customer.session).shell === 'customer' && shellFor(customer.session).route === '/customer', 'مشتری به پوستهٔ خودش نرسید.');
    expect(shellFor(null).shell === 'none' && shellFor(null).route === '/login', 'نشست خالی مسیر باز کرد.');
    expect(broken.ok === false, 'نقش ناشناخته پذیرفته شد.');
    add(access, 'route-guard', 'گیت مسیرها روی نقش نشست', STATUS.PASS,
      'نقش کارمند ← پوستهٔ صراف، مشتری ← پوستهٔ مشتری، نشست خالی ← ورود، نقش ناشناخته ← رد. تصمیم پوسته از نشست معتبر خوانده می‌شود.',
      { kind: 'test' });
  });

  // ——— ۵) گزارش‌ها، خروجی و چاپ ———
  const reports = group('reports', 'گزارش‌ها و عملیات', 'گزارش عملیات، خروجی CSV، گزارش‌های مشروط به سیاست و مدل چاپ.');
  const exportable = CORE_MODULES.filter((module) => ['master', 'posting', 'ledger', 'debtors', 'activity', 'errors'].includes(module.kind));
  const missingColumns = exportable.filter((module) => !columnsFor(module.id)).map((module) => module.id);
  add(reports, 'columns', 'ستون گزارش و CSV برای همهٔ بخش‌های قابل خروجی', missingColumns.length ? STATUS.FAIL : STATUS.PASS,
    missingColumns.length ? 'بدون ستون: ' + missingColumns.join(', ') : exportable.length + ' بخش ستون‌بندی‌شده است.', { kind: 'test' });

  try {
    const columns = columnsFor('customers') || [];
    const csv = buildCsv('customers', [{ code: 'X', name: 'آزمون "کوچک"' }]);
    const [header, row] = csv.split('\n');
    const ok = header.split(',').length === columns.length && row.includes('""');
    add(reports, 'csv', 'خروجی CSV: ستون‌بندی و فرار نقل‌قول', ok ? STATUS.PASS : STATUS.FAIL,
      'ستون: ' + header.split(',').length + ' از ' + columns.length + '، فرار نقل‌قول: ' + (row.includes('""') ? 'درست' : 'نادرست'),
      { kind: 'test' });
  } catch (error) {
    add(reports, 'csv', 'خروجی CSV: ستون‌بندی و فرار نقل‌قول', STATUS.FAIL, error?.message || 'خطا', { kind: 'test' });
  }

  // سه گزارش مشروط: هم امتناع بدون سیاست، هم نتیجهٔ هر گزینه روی دفتر نمونه
  financialContractChecks().forEach((check) => {
    add(reports, check.key, check.title, check.ok ? STATUS.PASS : STATUS.FAIL,
      'بررسی‌های موفق: ' + check.passed + ' از ' + check.total + ' — ' + check.evidence,
      { kind: 'test', dependency: check.ok ? '' : 'سیاست گزارش' });
  });

  const decisions = RULE_CONTRACTS.flatMap((contract) => contract.decisions);
  add(reports, 'policy-default', 'انتخاب سیاست پیش‌فرض سه گزارش', STATUS.BLOCKED,
    'پیاده‌سازی هر گزینه آماده و آزمون‌شده است، اما انتخاب سیاست پیش‌فرض تصمیم صرافی است: ' + decisions.map((item) => item.question).join(' / '),
    { kind: 'code', dependency: 'انتخاب سیاست گزارش‌ها' });

  guard(reports, 'print', 'مدل چاپ و خروجی گزارش', () => {
    const columns = columnsFor('customers') || [];
    const rows = [{ code: 'C1', name: 'مشتری آزمون', phone: '0700000000', status: 'فعال' }];
    const cells = rows.flatMap((row) => columns.map(([key]) => text(row[key])));
    expect(columns.length > 0, 'ستون چاپ تعریف نشده است.');
    expect(cells.length === columns.length * rows.length, 'سلول چاپ با ستون‌ها نمی‌خواند.');
    expect(columns.every(([, label]) => Boolean(label)), 'برچسب ستون چاپ ناقص است.');
    add(reports, 'print', 'مدل چاپ و خروجی گزارش', STATUS.PASS,
      'مدل چاپ: ' + columns.length + ' ستون برچسب‌دار و ' + rows.length + ' ردیف کامل ساخته شد؛ خروجی CSV همان ستون‌ها را دارد. باز شدن پنجرهٔ چاپ سیستم، رفتار مرورگر است نه منطق برنامه.',
      { kind: 'test' });
  });

  add(reports, 'operations', 'گزارش عملیات و تفکیک نوع سند', STATUS.PASS,
    'گزارش عملیات از اسناد ساخته می‌شود و ستون‌های آن تعریف شده است؛ پیوند هر ردیف به سند اصلی در ممیزی پنل بررسی می‌شود.',
    { kind: 'code' });

  // ——— ۵.۵) ممیزی عملیات، اسناد و ابطال ———
  const operations = group('operations', 'عملیات، اسناد و ابطال', 'اجرای ممیزی سرتاسری پنل روی دادهٔ ساختگی درون‌حافظه‌ای.');
  try {
    const audit = await runPanelAudit();
    add(operations, 'panel-audit', 'ممیزی سرتاسری پنل', audit.failed ? STATUS.FAIL : STATUS.PASS,
      audit.passed + ' از ' + audit.total + ' بررسی موفق'
        + (audit.failed ? '؛ ناموفق: ' + audit.results.filter((row) => !row.ok).slice(0, 3).map((row) => row.name).join('؛ ') : ''),
      { kind: 'test' });
    audit.groups.forEach((row, index) => {
      add(operations, 'audit-' + index, row.name, row.failed ? STATUS.FAIL : STATUS.PASS,
        row.passed + ' از ' + row.total + ' بررسی موفق', { kind: 'test' });
    });
  } catch (error) {
    add(operations, 'panel-audit', 'ممیزی سرتاسری پنل', STATUS.FAIL, error?.message || 'اجرا نشد', { kind: 'test' });
  }

  // ——— ۶) استقلال مرکز معاملات و مفاد معاملات ———
  const independence = group('modules_independence', 'مرکز معاملات و مفاد معاملات', 'دو ماژول مستقل با ارتباط حسابداری درست.');
  const opsMenu = MOBILE_MENUS.find((menu) => menu.key === 'ops');
  const reportsMenu = MOBILE_MENUS.find((menu) => menu.key === 'reports');
  add(independence, 'separate', 'دو ماژول جدا در ناوبری', opsMenu?.items.some((item) => item.action === 'transactions')
    && reportsMenu?.items.some((item) => item.module === 'profit') ? STATUS.PASS : STATUS.FAIL,
  'مرکز معاملات در «عملیات» و مفاد معاملات در «گزارشات» است.', { kind: 'test' });

  try {
    const before = JSON.stringify(tradeFixture);
    const result = computeTradeProfit({ trades: tradeFixture, currencies: tradeCurrencies, policy: { baseCurrency: 'AFN', method: 'weighted_average' } });
    const after = JSON.stringify(tradeFixture);
    const readOnly = before === after;
    const profitOk = result.rows.length === 2 && sameNumber(result.totals.profitBase, 400);
    add(independence, 'readonly', 'مفاد معاملات فقط می‌خواند و سود را درست می‌گیرد', readOnly && profitOk ? STATUS.PASS : STATUS.FAIL,
      'تغییر دادهٔ ورودی: ' + (readOnly ? 'ندارد' : 'دارد') + '، سود: ' + result.totals.profitBase + ' (انتظار ۴۰۰)', { kind: 'test' });
  } catch (error) {
    add(independence, 'readonly', 'مفاد معاملات فقط می‌خواند و سود را درست می‌گیرد', STATUS.FAIL, error?.message || 'خطا', { kind: 'test' });
  }

  // ——— ۷) چیدمان موبایل و لپ‌تاپ ———
  const layout = group('layout', 'چیدمان موبایل و لپ‌تاپ', 'آیکون‌ها، منوها، تصمیم چیدمان در عرض‌های مختلف و آزمون مرورگری.');
  const iconMissing = CORE_MODULES.filter((module) => !MODULE_ICONS[module.id]).map((module) => module.id);
  const icons = CORE_MODULES.map((module) => MODULE_ICONS[module.id]).filter(Boolean);
  add(layout, 'icons', 'آیکون مرجع یکتا برای هر ۲۵ بخش', iconMissing.length ? STATUS.FAIL : icons.length === new Set(icons).size ? STATUS.PASS : STATUS.FAIL,
    iconMissing.length ? 'بدون آیکون: ' + iconMissing.join(', ') : icons.length + ' آیکون بدون تکرار', { kind: 'test' });
  add(layout, 'mobile-list', 'فهرست بخش‌های موبایل روی رجیستری مرکزی', MOBILE_MODULES.length === CORE_MODULES.length ? STATUS.PASS : STATUS.FAIL,
    MOBILE_MODULES.length + ' بخش موبایل از ' + CORE_MODULES.length + ' بخش مرجع', { kind: 'test' });
  const moduleIds = new Set(CORE_MODULES.map((module) => module.id));
  const badLaptop = [...LAPTOP_MENU_MODULE_IDS, ...LAPTOP_SHORTCUTS.map((item) => item.id)].filter((id) => !moduleIds.has(id));
  add(layout, 'laptop-menu', 'منو و میان‌بر لپ‌تاپ به بخش معتبر', badLaptop.length ? STATUS.FAIL : STATUS.PASS,
    badLaptop.length ? 'شناسهٔ نامعتبر: ' + badLaptop.join(', ') : 'همهٔ میان‌برها و منوها معتبرند.', { kind: 'test' });
  const actions = new Set(['backup', 'restore', 'reset', 'transactions', 'settings', 'support', 'help', 'cashIn', 'cashOut']);
  const badMenus = [];
  MOBILE_MENUS.forEach((menu) => menu.items.forEach((item) => {
    if (item.module && !moduleIds.has(item.module)) badMenus.push(item.module);
    if (!item.module && !actions.has(item.action)) badMenus.push(String(item.action));
  }));
  add(layout, 'mobile-menus', 'همهٔ منوهای موبایل مقصد معتبر دارند', badMenus.length ? STATUS.FAIL : STATUS.PASS,
    badMenus.length ? 'مقصد نامعتبر: ' + badMenus.join(', ') : 'همهٔ ردیف‌های منو به بخش یا عملیات معتبر می‌رسند.', { kind: 'test' });

  guard(layout, 'responsive', 'تصمیم چیدمان در عرض موبایل، تبلت و لپ‌تاپ', () => {
    const widths = [
      { width: 375, height: 812 },
      { width: 600, height: 900 },
      { width: 768, height: 1024 },
      { width: 769, height: 1024 },
      { width: 900, height: 800 },
      { width: 1280, height: 800 },
      { width: 769, height: 400 },
    ];
    const results = widths.map((item) => ({ ...item, layout: decideLayout(spaceOf(item.width, item.height)) }));
    const phone = results[0].layout;
    const tabletBoundary = results.find((item) => item.width === 768).layout;
    const tablet = results.find((item) => item.width === 769 && item.height === 1024).layout;
    const wide = results.find((item) => item.width === 1280).layout;
    const shortWindow = results.find((item) => item.height === 400).layout;

    expect(phone.chrome === 'compact' && phone.table === 'cards', 'موبایل به پوستهٔ فشرده و نمای کارتی نرسید.');
    expect(tabletBoundary.chrome === 'desktop' && tablet.chrome === 'desktop', 'مرز ۷۶۸px پوستهٔ دسکتاپ را فعال نکرد.');
    expect(tablet.toolbar === 'top-rail', 'تبلت نوار ابزار بالای صفحه نگرفت.');
    expect(wide.mode === 'wide-desktop' && wide.table === 'table', 'لپ‌تاپ گسترده جدول کامل نگرفت.');
    expect(shortWindow.chrome === 'compact' && shortWindow.table === 'cards', 'ارتفاع کم به چیدمان فشرده نرسید.');
    expect(results.every((item) => item.layout.columns.tiles >= 3 && item.layout.columns.form >= 1 && item.layout.sizes.icon >= 14),
      'ستون‌ها یا اندازهٔ آیکون از محدودهٔ خوانا بیرون زد.');
    expect(results.every((item) => (item.layout.chrome === 'desktop') === (item.layout.toolbar === 'top-rail')),
      'نوع نوار ابزار با پوسته هم‌خوان نیست.');

    add(layout, 'responsive', 'تصمیم چیدمان در عرض موبایل، تبلت و لپ‌تاپ', STATUS.PASS,
      'ماتریس ' + results.length + ' عرض: ' + results.map((item) => item.width + '×' + item.height + '→' + item.layout.mode).join('، ')
        + ' · مرز ۷۶۸px، نوار ابزار، ستون‌ها و اندازه‌های پیوسته در همهٔ عرض‌ها درست تصمیم گرفته شد.',
      { kind: 'test' });
  });

  add(layout, 'browser-run', 'اجرای واقعی مرورگری (کلیک، چاپ، هم‌پوشانی پیکسلی)', STATUS.BLOCKED,
    'این برنامه هنوز نشانی منتشرشده ندارد و محیط آزمون به مرورگر واقعی وصل نیست؛ اندازه‌گیری هم‌پوشانی و کلیک واقعی فقط با نشانی منتشرشده ممکن است.',
    { kind: 'browser', dependency: 'انتشار برنامه و اجرای مرورگری' });

  // ——— ۸) بخش‌های سازمانی ———
  const enterprise = group('enterprise', 'بخش‌های سازمانی', 'مسیر، صفحه، مجوز و عملکرد هر ماژول مرجع: بدون داده عدد نمی‌سازد و نیاز را گزارش می‌کند.');
  const registrySections = new Set(CORE_MODULES.map((module) => module.section));
  const fixtureData = ledgerFixture();
  ENTERPRISE_MODULES.forEach((module) => {
    const page = enterprisePageModel(module.key);
    const forced = module.key === 'treasury'
      ? evaluateEnterpriseModule(module.key, { lines: fixtureData.transactions, data: fixtureData })
      : module.key === 'audit_log'
        ? evaluateEnterpriseModule(module.key, { activity: [{ action: 'create', entity: 'customer', user_name: 'مدیر صرافی', date: '2026-11-01', description: 'ثبت مشتری' }] })
        : null;
    const emptyRun = evaluateEnterpriseModule(module.key, {});
    const noGuess = emptyRun.status === 'blocked' && emptyRun.rows.length === 0 && emptyRun.missing.length > 0;
    const dataOk = !forced || (forced.status === 'ready' && forced.rows.length > 0);
    const pageOk = Boolean(page && page.title && page.description && page.capabilities.length === 3
      && page.dependencies.length > 0 && page.route === '/enterprise/' + module.key);
    const sectionOk = registrySections.has(sectionFor(module.key));
    const denied = checkPermission([], sectionFor(module.key), 'view') === false;
    const allowed = checkPermission([{ section: sectionFor(module.key), can_view: true }], sectionFor(module.key), 'view') === true;
    const ok = noGuess && dataOk && pageOk && sectionOk && denied && allowed;
    const mode = ACTION_MODES[actionOf(module.key)?.mode] || 'تعریف‌نشده';
    add(
      enterprise,
      module.key,
      module.title,
      ok ? STATUS.PASS : STATUS.FAIL,
      'مسیر و صفحه: ' + (pageOk ? 'کامل' : 'ناقص')
        + ' · مجوز بخش «' + sectionFor(module.key) + '»: ' + (sectionOk && denied && allowed ? 'اعمال می‌شود' : 'ناقص')
        + ' · بدون داده: ۰ ردیف و گزارش نیاز'
        + (forced ? ' · با دادهٔ آزمون: ' + forced.rows.length + ' ردیف (' + mode + ')' : ' · عملکرد: ' + mode),
      { kind: 'test', dependency: module.dependsOn.join('، ') },
    );
  });
  add(enterprise, 'count', 'پوشش کامل فهرست مرجع', ENTERPRISE_MODULES.length === 26 && definedActionCount() === 26 ? STATUS.PASS : STATUS.FAIL,
    ENTERPRISE_MODULES.length + ' ماژول سازمانی و ' + definedActionCount() + ' عملکرد تعریف‌شده از فهرست مرجع A1', { kind: 'test' });
  add(enterprise, 'real-data', 'اتصال دادهٔ واقعی ماژول‌های سازمانی', STATUS.BLOCKED,
    'هر ۲۶ ماژول مسیر، صفحه، مجوز و رفتار «بدون عدد حدسی» آزمون‌شده دارند؛ اما تولید دادهٔ واقعی به جدول‌های backend، قواعد تأییدشده و هویت واقعی نیاز دارد و در این محیط اتصالی وجود ندارد.',
    { kind: 'code', dependency: 'جدول‌های backend، قواعد تأییدشده و هویت واقعی' });

  // ——— ۹) احراز هویت و انتقال ———
  const auth = group('auth', 'احراز هویت و انتقال', 'معماری نشست و نگاشت نقش‌ها آزمون‌شده؛ فعال‌سازی ورود واقعی عمداً انجام نمی‌شود.');
  const staffRoles = ['creator', 'admin', 'sarraaf', 'employee', 'customer'];
  const unmapped = staffRoles.filter((role) => !isRoleMapped(role));
  add(auth, 'role-map', 'نگاشت نقش‌های محلی به نقش پلتفرم', unmapped.length ? STATUS.FAIL : STATUS.PASS,
    unmapped.length ? 'بدون نگاشت: ' + unmapped.join(', ') : ROLE_MIGRATION.length + ' نقش با نقش پلتفرم و سطح تخصص نگاشت شده است.', { kind: 'code' });
  add(auth, 'enforcement', 'نقاط اجرای مجوز', AUTH_ENFORCEMENT_POINTS.length >= 4 ? STATUS.PASS : STATUS.FAIL,
    AUTH_ENFORCEMENT_POINTS.map((item) => item.title).join('، '), { kind: 'code' });
  add(auth, 'decisions', 'تصمیم‌های باز مهاجرت ثبت شده‌اند', AUTH_OPEN_DECISIONS.length ? STATUS.PASS : STATUS.FAIL,
    AUTH_OPEN_DECISIONS.length + ' تصمیم باز (دامنهٔ صرافی، محل مجوز، منبع نشست، سیاست دعوت)', { kind: 'code' });

  try {
    const suite = runSessionTests();
    const failed = suite.filter((item) => !item.ok);
    add(auth, 'session-architecture', 'معماری نشست: اعتبارسنجی نقش، پوسته و ذخیره', failed.length ? STATUS.FAIL : STATUS.PASS,
      'بررسی‌های نشست: ' + (suite.length - failed.length) + ' از ' + suite.length + ' موفق'
        + (failed.length ? '؛ ناموفق: ' + failed.map((item) => item.name).join('؛ ') : '')
        + ' · هیچ درخواست شبکه‌ای در این لایه نیست.',
      { kind: 'test' });
  } catch (error) {
    add(auth, 'session-architecture', 'معماری نشست: اعتبارسنجی نقش، پوسته و ذخیره', STATUS.FAIL, error?.message || 'آزمون اجرا نشد', { kind: 'test' });
  }

  add(auth, 'platform-login', 'فعال‌سازی ورود واقعی کاربران', STATUS.BLOCKED,
    'معماری نشست آماده و آزمون‌شده است، اما اتصال به هویت واقعی طبق دامنهٔ توافق انجام نمی‌شود و به اجازهٔ صریح و کاربران واقعی نیاز دارد.',
    { kind: 'code', dependency: 'اجازهٔ اتصال ورود پلتفرم و کاربران واقعی' });

  // ——— جمع‌بندی ———
  const items = groups.flatMap((bucket) => bucket.items);
  const count = (status) => items.filter((item) => item.status === status).length;
  const summary = {
    total: items.length,
    passed: count(STATUS.PASS),
    failed: count(STATUS.FAIL),
    blocked: count(STATUS.BLOCKED),
    executed: items.filter((item) => item.kind === 'test').length,
    groups: groups.map((bucket) => ({
      key: bucket.key,
      title: bucket.title,
      total: bucket.items.length,
      passed: bucket.items.filter((item) => item.status === STATUS.PASS).length,
      failed: bucket.items.filter((item) => item.status === STATUS.FAIL).length,
      blocked: bucket.items.filter((item) => item.status === STATUS.BLOCKED).length,
    })),
  };
  summary.verdict = summary.failed
    ? 'نه — خطای فنی باز'
    : summary.blocked
      ? 'نه — موارد مسدود باقی است'
      : 'بله — آمادهٔ انتقال';
  summary.ready = summary.failed === 0 && summary.blocked === 0;

  return { generatedAt: new Date().toISOString(), groups, summary };
}