/**
 * Configurable Assumptions
 * Market-tuned defaults for LA real estate development
 *
 * SOURCES (2025):
 * - RSMeans Construction Cost Data 2025
 * - CBRE LA Construction Cost Survey Q4 2024
 * - CoStar Multifamily Construction Cost Index (LA Metro)
 * - Rider Levett Bucknall Q4 2024 Quarterly Cost Report
 * - LA County Building & Safety permit data
 * - Developer interviews and recent project data
 *
 * NOTES ON CONSTRUCTION COSTS:
 * - Type V (wood frame 5-over-1): $300-375/SF for mid-range finishes
 * - Type III (steel/concrete mid-rise): $375-450/SF
 * - Type I (high-rise concrete): $500-600/SF
 * - Prevailing wage projects add ~15-20% to these costs
 * - Premium finishes add ~10-15%
 * - Title 24 energy compliance included in base costs
 * - Costs exclude land, soft costs, and financing
 */

import { MarketArea } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketAssumptions {
  // Revenue
  marketRentPSF: number;              // $/SF/month
  vacancyRate: number;                // 5% = 0.05
  operatingExpenseRatio: number;      // 35% = 0.35

  // Hard Costs by construction type
  hardCostTypeI: number;              // Steel/concrete high-rise
  hardCostTypeIII: number;            // Steel/concrete mid-rise
  hardCostTypeV: number;              // Wood frame (5 over 1, etc.)
  parkingCostSurface: number;         // Per space
  parkingCostPodium: number;          // Per space (1 level)
  parkingCostSubterranean: number;    // Per space

  // Soft Costs
  softCostPercent: number;            // % of hard costs
  architectPercent: number;           // % of hard costs
  permitCostPSF: number;              // Permit fees per SF
  impactFeesPSF: number;              // School fees, park fees, etc.

  // Financing
  constructionLoanRate: number;       // Interest rate
  constructionLoanFee: number;        // Origination fee
  constructionLoanLTC: number;        // Loan to cost
  constructionMonths: number;         // Duration
  permanentLoanRate: number;          // Interest rate
  permanentLoanDSCR: number;          // Debt service coverage
  permanentLoanAmortYears: number;    // Amortization

  // Return Targets
  targetYieldOnCost: number;          // YOC target
  targetUnleveredIRR: number;         // Unlevered IRR
  targetEquityMultiple: number;       // Equity multiple
  targetDevProfitMargin: number;      // Developer profit %

  // Exit
  exitCapRate: number;                // Sale cap rate
  holdPeriodYears: number;            // Investment hold period

  // For-Sale
  salePricePSF: number;               // Condo sale $/SF
  brokerFeePercent: number;           // Sales commission

  // Affordable Housing
  affordableRentDiscount: number;     // Discount vs market for modeling
}

export interface SubmarketConfig {
  name: string;
  description: string;
  marketArea: MarketArea;
  assumptions: MarketAssumptions;
}

// ============================================================================
// LA SUBMARKET PRESETS
// ============================================================================

/**
 * Base LA assumptions (2025)
 */
export const LA_BASE_ASSUMPTIONS: MarketAssumptions = {
  // Revenue
  marketRentPSF: 4.25,
  vacancyRate: 0.05,
  operatingExpenseRatio: 0.35,

  // Hard Costs (2025 LA market - mid-range finishes, non-prevailing wage)
  // Type I: Steel/concrete high-rise (20+ stories)
  hardCostTypeI: 550,
  // Type III: Steel/concrete mid-rise (6-12 stories)
  hardCostTypeIII: 425,
  // Type V: Wood frame podium (5-over-1, 5-over-2)
  hardCostTypeV: 350,
  // Parking costs per space
  parkingCostSurface: 8000,
  parkingCostPodium: 45000,
  parkingCostSubterranean: 75000,

  // Soft Costs (2025 LA) - includes A&E, permits, legal, insurance, etc.
  softCostPercent: 0.25,        // 25% of hard costs typical
  architectPercent: 0.05,
  permitCostPSF: 18,            // LA building permit fees
  impactFeesPSF: 15,            // School fees, park fees, etc. (AHLF separate)

  // Financing (2025 rate environment)
  constructionLoanRate: 0.085,    // SOFR + 350-400bps typical
  constructionLoanFee: 0.0125,    // 1-1.5 points
  constructionLoanLTC: 0.60,      // More conservative post-rate hikes
  constructionMonths: 24,         // Type V podium typical timeline
  permanentLoanRate: 0.0625,      // Agency debt for stabilized multifamily
  permanentLoanDSCR: 1.25,        // Lender requirement
  permanentLoanAmortYears: 35,

  // Return Targets
  targetYieldOnCost: 0.055,
  targetUnleveredIRR: 0.12,
  targetEquityMultiple: 1.8,
  targetDevProfitMargin: 0.15,

  // Exit
  exitCapRate: 0.045,
  holdPeriodYears: 7,

  // For-Sale
  salePricePSF: 850,
  brokerFeePercent: 0.05,

  // Affordable
  affordableRentDiscount: 0.40,  // VLI rents ~40% below market
};

