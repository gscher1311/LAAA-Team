/**
 * Development Potential Calculator
 * Calculates what can be built under each incentive program
 */

import {
  SiteInput,
  IncentiveProgram,
  DevelopmentPotential,
  IncomeLevel,
  MIIPTransitTier,
  MIIPOpportunityTier,
  MIIPCorridorTier,
} from '../types';

import {
  getZoneStandards,
  calculateBaseDensity,
  calculateEffectiveFAR,
  calculateEffectiveHeight,
  isCommercialZone,
} from '../data/zoning';

import {
  calculateStateDensityBonus,
  calculateIncentivesAvailable,
  HEIGHT_BONUS,
  FAR_BONUS_NEAR_TRANSIT,
  PARKING_EXEMPTION_TRANSIT_DISTANCE_FEET,
} from '../data/stateDensityBonus';

import {
  getTransitIncentives,
  getOpportunityIncentives,
  getCorridorIncentives,
  getAffordabilityRequirement,
  determineTransitTier,
  determineOpportunityTier,
} from '../data/miip';

import {
  getAHIPBaseIncentives,
  AHIP_MAX_ADDITIONAL_INCENTIVES,
} from '../data/ahip';

import {
  isHighMarketArea,
  calculateSB79Density,
} from '../data/amiAndFees';

import { checkAllProgramEligibility } from './eligibility';

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

/**
 * Calculate development potential for all eligible programs
 */
export function calculateAllProgramPotential(
  site: SiteInput,
  targetIncomeLevel: IncomeLevel = IncomeLevel.VLI
): DevelopmentPotential[] {
  const eligibility = checkAllProgramEligibility(site);
  const results: DevelopmentPotential[] = [];

  // Calculate for each eligible program
  for (const result of eligibility.results) {
    let potential: DevelopmentPotential;

    switch (result.program) {
      case IncentiveProgram.BY_RIGHT:
        potential = calculateByRight(site);
        break;
      case IncentiveProgram.STATE_DENSITY_BONUS:
        potential = calculateStateDensityBonusPotential(site, targetIncomeLevel);
        break;
      case IncentiveProgram.MIIP_TRANSIT:
        potential = calculateMIIPTransitPotential(site, result.tier as MIIPTransitTier, targetIncomeLevel);
        break;
      case IncentiveProgram.MIIP_OPPORTUNITY:
        potential = calculateMIIPOpportunityPotential(site, result.tier as MIIPOpportunityTier, targetIncomeLevel);
        break;
      case IncentiveProgram.MIIP_CORRIDOR:
        potential = calculateMIIPCorridorPotential(site, result.tier as MIIPCorridorTier, targetIncomeLevel);
        break;
      case IncentiveProgram.AHIP:
        potential = calculateAHIPPotential(site);
        break;
      case IncentiveProgram.SB_79:
        potential = calculateSB79Potential(site);
        break;
      default:
        continue;
    }

    potential.eligible = result.eligible;
    if (!result.eligible && result.reason) {
      potential.ineligibilityReason = result.reason;
    }

    results.push(potential);
  }

  return results;
}

// ============================================================================
// BY-RIGHT CALCULATOR
// ============================================================================

function calculateByRight(site: SiteInput): DevelopmentPotential {
  const zoneStandards = getZoneStandards(site.baseZone);
  const baseDensity = calculateBaseDensity(site.lotSizeSF, site.baseZone);
  const baseFAR = calculateEffectiveFAR(site.baseZone, site.heightDistrict);
  const height = calculateEffectiveHeight(site.baseZone, site.heightDistrict);

  const buildableSF = site.lotSizeSF * baseFAR;

  return {
    program: IncentiveProgram.BY_RIGHT,
    eligible: true,
    baseDensity,
    bonusDensity: 0,
    totalUnits: baseDensity,
    baseFAR,
    bonusFAR: 0,
    totalFAR: baseFAR,
    buildableSF,
    baseHeightFeet: height.maxFeet || 999,
    bonusHeightFeet: 0,
    totalHeightFeet: height.maxFeet || 999,
    baseStories: height.maxStories || 99,
    bonusStories: 0,
    totalStories: height.maxStories || 99,
    affordableUnits: 0,
    affordablePercent: 0,
    incomeLevel: IncomeLevel.MODERATE,  // Market rate
    parkingRequired: baseDensity * (zoneStandards?.parkingPerUnit || 1),
    additionalIncentivesAvailable: 0,
  };
}

