import { createFileRoute } from "@tanstack/react-router";

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

function Shop() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search Socks5</span>
        <span className="rounded-md border border-border px-4 py-2 text-sm font-medium">My Socks5</span>
      </div>
      <h1 className="text-2xl font-bold">Proxy Shop</h1>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-5">
        <label className="text-sm font-medium md:col-span-2">Country<select className={field}><option>United States</option><option>United Kingdom</option><option>Germany</option></select></label>
        <label className="text-sm font-medium">City<input placeholder="e.g. New York" className={field} /></label>
        <label className="text-sm font-medium">State<input placeholder="e.g. NY" className={field} /></label>
        <label className="text-sm font-medium">Zip<input placeholder="e.g. 10001" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">ISP<input placeholder="e.g. Comcast" className={field} /></label>
        <label className="text-sm font-medium md:col-span-2">Type<select className={field}><option>Any</option><option>Residential</option><option>Mobile</option></select></label>
        <label className="text-sm font-medium">Protocol<select className={field}><option>Any</option><option>TCP</option><option>UDP</option></select></label>
      </form>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
      <p className="text-sm text-muted-foreground">Found 0 proxies</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>{cols.map((c) => <th key={c} className="px-5 py-3">{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={cols.length} className="px-5 py-8 text-center text-muted-foreground">Proxies will appear here once the proxy provider is connected.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
