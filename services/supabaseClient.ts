import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. " + "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. in a .env.local file at the project root), then restart the dev server.");
}

console.log("Initializing Supabase Client (Persistence: ON)");
console.log("Supabase URL:", supabaseUrl ? supabaseUrl.trim() : "MISSING");
console.log("Supabase Key provided:", supabaseAnonKey ? "YES" : "NO");

const fetchWithTimeout: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const timeoutMs = 3000;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const combinedSignal =
      init?.signal && "any" in AbortSignal
        ? // @ts-expect-error AbortSignal.any may be missing in older TS libs
          AbortSignal.any([init.signal, controller.signal])
        : (init?.signal ?? controller.signal);

    return await fetch(input, {
      ...init,
      // Avoid 304/ETag revalidation issues for API calls.
      cache: "no-store",
      signal: combinedSignal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const SUPABASE_SINGLETON_KEY = "__bitspace_supabase_client__";

type SupabaseClientType = ReturnType<typeof createClient>;

const existing = (globalThis as any)[SUPABASE_SINGLETON_KEY] as SupabaseClientType | undefined;

export const supabase: SupabaseClientType =
  existing ??
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      // Keep users logged in across refreshes and prevent access tokens expiring mid-session.
      persistSession: true,
      autoRefreshToken: true,
      // App uses HashRouter (#/...), so URL fragments are not auth callbacks.
      // Keeping this false avoids Supabase trying to parse the hash and hanging on init.
      detectSessionInUrl: false,
    },
  });

if (!existing) {
  (globalThis as any)[SUPABASE_SINGLETON_KEY] = supabase;
}
