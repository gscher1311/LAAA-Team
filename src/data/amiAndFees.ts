/**
 * AMI Tables, Rent Limits, and AHLF Fees
 * From 2025-Income-and-Rent-Schedules.pdf and AHLF_Updated_Fee_Sc.pdf
 */

import { IncomeLevel, MarketArea, AHLFFees } from '../types';

// ============================================================================
// 2025 AREA MEDIAN INCOME (Los Angeles County)
// ============================================================================

export const AMI_2025 = {
  year: 2025,
  percentChangeFromPrior: 8.55,  // Up from 2024
  byHouseholdSize: {
    1: 82700,
    2: 94500,
    3: 106300,
    4: 106600,  // Reference point for most calculations
    5: 115200,
    6: 123700,
    7: 132300,
    8: 140800,
  },
};

// Household size assumptions by bedroom count
export const HOUSEHOLD_SIZE_BY_BEDROOM = {
  0: 1,   // Studio
  1: 1.5, // 1BR - interpolate between 1 and 2
  2: 3,   // 2BR
  3: 4.5, // 3BR
  4: 6,   // 4BR
};

// ============================================================================
// 2025 INCOME LIMITS BY AMI LEVEL
// ============================================================================

export const INCOME_LIMITS_2025 = {
  year: 2025,
  // Based on 4-person household, adjust by household size
  byLevelAndSize: {
    [IncomeLevel.ELI]: {  // 30% AMI
      1: 24810,
      2: 28350,
      3: 31890,
      4: 31980,
      5: 34560,
      6: 37110,
      7: 39690,
      8: 42240,
    },
    [IncomeLevel.VLI]: {  // 50% AMI
      1: 41350,
      2: 47250,
      3: 53150,
      4: 53300,
      5: 57600,
      6: 61850,
      7: 66150,
      8: 70400,
    },
    [IncomeLevel.LOW]: {  // 60% AMI
      1: 49620,
      2: 56700,
      3: 63780,
      4: 63960,
      5: 69120,
      6: 74220,
      7: 79380,
      8: 84480,
    },
    [IncomeLevel.LOW_80]: {  // 80% AMI
      1: 66160,
      2: 75600,
      3: 85040,
      4: 85280,
      5: 92160,
      6: 98960,
      7: 105840,
      8: 112640,
    },
    [IncomeLevel.MODERATE]: {  // 120% AMI
      1: 99240,
      2: 113400,
      3: 127560,
      4: 127920,
      5: 138240,
      6: 148440,
      7: 158760,
      8: 168960,
    },
  },
};

// ============================================================================
// 2025 MAXIMUM MONTHLY RENT LIMITS
// ============================================================================

export const RENT_LIMITS_2025 = {
  year: 2025,
  // By bedroom count and income level
  byBedroomAndLevel: {
    0: {  // Studio
      [IncomeLevel.ELI]: 621,
      [IncomeLevel.VLI]: 1035,
      [IncomeLevel.LOW]: 1242,
      [IncomeLevel.LOW_80]: 1656,
      [IncomeLevel.MODERATE]: 2049,
    },
    1: {  // 1BR
      [IncomeLevel.ELI]: 665,
      [IncomeLevel.VLI]: 1108,
      [IncomeLevel.LOW]: 1330,
      [IncomeLevel.LOW_80]: 1773,
      [IncomeLevel.MODERATE]: 2194,
    },
    2: {  // 2BR
      [IncomeLevel.ELI]: 797,
      [IncomeLevel.VLI]: 1330,
      [IncomeLevel.LOW]: 1596,
      [IncomeLevel.LOW_80]: 2128,
      [IncomeLevel.MODERATE]: 2633,
    },
    3: {  // 3BR
      [IncomeLevel.ELI]: 921,
      [IncomeLevel.VLI]: 1536,
      [IncomeLevel.LOW]: 1843,
      [IncomeLevel.LOW_80]: 2457,
      [IncomeLevel.MODERATE]: 3042,
    },
    4: {  // 4BR
      [IncomeLevel.ELI]: 1028,
      [IncomeLevel.VLI]: 1714,
      [IncomeLevel.LOW]: 2056,
      [IncomeLevel.LOW_80]: 2742,
      [IncomeLevel.MODERATE]: 3394,
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
