import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCart } from "@/lib/use-cart";
import { MOCK_PROXIES } from "@/lib/mock-proxies";

const [a, b] = MOCK_PROXIES;

describe("shared cart", () => {
  beforeEach(() => localStorage.clear());

  it("is the same cart on every page for the same user", () => {
    const shop = renderHook(() => useCart("u1"));
    const topBar = renderHook(() => useCart("u1"));
    act(() => { shop.result.current.add(a!); });
    expect(topBar.result.current.items).toEqual([a]);
  });

  it("does not add the same proxy twice", () => {
    const { result } = renderHook(() => useCart("u2"));
    act(() => { expect(result.current.add(a!)).toBe(true); });
    act(() => { expect(result.current.add(a!)).toBe(false); });
    expect(result.current.items).toHaveLength(1);
  });

  it("keeps carts separate between users", () => {
    const one = renderHook(() => useCart("u3"));
    const two = renderHook(() => useCart("u4"));
    act(() => { one.result.current.add(b!); });
    expect(two.result.current.items).toEqual([]);
  });

  it("retries checkout with the same ID so it can't charge twice, and changing the cart starts a new one", () => {
    const { result } = renderHook(() => useCart("u5"));
    act(() => { result.current.add(a!); });
    let first = "", second = "", third = "";
    act(() => { first = result.current.beginCheckout(); });
    act(() => { second = result.current.beginCheckout(); });
    expect(second).toBe(first);
    act(() => { result.current.add(b!); });
    act(() => { third = result.current.beginCheckout(); });
    expect(third).not.toBe(first);
  });
});
