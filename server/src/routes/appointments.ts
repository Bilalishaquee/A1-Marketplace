// Scheduling — a client and their matched provider propose/confirm appointments.

import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, type AuthedRequest } from '../auth/middleware.ts';
import { emitToUser } from '../realtime.ts';

const err = (res: Response, code: number, message: string, details?: unknown) =>
  res.status(code).json({ error: { code: String(code), message, details } });

const serializeAppt = (a: any) => ({
  id: a.id, projectId: a.projectId, scheduledFor: a.scheduledFor, status: a.status,
  notes: a.notes ?? null, createdAt: a.createdAt,
});

export function appointmentsRouter(): Router {
  const r = Router();

  r.post('/', requireAuth, async (req: AuthedRequest, res) => {
    const parsed = z.object({
      projectId: z.string(), scheduledFor: z.string(), notes: z.string().max(1000).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      include: { bids: { where: { status: 'ACCEPTED' }, take: 1 } },
    });
    if (!project) return err(res, 404, 'project not found');
    const acceptedProviderId = project.bids[0]?.providerId;
    if (!acceptedProviderId) return err(res, 422, 'no accepted provider yet — accept a bid first');
    const uid = req.user!.id;
    if (project.clientId !== uid && acceptedProviderId !== uid && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const when = new Date(parsed.data.scheduledFor);
    if (Number.isNaN(when.getTime())) return err(res, 400, 'invalid scheduledFor date');

    const appt = await prisma.appointment.create({
      data: { projectId: project.id, clientId: project.clientId, providerId: acceptedProviderId, scheduledFor: when, notes: parsed.data.notes, status: 'REQUESTED' },
    });
    const other = uid === project.clientId ? acceptedProviderId : project.clientId;
    emitToUser(other, 'appointment:new', { id: appt.id, projectId: project.id, scheduledFor: appt.scheduledFor });
    res.status(201).json({ appointment: serializeAppt(appt) });
  });

  r.post('/:id/confirm', requireAuth, async (req: AuthedRequest, res) => {
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appt) return err(res, 404, 'appointment not found');
    const uid = req.user!.id;
    if (appt.clientId !== uid && appt.providerId !== uid && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const [updated] = await prisma.$transaction([
      prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CONFIRMED' } }),
      prisma.project.update({ where: { id: appt.projectId }, data: { status: 'SCHEDULED' } }),
    ]);
    emitToUser(appt.clientId === uid ? appt.providerId : appt.clientId, 'appointment:confirmed', { id: appt.id });
    res.json({ appointment: serializeAppt(updated) });
  });

  r.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.user!.id;
    const appts = await prisma.appointment.findMany({
      where: { OR: [{ clientId: uid }, { providerId: uid }] },
      orderBy: { scheduledFor: 'asc' }, include: { project: true },
    });
    res.json({ appointments: appts.map(a => ({ ...serializeAppt(a), projectCategory: a.project.categoryKey })) });
  });

  return r;
}
