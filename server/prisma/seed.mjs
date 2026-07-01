// One-time seed: creates the admin user so you can log in immediately.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@a1renovations.com'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists (id: ${existing.id}) — skipping.`)
    return
  }
  const passwordHash = await bcrypt.hash('admin12345', 10)
  const user = await prisma.user.create({
    data: { email, name: 'A-1 Admin', passwordHash, role: 'ADMIN' },
  })
  console.log(`✓ Admin user created: ${user.email} / admin12345  (id: ${user.id})`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
