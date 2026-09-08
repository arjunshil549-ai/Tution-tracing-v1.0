import React, { useState, useEffect } from 'react';
import { Tuition, Attendance, AppSettings, NotificationItem, UserProfile } from './types';
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
  getStoredUserProfile,
  saveUserProfile,
  logoutUserProfile,
} from './services/storage';
import {
  initAuth,
  googleSignIn,
  logout as googleLogout,
  getIdToken,
  getAccessToken,
} from './lib/firebase';
import {
  syncUserWithCloudSql,
  fetchTuitionsFromCloudSql,
  saveTuitionToCloudSql,
  deleteTuitionFromCloudSql,
  fetchAttendanceFromCloudSql,
  recordAttendanceInCloudSql,
} from './services/cloudSqlSync';
import { SplashScreen } from './components/SplashScreen';
import { Dashboard } from './components/Dashboard';
import { TuitionList } from './components/TuitionList';
import { MonthlyReport } from './components/MonthlyReport';
import { SettingsView } from './components/SettingsView';
import { TuitionModal } from './components/TuitionModal';
import { TuitionDetailsModal } from './components/TuitionDetailsModal';
import { AttendanceLiveView } from './components/AttendanceLiveView';
import { NotificationModal } from './components/NotificationModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { GmailSendModal } from './components/GmailSendModal';
import { BottomNavigation, NavTab } from './components/Navigation';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { checkAdminStatus, isLocalSuperAdmin } from './services/adminService';
import {
  calculateDistance,
  formatDistance,
  formatDuration,
  formatTimeDisplay,
  formatClockTime,
  watchUserLocation,
  UserLocation,
} from './services/geofence';
import {
  MapPin,
  Radio,
  Bell,
  Sparkles,
  Database,
  User as UserIcon,
  LogIn,
  LogOut,
  Crown,
  ShieldCheck,
  Navigation,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Loaded data
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getStoredUserProfile());

  // Google Firebase & Workspace Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null);
  const [isCloudSqlSynced, setIsCloudSqlSynced] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string>('');
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);

  // Admin & Security State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<'admin_portal' | 'user_dashboard'>('admin_portal');

  // Modals and Active views
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTuition, setEditingTuition] = useState<Tuition | null>(null);
  const [selectedTuitionForDetails, setSelectedTuitionForDetails] = useState<Tuition | null>(null);
  const [activeLiveTuition, setActiveLiveTuition] = useState<Tuition | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarTargetTuition, setCalendarTargetTuition] = useState<Tuition | null>(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  // Active in-progress tracking session state: strictly null initially!
  // Will ONLY activate when the user physically arrives within the tuition geofence.
  const [activeSession, setActiveSession] = useState<{
    tuitionId: number;
    startTime: Date;
    simulatedDistance: number;
    isInside: boolean;
  } | null>(null);

  const [activeSessionElapsedSeconds, setActiveSessionElapsedSeconds] = useState(0);

  // Live stopwatch timer for activeSession when inside geofence
  useEffect(() => {
    let timer: any = null;
    if (activeSession && activeSession.isInside) {
      timer = setInterval(() => {
        const secs = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
        );
        setActiveSessionElapsedSeconds(secs);
      }, 1000);
    } else {
      setActiveSessionElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  // Real-time GPS Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Continuous GPS Location Tracker
  useEffect(() => {
    if (!settings.trackingEnabled) {
      setIsGpsActive(false);
      return;
    }

    const unwatch = watchUserLocation(
      (loc) => {
        setUserLocation(loc);
        setIsGpsActive(true);
        setGpsError(null);
      },
      (err) => {
        setIsGpsActive(false);
        setGpsError(err.message);
      }
    );

    return () => unwatch();
  }, [settings.trackingEnabled]);

  // 1. Initialize Firebase Auth and Cloud SQL Synchronization
  useEffect(() => {
    // Local storage initial load
    const localTuitions = getStoredTuitions();
    const localAttendance = getStoredAttendance();
    setTuitions(localTuitions);
    setAttendanceLogs(localAttendance);
    setSettings(getStoredSettings());
    setNotifications(getStoredNotifications());
    setUserProfile(getStoredUserProfile());

    // Setup Firebase Auth listener
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        if (token) setGoogleAccessToken(token);

        // Sync with Cloud SQL PostgreSQL backend
        try {
          const idToken = await user.getIdToken();
          setFirebaseIdToken(idToken);
          await syncUserWithCloudSql(idToken, {
            email: user.email || undefined,
            name: user.displayName || undefined,
          });
          setIsCloudSqlSynced(true);

          // Fetch cloud records
          const cloudTuitions = await fetchTuitionsFromCloudSql(idToken);
          if (cloudTuitions && cloudTuitions.length > 0) {
            setTuitions(cloudTuitions);
            saveTuitions(cloudTuitions);
          } else if (localTuitions.length > 0) {
            // Push existing local tuitions to Cloud SQL
            for (const t of localTuitions) {
              await saveTuitionToCloudSql(idToken, t);
            }
          }

          const cloudAttendance = await fetchAttendanceFromCloudSql(idToken);
          if (cloudAttendance && cloudAttendance.length > 0) {
            setAttendanceLogs(cloudAttendance);
            saveAttendance(cloudAttendance);
          }
        } catch (err) {
          console.warn('Initial Cloud SQL sync notice:', err);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setIsCloudSqlSynced(false);
      }
    );

    return () => unsubscribe();
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

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleAuthLoading(true);
    setGoogleAuthError('');
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        if (res.accessToken) setGoogleAccessToken(res.accessToken);

        // Create matching local UserProfile
        const profile: UserProfile = {
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'Tutor',
          email: res.user.email || 'user@example.com',
          avatarColor: '#4285F4',
          createdAt: new Date().toISOString(),
        };
        setUserProfile(profile);
        saveUserProfile(profile);

        // Sync with Cloud SQL
        try {
          const idToken = await res.user.getIdToken();
          setFirebaseIdToken(idToken);
          await syncUserWithCloudSql(idToken, {
            name: profile.name,
            email: profile.email,
          });
          setIsCloudSqlSynced(true);
        } catch (sqlErr) {
          console.warn('Cloud SQL sync skipped during sign in:', sqlErr);
        }

        setIsAuthModalOpen(false);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

        const notif: NotificationItem = {
          id: `notif_${Date.now()}`,
          title: 'Google Sign-In Successful',
          message: `Logged in as ${profile.name} (${profile.email}). Google Workspace ready!`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'system',
        };
        updateNotifications([notif, ...notifications]);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('popup-blocked') || errMsg.includes('popup') || errMsg.includes('cancelled')) {
        setGoogleAuthError('Google sign-in popup was blocked by the browser. Please allow popups or enter your email and name below.');
      } else {
        setGoogleAuthError(errMsg || 'Could not connect with Google account. Please enter your email and name below.');
      }
    } finally {
      setIsGoogleAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleLogout();
    } catch (err) {
      console.warn('Google logout warning:', err);
    }
    // Always clear all auth states & storage completely
    setGoogleUser(null);
    setGoogleAccessToken(null);
    setFirebaseIdToken(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminViewMode('user_dashboard');
    setIsCloudSqlSynced(false);
    logoutUserProfile();
    setUserProfile(null);
    setActiveSession(null);
    setActiveLiveTuition(null);
    localStorage.removeItem('tuitiontrack_user_profile');
    localStorage.removeItem('tuitiontrack_active_session');

    // Notify user of clean signout
    const notif: NotificationItem = {
      id: `logout_${Date.now()}`,
      title: 'Logged Out Successfully',
      message: 'You have been signed out from your account.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'system',
    };
    updateNotifications([notif, ...notifications]);
  };

  // Evaluate Admin privileges whenever user profile or token changes
  // STRICT: Only arjunshil549@gmail.com gets admin privileges and views Super Admin Portal!
  useEffect(() => {
    const currentEmail = googleUser?.email || userProfile?.email || null;
    const isSuper = isLocalSuperAdmin(currentEmail);
    if (!isSuper) {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setAdminViewMode('user_dashboard');
      return;
    }

    setIsSuperAdmin(true);
    setIsAdmin(true);
    setAdminViewMode('admin_portal');

    checkAdminStatus(firebaseIdToken, currentEmail)
      .then((res) => {
        setIsAdmin(res.isSuperAdmin);
        setIsSuperAdmin(res.isSuperAdmin);
        if (res.isSuperAdmin) {
          setAdminViewMode('admin_portal');
        } else {
          setAdminViewMode('user_dashboard');
        }
      })
      .catch(() => {
        setIsSuperAdmin(true);
        setIsAdmin(true);
      });
  }, [googleUser?.email, userProfile?.email, firebaseIdToken]);

  // Add / Edit Tuition
  const handleSaveTuition = async (
    data: Omit<Tuition, 'id' | 'createdAt'>,
    existingId?: number
  ) => {
    setIsAddModalOpen(false); // Ensure modal is dismissed immediately

    if (existingId) {
      const updated = tuitions.map((t) =>
        t.id === existingId ? { ...t, ...data } : t
      );
      updateTuitions(updated);
      if (selectedTuitionForDetails?.id === existingId) {
        setSelectedTuitionForDetails({ ...selectedTuitionForDetails, ...data });
      }

      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        title: 'Tuition Updated',
        message: `"${data.name}" has been updated successfully.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'system',
      };
      updateNotifications([notif, ...notifications]);

      // Sync with Cloud SQL if logged in
      if (googleUser) {
        try {
          const idToken = await getIdToken();
          if (idToken) {
            saveTuitionToCloudSql(idToken, data, existingId);
          }
        } catch (e) {
          console.warn('Cloud SQL save skipped:', e);
        }
      }
    } else {
      const newTuition: Tuition = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      updateTuitions([...tuitions, newTuition]);

      // Confetti celebration
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        title: 'New Tuition Added 🎉',
        message: `"${data.name}" added successfully with ${data.radius}m geofence radius.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'geofence',
      };
      updateNotifications([notif, ...notifications]);

      // Sync with Cloud SQL if logged in
      if (googleUser) {
        try {
          const idToken = await getIdToken();
          if (idToken) {
            saveTuitionToCloudSql(idToken, data);
          }
        } catch (e) {
          console.warn('Cloud SQL save skipped:', e);
        }
      }
    }
    setEditingTuition(null);
  };

  // Delete Tuition
  const handleDeleteTuition = async (tuitionId: number) => {
    updateTuitions(tuitions.filter((t) => t.id !== tuitionId));
    if (activeSession?.tuitionId === tuitionId) {
      setActiveSession(null);
    }

    if (googleUser) {
      const idToken = await getIdToken();
      if (idToken) {
        deleteTuitionFromCloudSql(idToken, tuitionId);
      }
    }
  };

  // Toggle active
  const handleToggleActive = (tuitionId: number) => {
    const target = tuitions.find((t) => t.id === tuitionId);
    if (!target) return;
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

    if (googleUser) {
      getIdToken().then((idToken) => {
        if (idToken) {
          saveTuitionToCloudSql(idToken, { ...target, active: !target.active }, tuitionId);
        }
      });
    }
  };

  // Geofence Arrival and Departure tracking engine:
  // ONLY tracks when the user physically arrives at the tuition location!
  useEffect(() => {
    if (!settings.trackingEnabled || !userLocation || tuitions.length === 0) {
      return;
    }

    const activeTuitionsList = tuitions.filter((t) => t.active !== false);
    if (activeTuitionsList.length === 0) return;

    let insideTuition: Tuition | null = null;
    let insideDistance = 999999;

    for (const tuition of activeTuitionsList) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        tuition.lat,
        tuition.lng
      );
      const isInside = distance <= tuition.radius + (settings.gpsTolerance || 0);

      if (isInside) {
        insideTuition = tuition;
        insideDistance = distance;
        break;
      }
    }

    if (insideTuition) {
      // User has arrived inside tuition geofence!
      if (!activeSession) {
        // Start tracking ONLY upon actual arrival!
        const now = new Date();
        const arrivalClock = formatClockTime(now);

        setActiveSession({
          tuitionId: insideTuition.id,
          startTime: now,
          simulatedDistance: Math.round(insideDistance),
          isInside: true,
        });

        // Prompt requirement: "User has arrived at Farmgate Tuition", auto-time calculation
        const notif: NotificationItem = {
          id: `arrival_${Date.now()}`,
          title: `User has arrived at ${insideTuition.name}`,
          message: `ঢোকার সময়: ${formatTimeDisplay(arrivalClock)} | লোকেশন ${insideTuition.radius}m ব্যাসার্ধে প্রবেশ করেছে। সময় অটো হিসাব হচ্ছে...`,
          timestamp: now.toISOString(),
          read: false,
          type: 'geofence',
        };
        updateNotifications([notif, ...notifications]);
      } else if (activeSession.tuitionId === insideTuition.id) {
        // Update distance while inside
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                simulatedDistance: Math.round(insideDistance),
                isInside: true,
              }
            : null
        );
      }
    } else {
      // User is outside all tuition locations!
      if (activeSession && activeSession.isInside) {
        const tuition = tuitions.find((t) => t.id === activeSession.tuitionId);
        if (tuition) {
          const endTime = new Date();
          const durationSeconds = Math.max(
            1,
            Math.floor((endTime.getTime() - new Date(activeSession.startTime).getTime()) / 1000)
          );
          const minStaySeconds = (tuition.minimumStayMinutes || settings.minimumStay || 30) * 60;
          const arrivalClock = formatClockTime(new Date(activeSession.startTime));
          const departureClock = formatClockTime(endTime);

          if (durationSeconds >= minStaySeconds) {
            handleEndSession({
              tuitionId: tuition.id,
              durationSeconds,
              status: 'completed',
              arrivalTime: arrivalClock,
              departureTime: departureClock,
              notes: `Auto-logged on departure: ঢোকার সময় ${formatTimeDisplay(arrivalClock)}, বের হওয়ার সময় ${formatTimeDisplay(departureClock)} (মোট ${formatDuration(durationSeconds)})`,
            });
          } else {
            // Did not meet minimum stay - DO NOT record fake attendance!
            setActiveSession(null);
            const notif: NotificationItem = {
              id: `exit_short_${Date.now()}`,
              title: `মিনিমাম স্টে লিমিট পূরণ হয়নি: ${tuition.name}`,
              message: `ঢোকার সময়: ${formatTimeDisplay(arrivalClock)} | বের হওয়ার সময়: ${formatTimeDisplay(departureClock)} | মোট: ${formatDuration(durationSeconds)}। ন্যূনতম ${tuition.minimumStayMinutes || 30} মিনিট থাকা প্রয়োজন ছিল। হাজিরা গণ্য করা হয়নি।`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'geofence',
            };
            updateNotifications([notif, ...notifications]);
          }
        } else {
          setActiveSession(null);
        }
      }
    }
  }, [userLocation, settings.trackingEnabled, tuitions]);

  // Live session handlers
  const handleStartSession = (tuitionId: number, initialDistance?: number) => {
    const tuition = tuitions.find((t) => t.id === tuitionId);
    if (!tuition) return;

    const realDist = userLocation
      ? calculateDistance(userLocation.latitude, userLocation.longitude, tuition.lat, tuition.lng)
      : initialDistance !== undefined
      ? initialDistance
      : 850;

    const isInside = realDist <= tuition.radius + settings.gpsTolerance;
    const now = new Date();
    const arrivalClock = formatClockTime(now);

    setActiveSession({
      tuitionId,
      startTime: now,
      simulatedDistance: Math.round(realDist),
      isInside,
    });

    if (isInside) {
      const notif: NotificationItem = {
        id: `arrival_manual_${Date.now()}`,
        title: `User has arrived at ${tuition.name}`,
        message: `ঢোকার সময়: ${formatTimeDisplay(arrivalClock)} | লোকেশন ভেরিফাইড। সময় স্বয়ংক্রিয়ভাবে হিসাব হচ্ছে...`,
        timestamp: now.toISOString(),
        read: false,
        type: 'geofence',
      };
      updateNotifications([notif, ...notifications]);
    }
  };

  const handleEndSession = async (
    notesOrParams?: string | {
      tuitionId?: number;
      durationSeconds?: number;
      status?: 'completed' | 'ignored';
      notes?: string;
      arrivalTime?: string;
      departureTime?: string;
    }
  ) => {
    if (!activeSession && typeof notesOrParams !== 'object') return;

    const targetTuitionId = typeof notesOrParams === 'object' && notesOrParams.tuitionId
      ? notesOrParams.tuitionId
      : activeSession?.tuitionId;

    const tuition = tuitions.find((t) => t.id === targetTuitionId);
    if (!tuition) return;

    const endTime = new Date();
    const defaultDuration = activeSession
      ? Math.max(1, Math.floor((endTime.getTime() - new Date(activeSession.startTime).getTime()) / 1000))
      : 7020;

    const durationSeconds = typeof notesOrParams === 'object' && notesOrParams.durationSeconds !== undefined
      ? notesOrParams.durationSeconds
      : defaultDuration;

    const statusParam = typeof notesOrParams === 'object' ? notesOrParams.status : undefined;
    const notes = typeof notesOrParams === 'string' ? notesOrParams : notesOrParams?.notes;

    const arrivalTime = typeof notesOrParams === 'object' && notesOrParams.arrivalTime
      ? notesOrParams.arrivalTime
      : activeSession
      ? formatClockTime(new Date(activeSession.startTime))
      : '16:05';

    const departureTime = typeof notesOrParams === 'object' && notesOrParams.departureTime
      ? notesOrParams.departureTime
      : formatClockTime(endTime);

    const minStayMinutes = tuition.minimumStayMinutes || settings.minimumStay || 30;
    const minStaySeconds = minStayMinutes * 60;

    // Strict minimum stay limit validation
    if (statusParam === 'ignored' || durationSeconds < minStaySeconds) {
      setActiveSession(null);
      setActiveLiveTuition(null);

      const notif: NotificationItem = {
        id: `min_stay_failed_${Date.now()}`,
        title: `মিনিমাম স্টে লিমিট পূরণ হয়নি: ${tuition.name}`,
        message: `ঢোকার সময়: ${formatTimeDisplay(arrivalTime)} | বের হওয়ার সময়: ${formatTimeDisplay(departureTime)} | মোট: ${formatDuration(durationSeconds)}। ন্যূনতম ${minStayMinutes} মিনিট থাকতে হবে। Attendance বাদ দেওয়া হয়েছে।`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'geofence',
      };
      updateNotifications([notif, ...notifications]);
      return;
    }

    const newLog: Attendance = {
      id: Date.now(),
      tuitionId: tuition.id,
      date: new Date().toISOString().split('T')[0],
      arrivalTime,
      departureTime,
      duration: durationSeconds,
      status: 'completed',
      notes: notes || `Auto-logged: ঢোকার সময় ${formatTimeDisplay(arrivalTime)}, বের হওয়ার সময় ${formatTimeDisplay(departureTime)} (মোট ${formatDuration(durationSeconds)})`,
      createdAt: new Date().toISOString(),
    };

    updateAttendance([newLog, ...attendanceLogs]);
    setActiveSession(null);
    setActiveLiveTuition(null);

    // Save to Cloud SQL
    if (googleUser) {
      const idToken = await getIdToken();
      if (idToken) {
        recordAttendanceInCloudSql(idToken, {
          tuitionId: tuition.id,
          date: newLog.date,
          arrivalTime: newLog.arrivalTime,
          departureTime: newLog.departureTime,
          duration: newLog.duration,
          status: newLog.status,
          notes: newLog.notes,
        });
      }
    }

    // Success notification with Bengali/English breakdown
    const notif: NotificationItem = {
      id: `attendance_success_${Date.now()}`,
      title: `User completed session at ${tuition.name} ✅`,
      message: `ঢোকার সময়: ${formatTimeDisplay(newLog.arrivalTime)} | বের হওয়ার সময়: ${formatTimeDisplay(newLog.departureTime)} | মোট: ${formatDuration(newLog.duration)} (মিনিমাম স্টে শর্ত সফল)`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'geofence',
    };
    updateNotifications([notif, ...notifications]);

    // Trigger celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Reset to seed data
  const handleResetDemoData = () => {
    resetToSeedData();
    setTuitions(getStoredTuitions());
    setAttendanceLogs(getStoredAttendance());
    setSettings(getStoredSettings());
    setNotifications(getStoredNotifications());
  };

  // Month-end manual notification trigger
  const handleTriggerMonthEndNotification = () => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Your Monthly Report is Ready! 📊',
      message: `September report generated: ${attendanceLogs.length} sessions logged across active tuitions.`,
      timestamp: new Date().toISOString(),
      type: 'month_end',
      read: false,
    };
    updateNotifications([newNotif, ...notifications]);
    setIsNotificationModalOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeTuitionForBanner =
    activeSession && activeSession.isInside
      ? tuitions.find((t) => t.id === activeSession.tuitionId)
      : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {showSplash && (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Tuition<span className="text-emerald-400">Track</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Automated Geofence & Cloud Sync
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Real GPS status pill */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition ${
                isGpsActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title={isGpsActive ? 'Live GPS Geofence is actively watching your coordinates' : 'GPS standby'}
            >
              <span className={`w-2 h-2 rounded-full ${isGpsActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isGpsActive ? 'GPS Ready' : 'GPS Standby'}</span>
            </div>

            {/* Super Admin Master Portal Switch (STRICT: ONLY arjunshil549@gmail.com) */}
            {isSuperAdmin ? (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setAdminViewMode(adminViewMode === 'admin_portal' ? 'user_dashboard' : 'admin_portal')
                  }
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-black transition shadow-lg shadow-amber-950/40 bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30"
                  title="সুপার অ্যাডমিন পোর্টাল ও সাধারণ ইউজার ভিউয়ের মধ্যে সুইচ করুন"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{adminViewMode === 'admin_portal' ? '👑 SUPER ADMIN' : '👤 USER VIEW'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
              </div>
            ) : (
              <div
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400"
                title="Private & Encrypted Tutor Records"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secured</span>
              </div>
            )}

            {/* Google / User Profile button */}
            {googleUser ? (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                  title="View Profile & Settings"
                >
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'User'}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                      {(googleUser.displayName || googleUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-white font-medium hidden sm:inline max-w-[100px] truncate">
                    {googleUser.displayName || googleUser.email?.split('@')[0]}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignOut}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-800 text-slate-400 transition"
                  title="Log Out Immediately"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : userProfile ? (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: userProfile.avatarColor || '#10b981' }}
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-white font-medium hidden sm:inline max-w-[100px] truncate">
                    {userProfile.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignOut}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-800 text-slate-400 transition"
                  title="Log Out Immediately"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

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

            {/* In-App PWA Install Button */}
            <PWAInstallButton variant="header" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6">
        {/* Active Geofence Arrival Banner */}
        {activeSession && activeSession.isInside && (() => {
          const currentTuition = tuitions.find((t) => t.id === activeSession.tuitionId);
          if (!currentTuition) return null;
          const arrivalClock = formatClockTime(new Date(activeSession.startTime));
          const currentClock = formatClockTime(new Date());
          const minStay = currentTuition.minimumStayMinutes || settings.minimumStay || 30;
          const hasMet = activeSessionElapsedSeconds >= minStay * 60;

          return (
            <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="relative p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        🟢 ARRIVED IN RADIUS
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {activeSession.simulatedDistance}m / {currentTuition.radius}m
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white">
                      User has arrived at {currentTuition.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 pt-0.5">
                      <span>
                        <strong className="text-emerald-400">ঢোকার সময়:</strong>{' '}
                        <span className="font-mono font-bold text-white">{formatTimeDisplay(arrivalClock)}</span>
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-300">বর্তমান/বের হওয়ার সময়:</strong>{' '}
                        <span className="font-mono text-slate-200">{formatTimeDisplay(currentClock)}</span>
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-300">মোট সময়:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-400">
                          {formatDuration(activeSessionElapsedSeconds)}
                        </span>
                      </span>
                    </div>

                    <div className="pt-1 flex items-center space-x-2 text-[11px]">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          hasMet
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        মিনিমাম স্টে: {minStay}m {hasMet ? '✓ পূরণ হয়েছে (Qualified)' : `(বাকি ${Math.max(1, minStay - Math.floor(activeSessionElapsedSeconds / 60))}m)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setActiveLiveTuition(currentTuition)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEndSession()}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950 transition"
                  >
                    Depart & Log
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {isSuperAdmin && adminViewMode === 'admin_portal' ? (
          <SuperAdminPortal
            currentUserEmail={googleUser?.email || userProfile?.email || 'arjunshil549@gmail.com'}
            idToken={firebaseIdToken}
            tuitions={tuitions}
            attendanceLogs={attendanceLogs}
            settings={settings}
            onUpdateTuitions={updateTuitions}
            onUpdateSettings={updateSettings}
            onOpenAddTuition={() => {
              setEditingTuition(null);
              setIsAddModalOpen(true);
            }}
            onEditTuition={(t) => {
              setEditingTuition(t);
              setIsAddModalOpen(true);
            }}
            onDeleteTuition={handleDeleteTuition}
            activeSession={activeSession}
            onSimulateArrival={(t) => {
              handleStartSession(t);
              const notif: NotificationItem = {
                id: `arr_${Date.now()}`,
                title: 'User has arrived at ' + t.name,
                message: `স্বয়ংক্রিয় উপস্থিতি ট্র্যাকিং শুরু হয়েছে।`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'geofence',
              };
              updateNotifications([notif, ...notifications]);
            }}
            onSimulateExit={() => handleEndSession()}
          />
        ) : (
          <>
            {/* If Super Admin is viewing normal user mode, show return banner */}
            {isSuperAdmin && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>আপনি সাধারণ ইউজার ইন্টারফেস প্রিভিউ করছেন (অন্যান্য ইউজাররা শুধু এটি দেখে)।</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('admin_portal')}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shrink-0 ml-2 shadow-md shadow-amber-950/40"
                >
                  সুপার অ্যাডমিন পোর্টাল
                </button>
              </div>
            )}

            {currentTab === 'home' && (
              <Dashboard
                tuitions={tuitions}
                attendanceLogs={attendanceLogs}
                settings={settings}
                userProfile={userProfile}
                onNavigate={setCurrentTab}
                onLaunchLiveAttendance={(tuition) => setActiveLiveTuition(tuition)}
                onOpenNotifications={() => setIsNotificationModalOpen(true)}
                unreadNotificationsCount={unreadCount}
                onOpenAddTuition={() => {
                  setEditingTuition(null);
                  setIsAddModalOpen(true);
                }}
                onOpenRemoveTuition={() => setCurrentTab('tuitions')}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
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
                onOpenRemoveModal={() => {
                  // Quick helper or focus on delete
                }}
                onSelectTuition={(tuition) => setSelectedTuitionForDetails(tuition)}
                onDeleteTuition={handleDeleteTuition}
                onLaunchLiveAttendance={(tuition) => setActiveLiveTuition(tuition)}
              />
            )}

            {currentTab === 'reports' && (
              <MonthlyReport
                tuitions={tuitions}
                attendanceLogs={attendanceLogs}
                settings={settings}
                googleAccessToken={googleAccessToken}
                onPromptGoogleAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                userProfile={userProfile}
                googleUser={googleUser}
                googleAccessToken={googleAccessToken}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                onOpenAdminPanel={() => {
                  if (isSuperAdmin) setAdminViewMode('admin_portal');
                }}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                onOpenSheetsExport={() => setCurrentTab('reports')}
                onOpenGmailModal={() => {
                  if (!googleAccessToken) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsGmailModalOpen(true);
                  }
                }}
                onOpenCalendarModal={() => {
                  if (!googleAccessToken) {
                    setIsAuthModalOpen(true);
                  } else {
                    setCalendarTargetTuition(tuitions[0] || null);
                    setIsCalendarModalOpen(true);
                  }
                }}
                onSaveSettings={updateSettings}
                onResetDemoData={handleResetDemoData}
                onClearAllData={() => {
                  updateTuitions([]);
                  updateAttendance([]);
                  updateNotifications([]);
                }}
                onTriggerMonthEndNotification={handleTriggerMonthEndNotification}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onLogout={handleGoogleSignOut}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation - ONLY shown in regular user dashboard view */}
      {(!isSuperAdmin || adminViewMode === 'user_dashboard') && (
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
      )}

      {/* Live Attendance View */}
      {activeLiveTuition && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in zoom-in-95">
          <AttendanceLiveView
            tuition={activeLiveTuition}
            settings={settings}
            activeSession={activeSession}
            userLocation={userLocation}
            isGpsActive={isGpsActive}
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

      {/* Add / Edit Tuition Modal */}
      <TuitionModal
        key={editingTuition?.id ? `edit-${editingTuition.id}` : `new-${isAddModalOpen}`}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTuition(null);
        }}
        onSave={handleSaveTuition}
        editingTuition={editingTuition}
      />

      {/* Tuition Details Modal */}
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
          onOpenCalendarSync={(t) => {
            if (!googleAccessToken) {
              setIsAuthModalOpen(true);
            } else {
              setCalendarTargetTuition(t);
              setIsCalendarModalOpen(true);
            }
          }}
        />
      )}

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          const updated = notifications.map((n) => ({ ...n, read: true }));
          updateNotifications(updated);
        }}
        onClearAll={() => updateNotifications([])}
        onOpenReport={() => setCurrentTab('reports')}
      />

      {/* Auth Modal with Google Sign-in */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setGoogleAuthError('');
        }}
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          saveUserProfile(profile);
          setIsAuthModalOpen(false);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          const notif: NotificationItem = {
            id: `notif_${Date.now()}`,
            title: 'Welcome back!',
            message: `Logged in as ${profile.name}. Your profile is saved on this device.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'system',
          };
          updateNotifications([notif, ...notifications]);
        }}
        onGoogleSignIn={handleGoogleSignIn}
        googleError={googleAuthError}
        isGoogleLoading={isGoogleAuthLoading}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        tuitions={tuitions}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          saveUserProfile(updated);
        }}
        onLogout={handleGoogleSignOut}
        onOpenSwitchAccount={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Google Calendar Sync Modal */}
      {googleAccessToken && (
        <CalendarSyncModal
          isOpen={isCalendarModalOpen}
          onClose={() => {
            setIsCalendarModalOpen(false);
            setCalendarTargetTuition(null);
          }}
          accessToken={googleAccessToken}
          tuition={calendarTargetTuition}
          allTuitions={tuitions}
        />
      )}

      {/* Gmail Send Modal (direct from settings or quick actions) */}
      {googleAccessToken && (
        <GmailSendModal
          isOpen={isGmailModalOpen}
          onClose={() => setIsGmailModalOpen(false)}
          accessToken={googleAccessToken}
          defaultSubject="TuitionTrack Monthly Statement"
          defaultBody={`TuitionTrack Statement\n\nTotal Sessions: ${attendanceLogs.length}\nActive Tuitions: ${tuitions.length}\n\nGenerated automatically via TuitionTrack with Google Workspace.`}
        />
      )}

      {/* Admin Security & Infrastructure Console Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUserEmail={googleUser?.email || userProfile?.email || null}
        idToken={firebaseIdToken}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Connectivity & Offline State Indicator */}
      <OfflineIndicator />
    </div>
  );
}
