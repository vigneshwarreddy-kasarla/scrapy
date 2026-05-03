import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { CustomerRoute } from "./components/CustomerRoute";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AdminAgentsPage } from "./pages/admin/AdminAgentsPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminGameAnalyticsPage } from "./pages/admin/AdminGameAnalyticsPage";
import { AdminGameSettingsPage } from "./pages/admin/AdminGameSettingsPage";
import { AdminHistoryPage } from "./pages/admin/AdminHistoryPage";
import { AdminMenuPage } from "./pages/admin/AdminMenuPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage";
import { AdminPage } from "./pages/AdminPage";
import { CartPage } from "./pages/CartPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { MenuItemDetailPage } from "./pages/MenuItemDetailPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SoccerGamePage } from "./pages/SoccerGamePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/menu" replace />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="menu/items/:itemId" element={<MenuItemDetailPage />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="agents" element={<AdminAgentsPage />} />
              <Route path="menu" element={<AdminMenuPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="game-settings" element={<AdminGameSettingsPage />} />
              <Route path="game-analytics" element={<AdminGameAnalyticsPage />} />
            </Route>
            <Route path="login" element={<LoginPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="game/soccer"
              element={<SoccerGamePage />}
            />
            <Route
              path="cart"
              element={
                <CustomerRoute>
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                </CustomerRoute>
              }
            />
            <Route
              path="favorites"
              element={
                <CustomerRoute>
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                </CustomerRoute>
              }
            />
            <Route
              path="orders"
              element={
                <CustomerRoute>
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                </CustomerRoute>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <CustomerRoute>
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                </CustomerRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
