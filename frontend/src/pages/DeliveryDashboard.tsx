import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui";
import { apiJson } from "../api/client";
import { formatMoney } from "../utils/money";
import { MapComponent } from "../components/MapComponent";

type OrderSummary = {
  orderId: string;
  status: string;
  total: string;
  createdAt: string;
  customerName: string;
  deliveryAddress?: string;
};

type TrackingInfo = {
  customerLat: number | null;
  customerLng: number | null;
  status: string;
};

export function DeliveryDashboard() {
  const [activeJobs, setActiveJobs] = useState<OrderSummary[]>([]);
  const [availableJobs, setAvailableJobs] = useState<OrderSummary[]>([]);
  const [tracking, setTracking] = useState<Record<string, TrackingInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    const timer = setInterval(fetchTracking, 15000);
    return () => clearInterval(timer);
  }, []);

  async function refresh() {
    await Promise.all([fetchActiveJobs(), fetchAvailableJobs()]);
  }

  async function fetchActiveJobs() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/delivery/orders");
      setActiveJobs(list);
      // Immediately fetch tracking for these
      for (const o of list) {
        fetchOrderTracking(o.orderId);
      }
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

  async function fetchTracking() {
    for (const o of activeJobs) {
      fetchOrderTracking(o.orderId);
    }
  }

  async function fetchOrderTracking(orderId: string) {
    try {
      const info = await apiJson<TrackingInfo>(`/api/v1/orders/${orderId}/tracking`);
      setTracking(prev => ({ ...prev, [orderId]: info }));
    } catch (e) {
      console.error("Tracking failed", e);
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
          <p className="muted">No active delivery jobs.</p>
        ) : (
          <div className="grid cols-1 md-cols-2 gap-2">
            {activeJobs.map((o) => (
              <Card key={o.orderId} className="pixel-card stack gap-1">
                <div className="row spread">
                  <strong>Order #{o.orderId.slice(0, 8)}</strong>
                  <span className="pill info">{o.status}</span>
                </div>
                <div className="stack gap-05">
                  <p className="small">Customer: {o.customerName}</p>
                  <p className="small">Address: {o.deliveryAddress || "Not provided"}</p>
                  <p className="price">{formatMoney(o.total)}</p>
                </div>

                {tracking[o.orderId]?.customerLat && (
                  <div className="stack gap-05">
                    <p className="small bold">Customer Location:</p>
                    <MapComponent 
                      points={[{ 
                        lat: tracking[o.orderId].customerLat!, 
                        lng: tracking[o.orderId].customerLng!, 
                        label: o.customerName 
                      }]} 
                      zoom={15}
                    />
                  </div>
                )}

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
        <h2 className="h3">Available Jobs</h2>
        {availableJobs.length === 0 ? (
          <p className="muted">No jobs available right now.</p>
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
                <Button onClick={() => takeJob(o.orderId)} disabled={busy === o.orderId}>
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
