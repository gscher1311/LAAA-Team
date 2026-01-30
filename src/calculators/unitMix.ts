/**
 * Unit Mix Generator
 * Generates realistic unit mixes based on total units and project type
 */

import { UnitType, IncomeLevel, DevelopmentPotential } from '../types';
import { getMaxRent } from '../data/amiAndFees';

// ============================================================================
// TYPES
// ============================================================================

export interface UnitMixConfig {
  // Percentage distribution (must sum to 1.0)
  studioPercent: number;
  oneBrPercent: number;
  twoBrPercent: number;
  threeBrPercent: number;
}

export interface UnitTypeSpec {
  type: UnitType;
  count: number;
  avgSF: number;
  totalSF: number;
  bedrooms: number;
}

export interface UnitMix {
  units: UnitTypeSpec[];
  totalUnits: number;
  totalSF: number;
  avgUnitSF: number;
  marketUnits: number;
  affordableUnits: number;
}

export interface UnitMixWithRents extends UnitMix {
  marketRentPerMonth: number;
  affordableRentPerMonth: number;
  blendedRentPerMonth: number;
  annualGrossRent: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

// Typical urban infill mix (transit-oriented)
export const DEFAULT_URBAN_MIX: UnitMixConfig = {
  studioPercent: 0.15,
  oneBrPercent: 0.45,
  twoBrPercent: 0.30,
  threeBrPercent: 0.10,
};

// Family-oriented mix (more bedrooms)
export const FAMILY_MIX: UnitMixConfig = {
  studioPercent: 0.05,
  oneBrPercent: 0.25,
  twoBrPercent: 0.45,
  threeBrPercent: 0.25,
};

// Affordable housing mix (often requires more family units)
export const AFFORDABLE_MIX: UnitMixConfig = {
  studioPercent: 0.10,
  oneBrPercent: 0.30,
  twoBrPercent: 0.40,
  threeBrPercent: 0.20,
};

// Micro-unit / workforce housing mix
export const WORKFORCE_MIX: UnitMixConfig = {
  studioPercent: 0.30,
  oneBrPercent: 0.50,
  twoBrPercent: 0.15,
  threeBrPercent: 0.05,
};

// Average SF per unit type (LA market typical)
export const AVG_UNIT_SF: Record<UnitType, number> = {
  [UnitType.STUDIO]: 475,
  [UnitType.ONE_BR]: 650,
  [UnitType.TWO_BR]: 925,
  [UnitType.THREE_BR]: 1200,
  [UnitType.FOUR_BR_PLUS]: 1500,
};

// ============================================================================
// UNIT MIX GENERATOR
// ============================================================================

/**
 * Generate unit mix from total units and configuration
 */
export function generateUnitMix(
  totalUnits: number,
  config: UnitMixConfig = DEFAULT_URBAN_MIX
): UnitMix {
  // Calculate unit counts (round to whole numbers)
  const studioCount = Math.round(totalUnits * config.studioPercent);
  const oneBrCount = Math.round(totalUnits * config.oneBrPercent);
  const twoBrCount = Math.round(totalUnits * config.twoBrPercent);
  let threeBrCount = Math.round(totalUnits * config.threeBrPercent);

  // Adjust for rounding to match total
  const calculatedTotal = studioCount + oneBrCount + twoBrCount + threeBrCount;
  if (calculatedTotal !== totalUnits) {
    threeBrCount += (totalUnits - calculatedTotal);
  }

  const units: UnitTypeSpec[] = [
    {
      type: UnitType.STUDIO,
      count: studioCount,
      avgSF: AVG_UNIT_SF[UnitType.STUDIO],
      totalSF: studioCount * AVG_UNIT_SF[UnitType.STUDIO],
      bedrooms: 0,
    },
    {
      type: UnitType.ONE_BR,
      count: oneBrCount,
      avgSF: AVG_UNIT_SF[UnitType.ONE_BR],
      totalSF: oneBrCount * AVG_UNIT_SF[UnitType.ONE_BR],
      bedrooms: 1,
    },
    {
      type: UnitType.TWO_BR,
      count: twoBrCount,
      avgSF: AVG_UNIT_SF[UnitType.TWO_BR],
      totalSF: twoBrCount * AVG_UNIT_SF[UnitType.TWO_BR],
      bedrooms: 2,
    },
    {
      type: UnitType.THREE_BR,
      count: Math.max(0, threeBrCount),
      avgSF: AVG_UNIT_SF[UnitType.THREE_BR],
      totalSF: Math.max(0, threeBrCount) * AVG_UNIT_SF[UnitType.THREE_BR],
      bedrooms: 3,
    },
  ].filter(u => u.count > 0);

  const totalSF = units.reduce((sum, u) => sum + u.totalSF, 0);
  const actualTotal = units.reduce((sum, u) => sum + u.count, 0);

  return {
    units,
    totalUnits: actualTotal,
    totalSF,
    avgUnitSF: totalSF / actualTotal,
    marketUnits: actualTotal,
    affordableUnits: 0,
  };
}

/**
 * Split unit mix into market and affordable units
 */
export function splitMarketAffordable(
  unitMix: UnitMix,
  affordablePercent: number
): UnitMix {
  const affordableUnits = Math.ceil(unitMix.totalUnits * (affordablePercent / 100));
  const marketUnits = unitMix.totalUnits - affordableUnits;

  return {
    ...unitMix,
    marketUnits,
    affordableUnits,
  };
}

/**
 * Calculate rents for unit mix
 */
export function calculateUnitMixRents(
  unitMix: UnitMix,
  affordablePercent: number,
  affordableIncomeLevel: IncomeLevel,
  marketRentPSF: number
): UnitMixWithRents {
  const split = splitMarketAffordable(unitMix, affordablePercent);

  // Calculate market rent (weighted by unit SF)
  let marketRentTotal = 0;
  let affordableRentTotal = 0;

  for (const unit of split.units) {
    // Market rent based on $/SF
    const unitMarketRent = unit.avgSF * marketRentPSF;

    // Affordable rent from AMI tables
    const unitAffordableRent = getMaxRent(unit.bedrooms, affordableIncomeLevel);

    // Allocate affordable units proportionally across unit types
    const unitAffordableCount = Math.round(
      (unit.count / split.totalUnits) * split.affordableUnits
    );
    const unitMarketCount = unit.count - unitAffordableCount;

    marketRentTotal += unitMarketCount * unitMarketRent;
    affordableRentTotal += unitAffordableCount * unitAffordableRent;
  }

  const totalMonthlyRent = marketRentTotal + affordableRentTotal;
  const blendedRent = totalMonthlyRent / split.totalUnits;

  return {
    ...split,
    marketRentPerMonth: marketRentTotal,
    affordableRentPerMonth: affordableRentTotal,
    blendedRentPerMonth: blendedRent,
    annualGrossRent: totalMonthlyRent * 12,
  };
}

/**
 * Get appropriate unit mix config based on project characteristics
 */
export function selectUnitMixConfig(
  affordablePercent: number,
  isTransitOriented: boolean,
  requiresFamilyUnits: boolean
): UnitMixConfig {
  if (requiresFamilyUnits || affordablePercent >= 50) {
    return FAMILY_MIX;
  }

  if (affordablePercent >= 20) {
    return AFFORDABLE_MIX;
  }

  if (isTransitOriented) {
    return WORKFORCE_MIX;
  }

  return DEFAULT_URBAN_MIX;
}

/**
 * Generate unit mix from development potential
 */
export function generateUnitMixFromPotential(
  potential: DevelopmentPotential,
  marketRentPSF: number,
  isTransitOriented: boolean = false
): UnitMixWithRents {
  const config = selectUnitMixConfig(
    potential.affordablePercent,
    isTransitOriented,
    potential.affordablePercent >= 50
  );

  const baseMix = generateUnitMix(potential.totalUnits, config);

  return calculateUnitMixRents(
    baseMix,
    potential.affordablePercent,
    potential.incomeLevel,
    marketRentPSF
  );
}

/**
 * Check if unit mix fits within buildable SF constraint
 */
export function validateUnitMixFitsFAR(
  unitMix: UnitMix,
  buildableSF: number,
  efficiencyFactor: number = 0.85  // 85% efficiency typical for residential
): { fits: boolean; requiredSF: number; availableSF: number; surplus: number } {
  const grossSFNeeded = unitMix.totalSF / efficiencyFactor;
  const surplus = buildableSF - grossSFNeeded;

  return {
    fits: surplus >= 0,
    requiredSF: grossSFNeeded,
    availableSF: buildableSF,
    surplus,
  };
}
