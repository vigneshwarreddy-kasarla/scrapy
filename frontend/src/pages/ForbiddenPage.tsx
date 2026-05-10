import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function ForbiddenPage() {
  return (
    <div className="narrow auth-shell">
      <Card className="pixel-card auth-card" style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ fontSize: "3rem", margin: "0 0 1rem" }}>403</h1>
        <h2 className="h2" style={{ color: "var(--danger)" }}>Forbidden</h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          You do not have the required permissions to access this area.
        </p>
        <Link to="/" tabIndex={-1}>
          <Button type="button">Return to Home</Button>
        </Link>
      </Card>
    </div>
  );
}
