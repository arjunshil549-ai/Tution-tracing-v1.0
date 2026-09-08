import React, { useState } from 'react';
import { Tuition, Attendance } from '../types';
import { formatDuration, formatTimeDisplay } from '../services/geofence';
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit,
  Power,
  Trash2,
  X,
  Play,
  TrendingUp,
} from 'lucide-react';

interface TuitionDetailsModalProps {
  tuition: Tuition;
  attendanceLogs: Attendance[];
  onClose: () => void;
  onEdit: (tuition: Tuition) => void;
  onToggleActive: (tuitionId: number) => void;
  onDelete: (tuitionId: number) => void;
  onLaunchLiveAttendance: (tuition: Tuition) => void;
  onOpenCalendarSync?: (tuition: Tuition) => void;
}

export const TuitionDetailsModal: React.FC<TuitionDetailsModalProps> = ({
  tuition,
  attendanceLogs,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
  onLaunchLiveAttendance,
  onOpenCalendarSync,
}) => {
  // Calculate this month stats (September 2026)
  const monthlyLogs = attendanceLogs.filter(
    (a) => a.tuitionId === tuition.id && a.status === 'completed'
  );

  const classesCount = monthlyLogs.length;
  const totalSeconds = monthlyLogs.reduce((acc, log) => acc + log.duration, 0);
  const totalHoursFormatted = formatDuration(totalSeconds);

  const expectedClasses = tuition.expectedClassesPerMonth || 10;
  const attendanceRate = Math.min(100, Math.round((classesCount / expectedClasses) * 100));

  // Income earned this month
  const earnedIncome = Math.round((tuition.fee / expectedClasses) * classesCount);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{tuition.name}</h2>
            </div>
            {tuition.studentName && (
              <p className="text-xs text-emerald-400 font-medium mt-0.5">{tuition.studentName}</p>
            )}
            <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{tuition.address}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Tracking status banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  tuition.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="text-xs text-slate-300">
                Tracking: <strong className={tuition.active ? 'text-emerald-400' : 'text-slate-500'}>
                  {tuition.active ? '🟢 Active' : '⚪ Disabled'}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onLaunchLiveAttendance(tuition)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Live Radar</span>
            </button>
          </div>

          {/* Expected timings & fee */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">Expected Timing</span>
              <span className="font-bold text-slate-200 mt-1 block">
                {formatTimeDisplay(tuition.expectedStart)} – {formatTimeDisplay(tuition.expectedEnd)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">Monthly Fee</span>
              <span className="font-bold text-emerald-400 mt-1 block">
                ৳{tuition.fee.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </span>
            </div>
          </div>

          {/* This Month Performance Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>This Month (Sep 2026)</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ৳{earnedIncome.toLocaleString()} Earned
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Classes</span>
                <span className="text-base font-extrabold text-white">{classesCount}</span>
                <span className="text-[10px] text-slate-400 block">of {expectedClasses}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Hours</span>
                <span className="text-base font-extrabold text-white">{totalHoursFormatted}</span>
                <span className="text-[10px] text-slate-400 block">logged</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Attendance</span>
                <span className="text-base font-extrabold text-emerald-400">{attendanceRate}%</span>
                <span className="text-[10px] text-slate-400 block">rate</span>
              </div>
            </div>
          </div>

          {/* Recent Attendance Logs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Recent Attendance</span>
              <span className="text-slate-500">{monthlyLogs.length} completed sessions</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {monthlyLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl">
                  No attendance records logged yet this month.
                </div>
              ) : (
                monthlyLogs.slice(0, 6).map((log) => {
                  const dateObj = new Date(log.date + 'T00:00:00');
                  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-200">{dateStr}</span>
                          <span className="text-slate-500 ml-2">
                            {formatTimeDisplay(log.arrivalTime)} – {formatTimeDisplay(log.departureTime || '')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-medium text-emerald-400">
                          {formatDuration(log.duration)}
                        </span>
                        <span className="text-emerald-400">✅</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Google Calendar Sync Button */}
          {onOpenCalendarSync && (
            <button
              type="button"
              onClick={() => onOpenCalendarSync(tuition)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Sync Schedule with Google Calendar</span>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onEdit(tuition)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(tuition.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition ${
                tuition.active
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{tuition.active ? 'Disable' : 'Enable'}</span>
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(tuition.id);
                    onClose();
                  }}
                  className="px-2.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                title="Delete tuition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
