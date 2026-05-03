import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { DeliveryAgent, renderPager } from "./shared";

const PAGE_SIZE = 8;

export function AdminAgentsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [newAgent, setNewAgent] = useState({ name: "", phone: "", email: "", password: "" });
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));
  const pagedAgents = useMemo(() => agents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [agents, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiJson<DeliveryAgent[]>("/api/v1/admin/staff/delivery-agents");
      setAgents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load delivery agents");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createDeliveryAgent(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setOkMsg(null);
    try {
      await apiJson("/api/v1/admin/staff/delivery-agents", {
        method: "POST",
        body: JSON.stringify({
          name: newAgent.name.trim(),
          email: newAgent.email.trim() || undefined,
          phone: newAgent.phone.replace(/\D/g, "").slice(0, 10),
          password: newAgent.password,
        }),
      });
      setOkMsg("Delivery agent created");
      setNewAgent({ name: "", phone: "", email: "", password: "" });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create agent");
    }
  }

  return (
    <article className="card admin-card">
      <h2 className="h2">Delivery Agents</h2>
      {busy && <p className="muted">Loading delivery agents…</p>}
      {error && <p className="error">{error}</p>}
      {okMsg && <p className="success">{okMsg}</p>}

      <ul className="list-plain stack">
        {pagedAgents.map((a) => (
          <li key={a.id} className="card flat">
            <strong>{a.name}</strong>
            <p className="small muted">
              {a.phone}
              {a.email ? ` · ${a.email}` : ""}
            </p>
          </li>
        ))}
      </ul>
      {renderPager(page, totalPages, setPage)}

      <form className="stack" onSubmit={(e) => void createDeliveryAgent(e)}>
        <input
          placeholder="Name"
          value={newAgent.name}
          onChange={(e) => setNewAgent((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          placeholder="Phone (10 digits)"
          value={newAgent.phone}
          onChange={(e) => setNewAgent((v) => ({ ...v, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
          required
        />
        <input
          placeholder="Email (optional)"
          value={newAgent.email}
          onChange={(e) => setNewAgent((v) => ({ ...v, email: e.target.value }))}
        />
        <input
          placeholder="Password"
          type="password"
          value={newAgent.password}
          onChange={(e) => setNewAgent((v) => ({ ...v, password: e.target.value }))}
          required
        />
        <button type="submit">Add delivery agent</button>
      </form>
    </article>
  );
}
