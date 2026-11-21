// src/core/sections/sectionPage.js — مدل یکپارچهٔ «یک صفحهٔ کامل برای هر بخش»
// هر بخش یک مدل می‌گیرد: شماره، عنوان، شاخص‌ها و بلوک‌های مرتبط با همان بخش.
// توابع خالص و بدون React؛ هر دو پوسته (لپ‌تاپ/تبلت و موبایل) از همین مدل تغذیه می‌شوند
// تا هیچ بخشی بدون یکپارچه‌سازی نماند و اعداد مشترک از یک منبع خوانده شوند.
import { CORE_MODULES, sectionNo } from '@/core/registry/modules';
import { cashBalance, ledgerWithOpenings } from '@/core/domain/balances';
import { customerStatement, branchStatement, accountStatement } from '@/core/domain/statement';
import { displayDate } from '@/core/domain/dates';

// تاریخ همهٔ سطرهای این صفحه شمسی نمایش داده می‌شود؛ سرصفحهٔ برنامه هم شمسی است.
const dateText = (value) => displayDate(value);

const num = (value) => Number(String(value ?? '').replaceAll(',', '')) || 0;
const list = (data, key) => (Array.isArray(data?.[key]) ? data[key] : []);
const active = (row) => row?.status !== 'غیرفعال' && row?.active !== false;
const dash = (value) => (value === 0 || value ? value : '—');

const money = (value, ctx) => (num(value) ? ctx.fmt(Math.abs(num(value))) : '—');

// ماندهٔ یک طرف حساب/صندوق/بانک از همان تجمیع گردش حساب
function balanceOf(data, party, kind) {
  const statement = kind === 'branch'
    ? branchStatement(data, party)
    : kind === 'cash'
      ? accountStatement(data, party, 'cash')
      : kind === 'bank'
        ? accountStatement(data, party, 'bank')
        : customerStatement(data, party);
  const currency = party?.currency || 'AFN';
  const total = statement.totals.find((row) => row.currency === currency) || statement.totals[0];
  return total ? { currency: total.currency, debit: total.debit, credit: total.credit, balance: total.balance, status: total.status } : null;
}

// سطرهای دفتر کل مرتبط با اسناد همین بخش (از شمارهٔ سند)
// سند کمیشن هر معامله/حواله شمارهٔ جدا دارد؛ اگر فقط شمارهٔ سند اصلی ملاک باشد،
// سطرهای کمیشن در گردش همان بخش دیده نمی‌شوند و «کمیشن ثبت نشده» به نظر می‌رسد.
function moduleLines(data, moduleKey) {
  const rows = list(data, moduleKey);
  const numbers = new Set(rows
    .flatMap((row) => [String(row.number || ''), String(row.feeNumber || '')])
    .filter(Boolean));
  // شمارهٔ چاپی رکورد همیشه با شمارهٔ سند یکی نیست (مثلاً حواله شمارهٔ TR دارد و سندش شمارهٔ دیگر)؛
  // پس سند از شناسهٔ خودِ سند هم تطبیق داده می‌شود تا گردش همان بخش خالی نماند.
  const documents = new Set(rows
    .flatMap((row) => [row.documentId, row.feeDocumentId])
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String));
  if (!numbers.size && !documents.size) return [];
  return list(data, 'ledger').filter((row) => numbers.has(String(row.number || ''))
    || documents.has(String(row.documentId || '')));
}

const lineRows = (lines, ctx) => lines.map((row) => ({
  id: row.id,
  // شناسه و شمارهٔ سند همراه سطر می‌آید تا از همین فهرست هم بتوان سند اصلی را باز کرد.
  documentId: row.documentId || null,
  number: row.number || '',
  title: row.account || row.party || 'سطر دفتر',
  sub: [dateText(row.date), row.number].filter(Boolean).join(' · '),
  badge: row.status,
  meta: [
    ['شرح', row.description || '—'],
    ['بدهکار', money(row.debit, ctx)],
    ['بستانکار', money(row.credit, ctx)],
    ['ارز', ctx.currencyLabel(row.currency || 'AFN')],
  ],
}));

