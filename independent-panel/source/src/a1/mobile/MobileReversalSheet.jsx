// a1/mobile/MobileReversalSheet.jsx — ابطال سند در موبایل با علت اجباری
// هیچ حذفی انجام نمی‌شود: سند اصلی ابطال و سند معکوس ثبت می‌گردد (قاعده در core/domain/reversal).
import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

export default function MobileReversalSheet({ target, saving, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 3;

  return (
    <div className="a1m-sheet" role="dialog" aria-modal="true" aria-label="ابطال سند با سند معکوس" style={{ background: 'rgba(11, 39, 66, 0.55)' }} onClick={onCancel}>
      <section
        className="a1m-sheet"
        style={{ position: 'absolute', insetInline: 0, top: 'auto', bottom: 0, maxHeight: '82dvh', borderRadius: '18px 18px 0 0', overflow: 'hidden', background: '#f2f6fb' }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="a1m-sheet__head">
          <span className="a1m-sheet__title">ابطال {target?.title || 'سند'}</span>
          <button type="button" className="a1m-sheet__close" onClick={onCancel} aria-label="بستن"><X className="h-4 w-4" /></button>
        </header>
        <div className="a1m-sheet__body">
          <p style={{ fontSize: 11, lineHeight: 1.95, color: '#3d5873' }}>
            سند اصلی حذف نمی‌شود؛ وضعیت آن «ابطال شده» می‌گردد و یک سند معکوس با همان مبلغ و طرف مقابل ثبت می‌شود.
            سند ابطال‌شده دیگر قابل ویرایش نیست.
          </p>
          {target?.detail ? <div className="a1m-note">{target.detail}</div> : null}
          <div className="a1m-formgrid">
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#315f80' }}>علت ابطال (الزامی)</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="a1m-input"
                style={{ height: 'auto', minHeight: 76, padding: 9, fontSize: 11, lineHeight: 1.9 }}
                placeholder="مثلاً: اشتباه در مبلغ حواله"
              />
            </label>
            {!valid ? <span style={{ fontSize: 10, color: '#b06a12' }}>علت ابطال باید حداقل سه نویسه باشد.</span> : null}
          </div>
        </div>
        <footer className="a1m-sheet__foot">
          <button
            type="button"
            className="a1m-btn a1m-btn--primary"
            disabled={!valid || saving}
            onClick={() => onConfirm(reason.trim())}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <RotateCcw className="h-4 w-4" />{saving ? 'در حال ثبت...' : 'ثبت سند معکوس'}
          </button>
          <button type="button" className="a1m-btn a1m-btn--ghost" onClick={onCancel} disabled={saving}>انصراف</button>
        </footer>
      </section>
    </div>
  );
}