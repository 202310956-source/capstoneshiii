import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUserRole, loginUser, logoutUser, registerUser, subscribeToAuthChanges } from "../services/authService";

const AuthContext = createContext(null);

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.name ?? supabaseUser.email ?? "",
  };
};

export function useAuth() {
  return useContext(AuthContext) ?? {};
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (supabaseUser) => {
      setAuthError(null);
      if (!supabaseUser) {
        setUser(null);
        setRole(null);
        setAuthLoading(false);
        return;
      }
      try {
        const resolvedRole = await getUserRole(supabaseUser.id);
        setUser(mapSupabaseUser(supabaseUser));
        setRole(resolvedRole);
      } catch (error) {
        setUser(mapSupabaseUser(supabaseUser));
        setRole("staff");
        setAuthError(error.message ?? "Unable to resolve account role.");
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { user: supabaseUser, role: resolvedRole } = await loginUser(email, password);
      const nextUser = mapSupabaseUser(supabaseUser);
      setUser(nextUser);
      setRole(resolvedRole);
      return { user: nextUser, role: resolvedRole };
    } catch (error) {
      setAuthError(error.message ?? "Login failed.");
      throw error;
    }
  };

  const register = async ({ name, email, password, role: nextRole = "staff" }) => {
    setAuthError(null);
    try {
      const { user: supabaseUser, role: resolvedRole } = await registerUser({ name, email, password, role: nextRole });
      const nextUser = mapSupabaseUser(supabaseUser);
      setUser(nextUser);
      setRole(resolvedRole);
      return { user: nextUser, role: resolvedRole };
    } catch (error) {
      setAuthError(error.message ?? "Registration failed.");
      throw error;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
      setUser(null);
      setRole(null);
    } catch (error) {
      setAuthError(error.message ?? "Logout failed.");
      throw error;
    }
  };

  const value = useMemo(
    () => ({ user, role, isAdmin: role === "admin", authLoading, authError, login, register, logout }),
    [user, role, authLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
