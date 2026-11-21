import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useRole } from '@/lib/role-context';
import EmptyState from '@/components/ui-kit/EmptyState';

export default function RequirePermission({ permission, children }) {
  const { can, roleLabel } = useRole();
  if (can(permission)) return children;

  return (
    <EmptyState
      icon={ShieldAlert}
      title="دسترسی این نقش مجاز نیست"
      description={`نقش فعال «${roleLabel}» به این بخش دسترسی ندارد. برای بررسی، نقش را از نوار بالا تغییر دهید.`}
    />
  );
}