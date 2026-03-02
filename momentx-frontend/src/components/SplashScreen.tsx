import { useEffect } from "react";
import { motion } from "framer-motion";

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    useEffect(() => {
        // The splash screen will automatically dismiss after 3.5 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onComplete]);

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
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black overflow-hidden"
        >
            {/* Background Glowing Orbs */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
            />
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
            />

            {/* Main Logo Text */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                        duration: 1,
                        ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
                    }}
                    className="flex items-center text-6xl md:text-8xl font-black tracking-tight font-display mb-4"
                >
                    <span className="text-white drop-shadow-2xl">Moment</span>
                    <motion.span
                        initial={{ rotate: -90, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 10 }}
                        className="text-transparent bg-clip-text bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
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

            {/* Loading Bar at the bottom */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
            >
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 1.5 }}
                    className="w-full h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full"
                />
            </motion.div>
        </motion.div>
    );
}