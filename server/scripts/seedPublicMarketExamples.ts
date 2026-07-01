// Seed public-market pricing anchors from openly available home-improvement cost
// guides. These are not scraped project listings; they are benchmark ranges used
// to calibrate the estimator and RAG context toward realistic public-market
// expectations.
import { prisma } from '../src/db.ts';
import { embedAndStore } from '../src/ai/rag.ts';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@a1renovations.com').toLowerCase();

const anchors = [
  {
    title: 'Public benchmark - full kitchen remodel common range',
    categoryKey: 'kitchen_remodeling',
    zip: '00000',
    description: 'Public cost-guide benchmark for a common full kitchen remodel with standard layout, stock or semi-custom cabinets, counters, backsplash, flooring, sink, fixtures, and standard electrical/plumbing updates. Public marketplace range used as a non-luxury anchor: approximately $8,219 to $30,220 for common projects, with larger premium work scaling above this.',
    actualLowCents: 821900,
    actualMedCents: 1900000,
    actualHighCents: 3022000,
    durationDays: 28,
    permitsRequired: ['Electrical permit', 'Plumbing permit'],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack full kitchen remodel cost guide and cross-checked against general remodeling cost guides.',
    sourceUrl: 'https://www.thumbtack.com/p/full-kitchen-remodel-cost',
  },
  {
    title: 'Public benchmark - bathroom remodel common range',
    categoryKey: 'bathroom_remodeling',
    zip: '00000',
    description: 'Public cost-guide benchmark for a common bathroom remodel. Includes vanity, toilet, fixtures, flooring, shower/tub surface work, paint, and ordinary plumbing/electrical touchups without assuming luxury spa finishes or major layout changes.',
    actualLowCents: 580900,
    actualMedCents: 1450000,
    actualHighCents: 3000000,
    durationDays: 18,
    permitsRequired: ['Plumbing permit'],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack and Angi bathroom remodel ranges; high-end/luxury work can exceed this when justified by scope.',
    sourceUrl: 'https://www.thumbtack.com/p/bathroom-remodel-cost',
  },
  {
    title: 'Public benchmark - roof replacement common range',
    categoryKey: 'roofing',
    zip: '00000',
    description: 'Public cost-guide benchmark for a standard roof replacement. Includes common asphalt shingle replacement with normal tear-off and ordinary flashing/venting scope. Does not assume slate, tile, structural repairs, or multi-layer tear-off unless specified.',
    actualLowCents: 516400,
    actualMedCents: 950400,
    actualHighCents: 1747700,
    durationDays: 4,
    permitsRequired: ['Roofing permit'],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack roof replacement cost guide.',
    sourceUrl: 'https://www.thumbtack.com/p/roof-replacement-cost',
  },
  {
    title: 'Public benchmark - basement finishing common range',
    categoryKey: 'basement_finishing',
    zip: '00000',
    description: 'Public cost-guide benchmark for finishing a basement with framing, drywall, basic electrical, flooring, paint, and standard finishes. Bathrooms, bars, egress windows, waterproofing, or theater rooms should scale above the common benchmark.',
    actualLowCents: 520500,
    actualMedCents: 1166000,
    actualHighCents: 2464000,
    durationDays: 30,
    permitsRequired: ['Building permit', 'Electrical permit'],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack basement finishing cost guide.',
    sourceUrl: 'https://www.thumbtack.com/p/cost-to-finish-a-basement',
  },
  {
    title: 'Public benchmark - flooring installation common room',
    categoryKey: 'flooring',
    zip: '00000',
    description: 'Public cost-guide benchmark for common flooring installation. A 200 square foot vinyl or laminate room can be around $2,000 depending on floor type, prep, trim, and removal. Larger whole-home or hardwood/tile work should scale upward by area and material.',
    actualLowCents: 120000,
    actualMedCents: 200000,
    actualHighCents: 420000,
    durationDays: 3,
    permitsRequired: [],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack flooring and vinyl/laminate installation cost guides.',
    sourceUrl: 'https://www.thumbtack.com/p/prices-flooring',
  },
  {
    title: 'Public benchmark - interior painting common job',
    categoryKey: 'painting_drywall',
    zip: '00000',
    description: 'Public cost-guide benchmark for interior house painting. Common interior painting jobs are often in the hundreds to low thousands depending on room count, prep, trim, paint quality, and local labor. Whole-home repainting or heavy drywall repair should scale upward.',
    actualLowCents: 60500,
    actualMedCents: 120000,
    actualHighCents: 246400,
    durationDays: 3,
    permitsRequired: [],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack interior house painting cost guide.',
    sourceUrl: 'https://www.thumbtack.com/p/house-painting-cost',
  },
  {
    title: 'Public benchmark - drywall repair common range',
    categoryKey: 'painting_drywall',
    zip: '00000',
    description: 'Public cost-guide benchmark for drywall repair: patching holes, fixing ceiling damage, matching texture, sanding, priming, and repainting the affected area. This should not be priced like full drywall installation unless the description specifies full rooms or extensive wall replacement.',
    actualLowCents: 29400,
    actualMedCents: 51500,
    actualHighCents: 92000,
    durationDays: 1,
    permitsRequired: [],
    materialQuality: 'mid',
    notes: 'Public benchmark based on Thumbtack drywall repair cost guide.',
    sourceUrl: 'https://www.thumbtack.com/p/drywall-repair-cost',
  },
];

const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!admin) throw new Error(`Admin user not found: ${adminEmail}. Run npm run seed:admin first.`);

let created = 0;
let updated = 0;
let embedded = 0;

for (const anchor of anchors) {
  const scopeOfWork = [{ title: anchor.title.replace('Public benchmark - ', '') }];
  const data = {
    uploadedById: admin.id,
    title: anchor.title,
    categoryKey: anchor.categoryKey,
    description: anchor.description,
    zip: anchor.zip,
    actualLowCents: anchor.actualLowCents,
    actualMedCents: anchor.actualMedCents,
    actualHighCents: anchor.actualHighCents,
    durationDays: anchor.durationDays,
    scopeOfWork,
    permitsRequired: anchor.permitsRequired,
    materialQuality: anchor.materialQuality,
    notes: `${anchor.notes} Source: ${anchor.sourceUrl}`,
    imageKeys: [],
    qualityScore: 0.88,
    status: 'APPROVED' as const,
  };
  const existing = await prisma.trainingExample.findFirst({ where: { title: anchor.title } });
  const row = existing
    ? await prisma.trainingExample.update({ where: { id: existing.id }, data })
    : await prisma.trainingExample.create({ data });
  existing ? updated++ : created++;
  if (await embedAndStore(row.id)) embedded++;
}

console.log(`Public market anchors seeded: ${created} created, ${updated} updated, ${embedded} embedded`);
if (embedded < anchors.length) {
  console.warn('Some anchors were saved without embeddings. Check OPENAI_API_KEY, then rerun npm run seed:market.');
}
await prisma.$disconnect();
