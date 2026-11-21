// a1/lib/seed.js — دادهٔ ساختگی آزمایشی
// هیچ اطلاعات شخصی یا مالی واقعی در این فایل نیست. همهٔ رکوردها با is_demo علامت‌گذاری می‌شوند.
// کدینگ حساب‌ها همان کدینگ پایهٔ نسخهٔ ۲۱ سورس A1 است تا گزارش‌های میز کار واقعی محاسبه شوند.
import { all, insert, count, update, postDocument } from '@/a1/lib/db';

export const DEMO_EXCHANGE_CODE = 'DEMO-EX';

// حساب‌های نمایشی برای ورود A1 (بدون رمز واقعی، بدون OTP، بدون JWT)
// هر حساب مشتری نمایشی به یک پروندهٔ مشخص (بر پایهٔ شمارهٔ تماس) متصل است
export const DEMO_ACCOUNTS = [
  { username: 'demo-creator', full_name: 'سازندهٔ نمایشی', role: 'creator', label: 'سازنده سیستم', home: '/builder' },
  { username: 'demo-admin', full_name: 'مدیر صرافی نمایشی', role: 'admin', label: 'مدیر صرافی', home: '/dashboard' },
  { username: 'demo-sarraaf', full_name: 'صراف نمایشی', role: 'sarraaf', label: 'صراف', home: '/dashboard' },
  { username: 'demo-employee', full_name: 'کارمند نمایشی', role: 'employee', label: 'کارمند صراف', home: '/dashboard' },
  { username: 'demo-customer', full_name: 'حاجی نظر احمد (مشتری نمایشی)', role: 'customer', label: 'مشتری ۱', home: '/customer', customer_mobile: '0700000001', customer_name: 'حاجی نظر احمد' },
  { username: 'demo-customer-2', full_name: 'محمد یوسف (مشتری نمایشی)', role: 'customer', label: 'مشتری ۲', home: '/customer', customer_mobile: '0700000003', customer_name: 'محمد یوسف' },
  { username: 'demo-customer-3', full_name: 'سید کریم (مشتری نمایشی)', role: 'customer', label: 'مشتری ۳', home: '/customer', customer_mobile: '0700000006', customer_name: 'سید کریم' },
];

const CUSTOMERS = [
  { name: 'حاجی نظر احمد', mobile: '0700000001', city: 'کابل', customer_type: 'permanent', opening_balance: 0 },
  { name: 'شرکت الفتح لمت', mobile: '0700000002', city: 'هرات', customer_type: 'permanent', opening_balance: 0 },
  { name: 'محمد یوسف', mobile: '0700000003', city: 'کابل', customer_type: 'permanent', opening_balance: 0 },
  { name: 'عبدالرحیم', mobile: '0700000004', city: 'مزار', customer_type: 'temporary', opening_balance: 0 },
  { name: 'حواله‌خانهٔ نور', mobile: '0700000005', city: 'قندهار', customer_type: 'permanent', opening_balance: 0 },
  { name: 'سید کریم', mobile: '0700000006', city: 'کابل', customer_type: 'permanent', opening_balance: 0 },
];

const RATES = [
  { currency: 'USD', symbol: '$', buy_rate: 69.2, sell_rate: 69.8, decimals: 2, type: 'fiat', sort_order: 1, daily_rate: 69.5 },
  { currency: 'EUR', symbol: '€', buy_rate: 74.9, sell_rate: 75.8, decimals: 2, type: 'fiat', sort_order: 2, daily_rate: 75.3 },
  { currency: 'AED', symbol: 'د.إ', buy_rate: 18.8, sell_rate: 19.1, decimals: 2, type: 'fiat', sort_order: 3, daily_rate: 18.95 },
  { currency: 'PKR', symbol: '₨', buy_rate: 0.24, sell_rate: 0.26, decimals: 4, type: 'fiat', sort_order: 4, daily_rate: 0.25 },
  { currency: 'IRR', symbol: 'تومان', buy_rate: 0.0011, sell_rate: 0.0012, decimals: 6, type: 'fiat', sort_order: 5, daily_rate: 0.00115 },
  { currency: 'AFN', symbol: '؋', buy_rate: 1, sell_rate: 1, decimals: 0, type: 'fiat', sort_order: 0, daily_rate: 1 },
];

const SAFES = [
  { name: 'صندوق اصلی افغانی', currency: 'AFN', opening_balance: 1500000, opening_value: 1500000, display_order: 1 },
  { name: 'صندوق دالر', currency: 'USD', opening_balance: 25000, opening_value: 1737500, display_order: 2 },
];

const BANK_ACCOUNTS = [
  { bank_name: 'عزیزی بانک', account_number: '1002345', holder: 'حساب صراف نمایشی', currency: 'AFN', balance: 850000, opening_balance: 850000, display_order: 1 },
  { bank_name: 'ملی بانک', account_number: '7781002', holder: 'حساب صراف نمایشی', currency: 'USD', balance: 12000, opening_balance: 12000, display_order: 2 },
];

