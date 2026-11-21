import React, { createContext, useContext } from 'react';

// Compatibility-only provider. The independent preview uses DemoAuthProvider
// (IndexedDB/localStorage) and must never call a hosted authentication service.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const value = {
    user: null,
    isAuthenticated: false,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    logout: (shouldRedirect = true) => {
      if (shouldRedirect && typeof window !== 'undefined') window.location.replace('/login');
    },
    navigateToLogin: () => {
      if (typeof window !== 'undefined') window.location.replace('/login');
    },
    checkUserAuth: async () => null,
    checkAppState: async () => null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
