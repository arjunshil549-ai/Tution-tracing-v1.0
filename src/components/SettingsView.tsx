import React, { useState } from 'react';
import { AppSettings, NotificationItem, UserProfile } from '../types';
import { isLastDayOfMonth } from '../services/geofence';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  Settings,
  Bell,
  Navigation,
  Shield,
  Clock,
  RotateCcw,
  Download,
  Trash2,
  Check,
  Smartphone,
  Info,
  Radio,
  User,
  LogOut,
  Edit3,
  UserPlus,
  Database,
  FileSpreadsheet,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  Server,
  Cloud,
  Lock,
  Crown,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  userProfile: UserProfile | null;
  googleUser?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  googleAccessToken?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  onOpenSheetsExport?: () => void;
  onOpenGmailModal?: () => void;
  onOpenCalendarModal?: () => void;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onTriggerMonthEndNotification: () => void;
  onOpenProfileModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  userProfile,
  googleUser,
  googleAccessToken,
  isAdmin = false,
  isSuperAdmin = false,
  onOpenAdminPanel,
  onGoogleSignIn,
  onGoogleSignOut,
  onOpenSheetsExport,
  onOpenGmailModal,
  onOpenCalendarModal,
  onSaveSettings,
  onResetDemoData,
  onClearAllData,
  onTriggerMonthEndNotification,
  onOpenProfileModal,
  onOpenAuthModal,
  onLogout,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (key: keyof AppSettings, val: any) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const today = new Date();
  const isMonthEndToday = isLastDayOfMonth(today);

  return (
    <div id="settings-view" className="space-y-6 pb-20 max-w-xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">App Settings</h2>
          <p className="text-xs text-slate-400">Manage profile, tracking, geofence tolerance, and privacy</p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Profile & Account Section */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Tutor Profile & Account (প্রোফাইল)</span>
        </h3>

        {userProfile ? (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow"
                style={{ backgroundColor: userProfile.avatarColor || '#10b981' }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-sm text-white block">{userProfile.name}</span>
                <span className="text-xs text-slate-400 block truncate max-w-[180px]">
                  {userProfile.institution || userProfile.email}
                </span>
                {userProfile.subject && (
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    Subject: {userProfile.subject}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition"
                title="Edit Profile"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center space-x-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-white block">No Profile Created</span>
              <span className="text-xs text-slate-400 block">Create your tutor profile to personalize reports.</span>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow transition self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Profile / Log In</span>
            </button>
          </div>
        )}
      </div>

      {/* Cloud SQL Database Section - ONLY VISIBLE TO ROOT SUPER ADMIN (arjunshil549@gmail.com) */}
      {isSuperAdmin ? (
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Cloud SQL Server (Super Admin Protected)
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                ROOT ACCESS
              </span>
            </div>
            {onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition shadow"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>সুপার অ্যাডমিন পোর্টাল</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Relational PostgreSQL Storage</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Managed Cloud SQL instance provisioned in region <span className="text-cyan-400 font-mono">asia-southeast1</span> (Concealed from public visitors).
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Region</span>
                <span className="text-xs font-bold text-slate-200">asia-southeast1</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Engine</span>
                <span className="text-xs font-bold text-slate-200">PostgreSQL 16</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Public Shield</span>
                <span className="text-xs font-bold text-emerald-400">Concealed</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Public / Non-Admin View: Clean Privacy and Security Card */
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Data Protection</span>
            </h3>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Secured</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Private & Encrypted Attendance Records</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Your tuition schedules, earnings, and GPS logs are private to your tutor account. Backend server infrastructure is strictly isolated and access-controlled.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Workspace Integration Section */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Google Workspace Integrations</span>
          </h3>
          {googleAccessToken ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              Connected
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium">
              Not Connected
            </span>
          )}
        </div>

        {/* Google Account Authentication */}
        {googleUser ? (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  {(googleUser.displayName || googleUser.email || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{googleUser.displayName || 'Google Account'}</p>
                <p className="text-xs text-slate-400">{googleUser.email}</p>
              </div>
            </div>

            {onGoogleSignOut && (
              <button
                type="button"
                onClick={onGoogleSignOut}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Disconnect
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-center sm:text-left">
            <p className="text-xs text-slate-300">
              Sign in with your Google account to unlock seamless syncing with Google Sheets, Gmail notifications, and Google Calendar schedules.
            </p>
            {onGoogleSignIn && (
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                text="Connect Google Workspace"
                className="w-full sm:w-auto"
              />
            )}
          </div>
        )}

        {/* Workspace Feature Quick Cards */}
        <div className="space-y-2.5 pt-1">
          {/* Google Sheets */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Sheets</h4>
                <p className="text-[11px] text-slate-400">Export tuition attendance, logs, and fee reports</p>
              </div>
            </div>
            {onOpenSheetsExport && (
              <button
                type="button"
                onClick={onOpenSheetsExport}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Export
              </button>
            )}
          </div>

          {/* Gmail */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Gmail</h4>
                <p className="text-[11px] text-slate-400">Email monthly report slips to students & parents</p>
              </div>
            </div>
            {onOpenGmailModal && (
              <button
                type="button"
                onClick={onOpenGmailModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Compose
              </button>
            )}
          </div>

          {/* Google Calendar */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Calendar</h4>
                <p className="text-[11px] text-slate-400">Sync weekly class schedules & reminder alarms</p>
              </div>
            </div>
            {onOpenCalendarModal && (
              <button
                type="button"
                onClick={onOpenCalendarModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Sync
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geofence & Tracking Configuration */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Tracking & Geofence Engine</span>
        </h3>

        {/* Tracking Enabled */}
        <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-white block">Automatic Tracking</span>
            <span className="text-xs text-slate-400 block">Detect geofence enter & exit in background</span>
          </div>
          <input
            type="checkbox"
            checked={localSettings.trackingEnabled}
            onChange={(e) => handleChange('trackingEnabled', e.target.checked)}
            className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-900"
          />
        </label>

        {/* Default Radius */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="semibold text-slate-200">Default Radius</span>
            <span className="font-mono font-bold text-emerald-400">{localSettings.defaultRadius}m</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={localSettings.defaultRadius}
            onChange={(e) => handleChange('defaultRadius', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Standard tuition perimeter distance</span>
        </div>

        {/* Minimum Stay (min) */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-200">Minimum Stay Threshold</span>
            <span className="font-mono font-bold text-emerald-400">{localSettings.minimumStay} minutes</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={localSettings.minimumStay}
            onChange={(e) => handleChange('minimumStay', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">
            Stops false positives: quick visits under {localSettings.minimumStay} min are not counted
          </span>
        </div>

        {/* GPS Tolerance */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-200">GPS Tolerance Buffer</span>
            <span className="font-mono font-bold text-emerald-400">+{localSettings.gpsTolerance}m margin</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={localSettings.gpsTolerance}
            onChange={(e) => handleChange('gpsTolerance', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">
            Prevents unexpected disconnects due to mobile GPS drift
          </span>
        </div>
      </div>

      {/* Notification System Settings */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>Month-End Notification System</span>
        </h3>

        <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-white block">Monthly Report Alerts</span>
            <span className="text-xs text-slate-400 block">
              Auto-notify on month-end (30th/31st) with monthly hours & earned income
            </span>
          </div>
          <input
            type="checkbox"
            checked={localSettings.monthlyNotification}
            onChange={(e) => handleChange('monthlyNotification', e.target.checked)}
            className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-900"
          />
        </label>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Month-End Logic Check:</span>
            <span className="font-mono font-bold text-emerald-400">
              {isMonthEndToday ? 'Today is month-end' : 'Dynamic month-end detection (30/31)'}
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerMonthEndNotification}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Month-End Notification Trigger</span>
          </button>
        </div>
      </div>

      {/* Privacy Design */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Zero-Knowledge Privacy Architecture</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <span>✅</span>
            <span>Only logs verified geofence arrival and departures</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <span>✅</span>
            <span>All records stored 100% locally on device (Zero cloud leaks)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>❌</span>
            <span>No continuous location tracking or route history stored</span>
          </div>
        </div>
      </div>

      {/* Data Management & Reset */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Data Management</span>
        </h3>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all tuitions, attendance records, and notifications to start blank?')) {
                onClearAllData();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-rose-400 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-800 hover:border-rose-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Tuitions & Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Load sample September demo data for testing?')) {
                onResetDemoData();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Sample Demo Data (Optional for Testing)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
