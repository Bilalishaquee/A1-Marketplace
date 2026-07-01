// Seed high-quality representative US renovation training examples.
// These are realistic benchmark examples for local development and demos.
import { prisma } from '../src/db.ts';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@a1renovations.com').toLowerCase();

const examples = [
  {
    title: 'Los Angeles mid-range kitchen remodel - 185 sqft',
    categoryKey: 'kitchen_remodeling',
    zip: '90012',
    description: 'Completed mid-range kitchen remodel in a 1950s Los Angeles single-family home, approximately 185 sqft. Removed worn laminate counters and stock cabinets, kept the existing appliance layout, upgraded to semi-custom shaker cabinets, quartz countertops, ceramic tile backsplash, LVP flooring, under-cabinet lighting, new sink, faucet, disposal, and code-compliant GFCI outlets. No wall removal or structural work.',
    actualLowCents: 3820000,
    actualMedCents: 4680000,
    actualHighCents: 5890000,
    durationDays: 32,
    materialQuality: 'mid',
    permitsRequired: ['Electrical permit', 'Plumbing permit'],
    qualityScore: 0.96,
    notes: 'Representative US completed-project benchmark. Layout stayed in place; electrical and plumbing were updated in accessible walls.',
    scopeOfWork: [
      { title: 'Demolish cabinets, countertops, backsplash, sink, and flooring' },
      { title: 'Install semi-custom shaker cabinets and soft-close hardware' },
      { title: 'Install quartz countertops with undermount sink cutout' },
      { title: 'Install ceramic tile backsplash and LVP flooring' },
      { title: 'Update sink plumbing, disposal, GFCI outlets, and under-cabinet lighting' },
      { title: 'Paint walls, trim, and final punch list' },
    ],
  },
  {
    title: 'Austin primary bathroom remodel - 85 sqft',
    categoryKey: 'bathroom_remodeling',
    zip: '78704',
    description: 'Completed primary bathroom remodel in Austin, about 85 sqft. Replaced tub with a tiled walk-in shower, added waterproofing system, frameless glass, double vanity, quartz vanity top, porcelain floor tile, recessed medicine cabinets, exhaust fan, new toilet, fixtures, and paint. Existing footprint remained the same and subfloor required minor leveling.',
    actualLowCents: 2860000,
    actualMedCents: 3540000,
    actualHighCents: 4380000,
    durationDays: 24,
    materialQuality: 'mid',
    permitsRequired: ['Plumbing permit'],
    qualityScore: 0.94,
    notes: 'Representative US completed-project benchmark. Strong training case because scope, waterproofing, and finish level were documented.',
    scopeOfWork: [
      { title: 'Demo tub, vanity, toilet, floor tile, and wall tile' },
      { title: 'Repair and level subfloor' },
      { title: 'Install shower waterproofing, mud pan, wall tile, and niche' },
      { title: 'Install double vanity, quartz top, toilet, fan, and fixtures' },
      { title: 'Install frameless shower glass and complete finish painting' },
    ],
  },
  {
    title: 'Chicago basement finishing - 720 sqft',
    categoryKey: 'basement_finishing',
    zip: '60618',
    description: 'Completed basement finish in Chicago, approximately 720 sqft. Added framing, insulation, drywall, recessed lighting, LVP flooring, painted ceiling in utility area, one full bathroom rough-in completion, laundry closet, storage room, and egress-compliant bedroom area. Existing slab was sound; minor moisture mitigation and sump cover upgrades were included.',
    actualLowCents: 6480000,
    actualMedCents: 7920000,
    actualHighCents: 9630000,
    durationDays: 51,
    materialQuality: 'mid',
    permitsRequired: ['Building permit', 'Electrical permit', 'Plumbing permit'],
    qualityScore: 0.95,
    notes: 'Representative US completed-project benchmark. Includes permit-heavy basement scope with clear room count and finish assumptions.',
    scopeOfWork: [
      { title: 'Frame basement rooms, soffits, bathroom, bedroom, and storage areas' },
      { title: 'Install insulation, drywall, tape, texture, and paint' },
      { title: 'Complete bathroom plumbing, vanity, toilet, shower, and tile' },
      { title: 'Install recessed lighting, switches, outlets, and smoke/CO detectors' },
      { title: 'Install LVP flooring, trim, doors, and laundry closet finishes' },
      { title: 'Complete moisture mitigation and final inspections' },
    ],
  },
  {
    title: 'Phoenix roof replacement - 2,150 sqft asphalt shingle',
    categoryKey: 'roofing_services',
    zip: '85016',
    description: 'Completed asphalt shingle roof replacement in Phoenix on a one-story home, approximately 2,150 sqft of roof area. Removed one existing shingle layer, replaced damaged sheathing at valleys, installed synthetic underlayment, drip edge, pipe boots, ridge venting, flashing repairs, and architectural shingles. No structural rafter work required.',
    actualLowCents: 1740000,
    actualMedCents: 2130000,
    actualHighCents: 2680000,
    durationDays: 4,
    materialQuality: 'mid',
    permitsRequired: ['Roofing permit'],
    qualityScore: 0.92,
    notes: 'Representative US completed-project benchmark. Pricing reflects heat-zone labor scheduling and architectural shingles.',
    scopeOfWork: [
      { title: 'Tear off existing asphalt shingle layer and haul debris' },
      { title: 'Replace damaged roof sheathing at valleys and penetrations' },
      { title: 'Install synthetic underlayment, drip edge, pipe boots, and flashing' },
      { title: 'Install architectural shingles and ridge venting' },
      { title: 'Magnet sweep, cleanup, and final roof inspection' },
    ],
  },
  {
    title: 'Denver composite deck rebuild - 360 sqft',
    categoryKey: 'decks_patios_outdoor',
    zip: '80211',
    description: 'Completed backyard deck rebuild in Denver, about 360 sqft with stairs. Removed aging wood deck, reused no framing, poured new concrete footings, built pressure-treated frame, installed composite decking, fascia, aluminum railing, stair treads, and low-voltage post lighting. Attached ledger was flashed and inspected.',
    actualLowCents: 3280000,
    actualMedCents: 3970000,
    actualHighCents: 4820000,
    durationDays: 16,
    materialQuality: 'mid',
    permitsRequired: ['Building permit'],
    qualityScore: 0.93,
    notes: 'Representative US completed-project benchmark. Good scope example for deck framing, railing, stairs, and composite finish.',
    scopeOfWork: [
      { title: 'Demo existing wood deck and dispose of debris' },
      { title: 'Pour new concrete footings and install posts/beams' },
      { title: 'Build pressure-treated joist framing and flashed ledger' },
      { title: 'Install composite deck boards, fascia, stair treads, and railing' },
      { title: 'Install low-voltage post lights and complete inspection punch list' },
    ],
  },
  {
    title: 'Seattle whole-home interior paint and drywall repair',
    categoryKey: 'painting_drywall',
    zip: '98115',
    description: 'Completed interior repaint and drywall repair in a Seattle 3-bedroom home, approximately 1,850 sqft of living area. Patched settlement cracks, repaired water-damaged drywall at two ceilings, skim-coated high-visibility walls, primed repaired areas, painted walls, ceilings, doors, and trim with washable mid-grade paint. Occupied-home protection and phased room turnover included.',
    actualLowCents: 1180000,
    actualMedCents: 1460000,
    actualHighCents: 1890000,
    durationDays: 8,
    materialQuality: 'mid',
    permitsRequired: [],
    qualityScore: 0.91,
    notes: 'Representative US completed-project benchmark. Useful for estimating drywall repair complexity inside a painting job.',
    scopeOfWork: [
      { title: 'Protect floors, furniture, fixtures, and occupied areas' },
      { title: 'Patch drywall cracks, water-damaged ceiling areas, and nail pops' },
      { title: 'Skim coat selected walls, sand, and prime repairs' },
      { title: 'Paint ceilings, walls, doors, casing, and baseboards' },
      { title: 'Final touchups and room-by-room cleanup' },
    ],
  },
  {
    title: 'Miami impact window and exterior door upgrade',
    categoryKey: 'windows_doors',
    zip: '33133',
    description: 'Completed impact-rated window and exterior door replacement in Miami. Replaced 11 aluminum windows and 2 exterior doors with hurricane-impact units, repaired stucco returns, installed flashing and sealants, insulated gaps, trimmed interiors, and coordinated inspection documentation. Openings stayed same size.',
    actualLowCents: 4260000,
    actualMedCents: 5150000,
    actualHighCents: 6380000,
    durationDays: 12,
    materialQuality: 'mid',
    permitsRequired: ['Building permit'],
    qualityScore: 0.94,
    notes: 'Representative US completed-project benchmark. Includes coastal impact-product requirements and inspection workflow.',
    scopeOfWork: [
      { title: 'Remove existing windows and exterior doors' },
      { title: 'Install impact-rated windows and doors in existing openings' },
      { title: 'Flash, seal, insulate, and trim interior/exterior per manufacturer specs' },
      { title: 'Repair stucco returns and complete paint touchups' },
      { title: 'Coordinate product approvals and final building inspection' },
    ],
  },
  {
    title: 'Charlotte exterior siding replacement - fiber cement',
    categoryKey: 'siding_exterior',
    zip: '28205',
    description: 'Completed exterior siding replacement in Charlotte on a two-story home, about 2,050 sqft of wall area. Removed damaged vinyl siding, repaired sheathing at lower walls, installed housewrap, flashing, fiber-cement lap siding, PVC trim at corners and windows, caulked transitions, and painted siding and trim. No structural framing repairs beyond localized rot.',
    actualLowCents: 3420000,
    actualMedCents: 4160000,
    actualHighCents: 5290000,
    durationDays: 18,
    materialQuality: 'mid',
    permitsRequired: ['Building permit'],
    qualityScore: 0.92,
    notes: 'Representative US completed-project benchmark. Captures rot allowance and fiber-cement labor profile.',
    scopeOfWork: [
      { title: 'Remove existing vinyl siding and dispose of debris' },
      { title: 'Repair localized sheathing rot and install housewrap' },
      { title: 'Install flashing, PVC trim, corners, and window trim' },
      { title: 'Install fiber-cement lap siding' },
      { title: 'Caulk, prime, paint siding and trim, and clean site' },
    ],
  },
  {
    title: 'Boston electrical service panel and kitchen circuit upgrade',
    categoryKey: 'electrical_services',
    zip: '02130',
    description: 'Completed electrical upgrade in Boston rowhouse. Replaced outdated 100A panel with 200A service panel, added dedicated kitchen appliance circuits, GFCI/AFCI protection, corrected open junctions, labeled circuits, installed new grounding/bonding, and coordinated utility disconnect/reconnect. Existing walls required limited fishing and patching only.',
    actualLowCents: 980000,
    actualMedCents: 1260000,
    actualHighCents: 1640000,
    durationDays: 5,
    materialQuality: 'mid',
    permitsRequired: ['Electrical permit'],
    qualityScore: 0.93,
    notes: 'Representative US completed-project benchmark. Good electrical-only example with service upgrade and kitchen circuit scope.',
    scopeOfWork: [
      { title: 'Coordinate utility disconnect and service work window' },
      { title: 'Replace 100A panel with 200A panel and updated breakers' },
      { title: 'Install grounding, bonding, AFCI/GFCI protection, and labeling' },
      { title: 'Add dedicated kitchen appliance circuits' },
      { title: 'Correct junction boxes and pass electrical inspection' },
    ],
  },
  {
    title: 'Portland water heater relocation and plumbing refresh',
    categoryKey: 'plumbing_services',
    zip: '97214',
    description: 'Completed plumbing refresh in Portland basement. Relocated gas water heater six feet, replaced corroded galvanized supply runs with PEX in basement-accessible areas, installed shutoff valves, expansion tank, pan, drain routing, pressure reducing valve, and brought venting and seismic strapping up to local code. No slab trenching required.',
    actualLowCents: 820000,
    actualMedCents: 1040000,
    actualHighCents: 1380000,
    durationDays: 4,
    materialQuality: 'mid',
    permitsRequired: ['Plumbing permit'],
    qualityScore: 0.91,
    notes: 'Representative US completed-project benchmark. Useful plumbing example with accessible piping and code upgrades.',
    scopeOfWork: [
      { title: 'Drain and disconnect existing gas water heater' },
      { title: 'Relocate water heater and reconnect gas, water, venting, and drain pan' },
      { title: 'Replace accessible galvanized supply runs with PEX' },
      { title: 'Install shutoff valves, expansion tank, PRV, and seismic strapping' },
      { title: 'Pressure test system and complete plumbing inspection' },
    ],
  },
];

const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!admin) {
  throw new Error(`Admin user not found: ${adminEmail}. Run npm run seed:admin first.`);
}

let created = 0;
let updated = 0;

for (const example of examples) {
  const existing = await prisma.trainingExample.findFirst({
    where: { title: example.title, zip: example.zip },
  });

  const data = {
    uploadedById: admin.id,
    title: example.title,
    categoryKey: example.categoryKey,
    description: example.description,
    zip: example.zip,
    actualLowCents: example.actualLowCents,
    actualMedCents: example.actualMedCents,
    actualHighCents: example.actualHighCents,
    durationDays: example.durationDays,
    scopeOfWork: example.scopeOfWork,
    permitsRequired: example.permitsRequired,
    materialQuality: example.materialQuality,
    notes: example.notes,
    imageKeys: [],
    qualityScore: example.qualityScore,
    status: 'APPROVED' as const,
  };

  if (existing) {
    await prisma.trainingExample.update({ where: { id: existing.id }, data });
    updated += 1;
  } else {
    await prisma.trainingExample.create({ data });
    created += 1;
  }
}

console.log(`Training examples seeded: ${created} created, ${updated} updated`);

await prisma.$disconnect();
