import { Tuition, Attendance, AppSettings, NotificationItem, UserProfile } from '../types';

const STORAGE_KEYS = {
  TUITIONS: 'tuitiontrack_tuitions',
  ATTENDANCE: 'tuitiontrack_attendance',
  SETTINGS: 'tuitiontrack_settings',
  NOTIFICATIONS: 'tuitiontrack_notifications',
  HAS_SEEDED: 'tuitiontrack_seeded_v1',
  USER_PROFILE: 'tuitiontrack_user_profile',
  ALL_USERS: 'tuitiontrack_all_users',
  CLEANED_PRESETS: 'tuitiontrack_preset_cleaned_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  trackingEnabled: true,
  monthlyNotification: true,
  minimumStay: 30, // 30 minutes
  defaultRadius: 100, // 100 meters
  gpsTolerance: 30, // 30 meters
  currencySymbol: '৳',
};

// Seed tuitions exactly reflecting the specification
export const SEED_TUITIONS: Tuition[] = [
  {
    id: 1,
    name: 'Farmgate Tuition',
    studentName: 'Tanvir Ahmed (Class 10 Physics)',
    address: 'Farmgate, Dhaka',
    latitude: 23.7563,
    longitude: 90.3891,
    radius: 100,
    expectedStart: '16:00',
    expectedEnd: '18:00',
    fee: 8000,
    expectedClassesPerMonth: 10,
    scheduledDays: [1, 3, 5], // Mon, Wed, Fri
    minimumStayMinutes: 30,
    active: true,
    createdAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Malibagh Tuition',
    studentName: 'Nafis & Sadia (HSC Math)',
    address: 'Malibagh Chowdhury Para, Dhaka',
    latitude: 23.7480,
    longitude: 90.4100,
    radius: 100,
    expectedStart: '18:30',
    expectedEnd: '20:00',
    fee: 7000,
    expectedClassesPerMonth: 10,
    scheduledDays: [2, 4, 6], // Tue, Thu, Sat
    minimumStayMinutes: 30,
    active: true,
    createdAt: '2026-08-20T11:00:00.000Z',
  },
  {
    id: 3,
    name: 'Dhanmondi Tuition',
    studentName: 'Abrar Kabir (O Level Chem)',
    address: 'Road 7/A, Dhanmondi, Dhaka',
    latitude: 23.7461,
    longitude: 90.3742,
    radius: 120,
    expectedStart: '10:00',
    expectedEnd: '12:00',
    fee: 9000,
    expectedClassesPerMonth: 8,
    scheduledDays: [5, 6], // Fri, Sat
    minimumStayMinutes: 45,
    active: false,
    createdAt: '2026-08-25T09:00:00.000Z',
  },
];

