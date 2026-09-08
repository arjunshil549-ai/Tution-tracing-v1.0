import React from 'react';
import { Home, BookOpen, BarChart3, Settings, Radio } from 'lucide-react';

export type NavTab = 'home' | 'tuitions' | 'reports' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isTrackingActive: boolean;
  activeSessionTuitionName?: string;
  onOpenLiveSession?: () => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isTrackingActive,
  activeSessionTuitionName,
  onOpenLiveSession,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home, emoji: '🏠' },
    { id: 'tuitions' as NavTab, label: 'Tuitions', icon: BookOpen, emoji: '📚' },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3, emoji: '📊' },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, emoji: '⚙️' },
  ];

  return (
    <>
      {/* Floating Active Radar Pill if a session is currently in progress */}
      {activeSessionTuitionName && onOpenLiveSession && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] animate-in slide-in-from-bottom-3">
          <div
            onClick={onOpenLiveSession}
            className="p-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400/40 text-white shadow-xl shadow-emerald-950/60 flex items-center justify-between cursor-pointer transition active:scale-98"
          >
            <div className="flex items-center space-x-2.5">
              <Radio className="w-4 h-4 animate-pulse text-white" />
              <div className="text-xs">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-100 block">
                  🟢 Live Attendance Active
                </span>
                <span className="font-bold text-white truncate max-w-[200px] block">
                  {activeSessionTuitionName}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-700/80 text-[11px] font-bold">
              Tap to View
            </span>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        id="bottom-navigation-bar"
        className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative mb-0.5">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
