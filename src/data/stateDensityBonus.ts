/**
 * State Density Bonus Law Data (Section 12.22 A.37)
 * Based on California Government Code 65915 as implemented in LA
 */

import { DensityBonusTier, ParkingRatio, UnitType } from '../types';

// TABLE 12.22 A.37(e)(1)(i)a - Density Bonus by Affordability Level
export const VLI_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 5, densityBonusPercent: 20 },
  { affordablePercent: 6, densityBonusPercent: 22.5 },
  { affordablePercent: 7, densityBonusPercent: 25 },
  { affordablePercent: 8, densityBonusPercent: 27.5 },
  { affordablePercent: 9, densityBonusPercent: 30 },
  { affordablePercent: 10, densityBonusPercent: 32.5 },
  { affordablePercent: 11, densityBonusPercent: 35 },
  { affordablePercent: 12, densityBonusPercent: 36 },
  { affordablePercent: 13, densityBonusPercent: 37 },
  { affordablePercent: 14, densityBonusPercent: 38 },
  { affordablePercent: 15, densityBonusPercent: 39 },
  { affordablePercent: 16, densityBonusPercent: 40 },
  { affordablePercent: 17, densityBonusPercent: 41 },
  { affordablePercent: 18, densityBonusPercent: 42 },
  { affordablePercent: 19, densityBonusPercent: 43 },
  { affordablePercent: 20, densityBonusPercent: 44 },
  { affordablePercent: 21, densityBonusPercent: 45 },
  { affordablePercent: 22, densityBonusPercent: 46 },
  { affordablePercent: 23, densityBonusPercent: 47 },
  { affordablePercent: 24, densityBonusPercent: 50 },  // Max base bonus
];

export const LOWER_INCOME_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 10, densityBonusPercent: 20 },
  { affordablePercent: 11, densityBonusPercent: 22.5 },
  { affordablePercent: 12, densityBonusPercent: 25 },
  { affordablePercent: 13, densityBonusPercent: 27.5 },
  { affordablePercent: 14, densityBonusPercent: 30 },
  { affordablePercent: 15, densityBonusPercent: 32.5 },
  { affordablePercent: 17, densityBonusPercent: 35 },
  { affordablePercent: 19, densityBonusPercent: 36 },
  { affordablePercent: 21, densityBonusPercent: 37 },
  { affordablePercent: 23, densityBonusPercent: 38 },
  { affordablePercent: 24, densityBonusPercent: 39 },
  { affordablePercent: 26, densityBonusPercent: 40 },
  { affordablePercent: 28, densityBonusPercent: 41 },
  { affordablePercent: 30, densityBonusPercent: 42 },
  { affordablePercent: 32, densityBonusPercent: 43 },
  { affordablePercent: 34, densityBonusPercent: 44 },
  { affordablePercent: 36, densityBonusPercent: 45 },
  { affordablePercent: 38, densityBonusPercent: 46 },
  { affordablePercent: 40, densityBonusPercent: 47 },
  { affordablePercent: 44, densityBonusPercent: 50 },  // Max base bonus
];

export const MODERATE_INCOME_DENSITY_BONUS_TIERS: DensityBonusTier[] = [
  { affordablePercent: 10, densityBonusPercent: 20 },
  { affordablePercent: 11, densityBonusPercent: 22.5 },
  { affordablePercent: 12, densityBonusPercent: 25 },
  { affordablePercent: 13, densityBonusPercent: 27.5 },
  { affordablePercent: 14, densityBonusPercent: 30 },
  { affordablePercent: 15, densityBonusPercent: 32.5 },
  { affordablePercent: 16, densityBonusPercent: 35 },
  { affordablePercent: 17, densityBonusPercent: 36 },
  { affordablePercent: 18, densityBonusPercent: 37 },
  { affordablePercent: 19, densityBonusPercent: 38 },
  { affordablePercent: 20, densityBonusPercent: 39 },
  { affordablePercent: 21, densityBonusPercent: 40 },
  { affordablePercent: 22, densityBonusPercent: 41 },
  { affordablePercent: 23, densityBonusPercent: 42 },
  { affordablePercent: 24, densityBonusPercent: 43 },
  { affordablePercent: 25, densityBonusPercent: 44 },
  { affordablePercent: 26, densityBonusPercent: 45 },
  { affordablePercent: 27, densityBonusPercent: 46 },
  { affordablePercent: 28, densityBonusPercent: 47 },
  { affordablePercent: 40, densityBonusPercent: 50 },  // Max base bonus
];

// TABLE 12.22 A.37(e)(1)(ii)a - Additional Density Bonus per 1% affordable
export const ADDITIONAL_BONUS_PER_PERCENT = {
  vli: 2.5,       // +2.5% density bonus per additional 1% VLI
  lower: 1.5,     // +1.5% density bonus per additional 1% Lower Income
  moderate: 1.0,  // +1.0% density bonus per additional 1% Moderate
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
 */
export function calculateStateDensityBonus(
  affordablePercent: number,
  incomeLevel: 'VLI' | 'LOWER' | 'MODERATE'
): number {
  let tiers: DensityBonusTier[];
  let additionalRate: number;
  let baseMaxPercent: number;
  let baseMaxBonus: number;

  switch (incomeLevel) {
    case 'VLI':
      tiers = VLI_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.vli;
      baseMaxPercent = 24;
      baseMaxBonus = 50;
      break;
    case 'LOWER':
      tiers = LOWER_INCOME_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.lower;
      baseMaxPercent = 44;
      baseMaxBonus = 50;
      break;
    case 'MODERATE':
      tiers = MODERATE_INCOME_DENSITY_BONUS_TIERS;
      additionalRate = ADDITIONAL_BONUS_PER_PERCENT.moderate;
      baseMaxPercent = 40;
      baseMaxBonus = 50;
      break;
  }

  // Find base bonus from tiers
  let baseBonus = 0;
  for (const tier of tiers) {
    if (affordablePercent >= tier.affordablePercent) {
      baseBonus = tier.densityBonusPercent;
    }
  }

  // Calculate additional bonus if above max tier threshold
  if (affordablePercent > baseMaxPercent) {
    const additionalPercent = affordablePercent - baseMaxPercent;
    const additionalBonus = additionalPercent * additionalRate;
    return baseMaxBonus + additionalBonus;
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
