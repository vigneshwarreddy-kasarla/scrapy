import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

const adminTabs = [
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/agents", label: "Delivery Agents" },
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/history", label: "History" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/game-settings", label: "Game Settings" },
  { to: "/admin/game-analytics", label: "Game Analytics" },
];

export function AdminPage() {
  const location = useLocation();

  if (location.pathname === "/admin") {
    return <Navigate to="/admin/orders" replace />;
  }

  return (
    <section className="stack admin-stack">
      <h1>Admin Dashboard</h1>
      <nav className="admin-tabs" aria-label="Admin sections">
        {adminTabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? "admin-tab active" : "admin-tab")}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  );
}
