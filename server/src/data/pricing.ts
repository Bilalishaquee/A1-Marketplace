// Versioned pricing catalog (TDD §5.3, §6.2).
//
// ═══════════════════════════════════════════════════════════════════════════
//  MARKET-CALIBRATED PRICING — researched from 2025–2026 US cost data.
//  Unit costs below are split into MATERIAL-only ($/unit) and LABOR (hours ×
//  trade rate), calibrated so that (material + labor) reproduces the INSTALLED
//  cost ranges reported by industry sources. National average = baseline;
//  regional multipliers (RSMeans-style) adjust by metro.
//
//  Sources (captured 2026-06; see SOURCES export for the full list):
//   • Labor rates ............ HomeGuide / CountBricks residential labor 2025–26
//   • Cabinets ............... HomeGuide, Angi, Modernize (2025–26)
//   • Countertops ............ Angi, HomeDepot, MSI, AmericanQuartzGranite (2025)
//   • Flooring ............... HomeAdvisor, HomeGuide, ProFlooringInstallers (2025)
//   • Backsplash ............. Angi, HomeAdvisor, Fixr, HomeGuide (2025)
//   • Painting / drywall ..... HomeAdvisor, HomeGuide, Angi (2025)
//   • Roofing ................ HomeGuide, BillRaganRoofing, RoofingCalc (2025)
//   • Mold / water remed. .... BukRestoration, SERVPRO, RoyalRestoration (2025)
//   • Bathroom fixtures ...... Fixr, ThisOldHouse, Homelight (2025)
//   • Regional index ......... RSMeans City Cost Index, Turner & Townsend,
//                              Mortenson, Statista (2025)
//   • Overhead / markup ...... Angi, Buildern, CFMA benchmarks (2025–26)
//
//  ⚠️ Still NOT A-1's own books. These are accurate MARKET medians for the US /
//  LA area and a strong default, but final binding pricing should be reconciled
//  with A-1's actual supplier invoices and crew rates (TDD §0.1 A9). The
//  self-learning loop (§9) calibrates these toward A-1's real outcomes over time.
// ═══════════════════════════════════════════════════════════════════════════

import type { Grade, Trade } from '../types.ts';

export const PRICING_VERSION_ID = 'market-2026-06';

// Billable (loaded) labor rates by trade — $/hour in cents. Billable rates
// include overhead/insurance/tools, so they exceed raw wages. Regional
// multiplier is applied on top at lookup time.
export const LABOR_RATES_CENTS: Record<Trade, number> = {
  demolition: 5000,   // $50/hr — labor/helper crews
  carpentry: 6500,    // $65/hr — cabinet/finish carpentry (billable)
  plumbing: 10000,    // $100/hr — licensed plumber
  electrical: 10000,  // $100/hr — licensed electrician
  tiling: 6500,       // $65/hr — tile setter ($40–80/hr range)
  painting: 5500,     // $55/hr — painter
  flooring: 5500,     // $55/hr — flooring installer
  roofing: 6500,      // $65/hr — roofer
  general: 6000,      // $60/hr — general remodeler
};

// MATERIAL-only unit cost (cents) by canonical ref + grade. Excludes labor.
interface MaterialPrice { unit: string; byGrade: Record<Grade, number>; }

export const MATERIALS: Record<string, MaterialPrice> = {
  // Per cabinet box (engine counts cabinets). Stock $220–500/box installed →
  // material-only by grade below; labor added by template (carpentry hours).
  cabinet_unit:        { unit: 'unit', byGrade: { economy: 25000, mid: 40000, premium: 70000 } },
  // Countertops — material-only $/sqft (installed quartz $50–120, granite $40–100).
  countertop_quartz:   { unit: 'sqft', byGrade: { economy: 4000, mid: 5500, premium: 8000 } },
  countertop_granite:  { unit: 'sqft', byGrade: { economy: 3500, mid: 5000, premium: 7000 } },
  // Backsplash tile material $/sqft (ceramic $1–10, porcelain $3–15, glass $5–30).
  backsplash_tile:     { unit: 'sqft', byGrade: { economy: 800, mid: 1500, premium: 3000 } },
  // Flooring material $/sqft (LVP $2–5, tile $4–16, hardwood $7–20).
  flooring_lvp:        { unit: 'sqft', byGrade: { economy: 250, mid: 400, premium: 600 } },
  flooring_tile:       { unit: 'sqft', byGrade: { economy: 400, mid: 800, premium: 1600 } },
  flooring_hardwood:   { unit: 'sqft', byGrade: { economy: 700, mid: 1100, premium: 2000 } },
  // Paint material $/sqft of wall ($0.60–2.00).
  paint:               { unit: 'sqft', byGrade: { economy: 60, mid: 110, premium: 200 } },
  // Drywall material $/sqft ($0.50–0.80, premium board higher).
  drywall:             { unit: 'sqft', byGrade: { economy: 50, mid: 70, premium: 100 } },
  // Kitchen fixtures & hardware — flat package (pulls, faucet, sink).
  fixtures_hardware:   { unit: 'flat', byGrade: { economy: 20000, mid: 38000, premium: 70000 } },
  // Bathroom fixtures — flat package (toilet, vanity, shower/tub, faucet).
  bath_fixtures:       { unit: 'flat', byGrade: { economy: 180000, mid: 350000, premium: 700000 } },
  // Roofing shingles material $/sqft ($1–2 standard, synthetic higher).
  roof_shingle:        { unit: 'sqft', byGrade: { economy: 150, mid: 250, premium: 500 } },
  // Remediation supplies $/sqft (fungicide, containment, HEPA media; bulk of
  // remediation cost is labor/equipment added by template).
  mold_remediation:    { unit: 'sqft', byGrade: { economy: 400, mid: 600, premium: 1000 } },
};

