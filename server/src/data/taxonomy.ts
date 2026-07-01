// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL SERVICE TAXONOMY — single source of truth for the whole platform.
//
// Transcribed verbatim from the client's spec:
//   docs/Residential_Home_Service_AI_Model_Training_Guide.pdf
//
// This drives: (1) the AI classification prompt, (2) scope-of-work generation,
// (3) suggested-contractor-category matching, and (4) the category pickers in
// both the web and mobile apps. Both front-ends consume this list (served via
// GET /v1/taxonomy) so categories never drift between AI, web, and mobile.
//
// Designed to extend cleanly for upcoming versions (marketplace matching,
// per-item pricing models, permit rules) — each item line is addressable by a
// stable `{ category, item }` pair.
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceCategoryKey =
  | 'bathroom_remodeling'
  | 'kitchen_remodeling'
  | 'flooring'
  | 'basement_finishing'
  | 'roofing'
  | 'siding_exterior'
  | 'decks_patios_outdoor'
  | 'painting_drywall'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'windows_doors'
  | 'framing_structural'
  | 'masonry_concrete'
  | 'custom_carpentry'
  | 'home_additions'
  | 'smart_home_security'
  | 'landscaping_drainage'
  | 'cleaning_restoration'
  | 'handyman';

export interface ServiceCategory {
  key: ServiceCategoryKey;
  label: string;
  emoji: string;          // used by the mobile/web pickers
  trades: string[];       // suggested contractor categories (PDF output)
  items: string[];        // high-frequency project item lines (verbatim)
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'bathroom_remodeling', label: 'Bathroom Remodeling', emoji: '🚿',
    trades: ['Bathroom remodeler', 'Plumber', 'Tile setter'],
    items: [
      'Full bathroom remodel', 'Tub to shower conversion', 'Walk-in shower installation',
      'Steam shower installation', 'Freestanding tub installation', 'Double vanity installation',
      'Tile shower walls', 'Bathroom floor tile', 'Shower glass enclosure', 'Shower niche installation',
      'Heated bathroom floors', 'Toilet replacement', 'Bathroom waterproofing', 'LED mirror installation',
      'Bathroom fan installation', 'Luxury spa bathroom upgrades', 'ADA accessible bathroom upgrades',
    ],
  },
  {
    key: 'kitchen_remodeling', label: 'Kitchen Remodeling', emoji: '🍳',
    trades: ['Kitchen remodeler', 'Cabinet installer', 'Countertop fabricator', 'Plumber', 'Electrician'],
    items: [
      'Full kitchen remodel', 'Kitchen cabinet installation', 'Cabinet refacing', 'Custom kitchen cabinets',
      'Quartz countertop installation', 'Granite countertop installation', 'Kitchen backsplash',
      'Kitchen island construction', 'Open concept wall removal', 'Pantry construction',
      'Kitchen sink replacement', 'Appliance installation', 'Under cabinet lighting',
      'Range hood installation', 'Kitchen plumbing relocation', 'Kitchen electrical upgrades',
    ],
  },
  {
    key: 'flooring', label: 'Flooring Services', emoji: '🪵',
    trades: ['Flooring installer'],
    items: [
      'Hardwood flooring installation', 'Engineered hardwood flooring', 'Luxury vinyl plank flooring',
      'Laminate flooring', 'Tile flooring installation', 'Carpet installation', 'Floor leveling',
      'Subfloor replacement', 'Hardwood refinishing', 'Stair tread installation', 'Baseboard installation',
      'Radiant heated flooring', 'Floor demolition and disposal', 'Waterproof flooring installation',
    ],
  },
  {
    key: 'basement_finishing', label: 'Basement Finishing', emoji: '🏠',
    trades: ['General contractor', 'Framer', 'Drywaller', 'Waterproofing specialist'],
    items: [
      'Full basement finishing', 'Basement framing', 'Drywall installation', 'Basement bathroom addition',
      'Wet bar installation', 'Home theater room', 'Basement bedroom construction', 'Egress window installation',
      'Drop ceiling installation', 'Basement waterproofing', 'Sump pump installation', 'Basement insulation',
      'Storage room construction', 'Luxury basement remodeling',
    ],
  },
  {
    key: 'roofing', label: 'Roofing Services', emoji: '🏚️',
    trades: ['Roofer', 'Gutter installer'],
    items: [
      'Roof replacement', 'Asphalt shingle roofing', 'Metal roofing installation', 'Flat roofing systems',
      'Roof leak repair', 'Storm damage repair', 'Roof inspection', 'Roof ventilation upgrades',
      'Skylight installation', 'Chimney flashing repair', 'Emergency roof tarping', 'Insurance claim restoration',
      'Gutter installation', 'Gutter guard installation',
    ],
  },
  {
    key: 'siding_exterior', label: 'Siding & Exterior', emoji: '🧱',
    trades: ['Siding contractor', 'Exterior painter'],
    items: [
      'Vinyl siding installation', 'Fiber cement siding', 'Stone veneer installation', 'Exterior trim replacement',
      'House wrap installation', 'Exterior waterproofing', 'Soffit replacement', 'Fascia replacement',
      'Exterior painting', 'Pressure washing', 'Garage door replacement', 'Exterior lighting',
      'Exterior caulking', 'Window trim replacement',
    ],
  },
  {
    key: 'decks_patios_outdoor', label: 'Decks, Patios & Outdoor Living', emoji: '🌿',
    trades: ['Deck builder', 'Hardscape contractor', 'Mason'],
    items: [
      'Deck construction', 'Composite deck installation', 'Wood deck installation', 'Deck repair',
      'Paver patio installation', 'Concrete patio construction', 'Pergola installation', 'Gazebo installation',
      'Outdoor kitchen construction', 'Outdoor fireplace', 'Pool deck renovation', 'Covered patio construction',
      'Outdoor entertainment area',
    ],
  },
  {
    key: 'painting_drywall', label: 'Painting & Drywall', emoji: '🎨',
    trades: ['Painter', 'Drywaller'],
    items: [
      'Interior painting', 'Exterior painting', 'Drywall installation', 'Drywall repair', 'Ceiling repair',
      'Texture matching', 'Popcorn ceiling removal', 'Wallpaper removal', 'Accent wall painting',
      'Cabinet painting', 'Trim painting', 'Garage painting', 'Drywall demolition',
    ],
  },
  {
    key: 'electrical', label: 'Electrical Services', emoji: '⚡',
    trades: ['Licensed electrician'],
    items: [
      'Electrical panel upgrade', 'Whole house rewiring', 'Recessed lighting installation', 'EV charger installation',
      'Ceiling fan installation', 'Outlet replacement', 'Switch replacement', 'Smart home wiring',
      'Landscape lighting', 'Security camera installation', 'Generator hookup', 'Dedicated appliance circuits',
      'Smoke detector installation', 'Electrical troubleshooting',
    ],
  },
  {
    key: 'plumbing', label: 'Plumbing Services', emoji: '🚰',
    trades: ['Licensed plumber'],
    items: [
      'Water heater replacement', 'Tankless water heater installation', 'Pipe replacement', 'Drain line repair',
      'Gas line installation', 'Leak detection', 'Faucet replacement', 'Toilet installation',
      'Garbage disposal installation', 'Bathroom plumbing rough-in', 'Kitchen plumbing relocation',
      'Water filtration systems', 'Sump pump replacement', 'Main water line replacement',
    ],
  },
  {
    key: 'hvac', label: 'HVAC Services', emoji: '🌡️',
    trades: ['HVAC technician'],
    items: [
      'Central AC installation', 'Furnace replacement', 'Heat pump installation', 'Mini split installation',
      'HVAC maintenance', 'Ductwork replacement', 'Thermostat installation', 'Air purification systems',
      'Humidifier installation', 'Boiler replacement', 'Ventilation upgrades', 'Dryer vent cleaning',
      'Emergency HVAC repair',
    ],
  },
  {
    key: 'windows_doors', label: 'Windows & Doors', emoji: '🪟',
    trades: ['Window & door installer'],
    items: [
      'Window replacement', 'Custom window installation', 'Entry door replacement', 'Sliding glass door installation',
      'French door installation', 'Storm door installation', 'Patio door replacement', 'Pocket door installation',
      'Barn door installation', 'Window waterproofing', 'Interior door installation', 'Door hardware upgrades',
    ],
  },
  {
    key: 'framing_structural', label: 'Framing & Structural', emoji: '🏗️',
    trades: ['Structural contractor', 'Framer', 'Structural engineer'],
    items: [
      'Load-bearing wall removal', 'Structural beam installation', 'Basement framing', 'Addition framing',
      'Garage framing', 'Window opening framing', 'Door opening framing', 'Floor joist repair', 'Roof framing',
      'Deck framing', 'Foundation structural repair', 'Header replacement',
    ],
  },
  {
    key: 'masonry_concrete', label: 'Masonry & Concrete', emoji: '🧱',
    trades: ['Mason', 'Concrete contractor'],
    items: [
      'Concrete driveway installation', 'Stamped concrete', 'Concrete repair', 'Retaining wall construction',
      'Brick pointing', 'Stone masonry', 'Concrete walkway installation', 'Concrete steps', 'Chimney repair',
      'Foundation repair', 'Garage slab pouring', 'Masonry waterproofing',
    ],
  },
  {
    key: 'custom_carpentry', label: 'Custom Carpentry & Finish Work', emoji: '🪚',
    trades: ['Finish carpenter', 'Custom carpenter'],
    items: [
      'Custom built-ins', 'Wainscoting installation', 'Board and batten walls', 'Coffered ceilings',
      'Crown molding installation', 'Floating shelves', 'Fireplace surround construction', 'Mudroom construction',
      'Custom closets', 'Entertainment centers', 'Wood wall panels', 'Interior trim work', 'Custom stair railings',
    ],
  },
  {
    key: 'home_additions', label: 'Home Additions & Expansions', emoji: '🏡',
    trades: ['General contractor', 'Structural engineer', 'Framer'],
    items: [
      'Home additions', 'Second story additions', 'Garage additions', 'Sunroom additions', 'Master suite additions',
      'Bathroom additions', 'Kitchen extensions', 'Attic conversions', 'Room conversions', 'Covered porch additions',
      'Mudroom additions',
    ],
  },
  {
    key: 'smart_home_security', label: 'Smart Home & Security', emoji: '📹',
    trades: ['Smart home installer', 'Low-voltage technician'],
    items: [
      'Smart thermostat installation', 'Smart lighting systems', 'Security camera systems', 'Video doorbell installation',
      'Smart lock installation', 'Whole home automation', 'Audio system installation', 'WiFi extender installation',
      'Network wiring', 'Smart garage systems', 'Motion sensor installation',
    ],
  },
  {
    key: 'landscaping_drainage', label: 'Landscaping & Drainage', emoji: '🌳',
    trades: ['Landscaper', 'Drainage specialist'],
    items: [
      'Landscape design', 'French drain installation', 'Drainage correction', 'Retaining wall drainage',
      'Yard grading', 'Sod installation', 'Artificial turf installation', 'Landscape lighting', 'Irrigation systems',
      'Mulching services', 'Garden bed installation', 'Decorative stone installation', 'Erosion control',
    ],
  },
  {
    key: 'cleaning_restoration', label: 'Cleaning, Restoration & Specialty Services', emoji: '🧹',
    trades: ['Restoration specialist', 'Cleaning service', 'Demolition contractor'],
    items: [
      'Water damage restoration', 'Fire damage restoration', 'Mold remediation', 'Post-construction cleaning',
      'Junk removal', 'Demolition services', 'Pressure washing', 'Tile and grout cleaning', 'Air duct cleaning',
      'Carpet cleaning', 'Odor removal', 'Emergency cleanup services',
    ],
  },
  {
    key: 'handyman', label: 'Handyman Services', emoji: '🔧',
    trades: ['Handyman'],
    items: [
      'TV mounting', 'Furniture assembly', 'Curtain rod installation', 'Shelf installation', 'Picture hanging',
      'Door adjustment and repair', 'Lock replacement', 'Drywall patch repair', 'Caulking services',
      'Light fixture replacement', 'Toilet repair', 'Faucet repair', 'Garbage disposal replacement',
      'Minor plumbing repair', 'Minor electrical repair', 'Ceiling fan replacement', 'Deck board replacement',
      'Fence repair', 'Gutter cleaning', 'Power washing', 'Tile repair', 'Cabinet hardware replacement',
      'Weather stripping installation', 'Smoke detector replacement', 'Window screen repair', 'Minor carpentry repair',
      'Closet shelving installation', 'Baby proofing installation', 'Smart device setup', 'General home maintenance',
    ],
  },
];

export const CATEGORY_KEYS = SERVICE_CATEGORIES.map((c) => c.key);

const BY_KEY: Record<string, ServiceCategory> = Object.fromEntries(
  SERVICE_CATEGORIES.map((c) => [c.key, c]),
);

export function categoryByKey(key: string): ServiceCategory | undefined {
  return BY_KEY[key];
}

// Compact view for the AI classification prompt: "key: item1, item2, …".
export function taxonomyPromptList(): string {
  return SERVICE_CATEGORIES
    .map((c) => `- ${c.key} (${c.label}): ${c.items.join(', ')}`)
    .join('\n');
}
