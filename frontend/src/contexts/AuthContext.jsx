import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, profileAPI } from '../services/api';

const IDLE_MS = 30 * 60 * 1000;

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const idleTimer = useRef(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!user) return;
    idleTimer.current = setTimeout(async () => {
      try {
        await authAPI.logout();
      } catch {
        /* ignore */
      }
      setUser(null);
    }, IDLE_MS);
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const userData = await profileAPI.getMyProfile();
        setUser(userData);
        setError(null);
      } catch {
        setUser(null);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [user, resetIdleTimer]);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      await authAPI.login(email, password);
      const userData = await profileAPI.getMyProfile();
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (firstName, lastName, email, password, phone = '') => {
    try {
      setIsLoading(true);
      setError(null);
      await authAPI.register(firstName, lastName, email, password, phone);
      await authAPI.login(email, password);
      const userData = await profileAPI.getMyProfile();
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (err) {
      console.error('Помилка під час виходу:', err);
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role_id,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