// ── Regional cost indices — RSMeans methodology (national avg = 1.00) ────────
// Labor and materials are adjusted SEPARATELY (TDD §5.3). Labor swings widely
// by metro (~0.80–1.36) with union presence and cost of living; materials stay
// in a tight band (~0.99–1.08) thanks to national supply chains, widening only
// for remote/island markets (shipping) and dense metros (logistics/access).
// Sources: RSMeans City Cost Index, construction wages by state, materials
// regional-variation reporting (see SOURCES).
export interface RegionIndex { labor: number; material: number; }

// Explicit major-metro indices keyed by 3-digit ZIP prefix.
const METRO_INDEX: Record<string, RegionIndex> = {
  // Northeast / New England
  '021': { labor: 1.28, material: 1.06 }, '022': { labor: 1.28, material: 1.06 }, // Boston
  '024': { labor: 1.24, material: 1.05 }, '010': { labor: 1.12, material: 1.02 }, // W. Mass
  '060': { labor: 1.18, material: 1.03 }, '068': { labor: 1.24, material: 1.05 }, // Hartford/Stamford CT
  '070': { labor: 1.22, material: 1.04 }, '071': { labor: 1.22, material: 1.04 }, // Newark NJ
  '073': { labor: 1.22, material: 1.04 },
  // NY / PA
  '100': { labor: 1.36, material: 1.08 }, '101': { labor: 1.36, material: 1.08 }, // Manhattan
  '102': { labor: 1.36, material: 1.08 }, '104': { labor: 1.35, material: 1.07 },
  '112': { labor: 1.33, material: 1.07 }, '113': { labor: 1.32, material: 1.07 }, // Brooklyn/Queens
  '114': { labor: 1.32, material: 1.07 }, '116': { labor: 1.30, material: 1.06 },
  '142': { labor: 1.05, material: 1.01 }, '152': { labor: 1.05, material: 1.01 }, // Buffalo/Pittsburgh
  '190': { labor: 1.15, material: 1.03 }, '191': { labor: 1.15, material: 1.03 }, // Philadelphia
  // Mid-Atlantic / Southeast
  '200': { labor: 1.12, material: 1.03 }, '202': { labor: 1.12, material: 1.03 }, // DC
  '203': { labor: 1.12, material: 1.03 }, '212': { labor: 1.08, material: 1.02 }, // Baltimore
  '220': { labor: 1.10, material: 1.02 }, '222': { labor: 1.10, material: 1.02 }, // N. Virginia
  '282': { labor: 0.88, material: 0.99 }, '300': { labor: 0.92, material: 0.99 }, // Charlotte/Atlanta
  '303': { labor: 0.92, material: 0.99 }, '352': { labor: 0.80, material: 0.99 }, // Birmingham
  '370': { labor: 0.92, material: 1.00 }, '372': { labor: 0.92, material: 1.00 }, // Nashville
  // Florida
  '320': { labor: 0.88, material: 0.99 }, '328': { labor: 0.90, material: 0.99 }, // Jax/Orlando
  '330': { labor: 0.98, material: 1.01 }, '331': { labor: 0.98, material: 1.01 }, // Miami
  '333': { labor: 0.96, material: 1.01 }, '335': { labor: 0.90, material: 0.99 }, // Tampa
  // Midwest
  '432': { labor: 1.02, material: 1.00 }, '441': { labor: 1.02, material: 1.00 }, // Columbus/Cleveland
  '450': { labor: 1.00, material: 1.00 }, '480': { labor: 1.08, material: 1.01 }, // Cincinnati/Detroit
  '481': { labor: 1.08, material: 1.01 }, '482': { labor: 1.08, material: 1.01 },
  '530': { labor: 1.06, material: 1.01 }, '553': { labor: 1.10, material: 1.01 }, // Milwaukee/Minneapolis
  '554': { labor: 1.10, material: 1.01 }, '601': { labor: 1.22, material: 1.03 }, // Chicago
  '606': { labor: 1.22, material: 1.03 }, '607': { labor: 1.20, material: 1.02 },
  '631': { labor: 1.02, material: 1.00 }, '641': { labor: 0.98, material: 1.00 }, // St Louis/KC
  // South Central
  '700': { labor: 0.88, material: 1.00 }, '730': { labor: 0.84, material: 0.99 }, // New Orleans/OKC
  '750': { labor: 0.92, material: 0.99 }, '752': { labor: 0.92, material: 0.99 }, // Dallas
  '770': { labor: 0.90, material: 0.99 }, '772': { labor: 0.90, material: 0.99 }, // Houston
  '773': { labor: 0.90, material: 0.99 }, '775': { labor: 0.90, material: 0.99 },
  '782': { labor: 0.88, material: 0.99 }, '786': { labor: 0.96, material: 1.00 }, // San Antonio/Austin
  // Mountain / Southwest
  '800': { labor: 1.05, material: 1.02 }, '802': { labor: 1.05, material: 1.02 }, // Denver
  '840': { labor: 0.98, material: 1.02 }, '850': { labor: 0.95, material: 1.01 }, // SLC/Phoenix
  '852': { labor: 0.95, material: 1.01 }, '870': { labor: 0.88, material: 1.02 }, // Albuquerque
  '889': { labor: 1.00, material: 1.02 }, '891': { labor: 1.00, material: 1.02 }, // Las Vegas
  // West Coast / Pacific
  '900': { labor: 1.18, material: 1.03 }, '901': { labor: 1.18, material: 1.03 }, // Los Angeles
  '902': { labor: 1.18, material: 1.03 }, '903': { labor: 1.18, material: 1.03 },
  '904': { labor: 1.18, material: 1.03 }, '905': { labor: 1.17, material: 1.03 },
  '906': { labor: 1.16, material: 1.03 }, '908': { labor: 1.16, material: 1.03 },
  '917': { labor: 1.12, material: 1.02 }, '919': { labor: 1.12, material: 1.03 }, // Inland/San Diego
  '920': { labor: 1.12, material: 1.03 }, '926': { labor: 1.16, material: 1.03 }, // Orange County
  '940': { labor: 1.33, material: 1.07 }, '941': { labor: 1.34, material: 1.07 }, // San Francisco
  '943': { labor: 1.32, material: 1.07 }, '945': { labor: 1.28, material: 1.06 }, // Oakland
  '946': { labor: 1.28, material: 1.06 }, '950': { labor: 1.32, material: 1.07 }, // San Jose
  '951': { labor: 1.32, material: 1.07 }, '952': { labor: 1.05, material: 1.02 }, // Sacramento
  '956': { labor: 1.05, material: 1.02 }, '958': { labor: 1.05, material: 1.02 },
  '970': { labor: 1.10, material: 1.03 }, '972': { labor: 1.10, material: 1.03 }, // Portland OR
  '980': { labor: 1.22, material: 1.04 }, '981': { labor: 1.22, material: 1.04 }, // Seattle
  '982': { labor: 1.20, material: 1.04 }, '967': { labor: 1.25, material: 1.18 }, // Honolulu
  '968': { labor: 1.25, material: 1.18 }, '995': { labor: 1.20, material: 1.20 }, // Alaska
  '997': { labor: 1.20, material: 1.20 },
};

