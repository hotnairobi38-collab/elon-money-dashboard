import { describe, expect, it } from "vitest";
import { addToCart, cartTotal, normalizeDomain, restoreCart } from "@/lib/cart";
import { MOCK_PROXIES } from "@/lib/mock-proxies";

describe("Cart", () => {
  it("adds Buy selections to the cart without duplicates", () => {
    const proxy = MOCK_PROXIES[0];
    if (!proxy) throw new Error("Missing sample");
    expect(addToCart(addToCart([], proxy), proxy)).toEqual([proxy]);
  });
  it("charges the combined catalog prices at checkout", () => {
    const residential = MOCK_PROXIES.find((p) => p.type === "Residential");
    const mobile = MOCK_PROXIES.find((p) => p.type === "Mobile");
    if (!residential || !mobile) throw new Error("Missing samples");
    expect(cartTotal([residential, mobile])).toBe(4.73);
  });
  it("restores catalog IDs rather than trusting saved prices", () => {
    expect(restoreCart(["0", "0", "missing"])).toEqual([MOCK_PROXIES[0]]);
  });
  it("accepts an owner-entered domain", () => {
    expect(normalizeDomain("sockgate.example")).toBe("https://sockgate.example/");
    expect(() => normalizeDomain("javascript:alert(1)")).toThrow();
  });
});