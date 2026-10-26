import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, healthApi, ApiError } from '../api/client';
import { tokenStore } from './tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Background cold-start health ping
  useEffect(() => {
    let timer = setTimeout(() => {
      setIsWakingUp(true);
    }, 4000);

    healthApi.check()
      .then(() => {
        clearTimeout(timer);
        setIsWakingUp(false);
      })
      .catch(() => {
        // Leave waking banner until service responds or subsequent requests succeed
      });

    return () => clearTimeout(timer);
  }, []);

  // Boot token refresh & profile fetch
  useEffect(() => {
    async function boot() {
      const storedRefreshToken = tokenStore.getRefreshToken();
      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        await tokenStore.refreshToken(async (rt) => {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error('Refresh failed');
          return json.data;
        });

        const meRes = await authApi.getMe();
        if (meRes.success && meRes.data) {
          setUser(meRes.data);
        }
      } catch (err) {
        tokenStore.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    boot();

    // Listen to tokenStore logouts from other tabs/events
    const unregister = tokenStore.onLogout(() => {
      setUser(null);
    });

    return () => unregister();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      return res.data.user;
    }
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    const res = await authApi.register({ email, password, name });
    if (res.success && res.data) {
      tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      return res.data.user;
    }
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStore.getRefreshToken();
    if (rt) {
      try {
        await authApi.logout(rt);
      } catch {}
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (name) => {
    const res = await authApi.updateMe(name);
    if (res.success && res.data) {
      setUser(res.data);
      return res.data;
    }
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const res = await authApi.changePassword({ currentPassword, newPassword });
    if (res.success && res.data) {
      tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
      return true;
    }
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await authApi.deleteAccount(password);
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isWakingUp,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
