// test-harness/HarnessTabBar.jsx — چهار تب ناوبری محیط آزمون
import React from 'react';
import { LayoutGrid, ListTree, GitBranch, ShieldCheck, Sigma, ClipboardCheck } from 'lucide-react';

const TABS = [
  { key: 'scenarios', label: 'سناریوها', icon: LayoutGrid },
  { key: 'modules', label: 'فهرست‌ها', icon: ListTree },
  { key: 'links', label: 'پیوندها', icon: GitBranch },
  { key: 'profit', label: 'مفاد', icon: Sigma },
  { key: 'transfer', label: 'انتقال', icon: ClipboardCheck },
  { key: 'status', label: 'وضعیت', icon: ShieldCheck },
];

export default function HarnessTabBar({ tab, onSelect }) {
  return (
    <nav className="th-tabs" aria-label="ناوبری محیط آزمون">
      {TABS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`th-tab${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(item.key)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}