import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { formatMoney } from "../utils/money";

type OrderSummary = {
  orderId: string;
  status: string;
  total: string;
  createdAt: string;
  customerName: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  available: boolean;
};

type Analytics = {
  delivered_count: number;
  pending_count: number;
  active_count: number;
  total_items_sold: number;
};

export function RestaurantDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    await Promise.all([fetchOrders(), fetchAnalytics(), fetchMenu()]);
  }

  async function fetchOrders() {
    try {
      const list = await apiJson<OrderSummary[]>("/api/v1/restaurant/orders/pending");
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    }
  }

  async function fetchAnalytics() {
    try {
      const data = await apiJson<Analytics>("/api/v1/restaurant/analytics");
      setAnalytics(data);
    } catch (e) {
      console.error("Failed to load analytics", e);
    }
  }

  async function fetchMenu() {
    try {
      const items = await apiJson<MenuItem[]>("/api/v1/restaurant/menu");
      setMenu(items);
    } catch (e) {
      console.error("Failed to load menu", e);
    }
  }

  async function acceptOrder(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/restaurant/orders/${orderId}/accept`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept order");
    } finally {
      setBusy(null);
    }
  }

  async function markReady(orderId: string) {
    setBusy(orderId);
    try {
      await apiJson(`/api/v1/restaurant/orders/${orderId}/ready`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark as ready");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack gap-2">
      <header className="row spread align-center">
        <h1>Restaurant Dashboard</h1>
        <Button onClick={refresh} className="secondary">Refresh</Button>
      </header>

      {analytics && (
        <section className="grid cols-2 md-cols-4 gap-1">
          <Card className="pixel-card stat-card">
            <span className="label">Items Sold</span>
            <span className="value">{analytics.total_items_sold}</span>
          </Card>
          <Card className="pixel-card stat-card">
            <span className="label">Delivered</span>
            <span className="value">{analytics.delivered_count}</span>
          </Card>
          <Card className="pixel-card stat-card">
            <span className="label">Active</span>
            <span className="value">{analytics.active_count}</span>
          </Card>
          <Card className="pixel-card stat-card">
            <span className="label">Pending</span>
            <span className="value">{analytics.pending_count}</span>
          </Card>
        </section>
      )}

      {error && <p className="error">{error}</p>}

      <div className="grid cols-1 lg-cols-3 gap-2">
        <section className="lg-span-2">
          <h2 className="h3">Orders to Handle</h2>
          {orders.length === 0 ? (
            <p className="muted">No orders to process right now.</p>
          ) : (
            <div className="stack gap-1">
              {orders.map((o) => (
                <Card key={o.orderId} className="pixel-card stack gap-05">
                  <div className="row spread">
                    <strong>#{o.orderId.slice(0, 8)}</strong>
                    <span className={`pill ${o.status === "placed" || o.status === "confirmed" ? "warning" : "info"}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="small">Customer: {o.customerName}</p>
                  <p className="small muted">{new Date(o.createdAt).toLocaleString()}</p>
                  <p className="price">{formatMoney(o.total)}</p>
                  
                  {o.status === "placed" || o.status === "confirmed" ? (
                    <Button 
                      onClick={() => acceptOrder(o.orderId)} 
                      disabled={busy === o.orderId}
                    >
                      {busy === o.orderId ? "Accepting..." : "Accept & Start Preparing"}
                    </Button>
                  ) : o.status === "preparing" ? (
                    <Button 
                      onClick={() => markReady(o.orderId)} 
                      disabled={busy === o.orderId}
                      className="info"
                    >
                      {busy === o.orderId ? "Updating..." : "Mark as Ready / Waiting"}
                    </Button>
                  ) : (
                    <p className="small success-text">Waiting for pickup...</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="h3">My Food Items</h2>
          {menu.length === 0 ? (
            <p className="muted">No items in your menu.</p>
          ) : (
            <div className="stack gap-05">
              {menu.map((it) => (
                <Card key={it.id} className="pixel-card row gap-1 align-center p-05">
                  <div className="menu-item-mini-thumb">
                    <img src={resolveMediaUrl(it.imageUrl) || ""} alt={it.name} />
                  </div>
                  <div className="grow">
                    <p className="small bold">{it.name}</p>
                    <p className="muted xsmall">{formatMoney(it.price)}</p>
                  </div>
                  <span className={`pill xsmall ${it.available ? "success" : "danger"}`}>
                    {it.available ? "Live" : "Off"}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
