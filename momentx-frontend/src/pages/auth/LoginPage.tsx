import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/axios"

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.post("/login", { email, password })

      // Store user info (not token) in localStorage if needed
      localStorage.setItem("momentx_user", JSON.stringify(response.data.data.user))

      toast.success("Welcome back!", {
        description: "Login successful.",
      })

      navigate("/")

    } catch (error: any) {
      console.error("Login Error:", error)
      toast.error("Login Failed", {
        description: error.response?.data?.message || "Invalid credentials",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-glow">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative w-20 h-20 mb-4">
              {/* FIX: Removed 'animate-glow' to prevent conflict with 'animate-gradient' */}
              <div className="absolute inset-0 bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink rounded-2xl animate-gradient" />
              <div className="absolute inset-1 bg-background rounded-xl flex items-center justify-center">
                <span className="text-3xl font-bold gradient-text">M</span>
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">MomentX</h1>
            <p className="text-muted-foreground mt-2">Capture the Moment. Live the X.</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3 pt-2">
              <Button type="submit" variant="default" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  "Login"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}