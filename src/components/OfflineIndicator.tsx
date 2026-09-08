import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between sm:justify-start gap-2.5 rounded-2xl bg-amber-500/95 backdrop-blur text-slate-950 px-4 py-2.5 text-xs font-bold shadow-2xl border border-amber-400 animate-in slide-in-from-bottom-4">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
        <span>অফলাইন মোড — ক্যাশ করা ডেটা ও লোকাল ট্র্যাকিং সচল আছে।</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
    </div>
  );
};
