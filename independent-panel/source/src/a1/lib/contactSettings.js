// a1/lib/contactSettings.js — تنظیمات نوار تماس پایین صفحه
// آدرس وب‌سایت ثابت است و فقط نمایشش خاموش/روشن می‌شود؛ بقیهٔ موارد (ایمیل، تلفن، لینک‌ها)
// از داخل «تنظیمات» قابل ویرایش، افزودن و حذف هستند و در همین مرورگر نگه داشته می‌شوند.
import { useEffect, useState } from 'react';
import { LAPTOP_CONTACTS } from '@/a1/components/v21/laptopHomeConfig';

const STORAGE_KEY = 'a1-contact-settings';
const CHANGE_EVENT = 'a1-contact-settings-change';

export const FIXED_SITE_URL = 'https://hisabsarraf.new.tg';

const normalize = item => ({
  id: String(item?.id || ''),
  label: String(item?.label || ''),
  href: String(item?.href || ''),
});

export function defaultContactSettings() {
  const others = LAPTOP_CONTACTS
    .filter(item => item.href !== FIXED_SITE_URL)
    .map((item, index) => ({ id: `contact-${index + 1}`, label: item.label, href: item.href || '' }));
  return {
    showWebsite: true,
    items: [{ id: 'website', label: FIXED_SITE_URL, href: FIXED_SITE_URL, fixed: true }, ...others],
  };
}

export function loadContactSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !Array.isArray(saved.items)) return defaultContactSettings();
    const website = { id: 'website', label: FIXED_SITE_URL, href: FIXED_SITE_URL, fixed: true };
    const rest = saved.items
      .filter(item => item && item.id !== 'website')
      .map(normalize)
      .filter(item => item.id);
    return { showWebsite: saved.showWebsite !== false, items: [website, ...rest] };
  } catch {
    return defaultContactSettings();
  }
}

export function saveContactSettings(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ذخیرهٔ محلی در دسترس نیست؛ تنظیمات فقط تا پایان همین نشست می‌ماند
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

// مواردی که واقعاً در نوار پایین دیده می‌شوند (وب‌سایت فقط اگر نمایشش روشن باشد)
export function visibleContacts(settings) {
  return (settings?.items || [])
    .filter(item => (item.fixed ? settings.showWebsite : Boolean(item.label.trim() || item.href.trim())))
    .map(item => ({ ...item, label: item.label.trim(), href: item.href.trim() }));
}

export function useContactSettings() {
  const [settings, setSettings] = useState(loadContactSettings);
  useEffect(() => {
    const sync = () => setSettings(loadContactSettings());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return [settings, saveContactSettings];
}