import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthState, UserRole } from "../types";
import { supabase } from "./supabaseClient";

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return (await Promise.race([promise, timeoutPromise])) as T;
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

const clearSupabaseAuthStorage = () => {
  if (typeof window === "undefined") return;
  try {
    // Supabase v2 commonly stores tokens under keys like: sb-<project-ref>-auth-token
    // If these entries become corrupted, supabase.auth.getSession() may hang during refresh.
    for (const key of Object.keys(window.localStorage)) {
      if (key === "supabase.auth.token" || /^sb-.*-auth-token$/.test(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("clearSupabaseAuthStorage: failed", e);
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<void>;
  signup: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      console.log("checkAuth: starting...");

      const sessionResult = await withTimeout(supabase.auth.getSession(), 6000, "supabase.auth.getSession()");

      const {
        data: { session },
        error: sessionError,
      } = sessionResult as any;

      console.log("checkAuth: session retrieved", { session, sessionError });

      if (sessionError) throw sessionError;

      if (!session?.user) {
        console.log("checkAuth: no user in session");
        setState({ user: null, accessToken: null, isLoading: false });
        return;
      }

      // Fetch Profile
      console.log("checkAuth: fetching profile for", session.user.id);

      const profileResult = await withTimeout(supabase.from("profiles").select("*").eq("id", session.user.id).single(), 6000, "profiles.select(single)");

      const { data: profile, error: profileError } = profileResult as any;

      console.log("checkAuth: profile retrieved", { profile, profileError });

      if (profileError) {
        console.error("checkAuth: profile fetch error", profileError);
        // If profile missing but auth valid, user might be stuck.
        // But usually we just proceed with basic auth info if profile fails?
        // Or we fail auth? Let's treat it as logged in but maybe incomplete profile.
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.full_name || session.user.email!,
        avatarUrl: profile?.avatar_url,
        role: (profile?.role as UserRole) || UserRole.MEMBER,
        createdAt: profile?.created_at || new Date().toISOString(),
      };

      setState({ user, accessToken: session.access_token, isLoading: false });
      console.log("checkAuth: done");
    } catch (err) {
      console.error("Check auth error:", err);

      // If auth init hangs or session storage is corrupted, recover by clearing auth storage.
      // This prevents the app being stuck on the loading screen forever.
      const message = (err as any)?.message || "";
      if (message.includes("timed out")) {
        console.warn("checkAuth: timeout detected, clearing Supabase auth storage");
        clearSupabaseAuthStorage();
      }

      setState({ user: null, accessToken: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // We could optimize this to not re-fetch profile every time, but for now it's safe.
        // Also guard with a timeout so auth state changes can't freeze the UI.
        let profile: any = null;
        try {
          const profileResult = await withTimeout(supabase.from("profiles").select("*").eq("id", session.user.id).single(), 6000, "profiles.select(single) (onAuthStateChange)");
          profile = (profileResult as any)?.data ?? null;
        } catch (e) {
          console.warn("onAuthStateChange: profile fetch failed, continuing with basic session user", e);
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: profile?.full_name || session.user.email!,
          avatarUrl: profile?.avatar_url,
          role: (profile?.role as UserRole) || UserRole.MEMBER,
          createdAt: profile?.created_at || new Date().toISOString(),
        };
        setState({ user, accessToken: session.access_token, isLoading: false });
      } else {
        setState({ user: null, accessToken: null, isLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  const login = async (credentials: any) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log("authStore: Attempting login for", credentials.email);

      // Removed manual connection check as it was causing confusion/delays
      // and checking 'projects' table is not reliable for anonymous users.

      const start = performance.now();

      // 15s timeout for better UX
      const loginPromise = supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Login request timed out after 15s. Check network or Supabase status.")), 15000));

      const result = (await Promise.race([loginPromise, timeoutPromise])) as any;
      const { data, error } = result;

      const end = performance.now();
      console.log(`authStore: signInWithPassword took ${(end - start).toFixed(2)}ms`);

      if (error) {
        console.error("authStore: Login returned error:", error);
        throw error;
      }

      console.log("authStore: Login successful", data);
      // onAuthStateChange will handle state update
    } catch (err) {
      console.error("authStore: Login exception:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const signup = async (credentials: any) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
            role: credentials.role || "MEMBER",
          },
        },
      });

      if (error) throw error;

      // Check if session is missing (Email confirmation enabled on Supabase side)
      // We no longer auto-login. The user will be redirected to the login form.
      if (!data.session && data.user) {
        console.log("Signup successful. Waiting for manual login.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await supabase.auth.signOut();
    setState({ user: null, accessToken: null, isLoading: false });
  };

  return <AuthContext.Provider value={{ ...state, login, signup, logout, checkAuth }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
