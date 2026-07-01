// Seed an admin account (admins can't self-register via /v1/auth/register).
// Usage: ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npm run seed:admin
import { prisma } from '../src/db.ts';
import { hashPassword } from '../src/auth/passwords.ts';

const email = (process.env.ADMIN_EMAIL || 'admin@a1renovations.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'admin12345';

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log(`Admin already exists: ${email} (role=${existing.role})`);
} else {
  await prisma.user.create({
    data: { email, name: 'A-1 Admin', role: 'ADMIN', passwordHash: await hashPassword(password) },
  });
  console.log(`Created admin: ${email} / ${password}`);
}
await prisma.$disconnect();
