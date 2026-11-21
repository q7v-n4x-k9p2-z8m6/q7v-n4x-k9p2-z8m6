// a1/lib/portalData.js — دادهٔ پنل مشتری از همان ۶۲ جدول محلی نسخهٔ ۲۱
// هر حساب مشتری نمایشی فقط پروندهٔ متصل به خودش را می‌بیند و هیچ درخواست شبکه‌ای انجام نمی‌شود.
import { useEffect, useState } from 'react';
import { all } from '@/a1/lib/db';
import { loadVersion21Database } from '@/a1/lib/v21Data';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import { resolveSessionCustomer } from '@/a1/lib/sessionCustomer';

const num = value => Number(value ?? 0) || 0;

export async function loadPortal() {
  const user = currentUser();
  const exchangeCode = user?.exchange_code || DEMO_EXCHANGE_CODE;
  const bundle = await loadVersion21Database();
  const data = bundle.data;

  const customer = resolveSessionCustomer(data.customers || [], user);
  if (!customer) {
    throw new Error('پروندهٔ مشتری نمایشی به این حساب متصل نیست. از صفحهٔ ورود یکی از حساب‌های مشتری را انتخاب کنید.');
  }

  const name = customer.name || '';
  const mobile = String(customer.mobile || '').trim();
  const ownedByCustomer = row => !mobile || !row.customer_mobile || String(row.customer_mobile).trim() === mobile;

  const lines = (data.transactions || []).filter(line => line.partyType === 'customer' && line.party === name);
  const currency = customer.currency || 'AFN';
  const balanceMap = new Map();
  const addBalance = (code, delta) => balanceMap.set(code, num(balanceMap.get(code)) + delta);
  addBalance(currency, num(customer.opening));
  lines.forEach(line => addBalance(line.currency || 'AFN', -num(line.amount)));
  const balances = [...balanceMap.entries()].map(([code, balance]) => ({
    currency: code,
    balance,
    side: balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه',
  }));

  const [notifications, products, chargeOrders, rechargeOrders, onlineRequests, tickets, messages, withdrawals] = await Promise.all([
    all('customer_notifications'),
    all('online_products'),
    all('charge_orders'),
    all('recharge_orders'),
    all('online_requests'),
    all('support_tickets'),
    all('chat_messages'),
    all('wallet_withdrawal_requests'),
  ]);
  const inTenant = row => (!row.exchange_code || row.exchange_code === exchangeCode) && ownedByCustomer(row);
  const namedFor = row => !row.customer_name || row.customer_name === name;
  const mine = row => inTenant(row) && namedFor(row);

  return {
    user,
    exchange: bundle.exchange,
    customer,
    balances,
    lines,
    transfers: (data.remittance || []).filter(item => item.sender === name || item.receiver === name),
    notifications: notifications.filter(mine),
    products: products.filter(inTenant),
    orders: [...chargeOrders, ...rechargeOrders, ...onlineRequests].filter(mine).map(row => ({
      id: String(row.id),
      title: row.product_name || row.package_name || row.service_name || row.title || 'سفارش',
      amount: num(row.amount ?? row.price),
      currency: row.currency || 'AFN',
      status: row.status || 'pending',
      date: String(row.created_at || '').slice(0, 10),
    })),
    tickets: tickets.filter(row => inTenant(row) && (!row.created_by_name || row.created_by_name === name)),
    messages: messages.filter(row => inTenant(row) && (!row.sender_id || row.sender_id === String(user?.id))),
    withdrawals: withdrawals.filter(mine),
    currencies: data.currencies || [],
  };
}

export function usePortal() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let active = true;
    loadPortal()
      .then(data => { if (active) setState({ loading: false, data, error: '' }); })
      .catch(error => { if (active) setState({ loading: false, data: null, error: error?.message || 'بارگذاری اطلاعات مشتری ناموفق بود.' }); });
    return () => { active = false; };
  }, []);
  return state;
}