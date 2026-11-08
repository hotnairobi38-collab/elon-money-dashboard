import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, depositsQuery, walletsQuery, ordersQuery, domainQuery } from "@/lib/queries";
import { WalletEditor } from "@/components/WalletEditor";
import { DomainEditor } from "@/components/DomainEditor";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — DeepShop" },
      { name: "description", content: "Review customer crypto deposits." },
      { property: "og:title", content: "Admin — DeepShop" },
      { property: "og:description", content: "Review customer crypto deposits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me.isAdmin) throw redirect({ to: "/dashboard" });
    await Promise.all([context.queryClient.ensureQueryData(domainQuery), context.queryClient.ensureQueryData(depositsQuery(true)), context.queryClient.ensureQueryData(walletsQuery), context.queryClient.ensureQueryData(ordersQuery)]);
  },
  component: Admin,
});

function OrdersReview() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const qc = useQueryClient();
  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_order", { _id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Order approved" : "Order rejected — refunded");
    qc.invalidateQueries();
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-bold">Proxy orders</h2>
      {orders.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p> : (
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="py-1">Date</th><th>Proxy</th><th>Location</th><th>Price</th><th>Status</th><th /></tr></thead>
          <tbody>{orders.map((o) => { const p = o.proxy as { ip: string; city: string; country: string }; return (
            <tr key={o.id} className="border-t border-border">
              <td className="py-2">{new Date(o.created_at).toLocaleString()}</td>
              <td className="font-mono text-xs">{p.ip}</td><td>{p.city}, {p.country}</td>
              <td>${Number(o.price).toFixed(2)}</td><td className="capitalize">{o.status}</td>
              <td className="space-x-2 text-right">{o.status === "pending" && (<>
                <button onClick={() => review(o.id, true)} className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Approve</button>
                <button onClick={() => review(o.id, false)} className="rounded-md border border-input px-2 py-1 text-xs">Reject</button>
              </>)}</td>
            </tr>); })}</tbody>
        </table>
      )}
    </div>
  );
}

function Admin() {
    const { data: deposits } = useSuspenseQuery(depositsQuery(true));
  const qc = useQueryClient();

  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_deposit", { _id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Approved — balance added" : "Rejected");
    qc.invalidateQueries();
  }

  return (
    <div>
      <main className="space-y-6">
        <DomainEditor />
        <OrdersReview />
        <WalletEditor />
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-bold text-foreground">Deposits</h1>
          {deposits.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No deposits yet.</p> : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-1">Date</th><th>Amount</th><th>Currency</th><th>Transaction</th><th>Status</th><th /></tr></thead>
              <tbody>{deposits.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="py-2">{new Date(d.created_at).toLocaleString()}</td>
                  <td>${Number(d.amount).toFixed(2)}</td><td>{d.currency}</td>
                  <td className="max-w-[180px] truncate font-mono text-xs">{d.tx_hash}</td>
                  <td className="capitalize">{d.status}</td>
                  <td className="space-x-2 text-right">{d.status === "pending" && (<>
                    <button onClick={() => review(d.id, true)} className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Approve</button>
                    <button onClick={() => review(d.id, false)} className="rounded-md border border-input px-2 py-1 text-xs">Reject</button>
                  </>)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
