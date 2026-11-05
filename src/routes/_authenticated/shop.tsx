import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_PROXIES, COUNTRIES, type Proxy } from "@/lib/mock-proxies";
import { ordersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Socks5 Shop — SockGate Proxy" },
      { name: "description", content: "Search and buy SOCKS5 proxies by country, city, ISP and type." },
      { property: "og:title", content: "Socks5 Shop — SockGate Proxy" },
      { property: "og:description", content: "Search and buy SOCKS5 proxies." },
    ],
  }),
  component: Shop,
});

const field = "mt-2 block h-10 w-full rounded-md border border-input bg-muted px-3 placeholder:text-muted-foreground";
const cols = ["Proxy IP", "Country", "City", "Region", "ISP", "Zip", "Speed", "Type", "Protocol", "Buy"];
const empty = { country: "Any", city: "", state: "", zip: "", isp: "", type: "Any", protocol: "Any" };
const PAGE = 50;

function Shop() {
  const [tab, setTab] = useState<"search" | "mine">("search");
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        {(["search", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "border border-border"}`}>
            {t === "search" ? "Search Socks5" : "My Socks5"}
          </button>
        ))}
      </div>
      {tab === "search" ? <Search /> : <MyOrders />}
    </div>
  );
}

function Search() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(empty);
  const [f, setF] = useState(empty);
  const [shown, setShown] = useState(PAGE);
  const [buying, setBuying] = useState<string | null>(null);
  const has = (a: string, b: string) => a.toLowerCase().includes(b.trim().toLowerCase());
  const list = useMemo(() => MOCK_PROXIES.filter((p) =>
    (f.country === "Any" || p.country === f.country) &&
    has(p.city, f.city) && has(p.region, f.state) && p.zip.startsWith(f.zip.trim()) && has(p.isp, f.isp) &&
    (f.type === "Any" || p.type === f.type) && (f.protocol === "Any" || p.protocol === f.protocol)), [f]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value });

  async function buy(p: Proxy) {
    if (!confirm(`Buy ${p.ip} (${p.city}, ${p.country}) for $${p.price.toFixed(2)}? The amount is taken from your balance.`)) return;
    setBuying(p.id);
    const { error } = await supabase.rpc("place_order", { _proxy: p, _price: p.price });
    setBuying(null);
    if (error) {
      toast.error(error.message, error.message.includes("balance") ? { action: { label: "Top up", onClick: () => location.assign("/add-balance") } } : undefined);
      return;
    }
    toast.success("Order placed — waiting for admin verification. See My Socks5.");
    qc.invalidateQueries();
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Proxy Shop</h1>
      <form id="search" onSubmit={(e) => { e.preventDefault(); setF(draft); setShown(PAGE); }} className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-5">
        <label className="text-sm font-medium md:col-span-2">Country
          <select value={draft.country} onChange={set("country")} className={field}>
            <option value="Any">All countries</option>
            {Object.entries(COUNTRIES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">City<input value={draft.city} onChange={set("city")} placeholder="e.g. New York" className={field} /></label>
        <label className="text-sm font-medium">State<input value={draft.state} onChange={set("state")} placeholder="e.g. Texas" className={field} /></label>
        <label className="text-sm font-medium">Zip<input value={draft.zip} onChange={set("zip")} placeholder="e.g. 10001" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">ISP<input value={draft.isp} onChange={set("isp")} placeholder="e.g. Comcast" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">Type<select value={draft.type} onChange={set("type")} className={field}><option>Any</option><option>Residential</option><option>Mobile</option></select></label>
        <label className="text-sm font-medium">Protocol<select value={draft.protocol} onChange={set("protocol")} className={field}><option>Any</option><option>UDP</option><option>TCP</option></select></label>
      </form>
      <button form="search" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
      <p className="text-sm text-primary">Found {list.length} proxies</p>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>{cols.map((c) => <th key={c} className="px-3 py-3">{c}</th>)}</tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={cols.length} className="px-5 py-8 text-center text-muted-foreground">No proxies match your search.</td></tr>}
            {list.slice(0, shown).map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="whitespace-nowrap px-3 py-4 font-bold">{p.ip}</td>
                <td className="px-3">{p.country}</td><td className="whitespace-normal px-3">{p.city}</td><td className="px-3">{p.region}</td>
                <td className="min-w-[150px] whitespace-normal px-3">{p.isp}</td><td className="px-3">{p.zip}</td><td className="px-3">{p.speed} Mbps</td>
                <td className="px-3">{p.type}</td><td className="px-3">{p.protocol}</td>
                <td className="px-3">
                  <button disabled={buying === p.id} onClick={() => buy(p)}
                    className="flex items-center gap-2 whitespace-nowrap rounded-md bg-success px-4 py-2 font-bold text-success-foreground hover:opacity-90 disabled:opacity-60">
                    <ShoppingCart className="h-4 w-4" />${p.price.toFixed(2)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < list.length && (
        <button onClick={() => setShown(shown + PAGE)} className="rounded-md border border-border px-4 py-2 text-sm">Load more ({list.length - shown} left)</button>
      )}
    </>
  );
}

function MyOrders() {
  const { data, isLoading } = useQuery(ordersQuery);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary">Buy a proxy</Link>.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs font-bold uppercase text-muted-foreground"><tr><th className="px-3 py-3">Date</th><th>Proxy</th><th>Location</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>{data.map((o) => { const p = o.proxy as unknown as Proxy; return (
          <tr key={o.id} className="border-t border-border">
            <td className="px-3 py-3">{new Date(o.created_at).toLocaleString()}</td>
            <td className="font-mono">{p.ip}</td><td>{p.city}, {p.region}, {p.country}</td>
            <td>${Number(o.price).toFixed(2)}</td>
            <td className="capitalize">{o.status === "pending" ? "Waiting for verification" : o.status === "rejected" ? "Rejected (refunded)" : "Approved"}</td>
          </tr>); })}</tbody>
      </table>
    </div>
  );
}
