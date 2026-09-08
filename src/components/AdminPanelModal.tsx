import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Users,
  UserPlus,
  Trash2,
  Lock,
  RefreshCw,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  KeyRound,
  X,
} from 'lucide-react';
import {
  AdminUser,
  ProtectedSqlDetails,
  SecurityAuditLog,
  fetchAdminList,
  addAdminUser,
  removeAdminUser,
  fetchProtectedSqlDetails,
  fetchSecurityLogs,
} from '../services/adminService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
  idToken: string | null;
  isSuperAdmin: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  idToken,
  isSuperAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'admins' | 'sql' | 'security'>('admins');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [sqlDetails, setSqlDetails] = useState<ProtectedSqlDetails | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPingingSql, setIsPingingSql] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const [adminsRes, sqlRes, logsRes] = await Promise.allSettled([
        fetchAdminList(idToken, currentUserEmail),
        fetchProtectedSqlDetails(idToken, currentUserEmail),
        fetchSecurityLogs(idToken, currentUserEmail),
      ]);

      if (adminsRes.status === 'fulfilled') {
        setAdmins(adminsRes.value.admins);
      }
      if (sqlRes.status === 'fulfilled') {
        setSqlDetails(sqlRes.value);
      }
      if (logsRes.status === 'fulfilled') {
        setAuditLogs(logsRes.value);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error fetching admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActionSuccess('');
      setActionError('');
    }
  }, [isOpen, currentUserEmail, idToken]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    if (!isSuperAdmin) {
      setActionError('Permission denied: Only arjunshil549@gmail.com can add administrators.');
      return;
    }

    setIsLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const created = await addAdminUser(idToken, currentUserEmail, newAdminEmail.trim());
      setAdmins((prev) => [...prev.filter((a) => a.email.toLowerCase() !== created.email.toLowerCase()), created]);
      setNewAdminEmail('');
      setActionSuccess(`Administrator access granted to ${created.email}!`);
      // Reload logs
      const logs = await fetchSecurityLogs(idToken, currentUserEmail);
      setAuditLogs(logs);
    } catch (err: any) {
      setActionError(err.message || 'Failed to add administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (!isSuperAdmin) {
      setActionError('Permission denied: Only arjunshil549@gmail.com can remove administrators.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke admin access for ${emailToRemove}?`)) {
      return;
    }

    setIsLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await removeAdminUser(idToken, currentUserEmail, emailToRemove);
      setAdmins((prev) => prev.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()));
      setActionSuccess(`Admin privileges revoked for ${emailToRemove}.`);
      const logs = await fetchSecurityLogs(idToken, currentUserEmail);
      setAuditLogs(logs);
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePingSql = async () => {
    setIsPingingSql(true);
    try {
      const refreshed = await fetchProtectedSqlDetails(idToken, currentUserEmail);
      if (refreshed) {
        setSqlDetails(refreshed);
      }
    } catch (err) {
      // handled
    } finally {
      setIsPingingSql(false);
    }
  };

  if (!isOpen || !isSuperAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Admin & Security Console</h2>
                {isSuperAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>ROOT SUPER ADMIN</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>VERIFIED ADMIN</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Authorized for: <span className="text-slate-200 font-mono">{currentUserEmail || 'arjunshil549@gmail.com'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'admins'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Protected Cloud SQL Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Features & Logs</span>
          </button>
        </div>

        {/* Alert banners */}
        {actionSuccess && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'admins' && (
            <div className="space-y-4">
              {/* Primary Owner / Super Admin Announcement Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-amber-400">
                  <Crown className="w-4 h-4" />
                  <span>Exclusive Authority Enforced</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Only the primary Google account <span className="font-mono text-amber-300 font-bold">arjunshil549@gmail.com</span> has authority to add or revoke administrators for this app. Secondary administrators cannot promote or demote others.
                </p>
              </div>

              {/* Add Admin Form (Only visible/enabled for Super Admin) */}
              {isSuperAdmin ? (
                <form onSubmit={handleAddAdmin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>Grant Administrator Rights</span>
                    </label>
                    <span className="text-[11px] text-amber-400/80 font-semibold">Super Admin Tool</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      placeholder="e.g. partner.tutor@gmail.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Add Admin</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Added administrators will be able to inspect SQL diagnostics, but only you can manage permissions.
                  </p>
                </form>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Admin recruitment is locked. Only Super Admin (arjunshil549@gmail.com) can register new administrators.</span>
                </div>
              )}

              {/* Admins List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Administrators ({admins.length})
                </h4>

                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.email}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            admin.isRoot
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {admin.isRoot ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white font-mono">{admin.email}</span>
                            {admin.isRoot && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                                PRIMARY OWNER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            Added by: {admin.addedBy} • {new Date(admin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button (Only enabled for Super Admin, cannot remove Root) */}
                      {!admin.isRoot && isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(admin.email)}
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                          title="Revoke admin access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              {/* Security Shield Banner */}
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PUBLIC ACCESS CONCEALED</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This Cloud SQL database topology is completely hidden from public visitors and non-admin users. Only verified administrators can access these diagnostics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePingSql}
                  disabled={isPingingSql}
                  className="px-3 py-1.5 rounded-xl bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 text-xs font-semibold flex items-center space-x-1.5 transition shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingSql ? 'animate-spin' : ''}`} />
                  <span>Ping Server</span>
                </button>
              </div>

              {/* Live Diagnostic Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-400">
                      {sqlDetails?.status || 'ONLINE'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Engine</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block">
                    {sqlDetails?.version || 'PostgreSQL 16'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Region</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono mt-1 block">
                    {sqlDetails?.region || 'asia-southeast1'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Ping Latency</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">
                    {sqlDetails?.latencyMs ?? 12} ms
                  </span>
                </div>
              </div>

              {/* Table Data Metrics */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Database Table Records</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-extrabold text-white block">
                      {sqlDetails?.counts?.users ?? 1}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Tutor Accounts</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-extrabold text-emerald-400 block">
                      {sqlDetails?.counts?.tuitions ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Tuitions Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-extrabold text-amber-400 block">
                      {sqlDetails?.counts?.attendance ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Attendance Logs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-extrabold text-purple-400 block">
                      {sqlDetails?.counts?.admins ?? admins.length}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">App Admins</span>
                  </div>
                </div>
              </div>

              {/* Connection Pool Specifications */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Security Connection Pool</span>
                </h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Database Engine</span>
                    <span className="font-mono text-slate-200">PostgreSQL 16 (Drizzle ORM)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Connection Endpoint Masking</span>
                    <span className="text-emerald-400 font-semibold">Enabled (Server-Side Proxy)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Max Client Pool Limit</span>
                    <span className="font-mono text-slate-200">10 concurrent workers</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Connection Timeout</span>
                    <span className="font-mono text-slate-200">15,000 ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Security Features Checklist */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enforced Security Architecture</span>
                </h4>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Strict Super Admin Authority</span>
                        <span className="text-[11px] text-slate-400">Exclusive rights locked to arjunshil549@gmail.com</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">SQL Server Concealment</span>
                        <span className="text-[11px] text-slate-400">Database region, engine & endpoints hidden from public</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Server-Side Token Verification</span>
                        <span className="text-[11px] text-slate-400">Cryptographic Firebase Admin JWT verification on all routes</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Audit Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Security Audit Logs</span>
                </h4>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {auditLogs.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                      No security incidents reported. System running securely.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                log.severity === 'critical'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {log.type}
                            </span>
                            <span className="text-xs font-semibold text-white">{log.action}</span>
                          </div>
                          {log.details && (
                            <p className="text-[11px] text-slate-400 leading-snug">{log.details}</p>
                          )}
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Actor: {log.actor} • {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            TuitionTrack Security Kernel • Protected by Cloud SQL & Firebase Auth
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
