import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQuery, ordersQuery } from "@/lib/queries";
import type { Proxy } from "@/lib/mock-proxies";

export function MyOrders({ highlight }: { highlight?: string } = {}) {
  const { data } = useSuspenseQuery(ordersQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const mine = data.filter((o) => o.user_id === me.id);
  if (!mine.length) return <p className="text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary">Browse proxies</Link>.</p>;
  return <div className="overflow-x-auto rounded-md border border-border">
    <table className="w-full text-sm">
      <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-3">Date</th><th className="px-3">Proxy</th><th className="px-3">Location</th><th className="px-3">Price</th><th className="px-3">Status</th><th className="px-3">Delivery</th></tr></thead>
      <tbody>{mine.map((o) => { const p = o.proxy as unknown as Proxy; return <tr key={o.id} className={`border-t border-border ${highlight && o.checkout_id === highlight ? "bg-success/5" : ""}`}>
        <td className="whitespace-nowrap px-3 py-3">{new Date(o.created_at).toLocaleString()}</td>
        <td className="px-3 font-mono">{p.ip}</td><td className="px-3">{p.city}, {p.region}, {p.country}</td>
        <td className="px-3">${Number(o.price).toFixed(2)}</td>
        <td className="px-3">{o.status === "pending" ? "Paid · awaiting delivery" : o.status === "rejected" ? "Rejected (refunded)" : o.delivered_at ? "Delivered" : "Awaiting delivery"}</td>
        <td className="px-3 py-3">{o.status === "approved" && o.delivery_details ? <div className="min-w-48 max-w-sm"><pre className="whitespace-pre-wrap break-all font-mono text-xs">{o.delivery_details}</pre>{o.delivered_at && <p className="mt-2 text-xs text-muted-foreground">Delivered {new Date(o.delivered_at).toLocaleString()}</p>}</div> : <span className="text-muted-foreground">{o.status === "rejected" ? "Not delivered" : "Pending delivery"}</span>}</td>
      </tr>; })}</tbody>
    </table>
  </div>;
}