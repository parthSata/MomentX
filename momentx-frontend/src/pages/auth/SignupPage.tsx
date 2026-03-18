import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Camera,
  Sparkles,
  UserCircle,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // UI State
  const [step, setStep] = useState<1 | 2>(1); // 1: Registration, 2: OTP Verification
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Local check before sending
      if (formData.username.includes(' ')) {
        const err = { username: "Username cannot contain spaces" };
        setErrors(err);
        return setIsLoading(false);
      }

      await api.post("/users/register-otp", {
        ...formData
      });

      toast.success("Verification Code Sent", {
        description: `Please check your inbox at ${formData.email}`,
      });
      setStep(2);
    } catch (error: any) {
      const serverError = error.response?.data?.message || "Something went wrong";
      toast.error("Registration Error", {
        description: serverError,
      });

      // Try to map server error back to fields for better UX
      if (serverError.toLowerCase().includes('username')) setErrors({ username: serverError });
      else if (serverError.toLowerCase().includes('email')) setErrors({ email: serverError });
      else if (serverError.toLowerCase().includes('password')) setErrors({ password: serverError });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Please enter a valid 6-digit OTP");

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("phone", formData.phone);
      data.append("otp", otp);

      if (avatarFile) {
        data.append("profilePic", avatarFile);
      }

      await api.post("/users/register-verify", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ FIX: Instead of calling the Login API again (which might fail or crash),
      // we just refresh the local state since the back-end already set the cookies.
      await refreshUser();

      toast.success("Account Verified!", {
        description: "Welcome to MomentX.",
      });

      navigate("/");
    } catch (error: any) {
      toast.error("Verification Failed", {
        description: error.response?.data?.message || "Invalid or expired OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-glow">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex flex-col items-center mb-6">
                  <h1 className="text-2xl font-display font-bold gradient-text">Join MomentX</h1>
                  <p className="text-muted-foreground mt-1 text-sm">Create your account</p>
                </div>

                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group">
                    <div className="w-24 h-24 rounded-full bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink p-0.5 animate-gradient">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div className="space-y-1">
                    <div className="relative group">
                      <Input placeholder="Full Name" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({}); }} className="pl-11 text-white" required />
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Input placeholder="Username" value={formData.username} onChange={(e) => { setFormData({ ...formData, username: e.target.value.toLowerCase() }); setErrors({}); }} className={`pl-11 text-white ${errors.username ? 'border-red-500' : ''}`} required />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                    </div>
                    {errors.username && <p className="text-[10px] text-red-500 ml-1">{errors.username}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Input type="email" placeholder="Email address" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({}); }} className={`pl-11 text-white ${errors.email ? 'border-red-500' : ''}`} required />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                    </div>
                    {errors.email && <p className="text-[10px] text-red-500 ml-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Input type="tel" placeholder="Phone number" value={formData.phone} onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setErrors({}); }} className="pl-11 text-white" />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({}); }} className={`pl-11 pr-11 text-white ${errors.password ? 'border-red-500' : ''}`} required />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground z-20 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-red-500 ml-1">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button onClick={() => setStep(1)} className="flex items-center text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back to details
                </button>

                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-display font-bold">Verify Email</h1>
                  <p className="text-muted-foreground mt-1 text-sm">Enter the 6-digit code sent to <br /> <span className="text-foreground font-medium">{formData.email}</span></p>
                </div>

                <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                  <div className="flex justify-center">
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify & Create Account"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Didn't receive the code? {" "}
                    <button type="button" onClick={handleRequestOTP} className="text-primary hover:underline font-medium">Resend</button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple internal Loader component for button
function Loader2({ className }: { className?: string }) {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className={className}>
      <Sparkles className="w-5 h-5" />
    </motion.div>
  );
}