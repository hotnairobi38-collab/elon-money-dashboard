import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShopHeader } from "@/components/ShopHeader";
import { meQuery, depositsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SockGate Proxy" },
      { name: "description", content: "Review customer crypto deposits." },
      { property: "og:title", content: "Admin — SockGate Proxy" },
      { property: "og:description", content: "Review customer crypto deposits." },
    ],
  }),
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me.isAdmin) throw redirect({ to: "/dashboard" });
    await context.queryClient.ensureQueryData(depositsQuery(true));
  },
  component: Admin,
});

function Admin() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: deposits } = useSuspenseQuery(depositsQuery(true));
  const qc = useQueryClient();

  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_deposit", { _id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Approved — balance added" : "Rejected");
    qc.invalidateQueries();
  }

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader username={me.username} balance={me.balance} isAdmin />
      <main className="mx-auto max-w-5xl px-4 py-8">
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
