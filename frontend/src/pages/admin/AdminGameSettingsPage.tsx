import { FormEvent, useEffect, useState } from "react";
import { apiJson } from "../../api/client";

type SoccerSettings = {
  enabled: boolean;
  minDiscountPercent: number;
  maxDiscountPercent: number;
  couponTtlHours: number;
  updatedAt: string;
};

export function AdminGameSettingsPage() {
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState<SoccerSettings>({
    enabled: true,
    minDiscountPercent: 5,
    maxDiscountPercent: 25,
    couponTtlHours: 24,
    updatedAt: "",
  });

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<SoccerSettings>("/api/v1/admin/games/soccer/settings");
      setForm(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load game settings");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await apiJson<SoccerSettings>("/api/v1/admin/games/soccer/settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: form.enabled,
          minDiscountPercent: form.minDiscountPercent,
          maxDiscountPercent: form.maxDiscountPercent,
          couponTtlHours: form.couponTtlHours,
        }),
      });
      setForm(res);
      setOk("Soccer game settings updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card admin-card">
      <h2 className="h2">Soccer Game Settings</h2>
      {busy && <p className="muted">Loading settings…</p>}
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((v) => ({ ...v, enabled: e.target.checked }))} />
          Enable soccer coupon generation
        </label>
        <label>
          Minimum discount (%)
          <input
            type="number"
            min={1}
            max={90}
            value={form.minDiscountPercent}
            onChange={(e) => setForm((v) => ({ ...v, minDiscountPercent: Number(e.target.value) }))}
          />
        </label>
        <label>
          Maximum discount (%)
          <input
            type="number"
            min={1}
            max={90}
            value={form.maxDiscountPercent}
            onChange={(e) => setForm((v) => ({ ...v, maxDiscountPercent: Number(e.target.value) }))}
          />
        </label>
        <label>
          Coupon TTL (hours)
          <input
            type="number"
            min={1}
            max={168}
            value={form.couponTtlHours}
            onChange={(e) => setForm((v) => ({ ...v, couponTtlHours: Number(e.target.value) }))}
          />
        </label>
        <p className="small muted">Last updated: {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : "—"}</p>
        <button type="submit" disabled={busy || saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </article>
  );
}
