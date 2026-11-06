import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { domainQuery } from "@/lib/queries";
import { normalizeDomain } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export function DomainEditor() {
  const { data } = useSuspenseQuery(domainQuery);
  const [domain, setDomain] = useState(data);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const value = normalizeDomain(domain);
      const { error } = await supabase.from("site_settings").upsert({ id: "official_domain", official_domain: value });
      if (error) throw error;
      setDomain(value);
      await qc.invalidateQueries({ queryKey: ["official-domain"] });
      toast.success("Official domain saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save domain"); }
    finally { setBusy(false); }
  }
  return <section className="border-b border-border pb-6">
    <h2 className="text-lg font-bold">Official domain</h2>
    <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 text-sm">Website address<input required value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-muted px-3" /></label>
      <Button disabled={busy} type="submit">Save domain</Button>
    </form>
  </section>;
}