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
  const [activeJobs, setActiveJobs] = useState<OrderSummary[]>([]);
  const [availableJobs, setAvailableJobs] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    await Promise.all([fetchActiveJobs(), fetchAvailableJobs()]);
  }

  async function fetchActiveJobs() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/delivery/orders");
      setActiveJobs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load active jobs");
    }
  }

  async function fetchAvailableJobs() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/delivery/orders/available");
      setAvailableJobs(list);
    } catch (e) {
      console.error("Failed to load available jobs", e);
    }
  }

  async function takeJob(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/delivery/orders/${orderId}/take`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to take job");
    } finally {
      setBusy(null);
    }
  }

  async function completeDelivery(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/delivery/orders/${orderId}/complete`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete delivery");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack gap-2">
      <header className="row spread align-center">
        <h1>Delivery Dashboard</h1>
        <Button onClick={refresh} className="secondary">Refresh</Button>
      </header>

      {error && <p className="error">{error}</p>}

      <section>
        <h2 className="h3">My Active Jobs</h2>
        {activeJobs.length === 0 ? (
          <p className="muted">No active delivery jobs. Pick one from the list below!</p>
        ) : (
          <div className="grid cols-1 md-cols-2 gap-1">
            {activeJobs.map((o) => (
              <Card key={o.orderId} className="pixel-card stack gap-05">
                <div className="row spread">
                  <strong>Order #{o.orderId.slice(0, 8)}</strong>
                  <span className="pill info">{o.status}</span>
                </div>
                <p className="small">Customer: {o.customerName}</p>
                {o.deliveryAddress && <p className="small">Address: {o.deliveryAddress}</p>}
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

      <hr />

      <section>
        <h2 className="h3">Available Jobs (Ready for Pickup)</h2>
        {availableJobs.length === 0 ? (
          <p className="muted">No jobs available right now. Check back soon!</p>
        ) : (
          <div className="grid cols-1 md-cols-2 lg-cols-3 gap-1">
            {availableJobs.map((o) => (
              <Card key={o.orderId} className="pixel-card stack gap-05">
                <div className="row spread">
                  <strong>#{o.orderId.slice(0, 8)}</strong>
                  <span className="pill warning">{o.status}</span>
                </div>
                <p className="small">Address: {o.deliveryAddress || "See details"}</p>
                <p className="price">{formatMoney(o.total)}</p>
                <Button 
                  onClick={() => takeJob(o.orderId)} 
                  disabled={busy === o.orderId}
                >
                  {busy === o.orderId ? "Taking..." : "Pick Up Order"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
