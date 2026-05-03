import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { formatMoney } from "../../utils/money";
import { AdminOrder, AdminOrderDetail, renderPager } from "./shared";

const PAGE_SIZE = 12;

function formatWhen(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function AdminHistoryPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [detailBusy, setDetailBusy] = useState(false);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.paymentStatus.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(() => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function loadOrders() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiJson<AdminOrder[]>("/api/v1/admin/orders?limit=400");
      setOrders(data);
      if (data.length > 0) setSelectedOrderId((prev) => prev || data[0].orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetail(null);
      return;
    }
    setDetailBusy(true);
    setError(null);
    apiJson<AdminOrderDetail>(`/api/v1/admin/orders/${selectedOrderId}`)
      .then((d) => setOrderDetail(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load order detail"))
      .finally(() => setDetailBusy(false));
  }, [selectedOrderId]);

  return (
    <article className="card admin-card">
      <h2 className="h2">History</h2>
      {busy && <p className="muted">Loading history…</p>}
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Search by order id, phone, status, payment status"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="admin-history-layout">
        <div className="admin-history-list">
          <div className="admin-history-header small muted">
            <span>Order</span>
            <span>Status</span>
            <span>Total</span>
            <span>Created</span>
          </div>
          {pagedOrders.map((o) => (
            <button
              key={o.orderId}
              type="button"
              className={selectedOrderId === o.orderId ? "admin-history-row active" : "admin-history-row"}
              onClick={() => setSelectedOrderId(o.orderId)}
            >
              <span>{o.orderId.slice(0, 10)}</span>
              <span>{o.status}</span>
              <span>{formatMoney(o.total)}</span>
              <span>{formatWhen(o.createdAt)}</span>
            </button>
          ))}
          {renderPager(page, totalPages, setPage)}
        </div>

        <div className="admin-history-detail card flat">
          {!selectedOrderId && <p className="muted">Select a row to view full info.</p>}
          {detailBusy && <p className="muted">Loading selected order…</p>}
          {orderDetail && !detailBusy && (
            <div className="stack">
              <div className="row spread">
                <strong>Order {orderDetail.orderId.slice(0, 12)}</strong>
                <span className="price">{formatMoney(orderDetail.total)}</span>
              </div>
              <p className="small muted">
                Customer: {orderDetail.customerPhone} · Status: {orderDetail.status} · Payment: {orderDetail.paymentStatus}
              </p>
              <p className="small muted">
                Created: {formatWhen(orderDetail.createdAt)} · Paid: {formatWhen(orderDetail.paidAt)} · Delivered:{" "}
                {formatWhen(orderDetail.deliveredAt)}
              </p>
              <p className="small">Delivery Agent ID: {orderDetail.deliveryAgentId ?? "-"}</p>
              <p className="small">Address Snapshot: {orderDetail.deliveryAddressSnapshot ?? "-"}</p>
              <p className="small">Customer Note: {orderDetail.customerNote ?? "-"}</p>
              <div className="stack">
                <strong>Items</strong>
                <ul className="list-plain stack">
                  {orderDetail.lines.map((line) => (
                    <li key={line.lineId} className="card flat">
                      <div className="row spread">
                        <span>{line.itemName}</span>
                        <span>{formatMoney(line.lineTotal)}</span>
                      </div>
                      <p className="small muted">
                        Qty {line.quantity} × {formatMoney(line.unitPrice)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
