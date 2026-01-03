import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import type { User } from "@/types";
import { toast } from "sonner";


interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: FormData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const skipAuthCheck = useRef(false);

    // --- SECURITY HELPER: Sanitize User Data ---
    // Removes sensitive fields before saving to state/localStorage
    const sanitizeUser = (userData: any) => {
        if (!userData) return null;

        const {
            password,
            resetPasswordOTP,
            resetPasswordExpires,
            refreshToken,
            accessToken, // Token should be in cookie, not localstorage user object
            __v,
            ...safeUser
        } = userData;

        return safeUser;
    };

    // --- 1. Check Session on Load ---
    useEffect(() => {
        const checkAuth = async () => {
            if (skipAuthCheck.current) return;

            try {
                // 1. Try LocalStorage (Fast load)
                const stored = localStorage.getItem("momentx_user");
                if (stored && stored !== "undefined" && stored !== "null") {
                    setUser(JSON.parse(stored));
                }

                // 2. Verify with Backend (Source of Truth)
                const { data } = await api.get("/users/current-user");

                // Handle various backend response structures
                const rawUser = data?.message?.user || data?.data || data?.message?.user || data?.user;

                if (rawUser) {
                    const safeUser = sanitizeUser(rawUser);
                    setUser(safeUser);
                    localStorage.setItem("momentx_user", JSON.stringify(safeUser));
                }
            } catch (error) {
                // Only clear if 401 (Unauthorized) or 403 (Forbidden)
                // @ts-ignore
                if (error.response?.status === 401 || error.response?.status === 403) {
                    setUser(null);
                    localStorage.removeItem("momentx_user");
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // --- 2. Login Logic ---
    const login = async (credentials: any) => {
        try {
            setIsLoading(true);

            const response = await api.post("/users/login", credentials);
            const resData = response.data;

            // Extract User (Support multiple backend structures)
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
            // Handle case where message might be an object
            const toastMsg = typeof msg === 'object' ? "Login failed" : msg;

            toast.error(toastMsg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. Register Logic ---
    const register = async (formData: FormData) => {
        try {
            setIsLoading(true);
            const { data } = await api.post("/users/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const rawUser = data?.message?.user || data?.data?.user || data?.data;

            if (rawUser) {
                // ✅ SECURITY: Sanitize before saving
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

    // --- 4. Logout Logic ---
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};