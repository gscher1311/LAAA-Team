/**
 * LA Submarket Rent Data (2025)
 *
 * Market rent assumptions by LA submarket for financial projections
 *
 * Sources:
 * - CoStar Los Angeles Metro Market Report Q4 2024
 * - CBRE LA Multifamily Market View
 * - Axiometrics/RealPage data
 * - LA HCIDLA rent surveys
 *
 * Notes:
 * - Rents shown are Class A/new construction achievable rents
 * - Class B/C properties typically 15-25% below these rates
 * - Transit-adjacent premiums can add 5-15%
 * - Luxury/amenity-rich can add 10-20%
 */

// ============================================================================
// TYPES
// ============================================================================

export enum LASubmarket {
  // Westside
  SANTA_MONICA = 'SANTA_MONICA',
  VENICE = 'VENICE',
  WEST_LA = 'WEST_LA',
  CULVER_CITY = 'CULVER_CITY',
  PLAYA_VISTA = 'PLAYA_VISTA',
  MAR_VISTA = 'MAR_VISTA',
  PALMS = 'PALMS',
  WESTCHESTER = 'WESTCHESTER',

  // Hollywood/Central
  HOLLYWOOD = 'HOLLYWOOD',
  WEST_HOLLYWOOD = 'WEST_HOLLYWOOD',
  KOREATOWN = 'KOREATOWN',
  SILVER_LAKE = 'SILVER_LAKE',
  ECHO_PARK = 'ECHO_PARK',
  LOS_FELIZ = 'LOS_FELIZ',
  MIRACLE_MILE = 'MIRACLE_MILE',
  HANCOCK_PARK = 'HANCOCK_PARK',
  MID_WILSHIRE = 'MID_WILSHIRE',

  // Downtown/East
  DOWNTOWN_LA = 'DOWNTOWN_LA',
  ARTS_DISTRICT = 'ARTS_DISTRICT',
  LITTLE_TOKYO = 'LITTLE_TOKYO',
  CHINATOWN = 'CHINATOWN',
  LINCOLN_HEIGHTS = 'LINCOLN_HEIGHTS',
  BOYLE_HEIGHTS = 'BOYLE_HEIGHTS',
  HIGHLAND_PARK = 'HIGHLAND_PARK',
  EAGLE_ROCK = 'EAGLE_ROCK',
  GLASSELL_PARK = 'GLASSELL_PARK',
  ATWATER_VILLAGE = 'ATWATER_VILLAGE',

  // South LA
  SOUTH_LA = 'SOUTH_LA',
  BALDWIN_HILLS = 'BALDWIN_HILLS',
  LEIMERT_PARK = 'LEIMERT_PARK',
  JEFFERSON_PARK = 'JEFFERSON_PARK',
  EXPOSITION_PARK = 'EXPOSITION_PARK',
  CRENSHAW = 'CRENSHAW',
  INGLEWOOD = 'INGLEWOOD',
  HYDE_PARK = 'HYDE_PARK',
  WATTS = 'WATTS',
  COMPTON = 'COMPTON',

  // San Fernando Valley
  NORTH_HOLLYWOOD = 'NORTH_HOLLYWOOD',
  STUDIO_CITY = 'STUDIO_CITY',
  SHERMAN_OAKS = 'SHERMAN_OAKS',
  ENCINO = 'ENCINO',
  VAN_NUYS = 'VAN_NUYS',
  PANORAMA_CITY = 'PANORAMA_CITY',
  RESEDA = 'RESEDA',
  NORTHRIDGE = 'NORTHRIDGE',
  GRANADA_HILLS = 'GRANADA_HILLS',
  SYLMAR = 'SYLMAR',
  SUN_VALLEY = 'SUN_VALLEY',
  BURBANK = 'BURBANK',
  GLENDALE = 'GLENDALE',
  PASADENA = 'PASADENA',

  // Harbor/South Bay (LA City portions)
  SAN_PEDRO = 'SAN_PEDRO',
  WILMINGTON = 'WILMINGTON',
  HARBOR_GATEWAY = 'HARBOR_GATEWAY',

  // Default/Unknown
  LA_CITYWIDE = 'LA_CITYWIDE'
}

export interface SubmarketRentData {
  submarket: LASubmarket;
  name: string;
  rentPSF: number;              // Monthly rent per SF (Class A new construction)
  rentPSFClassB: number;        // Class B (older/repositioned)
  avgUnitSizeSF: number;        // Typical unit size in market
  vacancyRate: number;          // Current market vacancy
  rentGrowthYoY: number;        // Year-over-year rent growth
  capRate: number;              // Market cap rate for stabilized assets
  transitPremium: number;       // % premium for transit-adjacent
  notes: string;
}

