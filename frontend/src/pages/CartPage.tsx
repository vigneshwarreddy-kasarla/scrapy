import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, TextArea } from "../components/ui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { readCustomerCache, writeCustomerCache } from "../commerce/sessionSync";
import { formatMoney } from "../utils/money";
import { MapAddressPicker, type GeoAddress } from "../components/MapAddressPicker";

type CartLine = {
  lineId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

type Cart = { cartId: string; lines: CartLine[]; subtotal: string };
type MenuItemLite = { id: string; imageUrl: string | null; preparationTime: number };
type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};
type OrderResponse = {
  orderId: string;
  status: string;
  lines: unknown[];
  total: string;
  createdAt: string;
  deliveryAddressSnapshot: string | null;
  paymentStatus: string;
  paidAt: string | null;
  customerNote: string | null;
};
type CouponValidationResponse = {
  valid: boolean;
  message: string;
  discountPercent: number | null;
  expiresAt: string | null;
};

/** A transient address created from a map pin (not saved to DB, just for this order) */
type PinnedAddress = {
  label: "📍 Pinned location";
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [metaByItem, setMetaByItem] = useState<Record<string, MenuItemLite>>({});
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [pinnedAddress, setPinnedAddress] = useState<PinnedAddress | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMobile, setCouponMobile] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await apiJson<Cart>("/api/v1/cart");
      setCart(c);
      const cache = readCustomerCache();
      writeCustomerCache({
        cartLines: c.lines.map((ln) => ({ menuItemId: ln.menuItemId, quantity: ln.quantity })),
        favoriteIds: cache.favoriteIds,
      });
      const metas = await Promise.all(
        c.lines.map((ln) =>
          apiJson<MenuItemLite>(`/api/v1/menu/items/${ln.menuItemId}`, { auth: false }).catch(() => null)
        )
      );
      const byId: Record<string, MenuItemLite> = {};
      for (const m of metas) {
        if (m) byId[m.id] = m;
      }
      setMetaByItem(byId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cart");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiJson<Address[]>("/api/v1/users/me/addresses");
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault);
        if (def) setAddressId(def.id);
        else if (list.length === 1) setAddressId(list[0].id);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setQty(lineId: string, quantity: number) {
    setError(null);
    try {
      await apiJson<unknown>(`/api/v1/cart/items/${lineId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function removeLine(lineId: string) {
    setError(null);
    try {
      await apiJson<unknown>(`/api/v1/cart/items/${lineId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    const phoneDigits = couponMobile.replace(/\D/g, "");
    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("Enter a coupon code.");
      return;
    }
    try {
      const isGuestCouponValidation = phoneDigits.length >= 10;
      const res = await apiJson<CouponValidationResponse>(
        isGuestCouponValidation ? "/api/v1/games/soccer/guest/validate-coupon" : "/api/v1/games/soccer/validate-coupon",
        {
          method: "POST",
          body: JSON.stringify(isGuestCouponValidation ? { code, mobileNumber: phoneDigits } : { code }),
          auth: !isGuestCouponValidation,
        }
      );
      if (!res.valid) {
        setAppliedCoupon(null);
        setCouponMessage(res.message);
        return;
      }
      setAppliedCoupon(code);
      setCouponMessage(`Coupon ${code} applied (${res.discountPercent}% off).`);
    } catch {
      setAppliedCoupon(null);
      setCouponMessage("Coupon is invalid or expired.");
    }
  }

  /** Called when user pins a location on the map */
  function handleMapPin(geo: GeoAddress) {
    setPinnedAddress({
      label: "📍 Pinned location",
      line1: geo.line1,
      city: geo.city,
      region: geo.region,
      postalCode: geo.postalCode,
      country: geo.country,
    });
    // Clear saved-address selection when using a pin
    setAddressId("__pinned__");
    setShowMapPicker(false);
  }

  async function placeOrder(ev: FormEvent) {
    ev.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};

      if (addressId === "__pinned__" && pinnedAddress) {
        // Build a one-line snapshot string for the backend — no addressId sent
        const snap = [
          pinnedAddress.line1,
          pinnedAddress.city,
          pinnedAddress.region,
          pinnedAddress.postalCode,
          pinnedAddress.country,
        ]
          .filter(Boolean)
          .join(", ");
        body.deliveryAddressSnapshot = snap;
      } else if (addressId) {
        body.deliveryAddressId = addressId;
      }

      const note = customerNote.trim();
      if (note) body.customerNote = note;
      const order = await apiJson<OrderResponse>("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      navigate(`/orders/${order.orderId}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart) {
    return <p className="muted">Loading cart…</p>;
  }

  return (
    <div>
      <h1>Cart</h1>
      {error && <p className="error">{error}</p>}

      {/* Map picker overlay */}
      {showMapPicker && (
        <MapAddressPicker
          onSelect={handleMapPin}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {cart.lines.length === 0 ? (
        <p className="muted">
          Cart is empty. <Link to="/menu">Browse menu</Link>
        </p>
      ) : (
        <>
          <div className="cart-layout">
            <div className="cart-lines">
              {cart.lines.map((ln) => {
                const imageSrc = resolveMediaUrl(metaByItem[ln.menuItemId]?.imageUrl);
                return (
                  <Card key={ln.lineId} className="pixel-card cart-line-card">
                    <div className="cart-line-media">
                      {imageSrc ? <img src={imageSrc} alt={ln.name} /> : <div className="image-placeholder">No image</div>}
                    </div>
                    <div className="cart-line-content">
                      <div className="row spread">
                        <strong>{ln.name}</strong>
                        <span className="price">{formatMoney(ln.lineTotal)}</span>
                      </div>
                      <p className="small muted">
                        {metaByItem[ln.menuItemId]?.preparationTime ?? 15} min prep · {formatMoney(ln.unitPrice)} each
                      </p>
                      <div className="cart-line-actions">
                        <div className="cart-qty-stepper">
                          <Button type="button" onClick={() => void setQty(ln.lineId, Math.max(1, ln.quantity - 1))}>
                            -
                          </Button>
                          <span className="cart-qty-value">{ln.quantity}</span>
                          <Button type="button" onClick={() => void setQty(ln.lineId, Math.min(99, ln.quantity + 1))}>
                            +
                          </Button>
                        </div>
                        <Button type="button" onClick={() => void removeLine(ln.lineId)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="pixel-card cart-summary-card cart-right-panel">
              <h2 className="h2">Cart Checkout</h2>
              <p className="row spread">
                <span>Items</span>
                <strong>{cart.lines.length}</strong>
              </p>
              <p className="row spread">
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotal)}</strong>
              </p>

              <form className="stack checkout-form cart-checkout-form" onSubmit={(e) => void placeOrder(e)}>

                {/* ── Delivery Address Section ── */}
                <div className="address-section">
                  <div className="address-section-header">
                    <span className="small muted">Delivery address</span>
                    <button
                      type="button"
                      className="btn-map-pick"
                      onClick={() => setShowMapPicker(true)}
                      title="Pin delivery location on map"
                    >
                      🗺️ Pin on Map
                    </button>
                  </div>

                  {/* Pinned-location badge */}
                  {addressId === "__pinned__" && pinnedAddress && (
                    <div className="pinned-badge">
                      <span>📍</span>
                      <span className="small">
                        {[pinnedAddress.line1, pinnedAddress.city, pinnedAddress.postalCode].filter(Boolean).join(", ")}
                      </span>
                      <button
                        type="button"
                        className="linkish small"
                        onClick={() => { setAddressId(""); setPinnedAddress(null); }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Saved address card strip */}
                  {addresses.length > 0 && addressId !== "__pinned__" && (
                    <div className="saved-addr-strip">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={`saved-addr-card${addressId === a.id ? " saved-addr-card--active" : ""}`}
                          onClick={() => setAddressId(a.id)}
                          title={[a.line1, a.city, a.postalCode].filter(Boolean).join(", ")}
                        >
                          <span className="saved-addr-icon">🏠</span>
                          <span className="saved-addr-label">{a.label || "Address"}</span>
                          <span className="saved-addr-detail small muted">
                            {[a.line1, a.city].filter(Boolean).join(", ")}
                          </span>
                          {a.isDefault && <span className="pill pill-sm">default</span>}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="saved-addr-card saved-addr-card--none"
                        onClick={() => setAddressId("")}
                      >
                        <span className="saved-addr-icon">✕</span>
                        <span className="saved-addr-label">None</span>
                      </button>
                    </div>
                  )}

                  {addresses.length === 0 && addressId !== "__pinned__" && (
                    <p className="small muted">
                      No saved addresses.{" "}
                      <Link to="/profile">Add one in profile</Link> or pin on map above.
                    </p>
                  )}
                </div>

                <label>
                  Note for kitchen / rider (optional, max 500 chars)
                  <TextArea
                    maxLength={500}
                    rows={3}
                    value={customerNote}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerNote(e.target.value)}
                  />
                </label>

                <div className="coupon-box">
                  <label>
                    Coupon code
                    <div className="coupon-row">
                      <input
                        placeholder="e.g. SOCCER-XXXX"
                        value={couponCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCouponCode(e.target.value)}
                        maxLength={24}
                      />
                      <Button type="button" onClick={() => void applyCoupon()}>
                        Apply
                      </Button>
                    </div>
                  </label>
                  <label className="small">
                    Coupon mobile number (guest game coupon only)
                    <input
                      placeholder="Optional mobile number"
                      value={couponMobile}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCouponMobile(e.target.value.replace(/\D/g, "").slice(0, 15))}
                      maxLength={15}
                    />
                  </label>
                  {couponMessage && <p className={appliedCoupon ? "small success" : "small error"}>{couponMessage}</p>}
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Placing order…" : "Place order"}
                </Button>
              </form>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