// ============================================================================
// STATE DENSITY BONUS CALCULATOR
// ============================================================================

function calculateStateDensityBonusPotential(
  site: SiteInput,
  incomeLevel: IncomeLevel
): DevelopmentPotential {
  const basePotential = calculateByRight(site);
  const baseDensity = basePotential.baseDensity;

  // Determine affordability percentage (use minimum for max incentives at this income level)
  // For VLI: 5% minimum for 20% bonus, up to 24% for 50% bonus
  const affordablePercent = getOptimalAffordablePercent(incomeLevel);
  const densityBonusPercent = calculateStateDensityBonus(
    affordablePercent,
    incomeLevel === IncomeLevel.VLI ? 'VLI' :
      incomeLevel === IncomeLevel.MODERATE ? 'MODERATE' : 'LOWER'
  );

  const bonusDensity = Math.floor(baseDensity * (densityBonusPercent / 100));
  const totalUnits = baseDensity + bonusDensity;
  const affordableUnits = Math.ceil(totalUnits * (affordablePercent / 100));

  // FAR bonus if near transit
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
  let bonusFAR = 0;
  if (nearTransit) {
    const farIncrease = Math.min(densityBonusPercent, FAR_BONUS_NEAR_TRANSIT.maxIncreasePercent) / 100;
    bonusFAR = basePotential.baseFAR * farIncrease;
    // Also check minimum FAR
    const minFAR = FAR_BONUS_NEAR_TRANSIT.minFAR;
    if (basePotential.baseFAR + bonusFAR < minFAR) {
      bonusFAR = minFAR - basePotential.baseFAR;
    }
  }

  const totalFAR = basePotential.baseFAR + bonusFAR;
  const buildableSF = site.lotSizeSF * totalFAR;

  // Height bonus
  const heightBonus = nearTransit ? HEIGHT_BONUS.nearTransit : HEIGHT_BONUS.standard;

  // Parking - reduced or eliminated near transit
  let parkingRequired = 0;
  if (!nearTransit) {
    parkingRequired = totalUnits;  // 1 space per unit default for DB
  }

  // Calculate incentives available
  const incentives = calculateIncentivesAvailable(
    affordablePercent,
    incomeLevel === IncomeLevel.VLI ? 'VLI' :
      incomeLevel === IncomeLevel.MODERATE ? 'MODERATE' : 'LOWER'
  );

  return {
    program: IncentiveProgram.STATE_DENSITY_BONUS,
    eligible: true,
    baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: heightBonus.additionalFeet,
    totalHeightFeet: basePotential.baseHeightFeet + heightBonus.additionalFeet,
    baseStories: basePotential.baseStories,
    bonusStories: heightBonus.additionalStories,
    totalStories: basePotential.baseStories + heightBonus.additionalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel,
    parkingRequired,
    additionalIncentivesAvailable: incentives,
  };
}

// ============================================================================
// MIIP TRANSIT CALCULATOR
// ============================================================================

