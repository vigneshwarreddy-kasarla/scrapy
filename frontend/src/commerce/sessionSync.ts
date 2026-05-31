import { apiJson } from "../api/client";

const GUEST_CART_KEY = "fillos_guest_cart";
const GUEST_FAVORITES_KEY = "fillos_guest_favorites";
const CUSTOMER_CACHE_KEY = "fillos_customer_cache";

export type SyncLine = { menuItemId: string; quantity: number };
type CustomerCache = { cartLines: SyncLine[]; favoriteIds: string[] };

export function readGuestCart(): SyncLine[] {
  const raw = sessionStorage.getItem(GUEST_CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SyncLine[];
    return Array.isArray(parsed) ? parsed.filter((x) => x?.menuItemId && x.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function addGuestCartItem(menuItemId: string, quantity = 1): void {
  const lines = readGuestCart();
  const idx = lines.findIndex((x) => x.menuItemId === menuItemId);
  if (idx >= 0) lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + quantity };
  else lines.push({ menuItemId, quantity });
  sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("cart:changed"));
}

export function readGuestFavorites(): string[] {
  const raw = sessionStorage.getItem(GUEST_FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? [...new Set(parsed.filter(Boolean))] : [];
  } catch {
    return [];
  }
}

export function toggleGuestFavorite(menuItemId: string): boolean {
  const current = new Set(readGuestFavorites());
  const nextIsFavorite = !current.has(menuItemId);
  if (nextIsFavorite) current.add(menuItemId);
  else current.delete(menuItemId);
  sessionStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify([...current]));
  return nextIsFavorite;
}

export function writeCustomerCache(cache: CustomerCache): void {
  sessionStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(cache));
  window.dispatchEvent(new Event("cart:changed"));
}

export function readCustomerCache(): CustomerCache {
  const raw = sessionStorage.getItem(CUSTOMER_CACHE_KEY);
  if (!raw) return { cartLines: [], favoriteIds: [] };
  try {
    const parsed = JSON.parse(raw) as CustomerCache;
    return {
      cartLines: Array.isArray(parsed?.cartLines) ? parsed.cartLines : [],
      favoriteIds: Array.isArray(parsed?.favoriteIds) ? parsed.favoriteIds : [],
    };
  } catch {
    return { cartLines: [], favoriteIds: [] };
  }
}

export function addCustomerCacheCartItem(menuItemId: string, quantity = 1): void {
  const cache = readCustomerCache();
  const idx = cache.cartLines.findIndex((x) => x.menuItemId === menuItemId);
  if (idx >= 0) {
    cache.cartLines[idx] = { ...cache.cartLines[idx], quantity: cache.cartLines[idx].quantity + quantity };
  } else {
    cache.cartLines.push({ menuItemId, quantity });
  }
  writeCustomerCache(cache);
}

export function setCustomerCacheFavoriteIds(favoriteIds: string[]): void {
  const cache = readCustomerCache();
  writeCustomerCache({ ...cache, favoriteIds: [...new Set(favoriteIds)] });
}

export function toggleCustomerCacheFavorite(menuItemId: string): boolean {
  const cache = readCustomerCache();
  const favorites = new Set(cache.favoriteIds);
  const nextIsFavorite = !favorites.has(menuItemId);
  if (nextIsFavorite) favorites.add(menuItemId);
  else favorites.delete(menuItemId);
  writeCustomerCache({ ...cache, favoriteIds: [...favorites] });
  return nextIsFavorite;
}

export function clearGuestSessionData(): void {
  sessionStorage.removeItem(GUEST_CART_KEY);
  sessionStorage.removeItem(GUEST_FAVORITES_KEY);
  window.dispatchEvent(new Event("cart:changed"));
}

export async function mergeGuestDataOnLogin(): Promise<void> {
  const guestCart = readGuestCart();
  if (guestCart.length > 0) {
    await apiJson<unknown>("/api/v1/cart/merge", {
      method: "POST",
      body: JSON.stringify({ lines: guestCart }),
    });
  }
  const guestFavorites = readGuestFavorites();
  if (guestFavorites.length > 0) {
    await apiJson<unknown>("/api/v1/favorites", {
      method: "PUT",
      body: JSON.stringify({ menuItemIds: guestFavorites }),
    });
  }
  clearGuestSessionData();
}

export async function restoreCustomerCacheFromServer(): Promise<void> {
  const [cart, favorites] = await Promise.all([
    apiJson<{ lines: Array<{ menuItemId: string; quantity: number }> }>("/api/v1/cart"),
    apiJson<{ items: Array<{ menuItemId: string }> }>("/api/v1/favorites").catch(() => ({ items: [] })),
  ]);
  writeCustomerCache({
    cartLines: (cart.lines ?? []).map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
    favoriteIds: (favorites.items ?? []).map((x) => x.menuItemId),
  });
}

export async function flushCustomerCacheOnLogout(): Promise<void> {
  const cache = readCustomerCache();
  await apiJson<unknown>("/api/v1/cart", {
    method: "PUT",
    body: JSON.stringify({ lines: cache.cartLines }),
  });
  await apiJson<unknown>("/api/v1/favorites", {
    method: "PUT",
    body: JSON.stringify({ menuItemIds: cache.favoriteIds }),
  });
}

export function getCartTotalQuantity(token?: string | null): number {
  const lines = token ? readCustomerCache().cartLines : readGuestCart();
  return lines.reduce((acc, item) => acc + item.quantity, 0);
}
