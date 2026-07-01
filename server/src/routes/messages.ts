// Messaging — threads + messages between a client and their chosen provider.
// Participant-gated; new messages push real-time to the other party.

import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, type AuthedRequest } from '../auth/middleware.ts';
import { emitToUser, emitToProject } from '../realtime.ts';

const err = (res: Response, code: number, message: string, details?: unknown) =>
  res.status(code).json({ error: { code: String(code), message, details } });

export function messagesRouter(): Router {
  const r = Router();

  r.get('/', requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.user!.id;
    const threads = await prisma.messageThread.findMany({
      where: { OR: [{ clientId: uid }, { providerId: uid }] },
      orderBy: { createdAt: 'desc' },
      include: { project: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const ids = [...new Set(threads.flatMap(t => [t.clientId, t.providerId]))];
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
    const nameOf = Object.fromEntries(users.map(u => [u.id, u.name]));
    res.json({
      threads: threads.map(t => ({
        id: t.id, projectId: t.projectId, projectCategory: t.project.categoryKey,
        otherParty: uid === t.clientId ? { id: t.providerId, name: nameOf[t.providerId] } : { id: t.clientId, name: nameOf[t.clientId] },
        lastMessage: t.messages[0] ? { body: t.messages[0].body, senderId: t.messages[0].senderId, createdAt: t.messages[0].createdAt } : null,
        createdAt: t.createdAt,
      })),
    });
  });

  r.get('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
    const t = await prisma.messageThread.findUnique({ where: { id: req.params.id } });
    if (!t) return err(res, 404, 'thread not found');
    const uid = req.user!.id;
    if (t.clientId !== uid && t.providerId !== uid && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    await prisma.message.updateMany({ where: { threadId: t.id, senderId: { not: uid }, readAt: null }, data: { readAt: new Date() } });
    const messages = await prisma.message.findMany({ where: { threadId: t.id }, orderBy: { createdAt: 'asc' }, take: 500 });
    res.json({ messages: messages.map(m => ({ id: m.id, body: m.body, senderId: m.senderId, mine: m.senderId === uid, readAt: m.readAt, createdAt: m.createdAt })) });
  });

  r.post('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
    const t = await prisma.messageThread.findUnique({ where: { id: req.params.id } });
    if (!t) return err(res, 404, 'thread not found');
    const uid = req.user!.id;
    if (t.clientId !== uid && t.providerId !== uid) return err(res, 403, 'forbidden');
    const parsed = z.object({ body: z.string().min(1).max(4000) }).safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const msg = await prisma.message.create({ data: { threadId: t.id, senderId: uid, body: parsed.data.body } });
    const other = uid === t.clientId ? t.providerId : t.clientId;
    const payload = { id: msg.id, threadId: t.id, body: msg.body, senderId: uid, createdAt: msg.createdAt };
    emitToUser(other, 'message:new', payload);
    emitToProject(t.projectId, 'message:new', payload);
    res.status(201).json({ message: { ...payload, mine: true } });
  });

  return r;
}
