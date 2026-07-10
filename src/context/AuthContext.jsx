"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "bm_auth_user";
const USERS_KEY   = "bm_auth_users";

// ── Helpers ────────────────────────────────────────────────────────────────
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password) {
  // Simple deterministic hash (not cryptographic — fine for client-side demo)
  // Replace with bcrypt / a real backend for production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { name, email }
  const [loading, setLoading] = useState(true);   // hydrating from storage

  // Hydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // ── signup ───────────────────────────────────────────────────────────────
  const signup = useCallback((name, email, password) => {
    const users = loadUsers();
    const key   = email.trim().toLowerCase();

    if (users[key]) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const newUser = { name: name.trim(), email: key };
    users[key] = { ...newUser, passwordHash: hashPassword(password) };
    saveUsers(users);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return { ok: true };
  }, []);

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback((email, password) => {
    const users = loadUsers();
    const key   = email.trim().toLowerCase();
    const record = users[key];

    if (!record) {
      return { ok: false, error: "No account found with this email address." };
    }

    if (record.passwordHash !== hashPassword(password)) {
      return { ok: false, error: "Incorrect password. Please try again." };
    }

    const sessionUser = { name: record.name, email: record.email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { ok: true };
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