const partyRows = (rows, kind, data, ctx, extra = []) => rows.map((row) => {
  const balance = balanceOf(data, row, kind);
  return {
    id: row.id,
    title: row.name || row.title || '—',
    sub: [row.code, row.phone || row.city || row.account].filter(Boolean).join(' · '),
    badge: balance?.status || row.status,
    meta: [
      ['ارز', ctx.currencyLabel(balance?.currency || row.currency || 'AFN')],
      ...extra.map(([label, getter]) => [label, getter(row)]),
      ['مانده', balance ? ctx.fmt(Math.abs(balance.balance)) + ' ' + ctx.currencyLabel(balance.currency) : '—'],
    ],
  };
});

const docRows = (rows, ctx) => rows.map((row) => ({
  id: row.id,
  documentId: row.documentId || null,
  number: row.number || '',
  title: row.number || row.title || row.description || 'سند',
  sub: dateText(row.date),
  badge: row.status,
  meta: [
    ['شرح', row.description || row.title || row.note || '—'],
    ['مبلغ', money(row.amount, ctx) + ' ' + ctx.currencyLabel(row.currency || 'AFN')],
    ['طرف حساب', row.party || row.sender || row.receiver || row.expenseAccount || '—'],
  ],
}));

const ledgerBlock = (key, label, lines, ctx) => ({
  key,
  label,
  rows: lineRows(lines.slice(0, 40), ctx),
  empty: 'در این بخش سطر دفتر کل ثبت نشده است.',
});

// شاخص‌های هر بخش فقط از دادهٔ همان بخش ساخته می‌شوند؛ عدد حدسی ساخته نمی‌شود.
const countMetric = (label, value) => ({ key: label, label, value });

// ماندهٔ هر طرف حساب از دفتر حساب خودش؛ اگر سطری ثبت نشده باشد، ماندهٔ افتتاحیه ملاک است
const partyBalance = (data, row, kind) => {
  const balance = balanceOf(data, row, kind);
  if (balance) return balance;
  const opening = num(row.opening);
  return opening ? { currency: row.currency || 'AFN', balance: opening } : null;
};

// شاخص بدهکار/بستانکار: تعداد طرف حساب و جمع مبلغ، به تفکیک ارز
const balanceMetric = (label, balances, side, ctx) => {
  const rows = balances.filter((row) => (side > 0 ? row.balance > 0 : row.balance < 0));
  const totals = new Map();
  rows.forEach((row) => {
    const currency = row.currency || 'AFN';
    totals.set(currency, (totals.get(currency) || 0) + Math.abs(row.balance));
  });
  const amounts = [...totals.entries()]
    .map(([currency, amount]) => ctx.fmt(amount) + ' ' + ctx.currencyLabel(currency))
    .join(' · ');
  return {
    key: label,
    label,
    value: ctx.fmt(rows.length) + ' نفر' + (amounts ? ' · ' + amounts : ''),
    tone: side > 0 ? 'debt' : 'credit',
  };
};

