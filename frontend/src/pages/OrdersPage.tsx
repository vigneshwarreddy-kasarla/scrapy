import { useEffect, useState } from "react";
import { Card } from "pixel-retroui";
import { Link } from "react-router-dom";
import { apiJson } from "../api/client";
import { formatMoney } from "../utils/money";

type OrderSummary = {
  orderId: string;
  status: string;
  total: string;
  createdAt: string;
  paymentStatus: string;
  paidAt: string | null;
  customerNote: string | null;
};

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiJson<OrderSummary[]>("/api/v1/orders");
        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>Orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <ul className="list-plain stack">
          {orders.map((o) => (
            <li key={o.orderId}>
              <Card className="pixel-card">
                <div className="row spread">
                  <Link to={`/orders/${o.orderId}`}>
                    <strong>{o.orderId.slice(0, 8)}…</strong>
                  </Link>
                  <span className="pill">{o.status}</span>
                </div>
                <p className="muted small">
                  {o.createdAt} · {o.paymentStatus}
                  {o.paidAt ? ` · paid ${o.paidAt}` : ""}
                </p>
                <p>Total: {formatMoney(o.total)}</p>
                {o.customerNote && <p className="note">Note: {o.customerNote}</p>}
                {o.status === "delivered" && (
                  <p className="small">
                    <Link to={`/orders/${o.orderId}#review`} className="button">
                      Rate delivery and food
                    </Link>
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
