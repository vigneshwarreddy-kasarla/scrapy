import { useEffect, useState } from "react";
import { Button, Card } from "../components/ui";
import { apiJson, getStoredToken } from "../api/client";

type SoccerCoupon = {
  code: string;
  discountPercent: number;
  expiresAt: string;
  createdAt: string;
};

type SoccerPlayResponse = {
  settingsEnabled: boolean;
  message: string;
  activeCoupon: SoccerCoupon | null;
  newlyGeneratedCoupon: SoccerCoupon | null;
};

type ShotDirection = "left" | "center" | "right";
type MatchPhase = "idle" | "charging" | "shooting" | "resolving" | "result";

export function SoccerGamePage() {
  const isLoggedIn = Boolean(getStoredToken());
  const [busy, setBusy] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SoccerPlayResponse | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [guestPhone, setGuestPhone] = useState("");
  const [guestReady, setGuestReady] = useState(false);
  const [shotDirection, setShotDirection] = useState<ShotDirection | null>(null);
  const [keeperDirection, setKeeperDirection] = useState<ShotDirection | null>(null);
  const [roundText, setRoundText] = useState<string | null>(null);
  const [power, setPower] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>("idle");
  const [attempts, setAttempts] = useState(0);

  async function loadStatus() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<SoccerPlayResponse>("/api/v1/games/soccer");
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load soccer game.");
    } finally {
      setBusy(false);
    }
  }

  async function loadGuestStatus() {
    const digits = guestPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid mobile number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<SoccerPlayResponse>("/api/v1/games/soccer/guest/status", {
        method: "POST",
        body: JSON.stringify({ mobileNumber: digits }),
        auth: false,
      });
      setData(res);
      setGuestReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guest game status.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      void loadStatus();
      return;
    }
    setBusy(false);
  }, [isLoggedIn]);

  async function play() {
    setPlaying(true);
    setError(null);
    setFlash(null);
    try {
      const path = isLoggedIn ? "/api/v1/games/soccer/play" : "/api/v1/games/soccer/guest/play";
      const res = await apiJson<SoccerPlayResponse>(path, {
        method: "POST",
        body: isLoggedIn ? undefined : JSON.stringify({ mobileNumber: guestPhone.replace(/\D/g, "") }),
        auth: isLoggedIn,
      });
      setData(res);
      setFlash(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Play failed.");
    } finally {
      setPlaying(false);
    }
  }

  async function takeShot(direction: ShotDirection) {
    if (!data?.settingsEnabled || playing || data.activeCoupon || (!isLoggedIn && !guestReady)) return;
    setAttempts((v) => v + 1);
    setPhase("charging");
    setRoundText("Charging shot power...");
    setPower(0);
    for (let i = 1; i <= 10; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 70));
      setPower(i * 10);
    }
    setPhase("shooting");
    setShotDirection(direction);
    const keeper: ShotDirection = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    setKeeperDirection(keeper);
    setRoundText("Shot released... goalkeeper is diving...");
    setPlaying(true);
    setError(null);
    setFlash(null);

    await new Promise((resolve) => setTimeout(resolve, 900));
    setPhase("resolving");
    setRoundText("Checking if it is a save or a goal...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    const isSaved = keeper === direction && Math.random() < 0.65;
    if (isSaved) {
      setPhase("result");
      setRoundText("Saved! Try another penalty shot.");
      setPlaying(false);
      setPower(0);
      return;
    }
    setPhase("result");
    setRoundText("GOAL! Generating your soccer coupon...");
    await play();
    setPower(0);
  }

  const coupon = data?.activeCoupon ?? null;

  return (
    <section className="stack game-page">
      <Card className="pixel-card game-glass-card">
        <h1>Soccer Reward Game</h1>
        <p className="muted">
          Shoot once and win a coupon. For now, only one game is enabled: <strong>Soccer</strong>.
        </p>
        {!isLoggedIn && (
          <div className="stack">
            <label>
              Mobile number
              <div className="coupon-row">
                <input
                  placeholder="Enter mobile number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
                <Button type="button" onClick={() => void loadGuestStatus()}>
                  Continue
                </Button>
              </div>
            </label>
            <p className="small muted">No login needed. We remember your coupon by mobile number.</p>
          </div>
        )}
        {busy && <p className="muted">Loading game…</p>}
        {error && <p className="error">{error}</p>}
        {flash && <p className="success">{flash}</p>}
        {!busy && data && (
          <div className="stack">
            <p className="small">{data.message}</p>
            <div className={`soccer-field glassy ${phase}`}>
              <div className="soccer-goal">
                <span className="small muted">Goal</span>
              </div>
              <div className={`soccer-keeper ${keeperDirection ?? "center"}`} aria-hidden="true">
                🧤
              </div>
              <div className={`soccer-ball ${shotDirection ?? "center"}`} aria-hidden="true">
                ⚽
              </div>
              <div className="match-overlay">
                <span className="small">Phase: {phase}</span>
                <span className="small">Attempts: {attempts}</span>
              </div>
            </div>
            <div className="power-meter" aria-label="Shot power meter">
              <div className="power-meter-fill" style={{ width: `${power}%` }} />
            </div>
            <p className="small muted">Build power, shoot, then wait for VAR-style result reveal.</p>
            <div className="shot-controls">
              <Button
                type="button"
                disabled={!data.settingsEnabled || playing || Boolean(coupon) || (!isLoggedIn && !guestReady)}
                onClick={() => void takeShot("left")}
              >
                Shoot Left
              </Button>
              <Button
                type="button"
                disabled={!data.settingsEnabled || playing || Boolean(coupon) || (!isLoggedIn && !guestReady)}
                onClick={() => void takeShot("center")}
              >
                Shoot Center
              </Button>
              <Button
                type="button"
                disabled={!data.settingsEnabled || playing || Boolean(coupon) || (!isLoggedIn && !guestReady)}
                onClick={() => void takeShot("right")}
              >
                Shoot Right
              </Button>
            </div>
            {roundText && <p className="small muted">{roundText}</p>}
          </div>
        )}
      </Card>

      <Card className="pixel-card game-glass-card">
        <h2 className="h2">Your Active Coupon</h2>
        {!coupon ? (
          <p className="muted">No active soccer coupon yet.</p>
        ) : (
          <div className="coupon-ticket">
            <p>
              <strong>{coupon.code}</strong>
            </p>
            <p className="small">Discount: {coupon.discountPercent}%</p>
            <p className="small muted">Expires: {new Date(coupon.expiresAt).toLocaleString()}</p>
            <p className="small muted">Apply this at checkout.</p>
          </div>
        )}
      </Card>
    </section>
  );
}
