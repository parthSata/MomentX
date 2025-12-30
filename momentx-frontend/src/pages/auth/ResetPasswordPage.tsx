import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Lock, Sparkles, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/axios"

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const location = useLocation()
    // Retrieve email passed from the previous page
    const email = location.state?.email || ""

    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [newPassword, setNewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Redirect if no email found (user tried to access page directly)
    useEffect(() => {
        if (!email) {
            navigate("/forgot-password")
        }
        // Auto-focus first OTP input
        inputRefs.current[0]?.focus()
    }, [email, navigate])

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

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const otpCode = otp.join("")

        try {
            await api.post("/reset-password", {
                email,
                otp: otpCode,
                newPassword
            })

            toast.success("Password Reset Successful!", {
                description: "You can now login with your new password.",
            })

            navigate("/login")

        } catch (error: any) {
            console.error("Reset Error:", error)
            toast.error("Reset Failed", {
                description: error.response?.data?.message || "Invalid OTP or details",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-background">
                <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-strong rounded-3xl p-8 shadow-glow">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-2xl font-display font-bold mb-2">Reset Password</h1>
                        <p className="text-muted-foreground mb-6">
                            Enter the code sent to <span className="text-primary">{email}</span> and your new password.
                        </p>

                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            {/* OTP Inputs */}
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <motion.input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-card/50 border-2 border-border focus:border-primary focus:shadow-neon outline-none transition-all"
                                    />
                                ))}
                            </div>

                            {/* New Password Input */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                variant="gradient"
                                size="xl"
                                className="w-full"
                                disabled={isLoading || otp.some((d) => !d) || !newPassword}
                            >
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                Change Email?
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}