export function resolveSessionUserId(authUserRaw, authToken = '') {
  try {
    const user = typeof authUserRaw === 'string' ? JSON.parse(authUserRaw || 'null') : authUserRaw;
    const id = user?.id ?? user?.user_id;
    if (id !== undefined && id !== null && String(id).trim()) return String(id);
  } catch {
    // A malformed cached user must not prevent trying the signed session token.
  }
  const tokenParts = String(authToken || '').split('.');
  // Standard JWTs store claims in segment 2; legacy app tokens may store
  // their JSON payload in segment 1. Try both without trusting either alone.
  const candidates = tokenParts.length >= 3
    ? [tokenParts[1], tokenParts[0]]
    : [tokenParts[0]];
  for (const payloadPart of candidates) {
    try {
      if (!payloadPart) continue;
      let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const payload = JSON.parse(atob(base64));
      const id = payload?.uid ?? payload?.user_id ?? payload?.id;
      if (id !== undefined && id !== null && String(id).trim()) return String(id);
    } catch {
      // Try the next supported token segment.
    }
  }
  return '';
}

export const DEMO_USERS = Object.freeze({
  107: Object.freeze({ username: '22222222', exchangeCode: 'EX-261019-9B2573C5' }),
  114: Object.freeze({ username: '33333333', exchangeCode: 'EX-261028-27497E95' }),
});

export function matchDemoAccount(userId, exchangeCode) {
  const expected = DEMO_USERS[Number(userId)];
  if (!expected || expected.exchangeCode !== exchangeCode) return null;
  return expected;
}
