import { createFileRoute } from "@tanstack/react-router";
import { MyOrders } from "@/components/MyOrders";
import { meQuery, ordersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [
    { title: "My Orders — DeepShop" },
    { name: "description", content: "Your purchased SOCKS5 proxies and approval status." },
    { property: "og:title", content: "My Orders — DeepShop" },
    { property: "og:description", content: "Your purchased SOCKS5 proxies and approval status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(ordersQuery)]); },
  component: () => <div className="space-y-6"><h1 className="text-2xl font-bold">My Orders</h1><MyOrders /></div>,
});