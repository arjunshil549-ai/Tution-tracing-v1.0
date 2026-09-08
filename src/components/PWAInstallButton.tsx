import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'settings' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already running as an installed PWA
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>TuitionTrack is running as an Installed Native App (PWA)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericGuide(true);
    }
  };

  // Header compact button
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition transform active:scale-95 ${className}`}
          title="Install TuitionTrack App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>

        {/* Guides Modals */}
        {renderGuides()}
      </>
    );
  }

  // Settings Card / Button
  if (variant === 'settings') {
    return (
      <>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Install Progressive Web App</span>
            </div>
            <p className="text-xs text-slate-400">
              Install TuitionTrack directly on your phone or desktop home screen for instant full-screen offline access.
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition shrink-0 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Install to Device</span>
          </button>
        </div>

        {renderGuides()}
      </>
    );
  }

  // Floating Banner
  return (
    <>
      <div className={`p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Install TuitionTrack PWA</span>
            <span className="text-[11px] text-slate-400 block">Fast 1-tap launch & offline tuition radar</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center space-x-1 shadow transition shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      </div>

      {renderGuides()}
    </>
  );

  function renderGuides() {
    return (
      <>
        {/* iOS Safari Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-black text-base">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>iPhone / iPad এ ইনস্টল করুন</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-800 text-blue-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">১. শেয়ার বাটনে ট্যাপ করুন:</strong>
                    <span>Safari ব্রাউজারের নিচে থাকা Share (শেয়ার) আইকনে চাপুন।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">২. হোম স্ক্রিনে যুক্ত করুন:</strong>
                    <span>মেনু থেকে <strong>"Add to Home Screen"</strong> নির্বাচন করুন।</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
              >
                ঠিক আছে, বুঝতে পেরেছি
              </button>
            </div>
          </div>
        )}

        {/* Chrome / Desktop / Android manual guide */}
        {showGenericGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-black text-base">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span>অ্যাপ হিসেবে ইনস্টল করুন</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenericGuide(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed">
                  ব্রাউজারের অ্যাড্রেস বারে থাকা <strong>Install আইকন (⊕)</strong> অথবা ব্রাউজার মেনুর <strong>"Install TuitionTrack" / "Add to Home screen"</strong> অপশনটিতে ক্লিক করুন।
                </p>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold block">💡 সুবিধা:</span>
                  <span>ফুল স্ক্রিন মোড, কোনো অ্যাড্রেস বার ছাড়া রিয়েল মোবাইল অ্যাপের অনুভূতি এবং অফলাইন ডেটা অ্যাক্সেস।</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
};
