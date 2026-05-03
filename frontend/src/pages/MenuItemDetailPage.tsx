import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card } from "pixel-retroui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { formatMoney } from "../utils/money";
import { getStoredItemRating, setStoredItemRating } from "../utils/ratings";
import {
  addCustomerCacheCartItem,
  addGuestCartItem,
  toggleCustomerCacheFavorite,
  toggleGuestFavorite,
} from "../commerce/sessionSync";
import { useAuth } from "../context/AuthContext";

type MenuItemDetail = {
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

type RatingSummary = {
  menuItemId: string;
  averageRating: string | null;
  reviewCount: number;
};

export function MenuItemDetailPage() {
  const { itemId } = useParams();
  const { token } = useAuth();
  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [rating, setRating] = useState<RatingSummary | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [myRating, setMyRating] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    (async () => {
      try {
        const [detail, summary] = await Promise.all([
          apiJson<MenuItemDetail>(`/api/v1/menu/items/${itemId}`, { auth: false }),
          apiJson<RatingSummary>(`/api/v1/reviews/items/${itemId}/summary`, { auth: false }).catch(() => null),
        ]);
        if (cancelled) return;
        setItem(detail);
        setRating(summary);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load item");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;
    setMyRating(getStoredItemRating(itemId) ?? 0);
  }, [itemId]);

  useEffect(() => {
    if (!itemId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson<{ items: Array<{ menuItemId: string }> }>("/api/v1/favorites");
        if (!cancelled) setFavorite(res.items.some((x) => x.menuItemId === itemId));
      } catch {
        if (!cancelled) setFavorite(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, token]);

  useEffect(() => {
    const onFavoritesChanged = async () => {
      if (!itemId || !token) return;
      try {
        const res = await apiJson<{ items: Array<{ menuItemId: string }> }>("/api/v1/favorites");
        setFavorite(res.items.some((x) => x.menuItemId === itemId));
      } catch {
        setFavorite(false);
      }
    };
    window.addEventListener("favorites:changed", onFavoritesChanged);
    return () => window.removeEventListener("favorites:changed", onFavoritesChanged);
  }, [itemId, token]);

  const displayPrice = useMemo(
    () => (item?.discountedPrice ? formatMoney(item.discountedPrice) : formatMoney(item?.price ?? "—")),
    [item]
  );
  const imageSrc = resolveMediaUrl(item?.imageUrl);

  async function addToCart() {
    if (!item) return;
    if (!token) {
      addGuestCartItem(item.id, 1);
      setError("Added for this session. Log in to sync cart.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiJson<unknown>("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ menuItemId: item.id, quantity }),
      });
      addCustomerCacheCartItem(item.id, quantity);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add item");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!item) return;
    if (!token) {
      setFavorite(toggleGuestFavorite(item.id));
      window.dispatchEvent(new Event("favorites:changed"));
      return;
    }
    const next = !favorite;
    setFavorite(next);
    setBusy(true);
    setError(null);
    try {
      if (next) {
        await apiJson<unknown>(`/api/v1/favorites/items/${item.id}`, { method: "POST" });
      } else {
        await apiJson<unknown>(`/api/v1/favorites/items/${item.id}`, { method: "DELETE" });
      }
      toggleCustomerCacheFavorite(item.id);
      window.dispatchEvent(new Event("favorites:changed"));
    } catch (e) {
      setFavorite(!next);
      setError(e instanceof Error ? e.message : "Could not update favorites");
    } finally {
      setBusy(false);
    }
  }

  function setItemRating(ratingValue: number) {
    if (!item) return;
    setMyRating(ratingValue);
    setStoredItemRating(item.id, ratingValue);
  }

  if (!item) {
    return (
      <div>
        <p className="muted">{error ? error : "Loading item…"}</p>
      </div>
    );
  }

  return (
    <div className="menu-detail-page">
      <Link to="/menu" className="button">
        Back to menu
      </Link>
      <Card className="pixel-card menu-detail-card">
        <div className="menu-detail-media">
          {imageSrc ? <img src={imageSrc} alt={item.name} /> : <div className="image-placeholder">No image</div>}
        </div>
        <div className="menu-detail-content">
          <div className="row spread">
            <h1>{item.name}</h1>
            <button
              type="button"
              className={`menu-heart-btn detail-heart ${favorite ? "active" : ""}`}
              disabled={busy}
              onClick={() => void toggleFavorite()}
              aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
            >
              {favorite ? "❤" : "♡"}
            </button>
          </div>
          <p className="muted">
            {rating && rating.reviewCount > 0 ? `Rating ${rating.averageRating} (${rating.reviewCount})` : "No ratings yet"} ·{" "}
            {item.preparationTime} min prep
          </p>
          <div className="menu-item-rate-box">
            <p className="small muted">Your item rating</p>
            <div className="star-row" role="radiogroup" aria-label="Rate this food item">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={v <= myRating ? "star-btn active" : "star-btn"}
                  onClick={() => setItemRating(v)}
                  aria-label={`${v} star${v > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
              <span className="small muted">{myRating > 0 ? `${myRating}/5` : "Not rated yet"}</span>
            </div>
          </div>
          {item.description && <p className="menu-detail-description">{item.description}</p>}
          <p className="price">
            {item.discountedPrice && <span className="strike">{formatMoney(item.price)}</span>} {displayPrice}
          </p>
          <p className="small muted menu-detail-meta">
            {item.weightGrams ? `${item.weightGrams}g` : "Weight N/A"} · {item.preparationTime} min ·{" "}
            {item.calories ?? "—"} kcal
          </p>
          {item.ingredients.length > 0 && (
            <p className="small menu-detail-block">
              <strong>Ingredients:</strong> {item.ingredients.join(", ")}
            </p>
          )}
          {item.allergens.length > 0 && (
            <p className="small menu-detail-block">
              <strong>Allergens:</strong> {item.allergens.join(", ")}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <div className="menu-detail-actions">
            <div className="qty-picker">
              <Button type="button" disabled={busy || quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </Button>
              <span>{quantity}</span>
              <Button type="button" disabled={busy || quantity >= 20} onClick={() => setQuantity((q) => Math.min(20, q + 1))}>
                +
              </Button>
            </div>
            <Button type="button" disabled={!item.available || busy} onClick={() => void addToCart()}>
              {busy ? "Please wait…" : item.available ? "Add to cart" : "Unavailable"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
