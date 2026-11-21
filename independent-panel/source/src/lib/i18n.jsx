import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/config';

/**
 * ساختار چندزبانه‌سازی. زبان پیش‌فرض فارسی است.
 * کلیدها برای پوسته، ناوبری و برچسب‌های مشترک ترجمه شده‌اند؛
 * متن کامل صفحات در فاز بعد به کلیدهای ترجمه منتقل می‌شود (در نقشهٔ راه ثبت شده است).
 */
const DICTIONARIES = {
  fa: {
    'app.name': 'حساب صراف',
    'app.edition': 'نسخهٔ مرجع آزمایشی',
    'nav.operations': 'عملیات',
    'nav.definitions': 'تعاریف',
    'nav.accounting': 'حسابداری',
    'nav.management': 'مدیریت',
    'nav.customer': 'مشتری',
    'action.save': 'ذخیره',
    'action.cancel': 'انصراف',
    'action.new': 'جدید',
    'action.search': 'جستجو',
    'action.delete': 'حذف',
    'action.edit': 'ویرایش',
    'action.print': 'چاپ',
    'label.role': 'نقش فعال',
    'label.demo': 'محیط آزمایشی',
    'label.loading': 'در حال بارگذاری…',
    'label.empty': 'موردی ثبت نشده است',
    'label.total': 'جمع',
    'label.balance': 'مانده',
    'label.debit': 'بدهکار',
    'label.credit': 'بستانکار',
    'label.date': 'تاریخ',
    'label.description': 'شرح',
    'label.currency': 'ارز',
    'label.amount': 'مبلغ',
    'label.status': 'وضعیت',
    'label.customer': 'مشتری',
  },
  en: {
    'app.name': 'Hesab Sarraf',
    'app.edition': 'Reference preview build',
    'nav.operations': 'Operations',
    'nav.definitions': 'Definitions',
    'nav.accounting': 'Accounting',
    'nav.management': 'Management',
    'nav.customer': 'Customer',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.new': 'New',
    'action.search': 'Search',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.print': 'Print',
    'label.role': 'Active role',
    'label.demo': 'Preview environment',
    'label.loading': 'Loading…',
    'label.empty': 'No records yet',
    'label.total': 'Total',
    'label.balance': 'Balance',
    'label.debit': 'Debit',
    'label.credit': 'Credit',
    'label.date': 'Date',
    'label.description': 'Description',
    'label.currency': 'Currency',
    'label.amount': 'Amount',
    'label.status': 'Status',
    'label.customer': 'Customer',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEYS.language) || 'fa');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(() => {
    const dict = DICTIONARIES[lang] || DICTIONARIES.fa;
    return {
      lang,
      setLang,
      dir: lang === 'fa' ? 'rtl' : 'ltr',
      t: (key) => dict[key] ?? DICTIONARIES.fa[key] ?? key,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}