/**
 * West LA / Westside (high-cost market)
 * Premium finishes, higher labor costs, stricter entitlements
 */
export const WESTSIDE_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 5.50,
  hardCostTypeV: 400,      // Premium finishes (+15%)
  hardCostTypeIII: 490,
  hardCostTypeI: 625,
  parkingCostSubterranean: 85000,  // Tighter sites
  targetYieldOnCost: 0.050,
  exitCapRate: 0.040,
  salePricePSF: 1200,
};

/**
 * Hollywood / Central LA
 * Transit-rich, competitive market
 */
export const HOLLYWOOD_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 4.75,
  hardCostTypeV: 365,
  hardCostTypeIII: 445,
  targetYieldOnCost: 0.0525,
  exitCapRate: 0.0425,
  salePricePSF: 950,
};

/**
 * DTLA / Arts District
 * Urban infill, methane mitigation, high-rise potential
 */
export const DTLA_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 4.50,
  hardCostTypeV: 375,      // Higher due to urban constraints, methane
  hardCostTypeIII: 460,
  hardCostTypeI: 575,
  parkingCostSubterranean: 85000,  // Methane mitigation adds cost
  targetYieldOnCost: 0.0525,
  exitCapRate: 0.0425,
  salePricePSF: 1000,
};

/**
 * South LA / Opportunity Zones
 * Lower rents but still LA construction costs, affordable focus
 */
export const SOUTH_LA_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 3.25,
  hardCostTypeV: 325,      // Standard finishes
  hardCostTypeIII: 400,
  parkingCostPodium: 42000,
  targetYieldOnCost: 0.060,
  exitCapRate: 0.050,
  salePricePSF: 600,
};

/**
 * Valley (SFV)
 * More land, surface parking viable, moderate costs
 */
export const VALLEY_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 3.75,
  hardCostTypeV: 335,
  hardCostTypeIII: 410,
  parkingCostPodium: 42000,
  parkingCostSurface: 7000,  // More viable in Valley
  targetYieldOnCost: 0.055,
  exitCapRate: 0.0475,
  salePricePSF: 700,
};

/**
 * Koreatown / Mid-Wilshire
 * High density, transit-oriented, mid-rise predominant
 */
export const KOREATOWN_ASSUMPTIONS: MarketAssumptions = {
  ...LA_BASE_ASSUMPTIONS,
  marketRentPSF: 4.00,
  hardCostTypeV: 360,
  hardCostTypeIII: 440,
  parkingCostSubterranean: 80000,  // Tight lots require subterranean
  targetYieldOnCost: 0.0525,
  exitCapRate: 0.0425,
  salePricePSF: 875,
};

// ============================================================================
// SUBMARKET CONFIGS
// ============================================================================

