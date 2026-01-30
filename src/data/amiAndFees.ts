/**
 * AMI Tables, Rent Limits, and AHLF Fees
 *
 * SOURCES (2025):
 * - TCAC 2025 Income and Rent Limits: https://www.treasurer.ca.gov/ctcac/2025/supplemental.asp
 * - LAHD 2025 Rent and Income Schedules: https://housing.lacity.gov/wp-content/uploads/2025/07/2025-Income-and-Rent-Schedules.pdf
 * - AHLF Fee Schedule (July 2025): https://planning.lacity.gov/odocument/02d304e1-f3ae-4e58-9437-66630079958e/
 */

import { IncomeLevel, MarketArea, AHLFFees } from '../types';

// ============================================================================
// 2025 AREA MEDIAN INCOME (Los Angeles County)
// Source: California TCAC, HCD State Income Limits 2025
// ============================================================================

export const AMI_2025 = {
  year: 2025,
  percentChangeFromPrior: 8.55,  // Up from 2024
  // State AMI for 4-person household (reference point)
  stateAMI4Person: 106600,
  // HUD/TCAC Income Limits are based on HUD MFI adjusted for high-cost areas
  byHouseholdSize: {
    1: 74600,
    2: 85300,
    3: 95950,
    4: 106600,
    5: 115150,
    6: 123650,
    7: 132200,
    8: 140700,
  },
};

// Household size assumptions by bedroom count (for rent calculations)
// Per TCAC: Studio=1, 1BR=1.5, 2BR=3, 3BR=4.5, 4BR=6
export const HOUSEHOLD_SIZE_BY_BEDROOM = {
  0: 1,   // Studio
  1: 1.5, // 1BR - interpolate between 1 and 2
  2: 3,   // 2BR
  3: 4.5, // 3BR
  4: 6,   // 4BR
};

// ============================================================================
// 2025 INCOME LIMITS BY AMI LEVEL
// Source: TCAC 2025 Income Limits for Los Angeles County
// For projects placed in service on or after 4/1/2025
// ============================================================================

export const INCOME_LIMITS_2025 = {
  year: 2025,
  effectiveDate: '2025-04-01',
  // Based on TCAC published limits
  byLevelAndSize: {
    [IncomeLevel.ELI]: {  // 30% AMI (Extremely Low Income)
      1: 31800,
      2: 36360,
      3: 40890,
      4: 45450,
      5: 49080,
      6: 52710,
      7: 56340,
      8: 60000,
    },
    [IncomeLevel.VLI]: {  // 50% AMI (Very Low Income)
      1: 53000,
      2: 60600,
      3: 68150,
      4: 75750,
      5: 81800,
      6: 87850,
      7: 93900,
      8: 100000,
    },
    [IncomeLevel.LOW]: {  // 60% AMI (Lower Income)
      1: 63600,
      2: 72720,
      3: 81780,
      4: 90900,
      5: 98160,
      6: 105420,
      7: 112680,
      8: 120000,
    },
    [IncomeLevel.LOW_80]: {  // 80% AMI (Low Income)
      1: 84800,
      2: 96960,
      3: 109040,
      4: 121200,
      5: 130880,
      6: 140560,
      7: 150240,
      8: 160000,
    },
    [IncomeLevel.MODERATE]: {  // 120% AMI (Moderate Income)
      1: 89520,
      2: 102240,
      3: 115020,
      4: 127920,
      5: 138180,
      6: 148380,
      7: 158640,
      8: 168840,
    },
  },
};

// ============================================================================
// 2025 MAXIMUM MONTHLY RENT LIMITS
// Source: TCAC 2025 Rent Limits for Los Angeles County
// For projects placed in service on or after 4/1/2025
// Note: Subtract utility allowance from these amounts
// ============================================================================

export const RENT_LIMITS_2025 = {
  year: 2025,
  effectiveDate: '2025-04-01',
  // By bedroom count and income level
  byBedroomAndLevel: {
    0: {  // Studio
      [IncomeLevel.ELI]: 795,
      [IncomeLevel.VLI]: 1325,
      [IncomeLevel.LOW]: 1590,
      [IncomeLevel.LOW_80]: 2120,
      [IncomeLevel.MODERATE]: 2237,
    },
    1: {  // 1BR
      [IncomeLevel.ELI]: 852,
      [IncomeLevel.VLI]: 1420,
      [IncomeLevel.LOW]: 1704,
      [IncomeLevel.LOW_80]: 2272,
      [IncomeLevel.MODERATE]: 2397,
    },
    2: {  // 2BR
      [IncomeLevel.ELI]: 1022,
      [IncomeLevel.VLI]: 1703,
      [IncomeLevel.LOW]: 2044,
      [IncomeLevel.LOW_80]: 2726,
      [IncomeLevel.MODERATE]: 2876,
    },
    3: {  // 3BR
      [IncomeLevel.ELI]: 1181,
      [IncomeLevel.VLI]: 1969,
      [IncomeLevel.LOW]: 2363,
      [IncomeLevel.LOW_80]: 3150,
      [IncomeLevel.MODERATE]: 3324,
    },
    4: {  // 4BR
      [IncomeLevel.ELI]: 1317,
      [IncomeLevel.VLI]: 2196,
      [IncomeLevel.LOW]: 2635,
      [IncomeLevel.LOW_80]: 3514,
      [IncomeLevel.MODERATE]: 3708,
    },
  },
};

