import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Tuition } from '../types';
import {
  addTuitionToCalendar,
  listUpcomingTuitionCalendarEvents,
  CalendarEventItem,
} from '../services/workspace';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  tuition?: Tuition | null;
  allTuitions?: Tuition[];
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  tuition,
  allTuitions = [],
}) => {
  const [selectedTuition, setSelectedTuition] = useState<Tuition | null>(
    tuition || allTuitions[0] || null
  );
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<{ eventId: string; htmlLink: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (tuition) setSelectedTuition(tuition);
    else if (allTuitions.length > 0 && !selectedTuition) setSelectedTuition(allTuitions[0]);
  }, [tuition, allTuitions]);

  const loadCalendarEvents = async () => {
    setIsLoadingEvents(true);
    setError(null);
    try {
      const items = await listUpcomingTuitionCalendarEvents(accessToken);
      setEvents(items);
    } catch (err: any) {
      console.warn('Could not load calendar events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      loadCalendarEvents();
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const handleConfirmSync = async () => {
    if (!selectedTuition) return;
    setIsSyncing(true);
    setError(null);
    try {
      const res = await addTuitionToCalendar(accessToken, selectedTuition);
      setSyncSuccess(res);
      setShowConfirm(false);
      loadCalendarEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to add event to Google Calendar');
      setShowConfirm(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Google Calendar Sync</h2>
              <p className="text-xs text-slate-400">Google Workspace Calendar API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {syncSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Added to Google Calendar!</span>
              </div>
              <p>Weekly recurring schedule created with notification reminders.</p>
              {syncSuccess.htmlLink && (
                <a
                  href={syncSuccess.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-emerald-400 hover:underline pt-1 font-medium"
                >
                  <span>Open in Google Calendar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Sync Section */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Sync Tuition Schedule
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Select Tuition</label>
              <select
                value={selectedTuition?.id || ''}
                onChange={(e) => {
                  const found = allTuitions.find((t) => t.id === Number(e.target.value));
                  if (found) setSelectedTuition(found);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {allTuitions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.studentName || 'Student'}) - {t.expectedStart} to {t.expectedEnd}
                  </option>
                ))}
              </select>
            </div>

            {selectedTuition && (
              <div className="text-xs text-slate-400 space-y-1 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                <p>
                  <span className="text-slate-300 font-medium">Location:</span> {selectedTuition.address}
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Time:</span> {selectedTuition.expectedStart} - {selectedTuition.expectedEnd}
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Frequency:</span> Weekly recurring on scheduled days
                </p>
              </div>
            )}

            {showConfirm ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                <p>
                  <strong>Confirmation:</strong> Create weekly recurring Google Calendar events for "{selectedTuition?.name}" with 30m reminders?
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleConfirmSync}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {isSyncing ? 'Creating...' : 'Yes, Create Events'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Sync to Google Calendar</span>
              </button>
            )}
          </div>

          {/* Upcoming Calendar Events list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Upcoming Google Calendar Events
              </h3>
              <button
                onClick={loadCalendarEvents}
                disabled={isLoadingEvents}
                className="text-slate-400 hover:text-white text-xs flex items-center space-x-1"
                title="Refresh events"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingEvents ? (
              <p className="text-xs text-slate-500 py-3 text-center">Loading events from Google Calendar...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                No upcoming tuition events found on your Google Calendar.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-200">{evt.summary}</h4>
                      <p className="text-slate-400 mt-0.5">
                        {evt.start.dateTime
                          ? new Date(evt.start.dateTime).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : evt.start.date}
                      </p>
                      {evt.location && <p className="text-slate-500 text-[11px] mt-0.5">{evt.location}</p>}
                    </div>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
