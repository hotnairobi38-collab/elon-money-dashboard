import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Bitcoin, Check, Coins, Copy, Loader2, ShieldCheck, Wallet, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, walletsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/add-balance")({
  head: () => ({
    meta: [
      { title: "Top up — DeepShop" },
      { name: "description", content: "Top up your DeepShop balance with crypto." },
      { property: "og:title", content: "Top up — DeepShop" },
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

const field =
  "mt-2 block h-11 w-full rounded-lg border border-input bg-muted px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

const currencyIcon: Record<string, React.ReactNode> = {
  BTC: <Bitcoin className="h-5 w-5" />,
  LTC: <Coins className="h-5 w-5" />,
  USDT: <Zap className="h-5 w-5" />,
};

function Topup() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: wallets } = useSuspenseQuery(walletsQuery);
  const qc = useQueryClient();
  const [currency, setCurrency] = useState(wallets[0]?.currency ?? "");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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

  function copyAddress() {
    if (!w?.address) return;
    navigator.clipboard.writeText(w.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_24px_var(--glow)]">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Top up balance</h1>
          <p className="text-sm text-muted-foreground">Add funds with crypto — credited after manual confirmation.</p>
        </div>
      </div>

      {/* Step 1 — currency */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          Choose a currency
        </p>
        <div className="grid grid-cols-3 gap-3">
          {wallets.map((x) => (
            <button
              key={x.currency}
              onClick={() => setCurrency(x.currency)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                x.currency === currency
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_var(--glow)]"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {currencyIcon[x.currency] ?? <Coins className="h-5 w-5" />}
              {x.currency}
            </button>
          ))}
        </div>
      </section>

      {!w?.address ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Payments in {currency} aren't available yet. Please choose another currency.
        </div>
      ) : (
        <>
          {/* Step 2 — send payment */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              Send {currency} to this address
            </p>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <button
                  onClick={copyAddress}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4 text-left transition hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment address</span>
                    <span className="mt-1 block break-all font-mono text-sm text-primary md:text-base">{w.address}</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition group-hover:bg-primary/25">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" /> Confirmations
                    </p>
                    <p className="mt-1 text-2xl font-bold text-chart-3">{w.confirmations}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Coins className="h-3.5 w-3.5" /> Min. transaction
                    </p>
                    <p className="mt-1 text-2xl font-bold text-chart-3">{min} USD</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center rounded-xl border border-border bg-muted/40 p-4">
                <div className="rounded-lg bg-foreground p-2.5 shadow-[0_0_30px_var(--glow)]">
                  <QRCodeSVG value={w.address} size={150} />
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 — confirm */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              Already paid? Tell us about it
            </p>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Amount sent (USD)
                <input type="number" min={min} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} placeholder={`${min}.00`} />
              </label>
              <label className="text-sm font-medium">Transaction ID
                <input value={tx} onChange={(e) => setTx(e.target.value)} className={field} placeholder="e.g. 8f3a…c21d" />
              </label>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                After submitting you can close this page. Your balance is added once the transaction has at least {w.confirmations} confirmations.
              </p>
              <button
                disabled={busy}
                className="flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_var(--glow)] transition hover:brightness-110 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit payment
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
