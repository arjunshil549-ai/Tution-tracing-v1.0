export interface Tuition {
  id: number;
  name: string;
  studentName?: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters, e.g. 100
  expectedStart: string; // e.g. "16:00"
  expectedEnd: string; // e.g. "18:00"
  fee: number; // Monthly fee in BDT / ৳, e.g. 8000
  expectedClassesPerMonth: number; // e.g. 12 classes
  scheduledDays: number[]; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  minimumStayMinutes: number; // e.g. 30
  active: boolean;
  createdAt: string;
}

export interface Attendance {
  id: number;
  tuitionId: number;
  date: string; // YYYY-MM-DD e.g. "2026-09-07"
  arrivalTime: string; // HH:mm or ISO e.g. "16:05"
  departureTime?: string; // HH:mm or ISO e.g. "18:02"
  duration: number; // seconds, e.g. 7020 (1h 57m)
  status: 'completed' | 'in_progress' | 'ignored';
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  trackingEnabled: boolean;
  monthlyNotification: boolean;
  minimumStay: number; // minutes, default 30
  defaultRadius: number; // meters, default 100
  gpsTolerance: number; // meters, default 30
  currencySymbol: string; // "৳"
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'month_end' | 'geofence' | 'system';
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  institution?: string; // e.g. Dhaka University, BUET, etc.
  subject?: string; // e.g. Physics, Mathematics
  avatarColor?: string;
  bio?: string;
  createdAt: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isSimulated?: boolean;
}
