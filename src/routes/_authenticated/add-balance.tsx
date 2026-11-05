import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/add-balance")({
  head: () => ({
    meta: [
      { title: "Add Balance — SockGate Proxy" },
      { name: "description", content: "Top up your SockGate balance with crypto." },
      { property: "og:title", content: "Add Balance — SockGate Proxy" },
      { property: "og:description", content: "Top up your SockGate balance with crypto." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meQuery),
  component: AddBalance,
});

const field = "mt-2 block h-10 w-full rounded-md border border-input bg-muted px-3";

function AddBalance() {
  const { data: me } = useSuspenseQuery(meQuery);
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT (TRC20)");
  const [tx, setTx] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt > 0) || !tx.trim()) { toast.error("Enter an amount and transaction ID"); return; }
    setBusy(true);
    const { error } = await supabase.from("deposits").insert({ user_id: me.id, amount: amt, currency, tx_hash: tx.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit submitted — waiting for confirmation");
    setAmount(""); setTx("");
    qc.invalidateQueries({ queryKey: ["deposits"] });
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Add Balance</h1>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Send crypto, then submit the transaction ID. Your balance is added once we confirm it.</p>
        <label className="block text-sm font-medium">Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={field}>
            <option>USDT (TRC20)</option><option>BTC</option><option>LTC</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Amount (USD)
          <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium">Transaction ID
          <input value={tx} onChange={(e) => setTx(e.target.value)} className={field} />
        </label>
        <button disabled={busy} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">Submit deposit</button>
      </form>
    </div>
  );
}
