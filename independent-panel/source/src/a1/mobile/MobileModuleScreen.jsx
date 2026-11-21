// a1/mobile/MobileModuleScreen.jsx — صفحهٔ هر بخش: فهرست، جستجو، گزارش، چاپ، CSV و عملیات
// ابطال اسناد مالی با سند معکوس انجام می‌شود؛ سطرهای دفتر کل فقط از سند اصلی ویرایش می‌شوند.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, Plus, Pencil, Printer, Download, RotateCcw, Ban, FileText } from 'lucide-react';
import { moduleById } from '@/a1/mobile/mobileModules';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { CURRENCIES, fmt, currencyLabel, cashBalance, accountTypeLabel } from '@/a1/mobile/demoData';
import { ledgerWithOpenings } from '@/core/domain/balances';
import MobileExtras from '@/a1/mobile/MobileExtras';
import MobileReversalSheet from '@/a1/mobile/MobileReversalSheet';
import MobileRecordSheet from '@/a1/mobile/MobileRecordSheet';
import MobilePartyStatement from '@/a1/mobile/MobilePartyStatement';
import { statementBack } from '@/a1/mobile/statementBack';
import PanelAuditPanel from '@/components/audit/PanelAuditPanel';
// همان نوار یکپارچهٔ لپ‌تاپ: شاخص‌ها و محتوای مرتبط هر بخش، در همان صفحه
import SectionPage from '@/components/sections/SectionPage';
import TradeProfitSection from '@/components/sections/TradeProfitSection';
import BalanceSheetPanel from '@/components/sections/BalanceSheetPanel';
import { buildSectionPage } from '@/core/sections/sectionPage';
import { columnsFor, downloadCsv, findSourceDocument } from '@/a1/mobile/mobileExport';
import { isLocked, isReversed, isCounterDocument } from '@/core/domain/reversal';
import { cashFlowDraft } from '@/core/domain/posting';
import { customerStatement, branchStatement } from '@/core/domain/statement';
import { displayDate } from '@/core/domain/dates';
import { lineAccountLink, documentAccountLinks, ACCOUNT_KIND_LABELS, ACCOUNT_KIND_MODULES } from '@/core/navigation/chain';

const badgeTone = (status) => {
  if (!status) return '';
  if (['فعال', 'قطعی', 'موفق', 'بررسی‌شده', 'اجرا شده', 'بستانکار'].includes(status)) return ' a1m-badge--green';
  if (['غیرفعال', 'قفل'].includes(status)) return '';
  if (['ابطال شده', 'باز', 'بدهکار'].includes(status)) return ' a1m-badge--red';
  if (['موقت', 'در انتظار', 'سند معکوس'].includes(status)) return ' a1m-badge--gold';
  return ' a1m-badge--blue';
};

function balancesText(list) {
  if (!list.length) return '۰';
  return list.map((row) => fmt(Math.abs(row.net)) + ' ' + currencyLabel(row.currency)).join(' / ');
}

// آخرین تاریخ گردش همان حساب: سطرهای دفتر حساب از جدید به قدیم مرتب‌اند
function lastActivityDate(statement) {
  return displayDate(statement?.rows?.[0]?.date) || '—';
}

