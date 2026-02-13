import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import ExplorePage from "@/pages/ExplorePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import NotFound from "@/pages/NotFound";
import ChatListPage from "@/pages/ChatListPage";
import ChatPage from "@/pages/ChatPage";
import ReelsPage from "@/pages/ReelsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SearchPage from "@/pages/SearchPage";
import AdminPage from "@/pages/AdminPage";
import CreatePostPage from "@/pages/CreatePostPage";
import FollowersPage from "@/pages/FollowersPage";

// ✅ IMPORT THE NEW PAGE
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import CreateReelPage from "@/pages/CreateReelPage";
import UserProfilePage from "@/pages/UserProfilePage";
import ActivityPage from "@/pages/ActivityPage";
import SettingsPage from "@/pages/SettingsPage";

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
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
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

        {/* ✅ ADDED THIS MISSING ROUTE */}
        <Route
          path="/reels/create"
          element={
            <PageTransition>
              <CreateReelPage />
            </PageTransition>
          }
        />

        <Route
          path="/settings"
          element={
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          }
        />

        {/* ✅ ADDED THIS MISSING ROUTE */}
        <Route
          path="/create-reel"
          element={
            <PageTransition>
              <CreateReelPage />
            </PageTransition>
          }
        />

        <Route
          path="/activity"
          element={
            <PageTransition>
              <ActivityPage />
            </PageTransition>
          }
        />

        {/* ✅ THIS IS THE MISSING ROUTE FIX */}
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPasswordPage />
            </PageTransition>
          }
        />

        <Route
          path="/u/:username"
          element={
            <PageTransition>
              <UserProfilePage />
            </PageTransition>
          }
        />

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
        <Route
          path="/create"
          element={
            <PageTransition>
              <CreatePostPage />
            </PageTransition>
          }
        />

        <Route
          path="/followers"
          element={<Navigate to="/followers/followers" replace />}
        />
        <Route
          path="/followers/:type"
          element={
            <PageTransition>
              <FollowersPage />
            </PageTransition>
          }
        />
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