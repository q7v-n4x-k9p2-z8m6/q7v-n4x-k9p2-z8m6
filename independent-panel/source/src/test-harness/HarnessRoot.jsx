// test-harness/HarnessRoot.jsx — پوستهٔ محیط آزمون با ناوبری درون‌حافظه‌ای
import React, { useMemo, useState } from 'react';
import { createSessionGateway } from './sessionGateway';
import { moduleById } from './harnessModules';
import HarnessHeader from './HarnessHeader';
import HarnessTabBar from './HarnessTabBar';
import ScenarioHome from './ScenarioHome';
import ModuleListScreen from './ModuleListScreen';
import RecordDetailScreen from './RecordDetailScreen';
import LedgerStatementScreen from './LedgerStatementScreen';
import LinkMatrixScreen from './LinkMatrixScreen';
import IsolationPanel from './IsolationPanel';
import ProfitAuditScreen from './ProfitAuditScreen';
import TransferReadinessScreen from './TransferReadinessScreen';
import IsolationBlocked from './IsolationBlocked';

function crumbLabel(entry, gateway) {
  if (entry.label) return entry.label;
  if (entry.kind === 'list') return moduleById(entry.moduleId).label;
  if (entry.kind === 'statement') return gateway.ledgerById(entry.ledgerId)?.name || 'دفتر حساب';
  const module = moduleById(entry.moduleId);
  const record = gateway.get(entry.moduleId, entry.id);
  if (entry.moduleId === 'ledgers') return record?.name || 'دفتر حساب';
  return record?.name || record?.title || record?.number || module.label;
}

export default function HarnessRoot({ isolation }) {
  const gateway = useMemo(() => createSessionGateway(), []);
  const [tab, setTab] = useState('scenarios');
  const [stack, setStack] = useState([]);
  const [recent, setRecent] = useState({});
  // ویرایش‌های داخل حساب فقط در حافظهٔ همین تب‌اند؛ این شمارنده صفحه را با دادهٔ تازه دوباره رسم می‌کند.
  const [, bumpRevision] = useState(0);
  const onChanged = () => bumpRevision((current) => current + 1);

  if (!isolation || !isolation.ok) {
    return <IsolationBlocked isolation={isolation} />;
  }

  const openList = (moduleId) => setStack([{ kind: 'list', moduleId }]);
  const openFilteredList = (link) => setStack((current) => [...current, { kind: 'list', moduleId: link.moduleId, filter: link.filter, label: link.label }]);
  // بازکردن دوبارهٔ سطحی که از قبل در مسیر هست، به‌جای افزودن تکرار، مسیر را تا همان سطح کوتاه می‌کند
  // تا مسیر پیمایش همیشه با صفحهٔ جاری بخواند.
  const pushEntry = (entry) => setStack((current) => {
    const index = current.findIndex((item) => item.kind === entry.kind
      && item.moduleId === entry.moduleId
      && item.id === entry.id
      && item.ledgerId === entry.ledgerId);
    return index >= 0 ? current.slice(0, index + 1) : [...current, entry];
  });
  const openDetail = (moduleId, id) => {
    setRecent((prev) => ({ ...prev, [moduleId]: id }));
    pushEntry({ kind: 'detail', moduleId, id });
  };
  const openStatement = (ledgerId, label) => pushEntry({ kind: 'statement', ledgerId, label });
  const back = () => setStack((current) => current.slice(0, -1));
  // پرش به هر سطح مسیر با همان پشتهٔ درون‌حافظه‌ای (بدون تاریخچهٔ مرورگر)
  const goCrumb = (index) => setStack((current) => (index >= 0 && index < current.length - 1 ? current.slice(0, index + 1) : current));
  const goTab = (key) => { setTab(key); setStack([]); };

  const handleLink = (link) => {
    if (link.kind === 'statement') openStatement(link.id, link.label);
    else if (link.kind === 'detail') openDetail(link.moduleId, link.id);
    else if (link.kind === 'list') openFilteredList(link);
  };

  const current = stack[stack.length - 1];
  const crumbs = stack.map((entry) => crumbLabel(entry, gateway));

  let screen;
  if (!current) {
    if (tab === 'scenarios') {
      screen = <ScenarioHome gateway={gateway} onOpenList={openList} onOpenModuleTab={() => setTab('modules')} />;
    } else if (tab === 'modules') {
      screen = <ScenarioHome gateway={gateway} onOpenList={openList} onOpenModuleTab={() => setTab('modules')} asIndex />;
    } else if (tab === 'links') {
      screen = <LinkMatrixScreen onOpenList={openList} />;
    } else if (tab === 'profit') {
      screen = <ProfitAuditScreen />;
    } else if (tab === 'transfer') {
      screen = <TransferReadinessScreen />;
    } else {
      screen = <IsolationPanel iconOnly={false} />;
    }
  } else if (current.kind === 'list') {
    screen = (
      <ModuleListScreen
        moduleId={current.moduleId}
        filter={current.filter}
        gateway={gateway}
        highlightId={recent[current.moduleId]}
        onOpenDetail={openDetail}
        onOpenStatement={(ledgerId, label) => openStatement(ledgerId, label)}
      />
    );
  } else if (current.kind === 'detail') {
    screen = (
      <RecordDetailScreen
        moduleId={current.moduleId}
        id={current.id}
        gateway={gateway}
        onLink={handleLink}
      />
    );
  } else {
    screen = (
      <LedgerStatementScreen
        ledgerId={current.ledgerId}
        gateway={gateway}
        onOpenDetail={openDetail}
        onChanged={onChanged}
      />
    );
  }

  return (
    <div className="th-root" dir="rtl" lang="fa">
      <div className="th-shell">
        <HarnessHeader crumbs={crumbs} onBack={back} canGoBack={stack.length > 0} onCrumbSelect={goCrumb} />
        <main className="th-main">{screen}</main>
        <HarnessTabBar tab={tab} onSelect={goTab} />
      </div>
    </div>
  );
}