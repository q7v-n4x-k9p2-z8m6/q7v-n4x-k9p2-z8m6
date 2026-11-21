// test-harness/LedgerStatementScreen.jsx — صفحهٔ اختصاصی هر حساب در محیط آزمون
// همان الگوی دفتر حساب مشتریان: تمام سطرهای بدهکار و بستانکار با تاریخ، شمارهٔ سند و شرح علت هر مبلغ،
// به‌همراه اسناد و معاملات مرتبط همان حساب. ویرایش فقط در حافظهٔ همین تب انجام می‌شود.
import React, { useState } from 'react';
import { Lock, ArrowLeft, ExternalLink, Pencil, Info } from 'lucide-react';
import { fmt, money, currencyLabel } from './format';
import EditSheet from './EditSheet';

const SOURCE_LABEL = { transactions: 'تراکنش', remittances: 'حواله', expenses: 'مصرف' };

const documentTitle = (module, record) => {
  if (module === 'remittances') return `حوالهٔ ${record.number} · ${record.direction}`;
  if (module === 'expenses') return `${record.number} · ${record.title}`;
  return `${record.number} · ${record.kind || 'تراکنش'}`;
};

const documentHint = (module, record) => {
  const parts = [record.date, SOURCE_LABEL[module]];
  if (module === 'remittances') parts.push(`${record.sender} ← ${record.receiver}`);
  else if (module === 'expenses') parts.push(record.payer);
  else parts.push(record.description);
  parts.push(money(record.amount, record.currency));
  return parts.filter(Boolean).join(' · ');
};

