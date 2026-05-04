import { FormEvent, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";

type Rule = { label: string; ok: boolean };

function passwordRules(password: string): Rule[] {
  return [
    { label: "8 to 72 characters", ok: password.length >= 8 && password.length <= 72 },
    { label: "At least 1 uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "At least 1 lowercase letter", ok: /[a-z]/.test(password) },
    { label: "At least 1 number", ok: /\d/.test(password) },
    { label: "At least 1 special character", ok: /[^A-Za-z0-9]/.test(password) },
    { label: "No spaces", ok: !/\s/.test(password) },
  ];
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5c5.5 0 9.6 3.3 11 7-1.4 3.7-5.5 7-11 7S2.4 15.7 1 12c1.4-3.7 5.5-7 11-7Zm0 2C8 7 4.8 9.2 3.2 12 4.8 14.8 8 17 12 17s7.2-2.2 8.8-5C19.2 9.2 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="m3 4.3 1.4-1.4 16.3 16.3-1.4 1.4-2.8-2.8A13.8 13.8 0 0 1 12 19c-5.5 0-9.6-3.3-11-7a12.8 12.8 0 0 1 4.3-5.2L3 4.3Zm3.8 3.8A10.6 10.6 0 0 0 3.2 12C4.8 14.8 8 17 12 17c1.4 0 2.8-.3 4-.9l-2-2a4 4 0 0 1-5.1-5.1l-2-2Zm5 5 2.3 2.3a2.5 2.5 0 0 1-2.3-2.3Zm8.9 1.9-2-2a10.4 10.4 0 0 0 2.1-1A12.5 12.5 0 0 0 12 7c-.8 0-1.6.1-2.3.3l-1.7-1.7A13.5 13.5 0 0 1 12 5c5.5 0 9.6 3.3 11 7-.5 1.4-1.3 2.7-2.3 3.9ZM12.3 9.5a2.5 2.5 0 0 1 2.2 2.2l-2.2-2.2Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { token, login, register } = useAuth();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/menu";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rules = useMemo(() => passwordRules(password), [password]);
  const failedRules = rules.filter((r) => !r.ok);
  const hasViolations = failedRules.length > 0;
  const confirmMismatch = mode === "register" && confirmPassword.length > 0 && password !== confirmPassword;

  if (token) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (mode === "register" && password !== confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(phone.trim(), password);
      } else {
        await register({ name: name.trim(), email, phone: phone.trim(), password });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow auth-shell">
      <Card className="pixel-card auth-card">
        <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
        <div className="tabs">
          <Button type="button" className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>
            Log in
          </Button>
          <Button
            type="button"
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
          >
            Register
          </Button>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={(e) => void onSubmit(e)} className="stack auth-form">
          {mode === "register" && (
            <label className="floating-field">
              <input
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder=" "
              />
              <span className="floating-label">Name</span>
            </label>
          )}
          {mode === "register" && (
            <label className="floating-field">
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={150}
                placeholder=" "
              />
              <span className="floating-label">Email (optional)</span>
            </label>
          )}
          <label className="floating-field phone-floating">
            <span className="phone-prefix">+91</span>
            <input
              className="auth-input with-prefix"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              inputMode="numeric"
              maxLength={10}
              placeholder=" "
            />
            <span className="floating-label">Phone</span>
          </label>
          <label className="floating-field password-floating">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder=" "
            />
            <span className="floating-label">Password</span>
            <Button
              type="button"
              className="linkish password-toggle icon-toggle plain-icon-btn wide-hit-target"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </Button>
          </label>
          {mode === "register" && (
            <>
              {passwordFocused && failedRules.length > 0 && (
                <ul className="password-rules" aria-live="polite">
                  {failedRules.map((r) => (
                    <li key={r.label} className="rule-bad">
                      ✗ {r.label}
                    </li>
                  ))}
                </ul>
              )}
              <label className="floating-field password-floating">
                <input
                  className="auth-input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder=" "
                />
                <span className="floating-label">Confirm password</span>
                <Button
                  type="button"
                  className="linkish password-toggle icon-toggle plain-icon-btn wide-hit-target"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  <EyeIcon open={showConfirmPassword} />
                </Button>
              </label>
              {confirmMismatch && <p className="error small">Passwords do not match.</p>}
            </>
          )}
          <Button type="submit" disabled={busy || (mode === "register" && (hasViolations || confirmMismatch || phone.length !== 10)) || (mode === "login" && phone.length !== 10)}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
