import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_DOMAIN = "https://deepshop.space/";

export const getOfficialDomain = createServerFn({ method: "GET" }).handler(async () => {
  // Runtime env first (Lovable hosting); build-time public values otherwise (e.g. Vercel with no env vars set).
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env["SUPABASE_URL"] || import.meta.env['VITE_SUPABASE_URL'];
  if (!key || !url) return FALLBACK_DOMAIN;
  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data, error } = await client.from("site_settings").select("official_domain").eq("id", "official_domain").maybeSingle();
    if (error) throw error;
    return data?.official_domain ?? FALLBACK_DOMAIN;
  } catch (e) {
    console.error("getOfficialDomain failed", e);
    return FALLBACK_DOMAIN;
  }
});
