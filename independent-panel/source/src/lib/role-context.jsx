import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/config';
import { ROLES, can as canDo } from '@/lib/rbac';

/**
 * نقش فعال در محیط آزمایشی. در نسخهٔ واقعی این مقدار از نشست کاربر می‌آید.
 */
const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.role);
    return ROLES[saved] ? saved : 'admin';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.role, role);
  }, [role]);

  const value = useMemo(
    () => ({
      role,
      setRole: setRoleState,
      roleLabel: ROLES[role]?.label || 'کاربر',
      isStaff: role !== 'customer',
      can: (permission) => canDo(role, permission),
    }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}