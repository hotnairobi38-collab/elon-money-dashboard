import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShopHeader } from "@/components/ShopHeader";
import { meQuery, depositsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SockGate Proxy" },
      { name: "description", content: "Your SockGate balance, deposits and SOCKS5 proxies." },
      { property: "og:title", content: "Dashboard — SockGate Proxy" },
      { property: "og:description", content: "Manage your SockGate balance and proxies." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(depositsQuery(false)),
    ]);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: deposits } = useSuspenseQuery(depositsQuery(false));
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT (TRC20)");
  const [tx, setTx] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = deposits.filter((d) => d.user_id === me.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt > 0) || !tx.trim()) return toast.error("Enter an amount and transaction ID");
    setBusy(true);
    const { error } = await supabase.from("deposits").insert({ user_id: me.id, amount: amt, currency, tx_hash: tx.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deposit submitted — waiting for confirmation");
    setAmount(""); setTx("");
    qc.invalidateQueries({ queryKey: ["deposits"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader username={me.username} balance={me.balance} isAdmin={me.isAdmin} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Top up balance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send crypto, then submit the transaction ID. Balance is added once we confirm it.</p>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-sm text-foreground/80">Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3">
                <option>USDT (TRC20)</option><option>BTC</option><option>LTC</option>
              </select>
            </label>
            <label className="block text-sm text-foreground/80">Amount (USD)
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="block text-sm text-foreground/80">Transaction ID
              <input value={tx} onChange={(e) => setTx(e.target.value)} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <button disabled={busy} className="h-9 w-full rounded-md bg-primary text-sm text-primary-foreground disabled:opacity-60">Submit deposit</button>
          </form>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">SOCKS5 proxies</h2>
          <p className="mt-2 text-sm text-muted-foreground">The proxy catalog appears here once your proxy provider is connected.</p>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold text-foreground">Deposit history</h2>
          {mine.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No deposits yet.</p> : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-1">Date</th><th>Amount</th><th>Currency</th><th>Status</th></tr></thead>
              <tbody>{mine.map((d) => (
                <tr key={d.id} className="border-t border-border"><td className="py-2">{new Date(d.created_at).toLocaleString()}</td><td>${Number(d.amount).toFixed(2)}</td><td>{d.currency}</td><td className="capitalize">{d.status}</td></tr>
              ))}</tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
