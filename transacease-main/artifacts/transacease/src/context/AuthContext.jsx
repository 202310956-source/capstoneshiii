import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUserRoleByEmail, loginUser, logoutUser, registerUser, subscribeToAuthChanges } from "../services/authService";

const AuthContext = createContext(null);

const mapFirebaseUser = (firebaseUser) => {
  if (!firebaseUser) {
    return null;
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName ?? "",
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
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setAuthError(null);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setAuthLoading(false);
        return;
      }

      try {
        const resolvedRole = await getUserRoleByEmail(firebaseUser.email);
        setUser(mapFirebaseUser(firebaseUser));
        setRole(resolvedRole);
      } catch (error) {
        console.error("Unable to resolve user role", error);
        setUser(mapFirebaseUser(firebaseUser));
        setRole("staff");
        setAuthError(error.message ?? "Unable to resolve account role.");
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, rememberMe = true) => {
    setAuthError(null);

    try {
      const { user: firebaseUser, role: resolvedRole } = await loginUser(email, password, rememberMe);
      const nextUser = mapFirebaseUser(firebaseUser);
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
      const { user: firebaseUser, role: resolvedRole } = await registerUser({
        name,
        email,
        password,
        role: nextRole,
      });
      const nextUser = mapFirebaseUser(firebaseUser);
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
    () => ({
      user,
      role,
      isAdmin: role === "admin",
      authLoading,
      authError,
      login,
      register,
      logout,
    }),
    [user, role, authLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
