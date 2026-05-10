import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui";
import { apiJson } from "../api/client";
import { formatMoney } from "../utils/money";

type OrderSummary = {
  orderId: string;
  status: string;
  total: string;
  createdAt: string;
  customerName: string;
};

export function RestaurantDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/restaurant/orders/pending");
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    }
  }

  async function acceptOrder(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/restaurant/orders/${orderId}/accept`, { method: "POST" });
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept order");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <header className="row spread align-center">
        <h1>Restaurant Dashboard</h1>
        <Button onClick={fetchOrders} className="secondary">Refresh</Button>
      </header>

      {error && <p className="error">{error}</p>}

      <section>
        <h2 className="h3">Pending Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No pending orders at the moment.</p>
        ) : (
          <div className="grid cols-1 md-cols-2 lg-cols-3 gap-1">
            {orders.map((o) => (
              <Card key={o.orderId} className="pixel-card stack gap-05">
                <div className="row spread">
                  <strong>Order #{o.orderId.slice(0, 8)}</strong>
                  <span className="pill warning">{o.status}</span>
                </div>
                <p className="small">Customer: {o.customerName}</p>
                <p className="small muted">Received: {new Date(o.createdAt).toLocaleString()}</p>
                <p className="price">{formatMoney(o.total)}</p>
                <Button 
                  onClick={() => acceptOrder(o.orderId)} 
                  disabled={busy === o.orderId}
                >
                  {busy === o.orderId ? "Accepting..." : "Accept Order"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
