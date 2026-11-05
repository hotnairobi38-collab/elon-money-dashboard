import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { walletsQuery } from "@/lib/queries";

const field = "mt-1 block h-9 w-full rounded-md border border-input bg-muted px-3 text-sm";

function Row({ w }: { w: { currency: string; address: string; min_usd: number; confirmations: number } }) {
  const qc = useQueryClient();
  const [address, setAddress] = useState(w.address);
  const [min, setMin] = useState(String(w.min_usd));
  const [conf, setConf] = useState(String(w.confirmations));
  async function save() {
    const { error } = await supabase.from("wallets")
      .update({ address: address.trim(), min_usd: Number(min) || 0, confirmations: Number(conf) || 1 })
      .eq("currency", w.currency);
    if (error) { toast.error(error.message); return; }
    toast.success(`${w.currency} saved`);
    qc.invalidateQueries({ queryKey: ["wallets"] });
  }
  return (
    <div className="grid items-end gap-3 border-t border-border py-3 md:grid-cols-[120px_1fr_110px_110px_auto]">
      <p className="font-medium">{w.currency}</p>
      <label className="text-xs text-muted-foreground">Address (empty = hidden)<input value={address} onChange={(e) => setAddress(e.target.value)} className={field} /></label>
      <label className="text-xs text-muted-foreground">Min USD<input type="number" value={min} onChange={(e) => setMin(e.target.value)} className={field} /></label>
      <label className="text-xs text-muted-foreground">Confirmations<input type="number" value={conf} onChange={(e) => setConf(e.target.value)} className={field} /></label>
      <button onClick={save} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">Save</button>
    </div>
  );
}

export function WalletEditor() {
  const { data } = useSuspenseQuery(walletsQuery);
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold">Payment addresses</h2>
      <p className="mb-2 text-sm text-muted-foreground">Customers see these on the Topup page.</p>
      {data.map((w) => <Row key={w.currency} w={{ ...w, min_usd: Number(w.min_usd) }} />)}
    </div>
  );
}
