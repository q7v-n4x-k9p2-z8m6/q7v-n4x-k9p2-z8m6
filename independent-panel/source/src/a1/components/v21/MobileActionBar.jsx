// a1/components/v21/MobileActionBar.jsx — نوار عملیات ثابت پایین صفحه (موبایل)
// سه دکمهٔ ثبت، ویرایش و حذف همیشه در گوشهٔ پایین صفحه دیده می‌شوند و با اسکرول جابه‌جا نمی‌شوند.
import React from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import './mobile-actionbar.css';

export default function MobileActionBar({ canCreate, canEdit, canDelete, hasSelection, onCreate, onEdit, onDelete }) {
  return (
    <div className="a1-mobile-actionbar" role="toolbar" aria-label="عملیات ثبت، ویرایش و حذف">
      <button type="button" onClick={onCreate} disabled={!canCreate} className="a1-mobile-actionbar__btn is-create">
        <Check className="h-4 w-4" /><span>ثبت</span>
      </button>
      <button type="button" onClick={onEdit} disabled={!hasSelection || !canEdit} className="a1-mobile-actionbar__btn">
        <Pencil className="h-4 w-4" /><span>ویرایش</span>
      </button>
      <button type="button" onClick={onDelete} disabled={!hasSelection || !canDelete} className="a1-mobile-actionbar__btn is-delete">
        <Trash2 className="h-4 w-4" /><span>حذف</span>
      </button>
    </div>
  );
}