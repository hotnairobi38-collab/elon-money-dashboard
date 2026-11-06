import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQuery, depositsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction History — SockGate Proxy" },
      { name: "description", content: "Your SockGate deposits and their status." },
      { property: "og:title", content: "Transaction History — SockGate Proxy" },
      { property: "og:description", content: "Your SockGate deposits and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(depositsQuery(false))]);
  },
  component: Transactions,
});

function Transactions() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data } = useSuspenseQuery(depositsQuery(false));
  const mine = data.filter((d) => d.user_id === me.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transaction History</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-5 py-3">Date</th><th>Amount</th><th>Currency</th><th>Status</th></tr>
          </thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-muted-foreground">No transactions yet.</td></tr>}
            {mine.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-5 py-4">{new Date(d.created_at).toLocaleString()}</td>
                <td>${Number(d.amount).toFixed(2)}</td><td>{d.currency}</td><td className="capitalize">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