function calculateMIIPTransitPotential(
  site: SiteInput,
  tier: MIIPTransitTier,
  incomeLevel: IncomeLevel
): DevelopmentPotential {
  const basePotential = calculateByRight(site);
  const incentives = getTransitIncentives(tier);

  if (!incentives) {
    return { ...basePotential, program: IncentiveProgram.MIIP_TRANSIT, eligible: false };
  }

  const baseDensity = basePotential.baseDensity;

  // Get affordability requirement
  const isHighMarket = isHighMarketArea(site.marketArea);
  const affordReq = getAffordabilityRequirement(tier, isHighMarket);
  const affordablePercent = affordReq ?
    (incomeLevel === IncomeLevel.VLI ? affordReq.vli :
      incomeLevel === IncomeLevel.ELI ? affordReq.eli : affordReq.lower) : 0;

  // Density bonus (use max for calculation)
  const densityBonusPercent = incentives.densityBonusMax;
  const bonusDensity = Math.floor(baseDensity * (densityBonusPercent / 100));
  const totalUnits = baseDensity + bonusDensity;
  const affordableUnits = Math.ceil(totalUnits * (affordablePercent / 100));

  // FAR calculation
  const isCZone = isCommercialZone(site.baseZone);
  let bonusFAR: number;
  let totalFAR: number;

  if (isCZone) {
    // Use fixed FAR or percentage increase, whichever is greater
    const fixedFAR = incentives.farCZone;
    const percentIncrease = basePotential.baseFAR * (1 + incentives.farIncreaseCZone / 100);
    totalFAR = Math.max(fixedFAR, percentIncrease);
    bonusFAR = totalFAR - basePotential.baseFAR;
  } else {
    // R-zone: percentage increase
    bonusFAR = basePotential.baseFAR * (incentives.farIncreaseRZone / 100);
    totalFAR = basePotential.baseFAR + bonusFAR;
  }

  const buildableSF = site.lotSizeSF * totalFAR;

  return {
    program: IncentiveProgram.MIIP_TRANSIT,
    eligible: true,
    baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: incentives.additionalHeightFeet,
    totalHeightFeet: basePotential.baseHeightFeet + incentives.additionalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: incentives.additionalStories,
    totalStories: basePotential.baseStories + incentives.additionalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel,
    parkingRequired: incentives.parkingRequired ? totalUnits : 0,
    additionalIncentivesAvailable: tier === MIIPTransitTier.T3 ? 4 : 3,
  };
}

// ============================================================================
// MIIP OPPORTUNITY CORRIDOR CALCULATOR
// ============================================================================

function calculateMIIPOpportunityPotential(
  site: SiteInput,
  tier: MIIPOpportunityTier,
  incomeLevel: IncomeLevel
): DevelopmentPotential {
  const basePotential = calculateByRight(site);
  const incentives = getOpportunityIncentives(tier);

  if (!incentives) {
    return { ...basePotential, program: IncentiveProgram.MIIP_OPPORTUNITY, eligible: false };
  }

  const baseDensity = basePotential.baseDensity;

  // Get affordability requirement
  const isHighMarket = isHighMarketArea(site.marketArea);
  const affordReq = getAffordabilityRequirement(tier, isHighMarket);
  const affordablePercent = affordReq ?
    (incomeLevel === IncomeLevel.VLI ? affordReq.vli :
      incomeLevel === IncomeLevel.ELI ? affordReq.eli : affordReq.lower) : 0;

  // OC doesn't have explicit density bonus - it's FAR/height based
  // Calculate units from buildable area
  const isCZone = isCommercialZone(site.baseZone);
  let totalFAR: number;
  let bonusFAR: number;

  if (isCZone) {
    const fixedFAR = incentives.farCZone;
    const percentIncrease = basePotential.baseFAR * (1 + incentives.farIncreaseCZone / 100);
    totalFAR = Math.max(fixedFAR, percentIncrease);
    bonusFAR = totalFAR - basePotential.baseFAR;
  } else {
    bonusFAR = basePotential.baseFAR * (incentives.farIncreaseRZone / 100);
    totalFAR = basePotential.baseFAR + bonusFAR;
  }

  const buildableSF = site.lotSizeSF * totalFAR;

  // Estimate units from buildable area (assume avg 800 SF/unit)
  const estimatedUnits = Math.floor(buildableSF / 800);
  const totalUnits = Math.max(baseDensity, estimatedUnits);
  const bonusDensity = totalUnits - baseDensity;
  const affordableUnits = Math.ceil(totalUnits * (affordablePercent / 100));

  // Max stories capped
  const totalStories = Math.min(
    basePotential.baseStories + incentives.additionalStories,
    incentives.maxStories
  );

  return {
    program: IncentiveProgram.MIIP_OPPORTUNITY,
    eligible: true,
    baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: incentives.additionalHeightFeet,
    totalHeightFeet: basePotential.baseHeightFeet + incentives.additionalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: incentives.additionalStories,
    totalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel,
    parkingRequired: 0,  // No parking required in OC
    additionalIncentivesAvailable: tier === MIIPOpportunityTier.OC3 ? 4 : 3,
  };
}

