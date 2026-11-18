import React from 'react';

export default function Version21SandboxCustomer({ user, onLogout }) {
  return <main dir="rtl" className="min-h-screen w-full bg-slate-50 p-4 sm:p-8">
    <section className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold text-amber-700">محیط آزمایشی مشتری</p><h1 className="mt-1 text-2xl font-black text-slate-800">پنل مشتری</h1></div>
        <button onClick={onLogout} className="rounded-lg border px-4 py-2 text-sm">خروج</button>
      </div>
      <p className="mt-4 text-sm text-slate-600">خوش آمدید، {user?.full_name || user?.username || 'مشتری'}.</p>
      <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">
        این بخش به حساب مشتری اختصاص دارد. در این مرحله فقط مسیر ورود و جداسازی نقش فعال است؛ اطلاعات مالی واقعی بارگذاری نمی‌شود و امکانات کامل مشتری هنوز باید جداگانه پیاده‌سازی و آزمایش شود.
      </div>
    </section>
  </main>;
}
