// src/core/audit/nodeRunner.js — اجرای ممیزی در محیط Node (بدون مرورگر)
// برای بازبینی سریع در توسعه: npx esbuild این فایل را با alias «@» بسته‌بندی و با node اجرا می‌کند.
import { runPanelAudit } from './panelAudit.js';

const report = await runPanelAudit();
const failures = report.results.filter((item) => !item.ok);
console.log(JSON.stringify({
  total: report.total,
  passed: report.passed,
  failed: report.failed,
  sectionsFailed: report.sections.filter((section) => !section.ok).map((section) => section.id),
  groups: report.groups,
  failures,
}, null, 1));