import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/axios";

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
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import CreateReelPage from "@/pages/CreateReelPage";
import UserProfilePage from "@/pages/UserProfilePage";
import ActivityPage from "@/pages/ActivityPage";
import SettingsPage from "@/pages/SettingsPage";
import { SplashScreen } from "@/components/SplashScreen"; // ✅ IMPORT SPLASH SCREEN
import GroupChatPage from "@/pages/GroupChatPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

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
  const [showSplash, setShowSplash] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if the user has already seen the splash screen this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    if (!hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem("hasSeenSplash", "true");
    }
  }, []);

  // ✅ NEW: Track Visitor Activity
  useEffect(() => {
    if (isAuthenticated && user) {
        // Track the visit - UPDATED: Point to activity routes to avoid strict Admin URLs
        api.post("/activity/track-visit", { path: location.pathname })
           .catch(() => {}); // SILENT FAIL
    }
  }, [location.pathname, isAuthenticated, user]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <div className={showSplash ? "hidden" : "block"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <HomePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ProfilePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/group-chat/:id"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <GroupChatPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ExplorePage />
                  </PageTransition>
                </ProtectedRoute>
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

            <Route
              path="/reels/create"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <CreateReelPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <SettingsPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-reel"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <CreateReelPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ActivityPage />
                  </PageTransition>
                </ProtectedRoute>
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

            <Route
              path="/u/:username"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <UserProfilePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ChatListPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ChatPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reels"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ReelsPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <NotificationsPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <SearchPage />
                  </PageTransition>
                </ProtectedRoute>
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
                <ProtectedRoute>
                  <PageTransition>
                    <CreatePostPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/followers"
              element={<Navigate to="/followers/followers" replace />}
            />
            <Route
              path="/followers/:type"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <FollowersPage />
                  </PageTransition>
                </ProtectedRoute>
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
      </div>
    </>
  );
}