// ============================================================================
// AHLF FEES (Affordable Housing Linkage Fee)
// ============================================================================

export const AHLF_FEES: AHLFFees = {
  // Residential (6+ units) - Per Square Foot
  residential: {
    [MarketArea.HIGH]: 22.53,
    [MarketArea.MEDIUM_HIGH]: 17.80,
    [MarketArea.MEDIUM]: 15.07,
    [MarketArea.MEDIUM_LOW]: 12.34,
    [MarketArea.LOW]: 10.02,
  },
  // Non-Residential - Per Square Foot
  nonResidential: {
    [MarketArea.HIGH]: 5.54,
    [MarketArea.MEDIUM_HIGH]: 4.28,
    [MarketArea.MEDIUM]: 2.78,
    [MarketArea.MEDIUM_LOW]: 2.78,
    [MarketArea.LOW]: 1.79,
  },
};

// Small residential projects (under 6 units) are exempt from AHLF

// ============================================================================
// SB 79 DENSITY TIERS (Effective July 2026)
// ============================================================================

export const SB_79_TIERS = {
  effectiveDate: new Date('2026-07-01'),
  tiers: {
    TIER_1: {
      description: 'Within 1/4 mile of major transit',
      distanceFeet: 1320,
      densityPerAcre: 120,
      densityPerSF: 120 / 43560,  // ~0.00275 units per SF
    },
    TIER_2: {
      description: 'Within 1/2 mile of major transit',
      distanceFeet: 2640,
      densityPerAcre: 100,
      densityPerSF: 100 / 43560,  // ~0.00230 units per SF
    },
  },
  benefits: {
    byRightApproval: true,
    noParkingMinimum: true,
    heightIncrease: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get income limit for a given AMI level and household size
 */
export function getIncomeLimit(level: IncomeLevel, householdSize: number): number {
  const limits = INCOME_LIMITS_2025.byLevelAndSize[level];
  const size = Math.min(Math.max(householdSize, 1), 8);  // Clamp to 1-8
  return limits[size as keyof typeof limits];
}

/**
 * Get maximum rent for a given bedroom count and AMI level
 */
export function getMaxRent(bedrooms: number, level: IncomeLevel): number {
  const bedroomKey = Math.min(Math.max(bedrooms, 0), 4);  // Clamp to 0-4
  const rents = RENT_LIMITS_2025.byBedroomAndLevel[bedroomKey as keyof typeof RENT_LIMITS_2025.byBedroomAndLevel];
  return rents[level];
}

/**
 * Calculate AHLF fee for a project
 */
export function calculateAHLFFee(
  buildableSF: number,
  marketArea: MarketArea,
  totalUnits: number,
  commercialSF: number = 0
): number {
  // Projects under 6 units are exempt
  if (totalUnits < 6) {
    return 0;
  }

  const residentialFee = (buildableSF - commercialSF) * AHLF_FEES.residential[marketArea];
  const commercialFee = commercialSF * AHLF_FEES.nonResidential[marketArea];

  return residentialFee + commercialFee;
}

/**
 * Calculate SB 79 density if applicable
 */
export function calculateSB79Density(
  lotSizeSF: number,
  distanceToMajorTransitFeet: number,
  asOfDate: Date = new Date()
): { eligible: boolean; tier: string | null; maxUnits: number } {
  // Check if SB 79 is in effect
  if (asOfDate < SB_79_TIERS.effectiveDate) {
    return { eligible: false, tier: null, maxUnits: 0 };
  }

  const { TIER_1, TIER_2 } = SB_79_TIERS.tiers;

  if (distanceToMajorTransitFeet <= TIER_1.distanceFeet) {
    return {
      eligible: true,
      tier: 'TIER_1',
      maxUnits: Math.floor(lotSizeSF * TIER_1.densityPerSF),
    };
  }

  if (distanceToMajorTransitFeet <= TIER_2.distanceFeet) {
    return {
      eligible: true,
      tier: 'TIER_2',
      maxUnits: Math.floor(lotSizeSF * TIER_2.densityPerSF),
    };
  }

  return { eligible: false, tier: null, maxUnits: 0 };
}

/**
 * Estimate monthly revenue from affordable unit
 */
export function calculateAffordableRent(
  bedrooms: number,
  incomeLevel: IncomeLevel,
  utilityAllowance: number = 0
): number {
  const maxRent = getMaxRent(bedrooms, incomeLevel);
  return maxRent - utilityAllowance;
}

/**
 * Get the AMI percentage for an income level
 */
export function getAMIPercent(level: IncomeLevel): number {
  switch (level) {
    case IncomeLevel.ELI: return 30;
    case IncomeLevel.VLI: return 50;
    case IncomeLevel.LOW: return 60;
    case IncomeLevel.LOW_80: return 80;
    case IncomeLevel.MODERATE: return 120;
  }
}

/**
 * Determine if market area is considered "high" for MIIP purposes
 */
export function isHighMarketArea(marketArea: MarketArea): boolean {
  return marketArea === MarketArea.HIGH || marketArea === MarketArea.MEDIUM_HIGH;
}
