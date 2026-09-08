import React, { useState } from 'react';
import { Tuition, Attendance, AppSettings } from '../types';
import { formatDuration, formatTimeDisplay } from '../services/geofence';
import { exportTuitionReportToSheets, SheetExportResult } from '../services/workspace';
import { GmailSendModal } from './GmailSendModal';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface MonthlyReportProps {
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  settings: AppSettings;
  googleAccessToken?: string | null;
  onPromptGoogleAuth?: () => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  tuitions,
  attendanceLogs,
  settings,
  googleAccessToken,
  onPromptGoogleAuth,
}) => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // September (1-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>('2026-09-07');
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'daily'>('overview');

  // Google Sheets state
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [sheetResult, setSheetResult] = useState<SheetExportResult | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Gmail modal state
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  // Month prefix string e.g. "2026-09"
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Filter completed logs for this month
  const monthLogs = attendanceLogs.filter(
    (log) => log.date.startsWith(monthPrefix) && log.status === 'completed'
  );

  // Stats calculation
  const attendedDaysSet = new Set(monthLogs.map((l) => l.date));
  const attendedDaysCount = attendedDaysSet.size;
  const totalDurationSeconds = monthLogs.reduce((acc, l) => acc + l.duration, 0);
  const totalDurationFormatted = formatDuration(totalDurationSeconds);

  // Expected classes & Attendance %
  const totalExpectedClasses = tuitions
    .filter((t) => t.active)
    .reduce((sum, t) => sum + (t.expectedClassesPerMonth || 10), 0);
  const attendanceRate = totalExpectedClasses > 0
    ? Math.min(100, Math.round((monthLogs.length / totalExpectedClasses) * 100))
    : 0;

  // Income calculations (Section 30 of prompt)
  const totalExpectedIncome = tuitions
    .filter((t) => t.active)
    .reduce((sum, t) => sum + t.fee, 0);

  const earnedIncome = tuitions.reduce((sum, tuition) => {
    const tLogs = monthLogs.filter((l) => l.tuitionId === tuition.id);
    const expected = tuition.expectedClassesPerMonth || 10;
    const perClassFee = tuition.fee / expected;
    return sum + Math.round(perClassFee * tLogs.length);
  }, 0);

  // Calendar calculations (days in month)
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  // First day of month (0 = Sun, 1 = Mon, ... 6 = Sat)
  const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  // Convert Sunday=0 to Monday=0 format
  const startDayCol = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Selected date details
  const selectedDateLogs = selectedDateStr
    ? attendanceLogs.filter((l) => l.date === selectedDateStr)
    : [];

  const handleExportCSV = () => {
    const headers = ['Date', 'Tuition', 'Arrival Time', 'Departure Time', 'Duration (seconds)', 'Duration (formatted)', 'Status'];
    const rows = monthLogs.map((log) => {
      const tuition = tuitions.find((t) => t.id === log.tuitionId);
      return [
        log.date,
        `"${tuition?.name || 'Unknown'}"`,
        log.arrivalTime,
        log.departureTime || '',
        log.duration,
        `"${formatDuration(log.duration)}"`,
        log.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TuitionTrack_Report_${monthPrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGoogleSheets = async () => {
    if (!googleAccessToken) {
      if (onPromptGoogleAuth) onPromptGoogleAuth();
      return;
    }
    setIsExportingSheets(true);
    setSheetsError(null);
    try {
      const res = await exportTuitionReportToSheets(
        googleAccessToken,
        'September',
        selectedYear,
        tuitions,
        monthLogs
      );
      setSheetResult(res);
    } catch (err: any) {
      console.error('Google Sheets export failed:', err);
      setSheetsError(err.message || 'Failed to export to Google Sheets.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  const emailDefaultBody = `TuitionTrack Attendance & Fee Statement
Month: September ${selectedYear}
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
• Total Tuition Sessions: ${attendedDaysCount}
• Total Hours Taught: ${totalDurationFormatted}
• Estimated Earned: ৳${earnedIncome.toLocaleString()}

TUITION BREAKDOWN:
${tuitions
  .map((t) => {
    const done = monthLogs.filter((l) => l.tuitionId === t.id).length;
    return `• ${t.name} (${t.studentName || 'Student'}): ${done}/${t.expectedClassesPerMonth || 10} classes completed - ৳${t.fee.toLocaleString()}`;
  })
  .join('\n')}

Detailed attendance logs are recorded in TuitionTrack.
Thank you!`;

  return (
    <div id="monthly-report-view" className="space-y-6 pb-20">
      {/* Month Selector Bar & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Monthly Report</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              September 2026
            </span>
          </div>
          <p className="text-xs text-slate-400">Attendance analytics, tuition breakdown, and earned income</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Sheets Export */}
          <button
            type="button"
            onClick={handleExportGoogleSheets}
            disabled={isExportingSheets}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-800/60 flex items-center space-x-1.5 transition disabled:opacity-60"
            title="Export full report to Google Sheets spreadsheet"
          >
            {isExportingSheets ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isExportingSheets ? 'Exporting...' : 'Google Sheets'}</span>
          </button>

          {/* Gmail Send */}
          <button
            type="button"
            onClick={() => {
              if (!googleAccessToken && onPromptGoogleAuth) {
                onPromptGoogleAuth();
              } else {
                setIsGmailModalOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold border border-red-800/60 flex items-center space-x-1.5 transition"
            title="Send report email via Gmail"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span>Email via Gmail</span>
          </button>

          {/* Standard CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Feedback Banner */}
      {sheetResult && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Google Sheet Created Successfully!</p>
              <p className="text-emerald-300/80 text-[11px]">{sheetResult.title}</p>
            </div>
          </div>
          <a
            href={sheetResult.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1.5 transition shadow"
          >
            <span>Open Sheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {sheetsError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {sheetsError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Overview & Breakdown
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'calendar'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Calendar View</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'daily'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Daily Logs ({monthLogs.length})
        </button>
      </div>

      {/* Main Stats Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Attended Days */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attended Days</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{attendedDaysCount}</span>
            <span className="text-xs text-emerald-400 font-bold ml-1.5">DAYS</span>
          </div>
          <span className="text-[11px] text-slate-500">In September 2026</span>
        </div>

        {/* Total Time */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Time</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{totalDurationFormatted}</span>
          </div>
          <span className="text-[11px] text-slate-500">Duration at locations</span>
        </div>

        {/* Attendance Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{attendanceRate}%</span>
            <span className="text-[11px] text-slate-400 ml-1.5">of {totalExpectedClasses} classes</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">90% Target met ✅</span>
        </div>

        {/* Earned Income (Section 30) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Earned Income</span>
          </span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">৳{earnedIncome.toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-slate-400">of ৳{totalExpectedIncome.toLocaleString()} expected</span>
        </div>
      </div>

      {/* Overview Tab: Tuition breakdown progress bars & Income */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tuition-wise breakdown progress bars (Matching Section 13 from prompt) */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Tuition Attendance Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400">Completed / Expected</span>
            </div>

            <div className="space-y-4 pt-1">
              {tuitions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800/60 p-4">
                  কোনো টিউশন যুক্ত করা নেই (No tuitions added yet). Add a tuition to start tracking monthly breakdown.
                </div>
              ) : (
                tuitions.map((tuition) => {
                const tLogs = monthLogs.filter((l) => l.tuitionId === tuition.id);
                const attended = tLogs.length;
                const expected = tuition.expectedClassesPerMonth || 10;
                const percentage = Math.min(100, Math.round((attended / expected) * 100));
                const totalSec = tLogs.reduce((acc, l) => acc + l.duration, 0);
                const earned = Math.round((tuition.fee / expected) * attended);

                return (
                  <div key={tuition.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sm text-white">{tuition.name}</span>
                        <span className="text-xs text-slate-400 block">{tuition.address}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm text-emerald-400">
                          {attended}/{expected}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {formatDuration(totalSec)} logged
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>{percentage}% completed</span>
                        <span className="font-semibold text-emerald-400">
                          Earned: ৳{earned.toLocaleString()} / ৳{tuition.fee.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Income Calculator Breakdown Box (Section 30 from prompt) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Tuition Income Engine 💰</h3>
                  <p className="text-xs text-slate-400">Per-class earned revenue calculation</p>
                </div>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                ৳{earnedIncome.toLocaleString()} Total Earned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              {tuitions.map((t) => {
                const attended = monthLogs.filter((l) => l.tuitionId === t.id).length;
                const expected = t.expectedClassesPerMonth || 10;
                const perClass = Math.round(t.fee / expected);
                const totalTuitEarned = perClass * attended;

                return (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{t.name}</span>
                      <span className="text-emerald-400">৳{t.fee.toLocaleString()} / mo</span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Expected:</span>
                        <span>{expected} classes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attended:</span>
                        <span className="text-white font-semibold">{attended} classes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Per class rate:</span>
                        <span>৳{perClass.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800/80 font-bold text-white">
                        <span>Earned:</span>
                        <span className="text-emerald-400">৳{totalTuitEarned.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View (Section 14 from prompt) */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>September 2026 Calendar</span>
              </h3>
              <span className="text-xs text-slate-400">Tap date to view tuition logs</span>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 pb-1">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {/* Padding empty slots for start of month */}
              {Array.from({ length: startDayCol }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2.5 rounded-xl bg-transparent" />
              ))}

              {/* Day slots */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `2026-09-${String(dayNum).padStart(2, '0')}`;
                const hasAttendance = attendedDaysSet.has(dateKey);
                const isSelected = selectedDateStr === dateKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`relative p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-between min-h-[48px] border transition ${
                      isSelected
                        ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg'
                        : hasAttendance
                        ? 'bg-slate-950 border-emerald-500/40 text-slate-200 hover:border-emerald-400'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:bg-slate-900'
                    }`}
                  >
                    <span className="font-semibold text-xs">{dayNum}</span>
                    {hasAttendance ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 mt-1 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Box (Section 14 from prompt) */}
          {selectedDateStr && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" />
                  <span>
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{selectedDateLogs.length} session(s)</span>
              </div>

              {selectedDateLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No tuition attended on this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateLogs.map((log) => {
                    const tuition = tuitions.find((t) => t.id === log.tuitionId);
                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-sm text-white">{tuition?.name || 'Tuition'}</span>
                            <span className="text-slate-400 block text-xs">{tuition?.address}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 uppercase text-[10px]">
                            {log.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Timing</span>
                            <span className="font-semibold text-slate-200">
                              {formatTimeDisplay(log.arrivalTime)} → {formatTimeDisplay(log.departureTime || '')}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Duration</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatDuration(log.duration)}
                            </span>
                          </div>
                        </div>

                        {log.notes && (
                          <p className="text-slate-400 text-[11px] pt-1 italic">
                            Notes: "{log.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily Attendance Tab (Section 13) */}
      {activeTab === 'daily' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">Daily Attendance Log (September 2026)</h3>
            <span className="text-xs text-slate-400">{monthLogs.length} Records</span>
          </div>

          <div className="space-y-2">
            {monthLogs.map((log) => {
              const tuition = tuitions.find((t) => t.id === log.tuitionId);
              const dateObj = new Date(log.date + 'T00:00:00');
              const dayStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-200">{dayStr}</span>
                    <span className="text-emerald-400">✅</span>
                    <div>
                      <span className="font-semibold text-white">{tuition?.name}</span>
                      <span className="text-slate-500 ml-2">
                        {formatTimeDisplay(log.arrivalTime)} – {formatTimeDisplay(log.departureTime || '')}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {formatDuration(log.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gmail Send Modal */}
      {googleAccessToken && (
        <GmailSendModal
          isOpen={isGmailModalOpen}
          onClose={() => setIsGmailModalOpen(false)}
          accessToken={googleAccessToken}
          defaultSubject={`TuitionTrack Monthly Statement - September ${selectedYear}`}
          defaultBody={emailDefaultBody}
        />
      )}
    </div>
  );
};
