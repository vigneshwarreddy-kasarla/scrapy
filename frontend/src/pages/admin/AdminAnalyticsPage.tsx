import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { AdminOrder, AdminReview } from "./shared";

type WindowDays = 7 | 30 | 90;

function formatDay(dateLike: string): string {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return dateLike;
  return d.toISOString().slice(0, 10);
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="analytics-bars">
      {data.map((d) => (
        <div key={d.label} className="analytics-bar-col">
          <div className="analytics-bar-wrap">
            <div className="analytics-bar" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="small muted">{d.label}</span>
          <span className="small">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 520;
  const height = 220;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const points = data
    .map((d, i) => {
      const x = pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1);
      const y = height - pad - (d.value / max) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="analytics-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend chart">
        <polyline fill="none" stroke="#d97f2f" strokeWidth="3" points={points} />
        {data.map((d, i) => {
          const x = pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1);
          const y = height - pad - (d.value / max) * (height - pad * 2);
          return <circle key={d.label} cx={x} cy={y} r="3.5" fill="#8b3f00" />;
        })}
      </svg>
      <div className="analytics-line-labels">
        {data.map((d) => (
          <span key={d.label} className="small muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, data.reduce((sum, d) => sum + d.value, 0));
  let current = 0;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="analytics-pie-wrap">
      <svg viewBox="0 0 140 140" className="analytics-pie" role="img" aria-label="Distribution pie chart">
        <g transform="translate(70,70) rotate(-90)">
          {data.map((d) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const node = (
              <circle
                key={d.label}
                r={radius}
                cx={0}
                cy={0}
                fill="none"
                stroke={d.color}
                strokeWidth={22}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-current}
              />
            );
            current += dash;
            return node;
          })}
        </g>
      </svg>
      <div className="stack">
        {data.map((d) => (
          <div key={d.label} className="row gap">
            <span className="analytics-dot" style={{ background: d.color }} />
            <span className="small">
              {d.label}: {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [windowDays, setWindowDays] = useState<WindowDays>(30);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    async function load() {
      setBusy(true);
      setError(null);
      try {
        const [o, r] = await Promise.all([
          apiJson<AdminOrder[]>("/api/v1/admin/orders?limit=500"),
          apiJson<AdminReview[]>("/api/v1/admin/reviews?limit=500"),
        ]);
        setOrders(o);
        setReviews(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics data");
      } finally {
        setBusy(false);
      }
    }
    void load();
  }, []);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const min = now - windowDays * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const time = new Date(o.createdAt).getTime();
      if (Number.isNaN(time) || time < min) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
      return true;
    });
  }, [orders, windowDays, statusFilter, paymentFilter]);

  const filteredReviews = useMemo(() => {
    const now = Date.now();
    const min = now - windowDays * 24 * 60 * 60 * 1000;
    return reviews.filter((r) => {
      const time = new Date(r.createdAt).getTime();
      return !Number.isNaN(time) && time >= min;
    });
  }, [reviews, windowDays]);

  const totalRevenue = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
    [filteredOrders]
  );
  const avgOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;

  const statusBars = useMemo(() => {
    const buckets = ["placed", "confirmed", "out_for_delivery", "delivered", "cancelled"].map((s) => ({
      label: s.replaceAll("_", " "),
      value: filteredOrders.filter((o) => o.status === s).length,
    }));
    return buckets;
  }, [filteredOrders]);

  const revenueLine = useMemo(() => {
    const dayMap = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const day = formatDay(o.createdAt);
      dayMap.set(day, (dayMap.get(day) || 0) + (o.paymentStatus === "paid" ? o.total : 0));
    });
    return [...dayMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-10)
      .map(([label, value]) => ({ label: label.slice(5), value: Math.round(value) }));
  }, [filteredOrders]);

  const paymentPie = useMemo(() => {
    const paid = filteredOrders.filter((o) => o.paymentStatus === "paid").length;
    const unpaid = filteredOrders.filter((o) => o.paymentStatus !== "paid").length;
    return [
      { label: "Paid", value: paid, color: "#4f9e68" },
      { label: "Unpaid", value: unpaid, color: "#d97f2f" },
    ];
  }, [filteredOrders]);

  const reviewPie = useMemo(() => {
    const map = new Map<number, number>();
    [5, 4, 3, 2, 1].forEach((r) => map.set(r, 0));
    filteredReviews.forEach((r) => map.set(r.rating, (map.get(r.rating) || 0) + 1));
    return [5, 4, 3, 2, 1].map((rating, idx) => ({
      label: `${rating} star`,
      value: map.get(rating) || 0,
      color: ["#2a9d8f", "#4f9e68", "#f4a261", "#e76f51", "#b23a48"][idx],
    }));
  }, [filteredReviews]);

  return (
    <article className="card admin-card">
      <h2 className="h2">Analytics</h2>
      {busy && <p className="muted">Loading analytics…</p>}
      {error && <p className="error">{error}</p>}

      <div className="analytics-filters">
        <label className="small">
          Timeline
          <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as WindowDays)}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
        <label className="small">
          Order status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="small">
          Payment
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>
      </div>

      <div className="analytics-kpis">
        <div className="card flat">
          <p className="small muted">Orders</p>
          <strong>{filteredOrders.length}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Revenue</p>
          <strong>{formatMoney(totalRevenue)}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Avg order value</p>
          <strong>{formatMoney(avgOrderValue)}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Reviews</p>
          <strong>{filteredReviews.length}</strong>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="card flat">
          <h3 className="h3">Order Status (Bar Graph)</h3>
          <BarChart data={statusBars} />
        </section>

        <section className="card flat">
          <h3 className="h3">Revenue Timeline (Line Plot)</h3>
          <LineChart data={revenueLine.length ? revenueLine : [{ label: "No data", value: 0 }]} />
        </section>

        <section className="card flat">
          <h3 className="h3">Payment Split (Pie Chart)</h3>
          <PieChart data={paymentPie} />
        </section>

        <section className="card flat">
          <h3 className="h3">Review Ratings (Pie Chart)</h3>
          <PieChart data={reviewPie} />
        </section>
      </div>
    </article>
  );
}
