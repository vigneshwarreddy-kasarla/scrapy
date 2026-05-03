import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiJson, getStoredToken, setStoredToken } from "../api/client";
import {
  flushCustomerCacheOnLogout,
  mergeGuestDataOnLogin,
  restoreCustomerCacheFromServer,
} from "../commerce/sessionSync";

export type UserProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  active: boolean;
  pushRegistered: boolean;
};

type AuthState = {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = await apiJson<UserProfile>("/api/v1/users/me");
      setUser(me);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (token) await refreshProfile();
      else setUser(null);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshProfile]);

  const login = useCallback(async (phone: string, password: string) => {
    const phoneDigits = phone.replace(/\D/g, "").slice(0, 10);
    const res = await apiJson<{ accessToken: string }>("/api/v1/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ phone: phoneDigits, password }),
    });
    setStoredToken(res.accessToken);
    setToken(res.accessToken);
    const me = await apiJson<UserProfile>("/api/v1/users/me");
    if (me.role === "customer") {
      await mergeGuestDataOnLogin();
      await restoreCustomerCacheFromServer();
    }
    setUser(me);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone: string; password: string }) => {
      const phoneDigits = input.phone.replace(/\D/g, "").slice(0, 10);
      const body: Record<string, string> = {
        name: input.name,
        phone: phoneDigits,
        password: input.password,
      };
      if (input.email.trim()) body.email = input.email.trim();
      const res = await apiJson<{ accessToken: string }>("/api/v1/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(body),
      });
      setStoredToken(res.accessToken);
      setToken(res.accessToken);
      const me = await apiJson<UserProfile>("/api/v1/users/me");
      if (me.role === "customer") {
        await mergeGuestDataOnLogin();
        await restoreCustomerCacheFromServer();
      }
      setUser(me);
    },
    []
  );

  const logout = useCallback(async () => {
    if (user?.role === "customer") {
      try {
        await flushCustomerCacheOnLogout();
      } catch {
        /* keep logout resilient even if sync fails */
      }
    }
    try {
      await apiJson<null>("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* still clear client */
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, [user?.role]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, user, loading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
