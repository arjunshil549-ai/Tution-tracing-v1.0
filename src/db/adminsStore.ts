import { pool } from './index.ts';

export const ROOT_SUPER_ADMIN = 'arjunshil549@gmail.com';

export interface AdminUser {
  id?: number;
  email: string;
  role: 'super_admin' | 'admin';
  isRoot: boolean;
  addedBy: string;
  createdAt: string;
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

// In-memory cache & fallback storage
const inMemoryAdmins: Map<string, AdminUser> = new Map([
  [
    ROOT_SUPER_ADMIN.toLowerCase(),
    {
      email: ROOT_SUPER_ADMIN,
      role: 'super_admin',
      isRoot: true,
      addedBy: 'System (Root Authority)',
      createdAt: new Date().toISOString(),
    },
  ],
]);

const inMemoryAuditLogs: SecurityAuditLog[] = [
  {
    id: `log_init_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'security_alert',
    actor: 'Security Kernel',
    action: 'Strict RBAC Enforced',
    details: `Root Super Admin locked to ${ROOT_SUPER_ADMIN}. Public SQL server details concealed.`,
    severity: 'info',
  },
];

let tablesInitialized = false;

async function ensureTables() {
  if (tablesInitialized) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_admins (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          added_by TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS security_logs (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          details TEXT,
          severity TEXT NOT NULL DEFAULT 'info',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Ensure root super admin is registered in database
      await client.query(`
        INSERT INTO app_admins (email, added_by, role)
        VALUES ($1, 'System', 'super_admin')
        ON CONFLICT (email) DO NOTHING;
      `, [ROOT_SUPER_ADMIN.toLowerCase()]);

      tablesInitialized = true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('PostgreSQL tables initialization note (in-memory security active):', err);
  }
}

// Check if an email is the Root Super Admin
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_SUPER_ADMIN.toLowerCase();
}

// Check if an email has Admin privileges (EXCLUSIVELY Root Super Admin - arjunshil549@gmail.com)
export async function isAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_SUPER_ADMIN.toLowerCase();
}

// Get all admins
export async function getAdmins(): Promise<AdminUser[]> {
  await ensureTables();
  const adminsMap = new Map<string, AdminUser>(inMemoryAdmins);

  try {
    const res = await pool.query('SELECT id, email, added_by, role, created_at FROM app_admins ORDER BY id ASC');
    for (const row of res.rows) {
      const emailLower = row.email.toLowerCase();
      adminsMap.set(emailLower, {
        id: row.id,
        email: row.email,
        role: emailLower === ROOT_SUPER_ADMIN.toLowerCase() ? 'super_admin' : (row.role as 'admin' | 'super_admin'),
        isRoot: emailLower === ROOT_SUPER_ADMIN.toLowerCase(),
        addedBy: row.added_by,
        createdAt: new Date(row.created_at).toISOString(),
      });
    }
  } catch (err) {
    console.warn('Failed to query admins from DB, returning cached admins:', err);
  }

  // Ensure root super admin is first
  const root = adminsMap.get(ROOT_SUPER_ADMIN.toLowerCase()) || {
    email: ROOT_SUPER_ADMIN,
    role: 'super_admin',
    isRoot: true,
    addedBy: 'System (Root Authority)',
    createdAt: new Date().toISOString(),
  };

  const others = Array.from(adminsMap.values()).filter(
    (a) => a.email.toLowerCase() !== ROOT_SUPER_ADMIN.toLowerCase()
  );

  return [root, ...others];
}

// Add a new admin (Only Root Super Admin can call this)
export async function addAdmin(emailToAdd: string, requestedBy: string): Promise<AdminUser> {
  if (!isSuperAdmin(requestedBy)) {
    await logSecurityEvent({
      type: 'access_denied',
      actor: requestedBy || 'Unknown',
      action: 'Unauthorized Admin Promotion Attempt',
      details: `User ${requestedBy} attempted to promote ${emailToAdd} without Super Admin rights.`,
      severity: 'critical',
    });
    throw new Error(`Only the primary Super Admin (${ROOT_SUPER_ADMIN}) has permission to add administrators.`);
  }

  const normalizedEmail = emailToAdd.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  if (normalizedEmail === ROOT_SUPER_ADMIN.toLowerCase()) {
    throw new Error('This email is already the permanent Super Admin.');
  }

  await ensureTables();

  const newAdmin: AdminUser = {
    email: normalizedEmail,
    role: 'admin',
    isRoot: false,
    addedBy: requestedBy,
    createdAt: new Date().toISOString(),
  };

  inMemoryAdmins.set(normalizedEmail, newAdmin);

  try {
    const res = await pool.query(
      `INSERT INTO app_admins (email, added_by, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET added_by = $2
       RETURNING id, email, added_by, role, created_at`,
      [normalizedEmail, requestedBy]
    );
    if (res.rows[0]) {
      newAdmin.id = res.rows[0].id;
      newAdmin.createdAt = new Date(res.rows[0].created_at).toISOString();
    }
  } catch (err) {
    console.warn('Admin added to memory, DB sync skipped:', err);
  }

  await logSecurityEvent({
    type: 'admin_action',
    actor: requestedBy,
    action: 'Admin Added',
    details: `Admin privileges granted to ${normalizedEmail} by Super Admin.`,
    severity: 'info',
  });

  return newAdmin;
}

// Remove an admin (Only Root Super Admin can call this)
export async function removeAdmin(emailToRemove: string, requestedBy: string): Promise<boolean> {
  if (!isSuperAdmin(requestedBy)) {
    await logSecurityEvent({
      type: 'access_denied',
      actor: requestedBy || 'Unknown',
      action: 'Unauthorized Admin Removal Attempt',
      details: `User ${requestedBy} attempted to revoke ${emailToRemove} without Super Admin rights.`,
      severity: 'critical',
    });
    throw new Error(`Only the primary Super Admin (${ROOT_SUPER_ADMIN}) has permission to remove administrators.`);
  }

  const normalized = emailToRemove.trim().toLowerCase();
  if (normalized === ROOT_SUPER_ADMIN.toLowerCase()) {
    throw new Error('The primary Super Admin account cannot be removed.');
  }

  inMemoryAdmins.delete(normalized);

  await ensureTables();
  try {
    await pool.query('DELETE FROM app_admins WHERE LOWER(email) = $1', [normalized]);
  } catch (err) {
    console.warn('DB delete admin skipped:', err);
  }

  await logSecurityEvent({
    type: 'admin_action',
    actor: requestedBy,
    action: 'Admin Revoked',
    details: `Admin privileges revoked for ${normalized} by Super Admin.`,
    severity: 'warning',
  });

  return true;
}

// Log a security event
export async function logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
  const newLog: SecurityAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  inMemoryAuditLogs.unshift(newLog);
  if (inMemoryAuditLogs.length > 100) {
    inMemoryAuditLogs.pop();
  }

  try {
    await ensureTables();
    await pool.query(
      `INSERT INTO security_logs (type, actor, action, details, severity)
       VALUES ($1, $2, $3, $4, $5)`,
      [event.type, event.actor, event.action, event.details || null, event.severity]
    );
  } catch (err) {
    // Non-blocking log
  }
}

// Retrieve audit logs
export async function getAuditLogs(): Promise<SecurityAuditLog[]> {
  await ensureTables();
  try {
    const res = await pool.query(
      'SELECT id, type, actor, action, details, severity, created_at FROM security_logs ORDER BY id DESC LIMIT 50'
    );
    if (res.rows.length > 0) {
      return res.rows.map((row) => ({
        id: `db_log_${row.id}`,
        timestamp: new Date(row.created_at).toISOString(),
        type: row.type,
        actor: row.actor,
        action: row.action,
        details: row.details,
        severity: row.severity,
      }));
    }
  } catch (err) {
    console.warn('Could not query DB logs, returning memory logs:', err);
  }

  return inMemoryAuditLogs;
}

// Get protected Cloud SQL Server diagnostic details
export async function getCloudSqlProtectedDetails(requestedBy: string) {
  const start = Date.now();
  let dbConnected = false;
  let version = 'PostgreSQL 16';
  let latencyMs = 0;
  let userCount = 0;
  let tuitionCount = 0;
  let attendanceCount = 0;
  let adminCount = 1;

  try {
    const pingRes = await pool.query('SELECT version()');
    latencyMs = Date.now() - start;
    dbConnected = true;
    if (pingRes.rows[0]?.version) {
      version = pingRes.rows[0].version.split(' ')[0] + ' ' + (pingRes.rows[0].version.split(' ')[1] || '16');
    }

    const [uRes, tRes, aRes, admRes] = await Promise.all([
      pool.query('SELECT count(*) as count FROM users').catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT count(*) as count FROM tuitions').catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT count(*) as count FROM attendance').catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT count(*) as count FROM app_admins').catch(() => ({ rows: [{ count: 1 }] })),
    ]);

    userCount = parseInt(uRes.rows[0]?.count || '0', 10);
    tuitionCount = parseInt(tRes.rows[0]?.count || '0', 10);
    attendanceCount = parseInt(aRes.rows[0]?.count || '0', 10);
    adminCount = Math.max(1, parseInt(admRes.rows[0]?.count || '1', 10));
  } catch (err: any) {
    latencyMs = Date.now() - start;
    console.warn('SQL protected details query error:', err.message);
  }

  await logSecurityEvent({
    type: 'sql_query',
    actor: requestedBy,
    action: 'Cloud SQL Diagnostics Inspected',
    details: `Admin ${requestedBy} requested protected SQL diagnostics. Status: ${dbConnected ? 'ONLINE' : 'CONNECTING'}.`,
    severity: 'info',
  });

  return {
    status: dbConnected ? 'ONLINE' : 'DEGRADED',
    engine: 'PostgreSQL 16 (Relational Engine)',
    version,
    region: 'asia-southeast1',
    storageType: 'Managed Google Cloud SQL',
    latencyMs,
    securityShield: 'Active (RBAC & Masked Endpoints)',
    pool: {
      maxConnections: 10,
      connectionTimeoutMs: 15000,
      ssl: true,
    },
    counts: {
      users: userCount,
      tuitions: tuitionCount,
      attendance: attendanceCount,
      admins: adminCount,
    },
    lastHealthCheck: new Date().toISOString(),
  };
}
