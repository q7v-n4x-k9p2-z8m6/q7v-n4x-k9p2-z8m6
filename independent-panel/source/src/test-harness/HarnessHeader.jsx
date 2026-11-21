// test-harness/HarnessHeader.jsx — سربرگ محیط آزمون با هویت موقت و بدون ذخیره
import React from 'react';
import { ArrowRight, Lock, ChevronLeft } from 'lucide-react';
import { TEST_IDENTITY } from './identity';

export default function HarnessHeader({ crumbs, onBack, canGoBack, onCrumbSelect }) {
  return (
    <header className="th-head">
      <div className="th-head__top">
        <div className="th-brand">
          <span className="th-brand__mark">ص</span>
          <span className="th-brand__text">
            <b>حساب صراف</b>
            <small>میزکار آزمون موبایل</small>
          </span>
        </div>
        <span className="th-identity" title={TEST_IDENTITY.note}>
          <Lock className="h-3 w-3" />
          بدون ذخیرهٔ ماندگار
        </span>
      </div>

      <div className="th-crumbs">
        {canGoBack ? (
          <button type="button" className="th-back" onClick={onBack} aria-label="بازگشت">
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        <nav className="th-crumb" aria-label="مسیر پیمایش">
          <span className="th-crumb__start">{TEST_IDENTITY.name}</span>
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;
            return (
              <span key={`${crumb}-${index}`} className="th-crumb__item">
                <ChevronLeft className="h-3 w-3" />
                {isCurrent ? (
                  <span className="is-current" aria-current="page">{crumb}</span>
                ) : (
                  <button
                    type="button"
                    className="th-crumb__link"
                    onClick={() => onCrumbSelect?.(index)}
                  >
                    {crumb}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}