// a1/components/v21/access/UsersAccessPanel.jsx — تب «مدیریت کاربران و دسترسی‌ها»
// فقط نمایش ساختار: هیچ کاربر، مجوز یا رکوردی ساخته و ذخیره نمی‌شود؛ هیچ اتصالی به پایگاه داده ندارد.
import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { DEMO_EMPLOYEES, emptyPermissions } from './accessDemoData';
import EmployeeListCard from './EmployeeListCard';
import EmployeeAccessCard from './EmployeeAccessCard';
import AddEmployeeCard from './AddEmployeeCard';

const newEmployee = ({ name, mobile }, index) => ({
  id: 'preview-' + index,
  name: name + ' (پیش‌نمایش)',
  username: 'preview.' + index,
  mobile: mobile || '—',
  role: 'employee',
  status: 'active',
  joined: 'امروز',
  lastSeen: 'بدون ورود',
  permissions: emptyPermissions(),
});

export default function UsersAccessPanel() {
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
  const [selectedId, setSelectedId] = useState(DEMO_EMPLOYEES[1]?.id || DEMO_EMPLOYEES[0].id);
  const [notice, setNotice] = useState('');

  const selected = employees.find(item => item.id === selectedId) || employees[0];

  const toggleStatus = () => {
    setEmployees(prev => prev.map(item => (
      item.id === selected.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item
    )));
    setNotice('پیش‌نمایش: وضعیت حساب فقط در همین صفحه تغییر کرد و ذخیره نشد.');
  };

  const togglePermission = (sectionKey, actionKey) => {
    setEmployees(prev => prev.map(item => {
      if (item.id !== selected.id || item.locked) return item;
      const current = item.permissions[sectionKey] || { view: false, create: false, edit: false, delete: false };
      const next = { ...current, [actionKey]: !current[actionKey] };
      // ثبت، ویرایش یا ابطال بدون مشاهده معنا ندارد؛ برداشتن مشاهده بقیه را هم برمی‌دارد
      if (actionKey === 'view' && !next.view) {
        next.create = false;
        next.edit = false;
        next.delete = false;
      }
      if (actionKey !== 'view' && next[actionKey]) next.view = true;
      return { ...item, permissions: { ...item.permissions, [sectionKey]: next } };
    }));
    setNotice('پیش‌نمایش: مجوز فقط در همین صفحه تغییر کرد؛ هیچ مجوزی ذخیره نشد.');
  };

  const addEmployee = (payload) => {
    const created = newEmployee(payload, employees.length);
    setEmployees(prev => [...prev, created]);
    setSelectedId(created.id);
  };

  return (
    <div className="space-y-3">
      <section className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1e4776] text-white"><ShieldCheck className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-1.5 text-sm font-extrabold text-[#1e4776]">
              مدیریت کاربران و دسترسی‌ها
              <span className="rounded-full border border-[#e6d9b8] bg-[#fdf8ec] px-1.5 py-0.5 text-[9px] font-medium text-[#8f7434]">نمایشی</span>
            </h2>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              رئیس صرافی از این تب کارمندان و مجوزهای همان صرافی را مدیریت می‌کند.
            </p>
          </div>
        </div>
        <p className="w-full rounded-lg border border-dashed border-[#d5e2f0] bg-[#f7fafd] px-2 py-1.5 text-[9.5px] leading-5 text-slate-500">
          <Info className="mr-1 inline h-3 w-3 text-slate-400" />
          همهٔ نام‌ها، شماره‌ها و مجوزهای این صفحه نمونه‌اند. هیچ حساب واقعی ساخته نمی‌شود، هیچ رمزی ثبت نمی‌شود و تغییری در پایگاه داده ذخیره نمی‌گردد.
        </p>
        {notice ? (
          <p role="status" className="w-full rounded-lg border border-[#cfe3f5] bg-[#eef6fd] px-2 py-1.5 text-[9.5px] leading-5 text-[#2a5477]">{notice}</p>
        ) : null}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <EmployeeListCard employees={employees} selectedId={selected.id} onSelect={setSelectedId} />
          <AddEmployeeCard onAdd={addEmployee} />
        </div>
        <EmployeeAccessCard
          employee={selected}
          onToggleStatus={toggleStatus}
          onTogglePermission={togglePermission}
        />
      </div>

      <p className="rounded-xl border border-[#d5e2f0] bg-[#f7fafd] px-3 py-2 text-[9.5px] leading-5 text-slate-500">
        در مرحلهٔ بعد این تب به عضویت کارمند در شناسهٔ صرافی وصل می‌شود تا هر رئیس فقط کارمندان و مجوزهای صرافی خودش را ببیند و همین مجوزها در لپ‌تاپ و موبایل یکسان اعمال شوند.
      </p>
    </div>
  );
}