import React from 'react';
import { NotificationItem } from '../types';
import { Bell, Check, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenReport: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onOpenReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Notifications</h3>
              <p className="text-xs text-slate-400">Monthly reports & geofence alerts</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-slate-800 rounded-lg transition"
            >
              Mark read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const isMonthEnd = n.type === 'month_end';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition ${
                    isMonthEnd
                      ? 'bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-500/30 shadow-lg'
                      : 'bg-slate-950 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 text-base">🔔</span>
                      <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 mt-1" />
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                    {n.message}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {new Date(n.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {isMonthEnd && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenReport();
                        }}
                        className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                      >
                        <span>Open report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
