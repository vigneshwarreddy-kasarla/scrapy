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
  deliveryAddress?: string;
};

export function DeliveryDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/delivery/orders");
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load delivery jobs");
    }
  }

  async function completeDelivery(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/delivery/orders/${orderId}/complete`, { method: "POST" });
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete delivery");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <header className="row spread align-center">
        <h1>Delivery Dashboard</h1>
        <Button onClick={fetchOrders} className="secondary">Refresh</Button>
      </header>

      {error && <p className="error">{error}</p>}

      <section>
        <h2 className="h3">My Active Jobs</h2>
        {orders.length === 0 ? (
          <p className="muted">No active delivery jobs. Waiting for assignments...</p>
        ) : (
          <div className="grid cols-1 md-cols-2 lg-cols-3 gap-1">
            {orders.map((o) => (
              <Card key={o.orderId} className="pixel-card stack gap-05">
                <div className="row spread">
                  <strong>Order #{o.orderId.slice(0, 8)}</strong>
                  <span className="pill info">{o.status}</span>
                </div>
                <p className="small">Customer: {o.customerName}</p>
                {o.deliveryAddress && <p className="small">Address: {o.deliveryAddress}</p>}
                <p className="small muted">Assigned: {new Date(o.createdAt).toLocaleString()}</p>
                <p className="price">{formatMoney(o.total)}</p>
                <Button 
                  onClick={() => completeDelivery(o.orderId)} 
                  disabled={busy === o.orderId}
                  className="success"
                >
                  {busy === o.orderId ? "Updating..." : "Mark as Delivered"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
