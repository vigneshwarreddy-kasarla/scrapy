import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui";
import { apiJson, resolveMediaUrl } from "../api/client";
import { formatMoney } from "../utils/money";
import { MapComponent } from "../components/MapComponent";

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

type Category = {
  id: string;
  name: string;
};

type Analytics = {
  delivered_count: number;
  pending_count: number;
  active_count: number;
  total_items_sold: number;
};

type TrackingInfo = {
  deliveryLat: number | null;
  deliveryLng: number | null;
  status: string;
};

export function RestaurantDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tracking, setTracking] = useState<Record<string, TrackingInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Item State
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isVeg: true,
  });

  useEffect(() => {
    refresh();
    const timer = setInterval(fetchTracking, 10000);
    return () => clearInterval(timer);
  }, []);

  async function refresh() {
    await Promise.all([fetchOrders(), fetchAnalytics(), fetchMenu(), fetchCategories()]);
  }

  async function fetchCategories() {
    try {
      const list = await apiJson<Category[]>("/api/v1/menu/categories");
      setCategories(list);
      if (list.length > 0 && !newItem.categoryId) {
        setNewItem(prev => ({ ...prev, categoryId: list[0].id }));
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
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

  async function fetchTracking() {
    const activeOrders = orders.filter(o => o.status === "out_for_delivery");
    for (const o of activeOrders) {
      try {
        const info = await apiJson<TrackingInfo>(`/api/v1/orders/${o.orderId}/tracking`);
        setTracking(prev => ({ ...prev, [o.orderId]: info }));
      } catch (e) {
        console.error("Tracking failed", e);
      }
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

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.categoryId) {
      setError("Please select a category");
      return;
    }
    setBusy("adding");
    try {
      await apiJson("/api/v1/restaurant/menu", {
        method: "POST",
        body: JSON.stringify({
          ...newItem,
          price: Number(newItem.price),
          preparationTime: 20,
          displayOrder: 0,
          available: true,
          tags: [],
          ingredients: [],
          allergens: []
        }),
      });
      setShowAddForm(false);
      setNewItem({ name: "", description: "", price: "", categoryId: newItem.categoryId, isVeg: true });
      await fetchMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack gap-2">
      <header className="row spread align-center">
        <h1>Restaurant Dashboard</h1>
        <div className="row gap-1">
          <Button onClick={() => setShowAddForm(!showAddForm)} className="primary">
            {showAddForm ? "Cancel" : "Add New Item"}
          </Button>
          <Button onClick={refresh} className="secondary">Refresh</Button>
        </div>
      </header>

      {showAddForm && (
        <Card className="pixel-card p-2">
          <form onSubmit={handleAddItem} className="stack gap-1">
            <h3 className="h4">Add Menu Item</h3>
            <div className="grid cols-1 md-cols-2 gap-1">
              <div className="stack gap-05">
                <label>Item Name</label>
                <input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Spicy Ramen" />
              </div>
              <div className="stack gap-05">
                <label>Price</label>
                <input required type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="0.00" />
              </div>
              <div className="stack gap-05">
                <label>Category</label>
                <select required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})}>
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="stack gap-05">
              <label>Description</label>
              <textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Describe the dish..." />
            </div>
            <div className="row gap-2">
               <label className="row gap-05 align-center">
                 <input type="checkbox" checked={newItem.isVeg} onChange={e => setNewItem({...newItem, isVeg: e.target.checked})} />
                 Vegetarian
               </label>
            </div>
            <Button type="submit" disabled={busy === "adding"}>
              {busy === "adding" ? "Saving..." : "Save Item"}
            </Button>
          </form>
        </Card>
      )}

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
                  <p className="price">{formatMoney(o.total)}</p>
                  
                  {o.status === "placed" || o.status === "confirmed" ? (
                    <Button onClick={() => acceptOrder(o.orderId)} disabled={busy === o.orderId}>
                      {busy === o.orderId ? "Accepting..." : "Accept & Start Preparing"}
                    </Button>
                  ) : o.status === "preparing" ? (
                    <Button onClick={() => markReady(o.orderId)} disabled={busy === o.orderId} className="info">
                      {busy === o.orderId ? "Updating..." : "Mark as Ready"}
                    </Button>
                  ) : o.status === "out_for_delivery" && tracking[o.orderId]?.deliveryLat ? (
                    <div className="stack gap-05">
                      <p className="small bold">Tracking Delivery Agent:</p>
                      <MapComponent 
                        points={[{ 
                          lat: tracking[o.orderId].deliveryLat!, 
                          lng: tracking[o.orderId].deliveryLng!, 
                          label: "Delivery Agent" 
                        }]} 
                        zoom={15}
                      />
                    </div>
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
          <div className="stack gap-05">
            {menu.map((it) => (
              <Card key={it.id} className="pixel-card row gap-1 align-center p-05">
                <div className="menu-item-mini-thumb">
                  {it.imageUrl && <img src={resolveMediaUrl(it.imageUrl) || ""} alt={it.name} />}
                </div>
                <div className="grow">
                  <p className="small bold">{it.name}</p>
                  <p className="muted xsmall">{formatMoney(it.price)}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
