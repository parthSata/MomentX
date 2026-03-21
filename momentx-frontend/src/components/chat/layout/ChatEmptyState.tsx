import { motion } from "framer-motion";
import { Lock, Sparkles, Orbit, Globe, Zap, Cpu } from "lucide-react";

export default function ChatEmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-[#f0f2f5] dark:bg-[#0b141a] text-center border-l border-white/5 overflow-hidden">
      
      {/* Animated Background Energy - The "Crazy" Part */}
      <div className="absolute inset-0 z-0">
         <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 180, 270, 360],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] opacity-10 pointer-events-none"
            style={{ 
              background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
              filter: "blur(80px)" 
            }}
         />
         <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 270, 180, 90, 0],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[20%] w-[140%] h-[140%] opacity-10 pointer-events-none"
            style={{ 
              background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              filter: "blur(80px)" 
            }}
         />
      </div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-500 rounded-full blur-[1px]"
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.5, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut"
          }}
          style={{
            left: `${10 + i * 15}%`,
            top: `${80 - i * 5}%`
          }}
        />
      ))}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center max-w-lg z-10 px-6"
      >
         {/* Interactive Center Hub */}
         <div className="relative w-72 h-72 mb-10 group">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors"
            />
            <motion.div 
               animate={{ rotate: -360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-4 rounded-full border border-blue-500/10 group-hover:border-blue-500/30 transition-colors"
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
               <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative p-10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-50" />
                  <Sparkles className="w-20 h-20 text-emerald-500 relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               </motion.div>
            </div>

            {/* Orbiting Icons */}
            <motion.div 
               animate={{ rotate: [0, 360] }}
               transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0"
            >
               <Cpu className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-blue-400 opacity-40 blur-[1px]" />
            </motion.div>
            <motion.div 
               animate={{ rotate: [360, 0] }}
               transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0"
            >
               <Globe className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 text-emerald-400 opacity-40 blur-[1px]" />
            </motion.div>
         </div>

         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
         >
            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-emerald-400 via-teal-400 to-blue-500 tracking-tighter mb-6">
              MOMENTX CHAT
            </h1>
            
            <div className="space-y-4 max-w-[320px] mx-auto">
               <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors cursor-default">
                  <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                  <p className="text-xs text-muted-foreground text-left leading-tight">
                     Message your friends in real-time with zero lag.
                  </p>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors cursor-default">
                  <Orbit className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-muted-foreground text-left leading-tight">
                     Your conversations are private and secure.
                  </p>
               </div>
            </div>

            <motion.button 
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="mt-10 px-10 py-4 bg-emerald-500 text-[#0b141a] font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/50 transition-all uppercase tracking-widest text-sm flex items-center gap-2 group mx-auto"
            >
               Start Chat
               <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </motion.button>
         </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex flex-col items-center gap-4 text-muted-foreground/60 z-10 transition-opacity hover:opacity-100">
         <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-medium">
            <Lock className="w-3 h-3" />
            Securely Connected
         </div>
         <div className="h-px w-20 bg-linear-to-r from-transparent via-emerald-500/20 to-transparent" />
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
