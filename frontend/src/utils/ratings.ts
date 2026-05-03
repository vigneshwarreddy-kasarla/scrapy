const ITEM_RATING_KEY = "fillos_item_ratings_v1";

type ItemRatingsMap = Record<string, number>;

function readAll(): ItemRatingsMap {
  try {
    const raw = localStorage.getItem(ITEM_RATING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: ItemRatingsMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= 5) out[k] = Math.round(n);
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: ItemRatingsMap): void {
  localStorage.setItem(ITEM_RATING_KEY, JSON.stringify(map));
}

export function getStoredItemRating(menuItemId: string): number | null {
  const map = readAll();
  const v = map[menuItemId];
  return typeof v === "number" ? v : null;
}

export function setStoredItemRating(menuItemId: string, rating: number): void {
  const map = readAll();
  map[menuItemId] = Math.max(1, Math.min(5, Math.round(rating)));
  writeAll(map);
}
