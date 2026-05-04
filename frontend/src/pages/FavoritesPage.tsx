import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { addCustomerCacheCartItem, setCustomerCacheFavoriteIds } from "../commerce/sessionSync";
import { formatMoney } from "../utils/money";

type FavoriteItem = {
  menuItemId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  discountedPrice: string | null;
  imageUrl: string | null;
  veg: boolean;
  available: boolean;
};

export function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiJson<{ items: FavoriteItem[] }>("/api/v1/favorites");
      setItems(res.items);
      setCustomerCacheFavoriteIds(res.items.map((x) => x.menuItemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load favorites");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      void load();
    };
    const onFavoritesChanged = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("favorites:changed", onFavoritesChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("favorites:changed", onFavoritesChanged);
    };
  }, [load]);

  async function addToCart(menuItemId: string) {
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

  async function removeFavorite(menuItemId: string) {
    setBusy(menuItemId);
    setError(null);
    try {
      await apiJson<unknown>(`/api/v1/favorites/items/${menuItemId}`, { method: "DELETE" });
      const next = items.filter((x) => x.menuItemId !== menuItemId);
      setItems(next);
      setCustomerCacheFavoriteIds(next.map((x) => x.menuItemId));
      window.dispatchEvent(new Event("favorites:changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove favorite");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="favorites-page">
      <h1>Favorites</h1>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p className="muted">
          No favorites yet. <Link to="/menu">Browse menu</Link>
        </p>
      ) : (
        <ul className="cards">
          {items.map((it) => {
            const imageSrc = resolveMediaUrl(it.imageUrl);
            return (
              <li key={it.menuItemId}>
                <Card className="pixel-card favorite-card">
                  <button
                    type="button"
                    className="menu-heart-btn active"
                    disabled={busy === it.menuItemId}
                    onClick={() => void removeFavorite(it.menuItemId)}
                    aria-label={`Remove ${it.name} from favorites`}
                  >
                    ❤
                  </button>
                  {imageSrc ? (
                    <img src={imageSrc} alt={it.name} className="favorite-thumb" />
                  ) : (
                    <div className="image-placeholder">No image</div>
                  )}
                  <div className="card-title">
                    <Link to={`/menu/items/${it.menuItemId}`}>{it.name}</Link>
                    {it.veg && <span className="pill veg">veg</span>}
                  </div>
                  {it.description && <p className="muted small">{it.description}</p>}
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
                      disabled={!it.available || busy === it.menuItemId}
                      onClick={() => void addToCart(it.menuItemId)}
                    >
                      {busy === it.menuItemId ? "Adding…" : "Add to cart"}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
