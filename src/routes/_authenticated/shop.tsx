import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { MOCK_PROXIES } from "@/lib/mock-proxies";

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
const empty = { city: "", state: "", zip: "", isp: "", type: "Any" };

function Shop() {
  const [draft, setDraft] = useState(empty);
  const [f, setF] = useState(empty);
  const has = (a: string, b: string) => a.toLowerCase().includes(b.trim().toLowerCase());
  const list = useMemo(() => MOCK_PROXIES.filter((p) =>
    has(p.city, f.city) && has(p.region, f.state) && p.zip.startsWith(f.zip.trim()) && has(p.isp, f.isp) &&
    (f.type === "Any" || p.type === f.type)), [f]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search Socks5</span>
        <span className="rounded-md border border-border px-4 py-2 text-sm font-medium">My Socks5</span>
      </div>
      <h1 className="text-2xl font-bold">Proxy Shop</h1>
      <form id="search" onSubmit={(e) => { e.preventDefault(); setF(draft); }} className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-5">
        <label className="text-sm font-medium md:col-span-2">Country<select className={field}><option>United States</option></select></label>
        <label className="text-sm font-medium">City<input value={draft.city} onChange={set("city")} placeholder="e.g. New York" className={field} /></label>
        <label className="text-sm font-medium">State<input value={draft.state} onChange={set("state")} placeholder="e.g. Texas" className={field} /></label>
        <label className="text-sm font-medium">Zip<input value={draft.zip} onChange={set("zip")} placeholder="e.g. 10001" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">ISP<input value={draft.isp} onChange={set("isp")} placeholder="e.g. Comcast" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">Type<select value={draft.type} onChange={set("type")} className={field}><option>Any</option><option>Residential</option><option>Mobile</option></select></label>
        <label className="text-sm font-medium">Protocol<select className={field}><option>Any</option><option>UDP</option></select></label>
      </form>
      <button form="search" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
      <p className="text-sm text-primary">Found {list.length} proxies</p>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>{cols.map((c) => <th key={c} className="px-3 py-3">{c}</th>)}</tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={cols.length} className="px-5 py-8 text-center text-muted-foreground">No proxies match your search.</td></tr>}
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="px-3 py-4 font-bold">{p.ip}</td>
                <td className="px-3">{p.country}</td><td className="px-3">{p.city}</td><td className="px-3">{p.region}</td>
                <td className="px-3">{p.isp}</td><td className="px-3">{p.zip}</td><td className="px-3">{p.speed} Mbps</td>
                <td className="px-3">{p.type}</td><td className="px-3">{p.protocol}</td>
                <td className="px-3">
                  <button onClick={() => toast.info("Purchasing opens once the proxy provider is connected.")}
                    className="flex items-center gap-2 rounded-md bg-success px-4 py-2 font-bold text-success-foreground hover:opacity-90">
                    <ShoppingCart className="h-4 w-4" />${p.price.toFixed(2)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
