// src/a1/mobile/MobileDemoContext.jsx — پوشش React روی درگاه دادهٔ موبایل
// دادهٔ حسابداری از همان موتور محلی لپ‌تاپ (IndexedDB) خوانده و در همان‌جا نوشته می‌شود.
// هیچ ذخیره‌سازی موازی یا دادهٔ جداگانه‌ای برای مشتریان و اسناد ساخته نمی‌شود.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getMobileGateway } from '@/app/container';

const MobileDemoContext = createContext(null);

const CLEAR_KEEP_KEYS = ['rates', 'products', 'settings', 'orders'];

export function MobileDemoProvider({ children }) {
  const gatewayRef = useRef(null);
  if (!gatewayRef.current) gatewayRef.current = getMobileGateway();
  const gateway = gatewayRef.current;

  const [data, setData] = useState(() => gateway.snapshot());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setStatus('loading');
    setError('');
    return gateway.ready()
      .then(() => {
        setData(gateway.snapshot());
        setStatus('ready');
      })
      .catch((failure) => {
        setError(failure?.message || 'بارگذاری اطلاعات صرافی ناموفق بود.');
        setStatus('error');
      });
  }, [gateway]);

  useEffect(() => {
    const unsubscribe = gateway.subscribe((next) => setData(next));
    load();
    return unsubscribe;
  }, [gateway, load]);

  const add = useCallback((collection, record) => gateway.create(collection, record), [gateway]);
  const update = useCallback((collection, id, patch) => gateway.update(collection, id, patch), [gateway]);
  const remove = useCallback((collection, id) => gateway.remove(collection, id), [gateway]);
  // رکوردهای پایه هرگز حذف فیزیکی نمی‌شوند؛ فقط غیرفعال می‌گردند
  const deactivate = useCallback((collection, id) => gateway.deactivate(collection, id), [gateway]);
  // ابطال اسناد مالی با ثبت سند معکوس و علت اجباری
  const reverse = useCallback((collection, id, reason) => gateway.reverse(collection, id, reason), [gateway]);
  // بارگذاری سند اصلی برای ویرایش، از همان موتور
  const loadForEdit = useCallback((module, record) => gateway.loadForEdit(module, record), [gateway]);

  const setCollection = useCallback((collection, updater) => {
    const current = gateway.snapshot()[collection] || [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    return gateway.replaceAll(collection, next);
  }, [gateway]);

  const updateSettings = useCallback((patch) => gateway.replaceAll('settings', {
    ...(gateway.snapshot().settings || {}),
    ...patch,
  }), [gateway]);

  // پاک‌سازی نمایشی فقط بخش‌های غیرحسابداری را خالی می‌کند؛ هیچ مشتری یا سندی حذف نمی‌شود
  const clear = useCallback(() => gateway.clearExcept(CLEAR_KEEP_KEYS), [gateway]);

  // بازیابی نمایشی: دادهٔ حسابداری از موتور دوباره خوانده می‌شود
  const restore = useCallback(async () => {
    await gateway.reset();
    setData(gateway.snapshot());
  }, [gateway]);

  const value = useMemo(
    () => ({
      data, gateway, status, error, retry: load,
      add, update, remove, deactivate, reverse, loadForEdit,
      setCollection, updateSettings, clear, restore,
    }),
    [data, gateway, status, error, load, add, update, remove, deactivate, reverse, loadForEdit, setCollection, updateSettings, clear, restore]
  );

  return <MobileDemoContext.Provider value={value}>{children}</MobileDemoContext.Provider>;
}

export function useMobileDemo() {
  const context = useContext(MobileDemoContext);
  if (!context) throw new Error('useMobileDemo must be used within MobileDemoProvider');
  return context;
}