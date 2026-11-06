import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Wallet, CircleDollarSign } from "lucide-react";
import { NoteBox } from "@/components/AppShell";
import { meQuery, ordersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SockGate Proxy" },
      { name: "description", content: "Your SockGate balance and orders." },
      { property: "og:title", content: "Dashboard — SockGate Proxy" },
      { property: "og:description", content: "Your SockGate balance and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(ordersQuery)]); },
  component: Dashboard,
});

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-card p-6">
      <p className="flex items-center gap-2 text-sm font-bold">{icon}{label}</p>
      <p className="mt-2 text-3xl">{value}</p>
      <p className="mt-2 text-sm text-success">{sub}</p>
    </div>
  );
}

function Dashboard() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: orders } = useSuspenseQuery(ordersQuery);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Stat icon={<Wallet className="h-4 w-4" />} label="Balance" value={`$ ${me.balance.toFixed(2)}`} sub="Balance in your Account" />
        <Stat icon={<CircleDollarSign className="h-4 w-4" />} label="Orders" value={String(orders.filter((o) => o.user_id === me.id).length)} sub="Your Total Orders" />
      </div>
      <NoteBox />
    </div>
  );
}
