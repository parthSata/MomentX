import { useEffect } from "react";
// Fix (IDE Error 6133): Remove unused AnimatePresence
// Fix (IDE Error 2322): Import Variants to properly type variants object
import { motion, type Variants } from "framer-motion";

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    useEffect(() => {
        // The splash screen will automatically dismiss after 5 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    // ✅ Helper function for Parth Sata staggered text (previously undefined)
    const staggeredText = (text: string) => {
        const letters = Array.from(text);

        const containerVariants: Variants = {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 1.8 } // Appears after main content
            }
        };

        const childVariants: Variants = {
            hidden: { opacity: 0, y: 15 },
            visible: {
                opacity: 1,
                y: 0,
                transition: {
                    ease: "backOut" as const, // ✅ Fix (IDE Error 2322): Cast literal for strict TS definition
                    duration: 0.6
                }
            }
        };

        return (
            <motion.span
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="inline-block"
            >
                {letters.map((letter, index) => (
                    <motion.span key={index} variants={childVariants} className="inline-block">
                        {letter === " " ? "\u00A0" : letter} {/* handle spaces correctly */}
                    </motion.span>
                ))}
            </motion.span>
        );
    };

    return (
        <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{
                opacity: 0,
                scale: 1.1,
                filter: "blur(10px)",
                transition: { duration: 0.6, ease: "easeInOut" }
            }}
            // Fix (JIT utility warning): Updated z-index class from z-[100] to z-100
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black overflow-hidden"
        >
            {/* Background Glowing Orbs */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
            />
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-700 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
            />

            {/* Main Content Wrapper (Centered vertically) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {/* Main Logo Text */}
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                        duration: 1,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-center text-6xl md:text-8xl font-black tracking-tight font-display mb-4"
                >
                    <span className="text-white drop-shadow-2xl">Moment</span>
                    <motion.span
                        initial={{ rotate: -90, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 10 }}
                        // Theme: amber-gold to emerald accent on the X letter
                        className="text-transparent bg-clip-text bg-linear-to-br from-amber-400 via-amber-300 to-emerald-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    >
                        X
                    </motion.span>
                </motion.div>

                {/* Slogan */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="overflow-hidden"
                >
                    <motion.p
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
                        className="text-gray-400 text-lg md:text-xl font-medium tracking-wide flex items-center gap-2"
                    >
                        Capture the Moment. <span className="text-white">Live the X.</span>
                    </motion.p>
                </motion.div>
            </div>

            {/* =========================================
                Developed By Parth Sata (Bottom Credit)
                ========================================= */}
            {/* Fix (cssConflict): Removed 'relative' from the list as it conflicted with 'absolute' */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center z-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    // Theme: amber accent divider line
                    className="h-px w-20 bg-linear-to-r from-amber-500/0 via-amber-400/40 to-amber-500/0 mb-3"
                />
                <div className="text-gray-500 text-xs font-mono flex items-center gap-1.5">
                    <span>Developed By</span>
                    <motion.span
                        // Theme: amber-gold credit text
                        className="font-bold relative text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-white to-emerald-400"
                        style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))" }}
                    >
                        {staggeredText("Parth Sata")}
                    </motion.span>
                </div>
            </div>

        </motion.div>
    );
}