import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { isAdmin, isSuperAdmin, ROOT_SUPER_ADMIN, logSecurityEvent } from '../db/adminsStore.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & {
    isVerifiedGoogleToken?: boolean;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    // Attempt cryptographic verification via Firebase Admin SDK
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = {
        ...decodedToken,
        isVerifiedGoogleToken: true,
      };
      return next();
    } catch (verifyErr: any) {
      // If cryptographic verification failed, check if it was a mock/demo string
      if (token.startsWith('demo-token-') || token.startsWith('demo-admin-token-')) {
        const tokenEmail = token
          .replace('demo-admin-token-', '')
          .replace('demo-token-', '')
          .trim()
          .toLowerCase();
        const headerEmail = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase();
        const claimedEmail = headerEmail || tokenEmail;

        // CRITICAL SECURITY GUARD: Never allow unverified demo tokens to impersonate Root Super Admin
        if (claimedEmail === ROOT_SUPER_ADMIN.toLowerCase()) {
          await logSecurityEvent({
            type: 'access_denied',
            actor: 'Unverified Client',
            action: 'Rejected Super Admin Spoofing Attempt',
            details: `A client attempted to claim Super Admin (${ROOT_SUPER_ADMIN}) using an unverified demo token.`,
            severity: 'critical',
          });
          return res.status(403).json({
            error: 'Security alert: Super Admin credentials strictly require genuine Google OAuth verification.',
          });
        }

        // Allow basic unverified local session for regular non-admin user operations only
        const safeEmail = claimedEmail || 'guest@example.com';
        req.user = {
          uid: 'user_' + safeEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: safeEmail,
          name: safeEmail.split('@')[0] || 'User',
          isVerifiedGoogleToken: false,
        } as any;
        return next();
      }

      console.warn('Firebase ID token verification failed:', verifyErr.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  } catch (error) {
    console.error('Error in requireAuth middleware:', error);
    return res.status(500).json({ error: 'Internal authentication validation failure' });
  }
};

// Middleware: Strictly requires Admin or Super Admin privileges
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    const userEmail = req.user?.email;
    const isVerified = req.user?.isVerifiedGoogleToken;
    const hasAdminAccess = await isAdmin(userEmail);

    if (!hasAdminAccess || !isVerified) {
      await logSecurityEvent({
        type: 'access_denied',
        actor: userEmail || 'Anonymous',
        action: 'Blocked Admin Resource Access',
        details: `Access denied for ${userEmail || 'unknown'} (verified=${isVerified}). Route: ${req.originalUrl}`,
        severity: 'warning',
      });
      return res.status(403).json({
        error: 'Forbidden: Verified administrator access required.',
      });
    }

    next();
  });
};

// Middleware: Strictly requires Verified Root Super Admin (arjunshil549@gmail.com)
export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    const userEmail = req.user?.email;
    const isRoot = isSuperAdmin(userEmail);
    const isVerified = req.user?.isVerifiedGoogleToken;

    if (!isRoot || !isVerified) {
      await logSecurityEvent({
        type: 'access_denied',
        actor: userEmail || 'Anonymous',
        action: 'Blocked Super Admin Access Attempt',
        details: `Non-super-admin or unverified caller (${userEmail}, verified=${isVerified}) attempted action restricted to ${ROOT_SUPER_ADMIN}`,
        severity: 'critical',
      });
      return res.status(403).json({
        error: `Forbidden: Only the verified Super Admin (${ROOT_SUPER_ADMIN}) can perform this operation.`,
      });
    }

    next();
  });
};