// کدینگ پایهٔ نسخهٔ ۲۱ (همان فهرست seedVersion21BaseAccounts سورس A1)
const CHART = [
  { code: '1000', name: 'دارایی‌ها', type: 'asset', normal: 'debit' },
  { code: '1010', name: 'صندوق‌ها', type: 'asset', normal: 'debit', parent: '1000' },
  { code: '1020', name: 'حساب‌های بانکی', type: 'asset', normal: 'debit', parent: '1000' },
  { code: '1030', name: 'مطالبات مشتریان', type: 'asset', normal: 'debit', parent: '1000' },
  { code: '2000', name: 'بدهی‌ها', type: 'liability', normal: 'credit' },
  { code: '2010', name: 'بدهی به مشتریان', type: 'liability', normal: 'credit', parent: '2000' },
  { code: '3000', name: 'سرمایه', type: 'equity', normal: 'credit' },
  { code: '4000', name: 'درآمدها', type: 'revenue', normal: 'credit' },
  { code: '4010', name: 'درآمد کمیشن حواله', type: 'revenue', normal: 'credit', parent: '4000' },
  { code: '4020', name: 'درآمد معاملات اسعار', type: 'revenue', normal: 'credit', parent: '4000' },
  { code: '5000', name: 'مصارف', type: 'expense', normal: 'debit' },
  { code: '5010', name: 'مصارف عملیاتی', type: 'expense', normal: 'debit', parent: '5000' },
  { code: '5020', name: 'زیان معاملات اسعار', type: 'expense', normal: 'debit', parent: '5000' },
];

const ORIGINS = [
  { name: 'حواله‌خانهٔ هرات', type: 'agent', city: 'هرات', phone: '0799000001' },
  { name: 'حواله‌خانهٔ قندهار', type: 'agent', city: 'قندهار', phone: '0799000002' },
  { name: 'شبکهٔ نور', type: 'agent', city: 'کابل', phone: '0799000003' },
];

const FEATURE_ROWS = [
  'dashboard', 'customers', 'trade', 'cash', 'bank', 'currencies', 'transfers',
  'transfer_book', 'journal', 'general_ledger', 'chart_of_accounts', 'balance_sheet',
  'profit_loss', 'reports', 'settings', 'agents', 'debtors', 'dadogereft', 'convert',
  'notifications', 'support', 'backup', 'online_products', 'payment_gateway', 'chat_groups',
];

const PERMISSION_SECTIONS = [
  'dashboard', 'customers', 'accounts_receivable', 'agents', 'cash', 'bank', 'trade',
  'transfers', 'journal', 'general_ledger', 'chart_of_accounts', 'currencies', 'reports',
  'profit_loss', 'audit_log', 'balance_sheet', 'chat_groups', 'assistant', 'online_products', 'settings',
];