function describeRow(moduleId, row, data) {
  switch (moduleId) {
    case 'customers': {
      // بدهکار یا بستانکار بودن مشتری و مبلغ آن از همان دفتر حساب او خوانده می‌شود
      const statement = customerStatement(data, row);
      const primary = statement.totals.find((item) => item.currency === (row.currency || 'AFN')) || statement.totals[0];
      const opening = Number(row.opening) || 0;
      const state = primary?.status || (opening > 0 ? 'بدهکار' : opening < 0 ? 'بستانکار' : 'تسویه');
      const balanceText = statement.totals.length
        ? balancesText(statement.totals.map((item) => ({ currency: item.currency, net: item.balance })))
        : opening ? fmt(Math.abs(opening)) + ' ' + currencyLabel(row.currency) : '۰';
      return {
        title: row.name, sub: row.code || 'بدون کد', badge: state,
        pairs: [
          ['نوع', row.kind], ['تماس', row.phone || '—'], ['ارز', [...new Set(statement.totals.map((item) => item.currency))].map(currencyLabel).join(' / ') || currencyLabel(row.currency)],
          ['مانده', balanceText], ['وضعیت مشتری', row.status],
          ['آخرین گردش', lastActivityDate(statement)], ['افتتاحیه', fmt(row.opening)],
        ],
      };
    }
    case 'customerLedger': {
      // مانده از همان تجمیع گردش کامل مشتری خوانده می‌شود تا فهرست و جزئیات یک عدد بدهند
      const { totals } = customerStatement(data, row);
      const primary = totals.find((item) => item.currency === (row.currency || 'AFN')) || totals[0];
      return {
        title: row.name, sub: row.code || 'بدون کد', badge: primary?.status || 'تسویه',
        pairs: [['مانده', balancesText(totals.map((item) => ({ currency: item.currency, net: item.balance })))], ['تماس', row.phone || '—'], ['ارز اصلی', currencyLabel(row.currency)]],
      };
    }
    case 'debtors': {
      const { totals } = customerStatement(data, row);
      const primary = totals.find((item) => item.currency === (row.currency || 'AFN')) || totals[0];
      return {
        title: row.name, sub: row.code || 'بدون کد', badge: primary?.status || 'تسویه',
        pairs: [['مانده', balancesText(totals.map((item) => ({ currency: item.currency, net: item.balance })))], ['وضعیت', row.status]],
      };
    }
    case 'branches':
      return {
        title: row.name, sub: row.code || 'بدون کد', badge: row.status,
        pairs: [['موقعیت', row.city || '—'], ['تماس', row.phone || '—'], ['آخرین گردش', lastActivityDate(branchStatement(data, row))]],
      };
    case 'branchLedger': {
      // ماندهٔ نمایشی از همان تجمیع گردش کامل نمایندگی خوانده می‌شود
      const { totals } = branchStatement(data, row);
      const primary = totals.find((item) => item.currency === (row.currency || 'AFN')) || totals[0];
      return {
        title: row.name, sub: row.code || 'بدون کد', badge: row.status,
        pairs: [['موقعیت', row.city || '—'], ['مانده', balancesText(totals.map((item) => ({ currency: item.currency, net: item.balance })))], ['وضعیت حساب', primary?.status || 'تسویه']],
      };
    }
    case 'cash':
      return {
        title: row.name, sub: currencyLabel(row.currency), badge: row.status,
        pairs: [['مانده افتتاحیه', fmt(row.opening)], ['موجودی نمایشی', fmt(cashBalance(data, row))]],
      };
    case 'banks':
      return {
        title: row.name, sub: row.account || 'بدون شماره', badge: row.status,
        pairs: [['ارز', currencyLabel(row.currency)], ['مانده افتتاحیه', fmt(row.opening)], ['توضیح', row.description || '—']],
      };
    case 'currencies':
      return {
        title: row.name, sub: row.code + ' · ' + (row.symbol || ''), badge: row.active,
        pairs: [['نرخ مقابل ارز پایه', fmt(row.rate)]],
      };
    case 'accounts':
      return {
        title: row.name, sub: row.code, badge: row.status,
        pairs: [['نوع حساب', accountTypeLabel(row.accountType)], ['ماهیت', row.nature], ['حساب مادر', row.parentId || '—'], ['ارز', row.currency ? currencyLabel(row.currency) : 'بدون ارز']],
      };
    case 'expenses':
      return {
        title: row.title, sub: displayDate(row.date), badge: row.status || 'نمایشی',
        pairs: [['حساب مصرف', row.expenseAccount || '—'], ['پرداخت', row.payerType === 'bank' ? row.bank : row.cash], ['مبلغ', fmt(row.amount) + ' ' + currencyLabel(row.currency)]],
      };
    case 'remittance':
      return {
        title: 'حواله ' + (row.number || '—'), sub: [displayDate(row.date), row.direction].filter(Boolean).join(' · '), badge: row.settlement === 'instant' ? 'تسویهٔ فوری' : 'واسط',
        pairs: [['فرستنده', row.sender], ['گیرنده', row.receiver], ['مبلغ', fmt(row.amount) + ' ' + currencyLabel(row.currency)], ['کمیشن', fmt(row.fee)]],
      };
    case 'exchange':
      return {
        title: row.kind + (row.party ? ' · ' + row.party : ''), sub: displayDate(row.date),
        pairs: [['از', fmt(row.foreignAmount) + ' ' + currencyLabel(row.foreignCurrency)], ['به', fmt(row.baseAmount) + ' ' + currencyLabel(row.baseCurrency)], ['صندوق‌ها', (row.foreignCash || '—') + ' / ' + (row.baseCash || '—')], ['کمیشن', fmt(row.fee)]],
      };
    case 'journal':
      return {
        title: row.description || 'سند روزنامچه', sub: [row.number, displayDate(row.date)].filter(Boolean).join(' · '), badge: row.status,
        pairs: [['ارز', currencyLabel(row.currency)], ['بدهکار', fmt(row.debitTotal)], ['بستانکار', fmt(row.creditTotal)]],
      };
    case 'ledger':
      return {
        title: row.account, sub: [displayDate(row.date), row.number].filter(Boolean).join(' · '), badge: row.description ? 'سطر دفتر' : '',
        pairs: [['شرح', row.description || '—'], ['بدهکار', fmt(row.debit)], ['بستانکار', fmt(row.credit)], ['ارز', currencyLabel(row.currency)]],
      };
    case 'reports':
      return {
        title: row.type + (row.party ? ' · ' + row.party : ''), sub: [displayDate(row.date), row.number].filter(Boolean).join(' · '),
        pairs: [['شرح', row.description || '—'], ['بدهکار', fmt(row.debit)], ['بستانکار', fmt(row.credit)], ['ارز', currencyLabel(row.currency)]],
      };
    case 'activity':
      return {
        title: row.entity, sub: displayDate(row.date), badge: row.status,
        pairs: [['عملیات', row.action], ['شرح', row.description]],
      };
    case 'errors':
      return {
        title: row.error_type, sub: displayDate(row.date), badge: row.status,
        pairs: [['شرح خطا', row.error_message], ['دستگاه', row.device], ['نسخه', row.app_version]],
      };
    default:
      return { title: row.name || row.title || 'ردیف', sub: displayDate(row.date), pairs: [] };
  }
}

