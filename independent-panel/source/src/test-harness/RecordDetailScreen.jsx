// test-harness/RecordDetailScreen.jsx — جزئیات رکورد و پیوندهای مرتبط
import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { moduleById } from './harnessModules';
import { buildDetail } from './detailLinks';

export default function RecordDetailScreen({ moduleId, id, gateway, onLink }) {
  const module = moduleById(moduleId);
  const record = gateway.get(moduleId, id);
  const detail = buildDetail(module.detail, record, gateway);

  if (!detail) {
    return (
      <div className="th-screen">
        <div className="th-empty">این رکورد در دادهٔ سناریو پیدا نشد.</div>
      </div>
    );
  }

  return (
    <div className="th-screen">
      <section className="th-detail">
        <div className="th-detail__top">
          <div>
            <h1 className="th-detail__title">{detail.title}</h1>
            <p className="th-detail__sub">{detail.sub}</p>
          </div>
          <span className="th-badge is-blue">{detail.badge}</span>
        </div>

        <dl className="th-fields">
          {detail.fields.map(([label, value]) => (
            <div key={label} className="th-field">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {detail.links.length ? (
          <div className="th-links">
            <h2 className="th-links__title">پیوندهای مرتبط</h2>
            {detail.links.map((link) => (
              <button key={link.key} type="button" className="th-link" onClick={() => onLink(link)}>
                <span className="th-link__body">
                  <b>{link.label}</b>
                  <small>{link.hint}</small>
                </span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            ))}
          </div>
        ) : null}

        <p className="th-note th-note--tight">
          <Lock className="h-3.5 w-3.5" />
          پروندهٔ فقط‌خواندنی — {module.label} · شناسه {id}
        </p>
      </section>
    </div>
  );
}