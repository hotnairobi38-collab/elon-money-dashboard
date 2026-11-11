import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/queries";
import { useCart } from "@/lib/use-cart";
import { cartTotal } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — DeepShop" },
      { name: "description", content: "Review the SOCKS5 proxies in your cart and check out with your balance." },
      { property: "og:title", content: "Your Cart — DeepShop" },
      { property: "og:description", content: "Review your SOCKS5 proxies and check out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meQuery),
  component: CartPage,
});

function CartPage() {
  const { data: me } = useSuspenseQuery(meQuery);
  const cart = useCart(me.id);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const total = cartTotal(cart.items);
  const short = me.balance < total;

  async function checkout() {
    if (busy || !cart.items.length) return;
    setBusy(true);
    try {
      const requestId = cart.beginCheckout();
      const { error } = await supabase.rpc("checkout_cart", { _items: cart.items, _request_id: requestId });
      if (error) throw error;
      cart.clear();
      await qc.invalidateQueries();
      toast.success("Checkout complete — your orders are waiting for delivery");
      await navigate({ to: "/orders" });
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Checkout failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="h-6 w-6" />Your Cart</h1>
        <Link to="/shop" className="text-sm text-primary hover:underline">← Continue shopping</Link>
      </div>

      {!cart.items.length ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/shop">Browse proxies</Link></Button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {cart.items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-bold">{p.ip}</p>
                  <p className="text-sm text-muted-foreground">{p.city}, {p.region}, {p.country} · {p.isp} · {p.type}</p>
                </div>
                <span className="font-medium text-success">${p.price.toFixed(2)}</span>
                <Button variant="ghost" size="icon" disabled={busy} aria-label={`Remove ${p.ip}`} onClick={() => cart.remove(p.id)}><Trash2 /></Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span>{cart.items.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Your balance</span><span className={short ? "text-destructive" : "text-success"}>${me.balance.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
            {short ? (
              <>
                <p className="text-sm text-destructive">You need ${(total - me.balance).toFixed(2)} more to check out.</p>
                <Button className="w-full" onClick={() => navigate({ to: "/add-balance" })}>Top up balance</Button>
              </>
            ) : (
              <Button className="w-full" disabled={busy} onClick={checkout}>
                <ShoppingCart />{busy ? "Processing…" : `Checkout · $${total.toFixed(2)}`}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
