import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function UnauthorizedPage() {
  return (
    <div className="narrow auth-shell">
      <Card className="pixel-card auth-card" style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ fontSize: "3rem", margin: "0 0 1rem" }}>401</h1>
        <h2 className="h2" style={{ color: "var(--danger)" }}>Unauthorized Access</h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          You need to be logged in to access this page. Please log in or register an account.
        </p>
        <Link to="/login" tabIndex={-1}>
          <Button type="button">Go to Login</Button>
        </Link>
      </Card>
    </div>
  );
}
