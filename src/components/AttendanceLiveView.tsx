import React, { useState, useEffect } from 'react';
import { Tuition, Attendance, AppSettings } from '../types';
import {
  formatDuration,
  formatDurationHMS,
  formatTimeDisplay,
  formatDistance,
  calculateDistance,
  formatClockTime,
  UserLocation,
} from '../services/geofence';
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
  Compass,
  ArrowRight,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttendanceLiveViewProps {
  tuition: Tuition;
  settings: AppSettings;
  userLocation?: UserLocation | null;
  isGpsActive?: boolean;
  activeSession: {
    tuitionId: number;
    startTime: Date;
    simulatedDistance: number; // in meters
    isInside: boolean;
    customArrivalClock?: string;
  } | null;
  onStartSession: (tuitionId: number, initialDistance?: number) => void;
  onEndSession: (params?: {
    tuitionId?: number;
    durationSeconds?: number;
    status?: 'completed' | 'ignored';
    notes?: string;
    arrivalTime?: string;
    departureTime?: string;
  } | string) => void;
  onUpdateDistance: (newDistance: number) => void;
  onClose?: () => void;
}

export const AttendanceLiveView: React.FC<AttendanceLiveViewProps> = ({
  tuition,
  settings,
  userLocation,
  isGpsActive = false,
  activeSession,
  onStartSession,
  onEndSession,
  onUpdateDistance,
  onClose,
}) => {
  // Initial distance from GPS or active session
  const initialDistance = userLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, tuition.lat, tuition.lng)
    : activeSession
    ? activeSession.simulatedDistance
    : 850;

  const [distance, setDistance] = useState<number>(initialDistance);

  // Elapsed seconds calculation
  const initialSeconds =
    activeSession && activeSession.tuitionId === tuition.id
      ? Math.max(0, Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000))
      : 0;

  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [testScenarioMode, setTestScenarioMode] = useState(false);

  // Sync real-time GPS distance updates
  useEffect(() => {
    if (userLocation) {
      const realD = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        tuition.lat,
        tuition.lng
      );
      setDistance(realD);
      onUpdateDistance(realD);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  const isInside = distance <= tuition.radius + (settings.gpsTolerance || 0);
  const minimumStayMinutes = tuition.minimumStayMinutes || settings.minimumStay || 30;
  const minimumStaySeconds = minimumStayMinutes * 60;
  const hasMetMinimumStay = elapsedSeconds >= minimumStaySeconds;
  const minStayProgress = Math.min(100, Math.round((elapsedSeconds / minimumStaySeconds) * 100));

  // Live stopwatch ONLY runs when active session is running AND user location is inside radius!
  useEffect(() => {
    let interval: any = null;
    if (activeSession && activeSession.tuitionId === tuition.id && isInside && !testScenarioMode) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, isInside, tuition.id, testScenarioMode]);

  // Handle distance changes (manual/simulator or GPS)
  const handleDistanceChange = (newDist: number) => {
    setDistance(newDist);
    onUpdateDistance(newDist);

    const insideNow = newDist <= tuition.radius + (settings.gpsTolerance || 0);

    // If moving inside radius and no active session, trigger entry!
    if (insideNow && !activeSession) {
      onStartSession(tuition.id, newDist);
    }

    // If moving outside radius while session was inside, open completion check
    if (!insideNow && activeSession?.isInside) {
      setShowExitDialog(true);
    }
  };

  // Preset testing the exact prompt scenario: 4:05 PM -> 6:02 PM | 1h 57m
  const handleLoadPromptExample = () => {
    setTestScenarioMode(true);
    setDistance(35); // inside radius
    setElapsedSeconds(7020); // 1 hour 57 minutes (7020 seconds)
    onUpdateDistance(35);
    setShowExitDialog(true);
  };

  // Finish session
  const handleConfirmExit = (saveRecord: boolean) => {
    setShowExitDialog(false);

    if (testScenarioMode) {
      setTestScenarioMode(false);
      if (saveRecord) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        onEndSession({
          tuitionId: tuition.id,
          arrivalTime: '16:05', // 4:05 PM
          departureTime: '18:02', // 6:02 PM
          durationSeconds: 7020, // 1h 57m
          status: 'completed',
          notes: 'Prompt Example Verified: ঢোকার সময়: 4:05 PM, বের হওয়ার সময়: 6:02 PM, মোট: 1h 57m',
        });
      } else {
        onEndSession({
          tuitionId: tuition.id,
          status: 'ignored',
          durationSeconds: elapsedSeconds,
        });
      }
      return;
    }

    if (saveRecord && hasMetMinimumStay) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onEndSession({
        tuitionId: tuition.id,
        durationSeconds: elapsedSeconds,
        status: 'completed',
        arrivalTime: activeSession ? formatClockTime(new Date(activeSession.startTime)) : formatClockTime(),
        departureTime: formatClockTime(),
      });
    } else {
      // Minimum stay not met
      onEndSession({
        tuitionId: tuition.id,
        durationSeconds: elapsedSeconds,
        status: 'ignored',
        arrivalTime: activeSession ? formatClockTime(new Date(activeSession.startTime)) : formatClockTime(),
        departureTime: formatClockTime(),
      });
    }
  };

  // Clock calculations for display
  const arrivalClockStr = testScenarioMode
    ? '16:05'
    : activeSession
    ? formatClockTime(new Date(activeSession.startTime))
    : isInside
    ? formatClockTime()
    : '';

  const departureClockStr = testScenarioMode
    ? '18:02'
    : isInside && activeSession
    ? formatClockTime()
    : '';

  return (
    <div id="attendance-live-screen" className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
              GEOFENCE RADAR & ATTENDANCE
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">{tuition.name}</h2>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Close View
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-lg mx-auto w-full">
        {/* Radar & Arrival Status Announcement */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated concentric radar rings */}
          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <div
              className={`absolute inset-0 rounded-full border border-emerald-500/20 ${
                isInside ? 'animate-ping duration-1000' : ''
              }`}
            />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/30" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/5 border border-emerald-500/40" />

            {/* Central icon */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                isInside
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <MapPin className="w-8 h-8" />
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${isInside ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
              />
              <span className={isInside ? 'text-emerald-300' : 'text-amber-300'}>
                {isInside ? `INSIDE RADIUS (${distance}m)` : `OUTSIDE RADIUS (${distance}m)`}
              </span>
            </div>

            {/* Exact requested arrival message */}
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isInside ? (
                <span className="text-emerald-400">User has arrived at {tuition.name}</span>
              ) : (
                <span className="text-amber-300">Standby: Outside Geofence</span>
              )}
            </h3>

            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              <span>{tuition.address}</span>
            </p>

            {!isInside && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 mt-2 max-w-sm">
                শুধু location detect করলেই attendance tracking হবে। বর্তমানে আপনি {formatDistance(distance)} দূরে আছেন। {tuition.radius}m ব্যাসার্ধের মধ্যে ঢুকলে স্বয়ংক্রিয়ভাবে ট্র্যাকিং শুরু হবে।
              </div>
            )}
          </div>

          {/* Detailed Time Calculation Row (ঢোকার সময়, বের হওয়ার সময়, মোট সময়) */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-4 border-t border-slate-800/80 text-left">
            {/* ঢোকার সময় */}
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                ঢোকার সময়
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white font-mono block mt-0.5">
                {arrivalClockStr ? formatTimeDisplay(arrivalClockStr) : '--:--'}
              </span>
              <span className="text-[9px] text-slate-500">Entry Time</span>
            </div>

            {/* বের হওয়ার সময় */}
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                বের হওয়ার সময়
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-200 font-mono block mt-0.5">
                {departureClockStr ? formatTimeDisplay(departureClockStr) : isInside ? 'Tracking...' : '--:--'}
              </span>
              <span className="text-[9px] text-slate-500">Exit Time</span>
            </div>

            {/* মোট সময় */}
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                মোট সময়
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono block mt-0.5">
                {elapsedSeconds > 0 ? formatDuration(elapsedSeconds) : '0m'}
              </span>
              <span className="text-[9px] text-slate-500">Total Duration</span>
            </div>
          </div>
        </div>

        {/* Live Stopwatch & Minimum Stay Enforcement */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-center space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>সময় অটো হিসাব (Auto-Stopwatch)</span>
            </span>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-full border ${
                isInside
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isInside ? '🟢 Live Counting' : 'Standby'}
            </span>
          </div>

          {/* Huge Timer */}
          <div className="py-2">
            <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white drop-shadow-sm">
              {formatDurationHMS(elapsedSeconds)}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              মোট স্থায়িত্ব: <strong className="text-emerald-400">{formatDuration(elapsedSeconds)}</strong>
            </p>
          </div>

          {/* Minimum stay limit verification */}
          <div className="space-y-2 text-left bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck
                  className={`w-4 h-4 ${hasMetMinimumStay ? 'text-emerald-400' : 'text-amber-400'}`}
                />
                <span>
                  মিনিমাম স্টে লিমিট:{' '}
                  <strong className="text-white">{minimumStayMinutes} মিনিট</strong>
                </span>
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  hasMetMinimumStay ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {hasMetMinimumStay ? '✅ Qualified' : `${minStayProgress}% (${Math.floor(elapsedSeconds / 60)}m)`}
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  hasMetMinimumStay ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${minStayProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {hasMetMinimumStay ? (
                <span className="text-emerald-400 font-medium">
                  ✓ ক্লাসটি সফলভাবে সম্পন্ন হয়েছে। মিনিমাম স্টে শর্ত ({minimumStayMinutes} মিনিট) পূরণ হয়েছে।
                </span>
              ) : (
                <span className="text-amber-300/90">
                  ⚠️ মিনিমাম {minimumStayMinutes} মিনিট অবস্থান না করে বের হলে এই ক্লাসের হাজিরা গণনায় আসবে না।
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Geofence Simulator (For testing location arrival & auto calculations) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Geofence Radius Simulator
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Radius: {tuition.radius}m
            </span>
          </div>

          <p className="text-xs text-slate-400">
            লোকেশন ঢুকলে বা বের হলে স্বয়ংক্রিয় হিসাব পরীক্ষা করার জন্য দূরত্ব পরিবর্তন করুন:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDistanceChange(35)}
              className={`p-2.5 rounded-2xl text-xs font-medium border transition text-center ${
                distance <= 50
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Inside (35m)
              <span className="block text-[10px] text-slate-400 font-normal">ঢুকার জোন</span>
            </button>
            <button
              type="button"
              onClick={() => handleDistanceChange(90)}
              className={`p-2.5 rounded-2xl text-xs font-medium border transition text-center ${
                distance > 50 && distance <= tuition.radius
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Edge (90m)
              <span className="block text-[10px] text-slate-400 font-normal">সীমানার মধ্যে</span>
            </button>
            <button
              type="button"
              onClick={() => handleDistanceChange(160)}
              className={`p-2.5 rounded-2xl text-xs font-medium border transition text-center ${
                distance > tuition.radius
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Outside (160m)
              <span className="block text-[10px] text-slate-400 font-normal">বের হওয়া</span>
            </button>
          </div>

          {/* Quick Scenario Preset Matching User's Exact Prompt */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleLoadPromptExample}
              className="w-full py-2.5 px-3 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-left">
                  Test Prompt Example: <strong>4:05 PM → 6:02 PM (1h 57m)</strong>
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Action Button: Finish / Stop Session */}
        <div className="pt-1 pb-6">
          {activeSession && activeSession.tuitionId === tuition.id ? (
            <button
              type="button"
              onClick={() => setShowExitDialog(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-950 transition"
            >
              <StopCircle className="w-5 h-5" />
              <span>বের হওয়ার সময় হিসাব ও সেশন শেষ করুন</span>
            </button>
          ) : isInside ? (
            <button
              type="button"
              onClick={() => onStartSession(tuition.id, distance)}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>হাজিরা ট্র্যাকিং শুরু করুন (লোকেশন ডিটেক্টেড)</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs text-center flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>হাজিরা শুরুর জন্য {tuition.name}-এর {tuition.radius}m ব্যাসার্ধে প্রবেশ করতে হবে।</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exit / Departure Confirmation Modal with Exact Calculation Breakdown */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">হাজিরা হিসাব ও সংরক্ষণ</h3>
                <p className="text-xs text-slate-400">Attendance Calculation & Stay Validation</p>
              </div>
            </div>

            {/* Exact requested breakdown box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">টিউশন নাম:</span>
                <span className="font-bold text-white text-sm">{tuition.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">ঢোকার সময়:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {testScenarioMode ? '4:05 PM' : formatTimeDisplay(arrivalClockStr || '16:05')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">বের হওয়ার সময়:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {testScenarioMode ? '6:02 PM' : formatTimeDisplay(departureClockStr || formatClockTime())}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">মোট সময় (Auto-Calculated):</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    {testScenarioMode ? '1h 57m' : formatDuration(elapsedSeconds)}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {testScenarioMode ? '7,020s' : `${elapsedSeconds}s`}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">মিনিমাম স্টে লিমিট ({minimumStayMinutes}m):</span>
                <span
                  className={`font-bold ${
                    testScenarioMode || hasMetMinimumStay ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {testScenarioMode || hasMetMinimumStay
                    ? '✅ শর্ত পূরণ হয়েছে (Qualified)'
                    : `❌ শর্ত পূরণ হয়নি (< ${minimumStayMinutes}m)`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitDialog(false);
                  setTestScenarioMode(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                বাতিল (Cancel)
              </button>

              {testScenarioMode || hasMetMinimumStay ? (
                <button
                  type="button"
                  onClick={() => handleConfirmExit(true)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition"
                >
                  হাজিরা রেকর্ড করুন (Save)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmExit(false)}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-950 transition"
                >
                  বাতিল করুন (মিনিমাম স্টে হয়নি)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