export async function seedIfEmpty() {
  // حساب‌های نمایشی همیشه تکمیل می‌شوند تا مرورگرهایی که فقط یک حساب مشتری داشتند،
  // حساب‌های مشتری جداگانه را هم دریافت کنند؛ دادهٔ موجود دست‌نخورده می‌ماند.
  const existingUsers = await all('users');
  let addedUsers = 0;
  for (const account of DEMO_ACCOUNTS) {
    if (existingUsers.some(row => row.username === account.username)) continue;
    await insert('users', {
      username: account.username,
      full_name: account.full_name,
      role: account.role,
      customer_mobile: account.customer_mobile || null,
      customer_name: account.customer_name || null,
      exchange_code: DEMO_EXCHANGE_CODE,
      is_active: true,
      local_demo: true,
    });
    addedUsers += 1;
  }

  if ((await count('exchanges')) > 0) return { seeded: false, addedUsers };

  for (const section of PERMISSION_SECTIONS) {
    await insert('user_permissions', {
      user_id: 'demo-employee',
      section,
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_print: true,
      can_report: true,
      can_settings: section === 'settings',
      exchange_code: DEMO_EXCHANGE_CODE,
    });
  }

  await insert('exchanges', {
    exchange_code: DEMO_EXCHANGE_CODE,
    exchange_name: 'صرافی نمایشی حساب صراف',
    name: 'صرافی نمایشی',
    city: 'کابل',
    country: 'افغانستان',
    status: 'active',
    plan: 'pro',
    quota_limit: 10000,
    quota_used: 12,
    exchange_code_locked: true,
  });

  for (const row of CUSTOMERS) {
    await insert('customers', { ...row, exchange_code: DEMO_EXCHANGE_CODE, is_demo: true, status: 'active', identity_status: 'verified' });
  }
  for (const row of RATES) {
    await insert('rates', { ...row, exchange_code: DEMO_EXCHANGE_CODE, exchange_code_locked: true, is_active: true, show_to_customer: true, rate_date: new Date().toISOString().slice(0, 10) });
  }
  for (const row of SAFES) {
    await insert('safes', { ...row, exchange_code: DEMO_EXCHANGE_CODE, active: true });
  }
  for (const row of BANK_ACCOUNTS) {
    await insert('bank_accounts', { ...row, exchange_code: DEMO_EXCHANGE_CODE, active: true });
  }
  for (const row of ORIGINS) {
    await insert('origins', { ...row, exchange_code: DEMO_EXCHANGE_CODE, is_active: true });
  }

  // کدینگ پایه: ابتدا حساب‌های کل، سپس معین‌ها با parent_id واقعی
  const chartIds = new Map();
  for (const row of CHART.filter(item => !item.parent)) {
    const saved = await insert('chart_of_accounts', {
      exchange_code: DEMO_EXCHANGE_CODE, account_code: row.code, account_name: row.name,
      account_type: row.type, normal_balance: row.normal, is_system: true, is_active: true,
    });
    chartIds.set(row.code, saved.id);
  }
  for (const row of CHART.filter(item => item.parent)) {
    const saved = await insert('chart_of_accounts', {
      exchange_code: DEMO_EXCHANGE_CODE, account_code: row.code, account_name: row.name,
      account_type: row.type, normal_balance: row.normal, parent_id: chartIds.get(row.parent),
      is_system: true, is_active: true,
    });
    chartIds.set(row.code, saved.id);
  }
  const revenueAccount = { account_type: 'suspense', account_id: String(chartIds.get('4010')), account_name: 'درآمد کمیشن حواله' };
  const expenseAccount = { account_type: 'suspense', account_id: String(chartIds.get('5010')), account_name: 'مصارف عملیاتی' };

  for (const key of FEATURE_ROWS) {
    await insert('feature_settings', { feature_key: key, status: 'active', exchange_code: DEMO_EXCHANGE_CODE });
  }
  await insert('app_settings', { setting_key: 'usd_afn', setting_value: '69.5', setting_type: 'number', exchange_code: DEMO_EXCHANGE_CODE });
  await insert('app_settings', { setting_key: 'afn_toman', setting_value: '0.00115', setting_type: 'number', exchange_code: DEMO_EXCHANGE_CODE });
  await insert('app_settings', { setting_key: 'exchange_name', setting_value: 'صرافی نمایشی', setting_type: 'text', exchange_code: DEMO_EXCHANGE_CODE });

  // ── اسناد ساختگی متوازن (فقط برای نمایش زندهٔ گزارش‌ها) ──
  const customers = await all('customers');
  const safes = await all('safes');
  const banks = await all('bank_accounts');

  const docs = [
    {
      doc_type: 'trade', currency: 'USD', amount: 5000, description: 'خرید دالر از حاجی نظر احمد',
      related_type: 'customer', related_id: customers[0]?.id, related_name: customers[0]?.name,
      lines: [
        { account_type: 'cash', account_id: String(safes[1]?.id), account_name: safes[1]?.name, currency: 'USD', debit: 5000, credit: 0 },
        { account_type: 'customer', account_id: String(customers[0]?.id), account_name: customers[0]?.name, currency: 'USD', debit: 0, credit: 5000 },
      ],
    },
    {
      doc_type: 'trade', currency: 'USD', amount: 3200, fee: 40, description: 'فروش دالر به شرکت الفتح لمت',
      related_type: 'customer', related_id: customers[1]?.id, related_name: customers[1]?.name,
      lines: [
        { account_type: 'customer', account_id: String(customers[1]?.id), account_name: customers[1]?.name, currency: 'USD', debit: 3200, credit: 0 },
        { account_type: 'cash', account_id: String(safes[1]?.id), account_name: safes[1]?.name, currency: 'USD', debit: 0, credit: 3200 },
      ],
    },
    {
      doc_type: 'deposit', currency: 'AFN', amount: 250000, description: 'واریز نقدی به بانک عزیزی',
      related_type: 'bank', related_id: banks[0]?.id, related_name: banks[0]?.bank_name,
      lines: [
        { account_type: 'bank', account_id: String(banks[0]?.id), account_name: banks[0]?.bank_name, currency: 'AFN', debit: 250000, credit: 0 },
        { account_type: 'cash', account_id: String(safes[0]?.id), account_name: safes[0]?.name, currency: 'AFN', debit: 0, credit: 250000 },
      ],
    },
    {
      doc_type: 'income', currency: 'AFN', amount: 18000, description: 'درآمد کمیشن حواله',
      related_type: 'none',
      lines: [
        { account_type: 'cash', account_id: String(safes[0]?.id), account_name: safes[0]?.name, currency: 'AFN', debit: 18000, credit: 0 },
        { ...revenueAccount, currency: 'AFN', debit: 0, credit: 18000 },
      ],
    },
    {
      doc_type: 'expense', currency: 'AFN', amount: 7500, description: 'مصارف اداری دفتر',
      related_type: 'none',
      lines: [
        { ...expenseAccount, currency: 'AFN', debit: 7500, credit: 0 },
        { account_type: 'cash', account_id: String(safes[0]?.id), account_name: safes[0]?.name, currency: 'AFN', debit: 0, credit: 7500 },
      ],
    },
    {
      doc_type: 'journal', currency: 'AFN', amount: 2000, description: 'سند روزنامچه — مصرف جزئی دفتر',
      related_type: 'none',
      lines: [
        { ...expenseAccount, currency: 'AFN', debit: 2000, credit: 0 },
        { account_type: 'cash', account_id: String(safes[0]?.id), account_name: safes[0]?.name, currency: 'AFN', debit: 0, credit: 2000 },
      ],
    },
  ];

  for (const doc of docs) {
    await postDocument({
      ...doc,
      exchange_code: DEMO_EXCHANGE_CODE,
      registered_by: 'مدیر صرافی نمایشی',
      registered_by_user_id: 2,
    });
  }

  // ── حواله‌های نمایشی همراه با سند و کمیشن ──
  const transfer = await insert('transfers', {
    transfer_number: 'TR-00001', direction: 'send', sender_name: 'محمد یوسف', sender_phone: '0700000003',
    receiver_name: 'عبدالله', receiver_phone: '0788000001', destination: 'هرات', origin: 'هرات',
    amount: 1500, currency: 'USD', status: 'done', fee: 15, fee_currency: 'USD', total: 1515,
    exchange_code: DEMO_EXCHANGE_CODE, customer_name: 'محمد یوسف',
  });
  await postDocument({
    doc_type: 'transfer', currency: 'USD', amount: 1500, description: 'حواله ارسالی TR-00001',
    related_type: 'customer', related_id: customers[2]?.id, related_name: 'محمد یوسف',
    transfer_id: transfer.id, exchange_code: DEMO_EXCHANGE_CODE, registered_by: 'مدیر صرافی نمایشی',
    lines: [
      { account_type: 'customer', account_id: String(customers[2]?.id), account_name: 'محمد یوسف', currency: 'USD', debit: 1500, credit: 0 },
      { account_type: 'suspense', account_id: String(transfer.id), account_name: 'حواله در جریان', currency: 'USD', debit: 0, credit: 1500 },
    ],
  });
  await postDocument({
    doc_type: 'transfer_fee', currency: 'USD', amount: 15, description: 'کمیشن حواله TR-00001',
    related_type: 'transfer', related_id: transfer.id, related_name: 'محمد یوسف',
    exchange_code: DEMO_EXCHANGE_CODE, registered_by: 'مدیر صرافی نمایشی',
    lines: [
      { account_type: 'customer', account_id: String(customers[2]?.id), account_name: 'محمد یوسف', currency: 'USD', debit: 15, credit: 0 },
      { ...revenueAccount, currency: 'USD', debit: 0, credit: 15 },
    ],
  });
  await insert('transfers', {
    transfer_number: 'TR-00002', direction: 'receive', sender_name: 'حواله‌خانهٔ نور', sender_phone: '0799000003',
    receiver_name: 'سید کریم', receiver_phone: '0700000006', destination: 'کابل', origin: 'قندهار',
    amount: 320000, currency: 'AFN', status: 'pending', fee: 0, fee_currency: 'AFN',
    exchange_code: DEMO_EXCHANGE_CODE, customer_name: 'سید کریم',
  });

  // ── معاملهٔ تبدیل ارز نمایشی ──
  const conversion = await insert('conversions', {
    exchange_code: DEMO_EXCHANGE_CODE, customer_name: 'مشتری نقدی',
    from_currency: 'USD', from_amount: 1000, rate: 69.5,
    to_currency: 'AFN', to_amount: 69500,
    kind: 'convert',
    cash_from: safes[1]?.name || '', cash_to: safes[0]?.name || '',
    description: 'تبدیل دالر به افغانی', registered_by: 'مدیر صرافی نمایشی',
  });
  await postDocument({
    doc_type: 'convert', currency: 'USD', amount: 1000,
    description: 'تبدیل ارز معاملهٔ نمایشی', related_type: 'conversion', related_id: conversion.id,
    exchange_code: DEMO_EXCHANGE_CODE, registered_by: 'مدیر صرافی نمایشی',
    lines: [
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: 'USD', debit: 1000, credit: 0 },
      { account_type: 'cash', account_id: String(safes[1]?.id), account_name: safes[1]?.name, currency: 'USD', debit: 0, credit: 1000 },
      { account_type: 'cash', account_id: String(safes[0]?.id), account_name: safes[0]?.name, currency: 'AFN', debit: 69500, credit: 0 },
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: 'AFN', debit: 0, credit: 69500 },
    ],
  });

  for (let i = 0; i < 3; i += 1) {
    await insert('support_tickets', {
      subject: ['مشکل در ثبت سند', 'درخواست افزایش حجم', 'سؤال دربارهٔ گزارش'][i],
      message: 'پیام نمایشی برای بررسی پشتیبانی.',
      status: i === 0 ? 'open' : 'closed',
      exchange_code: DEMO_EXCHANGE_CODE,
    });
  }

  await insert('online_products', { name: 'بستهٔ دالر', price: 100, currency: 'USD', active: true, exchange_code: DEMO_EXCHANGE_CODE });
  await insert('online_products', { name: 'بستهٔ اعتباری', price: 500, currency: 'AFN', active: true, exchange_code: DEMO_EXCHANGE_CODE });

  await insert('audit_logs', {
    action: 'settings', entity_type: 'app', description: 'بارگذاری دادهٔ ساختگی آزمایشی',
    actor_name: 'سیستم دمو', exchange_code: DEMO_EXCHANGE_CODE,
  });

  return { seeded: true, docs: docs.length + 3 };
}

