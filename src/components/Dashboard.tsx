import React from 'react';
import { Tuition, Attendance, AppSettings } from '../types';
import { formatDuration, formatTimeDisplay } from '../services/geofence';
import {
  MapPin,
  Clock,
  Navigation,
  Calendar,
  DollarSign,
  Radio,
  Play,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Bell,
} from 'lucide-react';

interface DashboardProps {
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  settings: AppSettings;
  onNavigate: (tab: 'home' | 'tuitions' | 'reports' | 'settings') => void;
  onLaunchLiveAttendance: (tuition: Tuition) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tuitions,
  attendanceLogs,
  settings,
  onNavigate,
  onLaunchLiveAttendance,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  // Current month prefix for demo is 2026-09
  const monthLogs = attendanceLogs.filter(
    (l) => l.date.startsWith('2026-09') && l.status === 'completed'
  );

  const attendedDaysSet = new Set(monthLogs.map((l) => l.date));
  const attendedDays = attendedDaysSet.size; // 18 Days
  const totalSeconds = monthLogs.reduce((acc, l) => acc + l.duration, 0);
  const totalDurationFormatted = formatDuration(totalSeconds); // "34h 20m"

  // Tuition breakdown days (Farmgate: 8 days, Malibagh: 10 days)
  const tuitionBreakdown = tuitions.map((t) => {
    const count = monthLogs.filter((l) => l.tuitionId === t.id).length;
    return { tuition: t, count };
  });

  // Today's Tuition (assume Farmgate for demo or next upcoming active tuition)
  const activeTuitions = tuitions.filter((t) => t.active);
  const todayTuition = activeTuitions[0] || tuitions[0];

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 🌤️';
    return 'Good evening 👋';
  };

  // Earned income (Section 30)
  const earnedIncome = tuitions.reduce((sum, t) => {
    const logs = monthLogs.filter((l) => l.tuitionId === t.id);
    const perClass = t.fee / (t.expectedClassesPerMonth || 10);
    return sum + Math.round(perClass * logs.length);
  }, 0);

  return (
    <div id="dashboard-screen" className="space-y-6 pb-20">
      {/* Header: Greeting & Month */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs text-slate-400 font-medium">September 2026 • Dhaka, Bangladesh</p>
        </div>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          title="Notification Center"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          )}
        </button>
      </div>

      {/* Main Feature Card: THIS MONTH Summary (Section 8) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>THIS MONTH</span>
          </span>
          <span className="text-emerald-400/90 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Sep 2026
          </span>
        </div>

        {/* Big numbers: 18 DAYS, 34h 20m */}
        <div className="my-6 text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
            {attendedDays} <span className="text-emerald-400 text-2xl sm:text-3xl font-extrabold">DAYS</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-300 font-mono">
            {totalDurationFormatted}
          </div>
          <p className="text-xs text-slate-500">Total verified tuition duration</p>
        </div>

        {/* Tuition Breakdown Row: Farmgate 8 days | Malibagh 10 days */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800/80">
          {tuitionBreakdown.slice(0, 2).map((item) => (
            <div
              key={item.tuition.id}
              onClick={() => onNavigate('reports')}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/60 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-xs font-bold text-slate-200 truncate block">
                {item.tuition.name.replace(' Tuition', '')}
              </span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono block mt-0.5">
                {item.count} days
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 📍 Tracking 🟢 ACTIVE Card (Section 8) */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">📍 Tracking</span>
              <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                🟢 ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Geofence monitor running (radius: {settings.defaultRadius}m, ~{settings.gpsTolerance}m tolerance)
            </p>
          </div>
        </div>

        {todayTuition && (
          <button
            type="button"
            onClick={() => onLaunchLiveAttendance(todayTuition)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 flex items-center space-x-1.5 transition shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Radar</span>
          </button>
        )}
      </div>

      {/* Today's Tuition Card (Section 8) */}
      {todayTuition && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Today's Tuition</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{todayTuition.name}</h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayTuition.address}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-200">
                {formatTimeDisplay(todayTuition.expectedStart)}
              </span>
              <span className="text-[11px] text-slate-500 block">Expected time</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                <span>🟢 Attended</span>
              </span>
              <span className="text-slate-400 text-[11px]">1h 57m logged</span>
            </div>

            <button
              type="button"
              onClick={() => onLaunchLiveAttendance(todayTuition)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View geofence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Income Widget (Section 30) */}
      <div
        onClick={() => onNavigate('reports')}
        className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">September Earned</span>
            <h4 className="text-base font-bold text-white">৳{earnedIncome.toLocaleString()}</h4>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
          <span>Full Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
