import { describe, expect, it } from "vitest";
import { MOCK_PROXIES } from "@/lib/mock-proxies";

// Explicitly opted-in live check; requests use a minted, approved admin session.
const url = process.env['SHOP_TEST_URL'];
const key = process.env['SHOP_TEST_KEY'];
const token = process.env['SHOP_TEST_TOKEN'];
const userId = process.env['SHOP_TEST_USER'];
const live = url && key && token && userId ? describe : describe.skip;
async function request(path: string, body?: unknown) {
  const result = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { apikey: key ?? "", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await result.text();
  return { ok: result.ok, data: text ? JSON.parse(text) : null };
}
async function balance() {
  const response = await request(`profiles?id=eq.${userId}&select=balance`);
  if (!response.ok) throw new Error("Could not read test balance");
  return Number(response.data[0].balance);
}
live("Live checkout rules", () => {
  it("charges trusted prices once, stores orders, and refunds rejection once", async () => {
    const start = await balance();
    const id = crypto.randomUUID();
    const items = MOCK_PROXIES.slice(0, 2).map((p) => ({ ...p, price: 0.01 }));
    const checkout = await request("rpc/checkout_cart", { _items: items, _request_id: id });
    expect(checkout.ok).toBe(true);
    if (!checkout.ok) return;
    const orders = await request(`orders?checkout_id=eq.${id}&select=id,price,status`);
    try {
      expect(orders.data).toHaveLength(2);
      expect(orders.data.map((o: { price: number }) => Number(o.price))).toEqual([2.7, 2.7]);
      expect(await balance()).toBe(Number((start - 5.4).toFixed(2)));
      expect((await request("rpc/checkout_cart", { _items: items, _request_id: id })).ok).toBe(true);
      expect(await balance()).toBe(Number((start - 5.4).toFixed(2)));
    } finally {
      for (const order of orders.data) {
        expect((await request("rpc/review_order", { _id: order.id, _approve: false })).ok).toBe(true);
        expect((await request("rpc/review_order", { _id: order.id, _approve: false })).ok).toBe(false);
      }
    }
    expect(await balance()).toBe(start);
  });
  it("rejects an invalid cart without taking balance", async () => {
    const start = await balance();
    expect((await request("rpc/checkout_cart", { _items: [{ id: "999" }], _request_id: crypto.randomUUID() })).ok).toBe(false);
    expect(await balance()).toBe(start);
  });
});