// ── تکمیل حجم دادهٔ نمایشی: در هر ساختار عملیاتی ۱۰ رکورد تا همهٔ دکمه‌ها و ستون‌ها آزموده شوند ──
const EXTRA_CUSTOMERS = [
  { name: 'حکمت‌الله نظری', mobile: '0700000007', city: 'کابل' },
  { name: 'نجیب‌الله شریفی', mobile: '0700000008', city: 'هرات' },
  { name: 'شرکت بلخ تجارت', mobile: '0700000009', city: 'مزار' },
  { name: 'عزیز احمد رحیمی', mobile: '0700000010', city: 'قندهار' },
];

const EXTRA_BRANCHES = [
  { name: 'حواله‌خانهٔ مزار', city: 'مزار', phone: '0799000004' },
  { name: 'حواله‌خانهٔ کابل', city: 'کابل', phone: '0799000005' },
  { name: 'حواله‌خانهٔ جلال‌آباد', city: 'جلال‌آباد', phone: '0799000006' },
  { name: 'حواله‌خانهٔ کندز', city: 'کندز', phone: '0799000007' },
  { name: 'حواله‌خانهٔ بامیان', city: 'بامیان', phone: '0799000008' },
  { name: 'حواله‌خانهٔ غزنی', city: 'غزنی', phone: '0799000009' },
  { name: 'حواله‌خانهٔ هلمند', city: 'هلمند', phone: '0799000010' },
  { name: 'حواله‌خانهٔ تخار', city: 'تخار', phone: '0799000011' },
];

