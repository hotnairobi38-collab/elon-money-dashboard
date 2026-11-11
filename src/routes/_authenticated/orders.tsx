import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { MyOrders } from "@/components/MyOrders";
import { meQuery, ordersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [
    { title: "My Orders — DeepShop" },
    { name: "description", content: "Your purchased SOCKS5 proxies and delivery status." },
    { property: "og:title", content: "My Orders — DeepShop" },
    { property: "og:description", content: "Your purchased SOCKS5 proxies and delivery status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: (s: Record<string, unknown>): { placed?: string } =>
    typeof s.placed === "string" ? { placed: s.placed } : {},
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(ordersQuery)]); },
  component: OrdersPage,
});

function OrdersPage() {
  const { placed } = Route.useSearch();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      {placed && <PlacedSummary checkoutId={placed} />}
      <MyOrders highlight={placed} />
    </div>
  );
}

function PlacedSummary({ checkoutId }: { checkoutId: string }) {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const items = orders.filter((o) => o.checkout_id === checkoutId && o.user_id === me.id);
  if (!items.length) return null;
  const total = items.reduce((sum, o) => sum + Math.round(Number(o.price) * 100), 0) / 100;
  return (
    <div className="flex gap-4 rounded-xl border border-success/40 bg-success/10 p-5">
      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
      <div className="space-y-1">
        <p className="text-lg font-bold">Order complete</p>
        <p className="text-sm">
          You bought <b>{items.length} {items.length === 1 ? "proxy" : "proxies"}</b> for <b>${total.toFixed(2)}</b>, paid from your balance.
          Your balance is now <b className="text-success">${me.balance.toFixed(2)}</b>.
        </p>
        <p className="text-sm text-muted-foreground">
          Your proxy login details will appear below as soon as the order is delivered. <Link to="/shop" className="text-primary hover:underline">Keep shopping</Link>
        </p>
      </div>
    </div>
  );
}
