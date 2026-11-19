export function resolveSessionUserId(authUserRaw, authToken = '') {
  try {
    const user = typeof authUserRaw === 'string' ? JSON.parse(authUserRaw || 'null') : authUserRaw;
    const id = user?.id ?? user?.user_id;
    if (id !== undefined && id !== null && String(id).trim()) return String(id);
  } catch {
    // A malformed cached user must not prevent trying the signed session token.
  }
  try {
    const payloadPart = String(authToken || '').split('.')[0];
    if (!payloadPart) return '';
    let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload = JSON.parse(atob(base64));
    const id = payload?.uid ?? payload?.user_id ?? payload?.id;
    return id === undefined || id === null ? '' : String(id);
  } catch {
    return '';
  }
}
