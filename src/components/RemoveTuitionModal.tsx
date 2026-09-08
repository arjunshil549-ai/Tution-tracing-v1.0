import React, { useState } from 'react';
import { Tuition, Attendance } from '../types';
import {
  Trash2,
  X,
  MapPin,
  AlertTriangle,
  Plus,
  BookOpen,
  Check,
} from 'lucide-react';

interface RemoveTuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  onDeleteTuition: (tuitionId: number) => void;
  onOpenAddModal: () => void;
}

export const RemoveTuitionModal: React.FC<RemoveTuitionModalProps> = ({
  isOpen,
  onClose,
  tuitions,
  attendanceLogs,
  onDeleteTuition,
  onOpenAddModal,
}) => {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: number) => {
    onDeleteTuition(id);
    setConfirmId(null);
    if (tuitions.length <= 1) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Remove Tuition (টিউশন রিমুভ করুন)</h3>
              <p className="text-xs text-slate-400">Select any tuition to remove from your schedule</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {tuitions.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-400">কোনো টিউশন লিস্টে নেই (No tuitions to remove).</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tuition</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tuitions.map((t) => {
                const logsCount = attendanceLogs.filter(
                  (a) => a.tuitionId === t.id && a.status === 'completed'
                ).length;
                const isConfirming = confirmId === t.id;

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{t.name}</h4>
                        {t.studentName && (
                          <p className="text-xs text-emerald-400/90 font-medium">{t.studentName}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[220px]">{t.address}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-400 block">৳{t.fee}</span>
                        <span className="text-[10px] text-slate-500 block">{logsCount} classes logged</span>
                      </div>
                    </div>

                    {isConfirming ? (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-2 animate-in fade-in">
                        <div className="flex items-center space-x-2 text-xs text-rose-300">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>Are you sure? This cannot be undone.</span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg font-medium transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="px-2.5 py-1 text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-lg font-bold shadow transition"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Radius: {t.radius}m • {t.expectedStart} - {t.expectedEnd}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmId(t.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddModal();
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Tuition</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
