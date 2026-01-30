/**
 * State Density Bonus Law Data (LAMC Section 12.22 A.37)
 * Based on California Government Code 65915 (as amended by AB 2345, AB 1287)
 *
 * SOURCES:
 * - CA Gov Code 65915: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65915&lawCode=GOV
 * - LA Implementation: LAMC 12.22 A.37
 * - ABAG Model Guidelines (April 2025): https://abag.ca.gov/sites/default/files/documents/2025-04/Density-Bonus-Model-Program-Guidelines-04162025.pdf
 */

import { DensityBonusTier, ParkingRatio, UnitType } from '../types';

// ============================================================================
// DENSITY BONUS SLIDING SCALE TABLES
// Per Gov Code 65915(f) as amended
// ============================================================================

/**
 * Very Low Income (50% AMI) - Gov Code 65915(f)(2)
 * Base: 5% VLI = 20% bonus
 * Each additional 1% VLI = +3% bonus (post-AB 2345)
 * Maximum: 15% VLI = 50% bonus
 */
export const VLI_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 5, densityBonusPercent: 20 },
  { affordablePercent: 6, densityBonusPercent: 23 },
  { affordablePercent: 7, densityBonusPercent: 26 },
  { affordablePercent: 8, densityBonusPercent: 29 },
  { affordablePercent: 9, densityBonusPercent: 32 },
  { affordablePercent: 10, densityBonusPercent: 35 },
  { affordablePercent: 11, densityBonusPercent: 38 },
  { affordablePercent: 12, densityBonusPercent: 41 },
  { affordablePercent: 13, densityBonusPercent: 44 },
  { affordablePercent: 14, densityBonusPercent: 47 },
  { affordablePercent: 15, densityBonusPercent: 50 },  // Max base bonus
];

/**
 * Lower Income (60-80% AMI) - Gov Code 65915(f)(1)
 * Base: 10% Lower = 20% bonus
 * Each additional 1% Lower = +2.14% bonus (approx)
 * Maximum: 24% Lower = 50% bonus
 */
export const LOWER_INCOME_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 10, densityBonusPercent: 20 },
  { affordablePercent: 11, densityBonusPercent: 22.14 },
  { affordablePercent: 12, densityBonusPercent: 24.29 },
  { affordablePercent: 13, densityBonusPercent: 26.43 },
  { affordablePercent: 14, densityBonusPercent: 28.57 },
  { affordablePercent: 15, densityBonusPercent: 30.71 },
  { affordablePercent: 16, densityBonusPercent: 32.86 },
  { affordablePercent: 17, densityBonusPercent: 35 },
  { affordablePercent: 18, densityBonusPercent: 37.14 },
  { affordablePercent: 19, densityBonusPercent: 39.29 },
  { affordablePercent: 20, densityBonusPercent: 41.43 },
  { affordablePercent: 21, densityBonusPercent: 43.57 },
  { affordablePercent: 22, densityBonusPercent: 45.71 },
  { affordablePercent: 23, densityBonusPercent: 47.86 },
  { affordablePercent: 24, densityBonusPercent: 50 },  // Max base bonus
];

/**
 * Moderate Income (120% AMI, for-sale only) - Gov Code 65915(f)(4)
 * Base: 10% Moderate = 5% bonus
 * Each additional 1% Moderate = +1.32% bonus (approx)
 * Maximum: 44% Moderate = 50% bonus
 */
export const MODERATE_INCOME_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 10, densityBonusPercent: 5 },
  { affordablePercent: 15, densityBonusPercent: 11.6 },
  { affordablePercent: 20, densityBonusPercent: 18.2 },
  { affordablePercent: 25, densityBonusPercent: 24.8 },
  { affordablePercent: 30, densityBonusPercent: 31.4 },
  { affordablePercent: 35, densityBonusPercent: 38 },
  { affordablePercent: 40, densityBonusPercent: 44.6 },
  { affordablePercent: 44, densityBonusPercent: 50 },  // Max base bonus
];

// ============================================================================
// ADDITIONAL DENSITY BONUS (AB 1287 - Second Density Bonus)
// Per Gov Code 65915(v) for projects that have already maxed base allocation
// ============================================================================
export const ADDITIONAL_BONUS_PER_PERCENT = {
  vli: 2.5,       // +2.5% density bonus per additional 1% VLI above 15%
  lower: 1.5,     // +1.5% density bonus per additional 1% Lower above 24%
  moderate: 1.0,  // +1.0% density bonus per additional 1% Moderate above 44%
};

// Maximum thresholds for base bonus (before additional bonus kicks in)
export const BASE_BONUS_THRESHOLDS = {
  vli: { minPercent: 5, maxPercent: 15, maxBonus: 50 },
  lower: { minPercent: 10, maxPercent: 24, maxBonus: 50 },
  moderate: { minPercent: 10, maxPercent: 44, maxBonus: 50 },
};

