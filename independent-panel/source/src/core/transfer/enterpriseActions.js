// src/core/transfer/enterpriseActions.js — عملکرد و مدل نمایش هر ماژول سازمانی
// قاعده: ماژول تا وقتی داده/قاعده/هویت لازم را ندارد، هیچ عددی نمی‌سازد و همان نیاز را گزارش می‌کند.
// فقط دو ماژول امروز می‌توانند از دادهٔ آزمون‌شدهٔ همین محیط ردیف بسازند: ردپای حسابرسی و نقدینگی خزانه.
import { ENTERPRISE_MODULES, enterpriseModuleByKey } from './enterpriseModules';

export const ACTION_MODES = {
  derived: 'از دادهٔ آزمون‌شدهٔ همین محیط',
  rule: 'نیازمند قاعدهٔ تأییدشده',
  backend: 'نیازمند جدول و دادهٔ واقعی',
  identity: 'نیازمند هویت و نشست واقعی',
};

export const ENTERPRISE_ROUTE_PATTERN = '/enterprise/:moduleKey';
export const enterpriseRoute = (key) => '/enterprise/' + key;

// بخش مجوز هر ماژول؛ همه از بخش‌های موجود رجیستری ۲۵ بخش انتخاب شده‌اند
const SECTION_BY_KEY = {
  subsidiary_ledger: 'general_ledger',
  trial_balance: 'reports',
  cash_flow: 'reports',
  cost_centers: 'reports',
  fiscal_periods: 'settings',
  period_close: 'settings',
  fixed_assets: 'chart_of_accounts',
  accounts_receivable: 'accounts_receivable',
  accounts_payable: 'accounts_receivable',
  budgets: 'reports',
  treasury: 'cash',
  intercompany: 'transfers',
  multi_company: 'settings',
  kyc: 'customers',
  compliance: 'settings',
  audit_log: 'audit_log',
  document_center: 'reports',
  approvals: 'journal',
  fx_exposure: 'trade',
  tax: 'reports',
  standards: 'settings',
  aml_screening: 'settings',
  fx_revaluation: 'currencies',
  consolidation: 'reports',
  internal_controls: 'settings',
  data_governance: 'settings',
};

// موجودی نقدینگی از سطرهای صندوق و بانک، با همان قاعدهٔ آزمون‌شدهٔ دفتر
export function liquidityFromLines(lines = [], data = {}) {
  return [...(data.cash || []), ...(data.banks || [])].map((account) => {
    const rows = lines.filter(
      (line) => String(line.accountId) === String(account.id)
        && ['cash', 'bank'].includes(String(line.accountType)),
    );
    const balance = rows.reduce((total, line) => total + Number(line.debit || 0) - Number(line.credit || 0), 0);
    return {
      id: account.id,
      name: account.name,
      currency: account.currency || 'AFN',
      balance: Math.round(balance * 100) / 100,
    };
  });
}

const auditRows = (context = {}) => (context.activity || []).slice(0, 50).map((row) => ({
  action: row.action || '',
  entity: row.entity || row.target_name || '',
  actor: row.user_name || row.actor_name || '',
  date: row.date || row.created_at || '',
  description: row.description || '',
}));

const ENTERPRISE_ACTIONS = {
  subsidiary_ledger: { mode: 'rule' },
  trial_balance: { mode: 'rule', contract: 'trial_balance' },
  cash_flow: { mode: 'rule' },
  cost_centers: { mode: 'backend' },
  fiscal_periods: { mode: 'backend' },
  period_close: { mode: 'rule' },
  fixed_assets: { mode: 'rule' },
  accounts_receivable: { mode: 'rule' },
  accounts_payable: { mode: 'rule' },
  budgets: { mode: 'rule' },
  treasury: { mode: 'derived', compute: (context) => liquidityFromLines(context.lines || [], context.data || {}) },
  intercompany: { mode: 'backend' },
  multi_company: { mode: 'identity' },
  kyc: { mode: 'backend' },
  compliance: { mode: 'rule' },
  audit_log: { mode: 'derived', compute: auditRows },
  document_center: { mode: 'backend' },
  approvals: { mode: 'identity' },
  fx_exposure: { mode: 'rule' },
  tax: { mode: 'rule' },
  standards: { mode: 'rule' },
  aml_screening: { mode: 'rule' },
  fx_revaluation: { mode: 'rule' },
  consolidation: { mode: 'rule' },
  internal_controls: { mode: 'identity' },
  data_governance: { mode: 'identity' },
};

export const actionOf = (key) => ENTERPRISE_ACTIONS[key] || null;
export const sectionFor = (key) => SECTION_BY_KEY[key] || 'settings';

// ارزیابی ماژول: یا ردیف واقعی از منبع آزمون‌شده، یا گزارش صریح نیازها — هرگز عدد حدسی
export function evaluateEnterpriseModule(key, context = {}) {
  const module = enterpriseModuleByKey(key);
  const action = ENTERPRISE_ACTIONS[key];
  if (!module || !action) {
    return { status: 'blocked', mode: 'none', rows: [], missing: ['تعریف عملکرد برای این ماژول ثبت نشده است.'] };
  }
  if (action.mode === 'derived') {
    let rows = [];
    try { rows = action.compute(context || {}) || []; } catch { rows = []; }
    if (!rows.length) return { status: 'blocked', mode: 'derived', rows: [], missing: module.dependsOn };
    return { status: 'ready', mode: 'derived', rows, missing: [] };
  }
  return {
    status: 'blocked',
    mode: action.mode,
    rows: [],
    missing: module.dependsOn,
    contract: action.contract || null,
  };
}

export function enterprisePageModel(key) {
  const module = enterpriseModuleByKey(key);
  if (!module) return null;
  return {
    key: module.key,
    title: module.title,
    description: module.description,
    capabilities: [...module.capabilities],
    dependencies: [...module.dependsOn],
    section: sectionFor(key),
    route: enterpriseRoute(key),
    actionMode: ENTERPRISE_ACTIONS[key]?.mode || 'none',
  };
}

export const enterpriseModuleKeys = () => ENTERPRISE_MODULES.map((module) => module.key);
export const definedActionCount = () => Object.keys(ENTERPRISE_ACTIONS).length;