export default function MobileModuleScreen({ moduleId, onBack, onOpenForm, notify, canCreate, canEdit, canDelete }) {
  const demo = useMobileDemo();
  const data = demo.data;
  const module = moduleById(moduleId);
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState('همه');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [openRowId, setOpenRowId] = useState(null);
  const [reversal, setReversal] = useState(null);
  const [reversing, setReversing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  // پشتهٔ گام‌های ناوبری: هر گام یک حساب باز است (مشتری، نمایندگی، صندوق، بانک)
  // با این پشته از هر حساب به حسابِ طرف مقابل همان سند می‌رسیم و بازگشت، یک گام عقب می‌رود.
  const [accountPath, setAccountPath] = useState([]);
  // فیلترهای هر گام جدا نگه داشته می‌شوند تا با برگشت، همان جستجو و بازهٔ قبلی برگردد
  const [filtersByStep, setFiltersByStep] = useState({});

  // با تغییر بخش، گام‌های بازِ بخش قبلی پاک می‌شوند تا مقصد و رکورد جابه‌جا نشوند
  useEffect(() => {
    setSelectedId(null);
    setOpenRowId(null);
    setAccountPath([]);
    setFiltersByStep({});
  }, [moduleId]);

  // مدل یکپارچهٔ همین بخش — دقیقاً همان مدل لپ‌تاپ، روی دادهٔ همین درگاه
  const sectionModel = useMemo(
    () => buildSectionPage(moduleId, data, { fmt, currencyLabel }),
    [moduleId, data],
  );

  const source = useMemo(() => {
    if (moduleId === 'customerLedger' || moduleId === 'debtors') return data.customers || [];
    if (moduleId === 'branchLedger') return data.branches || [];
    // دفتر کل با ماندهٔ افتتاحیهٔ صندوق‌ها و بانک‌ها کامل می‌شود؛ همان منبع مشترک لپ‌تاپ
    if (moduleId === 'ledger') return ledgerWithOpenings(data);
    return data[moduleId] || [];
  }, [moduleId, data]);

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return source.filter((row) => {
      const haystack = Object.values(row).join(' ').toLowerCase();
      if (text && !haystack.includes(text)) return false;
      if (currency !== 'همه' && row.currency && row.currency !== currency) return false;
      if (dateFrom && row.date && row.date < dateFrom) return false;
      if (dateTo && row.date && row.date > dateTo) return false;
      return true;
    });
  }, [source, query, currency, dateFrom, dateTo]);

  const openRow = rows.find((row) => row.id === openRowId) || null;
  const isMaster = module.kind === 'master';
  const isPosting = module.kind === 'posting';
  const isLedgerView = moduleId === 'ledger' || moduleId === 'reports';
  const isList = isMaster || isPosting || isLedgerView || module.kind === 'ledger' || module.kind === 'debtors' || module.kind === 'activity' || module.kind === 'errors';
  const Icon = module.icon;

  const header = (
    <header className="a1m-screen__head">
      <button type="button" className="a1m-back" onClick={onBack} aria-label="بازگشت">
        <ArrowRight className="h-4 w-4" />
      </button>
      <span className="a1m-screen__icon"><Icon className="h-4 w-4" /></span>
      <div className="a1m-screen__titles">
        <div className="a1m-screen__title">
          {module.label}
        </div>
        <div className="a1m-screen__sub">دموی محلی — داده‌های موقت</div>
      </div>
    </header>
  );

  const deactivateRecord = async (row) => {
    if (!row || deactivating) return;
    setDeactivating(true);
    try {
      await demo.deactivate(moduleId, row.id);
      notify('رکورد غیرفعال شد؛ اطلاعات، سوابق و مانده‌های قبلی آن حفظ شد.', 'success');
      setSelectedId(null);
      setOpenRowId(null);
    } catch (error) {
      notify(error?.message || 'غیرفعال‌سازی انجام نشد.', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const openReversal = (row) => {
    if (!row) return;
    if (row.opening) {
      notify('ماندهٔ افتتاحیه سند نیست و قابل ابطال نیست.', 'error');
      return;
    }
    setOpenRowId(null);
    setReversal({
      row,
      title: moduleId === 'journal' ? 'سند روزنامچه' : (row.number || row.title || module.label),
      detail: [row.number, displayDate(row.date), row.amount ? fmt(row.amount) + ' ' + currencyLabel(row.currency) : '']
        .filter(Boolean)
        .join(' · '),
    });
  };

  const confirmReversal = async (reason) => {
    if (!reversal || reversing) return;
    setReversing(true);
    try {
      const result = await demo.reverse(moduleId, reversal.row.id, reason);
      notify('سند اصلی ابطال شد و سند معکوس ' + (result?.counter?.number || '') + ' ثبت شد؛ دفتر کل و گزارش به‌روز شد.', 'success');
      setReversal(null);
      setSelectedId(null);
    } catch (error) {
      notify(error?.message || 'ابطال انجام نشد.', 'error');
    } finally {
      setReversing(false);
    }
  };

  const openSourceDocument = (row) => {
    if (!row) return;
    // ماندهٔ افتتاحیه سند نیست؛ فقط از تعریف صندوق/بانک تغییر می‌کند.
    if (row.opening) {
      notify('ماندهٔ افتتاحیه سند نیست؛ برای تغییر آن، تعریف حساب را ویرایش کنید.', 'error');
      return;
    }
    const found = findSourceDocument(data, row);
    if (!found) {
      notify('سند اصلی این سطر پیدا نشد؛ سطر دفتر کل فقط از سند اصلی قابل ویرایش است.', 'error');
      return;
    }
    if (isCounterDocument(found.record)) {
      notify('این سطر مربوط به سند معکوس است و خودش سند مستقل قابل ویرایش نیست.', 'error');
      return;
    }
    if (isLocked(found.record)) {
      notify('سند اصلی ابطال شده است و قابل ویرایش نیست.', 'error');
      return;
    }
    // گردش صندوق با فرم خودش (مبلغ مثبت + نوع دخل/خرج) باز می‌شود، نه سطر خام تراکنش
    setOpenRowId(null);
    if (found.moduleId === 'transactions') {
      onOpenForm('cashFlow', {}, cashFlowDraft(found.record));
      return;
    }
    onOpenForm(found.moduleId, {}, found.record);
  };

  const exportCsv = () => {
    if (!columnsFor(moduleId)) { notify('خروجی CSV برای این بخش تعریف نشده است.', 'error'); return; }
    const ok = downloadCsv(moduleId, module.label, rows);
    notify(ok ? 'فایل CSV با ' + fmt(rows.length) + ' ردیف آماده شد.' : 'خروجی CSV خالی است.', ok ? 'success' : 'error');
  };

  const printColumns = columnsFor(moduleId);

  // سوابق فعالیت و گزارش خطاها فهرست فقط‌خواندنی‌اند: پنجرهٔ جزئیات باز می‌شود ولی دکمهٔ عملیات ندارد
  const isLogList = moduleId === 'activity' || moduleId === 'errors';
  // پنجرهٔ درونی رکورد: بخش‌های دارای عملیات، دفاتر و فهرست‌های فقط‌خواندنی
  const canOpenRecord = isMaster || isPosting || isLedgerView || isLogList;
  const openInfo = openRow ? describeRow(moduleId, openRow, data) : null;
  const openBadge = openRow
    ? (isReversed(openRow) ? 'ابطال شده' : isCounterDocument(openRow) ? 'سند معکوس' : openInfo.badge)
    : '';

  // گام جاریِ ناوبری: اگر حسابی باز شده باشد، گردش همان حساب نمایش داده می‌شود
  const accountStep = accountPath[accountPath.length - 1] || null;
  const statementTarget = accountStep?.record || null;
  const openAccount = (kind, record) => {
    if (!kind || !record) return;
    setSelectedId(null);
    setOpenRowId(null);
    setAccountPath((path) => [...path, { kind, record, key: kind + '::' + String(record.id) + '::' + (path.length + 1) }]);
  };
  const closeAccount = () => setAccountPath((path) => path.slice(0, -1));
  const statementKind = accountStep?.kind || 'customer';
  const isBranchStatement = statementKind === 'branch';
  const isCustomerStatement = statementKind === 'customer';
  const isBankStatement = statementKind === 'bank';
  const isCashStatement = statementKind === 'cash';
  const statementModule = ACCOUNT_KIND_MODULES[statementKind] || 'customers';
  const stepKey = accountStep?.key || '';
  const stepFilters = filtersByStep[stepKey];
  const setStepFilters = (next) => setFiltersByStep((current) => ({ ...current, [stepKey]: next }));
  const deactivateStatement = async () => {
    if (!statementTarget) return;
    try {
      await demo.deactivate(statementModule, statementTarget.id);
      notify('حساب غیرفعال شد؛ اطلاعات و سوابق آن حفظ شد.', 'success');
      closeAccount();
      setSelectedId(null);
    } catch (error) {
      notify(error?.message || 'غیرفعال‌سازی انجام نشد.', 'error');
    }
  };

  // حساب‌های مرتبط یک ردیف: حساب خودِ سطر و حساب طرف مقابل همان سند
  const rowAccountLinks = (row) => {
    if (!row) return [];
    const ownLink = lineAccountLink(data, row);
    // حساب کدینگ صفحهٔ گردش مستقل در پوستهٔ موبایل ندارد؛ پیوندش در این پوسته نمایش داده نمی‌شود.
    const own = ownLink && ownLink.kind !== 'chart' ? ownLink : null;
    const others = documentAccountLinks(data, row.documentId)
      .filter((item) => item.kind !== 'chart')
      .filter((item) => !own || item.kind !== own.kind || String(item.record.id) !== String(own.record.id));
    const links = [];
    if (own) {
      links.push({
        key: 'own',
        label: (ACCOUNT_KIND_LABELS[own.kind] || 'حساب') + ' · ' + own.label,
        meta: 'گردش حساب',
        onClick: () => openAccount(own.kind, own.record),
      });
    }
    others.slice(0, 3).forEach((item) => {
      links.push({
        key: item.kind + '::' + item.record.id,
        label: (ACCOUNT_KIND_LABELS[item.kind] || 'حساب') + ' · ' + item.label,
        meta: 'طرف مقابل',
        onClick: () => openAccount(item.kind, item.record),
      });
    });
    return links;
  };

  if (statementTarget) {
    return (
      <MobilePartyStatement
        key={stepKey}
        party={statementTarget}
        kind={statementKind}
        filters={stepFilters}
        onFiltersChange={setStepFilters}
        backLabel={accountPath.length > 1 ? 'بازگشت به حساب قبلی' : statementBack(moduleId).label}
        onOpenAccount={openAccount}
        canEdit={canEdit}
        onEditAccount={!canEdit ? undefined
          : (isBankStatement || isCashStatement) ? () => onOpenForm(statementModule, {}, statementTarget)
            : () => onOpenForm(isBranchStatement ? 'branches' : 'customers', {}, statementTarget)}
        onDeactivate={canDelete ? deactivateStatement : undefined}
        onNewEntry={!canCreate ? undefined
          : isBankStatement ? () => onOpenForm('journal', {
            currency: statementTarget.currency || 'AFN',
            rows: [
              { account: 'بانک: ' + statementTarget.name, debit: '', credit: '' },
              { account: '', debit: '', credit: '' },
            ],
          })
            : isCashStatement ? () => onOpenForm('cashFlow', { kind: 'دخل', cash: statementTarget.name, currency: statementTarget.currency || 'AFN' })
              // مشتری و نمایندگی: ثبت دریافت/پرداخت با طرف حساب همان صفحه پیش‌پر می‌شود
              : () => onOpenForm('cashFlow', {
                kind: 'دخل',
                party: statementTarget.name,
                partyType: isBranchStatement ? 'branch' : 'customer',
                currency: statementTarget.currency || 'AFN',
              })}
        onBack={closeAccount}
        onOpenSource={(targetModule, record) => {
          if (targetModule === 'transactions') { onOpenForm('cashFlow', {}, cashFlowDraft(record)); return; }
          onOpenForm(targetModule, {}, record);
        }}
      />
    );
  }

  return (
    <div className="a1m-screen">
      {header}

      {moduleId === 'profit'
        ? <TradeProfitSection data={data} fmt={fmt} currencyLabel={currencyLabel} />
        : <SectionPage model={sectionModel} icon={module.icon} />}

      {module.kind === 'linked' ? <MobileExtras moduleId={moduleId} /> : null}

      {moduleId === 'errors' ? <PanelAuditPanel /> : null}

      {module.kind === 'rates' ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="a1m-group" style={{ marginBottom: 0 }}>
            <h3 className="a1m-group__title"><span className="a1m-group__dot" />نرخ نمایشی ارزها</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {(data.rates || []).map((row) => (
                <div key={row.id} className="a1m-card">
                  <div className="a1m-card__top">
                    <div>
                      <b className="a1m-card__title">{row.name}</b>
                      <div className="a1m-card__sub">{row.code}</div>
                    </div>
                    <div style={{ display: 'grid', gap: 3, textAlign: 'left' }}>
                      <span className="a1m-amount a1m-amount--credit">خرید {fmt(row.buy)}</span>
                      <span className="a1m-amount a1m-amount--debit">فروش {fmt(row.sell)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="a1m-note">نرخ روز در این نسخه از هیچ سرویس بیرونی خوانده نمی‌شود و نرخ‌های بالا ساختگی‌اند؛ نمایش آن‌ها معامله یا سند ایجاد نمی‌کند.</p>
        </div>
      ) : null}

      {module.kind === 'profit' ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="a1m-group" style={{ marginBottom: 0 }}>
            <h3 className="a1m-group__title"><span className="a1m-group__dot" />درآمد و مصرف از دفتر کل</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {(data.profitRows || []).map((row) => (
                <div key={row.id} className="a1m-card">
                  <div className="a1m-card__top">
                    <b className="a1m-card__title">{currencyLabel(row.currency)}</b>
                    <span className={'a1m-amount ' + (row.revenue - row.expense >= 0 ? 'a1m-amount--credit' : 'a1m-amount--debit')}>
                      {fmt(row.revenue - row.expense)}
                    </span>
                  </div>
                  <div className="a1m-card__meta">
                    <span className="a1m-card__pair">درآمد: <b>{fmt(row.revenue)}</b></span>
                    <span className="a1m-card__pair">مصارف: <b>{fmt(row.expense)}</b></span>
                  </div>
                </div>
              ))}
              {!(data.profitRows || []).length ? <div className="a1m-empty">داده‌ای برای نمایش نیست.</div> : null}
            </div>
          </div>
          <p className="a1m-note">سود معاملات اسعار در ماژول «مفاد معاملات» بالای همین صفحه محاسبه می‌شود. این اعداد فقط درآمد و مصرف ثبت‌شده در دفتر کل همین حافظه را نشان می‌دهند.</p>
        </div>
      ) : null}

      {module.kind === 'balance' ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <BalanceSheetPanel data={data} />
          <div className="a1m-group" style={{ marginBottom: 0 }}>
            <h3 className="a1m-group__title"><span className="a1m-group__dot" />موجودی نمایشی صندوق‌ها</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {[...new Set((data.cash || []).map((row) => row.currency))].map((code) => {
                const total = (data.cash || []).filter((row) => row.currency === code).reduce((sum, row) => sum + cashBalance(data, row), 0);
                return (
                  <div key={code} className="a1m-card">
                    <div className="a1m-card__top">
                      <b className="a1m-card__title">{currencyLabel(code)}</b>
                      <span className="a1m-amount">{fmt(total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="a1m-note">این خلاصه فقط موجودی صندوق‌ها را نشان می‌دهد و جایگزین بیلانس آزمایشی یا ترازنامهٔ بدهکار/بستانکار نیست.</p>
        </div>
      ) : null}

      {isList ? (
        <>
          <div className="a1m-toolbar">
            <div className="a1m-toolbar__row">
              <div className="a1m-search">
                <Search />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در فهرست..." />
              </div>
              <select className="a1m-input" value={currency} onChange={(event) => setCurrency(event.target.value)} style={{ width: 96, height: 34, padding: '0 8px', fontSize: 11, flex: '0 0 auto' }}>
                <option value="همه">همه ارز</option>
                {CURRENCIES.map((code) => <option key={code} value={code}>{currencyLabel(code)}</option>)}
              </select>
            </div>
            <div className="a1m-toolbar__row">
              <input type="date" className="a1m-input" style={{ height: 34, fontSize: 11 }} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="از تاریخ" />
              <input type="date" className="a1m-input" style={{ height: 34, fontSize: 11 }} value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="تا تاریخ" />
              <button type="button" className="a1m-badge" onClick={() => { setQuery(''); setCurrency('همه'); setDateFrom(''); setDateTo(''); }} style={{ flex: '0 0 auto' }}>پاک</button>
            </div>
            <div className="a1m-toolbar__row">
              <button type="button" className="a1m-btn a1m-btn--ghost" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 34, flex: 1 }}>
                <Download className="h-4 w-4" />CSV
              </button>
              <button type="button" className="a1m-btn a1m-btn--ghost" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 34, flex: 1 }}>
                <Printer className="h-4 w-4" />چاپ
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#7c90a5', padding: '0 2px' }}>
            <span>تعداد: {fmt(rows.length)}</span>
            <span>{openRow ? 'پنجرهٔ رکورد باز است' : 'برای عملیات، یک ردیف را باز کنید'}</span>
          </div>

          <div style={{ display: 'grid', gap: 7 }}>
            {rows.map((row) => {
              const info = describeRow(moduleId, row, data);
              const badge = isReversed(row) ? 'ابطال شده' : isCounterDocument(row) ? 'سند معکوس' : info.badge;
              return (
                <button
                  key={row.id}
                  type="button"
                  className={'a1m-card' + (selectedId === row.id ? ' is-selected' : '')}
                  onClick={() => {
                    // تعریف مشتری، دفتر حساب، مشتریان بدهکار/بستانکار و نمایندگی‌ها: گردش همان حساب باز می‌شود
                    if (moduleId === 'customers') { setSelectedId(row.id); openAccount('customer', row); return; }
                    if (moduleId === 'customerLedger') { openAccount('customer', row); return; }
                    if (moduleId === 'debtors') { openAccount('customer', row); return; }
                    if (moduleId === 'branchLedger') { openAccount('branch', row); return; }
                    if (moduleId === 'branches') { setSelectedId(row.id); openAccount('branch', row); return; }
                    // صفحهٔ اختصاصی حساب صندوق و بانک؛ بازگشت به همان فهرست یا همان حساب قبلی
                    if (moduleId === 'banks') { setSelectedId(row.id); openAccount('bank', row); return; }
                    if (moduleId === 'cash') { setSelectedId(row.id); openAccount('cash', row); return; }
                    // بقیهٔ بخش‌ها: پنجرهٔ درونی همان رکورد باز می‌شود و سه دکمهٔ عملیات داخل آن است
                    if (!canOpenRecord) { setSelectedId(row.id); return; }
                    setSelectedId(row.id);
                    setOpenRowId(row.id);
                  }}
                >
                  <div className="a1m-card__top">
                    <div style={{ minWidth: 0 }}>
                      <div className="a1m-card__title">{info.title}</div>
                      <div className="a1m-card__sub">{info.sub}</div>
                    </div>
                    {badge ? <span className={'a1m-badge' + badgeTone(badge)}>{badge}</span> : null}
                  </div>
                  {info.pairs?.length ? (
                    <div className="a1m-card__meta">
                      {info.pairs.map(([label, value]) => (
                        <span key={label} className="a1m-card__pair">{label}: <b>{value}</b></span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
            {!rows.length ? <div className="a1m-empty">ردیفی با این فیلترها وجود ندارد.</div> : null}
          </div>
        </>
      ) : null}

      {isLedgerView ? (
        <p className="a1m-note">سطر دفتر کل سند مستقل نیست؛ برای حفظ هماهنگی اطلاعات حسابداری، هر سطر فقط از سند اصلی خودش (روزنامچه، حواله، معامله یا مصرف) ویرایش می‌شود.</p>
      ) : null}

      {openRow && canOpenRecord ? (
        <MobileRecordSheet
          title={openInfo.title}
          sub={openInfo.sub}
          badge={openBadge}
          badgeClass={badgeTone(openBadge)}
          pairs={openInfo.pairs || []}
          links={rowAccountLinks(openRow)}
          onClose={() => { setOpenRowId(null); setSelectedId(null); }}
          actions={
            isLogList
              ? []
              : isLedgerView
              ? [{
                key: 'source',
                label: 'ویرایش از سند اصلی',
                icon: <FileText className="h-4 w-4" />,
                primary: true,
                disabled: !canEdit,
                onClick: () => openSourceDocument(openRow),
              }]
              : [
                {
                  key: 'create',
                  label: 'ثبت',
                  icon: <Plus className="h-4 w-4" />,
                  primary: true,
                  disabled: !canCreate,
                  onClick: () => { setOpenRowId(null); setSelectedId(null); onOpenForm(moduleId, {}); },
                },
                {
                  key: 'edit',
                  label: 'ویرایش',
                  icon: <Pencil className="h-4 w-4" />,
                  disabled: !canEdit || isLocked(openRow),
                  onClick: () => { setOpenRowId(null); setSelectedId(null); onOpenForm(moduleId, {}, openRow); },
                },
                isMaster
                  ? {
                    key: 'deactivate',
                    label: 'غیرفعال',
                    icon: <Ban className="h-4 w-4" />,
                    disabled: !canDelete || deactivating || openRow.status === 'غیرفعال',
                    onClick: () => deactivateRecord(openRow),
                  }
                  : {
                    key: 'reverse',
                    label: 'ابطال',
                    icon: <RotateCcw className="h-4 w-4" />,
                    disabled: !canDelete || isLocked(openRow),
                    onClick: () => openReversal(openRow),
                  },
              ]
          }
        />
      ) : null}

      {printColumns ? (
        <div className="a1m-print">
          <div className="a1m-print__head">
            <b>{module.label}</b>
            <span>حساب صراف — گزارش نمایشی · تعداد ردیف: {fmt(rows.length)}</span>
          </div>
          <table>
            <thead>
              <tr>{printColumns.map(([key, label]) => <th key={key}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>{printColumns.map(([key]) => <td key={key}>{String(row[key] ?? '')}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {reversal ? (
        <MobileReversalSheet
          target={reversal}
          saving={reversing}
          onCancel={() => setReversal(null)}
          onConfirm={confirmReversal}
        />
      ) : null}
    </div>
  );
}