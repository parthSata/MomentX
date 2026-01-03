import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Mail, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/axios"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // API Call
      await api.post("/users/forgot-password", { email })

      // ✅ SUCCESS CASE
      toast.success("OTP Sent!", {
        description: `Verification code sent to ${email}`,
      })

      navigate("/reset-password", { state: { email } })

    } catch (error: any) {
      console.error("Forgot Password Error:", error)

      // 🚨 ERROR HANDLING
      // The backend sends specific messages:
      // 404: "Account does not exist. Please Sign up."
      // 400: "Failed to send email..."

      const errorMessage = error.response?.data?.message || "Something went wrong";

      toast.error("Request Failed", {
        description: errorMessage, // This will show the exact message from Backend
        duration: 4000, // Show for 4 seconds
      })

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-neon-indigo/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-glow">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-display font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground mb-6">
              Enter your email and we'll send you a verification code.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
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

              <Button
                type="submit"
                variant="gradient"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  "Send Code"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}