const EXTRA_SAFES = [
  { name: 'صندوق یورو', currency: 'EUR', opening_balance: 8000, display_order: 3 },
  { name: 'صندوق دالر دوم', currency: 'USD', opening_balance: 5000, display_order: 4 },
  { name: 'صندوق تومان', currency: 'IRR', opening_balance: 2000000, display_order: 5 },
  { name: 'صندوق کلدار', currency: 'PKR', opening_balance: 300000, display_order: 6 },
  { name: 'صندوق درهم', currency: 'AED', opening_balance: 12000, display_order: 7 },
  { name: 'صندوق لیر', currency: 'TRY', opening_balance: 20000, display_order: 8 },
  { name: 'صندوق پوند', currency: 'GBP', opening_balance: 3000, display_order: 9 },
  { name: 'صندوق ریال سعودی', currency: 'SAR', opening_balance: 9000, display_order: 10 },
];

const EXTRA_BANKS = [
  { bank_name: 'پشتنی بانک', account_number: '2001111', holder: 'حساب صراف نمایشی', currency: 'AFN', opening_balance: 420000, display_order: 3 },
  { bank_name: 'بکمال بانک', account_number: '3001222', holder: 'حساب صراف نمایشی', currency: 'USD', opening_balance: 6500, display_order: 4 },
  { bank_name: 'ایزی بانک', account_number: '4001333', holder: 'حساب صراف نمایشی', currency: 'AFN', opening_balance: 180000, display_order: 5 },
  { bank_name: 'فیصل بانک', account_number: '5001444', holder: 'حساب صراف نمایشی', currency: 'PKR', opening_balance: 250000, display_order: 6 },
  { bank_name: 'قندهار بانک', account_number: '6001555', holder: 'حساب صراف نمایشی', currency: 'AFN', opening_balance: 95000, display_order: 7 },
  { bank_name: 'هرات بانک', account_number: '7001666', holder: 'حساب صراف نمایشی', currency: 'USD', opening_balance: 3400, display_order: 8 },
  { bank_name: 'مزار بانک', account_number: '8001777', holder: 'حساب صراف نمایشی', currency: 'EUR', opening_balance: 2200, display_order: 9 },
  { bank_name: 'کابل بانک', account_number: '9001888', holder: 'حساب صراف نمایشی', currency: 'AFN', opening_balance: 310000, display_order: 10 },
];

const EXTRA_RATES = [
  { currency: 'TRY', symbol: '₺', buy_rate: 4.1, sell_rate: 4.35, decimals: 2, sort_order: 6, daily_rate: 4.2 },
  { currency: 'SAR', symbol: 'ر.س', buy_rate: 18.4, sell_rate: 18.7, decimals: 2, sort_order: 7, daily_rate: 18.55 },
  { currency: 'GBP', symbol: '£', buy_rate: 87.5, sell_rate: 88.4, decimals: 2, sort_order: 8, daily_rate: 88 },
  { currency: 'CNY', symbol: '¥', buy_rate: 9.6, sell_rate: 9.85, decimals: 2, sort_order: 9, daily_rate: 9.7 },
];

