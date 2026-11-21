// Compatibility boundary for legacy, unrouted pages.
// The independent application has no Base44 SDK or hosted Base44 services.
const unavailable = async () => {
  throw new Error('این قابلیت به سرویس Base44 وابسته است و در نسخه مستقل فعال نیست.');
};

const authApi = new Proxy({
  logout: (shouldRedirect = true) => {
    try {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
    } catch { /* browser storage may be unavailable */ }
    if (shouldRedirect && typeof window !== 'undefined') window.location.replace('/login');
  },
  redirectToLogin: () => {
    if (typeof window !== 'undefined') window.location.replace('/login');
  },
  setToken: () => {
    throw new Error('نشست Base44 در نسخه مستقل پشتیبانی نمی‌شود.');
  },
}, {
  get(target, property) {
    return property in target ? target[property] : unavailable;
  },
});

const unavailableNamespace = new Proxy({}, { get: () => unavailable });
export const base44 = new Proxy({}, {
  get(_target, property) {
    return property === 'auth' ? authApi : unavailableNamespace;
  },
});
