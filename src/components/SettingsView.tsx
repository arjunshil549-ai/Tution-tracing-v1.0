import React, { useState } from 'react';
import { AppSettings, NotificationItem } from '../types';
import { isLastDayOfMonth } from '../services/geofence';
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
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
  onTriggerMonthEndNotification: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetDemoData,
  onTriggerMonthEndNotification,
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
          <p className="text-xs text-slate-400">Manage tracking, geofence tolerance, and privacy</p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Geofence & Tracking Configuration (Section 6) */}
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
            <span className="font-semibold text-slate-200">Default Radius</span>
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

        {/* GPS Tolerance (Section 17: "Geofence radius = 100m, GPS tolerance = ~30–50m") */}
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

      {/* Notification System Settings (Section 15 & 25) */}
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

      {/* Privacy Design (Section 27) */}
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
              if (confirm('Reset to realistic September 2026 demo data (18 days, Farmgate & Malibagh)?')) {
                onResetDemoData();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Demo Data (Farmgate & Malibagh - 18 Days)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
