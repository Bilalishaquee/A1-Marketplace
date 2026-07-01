// Admin panel data API (role ADMIN). Real lists + stats from Postgres.

import { Router } from 'express';
import { prisma } from '../db.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';

export function adminDataRouter(): Router {
  const r = Router();
  r.use(requireAuth, requireRole('ADMIN'));

  r.get('/users', async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { providerProfile: true } });
    res.json({ users: users.map(u => ({
      id: u.id, email: u.email, role: u.role, name: u.name, phone: u.phone,
      businessName: u.providerProfile?.businessName ?? null, verified: u.providerProfile?.verified ?? null,
      createdAt: u.createdAt,
    })) });
  });

  r.get('/projects', async (_req, res) => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }, take: 200,
      include: { _count: { select: { bids: true } }, client: { select: { name: true } } },
    });
    res.json({ projects: projects.map(p => ({
      id: p.id, status: p.status, categoryKey: p.categoryKey, region: p.region,
      priceMedCents: p.priceMedCents, bidCount: p._count.bids, client: p.client.name,
      createdAt: p.createdAt, postedAt: p.postedAt,
    })) });
  });

  r.get('/bids', async (_req, res) => {
    const bids = await prisma.bid.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { provider: { select: { name: true } } } });
    res.json({ bids: bids.map(b => ({ id: b.id, projectId: b.projectId, amountCents: b.amountCents, status: b.status, provider: b.provider.name, createdAt: b.createdAt })) });
  });

  r.get('/stats', async (_req, res) => {
    const [users, providers, projects, posted, matched, bids, appts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'POSTED' } }),
      prisma.project.count({ where: { status: 'MATCHED' } }),
      prisma.bid.count(),
      prisma.appointment.count(),
    ]);
    res.json({ users, providers, projects, postedProjects: posted, matchedProjects: matched, bids, appointments: appts });
  });

  return r;
}
