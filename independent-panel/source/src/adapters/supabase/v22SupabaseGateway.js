// درگاه آمادهٔ Supabase برای نسخهٔ ۲۲ — عمداً تا مرحلهٔ اتصال غیرفعال است.
// همهٔ نوشتن‌های مالی باید از یک RPC سمت سرور عبور کنند تا چندجدولی اتمیک و tenant-safe باشند.
// این فایل هیچ کلید، URL، اتصال یا درخواست شبکه‌ای را خودش ایجاد نمی‌کند.
import { GatewayError, assertGateway } from '../../core/gateway/contract.js';

export const V22_GATEWAY_RPC = 'v22_gateway_dispatch';

const ACTIONS = {
  snapshot: 'snapshot',
  list: 'list',
  get: 'get',
  count: 'count',
  create: 'create',
  update: 'update',
  deactivate: 'deactivate',
  remove: 'remove',
  reverse: 'reverse',
  replaceAll: 'replace_all',
};

function requireExchangeCode(value) {
  const code = String(value || '').trim();
  if (!code) throw new GatewayError('MISSING_TENANT', 'شناسهٔ صرافی برای درگاه نسخهٔ ۲۲ الزامی است.');
  return code;
}

export function createV22SupabaseGateway({ client, exchangeCode, subscribe } = {}) {
  const tenant = requireExchangeCode(exchangeCode);
  if (!client || typeof client.rpc !== 'function') {
    throw new GatewayError('NO_SUPABASE_CLIENT', 'کلاینت Supabase به درگاه نسخهٔ ۲۲ تزریق نشده است.');
  }

  async function dispatch(action, { module = '', id = null, payload = null, query = null } = {}) {
    const { data, error } = await client.rpc(V22_GATEWAY_RPC, {
      p_action: action,
      p_exchange_code: tenant,
      p_module: module,
      p_id: id,
      p_payload: payload,
      p_query: query,
    });
    if (error) {
      throw new GatewayError(
        error.code || 'SUPABASE_RPC_ERROR',
        error.message || 'درخواست پایگاه دادهٔ نسخهٔ ۲۲ ناموفق بود.',
        error.details || null,
      );
    }
    return data;
  }

  const gateway = {
    kind: 'supabase-v22',
    exchangeCode: tenant,
    snapshot: () => dispatch(ACTIONS.snapshot),
    list: (module, query = {}) => dispatch(ACTIONS.list, { module, query }),
    get: (module, id) => dispatch(ACTIONS.get, { module, id }),
    count: (module, query = {}) => dispatch(ACTIONS.count, { module, query }),
    create: (module, payload) => dispatch(ACTIONS.create, { module, payload }),
    update: (module, id, payload) => dispatch(ACTIONS.update, { module, id, payload }),
    deactivate: (module, id) => dispatch(ACTIONS.deactivate, { module, id }),
    remove: (module, id, reason = '') => dispatch(ACTIONS.remove, { module, id, payload: { reason } }),
    reverse: (module, id, reason) => dispatch(ACTIONS.reverse, { module, id, payload: { reason } }),
    replaceAll: (module, rows) => dispatch(ACTIONS.replaceAll, { module, payload: rows }),
    clearExcept: async () => {
      throw new GatewayError('PROTECTED_OPERATION', 'پاک‌سازی گروهی از درگاه پایگاه دادهٔ نسخهٔ ۲۲ غیرفعال است.');
    },
    reset: async () => {
      throw new GatewayError('PROTECTED_OPERATION', 'بازنشانی پایگاه داده از درگاه نسخهٔ ۲۲ غیرفعال است.');
    },
    subscribe: (listener) => {
      if (typeof subscribe !== 'function') {
        throw new GatewayError('REALTIME_NOT_CONFIGURED', 'اشتراک زنده باید پس از تعریف کانال امن صرافی پیکربندی شود.');
      }
      return subscribe({ exchangeCode: tenant, listener });
    },
  };

  return assertGateway(gateway, 'supabase-v22');
}
