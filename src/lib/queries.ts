import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOfficialDomain } from "./site-settings.functions";

export const domainQuery = queryOptions({ queryKey: ["official-domain"], queryFn: () => getOfficialDomain() });

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    return {
      id: u.user.id,
      username: profile?.username ?? "",
      balance: Number(profile?.balance ?? 0),
      isAdmin: !!roles?.some((r) => r.role === "admin"),
    };
  },
});

export const depositsQuery = (all: boolean) =>
  queryOptions({
    queryKey: ["deposits", all],
    queryFn: async () => {
      const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const walletsQuery = queryOptions({
  queryKey: ["wallets"],
  queryFn: async () => {
    const { data, error } = await supabase.from("wallets").select("*").order("currency");
    if (error) throw error;
    return data;
  },
});
