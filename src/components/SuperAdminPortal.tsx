import React, { useState, useEffect } from 'react';
import {
  Crown,
  Users,
  Trash2,
  Edit3,
  Plus,
  Radio,
  Clock,
  MapPin,
  DollarSign,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Settings,
  X,
  UserX,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Tuition, Attendance, AppSettings, UserProfile } from '../types';
import {
  AppUser,
  ProtectedSqlDetails,
  SecurityAuditLog,
  fetchRegisteredUsers,
  removeUserAccount,
  fetchProtectedSqlDetails,
  fetchSecurityLogs,
} from '../services/adminService';
import { formatTimeDisplay, formatClockTime } from '../services/geofence';

function formatDurationBengali(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h} ঘণ্টা ${m} মিনিট`;
  }
  return `${m} মিনিট`;
}

interface SuperAdminPortalProps {
  currentUserEmail: string;
  idToken: string | null;
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  settings: AppSettings;
  onUpdateTuitions: (tuitions: Tuition[]) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenAddTuition: () => void;
  onEditTuition: (tuition: Tuition) => void;
  onDeleteTuition: (id: number) => void;
  activeSession: any;
  onSimulateArrival: (tuition: Tuition) => void;
  onSimulateExit: () => void;
}

type AdminTab = 'tracking' | 'tuitions' | 'users' | 'database' | 'settings';

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  currentUserEmail,
  idToken,
  tuitions,
  attendanceLogs,
  settings,
  onUpdateTuitions,
  onUpdateSettings,
  onOpenAddTuition,
  onEditTuition,
  onDeleteTuition,
  activeSession,
  onSimulateArrival,
  onSimulateExit,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('tracking');
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [sqlDetails, setSqlDetails] = useState<ProtectedSqlDetails | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingUserUid, setDeletingUserUid] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const [users, sql, logs] = await Promise.allSettled([
        fetchRegisteredUsers(idToken, currentUserEmail),
        fetchProtectedSqlDetails(idToken, currentUserEmail),
        fetchSecurityLogs(idToken, currentUserEmail),
      ]);

      if (users.status === 'fulfilled') {
        setRegisteredUsers(users.value);
      }
      if (sql.status === 'fulfilled') {
        setSqlDetails(sql.value);
      }
      if (logs.status === 'fulfilled') {
        setAuditLogs(logs.value);
      }
    } catch (err: any) {
      console.warn('Super admin sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [idToken, currentUserEmail]);

  const handleRemoveUser = async (targetUser: AppUser) => {
    if (targetUser.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setStatusMessage({ type: 'error', text: 'আপনি সুপার অ্যাডমিন অ্যাকাউন্ট ডিলিট করতে পারবেন না।' });
      return;
    }

    const confirmMsg = `আপনি কি নিশ্চিত যে "${targetUser.name || targetUser.email}" ব্যবহারকারীকে সিস্টেম থেকে সম্পূর্ণ মুছে ফেলতে চান?`;
    if (!confirm(confirmMsg)) return;

    setDeletingUserUid(targetUser.uid);
    try {
      await removeUserAccount(idToken, currentUserEmail, targetUser.uid, targetUser.email);
      setRegisteredUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      setStatusMessage({
        type: 'success',
        text: `ব্যবহারকারী "${targetUser.email}" কে সফলভাবে রিমুভ করা হয়েছে।`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'ব্যবহারকারী মুছে ফেলতে ব্যর্থ হয়েছে।',
      });
    } finally {
      setDeletingUserUid(null);
    }
  };

  // Filtered users
  const filteredUsers = registeredUsers.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.institution && u.institution.toLowerCase().includes(q))
    );
  });

  const totalEarnings = attendanceLogs.reduce((acc, log) => {
    const tuition = tuitions.find((t) => t.id === log.tuitionId);
    if (!tuition) return acc;
    const perClassFee = tuition.fee / (tuition.expectedClassesPerMonth || 10);
    return acc + perClassFee;
  }, 0);

  const totalHours = attendanceLogs.reduce((acc, log) => acc + (log.duration || 0), 0) / 3600;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Super Admin Master Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl shadow-amber-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  ⚡ SUPER ADMIN PORTAL
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Master Authority</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                সুপার অ্যাডমিন ড্যাশবোর্ড ও মাস্টার ট্র্যাকিং
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                লগইন করা অ্যাকাউন্ট: <strong className="text-amber-300 font-mono">{currentUserEmail}</strong> (শুধুমাত্র আপনি এই ইন্টারফেস দেখতে পাবেন)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={loadAdminData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddTuition}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন টিউশন যোগ</span>
            </button>
          </div>
        </div>

        {/* Quick System Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">রেজিস্টার্ড ইউজার</span>
            <span className="text-base font-black text-white">{registeredUsers.length || 1} জন</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">মোট টিউশন</span>
            <span className="text-base font-black text-amber-400">{tuitions.length} টি</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">ভেরিফাইড ক্লাস লগ</span>
            <span className="text-base font-black text-emerald-400">{attendanceLogs.length} টি</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">ডাটাবেস স্ট্যাটাস</span>
            <span className="text-xs font-extrabold text-cyan-400 flex items-center space-x-1 mt-0.5">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>PostgreSQL 16 Online</span>
            </span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs animate-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs for Super Admin */}
      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'tracking'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>মাস্টার ট্র্যাকিং সিস্টেম</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tuitions')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'tuitions'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>টিউশন ও অ্যাপ নিয়ন্ত্রণ ({tuitions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ইউজার ম্যানেজমেন্ট ও রিমুভ ({registeredUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ক্লাউড এসকিউএল ডায়াগনস্টিক</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>গ্লোবাল কনফিগারেশন</span>
        </button>
      </div>

      {/* TAB 1: MASTER TRACKING SYSTEM */}
      {activeTab === 'tracking' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Active Live Session Bar */}
          {activeSession && activeSession.isInside ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      🟢 LIVE ATTENDANCE IN PROGRESS
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {tuitions.find((t) => t.id === activeSession.tuitionId)?.name || 'Tuition In Session'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      ঢোকার সময়: <strong className="text-white font-mono">{formatTimeDisplay(formatClockTime(new Date(activeSession.startTime)))}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSimulateExit}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>রেডিয়াস থেকে প্রস্থান করুন (অটো-লগ)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>মাস্টার ট্র্যাকিং রাডার সক্রিয়। কোনো টিউশন রেডিয়াসে প্রবেশ করলে স্বয়ংক্রিয় স্টপওয়াচ চালু হবে।</span>
              </div>
              {tuitions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-[11px]">টেস্ট প্রবেশ:</span>
                  <button
                    type="button"
                    onClick={() => onSimulateArrival(tuitions[0])}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition"
                  >
                    {tuitions[0].name} এ প্রবেশ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Master Tuitions Radar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tuitions.map((tuition) => {
              const sessions = attendanceLogs.filter((l) => l.tuitionId === tuition.id);
              const totalSec = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

              return (
                <div
                  key={tuition.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <h4 className="text-base font-bold text-white">{tuition.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{tuition.studentName || 'Student batch'}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold text-xs">
                      {settings.currencySymbol}{tuition.fee.toLocaleString()} / মাস
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">ক্লাস সম্পন্ন</span>
                      <span className="font-bold text-white font-mono">{sessions.length} দিন</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">মোট সময়</span>
                      <span className="font-bold text-emerald-400 font-mono">{formatDurationBengali(totalSec)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">জিওফেন্স</span>
                      <span className="font-bold text-cyan-400 font-mono">{tuition.radius} মিটার</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tuition.expectedStart} - {tuition.expectedEnd}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSimulateArrival(tuition)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition"
                      >
                        সরাসরি চেক-ইন
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTuition(tuition)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TUITIONS & APP CONTENT MANAGER */}
      {activeTab === 'tuitions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">অ্যাপের সমস্ত টিউশন ডেটা পরিবর্তন</h3>
              <p className="text-xs text-slate-400">
                সুপার অ্যাডমিন হিসেবে আপনি যেকোনো টিউশনের নাম, ঠিকানা, ফি, সময়, জিওফেন্স রেডিয়াস এবং দিন পরিবর্তন করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddTuition}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ নতুন টিউশন তৈরি</span>
            </button>
          </div>

          <div className="space-y-3">
            {tuitions.map((tuition) => (
              <div
                key={tuition.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-white">{tuition.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
                      ID: #{tuition.id}
                    </span>
                    {tuition.active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        নিষ্ক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tuition.address}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>শিক্ষার্থী: <strong className="text-slate-200">{tuition.studentName || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>ফি: <strong className="text-amber-300">{settings.currencySymbol}{tuition.fee}</strong></span>
                    <span>•</span>
                    <span>রেডিয়াস: <strong className="text-cyan-300">{tuition.radius}m</strong></span>
                    <span>•</span>
                    <span>ন্যূনতম অবস্থান: <strong className="text-white">{tuition.minimumStayMinutes || 30} মিনিট</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onEditTuition(tuition)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>এডিট করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTuition(tuition.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                    title="টিউশন মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & REMOVAL */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 font-black text-amber-400">
              <Users className="w-4 h-4" />
              <span>ব্যবহারকারী নিয়ন্ত্রণ ও রিমুভ সিস্টেম</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              সুপার অ্যাডমিন হিসেবে আপনি যেকোনো ব্যবহারকারীকে সিস্টেম থেকে মুছে ফেলতে পারবেন। মুছে ফেললে তাদের প্রোফাইল ও লগ সম্পূর্ণ রিমুভ হয়ে যাবে।
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ইমেইল বা নাম দিয়ে ব্যবহারকারী খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                কোনো ব্যবহারকারী পাওয়া যায়নি।
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSuper = user.email.toLowerCase() === currentUserEmail.toLowerCase();

                return (
                  <div
                    key={user.uid || user.email}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{user.name || user.email.split('@')[0]}</h4>
                          {isSuper ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center space-x-1">
                              <Crown className="w-3 h-3" />
                              <span>ROOT SUPER ADMIN</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                              সাধারণ ইউজার
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                        {user.institution && (
                          <p className="text-[11px] text-slate-400">{user.institution}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      {isSuper ? (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                          স্থায়ী প্রোটেক্টেড
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={deletingUserUid === user.uid}
                          onClick={() => handleRemoveUser(user)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition disabled:opacity-50 shadow-md shadow-rose-950/50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>
                            {deletingUserUid === user.uid ? 'মুছে ফেলা হচ্ছে...' : 'রিমুভ করুন'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLOUD SQL DIAGNOSTICS */}
      {activeTab === 'database' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Google Cloud SQL Protected Diagnostics</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                {sqlDetails?.status || 'ONLINE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">ইঞ্জিন</span>
                <span className="font-bold text-white mt-1 block">{sqlDetails?.engine || 'PostgreSQL 16'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">সার্ভার রিজিয়ন</span>
                <span className="font-bold text-white mt-1 block">{sqlDetails?.region || 'asia-southeast1'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">লেটেন্সি</span>
                <span className="font-bold text-emerald-400 font-mono mt-1 block">
                  {sqlDetails?.latencyMs ?? 18} ms
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">সিকিউরিটি শিল্ড</span>
                <span className="font-bold text-amber-400 text-[11px] mt-1 block">
                  {sqlDetails?.securityShield || 'Strict Super Admin Lock'}
                </span>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>সাম্প্রতিক সিকিউরিটি ও অ্যাডমিন অডিট লগ</span>
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">কোনো সিকিউরিটি সতর্কতা নেই।</p>
                ) : (
                  auditLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between text-xs gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({log.actor})</span>
                        </div>
                        {log.details && <p className="text-[11px] text-slate-400">{log.details}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GLOBAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in duration-200 text-xs">
          <h3 className="text-sm font-bold text-white">অ্যাপের গ্লোবাল ট্র্যাকিং কনফিগারেশন</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                ন্যূনতম অবস্থান শর্ত (মিনিট)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={settings.minimumStay}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, minimumStay: parseInt(e.target.value, 10) || 30 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-400">
                এই সময়ের কম থাকলে উপস্থিতি স্বয়ংক্রিয়ভাবে অসম্পূর্ণ থাকবে।
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                ডিফল্ট জিওফেন্স রেডিয়াস (মিটার)
              </label>
              <input
                type="number"
                min="20"
                max="500"
                value={settings.defaultRadius}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, defaultRadius: parseInt(e.target.value, 10) || 100 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-400">
                নতুন টিউশন যুক্ত করার সময় ডিফল্ট রেডিয়াস।
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
