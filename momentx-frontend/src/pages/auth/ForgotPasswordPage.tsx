import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "success">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("OTP sent to your email!")
    setStep("otp")
    setIsLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Password reset successful!")
    setStep("success")
    setIsLoading(false)
  }

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus()
    }
  }, [step])

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

          {step === "email" && (
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
                    inputSize="lg"
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
          )}

          {step === "otp" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-display font-bold mb-2">Enter Code</h1>
              <p className="text-muted-foreground mb-6">
                We sent a verification code to {email}
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(el: HTMLInputElement | null): void => {
                        inputRefs.current[index] = el
                      }} type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-card/50 border-2 border-border focus:border-primary focus:shadow-neon outline-none transition-all"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  disabled={isLoading || otp.some((d) => !d)}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={() => toast.info("New code sent!")}
                    className="text-primary hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink p-0.5 animate-gradient">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">Success!</h1>
              <p className="text-muted-foreground mb-6">
                Your password has been reset successfully.
              </p>
              <Link to="/login">
                <Button variant="gradient" size="xl" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
