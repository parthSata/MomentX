import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import type { User } from "@/types";
import { toast } from "sonner";

// ✅ FIX: Added 'refreshUser' to the interface
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: FormData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>; // <--- New function type definition
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const skipAuthCheck = useRef(false);

    // --- SECURITY HELPER: Sanitize User Data ---
    const sanitizeUser = (userData: any) => {
        if (!userData) return null;

        const {
            password,
            resetPasswordOTP,
            resetPasswordExpires,
            refreshToken,
            accessToken,
            __v,
            ...safeUser
        } = userData;

        return safeUser;
    };

    // --- HELPER: Fetch Current User (Reusable) ---
    // We extracted this logic so it can be called on mount AND manually via refreshUser
    const fetchCurrentUser = async () => {
        try {
            // 1. Backend Fetch (Source of Truth)
            const { data } = await api.get("/users/current-user");

            // Handle nested response structure
            const rawUser = data?.message?.user || data?.data?.user || data?.data;

            if (rawUser) {
                const safeUser = sanitizeUser(rawUser);
                setUser(safeUser);
                // Update local storage so we have the new Bio/Name on next reload
                localStorage.setItem("momentx_user", JSON.stringify(safeUser));
            }
        } catch (error: any) {
            console.error("Fetch user failed:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                setUser(null);
                localStorage.removeItem("momentx_user");
            }
        }
    };

    // Exposed function
    const refreshUser = async () => {
        setIsLoading(true); // Optional: Trigger loading state if you want UI spinners
        await fetchCurrentUser();
        setIsLoading(false);
    };

    // --- 1. Check Session on Load ---
    useEffect(() => {
        const checkAuth = async () => {
            if (skipAuthCheck.current) return;

            await fetchCurrentUser();
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // --- 2. NEW: Refresh User Logic ---
    // Call this after updating profile to update the header/sidebar instantly


    // --- 3. Login Logic ---
    const login = async (credentials: any) => {
        try {
            setIsLoading(true);

            const response = await api.post("/users/login", credentials);
            const resData = response.data;

            const rawUser = resData?.message?.user || resData?.data?.user || resData?.data;

            if (!rawUser || !rawUser._id) {
                throw new Error("Invalid response from server: Missing user data");
            }

            const safeUser = sanitizeUser(rawUser);

            setUser(safeUser);
            localStorage.setItem("momentx_user", JSON.stringify(safeUser));

            toast.success("Welcome back!");
            navigate("/", { replace: true });

        } catch (error: any) {
            console.error("Login Failed:", error);
            const msg = error.response?.data?.message || "Validation Failed";
            const toastMsg = typeof msg === 'object' ? "Login failed" : msg;

            toast.error(toastMsg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // --- 4. Register Logic ---
    const register = async (formData: FormData) => {
        try {
            setIsLoading(true);
            const { data } = await api.post("/users/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const rawUser = data?.message?.user || data?.data?.user || data?.data;

            if (rawUser) {
                const safeUser = sanitizeUser(rawUser);

                setUser(safeUser);
                localStorage.setItem("momentx_user", JSON.stringify(safeUser));

                toast.success("Account created!");
                navigate("/", { replace: true });
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Registration Failed";
            toast.error(typeof msg === 'string' ? msg : "Registration Failed");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // --- 5. Logout Logic ---
    const logout = async () => {
        skipAuthCheck.current = true;
        try {
            await api.post("/users/logout");
        } catch (error) {
            console.error("Logout API failed", error);
        }
        setUser(null);
        localStorage.removeItem("momentx_user");
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading: isLoading,
            login,
            register,
            logout,
            refreshUser // ✅ Exposed to the app
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};