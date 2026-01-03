import { useState, useEffect } from "react";
import { api } from "@/lib/axios";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me");
        // ✅ FIX: Set the FULL user object, not just the ID
        setUser(data.message.user);
      } catch (error) {
        console.warn("⚠️ Not Authenticated");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return { user, loading };
}
