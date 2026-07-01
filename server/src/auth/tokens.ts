// Token utilities. Access = stateless JWT (short-lived). Refresh = opaque random
// string, stored only as a SHA-256 hash in the Session table, rotated on use.
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.ts';

export interface AccessClaims { sub: string; role: string; }

export function signAccessToken(user: { id: string; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtAccessSecret, {
    expiresIn: `${config.accessTtlMin}m`,
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, config.jwtAccessSecret) as AccessClaims;
}

export function newRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
