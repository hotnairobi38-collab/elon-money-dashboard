import { useCallback, useMemo, useSyncExternalStore } from "react";
import { addToCart, restoreCart } from "./cart";
import type { Proxy } from "./mock-proxies";

type CartState = { ids: string[]; requestId: string | null };
const EMPTY: CartState = { ids: [], requestId: null };
const listeners = new Set<() => void>();
let cache: { key: string; state: CartState } | null = null;

const storageKey = (userId: string) => `sockgate-cart-${userId}`;

function read(key: string): CartState {
  if (cache?.key === key) return cache.state;
  let state = EMPTY;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    state = {
      ids: restoreCart(saved?.ids).map((p) => p.id),
      requestId: typeof saved?.requestId === "string" ? saved.requestId : null,
    };
  } catch { /* corrupt storage → empty cart */ }
  cache = { key, state };
  return state;
}

function write(key: string, state: CartState) {
  cache = { key, state };
  if (state.ids.length || state.requestId) localStorage.setItem(key, JSON.stringify(state));
  else localStorage.removeItem(key);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => { if (e.key?.startsWith("sockgate-cart-")) { cache = null; listener(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

/** One cart shared by every page (top bar, shop, cart page), saved per signed-in user. */
export function useCart(userId: string | undefined) {
  const key = userId ? storageKey(userId) : null;
  const state = useSyncExternalStore(subscribe, () => (key ? read(key) : EMPTY), () => EMPTY);
  const items = useMemo(() => restoreCart(state.ids), [state.ids]);

  const add = useCallback((p: Proxy) => {
    if (!key) return false;
    const cur = read(key);
    if (cur.ids.includes(p.id)) return false;
    write(key, { ids: addToCart(restoreCart(cur.ids), p).map((x) => x.id), requestId: null });
    return true;
  }, [key]);
  const remove = useCallback((id: string) => {
    if (key) write(key, { ids: read(key).ids.filter((x) => x !== id), requestId: null });
  }, [key]);
  const clear = useCallback(() => { if (key) write(key, EMPTY); }, [key]);
  /** Reuses the pending checkout ID so a retried checkout can never charge twice. */
  const beginCheckout = useCallback(() => {
    if (!key) throw new Error("Not signed in");
    const cur = read(key);
    const requestId = cur.requestId ?? crypto.randomUUID();
    write(key, { ...cur, requestId });
    return requestId;
  }, [key]);

  return { items, ids: state.ids, add, remove, clear, beginCheckout };
}
