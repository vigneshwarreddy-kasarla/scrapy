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

function formatGrowth(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function growthColor(pct: number): string {
  return pct >= 0 ? "#4f9e68" : "#e76f51";
}

/** ─── Chart: Vertical bar ─── */
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

/** ─── Chart: Line (revenue over time, with optional comparison series) ─── */
function LineChart({
  data,
  compare,
}: {
  data: { label: string; value: number }[];
  compare?: { label: string; value: number }[];
}) {
  const width = 520;
  const height = 220;
  const pad = 24;
  const allValues = [...data.map((d) => d.value), ...(compare ?? []).map((d) => d.value)];
  const max = Math.max(1, ...allValues);

  function toPoints(series: { value: number }[]) {
    return series
      .map((d, i) => {
        const x = pad + (i * (width - pad * 2)) / Math.max(1, series.length - 1);
        const y = height - pad - (d.value / max) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="analytics-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend chart">
        {/* Comparison (previous period) — dashed */}
        {compare && compare.length > 0 && (
          <polyline
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeDasharray="6 4"
            points={toPoints(compare)}
          />
        )}
        {/* Current period */}
        <polyline fill="none" stroke="#d97f2f" strokeWidth="3" points={toPoints(data)} />
        {/* Dots */}
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
      {compare && (
        <div className="row gap" style={{ marginTop: 4 }}>
          <span className="small muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 20, height: 2, background: "#d97f2f", verticalAlign: "middle" }} /> Current
          </span>
          <span className="small muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 20, height: 2, background: "#888", borderTop: "2px dashed #888", verticalAlign: "middle" }} /> Previous
          </span>
        </div>
      )}
    </div>
  );
}

/** ─── Chart: Donut / Pie ─── */
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

/** ─── KPI Growth Card ─── */
function GrowthCard({
  label,
  current,
  previous,
  isMoney,
}: {
  label: string;
  current: number;
  previous: number;
  isMoney?: boolean;
}) {
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  return (
    <div className="analytics-growth-card card flat">
      <p className="small muted">{label}</p>
      <strong className="analytics-growth-value">{isMoney ? formatMoney(current) : current}</strong>
      <span
        className="analytics-growth-badge small"
        style={{ color: growthColor(pct), background: `${growthColor(pct)}22` }}
        title={`Previous: ${isMoney ? formatMoney(previous) : previous}`}
      >
        {formatGrowth(pct)}
      </span>
      <span className="analytics-growth-prev small muted">
        prev: {isMoney ? formatMoney(previous) : previous}
      </span>
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

  /** Current period orders */
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

  /** Previous period orders (same window, one period back) */
  const previousPeriodOrders = useMemo(() => {
    const now = Date.now();
    const periodMs = windowDays * 24 * 60 * 60 * 1000;
    const min = now - 2 * periodMs;
    const max = now - periodMs;
    return orders.filter((o) => {
      const time = new Date(o.createdAt).getTime();
      return !Number.isNaN(time) && time >= min && time < max;
    });
  }, [orders, windowDays]);

  const filteredReviews = useMemo(() => {
    const now = Date.now();
    const min = now - windowDays * 24 * 60 * 60 * 1000;
    return reviews.filter((r) => {
      const time = new Date(r.createdAt).getTime();
      return !Number.isNaN(time) && time >= min;
    });
  }, [reviews, windowDays]);

  /* ── KPIs ── */
  const totalRevenue = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
    [filteredOrders]
  );
  const prevRevenue = useMemo(
    () => previousPeriodOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
    [previousPeriodOrders]
  );
  const avgOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
  const prevAvgOrderValue = previousPeriodOrders.length ? prevRevenue / previousPeriodOrders.length : 0;

  /* ── Status bar chart ── */
  const statusBars = useMemo(() => {
    const buckets = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((s) => ({
      label: s.replaceAll("_", " "),
      value: filteredOrders.filter((o) => o.status === s).length,
    }));
    return buckets;
  }, [filteredOrders]);

  /* ── Revenue line — current vs previous ── */
  const { revenueLine, prevRevenueLine } = useMemo(() => {
    function buildDayMap(orderList: AdminOrder[]) {
      const m = new Map<string, number>();
      orderList.forEach((o) => {
        const day = formatDay(o.createdAt);
        m.set(day, (m.get(day) || 0) + (o.paymentStatus === "paid" ? o.total : 0));
      });
      return m;
    }
    const currMap = buildDayMap(filteredOrders);
    const prevMap = buildDayMap(previousPeriodOrders);

    const currEntries = [...currMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-10)
      .map(([label, value]) => ({ label: label.slice(5), value: Math.round(value) }));

    const prevEntries = [...prevMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-10)
      .map(([_, value]) => ({ label: "", value: Math.round(value) }));

    // Pad prev to same length as curr
    while (prevEntries.length < currEntries.length) prevEntries.push({ label: "", value: 0 });

    return { revenueLine: currEntries, prevRevenueLine: prevEntries };
  }, [filteredOrders, previousPeriodOrders]);

  /* ── Payment pie ── */
  const paymentPie = useMemo(() => {
    const paid = filteredOrders.filter((o) => o.paymentStatus === "paid").length;
    const unpaid = filteredOrders.filter((o) => o.paymentStatus !== "paid").length;
    return [
      { label: "Paid", value: paid, color: "#4f9e68" },
      { label: "Unpaid", value: unpaid, color: "#d97f2f" },
    ];
  }, [filteredOrders]);

  /* ── Income breakdown pie (paid revenue, lost to cancellations, pending) ── */
  const incomeBreakdown = useMemo(() => {
    const earned = Math.round(filteredOrders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0));
    const lost = Math.round(filteredOrders.filter((o) => o.status === "cancelled").reduce((s, o) => s + o.total, 0));
    const pending = Math.round(
      filteredOrders
        .filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0)
    );
    return [
      { label: "Earned", value: earned, color: "#4f9e68" },
      { label: "Pending payment", value: pending, color: "#f4a261" },
      { label: "Lost (cancelled)", value: lost, color: "#e76f51" },
    ];
  }, [filteredOrders]);

  /* ── Review rating pie ── */
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

  /* ── Agent performance table ── */
  const agentPerformance = useMemo(() => {
    const map = new Map<string, { agentId: string; delivered: number; pending: number }>();
    filteredOrders.forEach((o) => {
      if (!o.deliveryAgentId) return;
      const key = o.deliveryAgentId;
      if (!map.has(key)) map.set(key, { agentId: key, delivered: 0, pending: 0 });
      const rec = map.get(key)!;
      if (o.deliveredAt) rec.delivered++;
      else rec.pending++;
    });
    return [...map.values()].sort((a, b) => b.delivered - a.delivered).slice(0, 10);
  }, [filteredOrders]);

  /* ── Avg delivery rating ── */
  const avgRating = filteredReviews.length
    ? (filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(2)
    : "—";

  return (
    <article className="card admin-card">
      <h2 className="h2">Analytics &amp; Growth</h2>
      {busy && <p className="muted">Loading analytics…</p>}
      {error && <p className="error">{error}</p>}

      {/* Filters */}
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
            <option value="preparing">Preparing</option>
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

      {/* ── Growth KPI Cards ── */}
      <div className="analytics-growth-row">
        <GrowthCard label="Revenue" current={totalRevenue} previous={prevRevenue} isMoney />
        <GrowthCard label="Orders" current={filteredOrders.length} previous={previousPeriodOrders.length} />
        <GrowthCard label="Avg order value" current={Math.round(avgOrderValue)} previous={Math.round(prevAvgOrderValue)} isMoney />
        <GrowthCard label="Reviews" current={filteredReviews.length} previous={0} />
      </div>

      {/* ── Legacy KPI cards ── */}
      <div className="analytics-kpis">
        <div className="card flat">
          <p className="small muted">Total orders (period)</p>
          <strong>{filteredOrders.length}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Total revenue</p>
          <strong>{formatMoney(totalRevenue)}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Avg order value</p>
          <strong>{formatMoney(avgOrderValue)}</strong>
        </div>
        <div className="card flat">
          <p className="small muted">Avg rating ⭐</p>
          <strong>{avgRating}</strong>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="analytics-grid">
        <section className="card flat">
          <h3 className="h3">Order Status Breakdown</h3>
          <BarChart data={statusBars} />
        </section>

        <section className="card flat">
          <h3 className="h3">Revenue Trend — Current vs Previous Period</h3>
          <LineChart
            data={revenueLine.length ? revenueLine : [{ label: "No data", value: 0 }]}
            compare={prevRevenueLine.some((p) => p.value > 0) ? prevRevenueLine : undefined}
          />
        </section>

        <section className="card flat">
          <h3 className="h3">Income Breakdown</h3>
          <PieChart data={incomeBreakdown} />
        </section>

        <section className="card flat">
          <h3 className="h3">Payment Split</h3>
          <PieChart data={paymentPie} />
        </section>

        <section className="card flat">
          <h3 className="h3">Review Ratings</h3>
          <PieChart data={reviewPie} />
        </section>

        {/* ── Agent Performance ── */}
        <section className="card flat analytics-agent-table-section">
          <h3 className="h3">Delivery Agent Performance</h3>
          {agentPerformance.length === 0 ? (
            <p className="small muted">No assigned deliveries in this period.</p>
          ) : (
            <table className="analytics-agent-table">
              <thead>
                <tr>
                  <th className="small muted">#</th>
                  <th className="small muted">Agent ID</th>
                  <th className="small muted">✅ Delivered</th>
                  <th className="small muted">🚚 In progress</th>
                  <th className="small muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((a, i) => (
                  <tr key={a.agentId}>
                    <td className="small muted">{i + 1}</td>
                    <td className="small">{a.agentId.slice(0, 8)}…</td>
                    <td className="small" style={{ color: "#4f9e68", fontWeight: 600 }}>{a.delivered}</td>
                    <td className="small" style={{ color: "#d97f2f" }}>{a.pending}</td>
                    <td className="small">{a.delivered + a.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </article>
  );
}
