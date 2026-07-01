// Bid actions (client side): accept / decline. Accepting matches the project,
// declines all other bids, and opens a message thread with the chosen provider.

import { Router, type Response } from 'express';
import { prisma } from '../db.ts';
import { requireAuth, type AuthedRequest } from '../auth/middleware.ts';
import { emitToUser } from '../realtime.ts';
import { serializeBid } from './projects.ts';

const err = (res: Response, code: number, message: string) =>
  res.status(code).json({ error: { code: String(code), message } });

export function bidsRouter(): Router {
  const r = Router();

  r.post('/:bidId/accept', requireAuth, async (req: AuthedRequest, res) => {
    const bid = await prisma.bid.findUnique({ where: { id: req.params.bidId }, include: { project: true } });
    if (!bid) return err(res, 404, 'bid not found');
    if (bid.project.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    if (!['POSTED', 'MATCHED'].includes(bid.project.status)) return err(res, 422, 'project is not open for acceptance');

    const [accepted, , , thread] = await prisma.$transaction([
      prisma.bid.update({ where: { id: bid.id }, data: { status: 'ACCEPTED' }, include: { provider: { include: { providerProfile: true } } } }),
      prisma.bid.updateMany({ where: { projectId: bid.projectId, id: { not: bid.id } }, data: { status: 'DECLINED' } }),
      prisma.project.update({ where: { id: bid.projectId }, data: { status: 'MATCHED', selectedBudgetCents: bid.amountCents } }),
      prisma.messageThread.upsert({
        where: { projectId_providerId: { projectId: bid.projectId, providerId: bid.providerId } },
        create: { projectId: bid.projectId, clientId: bid.project.clientId, providerId: bid.providerId },
        update: {},
      }),
    ]);
    await prisma.projectEvent.create({ data: { projectId: bid.projectId, actor: 'client', type: 'bid_accepted', payload: { bidId: bid.id } } });
    emitToUser(bid.providerId, 'bid:accepted', { projectId: bid.projectId, bidId: bid.id, threadId: thread.id });
    res.json({ bid: serializeBid(accepted), threadId: thread.id });
  });

  r.post('/:bidId/decline', requireAuth, async (req: AuthedRequest, res) => {
    const bid = await prisma.bid.findUnique({ where: { id: req.params.bidId }, include: { project: true } });
    if (!bid) return err(res, 404, 'bid not found');
    if (bid.project.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const updated = await prisma.bid.update({ where: { id: bid.id }, data: { status: 'DECLINED' }, include: { provider: { include: { providerProfile: true } } } });
    emitToUser(bid.providerId, 'bid:declined', { projectId: bid.projectId, bidId: bid.id });
    res.json({ bid: serializeBid(updated) });
  });

  return r;
}
