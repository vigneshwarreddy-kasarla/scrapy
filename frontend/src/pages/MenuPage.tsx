import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { formatMoney } from "../utils/money";
import {
  addCustomerCacheCartItem,
  addGuestCartItem,
  setCustomerCacheFavoriteIds,
  toggleCustomerCacheFavorite,
  toggleGuestFavorite,
} from "../commerce/sessionSync";
import { useAuth } from "../context/AuthContext";

type Category = {
  id: string;
  name: string;
  displayOrder: number;
  imageUrl: string | null;
  active: boolean;
};

type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  discountedPrice: string | null;
  imageUrl: string | null;
  veg: boolean;
  available: boolean;
  preparationTime: number;
  calories: number | null;
  tags: string[];
  ingredients: string[];
  allergens: string[];
  weightGrams: number | null;
  displayOrder: number;
};

type ItemRatingSummary = { menuItemId: string; averageRating: string | null; reviewCount: number };
type SortMode = "popular" | "rating" | "price_low" | "price_high" | "prep";
type VegSubtype = "all_veg" | "pure_veg" | "egg";
type DietMode = "all" | "veg" | "nonveg";

export function MenuPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catId, setCatId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [itemRatings, setItemRatings] = useState<Record<string, ItemRatingSummary>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [dietMode, setDietMode] = useState<DietMode>("all");
  const [vegSubtype, setVegSubtype] = useState<VegSubtype>("all_veg");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortMode>("popular");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await apiJson<Category[]>("/api/v1/menu/categories", { auth: false });
        if (cancelled) return;
        setCategories(cats);
        setCatId((prev) => prev ?? (cats[0]?.id ?? null));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load menu");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setFavoriteIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson<{ items: Array<{ menuItemId: string }> }>("/api/v1/favorites");
        if (cancelled) return;
        const ids = new Set(res.items.map((x) => x.menuItemId));
        setFavoriteIds(ids);
        setCustomerCacheFavoriteIds([...ids]);
      } catch {
        if (!cancelled) setFavoriteIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const onFavoritesChanged = async () => {
      if (!token) return;
      try {
        const res = await apiJson<{ items: Array<{ menuItemId: string }> }>("/api/v1/favorites");
        const ids = new Set(res.items.map((x) => x.menuItemId));
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds(new Set());
      }
    };
    window.addEventListener("favorites:changed", onFavoritesChanged);
    return () => window.removeEventListener("favorites:changed", onFavoritesChanged);
  }, [token]);

  useEffect(() => {
    if (!catId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await apiJson<MenuItem[]>(`/api/v1/menu/categories/${catId}/items`, {
          auth: false,
        });
        if (cancelled) return;
        setItems(list);
        const ratings = await Promise.all(
          list.map((it) =>
            apiJson<ItemRatingSummary>(`/api/v1/reviews/items/${it.id}/summary`, { auth: false }).catch(
              () =>
                ({
                  menuItemId: it.id,
                  averageRating: null,
                  reviewCount: 0,
                }) as ItemRatingSummary
            )
          )
        );
        if (cancelled) return;
        const next: Record<string, ItemRatingSummary> = {};
        for (const r of ratings) next[r.menuItemId] = r;
        setItemRatings(next);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catId]);

  async function addToCart(menuItemId: string) {
    if (!token) {
      addGuestCartItem(menuItemId, 1);
      setError("Added for this session. Log in to sync cart.");
      return;
    }
    setBusy(menuItemId);
    setError(null);
    try {
      await apiJson<unknown>("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ menuItemId, quantity: 1 }),
      });
      addCustomerCacheCartItem(menuItemId, 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite(menuItemId: string) {
    if (!token) {
      const added = toggleGuestFavorite(menuItemId);
      window.dispatchEvent(new Event("favorites:changed"));
      setError(added ? "Saved for this session. Log in to sync favorites." : null);
      return;
    }
    const wasFavorite = favoriteIds.has(menuItemId);
    const next = new Set(favoriteIds);
    if (wasFavorite) next.delete(menuItemId);
    else next.add(menuItemId);
    setFavoriteIds(next);
    setBusy(menuItemId);
    setError(null);
    try {
      if (wasFavorite) {
        await apiJson<unknown>(`/api/v1/favorites/items/${menuItemId}`, { method: "DELETE" });
      } else {
        await apiJson<unknown>(`/api/v1/favorites/items/${menuItemId}`, { method: "POST" });
      }
      toggleCustomerCacheFavorite(menuItemId);
      window.dispatchEvent(new Event("favorites:changed"));
    } catch (e) {
      setFavoriteIds(new Set(favoriteIds));
      setError(e instanceof Error ? e.message : "Could not update favorite");
    } finally {
      setBusy(null);
    }
  }

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter((it) => {
      const rating = Number(itemRatings[it.id]?.averageRating ?? "0");
      const text = `${it.name} ${it.description ?? ""} ${(it.tags ?? []).join(" ")}`.toLowerCase();
      const tags = (it.tags ?? []).map((t) => String(t).toLowerCase());
      const hasEggHint =
        tags.some((t) => t.includes("egg")) ||
        (it.name ?? "").toLowerCase().includes("egg") ||
        (it.description ?? "").toLowerCase().includes("egg") ||
        (it.ingredients ?? []).some((ing) => ing.toLowerCase().includes("egg"));
      if (dietMode === "veg") {
        if (!it.veg) return false;
        if (vegSubtype === "pure_veg" && hasEggHint) return false;
        if (vegSubtype === "egg" && !hasEggHint) return false;
      }
      if (dietMode === "nonveg" && it.veg) return false;
      if (minRating > 0 && rating < minRating) return false;
      if (q && !text.includes(q)) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      const aRating = Number(itemRatings[a.id]?.averageRating ?? "0");
      const bRating = Number(itemRatings[b.id]?.averageRating ?? "0");
      const aPrice = Number(a.discountedPrice ?? a.price);
      const bPrice = Number(b.discountedPrice ?? b.price);
      const aPopular = itemRatings[a.id]?.reviewCount ?? 0;
      const bPopular = itemRatings[b.id]?.reviewCount ?? 0;

      switch (sortBy) {
        case "rating":
          return bRating - aRating;
        case "price_low":
          return aPrice - bPrice;
        case "price_high":
          return bPrice - aPrice;
        case "prep":
          return a.preparationTime - b.preparationTime;
        default:
          return bPopular - aPopular;
      }
    });
  }, [dietMode, items, itemRatings, minRating, query, sortBy, vegSubtype]);

  function previewTextForCard(it: MenuItem): string {
    const desc = it.description?.trim();
    if (desc) return desc;
    if (it.ingredients?.length) return `Ingredients: ${it.ingredients.join(", ")}`;
    if (it.tags?.length) return `Tags: ${it.tags.join(", ")}`;
    return "Tap card to view full details.";
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <section className="menu-browse-screen">
        <div className="menu-browse-head">
          <h2 className="h2">Menu</h2>
        </div>
        <section className="menu-category-rail">
          {categories.map((c) => (
            <Button key={c.id} type="button" className={c.id === catId ? "tab active" : "tab"} onClick={() => setCatId(c.id)}>
              {c.name}
            </Button>
          ))}
        </section>
        <section className="menu-filters">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes, tags..." />
            <div className="food-type-controls">
              <div className={`veg-combo ${dietMode === "veg" ? "active" : ""}`}>
                <button
                  type="button"
                  className="food-type-toggle veg"
                  onClick={() => setDietMode((m) => (m === "veg" ? "all" : "veg"))}
                  aria-pressed={dietMode === "veg"}
                >
                  <span className="veg-triangle" aria-hidden>
                    ▲
                  </span>
                  Veg
                </button>
                {dietMode === "veg" && (
                  <select value={vegSubtype} onChange={(e) => setVegSubtype(e.target.value as VegSubtype)}>
                    <option value="all_veg">All</option>
                    <option value="pure_veg">Pure veg</option>
                    <option value="egg">Egg</option>
                  </select>
                )}
              </div>
              <button
                type="button"
                className={`food-type-toggle nonveg ${dietMode === "nonveg" ? "active" : ""}`}
                onClick={() => setDietMode((m) => (m === "nonveg" ? "all" : "nonveg"))}
                aria-pressed={dietMode === "nonveg"}
              >
                <span className="nonveg-circle" aria-hidden>
                  ●
                </span>
                Non veg
              </button>
            </div>
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
              <option value={0}>All ratings</option>
              <option value={5}>5.0 and above</option>
              <option value={4.5}>4.5 and above</option>
              <option value={4}>4.0 and above</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)}>
              <option value="popular">Popular</option>
              <option value="rating">Top rated</option>
              <option value="price_low">Price: Low to high</option>
              <option value="price_high">Price: High to low</option>
              <option value="prep">Fast prep</option>
            </select>
        </section>
        <section className="grow">
          {visibleItems.length === 0 ? (
            <p className="muted">No matching items for current filters.</p>
          ) : (
            <ul className="cards">
              {visibleItems.map((it) => {
                const imageSrc = resolveMediaUrl(it.imageUrl);
                return (
                  <li key={it.id}>
                    <Card className="pixel-card menu-item-card">
                      <div
                        className="menu-item-hit"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/menu/items/${it.id}`)}
                        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/menu/items/${it.id}`);
                          }
                        }}
                      >
                      <button
                        type="button"
                        className={`menu-heart-btn ${favoriteIds.has(it.id) ? "active" : ""}`}
                        disabled={busy === it.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFavorite(it.id);
                        }}
                        aria-label={favoriteIds.has(it.id) ? `Remove ${it.name} from favorites` : `Add ${it.name} to favorites`}
                      >
                        {favoriteIds.has(it.id) ? "❤" : "♡"}
                      </button>
                      <div className="menu-item-image">
                        {imageSrc ? (
                          <img src={imageSrc} alt={it.name} />
                        ) : (
                          <div className="image-placeholder">No image</div>
                        )}
                      </div>
                      <div className="card-title">
                        <span className="menu-item-title">{it.name}</span>
                        {it.veg && <span className="pill veg">veg</span>}
                      </div>
                      <p className="small muted">
                        {itemRatings[it.id]?.reviewCount ? `${itemRatings[it.id].averageRating} ★` : "No ratings"} ·{" "}
                        {it.preparationTime} min
                      </p>
                      <p className="menu-card-preview">{previewTextForCard(it)}</p>
                      <p className="price">
                        {it.discountedPrice ? (
                          <>
                            <span className="strike">{formatMoney(it.price)}</span> {formatMoney(it.discountedPrice)}
                          </>
                        ) : (
                          formatMoney(it.price)
                        )}
                      </p>
                      <div className="menu-item-actions">
                        <Button
                          type="button"
                          disabled={!it.available || busy === it.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void addToCart(it.id);
                          }}
                        >
                          {busy === it.id ? "Adding…" : "Add to cart"}
                        </Button>
                      </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