export const SUBMARKETS: SubmarketConfig[] = [
  {
    name: 'westside',
    description: 'West LA, Santa Monica adjacent, Brentwood, Century City',
    marketArea: MarketArea.HIGH,
    assumptions: WESTSIDE_ASSUMPTIONS,
  },
  {
    name: 'hollywood',
    description: 'Hollywood, Los Feliz, Silver Lake, Echo Park',
    marketArea: MarketArea.HIGH,
    assumptions: HOLLYWOOD_ASSUMPTIONS,
  },
  {
    name: 'dtla',
    description: 'Downtown LA, Arts District, Little Tokyo',
    marketArea: MarketArea.HIGH,
    assumptions: DTLA_ASSUMPTIONS,
  },
  {
    name: 'koreatown',
    description: 'Koreatown, Mid-Wilshire, Miracle Mile',
    marketArea: MarketArea.MEDIUM_HIGH,
    assumptions: KOREATOWN_ASSUMPTIONS,
  },
  {
    name: 'valley',
    description: 'San Fernando Valley, Burbank, NoHo',
    marketArea: MarketArea.MEDIUM,
    assumptions: VALLEY_ASSUMPTIONS,
  },
  {
    name: 'south_la',
    description: 'South LA, Watts, Compton, Opportunity Zones',
    marketArea: MarketArea.LOW,
    assumptions: SOUTH_LA_ASSUMPTIONS,
  },
  {
    name: 'default',
    description: 'LA Metro average',
    marketArea: MarketArea.MEDIUM_HIGH,
    assumptions: LA_BASE_ASSUMPTIONS,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get assumptions for a submarket
 */
export function getSubmarketAssumptions(submarket: string): MarketAssumptions {
  const config = SUBMARKETS.find(s => s.name.toLowerCase() === submarket.toLowerCase());
  return config?.assumptions || LA_BASE_ASSUMPTIONS;
}

/**
 * Get submarket config by name
 */
export function getSubmarketConfig(submarket: string): SubmarketConfig | undefined {
  return SUBMARKETS.find(s => s.name.toLowerCase() === submarket.toLowerCase());
}

/**
 * List available submarkets
 */
export function listSubmarkets(): string[] {
  return SUBMARKETS.map(s => s.name);
}

/**
 * Get hard cost based on building height
 */
export function getHardCostForHeight(
  stories: number,
  assumptions: MarketAssumptions
): number {
  if (stories <= 5) {
    return assumptions.hardCostTypeV;  // Wood frame
  } else if (stories <= 12) {
    return assumptions.hardCostTypeIII;  // Steel/concrete mid-rise
  } else {
    return assumptions.hardCostTypeI;  // High-rise
  }
}

/**
 * Get parking cost based on type
 */
export function getParkingCost(
  type: 'surface' | 'podium' | 'subterranean',
  assumptions: MarketAssumptions
): number {
  switch (type) {
    case 'surface': return assumptions.parkingCostSurface;
    case 'podium': return assumptions.parkingCostPodium;
    case 'subterranean': return assumptions.parkingCostSubterranean;
  }
}

/**
 * Merge custom assumptions with defaults
 */
export function mergeAssumptions(
  base: MarketAssumptions,
  overrides: Partial<MarketAssumptions>
): MarketAssumptions {
  return { ...base, ...overrides };
}

/**
 * Convert MarketAssumptions to FinancialAssumptions format
 */
export function toFinancialAssumptions(market: MarketAssumptions, parkingType: 'surface' | 'podium' | 'subterranean' = 'podium') {
  return {
    marketRentPSF: market.marketRentPSF,
    vacancyRate: market.vacancyRate,
    operatingExpenseRatio: market.operatingExpenseRatio,
    hardCostPSF: market.hardCostTypeV,  // Default to Type V
    parkingCostPerSpace: getParkingCost(parkingType, market),
    softCostPercent: market.softCostPercent,
    constructionLoanRate: market.constructionLoanRate,
    constructionMonths: market.constructionMonths,
    loanToValue: market.constructionLoanLTC,
    targetYieldOnCost: market.targetYieldOnCost,
    targetDevProfitMargin: market.targetDevProfitMargin,
    targetUnleveredIRR: market.targetUnleveredIRR,
    exitCapRate: market.exitCapRate,
    salePricePSF: market.salePricePSF,
    brokerFeePercent: market.brokerFeePercent,
  };
}

/**
 * Print assumptions summary
 */
export function printAssumptionsSummary(assumptions: MarketAssumptions): string {
  return `
Market Assumptions
────────────────────────────────────────
REVENUE
  Market Rent:        $${assumptions.marketRentPSF.toFixed(2)}/SF/mo
  Vacancy:            ${(assumptions.vacancyRate * 100).toFixed(1)}%
  OpEx Ratio:         ${(assumptions.operatingExpenseRatio * 100).toFixed(0)}%

CONSTRUCTION COSTS
  Type V (Wood):      $${assumptions.hardCostTypeV}/SF
  Type III (Mid):     $${assumptions.hardCostTypeIII}/SF
  Type I (High):      $${assumptions.hardCostTypeI}/SF
  Parking (Podium):   $${assumptions.parkingCostPodium.toLocaleString()}/space
  Soft Costs:         ${(assumptions.softCostPercent * 100).toFixed(0)}% of hard

FINANCING
  Construction:       ${(assumptions.constructionLoanRate * 100).toFixed(1)}% @ ${(assumptions.constructionLoanLTC * 100).toFixed(0)}% LTC
  Duration:           ${assumptions.constructionMonths} months
  Permanent:          ${(assumptions.permanentLoanRate * 100).toFixed(2)}%, ${assumptions.permanentLoanAmortYears}yr am

RETURN TARGETS
  Yield on Cost:      ${(assumptions.targetYieldOnCost * 100).toFixed(2)}%
  Dev Profit Margin:  ${(assumptions.targetDevProfitMargin * 100).toFixed(0)}%
  Exit Cap Rate:      ${(assumptions.exitCapRate * 100).toFixed(2)}%

FOR-SALE
  Sale Price:         $${assumptions.salePricePSF}/SF
  Broker Fee:         ${(assumptions.brokerFeePercent * 100).toFixed(1)}%
────────────────────────────────────────`;
}
