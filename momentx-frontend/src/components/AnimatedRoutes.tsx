import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import ExplorePage from "@/pages/ExplorePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"; // ✅ Added Import
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import NotFound from "@/pages/NotFound";
import ChatListPage from "@/pages/ChatListPage";
import ChatPage from "@/pages/ChatPage";
import ReelsPage from "@/pages/ReelsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SearchPage from "@/pages/SearchPage";
import AdminPage from "@/pages/AdminPage";
import FollowersPage from "@/pages/FollowersPage";

// Admin route protection
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Main Feed */}
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />

        {/* Profile & Explore */}
        <Route
          path="/profile"
          element={
            <PageTransition>
              <ProfilePage />
            </PageTransition>
          }
        />
        <Route
          path="/explore"
          element={
            <PageTransition>
              <ExplorePage />
            </PageTransition>
          }
        />

        {/* --- Authentication Routes --- */}
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition>
              <SignupPage />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPasswordPage />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPasswordPage />
            </PageTransition>
          }
        />
        {/* ----------------------------- */}

        {/* Chat Features */}
        <Route
          path="/chat"
          element={
            <PageTransition>
              <ChatListPage />
            </PageTransition>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <PageTransition>
              <ChatPage />
            </PageTransition>
          }
        />

        {/* Social Features */}
        <Route
          path="/reels"
          element={
            <PageTransition>
              <ReelsPage />
            </PageTransition>
          }
        />
        <Route
          path="/notifications"
          element={
            <PageTransition>
              <NotificationsPage />
            </PageTransition>
          }
        />
        <Route
          path="/search"
          element={
            <PageTransition>
              <SearchPage />
            </PageTransition>
          }
        />
        <Route
          path="/followers/:type"
          element={
            <PageTransition>
              <FollowersPage />
            </PageTransition>
          }
        />

        {/* Admin Area */}
        <Route
          path="/admin/login"
          element={
            <PageTransition>
              <AdminLoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageTransition>
                <AdminPage />
              </PageTransition>
            </AdminRoute>
          }
        />

        {/* 404 Not Found */}
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}