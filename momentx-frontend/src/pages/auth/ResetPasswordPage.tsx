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
    const email = location.state?.email || ""

    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [newPassword, setNewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (!email) {
            navigate("/forgot-password")
        }
        inputRefs.current[0]?.focus()
    }, [email, navigate])

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value[value.length - 1] // Take only the last entered character
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
            await api.post("/users/reset-password", { // Ensure endpoint matches backend
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
                <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-strong rounded-3xl p-8 shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-2xl font-bold mb-2 text-white">Reset Password</h1>
                        <p className="text-zinc-400 mb-6">
                            Enter the code sent to <span className="text-primary font-medium">{email}</span> and your new password.
                        </p>

                        <form onSubmit={handleResetSubmit} className="space-y-6">
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
                                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-zinc-800/50 border-2 border-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-white"
                                    />
                                ))}
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-linear-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl"
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
                            <Link to="/forgot-password" className="text-sm text-zinc-400 hover:text-white transition-colors">
                                Change Email?
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}