import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, walletsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/add-balance")({
  head: () => ({
    meta: [
      { title: "Topup — DeepShop" },
      { name: "description", content: "Top up your DeepShop balance with crypto." },
      { property: "og:title", content: "Topup — DeepShop" },
      { property: "og:description", content: "Top up your DeepShop balance with crypto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(walletsQuery)]);
  },
  component: Topup,
});

const field = "mt-2 block h-10 w-full rounded-md border border-input bg-muted px-3";

function Topup() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: wallets } = useSuspenseQuery(walletsQuery);
  const qc = useQueryClient();
  const [currency, setCurrency] = useState(wallets[0]?.currency ?? "");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState("");
  const [busy, setBusy] = useState(false);
  const w = wallets.find((x) => x.currency === currency);
  const min = Number(w?.min_usd ?? 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt >= min)) { toast.error(`Minimum is ${min} USD`); return; }
    if (!tx.trim()) { toast.error("Enter the transaction ID"); return; }
    setBusy(true);
    const { error } = await supabase.from("deposits").insert({ user_id: me.id, amount: amt, currency, tx_hash: tx.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment submitted — waiting for confirmation");
    setAmount(""); setTx("");
    qc.invalidateQueries({ queryKey: ["deposits"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Topup</h1>

      <div className="flex flex-wrap gap-2">
        {wallets.map((x) => (
          <button key={x.currency} onClick={() => setCurrency(x.currency)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${x.currency === currency ? "bg-primary text-primary-foreground" : "border border-border"}`}>
            {x.currency}
          </button>
        ))}
      </div>

      <div className="rounded-md bg-success p-4 text-sm text-success-foreground">
        <p>Send any amount above the minimum to the address below, then submit the transaction ID. Money is credited after confirmation.</p>
        <p className="mt-1 font-bold">Only send {currency} to this address. Do not send below the minimum transaction amount!</p>
      </div>

      {!w?.address ? (
        <div className="rounded-xl bg-card p-6 text-muted-foreground">Payments in {currency} aren't available yet. Please choose another currency.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-card p-5 sm:col-span-2">
              <button onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Address copied"); }}
                className="flex max-w-full items-center gap-2 break-all text-left text-xl text-primary md:text-2xl">
                {w.address} <Copy className="h-4 w-4 shrink-0" />
              </button>
              <p className="mt-2">Payment Address</p>
            </div>
            <div className="rounded-xl bg-card p-5"><p className="text-2xl text-chart-3">{w.confirmations}</p><p className="mt-2">Required Confirmations</p></div>
            <div className="rounded-xl bg-card p-5"><p className="text-2xl text-chart-3">{min} USD</p><p className="mt-2">Min. Transaction</p></div>
          </div>
          <div className="flex items-center justify-center rounded-xl bg-card p-4">
            <div className="rounded bg-foreground p-2"><QRCodeSVG value={w.address} size={170} /></div>
          </div>
        </div>
      )}

      {w?.address && (
        <form onSubmit={submit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
          <p className="text-sm font-bold sm:col-span-2">Already paid? Tell us about it</p>
          <label className="text-sm font-medium">Amount sent (USD)
            <input type="number" min={min} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium">Transaction ID
            <input value={tx} onChange={(e) => setTx(e.target.value)} className={field} />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">After submitting you can close this page. Your balance is added once the transaction has at least {w.confirmations} confirmations.</p>
          <button disabled={busy} className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit payment
          </button>
        </form>
      )}
    </div>
  );
}
