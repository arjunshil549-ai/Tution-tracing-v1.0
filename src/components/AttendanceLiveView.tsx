import React, { useState, useEffect } from 'react';
import { Tuition, Attendance, AppSettings } from '../types';
import { formatDurationHMS, formatTimeDisplay } from '../services/geofence';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  StopCircle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttendanceLiveViewProps {
  tuition: Tuition;
  settings: AppSettings;
  activeSession: {
    tuitionId: number;
    startTime: Date;
    simulatedDistance: number; // in meters
    isInside: boolean;
  } | null;
  onStartSession: (tuitionId: number, initialDistance?: number) => void;
  onEndSession: (tuitionId: number, durationSeconds: number, status: 'completed' | 'ignored') => void;
  onUpdateDistance: (newDistance: number) => void;
  onClose?: () => void;
}

export const AttendanceLiveView: React.FC<AttendanceLiveViewProps> = ({
  tuition,
  settings,
  activeSession,
  onStartSession,
  onEndSession,
  onUpdateDistance,
  onClose,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(4355); // Default ~01:12:35 for realistic demo or active session
  const [distance, setDistance] = useState(activeSession ? activeSession.simulatedDistance : 42);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const isInside = distance <= tuition.radius + settings.gpsTolerance;
  const minimumStaySeconds = (tuition.minimumStayMinutes || settings.minimumStay || 30) * 60;
  const hasMetMinimumStay = elapsedSeconds >= minimumStaySeconds;
  const minStayProgress = Math.min(100, Math.round((elapsedSeconds / minimumStaySeconds) * 100));

  // Live stopwatch when active
  useEffect(() => {
    let interval: any = null;
    if (activeSession && activeSession.isInside) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleDistanceChange = (newDist: number) => {
    setDistance(newDist);
    onUpdateDistance(newDist);

    // If outside while active, notify
    if (newDist > tuition.radius + settings.gpsTolerance && activeSession?.isInside) {
      setShowExitDialog(true);
    }
  };

  const handleConfirmExit = (saveRecord: boolean) => {
    setShowExitDialog(false);
    if (saveRecord) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onEndSession(tuition.id, elapsedSeconds, hasMetMinimumStay ? 'completed' : 'ignored');
    } else {
      onEndSession(tuition.id, elapsedSeconds, 'ignored');
    }
  };

  return (
    <div id="attendance-live-screen" className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Geofence Radar</span>
            <h2 className="text-base font-bold text-slate-100">{tuition.name}</h2>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close View
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Radar & Status Badge */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
          {/* Animated concentric radar rings */}
          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <div className={`absolute inset-0 rounded-full border border-emerald-500/20 ${isInside ? 'animate-ping duration-1000' : ''}`} />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/30" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/5 border border-emerald-500/40" />

            {/* Central icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isInside
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              <MapPin className="w-8 h-8" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${isInside ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isInside ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
                {isInside ? 'YOU ARE HERE' : 'OUTSIDE GEOFENCE'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isInside ? '🟢 ATTENDANCE ACTIVE' : '🟡 TRACKING STANDBY'}
            </h3>
            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              <span>{tuition.address}</span>
            </p>
          </div>

          {/* Quick Metrics (Arrived, Expected End, Distance) */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-4 border-t border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Arrived</span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                {formatTimeDisplay(tuition.expectedStart || '16:00')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Expected End</span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                {formatTimeDisplay(tuition.expectedEnd || '18:00')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Distance</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                {distance} meters
              </span>
            </div>
          </div>
        </div>

        {/* Live Stopwatch Timer */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl text-center space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Current Duration</span>
            </span>
            <span className="font-mono text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {isInside ? 'Auto Running' : 'Paused'}
            </span>
          </div>

          {/* Huge Timer */}
          <div className="py-2">
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white drop-shadow-sm">
              {formatDurationHMS(elapsedSeconds)}
            </div>
          </div>

          {/* Minimum stay progress bar */}
          <div className="space-y-1.5 text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                {hasMetMinimumStay ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  Minimum Stay: <strong className="text-slate-200">{tuition.minimumStayMinutes || 30} min</strong>
                </span>
              </span>
              <span className={`font-mono font-bold text-xs ${hasMetMinimumStay ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasMetMinimumStay ? 'Met ✅ (Counted)' : `${minStayProgress}% (${Math.floor(elapsedSeconds / 60)}m)`}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${hasMetMinimumStay ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${minStayProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* GPS Geofence Simulator (For testing exact arrival / departure algorithm) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Geofence Simulator</h4>
            </div>
            <span className="text-[11px] text-slate-400">Radius: {tuition.radius}m (+{settings.gpsTolerance}m tol)</span>
          </div>

          <p className="text-xs text-slate-400">
            Simulate moving your device closer or further from this tuition to test the auto-attendance engine:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDistanceChange(35)}
              className={`p-2 rounded-xl text-xs font-medium border transition text-center ${
                distance <= 50
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Inside (35m)
              <span className="block text-[10px] text-slate-400">Center zone</span>
            </button>
            <button
              type="button"
              onClick={() => handleDistanceChange(90)}
              className={`p-2 rounded-xl text-xs font-medium border transition text-center ${
                distance > 50 && distance <= tuition.radius
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Near Edge (90m)
              <span className="block text-[10px] text-slate-400">Within radius</span>
            </button>
            <button
              type="button"
              onClick={() => handleDistanceChange(160)}
              className={`p-2 rounded-xl text-xs font-medium border transition text-center ${
                distance > tuition.radius
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Outside (160m)
              <span className="block text-[10px] text-slate-400">Trigger exit</span>
            </button>
          </div>
        </div>

        {/* Action Button: Stop tracking / Manual completion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowExitDialog(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-950 transition"
          >
            <StopCircle className="w-5 h-5" />
            <span>STOP TRACKING & SAVE RECORD</span>
          </button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Complete Attendance?</h3>
                <p className="text-xs text-slate-400">Exit geofence detected</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tuition:</span>
                <span className="font-medium text-slate-200">{tuition.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recorded Duration:</span>
                <span className="font-mono font-bold text-emerald-400">{formatDurationHMS(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Minimum Stay (30m):</span>
                <span className={hasMetMinimumStay ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {hasMetMinimumStay ? '✅ Qualified' : '❌ < 30 min (Ignored)'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmExit(true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