const EXTRA_AUDIT_LOGS = [
  { action: 'create', entity_type: 'customer', description: 'ثبت مشتری نمایشی', status: 'success' },
  { action: 'update', entity_type: 'document', description: 'ویرایش سند نمایشی', status: 'success' },
  { action: 'create', entity_type: 'transfer', description: 'ثبت حواله نمایشی', status: 'success' },
  { action: 'reverse', entity_type: 'document', description: 'ابطال سند نمایشی', status: 'success' },
  { action: 'login', entity_type: 'user', description: 'ورود مدیر صرافی', status: 'success' },
  { action: 'settings', entity_type: 'app', description: 'تغییر تنظیمات نمایشی', status: 'success' },
  { action: 'create', entity_type: 'safe', description: 'ثبت صندوق نمایشی', status: 'success' },
  { action: 'update', entity_type: 'bank_account', description: 'ویرایش حساب بانکی نمایشی', status: 'success' },
  { action: 'delete', entity_type: 'rate', description: 'حذف نرخ نمایشی', status: 'failed' },
];

const EXTRA_ERROR_REPORTS = [
  'خطای نمایشی در ثبت سند',
  'قطع موقتی اتصال در بارگذاری گزارش',
  'مقدار نامعتبر در فرم مشتری',
  'عدم تطابق ارز در ردیف سند',
  'خطای نمایشی محاسبه مانده صندوق',
  'درخواست ناموفق در ثبت حواله',
  'خطای نمایشی در چاپ گزارش',
  'مشکل نمایشی در ذخیره تنظیمات',
  'خطای نمایشی در بارگذاری دفتر کل',
  'مشکل نمایشی در ثبت مصرف',
];

const isoDay = offset => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
};

