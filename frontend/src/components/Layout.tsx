import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "./ui";
import { useAuth } from "../context/AuthContext";
import { getCartTotalQuantity } from "../commerce/sessionSync";

export function Layout() {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartTotalQuantity(token));
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  // Recalculate quantity whenever token or cart changes
  useEffect(() => {
    setCartCount(getCartTotalQuantity(token));
  }, [token]);

  useEffect(() => {
    const handleCartChanged = () => {
      setCartCount(getCartTotalQuantity(token));
    };
    window.addEventListener("cart:changed", handleCartChanged);
    return () => window.removeEventListener("cart:changed", handleCartChanged);
  }, [token]);

  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="brand" onClick={() => setMobileNavOpen(false)}>
          <img src="/flog.svg" alt="FILOS logo" className="brand-logo" />
          <span className="brand-text">FILOS</span>
        </NavLink>
        <button
          type="button"
          className="nav-menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          ☰
        </button>
        <nav className={mobileNavOpen ? "nav open" : "nav"}>
          <NavLink to="/menu" onClick={() => setMobileNavOpen(false)}>Menu</NavLink>
          <NavLink to="/game/soccer" onClick={() => setMobileNavOpen(false)}>Soccer Game</NavLink>
          {user && (
            <>
              {isAdmin && <NavLink to="/admin/orders" onClick={() => setMobileNavOpen(false)}>Admin</NavLink>}
              <NavLink to="/profile" onClick={() => setMobileNavOpen(false)}>Profile</NavLink>
              {isCustomer && (
                <>
                  <NavLink to="/cart" onClick={() => setMobileNavOpen(false)}>Cart</NavLink>
                  <NavLink to="/favorites" onClick={() => setMobileNavOpen(false)}>Favorites</NavLink>
                  <NavLink to="/orders" onClick={() => setMobileNavOpen(false)}>Orders</NavLink>
                </>
              )}
            </>
          )}
          {user ? (
            <span className="nav-user">
              <span className="muted">{user.name}</span>
              <Button type="button" className="nav-logout-btn" onClick={() => void logout()}>
                Log out
              </Button>
            </span>
          ) : (
            <NavLink to="/login" onClick={() => setMobileNavOpen(false)}>Log in</NavLink>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <section className="footer-brand-block">
            <p className="footer-brand">FILLOS</p>
            <p className="footer-tagline">Food that arrives fast, fresh, and consistent.</p>
            <p className="footer-contact-line">3rd Floor, Main Street Tech Park, Bengaluru</p>
            <p className="footer-contact-line">
              <a href="mailto:hello@fillos.com">hello@fillos.com</a> ·{" "}
              <a href="tel:+919876543210">+91 98765 43210</a>
            </p>
          </section>

          <div className="footer-grid">
            <div className="footer-col">
              <p className="footer-col-title">Quick Links</p>
              <a href="#">Track Order</a>
              <a href="#">Book Delivery</a>
              <a href="#">Support</a>
              <a href="#">Courier App</a>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Services</p>
              <a href="#">Ecommerce & D2C</a>
              <a href="#">Hyperlocal & Quick Commerce</a>
              <a href="#">SME & Personal Courier</a>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Partners</p>
              <a href="#">Delivery Partner</a>
              <a href="#">Client Partner</a>
              <a href="#">Franchise Partner</a>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Company</p>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blogs</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Legal</p>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Refund Policy</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="small muted">Download App</p>
            <div className="footer-badges">
              <a href="#" className="footer-badge">Google Play</a>
              <a href="#" className="footer-badge">App Store</a>
            </div>
            <p className="small muted">© 2026 Fillos Technologies Pvt Ltd.</p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button (Swiggy-style) */}
      {cartCount > 0 && location.pathname !== "/cart" && (
        <Link to="/cart" className="floating-cart-btn" aria-label="View Cart">
          <div className="floating-cart-content">
            <span className="floating-cart-count">{cartCount} {cartCount === 1 ? "item" : "items"} added</span>
            <span className="floating-cart-separator">|</span>
            <span className="floating-cart-action">
              View Cart 🛒 <span className="floating-cart-arrow">➔</span>
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
