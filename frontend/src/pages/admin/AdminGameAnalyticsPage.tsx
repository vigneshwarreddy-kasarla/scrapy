import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";

type SoccerCoupon = {
  code: string;
  discountPercent: number;
  expiresAt: string;
  createdAt: string;
};

type SoccerAnalytics = {
  generatedCoupons: number;
  activeCoupons: number;
  redeemedCoupons: number;
  redemptionRatePercent: number;
  averageDiscountPercent: number;
  latestCoupons: SoccerCoupon[];
};

export function AdminGameAnalyticsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SoccerAnalytics | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<SoccerAnalytics>("/api/v1/admin/games/soccer/analytics");
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load soccer analytics");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <article className="card admin-card">
      <h2 className="h2">Soccer Game Analytics</h2>
      {busy && <p className="muted">Loading analytics…</p>}
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="analytics-kpis">
            <div className="card flat">
              <p className="small muted">Generated coupons</p>
              <strong>{data.generatedCoupons}</strong>
            </div>
            <div className="card flat">
              <p className="small muted">Active coupons</p>
              <strong>{data.activeCoupons}</strong>
            </div>
            <div className="card flat">
              <p className="small muted">Redeemed coupons</p>
              <strong>{data.redeemedCoupons}</strong>
            </div>
            <div className="card flat">
              <p className="small muted">Redemption rate</p>
              <strong>{data.redemptionRatePercent.toFixed(1)}%</strong>
            </div>
          </div>

          <div className="card flat">
            <p className="small muted">Average discount won</p>
            <strong>{data.averageDiscountPercent.toFixed(1)}%</strong>
          </div>

          <div>
            <h3 className="h3">Latest soccer coupons</h3>
            {!data.latestCoupons.length ? (
              <p className="muted">No soccer coupons generated yet.</p>
            ) : (
              <ul className="list-plain stack">
                {data.latestCoupons.map((c) => (
                  <li key={c.code} className="card flat">
                    <strong>{c.code}</strong>
                    <p className="small muted">
                      {c.discountPercent}% · Created {new Date(c.createdAt).toLocaleString()} · Expires{" "}
                      {new Date(c.expiresAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </article>
  );
}