export interface RentsByUnitType {
  studio: number;
  oneBR: number;
  twoBR: number;
  threeBR: number;
}

// ============================================================================
// SUBMARKET RENT DATA (Q4 2024 / 2025 Projections)
// ============================================================================

export const SUBMARKET_RENTS: Record<LASubmarket, SubmarketRentData> = {
  // =========================================================================
  // WESTSIDE - Highest rents in LA
  // =========================================================================
  [LASubmarket.SANTA_MONICA]: {
    submarket: LASubmarket.SANTA_MONICA,
    name: 'Santa Monica',
    rentPSF: 5.25,
    rentPSFClassB: 4.20,
    avgUnitSizeSF: 750,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.040,
    transitPremium: 0.08,
    notes: 'Premium coastal market. Expo Line access. Strict rent control on older units.'
  },
  [LASubmarket.VENICE]: {
    submarket: LASubmarket.VENICE,
    name: 'Venice',
    rentPSF: 5.50,
    rentPSFClassB: 4.40,
    avgUnitSizeSF: 720,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.025,
    capRate: 0.038,
    transitPremium: 0.05,
    notes: 'Tech hub (Silicon Beach). High demand from young professionals.'
  },
  [LASubmarket.WEST_LA]: {
    submarket: LASubmarket.WEST_LA,
    name: 'West LA',
    rentPSF: 4.50,
    rentPSFClassB: 3.60,
    avgUnitSizeSF: 780,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.035,
    capRate: 0.042,
    transitPremium: 0.10,
    notes: 'Near UCLA and Century City. Good transit access.'
  },
  [LASubmarket.CULVER_CITY]: {
    submarket: LASubmarket.CULVER_CITY,
    name: 'Culver City',
    rentPSF: 4.75,
    rentPSFClassB: 3.80,
    avgUnitSizeSF: 750,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.042,
    transitPremium: 0.12,
    notes: 'Tech/entertainment hub. Expo Line. Significant new supply.'
  },
  [LASubmarket.PLAYA_VISTA]: {
    submarket: LASubmarket.PLAYA_VISTA,
    name: 'Playa Vista',
    rentPSF: 4.85,
    rentPSFClassB: 3.90,
    avgUnitSizeSF: 820,
    vacancyRate: 0.06,
    rentGrowthYoY: 0.03,
    capRate: 0.043,
    transitPremium: 0.05,
    notes: 'Master-planned tech campus. Limited transit access.'
  },
  [LASubmarket.MAR_VISTA]: {
    submarket: LASubmarket.MAR_VISTA,
    name: 'Mar Vista',
    rentPSF: 4.00,
    rentPSFClassB: 3.20,
    avgUnitSizeSF: 780,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.04,
    capRate: 0.044,
    transitPremium: 0.08,
    notes: 'Gentrifying Westside neighborhood. Good value relative to nearby.'
  },
  [LASubmarket.PALMS]: {
    submarket: LASubmarket.PALMS,
    name: 'Palms',
    rentPSF: 4.10,
    rentPSFClassB: 3.30,
    avgUnitSizeSF: 720,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.04,
    capRate: 0.044,
    transitPremium: 0.10,
    notes: 'Dense residential. Expo Line access. Young professional demographic.'
  },
  [LASubmarket.WESTCHESTER]: {
    submarket: LASubmarket.WESTCHESTER,
    name: 'Westchester',
    rentPSF: 3.50,
    rentPSFClassB: 2.80,
    avgUnitSizeSF: 850,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.03,
    capRate: 0.046,
    transitPremium: 0.05,
    notes: 'Near LAX. More suburban feel. Family-oriented.'
  },

  // =========================================================================
  // HOLLYWOOD / CENTRAL LA
  // =========================================================================
  [LASubmarket.HOLLYWOOD]: {
    submarket: LASubmarket.HOLLYWOOD,
    name: 'Hollywood',
    rentPSF: 4.25,
    rentPSFClassB: 3.40,
    avgUnitSizeSF: 680,
    vacancyRate: 0.055,
    rentGrowthYoY: 0.035,
    capRate: 0.044,
    transitPremium: 0.12,
    notes: 'Entertainment hub. Red Line access. Significant new development.'
  },
  [LASubmarket.WEST_HOLLYWOOD]: {
    submarket: LASubmarket.WEST_HOLLYWOOD,
    name: 'West Hollywood',
    rentPSF: 4.75,
    rentPSFClassB: 3.80,
    avgUnitSizeSF: 720,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.042,
    transitPremium: 0.08,
    notes: 'Separate city but adjacent. Strong retail/nightlife amenities.'
  },
  [LASubmarket.KOREATOWN]: {
    submarket: LASubmarket.KOREATOWN,
    name: 'Koreatown',
    rentPSF: 3.75,
    rentPSFClassB: 3.00,
    avgUnitSizeSF: 680,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.045,
    capRate: 0.045,
    transitPremium: 0.15,
    notes: 'Dense urban. Purple/Red Line. High development activity. RSO prevalent.'
  },
  [LASubmarket.SILVER_LAKE]: {
    submarket: LASubmarket.SILVER_LAKE,
    name: 'Silver Lake',
    rentPSF: 4.00,
    rentPSFClassB: 3.20,
    avgUnitSizeSF: 750,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.044,
    transitPremium: 0.08,
    notes: 'Hip/gentrified. Limited transit but near Red Line.'
  },
  [LASubmarket.ECHO_PARK]: {
    submarket: LASubmarket.ECHO_PARK,
    name: 'Echo Park',
    rentPSF: 3.60,
    rentPSFClassB: 2.90,
    avgUnitSizeSF: 720,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.04,
    capRate: 0.046,
    transitPremium: 0.10,
    notes: 'Gentrifying. Historic neighborhood feel. RSO restrictions.'
  },
  [LASubmarket.LOS_FELIZ]: {
    submarket: LASubmarket.LOS_FELIZ,
    name: 'Los Feliz',
    rentPSF: 4.25,
    rentPSFClassB: 3.40,
    avgUnitSizeSF: 780,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.03,
    capRate: 0.043,
    transitPremium: 0.08,
    notes: 'Affluent. Near Griffith Park. Red Line access. Limited development sites.'
  },
  [LASubmarket.MIRACLE_MILE]: {
    submarket: LASubmarket.MIRACLE_MILE,
    name: 'Miracle Mile',
    rentPSF: 4.00,
    rentPSFClassB: 3.20,
    avgUnitSizeSF: 750,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.04,
    capRate: 0.044,
    transitPremium: 0.15,
    notes: 'Purple Line extension impact. Museum Row. Significant new development.'
  },
  [LASubmarket.HANCOCK_PARK]: {
    submarket: LASubmarket.HANCOCK_PARK,
    name: 'Hancock Park',
    rentPSF: 4.50,
    rentPSFClassB: 3.60,
    avgUnitSizeSF: 850,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.025,
    capRate: 0.042,
    transitPremium: 0.05,
    notes: 'Historic single-family. Limited multifamily opportunities. HPOZ.'
  },
  [LASubmarket.MID_WILSHIRE]: {
    submarket: LASubmarket.MID_WILSHIRE,
    name: 'Mid-Wilshire',
    rentPSF: 3.85,
    rentPSFClassB: 3.10,
    avgUnitSizeSF: 720,
    vacancyRate: 0.055,
    rentGrowthYoY: 0.04,
    capRate: 0.045,
    transitPremium: 0.12,
    notes: 'Purple Line construction. Mix of old and new stock.'
  },

  // =========================================================================
  // DOWNTOWN / EAST LA
  // =========================================================================
  [LASubmarket.DOWNTOWN_LA]: {
    submarket: LASubmarket.DOWNTOWN_LA,
    name: 'Downtown LA',
    rentPSF: 4.00,
    rentPSFClassB: 3.20,
    avgUnitSizeSF: 700,
    vacancyRate: 0.08,
    rentGrowthYoY: 0.02,
    capRate: 0.045,
    transitPremium: 0.05,
    notes: 'Transit hub. High supply. Elevated vacancy from oversupply. Office conversion opportunities.'
  },
  [LASubmarket.ARTS_DISTRICT]: {
    submarket: LASubmarket.ARTS_DISTRICT,
    name: 'Arts District',
    rentPSF: 4.25,
    rentPSFClassB: 3.40,
    avgUnitSizeSF: 750,
    vacancyRate: 0.07,
    rentGrowthYoY: 0.025,
    capRate: 0.044,
    transitPremium: 0.08,
    notes: 'Creative class demographic. Adaptive reuse opportunities. Gold Line adjacent.'
  },
  [LASubmarket.LITTLE_TOKYO]: {
    submarket: LASubmarket.LITTLE_TOKYO,
    name: 'Little Tokyo',
    rentPSF: 3.80,
    rentPSFClassB: 3.05,
    avgUnitSizeSF: 680,
    vacancyRate: 0.06,
    rentGrowthYoY: 0.03,
    capRate: 0.045,
    transitPremium: 0.10,
    notes: 'Historic district. Gold Line access. Cultural amenities.'
  },
  [LASubmarket.CHINATOWN]: {
    submarket: LASubmarket.CHINATOWN,
    name: 'Chinatown',
    rentPSF: 3.40,
    rentPSFClassB: 2.70,
    avgUnitSizeSF: 700,
    vacancyRate: 0.055,
    rentGrowthYoY: 0.04,
    capRate: 0.047,
    transitPremium: 0.12,
    notes: 'Gold Line station. Gentrification concerns. Cultural preservation.'
  },
  [LASubmarket.LINCOLN_HEIGHTS]: {
    submarket: LASubmarket.LINCOLN_HEIGHTS,
    name: 'Lincoln Heights',
    rentPSF: 2.90,
    rentPSFClassB: 2.30,
    avgUnitSizeSF: 750,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.05,
    capRate: 0.050,
    transitPremium: 0.12,
    notes: 'Emerging market. Gold Line access. Strong rent growth potential.'
  },
  [LASubmarket.BOYLE_HEIGHTS]: {
    submarket: LASubmarket.BOYLE_HEIGHTS,
    name: 'Boyle Heights',
    rentPSF: 2.60,
    rentPSFClassB: 2.10,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.052,
    transitPremium: 0.10,
    notes: 'Gold Line stations. Anti-gentrification activism. Lower rent ceiling.'
  },
  [LASubmarket.HIGHLAND_PARK]: {
    submarket: LASubmarket.HIGHLAND_PARK,
    name: 'Highland Park',
    rentPSF: 3.40,
    rentPSFClassB: 2.70,
    avgUnitSizeSF: 750,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.035,
    capRate: 0.046,
    transitPremium: 0.12,
    notes: 'Gentrified. Gold Line. Walkable retail. Young professional.'
  },
  [LASubmarket.EAGLE_ROCK]: {
    submarket: LASubmarket.EAGLE_ROCK,
    name: 'Eagle Rock',
    rentPSF: 3.20,
    rentPSFClassB: 2.55,
    avgUnitSizeSF: 800,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.03,
    capRate: 0.046,
    transitPremium: 0.08,
    notes: 'Family-oriented. Near Occidental College. Limited transit.'
  },
  [LASubmarket.GLASSELL_PARK]: {
    submarket: LASubmarket.GLASSELL_PARK,
    name: 'Glassell Park',
    rentPSF: 3.00,
    rentPSFClassB: 2.40,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.045,
    capRate: 0.048,
    transitPremium: 0.10,
    notes: 'Emerging. Spillover from Highland Park. Limited commercial amenities.'
  },
  [LASubmarket.ATWATER_VILLAGE]: {
    submarket: LASubmarket.ATWATER_VILLAGE,
    name: 'Atwater Village',
    rentPSF: 3.50,
    rentPSFClassB: 2.80,
    avgUnitSizeSF: 750,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.035,
    capRate: 0.045,
    transitPremium: 0.08,
    notes: 'Trendy/walkable. LA River adjacent. Limited development sites.'
  },

  // =========================================================================
  // SOUTH LA
  // =========================================================================
  [LASubmarket.SOUTH_LA]: {
    submarket: LASubmarket.SOUTH_LA,
    name: 'South LA (General)',
    rentPSF: 2.40,
    rentPSFClassB: 1.90,
    avgUnitSizeSF: 820,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.05,
    capRate: 0.055,
    transitPremium: 0.12,
    notes: 'Affordable housing focus. Strong demand. Limited new Class A supply.'
  },
  [LASubmarket.BALDWIN_HILLS]: {
    submarket: LASubmarket.BALDWIN_HILLS,
    name: 'Baldwin Hills',
    rentPSF: 3.00,
    rentPSFClassB: 2.40,
    avgUnitSizeSF: 850,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.050,
    transitPremium: 0.10,
    notes: 'Affluent African-American community. Crenshaw Line impact.'
  },
  [LASubmarket.LEIMERT_PARK]: {
    submarket: LASubmarket.LEIMERT_PARK,
    name: 'Leimert Park',
    rentPSF: 2.80,
    rentPSFClassB: 2.25,
    avgUnitSizeSF: 820,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.05,
    capRate: 0.052,
    transitPremium: 0.15,
    notes: 'Cultural hub. Crenshaw Line station. Significant development interest.'
  },
  [LASubmarket.JEFFERSON_PARK]: {
    submarket: LASubmarket.JEFFERSON_PARK,
    name: 'Jefferson Park',
    rentPSF: 2.70,
    rentPSFClassB: 2.15,
    avgUnitSizeSF: 800,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.05,
    capRate: 0.052,
    transitPremium: 0.12,
    notes: 'Emerging. Near USC. Expo Line access.'
  },
  [LASubmarket.EXPOSITION_PARK]: {
    submarket: LASubmarket.EXPOSITION_PARK,
    name: 'Exposition Park',
    rentPSF: 2.90,
    rentPSFClassB: 2.30,
    avgUnitSizeSF: 750,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.04,
    capRate: 0.050,
    transitPremium: 0.12,
    notes: 'USC adjacent. Expo Line. Student housing demand.'
  },
  [LASubmarket.CRENSHAW]: {
    submarket: LASubmarket.CRENSHAW,
    name: 'Crenshaw',
    rentPSF: 2.50,
    rentPSFClassB: 2.00,
    avgUnitSizeSF: 820,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.055,
    capRate: 0.054,
    transitPremium: 0.15,
    notes: 'Crenshaw Line opening 2025. Strong growth potential. Gentrification debate.'
  },
  [LASubmarket.INGLEWOOD]: {
    submarket: LASubmarket.INGLEWOOD,
    name: 'Inglewood',
    rentPSF: 2.80,
    rentPSFClassB: 2.25,
    avgUnitSizeSF: 800,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.06,
    capRate: 0.050,
    transitPremium: 0.15,
    notes: 'Separate city. SoFi Stadium/Intuit Dome impact. K Line access. Hot market.'
  },
  [LASubmarket.HYDE_PARK]: {
    submarket: LASubmarket.HYDE_PARK,
    name: 'Hyde Park',
    rentPSF: 2.40,
    rentPSFClassB: 1.90,
    avgUnitSizeSF: 820,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.05,
    capRate: 0.054,
    transitPremium: 0.12,
    notes: 'Working class. Near Crenshaw Line. Affordable focus.'
  },
  [LASubmarket.WATTS]: {
    submarket: LASubmarket.WATTS,
    name: 'Watts',
    rentPSF: 2.10,
    rentPSFClassB: 1.70,
    avgUnitSizeSF: 850,
    vacancyRate: 0.035,
    rentGrowthYoY: 0.04,
    capRate: 0.058,
    transitPremium: 0.10,
    notes: 'Blue Line access. Affordable housing focus. Limited Class A.'
  },
  [LASubmarket.COMPTON]: {
    submarket: LASubmarket.COMPTON,
    name: 'Compton',
    rentPSF: 2.00,
    rentPSFClassB: 1.60,
    avgUnitSizeSF: 880,
    vacancyRate: 0.035,
    rentGrowthYoY: 0.04,
    capRate: 0.060,
    transitPremium: 0.10,
    notes: 'Separate city. Blue Line. Affordable focus. Revitalization efforts.'
  },

  // =========================================================================
  // SAN FERNANDO VALLEY
  // =========================================================================
  [LASubmarket.NORTH_HOLLYWOOD]: {
    submarket: LASubmarket.NORTH_HOLLYWOOD,
    name: 'North Hollywood',
    rentPSF: 3.40,
    rentPSFClassB: 2.70,
    avgUnitSizeSF: 720,
    vacancyRate: 0.055,
    rentGrowthYoY: 0.04,
    capRate: 0.046,
    transitPremium: 0.15,
    notes: 'Red/Orange Line hub. NoHo Arts District. Major development activity.'
  },
  [LASubmarket.STUDIO_CITY]: {
    submarket: LASubmarket.STUDIO_CITY,
    name: 'Studio City',
    rentPSF: 3.80,
    rentPSFClassB: 3.05,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.044,
    transitPremium: 0.08,
    notes: 'Affluent Valley. Near studios. Good schools. Limited multifamily zoning.'
  },
  [LASubmarket.SHERMAN_OAKS]: {
    submarket: LASubmarket.SHERMAN_OAKS,
    name: 'Sherman Oaks',
    rentPSF: 3.60,
    rentPSFClassB: 2.90,
    avgUnitSizeSF: 800,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.044,
    transitPremium: 0.05,
    notes: 'Upper-middle class Valley. Ventura Blvd retail. Orange Line access.'
  },
  [LASubmarket.ENCINO]: {
    submarket: LASubmarket.ENCINO,
    name: 'Encino',
    rentPSF: 3.75,
    rentPSFClassB: 3.00,
    avgUnitSizeSF: 850,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.025,
    capRate: 0.043,
    transitPremium: 0.05,
    notes: 'Affluent. Family-oriented. Limited multifamily opportunities.'
  },
  [LASubmarket.VAN_NUYS]: {
    submarket: LASubmarket.VAN_NUYS,
    name: 'Van Nuys',
    rentPSF: 2.90,
    rentPSFClassB: 2.30,
    avgUnitSizeSF: 750,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.045,
    capRate: 0.048,
    transitPremium: 0.12,
    notes: 'Orange Line. Workforce housing. Good development opportunities.'
  },
  [LASubmarket.PANORAMA_CITY]: {
    submarket: LASubmarket.PANORAMA_CITY,
    name: 'Panorama City',
    rentPSF: 2.50,
    rentPSFClassB: 2.00,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.050,
    transitPremium: 0.10,
    notes: 'Workforce housing. Major retail center. Limited Class A.'
  },
  [LASubmarket.RESEDA]: {
    submarket: LASubmarket.RESEDA,
    name: 'Reseda',
    rentPSF: 2.70,
    rentPSFClassB: 2.15,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.048,
    transitPremium: 0.10,
    notes: 'Orange Line stations. Workforce housing. Development opportunities.'
  },
  [LASubmarket.NORTHRIDGE]: {
    submarket: LASubmarket.NORTHRIDGE,
    name: 'Northridge',
    rentPSF: 2.80,
    rentPSFClassB: 2.25,
    avgUnitSizeSF: 820,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.035,
    capRate: 0.047,
    transitPremium: 0.08,
    notes: 'CSUN nearby. More suburban. Family-oriented.'
  },
  [LASubmarket.GRANADA_HILLS]: {
    submarket: LASubmarket.GRANADA_HILLS,
    name: 'Granada Hills',
    rentPSF: 2.85,
    rentPSFClassB: 2.30,
    avgUnitSizeSF: 850,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.03,
    capRate: 0.046,
    transitPremium: 0.05,
    notes: 'Suburban Valley. Good schools. Limited multifamily.'
  },
  [LASubmarket.SYLMAR]: {
    submarket: LASubmarket.SYLMAR,
    name: 'Sylmar',
    rentPSF: 2.50,
    rentPSFClassB: 2.00,
    avgUnitSizeSF: 850,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.035,
    capRate: 0.050,
    transitPremium: 0.08,
    notes: 'Metrolink station. Edge of LA. More affordable.'
  },
  [LASubmarket.SUN_VALLEY]: {
    submarket: LASubmarket.SUN_VALLEY,
    name: 'Sun Valley',
    rentPSF: 2.40,
    rentPSFClassB: 1.90,
    avgUnitSizeSF: 800,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.052,
    transitPremium: 0.08,
    notes: 'Industrial area transitioning. Workforce housing.'
  },
  [LASubmarket.BURBANK]: {
    submarket: LASubmarket.BURBANK,
    name: 'Burbank',
    rentPSF: 3.50,
    rentPSFClassB: 2.80,
    avgUnitSizeSF: 750,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.035,
    capRate: 0.045,
    transitPremium: 0.10,
    notes: 'Separate city. Entertainment industry. Metrolink. Strong employment.'
  },
  [LASubmarket.GLENDALE]: {
    submarket: LASubmarket.GLENDALE,
    name: 'Glendale',
    rentPSF: 3.40,
    rentPSFClassB: 2.70,
    avgUnitSizeSF: 780,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.03,
    capRate: 0.045,
    transitPremium: 0.08,
    notes: 'Separate city. Urban downtown. Good schools. Armenian community.'
  },
  [LASubmarket.PASADENA]: {
    submarket: LASubmarket.PASADENA,
    name: 'Pasadena',
    rentPSF: 3.60,
    rentPSFClassB: 2.90,
    avgUnitSizeSF: 780,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.03,
    capRate: 0.044,
    transitPremium: 0.10,
    notes: 'Separate city. Gold Line. Old Town. Tech/biotech employment. Caltech/JPL.'
  },

  // =========================================================================
  // HARBOR / SOUTH BAY (LA City Portions)
  // =========================================================================
  [LASubmarket.SAN_PEDRO]: {
    submarket: LASubmarket.SAN_PEDRO,
    name: 'San Pedro',
    rentPSF: 2.60,
    rentPSFClassB: 2.10,
    avgUnitSizeSF: 800,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.035,
    capRate: 0.050,
    transitPremium: 0.08,
    notes: 'Port adjacent. Revitalization efforts. Waterfront development.'
  },
  [LASubmarket.WILMINGTON]: {
    submarket: LASubmarket.WILMINGTON,
    name: 'Wilmington',
    rentPSF: 2.30,
    rentPSFClassB: 1.85,
    avgUnitSizeSF: 850,
    vacancyRate: 0.04,
    rentGrowthYoY: 0.04,
    capRate: 0.054,
    transitPremium: 0.10,
    notes: 'Port industrial. Workforce housing. Environmental concerns.'
  },
  [LASubmarket.HARBOR_GATEWAY]: {
    submarket: LASubmarket.HARBOR_GATEWAY,
    name: 'Harbor Gateway',
    rentPSF: 2.40,
    rentPSFClassB: 1.90,
    avgUnitSizeSF: 820,
    vacancyRate: 0.045,
    rentGrowthYoY: 0.04,
    capRate: 0.052,
    transitPremium: 0.10,
    notes: 'Blue Line access. Industrial/commercial mix. Transitioning.'
  },

  // =========================================================================
  // DEFAULT / CITYWIDE
  // =========================================================================
  [LASubmarket.LA_CITYWIDE]: {
    submarket: LASubmarket.LA_CITYWIDE,
    name: 'LA Citywide Average',
    rentPSF: 3.25,
    rentPSFClassB: 2.60,
    avgUnitSizeSF: 750,
    vacancyRate: 0.05,
    rentGrowthYoY: 0.035,
    capRate: 0.046,
    transitPremium: 0.10,
    notes: 'Citywide average. Use specific submarket data when available.'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get rent data for a submarket
 */
export function getSubmarketRents(submarket: LASubmarket): SubmarketRentData {
  return SUBMARKET_RENTS[submarket] ?? SUBMARKET_RENTS[LASubmarket.LA_CITYWIDE];
}

/**
 * Get monthly rent PSF with optional transit premium
 */
export function getRentPSF(
  submarket: LASubmarket,
  nearTransit: boolean = false,
  classA: boolean = true
): number {
  const data = getSubmarketRents(submarket);
  let rent = classA ? data.rentPSF : data.rentPSFClassB;

  if (nearTransit) {
    rent *= (1 + data.transitPremium);
  }

  return Math.round(rent * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate achievable rents by unit type for a submarket
 */
export function getSubmarketRentsByUnitType(
  submarket: LASubmarket,
  nearTransit: boolean = false
): RentsByUnitType {
  const rentPSF = getRentPSF(submarket, nearTransit);

  // Standard unit sizes for LA market
  const unitSizes = {
    studio: 500,
    oneBR: 680,
    twoBR: 950,
    threeBR: 1200
  };

  return {
    studio: Math.round(rentPSF * unitSizes.studio),
    oneBR: Math.round(rentPSF * unitSizes.oneBR),
    twoBR: Math.round(rentPSF * unitSizes.twoBR),
    threeBR: Math.round(rentPSF * unitSizes.threeBR)
  };
}

/**
 * Get cap rate for a submarket
 */
export function getSubmarketCapRate(submarket: LASubmarket): number {
  return getSubmarketRents(submarket).capRate;
}

/**
 * Identify submarket from address/neighborhood string
 * Returns LA_CITYWIDE if no match found
 */
export function identifySubmarket(address: string): LASubmarket {
  const normalized = address.toUpperCase();

  // Direct matches
  const submarketPatterns: [RegExp, LASubmarket][] = [
    [/SANTA MONICA/i, LASubmarket.SANTA_MONICA],
    [/VENICE/i, LASubmarket.VENICE],
    [/CULVER CITY/i, LASubmarket.CULVER_CITY],
    [/PLAYA VISTA/i, LASubmarket.PLAYA_VISTA],
    [/MAR VISTA/i, LASubmarket.MAR_VISTA],
    [/PALMS/i, LASubmarket.PALMS],
    [/WESTCHESTER/i, LASubmarket.WESTCHESTER],
    [/WEST LOS ANGELES|WEST LA\b|WESTWOOD/i, LASubmarket.WEST_LA],
    [/HOLLYWOOD(?! NORTH)/i, LASubmarket.HOLLYWOOD],
    [/WEST HOLLYWOOD|WEHO/i, LASubmarket.WEST_HOLLYWOOD],
    [/KOREATOWN|K-TOWN/i, LASubmarket.KOREATOWN],
    [/SILVER LAKE|SILVERLAKE/i, LASubmarket.SILVER_LAKE],
    [/ECHO PARK/i, LASubmarket.ECHO_PARK],
    [/LOS FELIZ/i, LASubmarket.LOS_FELIZ],
    [/MIRACLE MILE/i, LASubmarket.MIRACLE_MILE],
    [/HANCOCK PARK/i, LASubmarket.HANCOCK_PARK],
    [/MID.?WILSHIRE|WILSHIRE CENTER/i, LASubmarket.MID_WILSHIRE],
    [/DOWNTOWN|DTLA\b/i, LASubmarket.DOWNTOWN_LA],
    [/ARTS DISTRICT/i, LASubmarket.ARTS_DISTRICT],
    [/LITTLE TOKYO/i, LASubmarket.LITTLE_TOKYO],
    [/CHINATOWN/i, LASubmarket.CHINATOWN],
    [/LINCOLN HEIGHTS/i, LASubmarket.LINCOLN_HEIGHTS],
    [/BOYLE HEIGHTS/i, LASubmarket.BOYLE_HEIGHTS],
    [/HIGHLAND PARK/i, LASubmarket.HIGHLAND_PARK],
    [/EAGLE ROCK/i, LASubmarket.EAGLE_ROCK],
    [/GLASSELL PARK/i, LASubmarket.GLASSELL_PARK],
    [/ATWATER/i, LASubmarket.ATWATER_VILLAGE],
    [/BALDWIN HILLS/i, LASubmarket.BALDWIN_HILLS],
    [/LEIMERT PARK/i, LASubmarket.LEIMERT_PARK],
    [/JEFFERSON PARK/i, LASubmarket.JEFFERSON_PARK],
    [/EXPOSITION PARK|EXPO PARK/i, LASubmarket.EXPOSITION_PARK],
    [/CRENSHAW/i, LASubmarket.CRENSHAW],
    [/INGLEWOOD/i, LASubmarket.INGLEWOOD],
    [/HYDE PARK/i, LASubmarket.HYDE_PARK],
    [/\bWATTS\b/i, LASubmarket.WATTS],
    [/COMPTON/i, LASubmarket.COMPTON],
    [/NORTH HOLLYWOOD|NOHO/i, LASubmarket.NORTH_HOLLYWOOD],
    [/STUDIO CITY/i, LASubmarket.STUDIO_CITY],
    [/SHERMAN OAKS/i, LASubmarket.SHERMAN_OAKS],
    [/ENCINO/i, LASubmarket.ENCINO],
    [/VAN NUYS/i, LASubmarket.VAN_NUYS],
    [/PANORAMA CITY/i, LASubmarket.PANORAMA_CITY],
    [/RESEDA/i, LASubmarket.RESEDA],
    [/NORTHRIDGE/i, LASubmarket.NORTHRIDGE],
    [/GRANADA HILLS/i, LASubmarket.GRANADA_HILLS],
    [/SYLMAR/i, LASubmarket.SYLMAR],
    [/SUN VALLEY/i, LASubmarket.SUN_VALLEY],
    [/BURBANK/i, LASubmarket.BURBANK],
    [/GLENDALE/i, LASubmarket.GLENDALE],
    [/PASADENA/i, LASubmarket.PASADENA],
    [/SAN PEDRO/i, LASubmarket.SAN_PEDRO],
    [/WILMINGTON/i, LASubmarket.WILMINGTON],
    [/HARBOR GATEWAY/i, LASubmarket.HARBOR_GATEWAY],
    [/SOUTH LA|SOUTH CENTRAL|SOUTH LOS ANGELES/i, LASubmarket.SOUTH_LA],
  ];

  for (const [pattern, submarket] of submarketPatterns) {
    if (pattern.test(normalized)) {
      return submarket;
    }
  }

  // ZIP code fallback (common LA zips)
  const zipPatterns: [RegExp, LASubmarket][] = [
    [/904(01|02|03|04|05)/i, LASubmarket.SANTA_MONICA],  // 90401-90405
    [/90291/i, LASubmarket.VENICE],
    [/90232/i, LASubmarket.CULVER_CITY],
    [/90094/i, LASubmarket.PLAYA_VISTA],
    [/90028|90038|90068/i, LASubmarket.HOLLYWOOD],
    [/90069/i, LASubmarket.WEST_HOLLYWOOD],
    [/90004|90005|90006|90010/i, LASubmarket.KOREATOWN],
    [/90012|90013|90014|90015|90017|90021/i, LASubmarket.DOWNTOWN_LA],
    [/90026/i, LASubmarket.SILVER_LAKE],
    [/91601|91602|91605|91606/i, LASubmarket.NORTH_HOLLYWOOD],
    [/91604/i, LASubmarket.STUDIO_CITY],
    [/91403|91423/i, LASubmarket.SHERMAN_OAKS],
    [/91316|91436/i, LASubmarket.ENCINO],
    [/91401|91405|91406|91411/i, LASubmarket.VAN_NUYS],
  ];

  for (const [pattern, submarket] of zipPatterns) {
    if (pattern.test(normalized)) {
      return submarket;
    }
  }

  return LASubmarket.LA_CITYWIDE;
}

/**
 * Format submarket data for output display
 */
export function formatSubmarketSummary(submarket: LASubmarket, nearTransit: boolean = false): string {
  const data = getSubmarketRents(submarket);
  const rentPSF = getRentPSF(submarket, nearTransit);
  const rents = getSubmarketRentsByUnitType(submarket, nearTransit);

  const lines = [
    `Submarket: ${data.name}`,
    `Market Rent: $${rentPSF.toFixed(2)}/SF/month${nearTransit ? ' (includes transit premium)' : ''}`,
    `Achievable Rents:`,
    `  Studio: $${rents.studio.toLocaleString()}/mo`,
    `  1BR: $${rents.oneBR.toLocaleString()}/mo`,
    `  2BR: $${rents.twoBR.toLocaleString()}/mo`,
    `  3BR: $${rents.threeBR.toLocaleString()}/mo`,
    `Vacancy: ${(data.vacancyRate * 100).toFixed(1)}%`,
    `Cap Rate: ${(data.capRate * 100).toFixed(2)}%`,
    `Rent Growth (YoY): ${(data.rentGrowthYoY * 100).toFixed(1)}%`,
    `Notes: ${data.notes}`
  ];

  return lines.join('\n');
}
