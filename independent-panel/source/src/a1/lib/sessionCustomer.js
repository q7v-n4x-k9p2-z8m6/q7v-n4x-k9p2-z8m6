// a1/lib/sessionCustomer.js — اتصال قطعی نشست نمایشی به پروندهٔ مشتری خودش
// هیچ‌گاه به «نخستین مشتری» برنمی‌گردد؛ اگر نشست به پرونده‌ای متصل نباشد، null برمی‌گردد.
export function resolveSessionCustomer(customers, session) {
  const list = Array.isArray(customers) ? customers : [];
  if (!session || !list.length) return null;

  const mobile = String(session.customer_mobile || '').trim();
  if (mobile) {
    return list.find(row => String(row.mobile || row.phone || '').trim() === mobile) || null;
  }

  const name = String(session.customer_name || '').trim();
  if (name) {
    return list.find(row => String(row.name || '').trim() === name) || null;
  }

  return null;
}