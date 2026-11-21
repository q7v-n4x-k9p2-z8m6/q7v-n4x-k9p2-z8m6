// test-harness/LinkMatrixScreen.jsx — نقشهٔ پیوندها و دکمه‌های آزمون سریع
import React from 'react';
import { GitBranch, ArrowLeft } from 'lucide-react';
import { LINK_MATRIX } from './harnessModules';
import LinkChainPanel from '@/components/audit/LinkChainPanel';

const TARGETS = {
  'مشتریان': 'customers',
  'نمایندگی‌ها': 'branches',
  'بدهکاران': 'debtors',
  'صندوق‌ها': 'cash',
  'بانک‌ها': 'banks',
  'تراکنش‌ها': 'transactions',
  'حواله‌ها': 'remittances',
  'مصارف': 'expenses',
  'دفاتر حساب': 'ledgers',
};

export default function LinkMatrixScreen({ onOpenList }) {
  return (
    <div className="th-screen">
      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">
            <GitBranch className="h-4 w-4" />
            نقشهٔ پیوندها
          </h2>
          <span className="th-section__count">۹ مسیر</span>
        </div>
        <p className="th-section__note">هر مسیر از فهرست آغاز می‌شود، به جزئیات می‌رسد و با دکمهٔ بازگشت به همان فهرست برمی‌گردد.</p>

        <div className="th-matrix">
          {LINK_MATRIX.map((item) => (
            <div key={item.from} className="th-matrix__row">
              <div className="th-matrix__body">
                <b>{item.from}</b>
                <span>{item.detail}</span>
                <small>{item.back}</small>
              </div>
              <button type="button" className="th-matrix__go" onClick={() => onOpenList(TARGETS[item.from])} aria-label={`آزمون مسیر ${item.from}`}>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <LinkChainPanel only="harness" />
    </div>
  );
}