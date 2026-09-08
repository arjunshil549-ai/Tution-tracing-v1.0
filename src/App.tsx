import React, { useState, useEffect } from 'react';
import { Tuition, Attendance, AppSettings, NotificationItem } from './types';
import {
  getStoredTuitions,
  saveTuitions,
  getStoredAttendance,
  saveAttendance,
  getStoredSettings,
  saveSettings,
  getStoredNotifications,
  saveNotifications,
  resetToSeedData,
} from './services/storage';
import { SplashScreen } from './components/SplashScreen';
import { Dashboard } from './components/Dashboard';
import { TuitionList } from './components/TuitionList';
import { MonthlyReport } from './components/MonthlyReport';
import { SettingsView } from './components/SettingsView';
import { TuitionModal } from './components/TuitionModal';
import { TuitionDetailsModal } from './components/TuitionDetailsModal';
import { AttendanceLiveView } from './components/AttendanceLiveView';
import { NotificationModal } from './components/NotificationModal';
import { BottomNavigation, NavTab } from './components/Navigation';
import { MapPin, Radio, Bell, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Loaded data
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals and Active views
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTuition, setEditingTuition] = useState<Tuition | null>(null);
  const [selectedTuitionForDetails, setSelectedTuitionForDetails] = useState<Tuition | null>(null);
  const [activeLiveTuition, setActiveLiveTuition] = useState<Tuition | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Active in-progress tracking session state
  const [activeSession, setActiveSession] = useState<{
    tuitionId: number;
    startTime: Date;
    simulatedDistance: number;
    isInside: boolean;
  } | null>({
    tuitionId: 1, // Default to Farmgate for live demonstration
    startTime: new Date(Date.now() - 4355 * 1000), // ~01:12:35 ago
    simulatedDistance: 42,
    isInside: true,
  });

  // Load from local storage
  useEffect(() => {
    setTuitions(getStoredTuitions());
    setAttendanceLogs(getStoredAttendance());
    setSettings(getStoredSettings());
    setNotifications(getStoredNotifications());
  }, []);

  // Save changes
  const updateTuitions = (newTuitions: Tuition[]) => {
    setTuitions(newTuitions);
    saveTuitions(newTuitions);
  };

  const updateAttendance = (newLogs: Attendance[]) => {
    setAttendanceLogs(newLogs);
    saveAttendance(newLogs);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateNotifications = (newNotifs: NotificationItem[]) => {
    setNotifications(newNotifs);
    saveNotifications(newNotifs);
  };

  // Add / Edit Tuition
  const handleSaveTuition = (
    data: Omit<Tuition, 'id' | 'createdAt'>,
    existingId?: number
  ) => {
    if (existingId) {
      const updated = tuitions.map((t) =>
        t.id === existingId ? { ...t, ...data } : t
      );
      updateTuitions(updated);
      if (selectedTuitionForDetails?.id === existingId) {
        setSelectedTuitionForDetails({ ...selectedTuitionForDetails, ...data });
      }
    } else {
      const newTuition: Tuition = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      updateTuitions([...tuitions, newTuition]);
    }
    setEditingTuition(null);
  };

  // Delete Tuition
  const handleDeleteTuition = (tuitionId: number) => {
    updateTuitions(tuitions.filter((t) => t.id !== tuitionId));
    if (activeSession?.tuitionId === tuitionId) {
      setActiveSession(null);
    }
  };

  // Toggle active
  const handleToggleActive = (tuitionId: number) => {
    const updated = tuitions.map((t) =>
      t.id === tuitionId ? { ...t, active: !t.active } : t
    );
    updateTuitions(updated);
    if (selectedTuitionForDetails?.id === tuitionId) {
      setSelectedTuitionForDetails({
        ...selectedTuitionForDetails,
        active: !selectedTuitionForDetails.active,
      });
    }
  };

  // Live session handlers
  const handleStartSession = (tuitionId: number, initialDistance = 42) => {
    const tuition = tuitions.find((t) => t.id === tuitionId);
    if (!tuition) return;
    setActiveSession({
      tuitionId,
      startTime: new Date(),
      simulatedDistance: initialDistance,
      isInside: initialDistance <= tuition.radius + settings.gpsTolerance,
    });
    setActiveLiveTuition(tuition);
  };

  const handleEndSession = (
    tuitionId: number,
    durationSeconds: number,
    status: 'completed' | 'ignored'
  ) => {
    const tuition = tuitions.find((t) => t.id === tuitionId);
    if (status === 'completed' && tuition) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');

      const newRecord: Attendance = {
        id: Date.now(),
        tuitionId,
        date: dateStr,
        arrivalTime: tuition.expectedStart || '16:00',
        departureTime: `${hours}:${mins}`,
        duration: durationSeconds,
        status: 'completed',
        createdAt: now.toISOString(),
      };

      const newAttendanceList = [newRecord, ...attendanceLogs];
      updateAttendance(newAttendanceList);

      // Trigger celebration
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

      // Add notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Attendance Auto-Logged ✅',
        message: `${tuition.name} attendance recorded (${Math.floor(durationSeconds / 60)}m duration) after leaving geofence.`,
        timestamp: new Date().toISOString(),
        type: 'geofence',
        read: false,
      };
      updateNotifications([newNotif, ...notifications]);
    }

    setActiveSession(null);
    setActiveLiveTuition(null);
  };

  // Reset to seed demo data
  const handleResetDemoData = () => {
    resetToSeedData();
    setTuitions(getStoredTuitions());
    setAttendanceLogs(getStoredAttendance());
    setSettings(getStoredSettings());
    setNotifications(getStoredNotifications());
  };

  // Simulate Month-End notification
  const handleTriggerMonthEndNotification = () => {
    const newNotif: NotificationItem = {
      id: `month-end-${Date.now()}`,
      title: 'Your September report is ready! 🔔',
      message: 'You attended 18 days this month. Total time: 34h 20m. Earned: ৳13,500. Tap to review your full monthly summary.',
      timestamp: new Date().toISOString(),
      type: 'month_end',
      read: false,
    };
    updateNotifications([newNotif, ...notifications]);
    setIsNotificationModalOpen(true);
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    updateNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeTuitionForBanner = activeSession
    ? tuitions.find((t) => t.id === activeSession.tuitionId)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Splash screen (first launch) */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => setCurrentTab('home')}
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Tuition<span className="text-emerald-400">Track</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Automated Geofence MVP
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Tracking status pill */}
            <div
              onClick={() => {
                const target = tuitions[0];
                if (target) setActiveLiveTuition(target);
              }}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-semibold cursor-pointer hover:border-emerald-400 transition"
              title="Open Geofence Radar"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-300">Tracking</span>
              <span className="text-emerald-400">Active</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'home' && (
          <Dashboard
            tuitions={tuitions}
            attendanceLogs={attendanceLogs}
            settings={settings}
            onNavigate={setCurrentTab}
            onLaunchLiveAttendance={(tuition) => setActiveLiveTuition(tuition)}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            unreadNotificationsCount={unreadCount}
          />
        )}

        {currentTab === 'tuitions' && (
          <TuitionList
            tuitions={tuitions}
            attendanceLogs={attendanceLogs}
            onOpenAddModal={() => {
              setEditingTuition(null);
              setIsAddModalOpen(true);
            }}
            onSelectTuition={(tuition) => setSelectedTuitionForDetails(tuition)}
            onLaunchLiveAttendance={(tuition) => setActiveLiveTuition(tuition)}
          />
        )}

        {currentTab === 'reports' && (
          <MonthlyReport
            tuitions={tuitions}
            attendanceLogs={attendanceLogs}
            settings={settings}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={updateSettings}
            onResetDemoData={handleResetDemoData}
            onTriggerMonthEndNotification={handleTriggerMonthEndNotification}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isTrackingActive={settings.trackingEnabled}
        activeSessionTuitionName={activeTuitionForBanner?.name}
        onOpenLiveSession={() => {
          if (activeTuitionForBanner) {
            setActiveLiveTuition(activeTuitionForBanner);
          }
        }}
      />

      {/* Live Attendance View (Screen 12 overlay) */}
      {activeLiveTuition && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in zoom-in-95">
          <AttendanceLiveView
            tuition={activeLiveTuition}
            settings={settings}
            activeSession={activeSession}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onUpdateDistance={(newDist) => {
              if (activeSession) {
                setActiveSession({
                  ...activeSession,
                  simulatedDistance: newDist,
                  isInside: newDist <= activeLiveTuition.radius + settings.gpsTolerance,
                });
              }
            }}
            onClose={() => setActiveLiveTuition(null)}
          />
        </div>
      )}

      {/* Add / Edit Tuition Modal (Screen 9) */}
      <TuitionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTuition(null);
        }}
        onSave={handleSaveTuition}
        editingTuition={editingTuition}
      />

      {/* Tuition Details Modal (Screen 11) */}
      {selectedTuitionForDetails && (
        <TuitionDetailsModal
          tuition={selectedTuitionForDetails}
          attendanceLogs={attendanceLogs}
          onClose={() => setSelectedTuitionForDetails(null)}
          onEdit={(t) => {
            setSelectedTuitionForDetails(null);
            setEditingTuition(t);
            setIsAddModalOpen(true);
          }}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteTuition}
          onLaunchLiveAttendance={(t) => {
            setSelectedTuitionForDetails(null);
            setActiveLiveTuition(t);
          }}
        />
      )}

      {/* Notification Center Modal (Screen 15) */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onOpenReport={() => setCurrentTab('reports')}
      />
    </div>
  );
}