export async function ensureDemoTransactions(target = 10) {
  const exchange_code = DEMO_EXCHANGE_CODE;
  const tenant = async table => (await all(table)).filter(row => !row.exchange_code || row.exchange_code === exchange_code);

  let customers = await tenant('customers');
  for (const row of EXTRA_CUSTOMERS) {
    if (customers.length >= target) break;
    if (customers.some(item => item.mobile === row.mobile)) continue;
    await insert('customers', { ...row, customer_type: 'permanent', opening_balance: 0, exchange_code, is_demo: true, status: 'active', identity_status: 'verified' });
  }
  customers = await tenant('customers');

  const safes = await tenant('safes');
  const banks = await tenant('bank_accounts');
  const accounts = await tenant('chart_of_accounts');
  if (!safes.length) return { added: 0 };

  const cash = safes.find(item => item.currency === 'AFN') || safes[0];
  const bank = banks.find(item => item.currency === 'AFN') || banks[0];
  const chartId = code => String(accounts.find(item => item.account_code === code)?.id || '');
  const expenseAccount = { account_type: 'suspense', account_id: chartId('5010'), account_name: 'مصارف عملیاتی' };
  const revenueAccount = { account_type: 'suspense', account_id: chartId('4010'), account_name: 'درآمد کمیشن حواله' };
  const cashLine = (currency, debit, credit) => ({ account_type: 'cash', account_id: String(cash.id), account_name: cash.name, currency, debit, credit });
  const register = () => ({ exchange_code, registered_by: 'مدیر صرافی نمایشی', registered_by_user_id: 2 });

  const documents = await tenant('documents');
  const openSlots = type => Math.max(0, target - documents.filter(row => row.doc_type === type && !row.deleted).length);

  // مصارف
  for (let i = 0; i < openSlots('expense'); i += 1) {
    const amount = 2500 + i * 750;
    await postDocument({
      ...register(), doc_type: 'expense', currency: 'AFN', amount, description: `مصارف نمایشی شماره ${i + 2}`,
      date: isoDay(i), lines: [{ ...expenseAccount, currency: 'AFN', debit: amount, credit: 0 }, cashLine('AFN', 0, amount)],
    });
  }

  // سند روزنامچه
  for (let i = 0; i < openSlots('journal'); i += 1) {
    const amount = 1200 + i * 600;
    await postDocument({
      ...register(), doc_type: 'journal', currency: 'AFN', amount, description: `سند روزنامچه نمایشی شماره ${i + 2}`,
      date: isoDay(i + 1), lines: [{ ...expenseAccount, currency: 'AFN', debit: amount, credit: 0 }, cashLine('AFN', 0, amount)],
    });
  }

  // دخل و خرج صندوق
  for (let i = 0; i < openSlots('cash_in'); i += 1) {
    const amount = 1500 + i * 400;
    await postDocument({
      ...register(), doc_type: 'cash_in', currency: 'AFN', amount, description: `دخل صندوق نمایشی شماره ${i + 1}`,
      date: isoDay(i), lines: [cashLine('AFN', amount, 0), { ...revenueAccount, currency: 'AFN', debit: 0, credit: amount }],
    });
  }
  for (let i = 0; i < openSlots('cash_out'); i += 1) {
    const amount = 900 + i * 250;
    await postDocument({
      ...register(), doc_type: 'cash_out', currency: 'AFN', amount, description: `خرج صندوق نمایشی شماره ${i + 1}`,
      date: isoDay(i), lines: [{ ...expenseAccount, currency: 'AFN', debit: amount, credit: 0 }, cashLine('AFN', 0, amount)],
    });
  }

  // گردش بانک
  if (bank) {
    for (let i = 0; i < openSlots('deposit'); i += 1) {
      const amount = 50000 + i * 15000;
      await postDocument({
        ...register(), doc_type: 'deposit', currency: 'AFN', amount, description: `واریز نمایشی به ${bank.bank_name}`,
        date: isoDay(i), related_type: 'bank', related_id: bank.id, related_name: bank.bank_name,
        lines: [
          { account_type: 'bank', account_id: String(bank.id), account_name: bank.bank_name, currency: 'AFN', debit: amount, credit: 0 },
          cashLine('AFN', 0, amount),
        ],
      });
    }
  }

  // خرید و فروش اسعار
  for (let i = 0; i < openSlots('trade'); i += 1) {
    const customer = customers[i % Math.max(customers.length, 1)] || {};
    const amount = 500 + i * 100;
    await postDocument({
      ...register(), doc_type: 'trade', currency: 'USD', amount, description: `معامله نمایشی اسعار شماره ${i + 1}`,
      date: isoDay(i), related_type: 'customer', related_id: customer.id, related_name: customer.name,
      lines: [
        { account_type: 'cash', account_id: String(safes.find(item => item.currency === 'USD')?.id || cash.id), account_name: safes.find(item => item.currency === 'USD')?.name || cash.name, currency: 'USD', debit: amount, credit: 0 },
        { account_type: 'customer', account_id: String(customer.id || ''), account_name: customer.name || 'مشتری نمایشی', currency: 'USD', debit: 0, credit: amount },
      ],
    });
  }

  // حواله‌ها
  const transfers = await tenant('transfers');
  for (let i = transfers.length; i < target; i += 1) {
    const customer = customers[i % Math.max(customers.length, 1)] || {};
    const direction = i % 2 === 0 ? 'send' : 'receive';
    const amount = 800 + i * 150;
    const fee = direction === 'send' ? 10 + i : 0;
    const currency = i % 3 === 0 ? 'AFN' : 'USD';
    const transfer = await insert('transfers', {
      transfer_number: `TR-${String(i + 1).padStart(5, '0')}`,
      direction,
      sender_name: direction === 'send' ? (customer.name || 'فرستنده نمایشی') : 'حواله‌خانهٔ هرات',
      sender_phone: customer.mobile || '0700000000',
      receiver_name: direction === 'send' ? 'گیرنده نمایشی' : (customer.name || 'گیرنده نمایشی'),
      receiver_phone: '0788000000',
      destination: direction === 'send' ? 'هرات' : 'کابل',
      origin: direction === 'send' ? (customer.city || 'کابل') : 'هرات',
      amount, currency, status: ['done', 'pending', 'processing'][i % 3],
      fee, fee_currency: currency, total: amount + fee,
      customer_name: customer.name || 'مشتری نمایشی',
      created_at: `${isoDay(i)}T09:15:00.000Z`,
      exchange_code,
    });
    await postDocument({
      ...register(), doc_type: 'transfer', currency, amount, description: `حواله نمایشی ${transfer.transfer_number}`,
      date: isoDay(i), transfer_id: transfer.id, related_type: 'customer', related_id: customer.id || null, related_name: customer.name || '',
      lines: [
        { account_type: 'customer', account_id: String(customer.id || ''), account_name: customer.name || 'مشتری نمایشی', currency, debit: amount, credit: 0 },
        { account_type: 'suspense', account_id: String(transfer.id), account_name: 'حواله در جریان', currency, debit: 0, credit: amount },
      ],
    });
    if (fee > 0) {
      await postDocument({
        ...register(), doc_type: 'transfer_fee', currency, amount: fee, description: `کمیشن حواله ${transfer.transfer_number}`,
        date: isoDay(i), related_type: 'transfer', related_id: transfer.id, related_name: customer.name || '',
        lines: [
          { account_type: 'customer', account_id: String(customer.id || ''), account_name: customer.name || 'مشتری نمایشی', currency, debit: fee, credit: 0 },
          { ...revenueAccount, currency, debit: 0, credit: fee },
        ],
      });
    }
  }

  // معامله و تبدیل اسعار
  const conversions = await tenant('conversions');
  // دادهٔ نمایشی قدیمی: نوع معامله با جهت سند ثبت‌شده‌اش یکی نبود و همه به شکل تبدیل ثبت شده بودند؛
  // نوع با جهت واقعی سند هم‌سو می‌شود تا دفتر کل، موجودی صندوق و گزارش سود یک جهت نشان دهند.
  for (const row of conversions) {
    if (!String(row.description || '').startsWith('معامله نمایشی اسعار')) continue;
    if (row.kind === 'convert') continue;
    await update('conversions', row.id, { kind: 'convert' });
  }
  for (let i = conversions.length; i < target; i += 1) {
    const rate = 69.5;
    const fromAmount = 200 + i * 50;
    const kind = ['convert', 'buy', 'sell'][i % 3];
    const customer = customers[i % Math.max(customers.length, 1)] || null;
    const usdSafe = safes.find(item => item.currency === 'USD') || cash;
    const baseAmount = fromAmount * rate;
    const conversion = await insert('conversions', {
      exchange_code, customer_name: customer?.name || 'مشتری نقدی',
      kind, from_currency: 'USD', from_amount: fromAmount, rate,
      to_currency: 'AFN', to_amount: baseAmount,
      cash_from: usdSafe.name, cash_to: cash.name,
      description: `معامله نمایشی اسعار شماره ${i + 1}`, registered_by: 'مدیر صرافی نمایشی',
      created_at: `${isoDay(i)}T10:30:00.000Z`,
    });
    const usdCashLine = (debit, credit) => ({
      account_type: 'cash', account_id: String(usdSafe.id), account_name: usdSafe.name,
      currency: 'USD', debit, credit,
    });
    const customerLine = (currency, debit, credit) => ({
      account_type: 'customer', account_id: String(customer?.id || ''),
      account_name: customer?.name || 'مشتری نمایشی', currency, debit, credit,
    });
    const suspenseLine = (currency, debit, credit) => ({
      account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز',
      currency, debit, credit,
    });
    await postDocument({
      ...register(), doc_type: kind === 'convert' ? 'convert' : 'exchange', currency: 'USD', amount: fromAmount,
      description: `${kind === 'buy' ? 'خرید' : kind === 'sell' ? 'فروش' : 'تبدیل'} ارز معاملهٔ نمایشی شماره ${i + 1}`, date: isoDay(i),
      related_type: 'conversion', related_id: conversion.id,
      related_name: customer?.name || '',
      // جهت سند همان جهت معامله است:
      // خرید: صندوق دالر بدهکار و صندوق افغانی بستانکار — فروش: برعکس — تبدیل: از حساب واسط.
      lines: kind === 'buy'
        ? [usdCashLine(fromAmount, 0), customerLine('USD', 0, fromAmount), customerLine('AFN', baseAmount, 0), cashLine('AFN', 0, baseAmount)]
        : kind === 'sell'
          ? [usdCashLine(0, fromAmount), customerLine('USD', fromAmount, 0), customerLine('AFN', 0, baseAmount), cashLine('AFN', baseAmount, 0)]
          : [suspenseLine('USD', fromAmount, 0), usdCashLine(0, fromAmount), cashLine('AFN', baseAmount, 0), suspenseLine('AFN', 0, baseAmount)],
    });
  }

  // ── تراکنش واقعی برای هر مشتری نمونه: دفتر حساب هیچ مشتری خالی و صفر نماند ──
  const customerWithLines = new Set(
    (await tenant('ledger_entries'))
      .filter(line => line.account_type === 'customer')
      .map(line => String(line.account_id))
  );
  const usdSafe = safes.find(item => item.currency === 'USD') || cash;
  let customerDocs = 0;
  for (const customer of customers.slice(0, target)) {
    if (!customer.id || customerWithLines.has(String(customer.id))) continue;
    const amount = 400 + customerDocs * 250;
    await postDocument({
      ...register(), doc_type: 'trade', currency: 'USD', amount,
      description: `معامله نمایشی اسعار برای ${customer.name}`,
      date: isoDay(customerDocs % 7),
      related_type: 'customer', related_id: customer.id, related_name: customer.name,
      lines: [
        { account_type: 'cash', account_id: String(usdSafe.id), account_name: usdSafe.name, currency: 'USD', debit: amount, credit: 0 },
        { account_type: 'customer', account_id: String(customer.id), account_name: customer.name, currency: 'USD', debit: 0, credit: amount },
      ],
    });
    customerDocs += 1;
  }

  // ── تکمیل تعاریف پایه تا ۱۰ رکورد در هر بخش ──
  const topUp = async (table, rows, keyField, make) => {
    for (const row of rows) {
      const current = await tenant(table);
      if (current.length >= target) break;
      if (current.some(item => String(item[keyField]) === String(row[keyField]))) continue;
      await insert(table, make(row));
    }
  };

  await topUp('origins', EXTRA_BRANCHES, 'name', row => ({ ...row, type: 'agent', is_active: true, exchange_code }));
  await topUp('safes', EXTRA_SAFES, 'name', row => ({ ...row, active: true, opening_value: row.opening_balance, exchange_code }));
  await topUp('bank_accounts', EXTRA_BANKS, 'account_number', row => ({ ...row, active: true, balance: row.opening_balance, exchange_code }));
  await topUp('rates', EXTRA_RATES, 'currency', row => ({ ...row, type: 'fiat', is_active: true, show_to_customer: true, rate_date: isoDay(0), exchange_code }));
  await topUp('audit_logs', EXTRA_AUDIT_LOGS, 'description', row => ({ ...row, actor_name: 'مدیر صرافی نمایشی', exchange_code }));
  await topUp('error_reports', EXTRA_ERROR_REPORTS.map(message => ({ error_message: message })), 'error_message', row => ({ ...row, error_type: 'runtime', device: 'نمایشی', app_version: 'v21', status: 'new', exchange_code }));

  return { added: true, target };
}