// Coarse fallback by ZIP first digit (broad US region) when a metro isn't listed.
const REGION_FALLBACK: Record<string, RegionIndex> = {
  '0': { labor: 1.15, material: 1.03 }, // New England, NJ, PR
  '1': { labor: 1.10, material: 1.02 }, // NY, PA, DE
  '2': { labor: 0.95, material: 1.00 }, // DC, VA, NC, SC, WV
  '3': { labor: 0.90, material: 0.99 }, // GA, FL, AL, TN, MS
  '4': { labor: 1.00, material: 1.00 }, // OH, IN, KY, MI
  '5': { labor: 1.02, material: 1.01 }, // MN, IA, WI, MT, ND, SD
  '6': { labor: 1.00, material: 1.00 }, // IL, MO, KS, NE
  '7': { labor: 0.90, material: 0.99 }, // TX, OK, AR, LA
  '8': { labor: 0.98, material: 1.02 }, // CO, AZ, UT, NV, NM, ID, WY
  '9': { labor: 1.15, material: 1.05 }, // CA, OR, WA, AK, HI
};

export function regionIndex(zip: string): RegionIndex {
  const p3 = (zip ?? '').slice(0, 3);
  if (METRO_INDEX[p3]) return METRO_INDEX[p3];
  return REGION_FALLBACK[(zip ?? '').slice(0, 1)] ?? { labor: 1, material: 1 };
}