const CONFIG = {
  customers: (data, ctx) => {
    const balances = list(data, 'customers')
      .map((row) => partyBalance(data, row, 'customer'))
      .filter(Boolean);
    return {
      metrics: [
        countMetric('تعداد مشتریان', ctx.fmt(list(data, 'customers').length)),
        countMetric('فعال', ctx.fmt(list(data, 'customers').filter(active).length)),
        balanceMetric('مشتریان بدهکار', balances, 1, ctx),
        balanceMetric('مشتریان بستانکار', balances, -1, ctx),
      ],
      blocks: [
        {
          key: 'customers',
          label: 'فهرست مشتریان',
          rows: partyRows(list(data, 'customers'), 'customer', data, ctx, [['نوع', (row) => row.kind || '—']]),
          empty: 'مشتری تعریف نشده است.',
        },
        ledgerBlock('customer-accounting', 'گردش حساب مشتریان', list(data, 'ledger').filter((row) => String(row.accountType || '').toLowerCase() === 'customer'), ctx),
      ],
    };
  },
  customerLedger: (data, ctx) => ({
    metrics: [countMetric('حساب‌های مشتریان', ctx.fmt(list(data, 'customers').length))],
    blocks: [
      {
        key: 'balances',
        label: 'ماندهٔ حساب‌ها',
        rows: partyRows(list(data, 'customers'), 'customer', data, ctx),
        empty: 'مشتری تعریف نشده است.',
      },
      ledgerBlock('lines', 'سطرهای گردش حساب', list(data, 'ledger').filter((row) => String(row.accountType || '').toLowerCase() === 'customer'), ctx),
    ],
  }),
  debtors: (data, ctx) => {
    const rows = list(data, 'customers').map((row) => ({ row, balance: balanceOf(data, row, 'customer') }));
    return {
      metrics: [
        countMetric('بدهکار', ctx.fmt(rows.filter((item) => (item.balance?.balance || 0) > 0).length)),
        countMetric('بستانکار', ctx.fmt(rows.filter((item) => (item.balance?.balance || 0) < 0).length)),
        countMetric('تسویه', ctx.fmt(rows.filter((item) => !item.balance?.balance).length)),
      ],
      blocks: [{
        key: 'debtors',
        label: 'ماندهٔ طرف‌حساب‌ها',
        rows: partyRows(list(data, 'customers'), 'customer', data, ctx),
        empty: 'طرف حسابی برای بررسی مانده وجود ندارد.',
      }],
    };
  },
  branches: (data, ctx) => ({
    metrics: [countMetric('تعداد نمایندگی', ctx.fmt(list(data, 'branches').length)), countMetric('فعال', ctx.fmt(list(data, 'branches').filter(active).length))],
    blocks: [
      {
        key: 'branches',
        label: 'فهرست نمایندگی‌ها',
        rows: partyRows(list(data, 'branches'), 'branch', data, ctx, [['موقعیت', (row) => row.city || '—']]),
        empty: 'نمایندگی تعریف نشده است.',
      },
      ledgerBlock('branch-accounting', 'گردش حساب نمایندگی‌ها', list(data, 'ledger').filter((row) => ['origin', 'branch'].includes(String(row.accountType || '').toLowerCase())), ctx),
    ],
  }),
  branchLedger: (data, ctx) => ({
    metrics: [countMetric('حساب‌های نمایندگی', ctx.fmt(list(data, 'branches').length))],
    blocks: [
      {
        key: 'balances',
        label: 'ماندهٔ حساب‌ها',
        rows: partyRows(list(data, 'branches'), 'branch', data, ctx),
        empty: 'نمایندگی تعریف نشده است.',
      },
      ledgerBlock('lines', 'سطرهای گردش حساب', list(data, 'ledger').filter((row) => ['origin', 'branch'].includes(String(row.accountType || '').toLowerCase())), ctx),
    ],
  }),
  cash: (data, ctx) => ({
    metrics: [countMetric('تعداد صندوق', ctx.fmt(list(data, 'cash').length))],
    blocks: [
      {
        key: 'safes',
        label: 'صندوق‌ها و موجودی',
        rows: list(data, 'cash').map((row) => ({
          id: row.id,
          title: row.name,
          sub: ctx.currencyLabel(row.currency || 'AFN'),
          badge: row.status,
          meta: [['افتتاحیه', money(row.opening, ctx)], ['موجودی', ctx.fmt(cashBalance(data, row))]],
        })),
        empty: 'صندوقی تعریف نشده است.',
      },
      ledgerBlock('cash-accounting', 'گردش صندوق‌ها', list(data, 'ledger').filter((row) => String(row.accountType || '').toLowerCase() === 'cash'), ctx),
    ],
  }),
  banks: (data, ctx) => ({
    metrics: [countMetric('تعداد حساب بانکی', ctx.fmt(list(data, 'banks').length))],
    blocks: [
      {
        key: 'banks',
        label: 'حساب‌های بانکی',
        rows: partyRows(list(data, 'banks'), 'bank', data, ctx, [['شماره حساب', (row) => row.account || '—']]),
        empty: 'حساب بانکی تعریف نشده است.',
      },
      ledgerBlock('bank-accounting', 'گردش حساب‌های بانکی', list(data, 'ledger').filter((row) => String(row.accountType || '').toLowerCase() === 'bank'), ctx),
    ],
  }),
  exchange: (data, ctx) => ({
    metrics: [countMetric('تعداد معامله', ctx.fmt(list(data, 'exchange').length))],
    blocks: [
      { key: 'docs', label: 'معاملات اسعار', rows: docRows(list(data, 'exchange'), ctx), empty: 'معامله‌ای ثبت نشده است.' },
      ledgerBlock('accounting', 'سطرهای دفتر کل این معاملات', moduleLines(data, 'exchange'), ctx),
    ],
  }),
  remittance: (data, ctx) => ({
    metrics: [countMetric('تعداد حواله', ctx.fmt(list(data, 'remittance').length))],
    blocks: [
      { key: 'docs', label: 'حواله‌ها', rows: docRows(list(data, 'remittance'), ctx), empty: 'حواله‌ای ثبت نشده است.' },
      ledgerBlock('accounting', 'سطرهای دفتر کل این حواله‌ها', moduleLines(data, 'remittance'), ctx),
    ],
  }),
  expenses: (data, ctx) => ({
    metrics: [countMetric('تعداد مصرف', ctx.fmt(list(data, 'expenses').length))],
    blocks: [
      { key: 'docs', label: 'مصارف و پرداخت‌ها', rows: docRows(list(data, 'expenses'), ctx), empty: 'مصرفی ثبت نشده است.' },
      ledgerBlock('accounting', 'سطرهای دفتر کل این مصارف', moduleLines(data, 'expenses'), ctx),
    ],
  }),
  journal: (data, ctx) => ({
    metrics: [countMetric('تعداد سند', ctx.fmt(list(data, 'journal').length))],
    blocks: [
      {
        key: 'docs',
        label: 'اسناد روزنامچه',
        rows: list(data, 'journal').map((row) => ({
          id: row.id,
          title: row.number || 'سند روزنامچه',
          sub: dateText(row.date),
          badge: row.status,
          meta: [['شرح', row.description || '—'], ['بدهکار', money(row.debitTotal, ctx)], ['بستانکار', money(row.creditTotal, ctx)], ['ارز', ctx.currencyLabel(row.currency || 'AFN')]],
        })),
        empty: 'سندی ثبت نشده است.',
      },
      ledgerBlock('accounting', 'سطرهای دفتر کل این اسناد', moduleLines(data, 'journal'), ctx),
    ],
  }),
  ledger: (data, ctx) => ({
    metrics: [countMetric('سطرهای دفتر کل', ctx.fmt(ledgerWithOpenings(data).length))],
    blocks: [
      ledgerBlock('lines', 'همهٔ سطرهای دفتر کل', ledgerWithOpenings(data), ctx),
      {
        key: 'by-account',
        label: 'جمع به تفکیک حساب',
        rows: [...ledgerWithOpenings(data).reduce((map, row) => {
          const key = row.account || 'بدون حساب';
          const current = map.get(key) || { id: key, title: key, debit: 0, credit: 0, currency: row.currency || 'AFN' };
          current.debit += num(row.debit);
          current.credit += num(row.credit);
          map.set(key, current);
          return map;
        }, new Map()).values()].map((row) => ({
          id: row.id,
          title: row.title,
          sub: ctx.currencyLabel(row.currency),
          meta: [['بدهکار', money(row.debit, ctx)], ['بستانکار', money(row.credit, ctx)], ['مانده', ctx.fmt(Math.abs(row.debit - row.credit))]],
        })),
        empty: 'سطری برای جمع‌بندی وجود ندارد.',
      },
    ],
  }),
  accounts: (data, ctx) => ({
    metrics: [countMetric('حساب‌های کدینگ', ctx.fmt(list(data, 'accounts').length))],
    blocks: [{
      key: 'accounts',
      label: 'کدینگ حساب‌ها',
      rows: list(data, 'accounts').map((row) => ({
        id: row.id,
        title: (row.code ? row.code + ' — ' : '') + (row.name || ''),
        sub: row.accountType || '',
        badge: row.status,
        meta: [['ماهیت', row.nature || '—'], ['ارز', row.currency ? ctx.currencyLabel(row.currency) : 'بدون ارز']],
      })),
      empty: 'حسابی در کدینگ تعریف نشده است.',
    }],
  }),
  currencies: (data, ctx) => ({
    metrics: [countMetric('ارزهای تعریف‌شده', ctx.fmt(list(data, 'currencies').length))],
    blocks: [{
      key: 'currencies',
      label: 'ارزهای تعریف‌شده',
      rows: list(data, 'currencies').map((row) => ({
        id: row.id,
        title: row.name || row.code,
        sub: [row.code, row.symbol].filter(Boolean).join(' · '),
        badge: active(row) ? 'فعال' : 'غیرفعال',
        meta: [['نرخ', ctx.fmt(row.rate)]],
      })),
      empty: 'ارزی تعریف نشده است.',
    }],
  }),
  rates: (data, ctx) => {
    const source = list(data, 'rates').length
      ? list(data, 'rates')
      : list(data, 'currencies').map((row) => ({ id: row.id, code: row.code, name: row.name, buy: row.rate, sell: row.rate }));
    return {
      metrics: [countMetric('نرخ‌های نمایشی', ctx.fmt(source.length))],
      blocks: [{
        key: 'rates',
        label: 'نرخ روز ارزها',
        rows: source.map((row) => ({
          id: row.id,
          title: row.name || row.code,
          sub: row.code || '',
          meta: [['خرید', ctx.fmt(row.buy)], ['فروش', ctx.fmt(row.sell)]],
        })),
        empty: 'نرخی برای نمایش ثبت نشده است.',
      }],
    };
  },
  reports: (data, ctx) => ({
    metrics: [countMetric('اسناد گزارش', ctx.fmt(list(data, 'reports').length))],
    blocks: [
      { key: 'docs', label: 'اسناد و عملیات', rows: docRows(list(data, 'reports'), ctx), empty: 'سندی برای گزارش وجود ندارد.' },
      ledgerBlock('lines', 'سطرهای دفتر کل', list(data, 'ledger').slice(0, 40), ctx),
    ],
  }),
  profit: (data, ctx) => {
    const rows = list(data, 'profitRows').length ? list(data, 'profitRows') : list(data, 'profitByCurrency');
    return {
      metrics: [countMetric('ارزهای دارای گردش درآمد/مصرف', ctx.fmt(rows.length))],
      blocks: [{
        key: 'profit',
        label: 'درآمد و مصرف به تفکیک ارز',
        rows: rows.map((row) => ({
          id: row.currency || row.id,
          title: ctx.currencyLabel(row.currency),
          meta: [['درآمد', ctx.fmt(row.revenue)], ['مصارف', ctx.fmt(row.expense)], ['خالص', ctx.fmt((row.revenue || 0) - (row.expense || 0))]],
        })),
        empty: 'سطری به حساب درآمد یا مصرف وصل نیست؛ سود قابل محاسبه نیست.',
      }],
    };
  },
  balance: (data, ctx) => ({
    metrics: [countMetric('صندوق‌ها', ctx.fmt(list(data, 'cash').length))],
    blocks: [{
      key: 'balances',
      label: 'موجودی صندوق‌ها به تفکیک ارز',
      rows: [...new Set(list(data, 'cash').map((row) => row.currency || 'AFN'))].map((code) => ({
        id: code,
        title: ctx.currencyLabel(code),
        meta: [['موجودی', ctx.fmt(list(data, 'cash').filter((row) => (row.currency || 'AFN') === code).reduce((sum, row) => sum + cashBalance(data, row), 0))]],
      })),
      empty: 'صندوقی برای محاسبهٔ موجودی وجود ندارد.',
    }],
  }),
  activity: (data, ctx) => ({
    metrics: [countMetric('سوابق فعالیت', ctx.fmt(list(data, 'activity').length))],
    blocks: [{
      key: 'activity',
      label: 'سوابق فعالیت',
      rows: list(data, 'activity').slice(0, 40).map((row) => ({
        id: row.id,
        title: row.entity || row.action || 'فعالیت',
        sub: [dateText(row.date), row.action].filter(Boolean).join(' · '),
        badge: row.status,
        meta: [['شرح', row.description || '—']],
      })),
      empty: 'سابقه‌ای ثبت نشده است.',
    }],
  }),
  errors: (data, ctx) => ({
    metrics: [countMetric('خطاهای ثبت‌شده', ctx.fmt(list(data, 'errors').length))],
    blocks: [{
      key: 'errors',
      label: 'خطاهای ثبت‌شده',
      rows: list(data, 'errors').slice(0, 40).map((row) => ({
        id: row.id,
        title: row.error_type || row.type || 'خطا',
        sub: dateText(row.date),
        badge: row.status,
        meta: [['شرح', row.error_message || row.description || '—'], ['دستگاه', row.device || '—']],
      })),
      empty: 'خطایی ثبت نشده است.',
    }],
  }),
};