export default function LedgerStatementScreen({ ledgerId, gateway, onOpenDetail, onChanged }) {
  const [sheet, setSheet] = useState(null);
  const ledger = gateway.ledgerById(ledgerId);

  if (!ledger) {
    return (
      <div className="th-screen">
        <div className="th-empty">دفتر حساب پیدا نشد.</div>
      </div>
    );
  }

  const party = gateway.partyOf(ledger);
  const partyModule = gateway.partyModule(ledger);
  const partyLabel = gateway.partyLabel(ledger);
  const documents = gateway.relatedDocuments(ledger);
  const lineCount = ledger.lines.length;

  const save = (values) => {
    if (sheet?.kind === 'line') gateway.saveLine(ledger.id, sheet.line.id, values);
    else if (partyModule) gateway.saveParty(partyModule, ledger.partyId, values);
    setSheet(null);
    onChanged?.();
  };

  return (
    <div className="th-screen">
      <section className="th-detail">
        <div className="th-detail__top">
          <div>
            <h1 className="th-detail__title">{ledger.name}</h1>
            <p className="th-detail__sub">
              {[partyLabel, party?.code, party?.phone, party?.city, currencyLabel(ledger.currency)].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="th-detail__side">
            <span className="th-badge is-blue">{ledger.side}</span>
            {party && partyModule !== 'cash' ? (
              <button type="button" className="th-btn th-btn--ghost th-btn--mini" onClick={() => setSheet({ kind: 'party' })}>
                <Pencil className="h-3.5 w-3.5" />
                ویرایش حساب
              </button>
            ) : null}
          </div>
        </div>

        <div className="th-totals">
          <div className="th-total">
            <span>جمع بدهکار</span>
            <b>{money(ledger.totals.debit, ledger.currency)}</b>
          </div>
          <div className="th-total">
            <span>جمع بستانکار</span>
            <b>{money(ledger.totals.credit, ledger.currency)}</b>
          </div>
          <div className="th-total is-strong">
            <span>مانده حساب</span>
            <b>{money(ledger.totals.balance, ledger.currency)}</b>
          </div>
        </div>

        {party ? (
          <dl className="th-fields">
            <div className="th-field"><dt>کد حساب</dt><dd>{party.code || '—'}</dd></div>
            <div className="th-field"><dt>تلفن</dt><dd>{party.phone || '—'}</dd></div>
            <div className="th-field"><dt>شهر</dt><dd>{party.city || '—'}</dd></div>
            <div className="th-field"><dt>وضعیت</dt><dd>{party.status || '—'}</dd></div>
          </dl>
        ) : null}

        <div className="th-lines-head">
          <b>ریز گردش حساب</b>
          <span className="th-section__count">{fmt(lineCount)} سطر · {fmt(documents.length)} سند مرتبط</span>
        </div>

        <div className="th-lines">
          <div className="th-line th-line--head">
            <span>تاریخ / سند</span>
            <span>شرح علت مبلغ</span>
            <span>بدهکار</span>
            <span>بستانکار</span>
            <span>مانده</span>
          </div>
          {ledger.lines.map((line) => (
            <div key={line.id} className="th-line">
              <span className="th-line__date">
                {line.date}
                <small>{line.number}</small>
              </span>
              <span className="th-line__desc">
                {line.description}
                <span className="th-line__actions">
                  {line.sourceModule ? (
                    <button
                      type="button"
                      className="th-line__source"
                      onClick={() => onOpenDetail(line.sourceModule, line.sourceId)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      سند منبع
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="th-line__source"
                    onClick={() => setSheet({ kind: 'line', line })}
                  >
                    <Pencil className="h-3 w-3" />
                    ویرایش سطر
                  </button>
                </span>
              </span>
              <span className="num">{line.debit ? fmt(line.debit) : '—'}</span>
              <span className="num">{line.credit ? fmt(line.credit) : '—'}</span>
              <span className="num is-strong">{fmt(line.running)}</span>
            </div>
          ))}
          {!lineCount ? <div className="th-empty">برای این حساب هنوز سطری ثبت نشده است.</div> : null}
        </div>

        <div className="th-links">
          <h2 className="th-links__title">اسناد و معاملات مرتبط با این حساب</h2>
          {documents.map(({ module, record }) => (
            <button key={`${module}-${record.id}`} type="button" className="th-link" onClick={() => onOpenDetail(module, record.id)}>
              <span className="th-link__body">
                <b>{documentTitle(module, record)}</b>
                <small>{documentHint(module, record)}</small>
              </span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          ))}
          {!documents.length ? (
            <div className="th-empty">سند یا معاملهٔ مستقلی به این حساب وصل نیست؛ گردش بالا از سطرهای دفتر خوانده شده است.</div>
          ) : null}
        </div>

        <p className="th-note th-note--tight">
          <Info className="h-3.5 w-3.5" />
          ویرایش‌ها فقط در حافظهٔ همین تب می‌مانند و با تازه‌سازی صفحه به دادهٔ اولیه بازمی‌گردند؛ هیچ سندی در دیتابیس نسخهٔ اصلی ساخته یا تغییر نمی‌کند.
        </p>

        <p className="th-note th-note--tight">
          <Lock className="h-3.5 w-3.5" />
          ابطال، حذف و ثبت سند جدید در این محیط وجود ندارد؛ فقط ویرایش سطر و اطلاعات حساب از فرم باز است.
        </p>

        {party && partyModule ? (
          <button type="button" className="th-link" onClick={() => onOpenDetail(partyModule, party.id)}>
            <span className="th-link__body">
              <b>پروندهٔ صاحب حساب</b>
              <small>{party.name} · {partyLabel}</small>
            </span>
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
      </section>

      {sheet ? (
        <EditSheet
          title={sheet.kind === 'line' ? 'ویرایش سطر گردش' : 'ویرایش اطلاعات حساب'}
          note={sheet.kind === 'line'
            ? 'تغییر مبلغ، ماندهٔ همین دفتر و فهرست حساب‌ها را بازمحاسبه می‌کند و فقط در همین تب می‌ماند.'
            : 'تغییر نام روی عنوان همین دفتر و فهرست‌های مربوط نیز اعمال می‌شود و فقط در همین تب می‌ماند.'}
          fields={sheet.kind === 'line' ? [
            { key: 'date', label: 'تاریخ سند', type: 'date', value: sheet.line.date },
            { key: 'description', label: 'شرح علت این مبلغ', type: 'textarea', value: sheet.line.description },
            { key: 'debit', label: 'بدهکار', type: 'number', value: sheet.line.debit },
            { key: 'credit', label: 'بستانکار', type: 'number', value: sheet.line.credit },
          ] : [
            { key: 'name', label: 'نام حساب', value: party?.name || '' },
            { key: 'phone', label: 'تلفن', value: party?.phone || '' },
            { key: 'city', label: 'شهر', value: party?.city || '' },
            { key: 'status', label: 'وضعیت', type: 'select', options: ['فعال', 'غیرفعال'], value: party?.status || 'فعال' },
          ]}
          onCancel={() => setSheet(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}