import React, { useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onFinish }) => {
  const handleFinish = () => {
    if (onComplete) onComplete();
    if (onFinish) onFinish();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete, onFinish]);

  return (
    <div
      id="splash-screen"
      onClick={handleFinish}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center max-w-sm"
      >
        {/* Animated Pin and Geofence Waves */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20 animate-ping" />
          <div className="absolute w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 relative z-10 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <MapPin className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Tuition<span className="text-emerald-400">Track</span>
        </h1>

        {/* Tagline */}
        <p className="text-slate-400 text-sm sm:text-base font-medium mb-10 leading-relaxed">
          Track your tuition. <br />
          <span className="text-emerald-400/90 font-semibold">Automatically.</span>
        </p>

        {/* 3 Animated Dots */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-bounce" />
        </div>

        <p className="text-[11px] text-slate-500 mt-8 font-mono">
          Tap anywhere to start
        </p>
      </motion.div>
    </div>
  );
};