// TABLE 12.22 A.37(e)(2)(ii)a - Parking Ratios
export const STATE_DB_PARKING_RATIOS: ParkingRatio[] = [
  { unitType: UnitType.STUDIO, spacesRequired: 1 },
  { unitType: UnitType.ONE_BR, spacesRequired: 1 },
  { unitType: UnitType.TWO_BR, spacesRequired: 1.5 },
  { unitType: UnitType.THREE_BR, spacesRequired: 1.5 },
  { unitType: UnitType.FOUR_BR_PLUS, spacesRequired: 2.5 },
];

// Parking exemptions
export const PARKING_EXEMPTION_TRANSIT_DISTANCE_FEET = 2640; // 1/2 mile

// FAR Bonus (within 1/2 mile of Major Transit Stop)
export const FAR_BONUS_NEAR_TRANSIT = {
  maxIncreasePercent: 35,
  minFAR: 3.0,  // whichever is greater
};

// Height Bonus
export const HEIGHT_BONUS = {
  standard: {
    additionalFeet: 11,
    additionalStories: 1,
  },
  nearTransit: {  // Within 1/2 mile of Major Transit Stop
    additionalFeet: 33,
    additionalStories: 3,
  },
};

// TABLE 12.22 A.37(f)(1)(i) - Number of Incentives by Affordability
export const INCENTIVES_BY_AFFORDABILITY = [
  { vliPercent: 5, lowerPercent: 10, moderatePercent: 10, incentives: 1 },
  { vliPercent: 10, lowerPercent: 17, moderatePercent: 20, incentives: 2 },
  { vliPercent: 15, lowerPercent: 24, moderatePercent: 30, incentives: 3 },
  { vliPercent: 24, lowerPercent: 44, moderatePercent: 40, incentives: 4 },
];

/**
 * Calculate density bonus for a given affordability percentage
 * Per Government Code 65915 as amended
 */
export function calculateStateDensityBonus(
  affordablePercent: number,
  incomeLevel: 'VLI' | 'LOWER' | 'MODERATE'
): number {
  let tiers: DensityBonusTier[];
  let additionalRate: number;
  let thresholds: { minPercent: number; maxPercent: number; maxBonus: number };

  switch (incomeLevel) {
    case 'VLI':
      tiers = VLI_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.vli;
      thresholds = BASE_BONUS_THRESHOLDS.vli;
      break;
    case 'LOWER':
      tiers = LOWER_INCOME_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.lower;
      thresholds = BASE_BONUS_THRESHOLDS.lower;
      break;
    case 'MODERATE':
      tiers = MODERATE_INCOME_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.moderate;
      thresholds = BASE_BONUS_THRESHOLDS.moderate;
      break;
  }

  // Below minimum threshold - no bonus
  if (affordablePercent < thresholds.minPercent) {
    return 0;
  }

  // Find base bonus from tiers
  let baseBonus = 0;
  for (const tier of tiers) {
    if (affordablePercent >= tier.affordablePercent) {
      baseBonus = tier.densityBonusPercent;
    }
  }

  // Calculate additional bonus if above max tier threshold (AB 1287 second density bonus)
  if (affordablePercent > thresholds.maxPercent) {
    const additionalPercent = affordablePercent - thresholds.maxPercent;
    const additionalBonus = additionalPercent * additionalRate;
    return thresholds.maxBonus + additionalBonus;
  }

  return baseBonus;
}

/**
 * Calculate number of incentives available
 */
export function calculateIncentivesAvailable(
  affordablePercent: number,
  incomeLevel: 'VLI' | 'LOWER' | 'MODERATE'
): number {
  let incentives = 0;

  for (const tier of INCENTIVES_BY_AFFORDABILITY) {
    const threshold = incomeLevel === 'VLI'
      ? tier.vliPercent
      : incomeLevel === 'LOWER'
        ? tier.lowerPercent
        : tier.moderatePercent;

    if (affordablePercent >= threshold) {
      incentives = tier.incentives;
    }
  }

  return incentives;
}

/**
 * Calculate parking requirement
 */
export function calculateParkingRequirement(
  unitMix: { unitType: UnitType; count: number }[],
  distanceToTransitFeet: number,
  isHundredPercentAffordable: boolean
): number {
  // No parking required if within 1/2 mile of transit or 100% affordable
  if (distanceToTransitFeet <= PARKING_EXEMPTION_TRANSIT_DISTANCE_FEET || isHundredPercentAffordable) {
    return 0;
  }

  let totalSpaces = 0;
  for (const unit of unitMix) {
    const ratio = STATE_DB_PARKING_RATIOS.find(r => r.unitType === unit.unitType);
    if (ratio) {
      totalSpaces += unit.count * ratio.spacesRequired;
    }
  }

  return Math.ceil(totalSpaces);
}
