// Auth middleware — RBAC for all three panels. `requireAuth` populates req.user
// from the Bearer access token; `requireRole` gates by role.
import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './tokens.ts';

export interface AuthedRequest extends Request {
  user?: { id: string; role: string };
}

const deny = (res: Response, code: number, message: string) =>
  res.status(code).json({ error: { code: String(code), message } });

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return deny(res, 401, 'authentication required');
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role };
    next();
  } catch {
    return deny(res, 401, 'invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return deny(res, 401, 'authentication required');
    if (!roles.includes(req.user.role)) return deny(res, 403, 'forbidden — insufficient role');
    next();
  };
}

// Optional auth: populate req.user if a valid token is present, else continue.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) { try { const c = verifyAccessToken(token); req.user = { id: c.sub, role: c.role }; } catch { /* ignore */ } }
  next();
}
