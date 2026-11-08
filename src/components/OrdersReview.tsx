import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ordersQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Order = (typeof ordersQuery extends { queryFn?: (...args: never[]) => infer R } ? Awaited<R> : never);

export function OrdersReview() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === selectedId);

  async function deliver(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !details.trim() || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("deliver_order", { _id: selected.id, _details: details });
      if (error) throw error;
      setSelectedId(null);
      await qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Delivery saved — available in the customer's orders");
    } catch (error) {
      toast.error((error as { message?: string }).message ?? "Could not save delivery");
    } finally { setBusy(false); }
  }

  async function reject(id: string) {
    if (rejecting) return;
    setRejecting(id);
    try {
      const { error } = await supabase.rpc("review_order", { _id: id, _approve: false });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success("Order rejected — refunded");
    } catch (error) {
      toast.error((error as { message?: string }).message ?? "Could not reject order");
    } finally { setRejecting(null); }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Proxy orders</h2>
      {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-3">Date / Order</th><th className="px-3">Proxy</th><th className="px-3">Location</th><th className="px-3">Price</th><th className="px-3">Status</th><th className="px-3">Delivery</th></tr></thead>
            <tbody>{orders.map((o) => { const p = o.proxy as { ip: string; city: string; country: string }; return (
              <tr key={o.id} className="border-t border-border">
                <td className="whitespace-nowrap px-3 py-3">{new Date(o.created_at).toLocaleString()}<p className="mt-1 font-mono text-xs text-muted-foreground" title={o.id}>{o.id.slice(0, 8)}</p></td>
                <td className="px-3 font-mono text-xs">{p.ip}</td><td className="px-3">{p.city}, {p.country}</td>
                <td className="px-3">${Number(o.price).toFixed(2)}</td><td className="px-3">{o.delivered_at ? "Delivered" : o.status === "approved" ? "Awaiting delivery" : o.status === "rejected" ? "Rejected" : "Pending"}</td>
                <td className="px-3 py-3"><div className="flex items-center gap-2">
                  {o.status !== "rejected" && <Button size="sm" disabled={busy || rejecting !== null} onClick={() => { setSelectedId(o.id); setDetails(o.delivery_details ?? ""); }}>{o.delivered_at ? <Pencil /> : <PackageCheck />}{o.delivered_at ? "Edit delivery" : "Deliver"}</Button>}
                  {o.status === "pending" && <Button size="sm" variant="outline" disabled={busy || rejecting !== null} onClick={() => reject(o.id)}>{rejecting === o.id ? "Rejecting…" : "Reject"}</Button>}
                </div></td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open && !busy) setSelectedId(null); }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
          <DialogHeader><DialogTitle>{selected?.delivered_at ? "Edit delivery" : "Deliver order"}</DialogTitle><DialogDescription>Order {selected?.id.slice(0, 8)} · ${Number(selected?.price ?? 0).toFixed(2)}</DialogDescription></DialogHeader>
          <form onSubmit={deliver} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="delivery-details">Delivery details</Label><Textarea id="delivery-details" required rows={8} value={details} disabled={busy} onChange={(e) => setDetails(e.target.value)} placeholder={"Host:Port:Username:Password\nExpiry date\nAdditional notes"} className="resize-y font-mono text-sm" /></div>
            <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setSelectedId(null)}>Cancel</Button><Button type="submit" disabled={busy || !details.trim()}>{busy ? <Loader2 className="animate-spin" /> : <PackageCheck />}{busy ? "Saving…" : selected?.delivered_at ? "Save changes" : "Approve & deliver"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}