// Seed attendance for September 2026 reflecting exact numbers from prompt:
// 18 days total, 34h 20m total duration (~123,600 seconds)
export const SEED_ATTENDANCE: Attendance[] = [
  // Farmgate Tuition (8 sessions in Sep)
  {
    id: 101,
    tuitionId: 1,
    date: '2026-09-01',
    arrivalTime: '16:02',
    departureTime: '17:58',
    duration: 6960, // 1h 56m
    status: 'completed',
    notes: 'Kinematics problem set completed',
    createdAt: '2026-09-01T17:58:00.000Z',
  },
  {
    id: 102,
    tuitionId: 1,
    date: '2026-09-03',
    arrivalTime: '16:08',
    departureTime: '17:58',
    duration: 6600, // 1h 50m
    status: 'completed',
    notes: "Newton's laws practice",
    createdAt: '2026-09-03T17:58:00.000Z',
  },
  {
    id: 103,
    tuitionId: 1,
    date: '2026-09-05',
    arrivalTime: '16:04',
    departureTime: '17:59',
    duration: 6900, // 1h 55m
    status: 'completed',
    notes: 'Work and Energy concept quiz',
    createdAt: '2026-09-05T17:59:00.000Z',
  },
  {
    id: 104,
    tuitionId: 1,
    date: '2026-09-07',
    arrivalTime: '16:05',
    departureTime: '18:02',
    duration: 7020, // 1h 57m
    status: 'completed',
    notes: 'Gravitation math worksheet',
    createdAt: '2026-09-07T18:02:00.000Z',
  },
  {
    id: 105,
    tuitionId: 1,
    date: '2026-09-10',
    arrivalTime: '16:00',
    departureTime: '18:00',
    duration: 7200, // 2h 0m
    status: 'completed',
    createdAt: '2026-09-10T18:00:00.000Z',
  },
  {
    id: 106,
    tuitionId: 1,
    date: '2026-09-12',
    arrivalTime: '16:03',
    departureTime: '17:55',
    duration: 6720, // 1h 52m
    status: 'completed',
    createdAt: '2026-09-12T17:55:00.000Z',
  },
  {
    id: 107,
    tuitionId: 1,
    date: '2026-09-15',
    arrivalTime: '15:58',
    departureTime: '18:02',
    duration: 7440, // 2h 4m
    status: 'completed',
    createdAt: '2026-09-15T18:02:00.000Z',
  },
  {
    id: 108,
    tuitionId: 1,
    date: '2026-09-17',
    arrivalTime: '16:05',
    departureTime: '18:01',
    duration: 6960, // 1h 56m
    status: 'completed',
    createdAt: '2026-09-17T18:01:00.000Z',
  },

  // Malibagh Tuition (10 sessions in Sep)
  {
    id: 201,
    tuitionId: 2,
    date: '2026-09-02',
    arrivalTime: '18:32',
    departureTime: '20:02',
    duration: 5400, // 1h 30m
    status: 'completed',
    createdAt: '2026-09-02T20:02:00.000Z',
  },
  {
    id: 202,
    tuitionId: 2,
    date: '2026-09-04',
    arrivalTime: '18:30',
    departureTime: '20:05',
    duration: 5700, // 1h 35m
    status: 'completed',
    createdAt: '2026-09-04T20:05:00.000Z',
  },
  {
    id: 203,
    tuitionId: 2,
    date: '2026-09-06',
    arrivalTime: '18:35',
    departureTime: '20:00',
    duration: 5100, // 1h 25m
    status: 'completed',
    createdAt: '2026-09-06T20:00:00.000Z',
  },
  {
    id: 204,
    tuitionId: 2,
    date: '2026-09-09',
    arrivalTime: '18:31',
    departureTime: '20:03',
    duration: 5520, // 1h 32m
    status: 'completed',
    createdAt: '2026-09-09T20:03:00.000Z',
  },
  {
    id: 205,
    tuitionId: 2,
    date: '2026-09-11',
    arrivalTime: '18:28',
    departureTime: '20:00',
    duration: 5520, // 1h 32m
    status: 'completed',
    createdAt: '2026-09-11T20:00:00.000Z',
  },
  {
    id: 206,
    tuitionId: 2,
    date: '2026-09-13',
    arrivalTime: '18:33',
    departureTime: '20:05',
    duration: 5520, // 1h 32m
    status: 'completed',
    createdAt: '2026-09-13T20:05:00.000Z',
  },
  {
    id: 207,
    tuitionId: 2,
    date: '2026-09-16',
    arrivalTime: '18:30',
    departureTime: '20:02',
    duration: 5520, // 1h 32m
    status: 'completed',
    createdAt: '2026-09-16T20:02:00.000Z',
  },
  {
    id: 208,
    tuitionId: 2,
    date: '2026-09-18',
    arrivalTime: '18:35',
    departureTime: '20:03',
    duration: 5280, // 1h 28m
    status: 'completed',
    createdAt: '2026-09-18T20:03:00.000Z',
  },
  {
    id: 209,
    tuitionId: 2,
    date: '2026-09-20',
    arrivalTime: '18:30',
    departureTime: '20:00',
    duration: 5400, // 1h 30m
    status: 'completed',
    createdAt: '2026-09-20T20:00:00.000Z',
  },
  {
    id: 210,
    tuitionId: 2,
    date: '2026-09-23',
    arrivalTime: '18:28',
    departureTime: '20:01',
    duration: 5580, // 1h 33m
    status: 'completed',
    createdAt: '2026-09-23T20:01:00.000Z',
  },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Your September report is ready!',
    message: 'You attended 18 days this month. Total duration: 34h 20m. Earned: ৳13,500.',
    timestamp: '2026-09-30T20:00:00.000Z',
    type: 'month_end',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Attendance Auto-Logged ✅',
    message: 'Farmgate Tuition attendance recorded (1h 57m) after leaving 100m geofence.',
    timestamp: '2026-09-07T18:02:15.000Z',
    type: 'geofence',
    read: true,
  },
];

// Auto-clean preset dummy data so user starts fresh with clean slate as requested
export function checkAndCleanPresets(): void {
  try {
    if (localStorage.getItem(STORAGE_KEYS.CLEANED_PRESETS) !== 'true') {
      // Clear preset tuitions & attendance so app starts empty
      localStorage.setItem(STORAGE_KEYS.TUITIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CLEANED_PRESETS, 'true');
    }
  } catch (e) {
    console.error('Error cleaning preset data', e);
  }
}

// Storage helpers
export function getStoredTuitions(): Tuition[] {
  try {
    checkAndCleanPresets();
    const raw = localStorage.getItem(STORAGE_KEYS.TUITIONS);
    if (!raw) {
      saveTuitions([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tuitions', e);
    return [];
  }
}

export function saveTuitions(tuitions: Tuition[]): void {
  localStorage.setItem(STORAGE_KEYS.TUITIONS, JSON.stringify(tuitions));
}

export function getStoredAttendance(): Attendance[] {
  try {
    checkAndCleanPresets();
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      saveAttendance([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading attendance', e);
    return [];
  }
}

export function saveAttendance(records: Attendance[]): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNotifications(items: NotificationItem[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(items));
}

export function resetToSeedData(): void {
  saveTuitions(SEED_TUITIONS);
  saveAttendance(SEED_ATTENDANCE);
  saveSettings(DEFAULT_SETTINGS);
  saveNotifications(SEED_NOTIFICATIONS);
}

export function clearAllData(): void {
  saveTuitions([]);
  saveAttendance([]);
  saveNotifications([]);
}

// User Profile & Authentication helpers
export function getStoredUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

  // Maintain registered users list for easy switching / login
  try {
    const all = getStoredAllUsers();
    const index = all.findIndex((u) => u.id === profile.id || u.email === profile.email);
    if (index >= 0) {
      all[index] = profile;
    } else {
      all.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving user to all users list', e);
  }
}

export function getStoredAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logoutUserProfile(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
}

export function removeStoredUser(userIdOrEmail: string): void {
  try {
    const all = getStoredAllUsers();
    const filtered = all.filter(
      (u) =>
        u.id !== userIdOrEmail &&
        u.email.toLowerCase() !== userIdOrEmail.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(filtered));

    const current = getStoredUserProfile();
    if (
      current &&
      (current.id === userIdOrEmail || current.email.toLowerCase() === userIdOrEmail.toLowerCase())
    ) {
      logoutUserProfile();
    }
  } catch (e) {
    console.error('Error removing stored user', e);
  }
}
