import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../components/ui";
import { Link, useParams } from "react-router-dom";
import { apiJson } from "../api/client";
import { formatMoney } from "../utils/money";
import { setStoredItemRating } from "../utils/ratings";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../utils/useWebSocket";
import { MapComponent } from "../components/MapComponent";

type Line = {
  lineId: string;
  menuItemId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

type OrderDetail = {
  orderId: string;
  status: string;
  lines: Line[];
  total: string;
  createdAt: string;
  deliveryAddressSnapshot: string | null;
  paymentStatus: string;
  paidAt: string | null;
  customerNote: string | null;
};

type TrackingInfo = {
  deliveryLat: number | null;
  deliveryLng: number | null;
  status: string;
};

type ReviewResponse = {
  reviewId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payInfo, setPayInfo] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [reviewNote, setReviewNote] = useState("");

  const loadOrder = async (cancelled = false) => {
    if (!orderId) return;
    try {
      const o = await apiJson<OrderDetail>(`/api/v1/orders/${orderId}`);
      if (!cancelled) {
        setOrder(o);
        const initialItemRatings: Record<string, number> = {};
        o.lines.forEach((ln) => {
          initialItemRatings[ln.lineId] = 0;
        });
        setItemRatings(initialItemRatings);
        try {
          const existing = await apiJson<ReviewResponse>(`/api/v1/orders/${orderId}/review`);
          if (!cancelled) {
            setReview(existing);
            setDeliveryRating(existing.rating);
            setReviewNote(existing.comment ?? "");
          }
        } catch {
          if (!cancelled) setReview(null);
        }
      }
    } catch (e) {
      if (!cancelled) setError(e instanceof Error ? e.message : "Not found");
    }
  };

  const loadTracking = async () => {
    if (!orderId) return;
    try {
      const info = await apiJson<TrackingInfo>(`/api/v1/orders/${orderId}/tracking`);
      setTracking(info);
    } catch (e) {
      console.error("Tracking failed", e);
    }
  };

  useWebSocket({
    topic: user?.id ? `/topic/user/${user.id}` : "",
    onMessage: (msg) => {
      console.log("Order update received:", msg);
      void loadOrder();
      void loadTracking();
    },
  });

  useEffect(() => {
    let cancelled = false;
    void loadOrder(cancelled);
    void loadTracking();
    
    const interval = setInterval(() => {
        if (order?.status === 'out_for_delivery') {
            void loadTracking();
        }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, order?.status]);

  async function bypassPayment() {
    if (!orderId) return;
    setPayInfo(null);
    setError(null);
    try {
      await apiJson(`/api/v1/orders/${orderId}/payments/bypass`, {
        method: "POST",
      });
      // Refresh order state
      const o = await apiJson<OrderDetail>(`/api/v1/orders/${orderId}`);
      setOrder(o);
      alert("Payment successful! Order placed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment simulation failed");
    }
  }

  async function cancelOrder() {
    if (!orderId) return;
    if (!window.confirm("Cancel this order? Only allowed when placed/confirmed and unpaid.")) return;
    setError(null);
    try {
      const o = await apiJson<OrderDetail>(`/api/v1/orders/${orderId}/cancel`, { method: "POST" });
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  const foodAvgRating = useMemo(() => {
    const vals = Object.values(itemRatings).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [itemRatings]);

  async function submitOrderReview() {
    if (!orderId || !order) return;
    const ratedLines = order.lines.filter((ln) => (itemRatings[ln.lineId] ?? 0) > 0);
    if (deliveryRating < 1 || ratedLines.length === 0) {
      setError("Please provide delivery rating and at least one food item rating.");
      return;
    }
    const overall = Math.max(1, Math.min(5, Math.round((deliveryRating + foodAvgRating) / 2)));
    const lineDetails = ratedLines.map((ln) => `${ln.itemName}: ${itemRatings[ln.lineId]}/5`).join(" | ");
    const commentBlock = [
      reviewNote.trim(),
      `Delivery rating: ${deliveryRating}/5`,
      `Food ratings: ${lineDetails}`,
    ]
      .filter(Boolean)
      .join(" || ");

    setReviewBusy(true);
    setError(null);
    try {
      const payload = { rating: overall, comment: commentBlock };
      const saved = review
        ? await apiJson<ReviewResponse>(`/api/v1/orders/${orderId}/review`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiJson<ReviewResponse>(`/api/v1/orders/${orderId}/review`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
      setReview(saved);
      order.lines.forEach((ln) => {
        const r = itemRatings[ln.lineId] ?? 0;
        if (r > 0 && ln.menuItemId) setStoredItemRating(ln.menuItemId, r);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review submit failed");
    } finally {
      setReviewBusy(false);
    }
  }

  if (error && !order) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }
  if (!order) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="stack gap-1">
      <p>
        <Link to="/orders">← Orders</Link>
      </p>
      
      <div className="grid cols-1 lg-cols-3 gap-2">
        <div className="lg-span-2">
          <Card className="pixel-card">
            <h1>Order {order.orderId.slice(0, 8)}…</h1>
            {error && <p className="error">{error}</p>}
            <p>
              <span className="pill">{order.status}</span> · {order.paymentStatus}
              {order.paidAt ? ` · paid ${order.paidAt}` : ""}
            </p>
            <p>Placed: {order.createdAt}</p>
            <p>Total: {formatMoney(order.total)}</p>
            {order.deliveryAddressSnapshot && (
              <p>
                <strong>Address:</strong> {order.deliveryAddressSnapshot}
              </p>
            )}
            {order.customerNote && (
              <p>
                <strong>Note:</strong> {order.customerNote}
              </p>
            )}
            <h2 className="h3 mt-2">Lines</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Each</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((ln) => (
                  <tr key={ln.lineId}>
                    <td>{ln.itemName}</td>
                    <td>{ln.quantity}</td>
                    <td>{formatMoney(ln.unitPrice)}</td>
                    <td>{formatMoney(ln.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          {order.status === "out_for_delivery" && tracking?.deliveryLat ? (
            <Card className="pixel-card">
              <h2 className="h3">Track Delivery</h2>
              <p className="small muted mb-1">Live location of your delivery agent</p>
              <MapComponent 
                points={[{ 
                  lat: tracking.deliveryLat, 
                  lng: tracking.deliveryLng!, 
                  label: "Delivery Agent" 
                }]} 
                zoom={15}
              />
            </Card>
          ) : order.status === 'delivered' ? (
             <Card className="pixel-card success-card">
                 <p className="bold">Order Delivered!</p>
                 <p className="small">Enjoy your food.</p>
             </Card>
          ) : (
            <Card className="pixel-card">
              <h2 className="h3">Order Tracking</h2>
              <p className="muted">Tracking will be available once the order is out for delivery.</p>
            </Card>
          )}

          <div className="stack actions mt-1">
            {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
              <Button type="button" onClick={() => void bypassPayment()}>
                Simulate Payment
              </Button>
            )}
            {(order.status === "placed" || order.status === "confirmed") && order.paymentStatus === "unpaid" && (
              <Button type="button" className="danger" onClick={() => void cancelOrder()}>
                Cancel order
              </Button>
            )}
          </div>
        </div>
      </div>

      {order.status === "delivered" && (
        <div id="review">
        <Card className="pixel-card order-rating-card">
          <h2 className="h2">{review ? "Update your rating" : "Rate this order"}</h2>
          <p className="small muted">Rate delivery quality and individual food items using 5 stars.</p>

          <div className="rating-row">
            <strong>Delivery quality</strong>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={v <= deliveryRating ? "star-btn active" : "star-btn"}
                  onClick={() => setDeliveryRating(v)}
                  aria-label={`Delivery ${v} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="stack">
            {order.lines.map((ln) => (
              <div key={ln.lineId} className="rating-row">
                <span>{ln.itemName}</span>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={v <= (itemRatings[ln.lineId] ?? 0) ? "star-btn active" : "star-btn"}
                      onClick={() => setItemRatings((prev) => ({ ...prev, [ln.lineId]: v }))}
                      aria-label={`${ln.itemName} ${v} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label>
            Notes (optional)
            <textarea
              rows={3}
              maxLength={1000}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Share quick feedback..."
            />
          </label>

          <Button type="button" disabled={reviewBusy} onClick={() => void submitOrderReview()}>
            {reviewBusy ? "Saving…" : review ? "Update rating" : "Submit rating"}
          </Button>
        </Card>
        </div>
      )}
    </div>
  );
}
