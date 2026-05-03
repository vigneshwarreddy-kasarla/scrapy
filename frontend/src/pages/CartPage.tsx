import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, TextArea } from "pixel-retroui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { readCustomerCache, writeCustomerCache } from "../commerce/sessionSync";
import { formatMoney } from "../utils/money";

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

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [metaByItem, setMetaByItem] = useState<Record<string, MenuItemLite>>({});
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMobile, setCouponMobile] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function placeOrder(ev: FormEvent) {
    ev.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (addressId) body.deliveryAddressId = addressId;
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
                <label>
                  Saved address (optional)
                  <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                    <option value="">— none —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {(a.label ? `${a.label}: ` : "") + [a.line1, a.city, a.postalCode].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Note for kitchen / rider (optional, max 500 chars)
                  <TextArea
                    maxLength={500}
                    rows={3}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                  />
                </label>
                <div className="coupon-box">
                  <label>
                    Coupon code
                    <div className="coupon-row">
                      <input
                        placeholder="e.g. SOCCER-XXXX"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
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
                      onChange={(e) => setCouponMobile(e.target.value.replace(/\D/g, "").slice(0, 15))}
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
