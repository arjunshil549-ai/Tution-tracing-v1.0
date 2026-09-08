import { getStoredAllUsers, removeStoredUser } from './storage';
import { Tuition } from '../types';

export interface AdminUser {
  id?: number;
  email: string;
  role: 'super_admin' | 'admin';
  isRoot: boolean;
  addedBy: string;
  createdAt: string;
}

export interface AppUser {
  id?: number;
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  institution?: string;
  createdAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'admin_action' | 'access_denied' | 'sql_query' | 'security_alert';
  actor: string;
  action: string;
  details?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ProtectedSqlDetails {
  status: 'ONLINE' | 'DEGRADED';
  engine: string;
  version: string;
  region: string;
  storageType: string;
  latencyMs: number;
  securityShield: string;
  pool: {
    maxConnections: number;
    connectionTimeoutMs: number;
    ssl: boolean;
  };
  counts: {
    users: number;
    tuitions: number;
    attendance: number;
    admins: number;
  };
  lastHealthCheck: string;
}

export interface AdminStatusResponse {
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: 'super_admin' | 'user';
  rootSuperAdmin: string;
}

export const ROOT_SUPER_ADMIN = 'arjunshil549@gmail.com';

// STRICT: Only arjunshil549@gmail.com is Super Admin. No one else under any circumstances!
export function isLocalSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_SUPER_ADMIN.toLowerCase();
}

function getAuthHeaders(idToken: string | null, email?: string | null) {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const token = idToken || (cleanEmail ? `demo-token-${cleanEmail}` : 'demo-token-guest@example.com');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (cleanEmail) {
    headers['x-user-email'] = cleanEmail;
  }
  return headers;
}

export async function checkAdminStatus(
  idToken: string | null,
  userEmail?: string | null
): Promise<AdminStatusResponse> {
  const isSuper = isLocalSuperAdmin(userEmail);
  // Non-superadmin users are immediately rejected without admin privileges
  if (!isSuper) {
    return {
      email: userEmail || null,
      isAdmin: false,
      isSuperAdmin: false,
      role: 'user',
      rootSuperAdmin: ROOT_SUPER_ADMIN,
    };
  }

  try {
    const res = await fetch('/api/admin/status', {
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (!res.ok) {
      return {
        email: userEmail || null,
        isAdmin: true,
        isSuperAdmin: true,
        role: 'super_admin',
        rootSuperAdmin: ROOT_SUPER_ADMIN,
      };
    }
    return await res.json();
  } catch (err) {
    return {
      email: userEmail || null,
      isAdmin: true,
      isSuperAdmin: true,
      role: 'super_admin',
      rootSuperAdmin: ROOT_SUPER_ADMIN,
    };
  }
}

// Fetch all registered users in the app (Super Admin only)
export async function fetchRegisteredUsers(
  idToken: string | null,
  userEmail?: string | null
): Promise<AppUser[]> {
  if (!isLocalSuperAdmin(userEmail)) {
    return [];
  }

  try {
    const res = await fetch('/api/admin/users', {
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (res.ok) {
      const serverUsers: AppUser[] = await res.json();
      if (serverUsers && serverUsers.length > 0) {
        return serverUsers;
      }
    }
  } catch (e) {
    console.warn('Could not fetch server users, falling back to local registered users', e);
  }

  // Fallback to local stored user profiles
  const stored = getStoredAllUsers();
  return stored.map((u) => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    institution: u.institution,
    createdAt: u.createdAt,
  }));
}

// Remove any user from the app (Super Admin only)
export async function removeUserAccount(
  idToken: string | null,
  userEmail: string | null,
  userUid: string,
  targetEmail?: string
): Promise<boolean> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Only Super Admin (arjunshil549@gmail.com) can remove users.');
  }

  if (targetEmail && targetEmail.toLowerCase() === ROOT_SUPER_ADMIN.toLowerCase()) {
    throw new Error('Protected Account: The primary Super Admin cannot be removed.');
  }

  // Remove from local storage immediately
  removeStoredUser(userUid);
  if (targetEmail) {
    removeStoredUser(targetEmail);
  }

  // Remove from server database
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userUid)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Server returned error deleting user.');
    }
  } catch (err: any) {
    console.warn('Cloud SQL user delete synced locally, server note:', err.message);
  }

  return true;
}

// Super Admin: Update any tuition in the app
export async function updateTuitionAsAdmin(
  idToken: string | null,
  userEmail: string | null,
  tuitionId: number,
  data: Partial<Tuition>
): Promise<boolean> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Super Admin only.');
  }

  try {
    const res = await fetch(`/api/admin/tuitions/${tuitionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(idToken, userEmail),
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Super Admin: Delete any tuition in the app
export async function deleteTuitionAsAdmin(
  idToken: string | null,
  userEmail: string | null,
  tuitionId: number
): Promise<boolean> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Super Admin only.');
  }

  try {
    const res = await fetch(`/api/admin/tuitions/${tuitionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(idToken, userEmail),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchProtectedSqlDetails(
  idToken: string | null,
  userEmail?: string | null
): Promise<ProtectedSqlDetails | null> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Only Super Admin (arjunshil549@gmail.com) can view SQL server infrastructure.');
  }

  try {
    const res = await fetch('/api/admin/sql-details', {
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Forbidden: Only authorized super administrator can view SQL server diagnostics.');
      }
      throw new Error('Failed to retrieve SQL server diagnostics');
    }
    return await res.json();
  } catch (err: any) {
    console.warn('SQL Protected Details access notice:', err.message);
    throw err;
  }
}

export async function fetchSecurityLogs(
  idToken: string | null,
  userEmail?: string | null
): Promise<SecurityAuditLog[]> {
  if (!isLocalSuperAdmin(userEmail)) return [];

  try {
    const res = await fetch('/api/admin/audit-logs', {
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function fetchAdminList(
  idToken: string | null,
  userEmail?: string | null
): Promise<{ admins: AdminUser[]; isSuperAdmin: boolean }> {
  if (!isLocalSuperAdmin(userEmail)) {
    return { admins: [], isSuperAdmin: false };
  }
  try {
    const res = await fetch('/api/admin/list', {
      headers: getAuthHeaders(idToken, userEmail),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  return {
    admins: [
      {
        email: ROOT_SUPER_ADMIN,
        role: 'super_admin',
        isRoot: true,
        addedBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ],
    isSuperAdmin: true,
  };
}

export async function addAdminUser(
  idToken: string | null,
  userEmail: string | null,
  targetEmail: string
): Promise<AdminUser> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Only arjunshil549@gmail.com can manage administrators.');
  }
  const res = await fetch('/api/admin/add', {
    method: 'POST',
    headers: getAuthHeaders(idToken, userEmail),
    body: JSON.stringify({ email: targetEmail }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to add admin');
  }
  return await res.json();
}

export async function removeAdminUser(
  idToken: string | null,
  userEmail: string | null,
  targetEmail: string
): Promise<boolean> {
  if (!isLocalSuperAdmin(userEmail)) {
    throw new Error('Forbidden: Only arjunshil549@gmail.com can manage administrators.');
  }
  const res = await fetch('/api/admin/remove', {
    method: 'POST',
    headers: getAuthHeaders(idToken, userEmail),
    body: JSON.stringify({ email: targetEmail }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to remove admin');
  }
  return true;
}

