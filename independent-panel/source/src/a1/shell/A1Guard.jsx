// a1/shell/A1Guard.jsx — معادل ProtectedRoute در سورس A1
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, HOME_BY_ROLE } from '@/a1/lib/demoAuth';

const normalize = (role) => (role === 'exchange' ? 'sarraaf' : role);

export default function A1Guard({ requiredRole, allowedRoles }) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f3f7fc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#164b87]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // نشست نمایشی از مسیر اصلی ساخته می‌شود تا ورود به هر بخش بدون نقش‌گزینی ممکن باشد.
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const role = normalize(user.role);
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />;
  }

  return <Outlet />;
}