import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { formatMoney } from "../../utils/money";
import { AdminOrder, DeliveryAgent, renderPager } from "./shared";

const PAGE_SIZE = 8;
const ORDER_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const STATUS_FLOW = [
  { value: "confirmed", label: "Confirm" },
  { value: "out_for_delivery", label: "Dispatch" },
  { value: "delivered", label: "Deliver" },
] as const;

function canMoveToStatus(current: string, next: string): boolean {
  if (current === "cancelled" || current === "delivered") return false;
  if (next === "confirmed") return current === "placed";
  if (next === "out_for_delivery") return current === "confirmed";
  if (next === "delivered") return current === "out_for_delivery";
  return false;
}

export function AdminOrdersPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [assignAgentByOrder, setAssignAgentByOrder] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(
    () => orders.filter((o) => (orderStatusFilter === "all" ? true : o.status === orderStatusFilter)),
    [orders, orderStatusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(() => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredOrders, page]);

  useEffect(() => setPage(1), [orderStatusFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const [o, a] = await Promise.all([
        apiJson<AdminOrder[]>("/api/v1/admin/orders?limit=200"),
        apiJson<DeliveryAgent[]>("/api/v1/admin/staff/delivery-agents"),
      ]);
      setOrders(o);
      setAgents(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function patchOrderStatus(orderId: string, status: string) {
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOkMsg("Order status updated");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to patch status");
    }
  }

  async function patchPayment(orderId: string, paymentStatus: "paid" | "unpaid") {
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setOkMsg("Payment status updated");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to patch payment");
    }
  }

  async function assignOrder(orderId: string) {
    const deliveryAgentId = assignAgentByOrder[orderId];
    if (!deliveryAgentId) {
      setError("Select a delivery agent before assigning");
      return;
    }
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/orders/${orderId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryAgentId }),
      });
      setOkMsg("Delivery agent assigned");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign delivery");
    }
  }

  return (
    <article className="card admin-card">
      <h2 className="h2">Orders</h2>
      {busy && <p className="muted">Loading orders…</p>}
      {error && <p className="error">{error}</p>}
      {okMsg && <p className="success">{okMsg}</p>}

      <div className="admin-status-tabs" role="tablist" aria-label="Order status filters">
        {ORDER_STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? orders.length : orders.filter((o) => o.status === tab.value).length;
          const isActive = orderStatusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "admin-status-tab active" : "admin-status-tab"}
              onClick={() => setOrderStatusFilter(tab.value)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <ul className="list-plain admin-orders-list">
        {pagedOrders.map((o) => (
          <li key={o.orderId} className="card flat">
            <div className="row spread">
              <strong>{o.orderId.slice(0, 8)}</strong>
              <span className="price">{formatMoney(o.total)}</span>
            </div>
            <p className="small muted">
              {o.customerPhone} · {o.status} · {o.paymentStatus}
            </p>
            {o.customerNote && <p className="small">Note: {o.customerNote}</p>}
            <div className="admin-order-controls">
              <div className="admin-chip-row">
                {STATUS_FLOW.map((step) => {
                  const active = o.status === step.value;
                  const enabled = canMoveToStatus(o.status, step.value);
                  return (
                    <button
                      key={step.value}
                      type="button"
                      className={active ? "admin-chip active" : "admin-chip"}
                      disabled={!enabled}
                      onClick={() => void patchOrderStatus(o.orderId, step.value)}
                      title={enabled ? `Move to ${step.value}` : `Current status: ${o.status}`}
                    >
                      {step.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={o.paymentStatus === "paid" ? "admin-chip active" : "admin-chip"}
                  disabled={o.paymentStatus === "paid"}
                  onClick={() => void patchPayment(o.orderId, "paid")}
                >
                  Paid
                </button>
              </div>
              <div className="admin-assign-row">
                <select
                  value={assignAgentByOrder[o.orderId] ?? o.deliveryAgentId ?? ""}
                  onChange={(e) => setAssignAgentByOrder((prev) => ({ ...prev, [o.orderId]: e.target.value }))}
                >
                  <option value="">Select delivery agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button type="button" className="admin-mini-btn" onClick={() => void assignOrder(o.orderId)}>
                  Assign
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {renderPager(page, totalPages, setPage)}
    </article>
  );
}
