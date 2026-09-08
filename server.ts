import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, requireAdmin, requireSuperAdmin, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserByUid, getAllUsers, deleteUserByUid } from './src/db/users.ts';
import {
  ROOT_SUPER_ADMIN,
  isSuperAdmin,
  isAdmin,
  getAdmins,
  addAdmin,
  removeAdmin,
  getAuditLogs,
  logSecurityEvent,
  getCloudSqlProtectedDetails,
} from './src/db/adminsStore.ts';
import {
  getTuitionsByUser,
  getActiveTuitionsByUser,
  createTuition,
  updateTuition,
  deleteTuition,
  updateTuitionAsAdmin,
  deleteTuitionAsAdmin,
} from './src/db/tuitionStore.ts';
import {
  getAttendanceByUser,
  createAttendance,
  syncAttendanceBatch,
  deleteAttendance,
} from './src/db/attendanceStore.ts';
import { initializeDatabaseSchema } from './src/db/index.ts';

async function startServer() {
  // Ensure database tables and columns exist
  await initializeDatabaseSchema();

  const app = express();
  const PORT = 3000;

  // Security Hardening
  app.disable('x-powered-by');

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  // In-memory rate limiter for API endpoints to prevent abuse & brute-force
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 200; // 200 requests per minute per IP

  app.use('/api', (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown_ip';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    entry.count++;
    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Too many requests. Please retry in 1 minute.' });
    }

    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // User Profile Sync with Cloud SQL
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || req.body.email || 'user@example.com';
      const { name, phone, institution } = req.body;
      const user = await getOrCreateUser(uid, email, name, phone, institution);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user to Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const user = await getUserByUid(uid);
      res.json(user || null);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
  });

  // Tuitions Endpoints (Cloud SQL)
  app.get('/api/tuitions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const list = await getTuitionsByUser(uid);
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get tuitions from Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to get tuitions' });
    }
  });

  // Active tuitions specifically for native geofence registration
  app.get('/api/tuitions/active', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const list = await getActiveTuitionsByUser(uid);
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get active tuitions:', error);
      res.status(500).json({ error: error.message || 'Failed to get active tuitions' });
    }
  });

  app.post('/api/tuitions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { name, address, latitude, longitude, radius, fee, minimumStayMinutes } = req.body;

      // Validation
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Tuition name is required.' });
      }
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
      }
      if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
      }
      if (radius !== undefined && (typeof radius !== 'number' || radius <= 0)) {
        return res.status(400).json({ error: 'Radius must be a positive number of meters.' });
      }
      if (fee !== undefined && (typeof fee !== 'number' || fee < 0)) {
        return res.status(400).json({ error: 'Fee cannot be negative.' });
      }
      if (minimumStayMinutes !== undefined && (typeof minimumStayMinutes !== 'number' || minimumStayMinutes <= 0)) {
        return res.status(400).json({ error: 'Minimum stay must be greater than 0 minutes.' });
      }

      // Ensure user exists first
      await getOrCreateUser(uid, req.user!.email || 'user@example.com');
      const tuition = await createTuition(uid, req.body);
      res.status(201).json(tuition);
    } catch (error: any) {
      console.error('Failed to create tuition in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to create tuition' });
    }
  });

  app.put('/api/tuitions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const id = parseInt(req.params.id, 10);
      const { latitude, longitude, radius, fee, minimumStayMinutes } = req.body;

      // Validation
      if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
        return res.status(400).json({ error: 'Latitude must be between -90 and 90.' });
      }
      if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
        return res.status(400).json({ error: 'Longitude must be between -180 and 180.' });
      }
      if (radius !== undefined && (typeof radius !== 'number' || radius <= 0)) {
        return res.status(400).json({ error: 'Radius must be a positive number.' });
      }
      if (fee !== undefined && (typeof fee !== 'number' || fee < 0)) {
        return res.status(400).json({ error: 'Fee cannot be negative.' });
      }
      if (minimumStayMinutes !== undefined && (typeof minimumStayMinutes !== 'number' || minimumStayMinutes <= 0)) {
        return res.status(400).json({ error: 'Minimum stay must be greater than 0.' });
      }

      const updated = await updateTuition(uid, id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Tuition not found or unauthorized' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update tuition in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to update tuition' });
    }
  });

  app.delete('/api/tuitions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const id = parseInt(req.params.id, 10);
      await deleteTuition(uid, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete tuition in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to delete tuition' });
    }
  });

  // Attendance Endpoints (Cloud SQL)
  app.get('/api/attendance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const list = await getAttendanceByUser(uid);
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get attendance from Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to get attendance' });
    }
  });

  app.post('/api/attendance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      await getOrCreateUser(uid, req.user!.email || 'user@example.com');
      const item = await createAttendance(uid, req.body);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Failed to log attendance in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to log attendance' });
    }
  });

  // Batch offline synchronization endpoint with idempotency support
  app.post('/api/attendance/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const items = Array.isArray(req.body) ? req.body : req.body.items || [];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected an array of attendance items or { items: [...] }' });
      }
      await getOrCreateUser(uid, req.user!.email || 'user@example.com');
      const synced = await syncAttendanceBatch(uid, items);
      res.json({ success: true, count: synced.length, records: synced });
    } catch (error: any) {
      console.error('Failed to sync attendance batch in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to sync attendance batch' });
    }
  });

  // Geofence Event Telemetry & Status check
  app.post('/api/geofence-events', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { tuitionId, event, latitude, longitude, accuracy } = req.body;
      res.json({
        success: true,
        userUid: uid,
        tuitionId,
        event,
        coordinates: { latitude, longitude, accuracy },
        recordedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to record geofence event' });
    }
  });

  app.delete('/api/attendance/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const id = parseInt(req.params.id, 10);
      await deleteAttendance(uid, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete attendance from Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to delete attendance' });
    }
  });

  // ==========================================
  // PROTECTED ADMIN & SECURITY ENDPOINTS
  // ==========================================

  // Check current admin status (STRICT: only arjunshil549@gmail.com)
  app.get('/api/admin/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user?.email || null;
      const superAdminStatus = isSuperAdmin(email);

      res.json({
        email,
        isAdmin: superAdminStatus,
        isSuperAdmin: superAdminStatus,
        role: superAdminStatus ? 'super_admin' : 'user',
        rootSuperAdmin: ROOT_SUPER_ADMIN,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to verify admin status' });
    }
  });

  // Cloud SQL Details: STRICTLY PROTECTED (Only Super Admin can view)
  app.get('/api/admin/sql-details', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const details = await getCloudSqlProtectedDetails(req.user?.email || ROOT_SUPER_ADMIN);
      res.json(details);
    } catch (error: any) {
      console.error('Failed to query protected SQL details:', error);
      res.status(500).json({ error: 'Unable to retrieve SQL diagnostic details' });
    }
  });

  // Super Admin: List all registered users
  app.get('/api/admin/users', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAllUsers();
      res.json(list);
    } catch (error: any) {
      console.error('Failed to fetch user list:', error);
      res.status(500).json({ error: 'Unable to retrieve registered users' });
    }
  });

  // Super Admin: Remove/Delete any user from the app
  app.delete('/api/admin/users/:uid', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const targetUid = req.params.uid;
      const targetUser = await getUserByUid(targetUid);
      
      if (targetUser && targetUser.email.toLowerCase() === ROOT_SUPER_ADMIN.toLowerCase()) {
        return res.status(403).json({ error: 'Security constraint: The primary Super Admin account cannot be removed.' });
      }

      await deleteUserByUid(targetUid);
      await logSecurityEvent({
        type: 'admin_action',
        actor: req.user?.email || ROOT_SUPER_ADMIN,
        action: 'User Removed by Super Admin',
        details: `Super Admin removed user ${targetUser?.email || targetUid}`,
        severity: 'warning',
      });
      res.json({ success: true, message: 'User successfully removed.' });
    } catch (error: any) {
      console.error('Failed to remove user:', error);
      res.status(500).json({ error: error.message || 'Failed to remove user.' });
    }
  });

  // List all administrators
  app.get('/api/admin/list', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAdmins();
      res.json({
        rootSuperAdmin: ROOT_SUPER_ADMIN,
        currentCaller: req.user?.email,
        isSuperAdmin: isSuperAdmin(req.user?.email),
        admins: list,
      });
    } catch (error: any) {
      console.error('Failed to fetch admin list:', error);
      res.status(500).json({ error: 'Unable to retrieve administrator list' });
    }
  });

  // Security Audit Logs (Super Admin only)
  app.get('/api/admin/audit-logs', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const logs = await getAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve security audit logs' });
    }
  });

  // Super Admin: Update any tuition in the app
  app.put('/api/admin/tuitions/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid tuition ID' });
      }
      const updated = await updateTuitionAsAdmin(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Tuition not found' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update tuition as admin:', error);
      res.status(500).json({ error: 'Failed to update tuition record' });
    }
  });

  // Super Admin: Delete any tuition in the app
  app.delete('/api/admin/tuitions/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid tuition ID' });
      }
      await deleteTuitionAsAdmin(id);
      res.json({ success: true, message: 'Tuition successfully deleted' });
    } catch (error: any) {
      console.error('Failed to delete tuition as admin:', error);
      res.status(500).json({ error: 'Failed to delete tuition record' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TuitionTrack server running on http://localhost:${PORT}`);
  });
}

startServer();
