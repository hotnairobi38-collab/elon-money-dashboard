import { MOCK_PROXIES, type Proxy } from "./mock-proxies";

export function addToCart(items: Proxy[], proxy: Proxy) {
  return items.some((item) => item.id === proxy.id) ? items : [...items, proxy];
}
export function cartTotal(items: Proxy[]) {
  return items.reduce((sum, item) => sum + Math.round(item.price * 100), 0) / 100;
}
export function restoreCart(value: unknown): Proxy[] {
  if (!Array.isArray(value)) return [];
  return MOCK_PROXIES.filter((p) => value.includes(p.id));
}
export function normalizeDomain(value: string) {
  const url = new URL(value.includes("://") ? value.trim() : `https://${value.trim()}`);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname.includes(".")) throw new Error("Enter a valid website domain");
  return `${url.origin}/`;
}