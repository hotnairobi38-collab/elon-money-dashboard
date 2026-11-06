import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_PROXIES, COUNTRIES, type Proxy } from "@/lib/mock-proxies";
import { meQuery, ordersQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { MyOrders } from "@/components/MyOrders";
import { addToCart, cartTotal, restoreCart } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Socks5 Shop — SockGate Proxy" },
      { name: "description", content: "Search and buy SOCKS5 proxies by country, city, ISP and type." },
      { property: "og:title", content: "Socks5 Shop — SockGate Proxy" },
      { property: "og:description", content: "Search and buy SOCKS5 proxies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shop,
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(ordersQuery)]); },
});

const field = "mt-2 block h-10 w-full rounded-md border border-input bg-muted px-3 placeholder:text-muted-foreground";
const cols = ["Proxy IP", "Country", "City", "Region", "ISP", "Zip", "Speed", "Type", "Protocol", "Buy"];
const empty = { country: "Any", city: "", state: "", zip: "", isp: "", type: "Any", protocol: "Any" };
const PAGE = 50;

function Shop() {
  const [tab, setTab] = useState<"search" | "cart" | "mine">("search");
  const { data: me } = useSuspenseQuery(meQuery);
  const [cart, setCart] = useState<Proxy[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const key = `sockgate-cart-${me.id}`;
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      setCart(restoreCart(saved?.ids));
      setRequestId(typeof saved?.requestId === "string" ? saved.requestId : null);
    } catch { setCart([]); setRequestId(null); }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify({ ids: cart.map((p) => p.id), requestId }));
  }, [cart, requestId, ready, key]);
  function add(p: Proxy) {
    if (cart.some((x) => x.id === p.id)) { toast.info("Already in your cart"); return; }
    setCart((items) => addToCart(items, p)); setRequestId(null);
    toast.success("Added to cart");
  }
  async function checkout() {
    if (busy || !cart.length) return;
    setBusy(true);
    const id = requestId ?? crypto.randomUUID();
    setRequestId(id);
    localStorage.setItem(key, JSON.stringify({ ids: cart.map((p) => p.id), requestId: id }));
    try {
      const { error } = await supabase.rpc("checkout_cart", { _items: cart, _request_id: id });
      if (error) throw error;
      setCart([]); setRequestId(null);
      localStorage.removeItem(key);
      await qc.invalidateQueries();
      toast.success("Checkout complete — orders waiting for admin approval");
      await navigate({ to: "/orders" });
    } catch (error) { toast.error(error instanceof Error ? error.message : (error as { message?: string }).message ?? "Checkout failed"); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        {(["search", "cart", "mine"] as const).map((t) => (
          <Button key={t} onClick={() => setTab(t)} variant={tab === t ? "default" : "outline"}>
            {t === "search" ? "Search Socks5" : t === "cart" ? `Cart (${cart.length})` : "My Orders"}
          </Button>
        ))}
      </div>
      {tab === "search" ? <Search add={add} cart={cart} ready={ready} /> : tab === "mine" ? <MyOrders /> : <section className="space-y-4">
        <h1 className="text-2xl font-bold">Cart</h1>
        {!cart.length ? <p className="text-muted-foreground">Your cart is empty.</p> : <>
          <div className="divide-y divide-border">{cart.map((p) => <div key={p.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1"><p className="font-mono">{p.ip}</p><p className="text-sm text-muted-foreground">{p.city}, {p.region}, {p.country} · {p.type}</p></div>
            <span>${p.price.toFixed(2)}</span>
            <Button variant="ghost" size="icon" disabled={busy} title="Remove proxy" aria-label={`Remove ${p.ip}`} onClick={() => { setCart(cart.filter((x) => x.id !== p.id)); setRequestId(null); }}><Trash2 /></Button>
          </div>)}</div>
          <p className="font-bold">Total: ${cartTotal(cart).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Balance: ${me.balance.toFixed(2)} · Sample proxies only</p>
          <Button disabled={busy} onClick={checkout}><ShoppingCart />{busy ? "Processing…" : `Checkout · $${cartTotal(cart).toFixed(2)}`}</Button>
          {me.balance < cartTotal(cart) && <Button variant="outline" onClick={() => navigate({ to: "/add-balance" })}>Top up balance</Button>}
        </>}
      </section>}
    </div>
  );
}

function Search({ add, cart, ready }: { add: (p: Proxy) => void; cart: Proxy[]; ready: boolean }) {
  const [draft, setDraft] = useState(empty);
  const [f, setF] = useState(empty);
  const [shown, setShown] = useState(PAGE);
  const has = (a: string, b: string) => a.toLowerCase().includes(b.trim().toLowerCase());
  const list = useMemo(() => MOCK_PROXIES.filter((p) =>
    (f.country === "Any" || p.country === f.country) &&
    has(p.city, f.city) && has(p.region, f.state) && p.zip.startsWith(f.zip.trim()) && has(p.isp, f.isp) &&
    (f.type === "Any" || p.type === f.type) && (f.protocol === "Any" || p.protocol === f.protocol)), [f]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value });

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
                  <Button disabled={!ready || cart.some((x) => x.id === p.id)} onClick={() => add(p)} aria-label={`Add ${p.ip} to cart`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-md bg-success px-4 py-2 font-bold text-success-foreground hover:opacity-90 disabled:opacity-60">
                    <ShoppingCart className="h-4 w-4" />{cart.some((x) => x.id === p.id) ? "In cart" : `$${p.price.toFixed(2)}`}
                  </Button>
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