// ============================================================================
// MIIP CORRIDOR TRANSITION CALCULATOR
// ============================================================================

function calculateMIIPCorridorPotential(
  site: SiteInput,
  tier: MIIPCorridorTier,
  incomeLevel: IncomeLevel
): DevelopmentPotential {
  const basePotential = calculateByRight(site);
  const incentives = getCorridorIncentives(tier);

  if (!incentives) {
    return { ...basePotential, program: IncentiveProgram.MIIP_CORRIDOR, eligible: false };
  }

  // Get affordability requirement
  const isHighMarket = isHighMarketArea(site.marketArea);
  const affordReq = getAffordabilityRequirement(tier, isHighMarket);
  const affordablePercent = affordReq ?
    (incomeLevel === IncomeLevel.VLI ? affordReq.vli :
      incomeLevel === IncomeLevel.ELI ? affordReq.eli : affordReq.lower) : 0;

  // CT has fixed max units
  const totalUnits = Math.min(
    Math.max(basePotential.baseDensity, incentives.maxUnitsMin),
    incentives.maxUnitsMax
  );
  const bonusDensity = totalUnits - basePotential.baseDensity;
  const affordableUnits = Math.ceil(totalUnits * (affordablePercent / 100));

  // FAR is fixed range
  const totalFAR = incentives.farMax;
  const bonusFAR = totalFAR - basePotential.baseFAR;
  const buildableSF = site.lotSizeSF * totalFAR;

  // Height in stories
  const totalStories = incentives.maxStories;
  const totalHeightFeet = totalStories * 11;  // 11 ft per story

  return {
    program: IncentiveProgram.MIIP_CORRIDOR,
    eligible: true,
    baseDensity: basePotential.baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR: Math.max(0, bonusFAR),
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: 0,
    totalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: 0,
    totalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel,
    parkingRequired: incentives.parkingRequired ? totalUnits : 0,
    additionalIncentivesAvailable: tier === MIIPCorridorTier.CT3 ? 4 : 3,
  };
}

// ============================================================================
// AHIP CALCULATOR (100% Affordable)
// ============================================================================

function calculateAHIPPotential(site: SiteInput): DevelopmentPotential {
  const basePotential = calculateByRight(site);
  const baseDensity = basePotential.baseDensity;

  // Determine subarea
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
  const inHigherOpp = ['HIGH', 'HIGHEST', 'MODERATE'].includes(site.tcacArea);

  const incentives = getAHIPBaseIncentives(
    baseDensity,
    nearTransit,
    inHigherOpp,
    site.inVeryLowVehicleTravelArea || false
  );

  // AHIP uses State DB for density bonus - assume max (unlimited for 100% affordable)
  // Per Gov Code 65915, 100% affordable gets 80% density bonus
  const densityBonusPercent = 80;
  const bonusDensity = Math.floor(baseDensity * (densityBonusPercent / 100));
  const totalUnits = baseDensity + bonusDensity;

  // 100% affordable
  const affordableUnits = totalUnits;
  const affordablePercent = 100;

  // FAR from AHIP table
  const totalFAR = Math.max(incentives.maxFAR, basePotential.baseFAR * 1.35);
  const bonusFAR = totalFAR - basePotential.baseFAR;
  const buildableSF = site.lotSizeSF * totalFAR;

  return {
    program: IncentiveProgram.AHIP,
    eligible: true,
    baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: incentives.additionalHeightFeet,
    totalHeightFeet: basePotential.baseHeightFeet + incentives.additionalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: incentives.additionalStories,
    totalStories: basePotential.baseStories + incentives.additionalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel: IncomeLevel.LOW_80,  // Mix of income levels
    parkingRequired: incentives.parkingPerUnit ? totalUnits * incentives.parkingPerUnit : 0,
    additionalIncentivesAvailable: AHIP_MAX_ADDITIONAL_INCENTIVES,
  };
}

