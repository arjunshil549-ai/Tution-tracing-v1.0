import React from 'react';
import { Tuition, Attendance, AppSettings, UserProfile } from '../types';
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
  Plus,
  Trash2,
  User,
  LogIn,
  UserPlus,
  BookOpen,
} from 'lucide-react';

interface DashboardProps {
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  settings: AppSettings;
  userProfile: UserProfile | null;
  onNavigate: (tab: 'home' | 'tuitions' | 'reports' | 'settings') => void;
  onLaunchLiveAttendance: (tuition: Tuition) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenAddTuition: () => void;
  onOpenRemoveTuition: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tuitions,
  attendanceLogs,
  settings,
  userProfile,
  onNavigate,
  onLaunchLiveAttendance,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenAddTuition,
  onOpenRemoveTuition,
  onOpenAuthModal,
  onOpenProfileModal,
}) => {
  // Current month prefix for demo is 2026-09
  const monthLogs = attendanceLogs.filter(
    (l) => l.date.startsWith('2026-09') && l.status === 'completed'
  );

  const attendedDaysSet = new Set(monthLogs.map((l) => l.date));
  const attendedDays = attendedDaysSet.size;
  const totalSeconds = monthLogs.reduce((acc, l) => acc + l.duration, 0);
  const totalDurationFormatted = formatDuration(totalSeconds);

  // Tuition breakdown days
  const tuitionBreakdown = tuitions.map((t) => {
    const count = monthLogs.filter((l) => l.tuitionId === t.id).length;
    return { tuition: t, count };
  });

  // Today's Tuition
  const activeTuitions = tuitions.filter((t) => t.active);
  const todayTuition = activeTuitions[0] || tuitions[0];

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';

    if (userProfile?.name) {
      return `${timeGreeting}, ${userProfile.name.split(' ')[0]} 👋`;
    }
    return `${timeGreeting} 👋`;
  };

  // Earned income calculation
  const earnedIncome = tuitions.reduce((sum, t) => {
    const logs = monthLogs.filter((l) => l.tuitionId === t.id);
    const perClass = t.fee / (t.expectedClassesPerMonth || 10);
    return sum + Math.round(perClass * logs.length);
  }, 0);

  return (
    <div id="dashboard-screen" className="space-y-6 pb-20">
      {/* Header: Greeting & Profile / Login Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {userProfile?.institution ? `${userProfile.institution} • ` : ''}Dhaka, Bangladesh
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {userProfile ? (
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center space-x-2 p-1.5 pr-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition group"
              title="View & Edit Profile"
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                style={{ backgroundColor: userProfile.avatarColor || '#10b981' }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">
                {userProfile.name}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 flex items-center space-x-1.5 transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Profile</span>
            </button>
          )}

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
      </div>

      {/* When NO tuitions are added yet: Show inviting Add Tuition onboarding */}
      {tuitions.length === 0 ? (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              কোনো টিউশন যুক্ত করা নেই
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              No tuitions added yet. Add your first tuition to start automated geofence attendance and monthly tracking.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddTuition}
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950 transition active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Tuition (প্রথম টিউশন যোগ করুন)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-left text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-white block mb-1">1. Set Location</span>
              <p className="text-slate-400 text-[11px]">Pinpoint student house on Dhaka map & set radius (e.g. 100m).</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-white block mb-1">2. Set Schedule & Fee</span>
              <p className="text-slate-400 text-[11px]">Set teaching time, days of week, and monthly salary.</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-white block mb-1">3. Auto Geofence</span>
              <p className="text-slate-400 text-[11px]">App automatically marks attendance when you arrive & leave.</p>
            </div>
          </div>
        </div>
      ) : (
        /* When at least 1 tuition is added: Show Add or Remove Tuition action buttons & Active Dashboard */
        <>
          {/* Quick Action Bar: Add or Remove Tuition options (User Request: "প্রথম টিউশন এডড হওয়ার পর add or remove tution অপশন রাখো") */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">
              Tuition Controls:
            </span>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onOpenAddTuition}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tuition</span>
              </button>

              <button
                type="button"
                onClick={onOpenRemoveTuition}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Tuition</span>
              </button>
            </div>
          </div>

          {/* Main Feature Card: THIS MONTH Summary */}
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

            {/* Big numbers */}
            <div className="my-6 text-center space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                {attendedDays} <span className="text-emerald-400 text-2xl sm:text-3xl font-extrabold">DAYS</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-300 font-mono">
                {totalDurationFormatted}
              </div>
              <p className="text-xs text-slate-500">Total verified tuition duration</p>
            </div>

            {/* Tuition Breakdown Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
              {tuitionBreakdown.slice(0, 3).map((item) => (
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

          {/* 📍 Tracking 🟢 ACTIVE Card */}
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
                  Geofence monitor running ({tuitions.length} active tuition{tuitions.length > 1 ? 's' : ''})
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

          {/* Today's Tuition Card */}
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
                    <span>🟢 Active</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Fee: ৳{todayTuition.fee}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchLiveAttendance(todayTuition)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>Launch radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Income Widget */}
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
        </>
      )}
    </div>
  );
};
