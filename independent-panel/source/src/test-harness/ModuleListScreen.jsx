// test-harness/ModuleListScreen.jsx — فهرست رکوردهای یک بخش
import React, { useMemo, useState } from 'react';
import { Search, Lock, ArrowLeft } from 'lucide-react';
import { moduleById } from './harnessModules';
import { describeRow } from './describe';
import { fmt } from './format';

const badgeClass = (value) => {
  if (!value) return '';
  if (['فعال', 'قطعی', 'اجرا شده', 'تسویه'].includes(value)) return ' is-green';
  if (['غیرفعال', 'بستانکار'].includes(value)) return ' is-gray';
  if (['در انتظار', 'بدهکار'].includes(value)) return ' is-gold';
  return '';
};

export default function ModuleListScreen({ moduleId, filter, gateway, highlightId, onOpenDetail, onOpenStatement }) {
  const module = moduleById(moduleId);
  const Icon = module.icon;
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const all = gateway.list(moduleId);
    const scoped = filter ? all.filter((row) => row[filter.field] === filter.value) : all;
    const text = query.trim().toLowerCase();
    if (!text) return scoped;
    return scoped.filter((row) => Object.values(row).join(' ').toLowerCase().includes(text));
  }, [gateway, moduleId, filter, query]);

  // همان الگوی دفتر حساب مشتریان: هر حسابی که دفتر دارد، با کلیک روی ردیف مستقیماً باز می‌شود
  const open = (row) => {
    if (module.detail === 'statement') onOpenStatement(row.id, row.name);
    else if (row.ledgerId) onOpenStatement(row.ledgerId, row.name);
    else onOpenDetail(moduleId, row.id);
  };

  return (
    <div className="th-screen">
      <section className="th-section">
        <div className="th-section__head">
          <h2 className="th-section__title">
            <Icon className="h-4 w-4" />
            {module.label}
          </h2>
          <span className="th-section__count">
            {fmt(rows.length)} رکورد
          </span>
        </div>
        <p className="th-section__note">{filter ? `فیلتر فعال: ${filter.field} = ${filter.value}` : module.note}</p>

        <label className="th-search">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در همین فهرست…" />
        </label>

        <div className="th-list">
          {rows.map((row) => {
            const info = describeRow(moduleId, row);
            const selected = row.id === highlightId;
            return (
              <button
                key={row.id}
                type="button"
                className={`th-row${selected ? ' is-selected' : ''}`}
                onClick={() => open(row)}
              >
                <div className="th-row__top">
                  <div className="th-row__head">
                    <b className="th-row__title">{info.title}</b>
                    <span className="th-row__sub">{info.sub}</span>
                  </div>
                  <span className={`th-badge${badgeClass(info.badge)}`}>{info.badge}</span>
                </div>
                {info.pairs.length ? (
                  <div className="th-row__meta">
                    {info.pairs.map(([label, value]) => (
                      <span key={label} className="th-row__pair">{label}: <b>{value}</b></span>
                    ))}
                  </div>
                ) : null}
                <span className="th-row__go">
                  {module.detail === 'statement' || row.ledgerId ? 'گشودن حساب اختصاصی' : 'گشودن جزئیات'}
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
          {!rows.length ? <div className="th-empty">ردیفی با این فیلتر نیست.</div> : null}
        </div>

        <p className="th-note th-note--tight">
          <Lock className="h-3.5 w-3.5" />
          هر حسابی که دفتر دارد، با کلیک روی ردیف یا نامش صفحهٔ اختصاصی خودش را باز می‌کند. ویرایش فقط در همان صفحه و در حافظهٔ همین تب است؛ با تازه‌سازی صفحه همه‌چیز به حالت اولیه بازمی‌گردد.
        </p>
      </section>
    </div>
  );
}