// Back-compat blended display value (labor-weighted) — not used in costing.
export function regionalMultiplier(zip: string): number {
  const r = regionIndex(zip);
  return Math.round((0.6 * r.labor + 0.4 * r.material) * 100) / 100;
}

export function laborRateCents(trade: Trade, zip: string): number {
  return Math.round(LABOR_RATES_CENTS[trade] * regionIndex(zip).labor);
}

export function materialUnitCostCents(ref: string, grade: Grade, zip: string): number {
  const m = MATERIALS[ref];
  if (!m) return 0;
  return Math.round(m.byGrade[grade] * regionIndex(zip).material);
}

// Business config (TDD §5.3). Overhead+profit markup ~20–30% (10-10 rule);
// contingency scales with confidence (§5.4): 8% high-confidence → 20% low.
export const BUSINESS = {
  overheadPct: 0.22,        // overhead + profit
  contingencyMinPct: 0.08,  // high confidence
  contingencyMaxPct: 0.20,  // low confidence
} as const;

// Machine-readable provenance — surfaced via the admin API for auditability and
// kept for the self-learning loop's future recalibration (TDD §9).
export const SOURCES = [
  { category: 'labor_rates', urls: ['https://homeguide.com/costs/kitchen-cabinets-cost', 'https://www.countbricks.com/post/as-of-november-21-2025-the-following-are-the-current-residential-labor-rates-for-construction-workers-in-the-united-states'] },
  { category: 'cabinets', urls: ['https://homeguide.com/costs/kitchen-cabinets-cost', 'https://www.angi.com/articles/custom-cabinets-cost.htm', 'https://modernize.com/kitchen-remodel/cabinets/installation-cost'] },
  { category: 'countertops', urls: ['https://www.angi.com/articles/how-much-do-quartz-countertops-cost.htm', 'https://www.homedepot.com/services/c/cost-install-countertops/6228e49a9'] },
  { category: 'flooring', urls: ['https://www.homeadvisor.com/cost/flooring/install-flooring/', 'https://www.proflooringinstallers.com/flooring-installation-cost-in-2025-complete-pricing-guide/'] },
  { category: 'backsplash', urls: ['https://www.homeadvisor.com/cost/kitchens/tile-backsplash-install/', 'https://www.fixr.com/costs/backsplash-installation', 'https://homeguide.com/costs/backsplash-installation-cost'] },
  { category: 'painting_drywall', urls: ['https://www.homeadvisor.com/cost/painting/paint-a-home-interior/', 'https://homeguide.com/costs/drywall-installation-cost'] },
  { category: 'roofing', urls: ['https://homeguide.com/costs/asphalt-shingle-roof-cost', 'https://www.billraganroofing.com/blog/how-much-does-asphalt-shingle-roof-cost'] },
  { category: 'remediation', urls: ['https://bukrestoration.com/mold-remediation-price/', 'https://www.servpro.com/resources/mold-remediation/cost'] },
  { category: 'bathroom_fixtures', urls: ['https://www.fixr.com/costs/plumbing-bathroom-remodel', 'https://www.thisoldhouse.com/bathrooms/bathroom-remodel-cost'] },
  { category: 'regional_index', urls: ['https://www.rsmeans.com/rsmeans-city-cost-index', 'https://www.turnerandtownsend.com/news/us-cities-most-expensive-places-to-build-globally/'] },
  { category: 'regional_labor_split', urls: ['https://thebirmgroup.com/construction-salaries-by-state-2025-complete-guide-to-wages-across-america/', 'https://roofobservations.com/relative-construction-costs-by-state/'] },
  { category: 'regional_material_variation', urls: ['https://www.procore.com/library/material-price-tracker', 'https://sanhaw.com/blog/89647/understanding-lumber-and-materials-prices-in-april-2025-what-contractors-need-to-know'] },
  { category: 'overhead_markup', urls: ['https://www.angi.com/articles/general-contractor-markup.htm', 'https://buildern.com/resources/blog/general-contractor-markup/'] },
] as const;
