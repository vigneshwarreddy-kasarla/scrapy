import { FormEvent, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  active: boolean;
  pushRegistered: boolean;
};

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressForm = {
  id?: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY_ADDRESS: AddressForm = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

export function ProfilePage() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addrForm, setAddrForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [me, list] = await Promise.all([
      apiJson<Profile>("/api/v1/users/me"),
      apiJson<Address[]>("/api/v1/users/me/addresses"),
    ]);
    setProfile(me);
    setAddresses(list);
    setName(me.name);
    setEmail(me.email ?? "");
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"));
  }, []);

  async function submitProfile(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, string> = {};
      if (name.trim() !== (profile?.name ?? "")) body.name = name.trim();
      if (email.trim() !== (profile?.email ?? "")) body.email = email.trim();
      if (Object.keys(body).length > 0) {
        await apiJson<Profile>("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(body) });
      }
      await load();
      await refreshProfile();
      setSuccess("Profile updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    } finally {
      setBusy(false);
    }
  }

  function editAddress(a: Address) {
    setAddrForm({
      id: a.id,
      label: a.label ?? "",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      region: a.region ?? "",
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    });
  }

  async function submitAddress(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        label: addrForm.label || null,
        line1: addrForm.line1,
        line2: addrForm.line2 || null,
        city: addrForm.city,
        region: addrForm.region || null,
        postalCode: addrForm.postalCode,
        country: (addrForm.country || "IN").toUpperCase(),
        isDefault: addrForm.isDefault,
      };
      if (addrForm.id) {
        await apiJson<Address>(`/api/v1/users/me/addresses/${addrForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setSuccess("Address updated.");
      } else {
        await apiJson<Address>("/api/v1/users/me/addresses", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setSuccess("Address added.");
      }
      setAddrForm(EMPTY_ADDRESS);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Address save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAddress(id: string) {
    if (!window.confirm("Delete this address?")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiJson<null>(`/api/v1/users/me/addresses/${id}`, { method: "DELETE" });
      await load();
      setSuccess("Address deleted.");
      if (addrForm.id === id) setAddrForm(EMPTY_ADDRESS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return <p className="muted">Loading profile…</p>;

  return (
    <div className="profile-grid">
      <section className="card">
        <h1>Profile</h1>
        <p className="muted small">Phone: {profile.phone}</p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={(e) => void submitProfile(e)} className="stack">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} />
          </label>
          <button type="submit" disabled={busy}>
            Save profile
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="h2">Addresses</h2>
        <form onSubmit={(e) => void submitAddress(e)} className="stack">
          <label>
            Label
            <input value={addrForm.label} onChange={(e) => setAddrForm((s) => ({ ...s, label: e.target.value }))} maxLength={80} />
          </label>
          <label>
            Line 1
            <input
              value={addrForm.line1}
              onChange={(e) => setAddrForm((s) => ({ ...s, line1: e.target.value }))}
              maxLength={200}
              required
            />
          </label>
          <label>
            Line 2
            <input value={addrForm.line2} onChange={(e) => setAddrForm((s) => ({ ...s, line2: e.target.value }))} maxLength={200} />
          </label>
          <div className="row gap">
            <label className="grow">
              City
              <input
                value={addrForm.city}
                onChange={(e) => setAddrForm((s) => ({ ...s, city: e.target.value }))}
                maxLength={100}
                required
              />
            </label>
            <label className="grow">
              Region
              <input value={addrForm.region} onChange={(e) => setAddrForm((s) => ({ ...s, region: e.target.value }))} maxLength={100} />
            </label>
          </div>
          <div className="row gap">
            <label className="grow">
              Postal code
              <input
                value={addrForm.postalCode}
                onChange={(e) => setAddrForm((s) => ({ ...s, postalCode: e.target.value }))}
                maxLength={20}
                required
              />
            </label>
            <label className="grow">
              Country
              <input
                value={addrForm.country}
                onChange={(e) => setAddrForm((s) => ({ ...s, country: e.target.value.toUpperCase() }))}
                maxLength={2}
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={addrForm.isDefault}
              onChange={(e) => setAddrForm((s) => ({ ...s, isDefault: e.target.checked }))}
            />
            Set as default
          </label>
          <div className="row gap">
            <button type="submit" disabled={busy}>
              {addrForm.id ? "Update address" : "Add address"}
            </button>
            {addrForm.id && (
              <button type="button" className="linkish" onClick={() => setAddrForm(EMPTY_ADDRESS)}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <ul className="list-plain stack address-list">
          {addresses.map((a) => (
            <li key={a.id} className="card flat">
              <div className="row spread">
                <strong>{a.label || "Address"}</strong>
                {a.isDefault && <span className="pill">default</span>}
              </div>
              <p className="small muted">
                {[a.line1, a.line2, a.city, a.region, a.postalCode, a.country].filter(Boolean).join(", ")}
              </p>
              <div className="row gap">
                <button type="button" className="linkish" onClick={() => editAddress(a)}>
                  Edit
                </button>
                <button type="button" className="linkish danger-text" onClick={() => void deleteAddress(a.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
          {addresses.length === 0 && <p className="muted small">No addresses yet.</p>}
        </ul>
      </section>
    </div>
  );
}
