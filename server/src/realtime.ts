// Real-time layer (Socket.IO). Authenticated sockets join a per-user room
// (`user:<id>`); domain code pushes targeted events (new bid, new message,
// status change). Safe no-op until initRealtime() attaches the server, so the
// domain can call emit* unconditionally.

import { Server as IOServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verifyAccessToken } from './auth/tokens.ts';
import { config } from './config.ts';

let io: IOServer | null = null;

export function initRealtime(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, { cors: { origin: '*' } });

  // Authenticate each socket from its handshake access token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const claims = verifyAccessToken(token);
      (socket.data as any).userId = claims.sub;
      (socket.data as any).role = claims.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as any).userId as string;
    socket.join(`user:${userId}`);
    // Clients may subscribe to a project room (e.g. a thread they participate in).
    socket.on('join:project', (projectId: string) => {
      if (typeof projectId === 'string') socket.join(`project:${projectId}`);
    });
    socket.on('leave:project', (projectId: string) => {
      if (typeof projectId === 'string') socket.leave(`project:${projectId}`);
    });
  });

  if (config) { /* referenced to keep import meaningful in future config-driven CORS */ }
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToProject(projectId: string, event: string, payload: unknown) {
  io?.to(`project:${projectId}`).emit(event, payload);
}
