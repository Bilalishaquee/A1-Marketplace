// Authentication API — register / login / refresh / logout / me.
// Real users in Postgres, bcrypt passwords, JWT access + rotating refresh tokens.
// Works identically for web and mobile (tokens returned in JSON, no cookies).

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { config } from '../config.ts';
import { hashPassword, verifyPassword } from '../auth/passwords.ts';
import {
  hashRefreshToken, newRefreshToken, signAccessToken,
} from '../auth/tokens.ts';
import { requireAuth, type AuthedRequest } from '../auth/middleware.ts';

const err = (res: Response, code: number, message: string, details?: unknown) =>
  res.status(code).json({ error: { code: String(code), message, details } });

const db503 = (res: Response) =>
  res.status(503).json({ error: { code: '503', message: 'Database unavailable — please try again shortly' } });

// Wraps an async route handler so unhandled rejections become 503s instead of process crashes.
function wrap(fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('localhost') || msg.includes('ECONNREFUSED') || msg.includes("Can't reach")) {
        db503(res)
      } else {
        next(e)
      }
    })
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  role: z.enum(['client', 'provider']).default('client'),
  // provider-only (required when role=provider)
  businessName: z.string().min(1).max(160).optional(),
  trades: z.array(z.string()).max(40).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

function publicUser(u: any) {
  return {
    id: u.id, email: u.email, role: u.role, name: u.name, phone: u.phone ?? null,
    providerProfile: u.providerProfile
      ? {
          id: u.providerProfile.id, businessName: u.providerProfile.businessName,
          trades: u.providerProfile.trades, verified: u.providerProfile.verified,
          ratingAvg: u.providerProfile.ratingAvg, ratingCount: u.providerProfile.ratingCount,
        }
      : null,
    createdAt: u.createdAt,
  };
}

async function issueTokens(user: { id: string; role: string }, userAgent?: string) {
  const accessToken = signAccessToken(user);
  const refreshToken = newRefreshToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      userAgent: userAgent?.slice(0, 250),
      expiresAt: new Date(Date.now() + config.refreshTtlDays * 86400000),
    },
  });
  return { accessToken, refreshToken, accessExpiresInSec: config.accessTtlMin * 60 };
}

export function authRouter(): Router {
  const r = Router();

  r.post('/register', wrap(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const b = parsed.data;
    if (b.role === 'provider' && !b.businessName) return err(res, 400, 'businessName is required for providers');

    const email = b.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return err(res, 409, 'an account with this email already exists');

    const user = await prisma.user.create({
      data: {
        email, name: b.name, phone: b.phone ?? null,
        passwordHash: await hashPassword(b.password),
        role: b.role === 'provider' ? 'PROVIDER' : 'CLIENT',
        providerProfile: b.role === 'provider'
          ? { create: { businessName: b.businessName!, trades: b.trades ?? [] } }
          : undefined,
      },
      include: { providerProfile: true },
    });

    const tokens = await issueTokens(user, req.get('user-agent') || undefined);
    res.status(201).json({ user: publicUser(user), ...tokens });
  }));

  r.post('/login', wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      include: { providerProfile: true },
    });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return err(res, 401, 'incorrect email or password');
    }
    const tokens = await issueTokens(user, req.get('user-agent') || undefined);
    res.json({ user: publicUser(user), ...tokens });
  }));

  // Rotate: validate the presented refresh token, revoke it, issue a new pair.
  r.post('/refresh', wrap(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return err(res, 401, 'invalid or expired session');
    }
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(session.user, req.get('user-agent') || undefined);
    res.json(tokens);
  }));

  r.post('/logout', wrap(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) {
      await prisma.session.updateMany({
        where: { tokenHash: hashRefreshToken(parsed.data.refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    }
    res.json({ ok: true });
  }));

  r.get('/me', requireAuth, wrap(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { providerProfile: true },
    });
    if (!user) return err(res, 404, 'user not found');
    res.json({ user: publicUser(user) });
  }));

  return r;
}