// ============================================================================
// SB 79 CALCULATOR
// ============================================================================

function calculateSB79Potential(site: SiteInput): DevelopmentPotential {
  const basePotential = calculateByRight(site);

  const sb79 = calculateSB79Density(
    site.lotSizeSF,
    site.distanceToMajorTransitFeet || Infinity,
    new Date('2026-07-01')
  );

  if (!sb79.eligible) {
    return { ...basePotential, program: IncentiveProgram.SB_79, eligible: false };
  }

  const totalUnits = sb79.maxUnits;
  const bonusDensity = totalUnits - basePotential.baseDensity;

  // Estimate buildable SF (assume 800 SF/unit average)
  const buildableSF = totalUnits * 800;
  const totalFAR = buildableSF / site.lotSizeSF;
  const bonusFAR = totalFAR - basePotential.baseFAR;

  // Height - SB 79 allows significant height near transit
  // Estimate based on density: ~8 units per floor for mid-rise, 11 ft/floor
  const unitsPerFloor = 8;
  const floorsNeeded = Math.ceil(totalUnits / unitsPerFloor);
  // Cap at reasonable height (typically 7-8 stories for transit-oriented)
  const totalStories = Math.min(Math.max(floorsNeeded, basePotential.baseStories), 8);
  const totalHeightFeet = totalStories * 11;

  return {
    program: IncentiveProgram.SB_79,
    eligible: true,
    baseDensity: basePotential.baseDensity,
    bonusDensity,
    totalUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: totalHeightFeet - basePotential.baseHeightFeet,
    totalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: totalStories - basePotential.baseStories,
    totalStories,
    affordableUnits: 0,  // SB 79 doesn't require affordability
    affordablePercent: 0,
    incomeLevel: IncomeLevel.MODERATE,
    parkingRequired: 0,  // No parking required
    additionalIncentivesAvailable: 0,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get optimal affordable percentage for maximum density bonus
 */
function getOptimalAffordablePercent(incomeLevel: IncomeLevel): number {
  // These are the percentages that get 50% density bonus (max base)
  switch (incomeLevel) {
    case IncomeLevel.ELI:
    case IncomeLevel.VLI:
      return 24;  // 24% VLI = 50% bonus
    case IncomeLevel.LOW:
    case IncomeLevel.LOW_80:
      return 44;  // 44% Lower = 50% bonus
    case IncomeLevel.MODERATE:
      return 40;  // 40% Moderate = 50% bonus
  }
}

/**
 * Compare development potential across programs
 */
export function comparePotential(potentials: DevelopmentPotential[]): {
  maxUnits: DevelopmentPotential;
  maxFAR: DevelopmentPotential;
  maxHeight: DevelopmentPotential;
  minAffordable: DevelopmentPotential;
} {
  const eligible = potentials.filter(p => p.eligible);

  return {
    maxUnits: eligible.reduce((max, p) => p.totalUnits > max.totalUnits ? p : max, eligible[0]),
    maxFAR: eligible.reduce((max, p) => p.totalFAR > max.totalFAR ? p : max, eligible[0]),
    maxHeight: eligible.reduce((max, p) => p.totalHeightFeet > max.totalHeightFeet ? p : max, eligible[0]),
    minAffordable: eligible.reduce((min, p) =>
      p.affordablePercent > 0 && p.affordablePercent < min.affordablePercent ? p : min,
      eligible.find(p => p.affordablePercent > 0) || eligible[0]
    ),
  };
}
