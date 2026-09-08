import React, { useState } from 'react';
import { Tuition, Attendance } from '../types';
import { formatDuration, formatTimeDisplay } from '../services/geofence';
import {
  Plus,
  MapPin,
  Clock,
  Navigation,
  Radio,
  ChevronRight,
  Sparkles,
  Play,
  Search,
} from 'lucide-react';

interface TuitionListProps {
  tuitions: Tuition[];
  attendanceLogs: Attendance[];
  onOpenAddModal: () => void;
  onSelectTuition: (tuition: Tuition) => void;
  onLaunchLiveAttendance: (tuition: Tuition) => void;
}

export const TuitionList: React.FC<TuitionListProps> = ({
  tuitions,
  attendanceLogs,
  onOpenAddModal,
  onSelectTuition,
  onLaunchLiveAttendance,
}) => {
  const [search, setSearch] = useState('');

  const filteredTuitions = tuitions.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase()) ||
      (t.studentName && t.studentName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div id="tuition-list-view" className="space-y-5 pb-20">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Tuitions</h2>
          <p className="text-xs text-slate-400">Manage locations, schedules, and geofence radii</p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tuition</span>
        </button>
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tuition name, student, or address..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Tuitions Cards Grid */}
      {filteredTuitions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No Tuitions Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {search ? 'No tuition matches your search query.' : 'Create your first tuition location to start automatic attendance tracking.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Create Tuition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTuitions.map((tuition) => {
            // Calculate completed sessions this month
            const logs = attendanceLogs.filter(
              (a) => a.tuitionId === tuition.id && a.status === 'completed'
            );
            const classesThisMonth = logs.length;
            const totalDurationSecs = logs.reduce((acc, l) => acc + l.duration, 0);

            return (
              <div
                key={tuition.id}
                className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="cursor-pointer" onClick={() => onSelectTuition(tuition)}>
                      <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-400 transition flex items-center space-x-2">
                        <span>{tuition.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition" />
                      </h3>
                      {tuition.studentName && (
                        <p className="text-xs text-emerald-400/90 font-medium mt-0.5">{tuition.studentName}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        tuition.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tuition.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{tuition.active ? 'Tracking Active' : 'Disabled'}</span>
                    </span>
                  </div>

                  {/* Location & Radius */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[200px]">{tuition.address}</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                      Radius: {tuition.radius}m
                    </span>
                  </div>

                  {/* Schedule & Fee Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Expected Time</span>
                      <span className="font-bold text-slate-200 block mt-0.5">
                        {formatTimeDisplay(tuition.expectedStart)} – {formatTimeDisplay(tuition.expectedEnd)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Monthly Fee</span>
                      <span className="font-bold text-emerald-400 block mt-0.5">
                        ৳{tuition.fee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom stats & Quick Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-white">{classesThisMonth}</span> classes this month (
                    <span className="font-mono text-slate-300">{formatDuration(totalDurationSecs)}</span>)
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onLaunchLiveAttendance(tuition)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                      title="Launch live geofence radar"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      <span>Radar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTuition(tuition)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