const LINKED = ['language', 'sarraafGroups', 'assistant', 'products'];

// بلوکی که همان فهرست اصلی خود بخش است (پوسته آن را جدا نشان می‌دهد) تا در نوار یکپارچه تکرار نشود.
const PRIMARY_BLOCK = {
  customers: 'customers', customerLedger: 'balances', debtors: 'debtors', branches: 'branches',
  branchLedger: 'balances', cash: 'safes', banks: 'banks', exchange: 'docs', remittance: 'docs',
  expenses: 'docs', journal: 'docs', reports: 'docs', ledger: 'lines', accounts: 'accounts',
  currencies: 'currencies', rates: 'rates', profit: 'profit', balance: 'balances',
  activity: 'activity', errors: 'errors',
};

export function buildSectionPage(id, data, ctx) {
  const module = CORE_MODULES.find((item) => item.id === id);
  if (!module || module.id === 'home') return null;
  const base = { id: module.id, no: sectionNo(module.id), label: module.label, group: module.group, kind: module.kind };
  if (LINKED.includes(id)) {
    // امکانات تکمیلی دادهٔ حسابداری ندارند؛ بدنهٔ اختصاصی خودشان همان صفحهٔ کامل آن‌هاست.
    return { ...base, metrics: [], blocks: [], linked: true };
  }
  const build = CONFIG[id];
  if (!build) return { ...base, metrics: [], blocks: [] };
  const result = build(data || {}, ctx);
  const blocks = (result.blocks || []).map((block) => ({ ...block, primary: block.key === PRIMARY_BLOCK[id] }));
  return { ...base, ...result, blocks };
}

export const SECTION_GROUP_LABELS = {
  home: 'میزکار',
  define: 'تعاریف و دفاتر',
  cash: 'صندوق و بانک',
  ops: 'عملیات صرافی',
  accounting: 'حسابداری',
  reports: 'گزارشات و مطالبات',
  extras: 'امکانات تکمیلی',
  more: 'بخش‌های تکمیلی',
};