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
  ZoneType,
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
// HELPER: Calculate Brickwork-style data points
// Source: LAMC 12.21 (Yard requirements), LAMC 12.21.G (Open space)
// ============================================================================

/**
 * Get setback requirements based on zone
 * Source: LAMC 12.08-12.14 (Zone regulations)
 */
function getSetbackRequirements(zone: ZoneType): DevelopmentPotential['setbacks'] {
  // Default R-zone setbacks per LAMC 12.11 (R3/R4/R5)
  const rZoneSetbacks = {
    front: 15,
    side: 5,
    sidePerStory: 1,  // +1 ft per story over 2nd
    sideMax: 16,
    rear: 15,
    rearPerStory: 1,  // +1 ft per story over 3rd
    rearMax: 20,
  };

  // Commercial zone setbacks per LAMC 12.14
  const cZoneSetbacks = {
    front: 0,
    side: 0,
    sidePerStory: 0,
    sideMax: 0,
    rear: 0,  // 20 ft if abutting R zone
    rearPerStory: 0,
    rearMax: 20,
  };

  // Single-family zones
  const sfSetbacks = {
    front: 20,
    side: 5,
    sidePerStory: 0,
    sideMax: 5,
    rear: 15,
    rearPerStory: 0,
    rearMax: 25,
  };

  if (zone.startsWith('C') || zone === ZoneType.CM || zone === ZoneType.CR) {
    return cZoneSetbacks;
  } else if (zone === ZoneType.R1 || zone === ZoneType.R2 || zone.startsWith('RD')) {
    return sfSetbacks;
  }
  return rZoneSetbacks;
}

/**
 * Calculate buildable footprint (lot area - setbacks)
 * Assumes rectangular lot for simplicity
 */
function calculateBuildableFootprint(
  lotSizeSF: number,
  setbacks: DevelopmentPotential['setbacks']
): number {
  // Rough estimate: assume square lot, deduct setbacks from each side
  const lotSide = Math.sqrt(lotSizeSF);
  const effectiveWidth = lotSide - setbacks.side * 2;
  const effectiveDepth = lotSide - setbacks.front - setbacks.rear;
  return Math.max(0, effectiveWidth * effectiveDepth);
}

/**
 * Calculate open space requirement
 * Source: LAMC 12.21.G
 */
function calculateOpenSpaceRequirement(
  totalUnits: number,
  isIncentiveProgram: boolean
): DevelopmentPotential['openSpace'] {
  if (isIncentiveProgram) {
    // MIIP/AHIP: 15% of lot OR 10% of floor area, whichever greater
    return {
      required: true,
      sqftPerUnit: 0,  // Calculated differently
      totalRequired: 0,  // Depends on lot/floor area
      method: '15% of lot area OR 10% of floor area (whichever greater)',
    };
  }

  // Standard requirement per LAMC 12.21.G
  // 100 SF/unit (<3 hab rooms), 125 SF (3 hab rooms), 175 SF (>3 hab rooms)
  const avgSqftPerUnit = 100;  // Conservative estimate
  return {
    required: true,
    sqftPerUnit: avgSqftPerUnit,
    totalRequired: totalUnits * avgSqftPerUnit,
    method: '100 SF/unit (<3 hab rooms), 125 SF (3 hab), 175 SF (>3 hab)',
  };
}

/**
 * Calculate bicycle parking requirement
 * Source: LAMC 12.21.A.16
 */
function calculateBicycleParking(totalUnits: number): { longTerm: number; shortTerm: number } {
  // Long-term: 1/unit (0-25), 1/1.5 units (26-100), 1/2 units (101-200), 1/4 units (201+)
  let longTerm = 0;
  if (totalUnits <= 25) {
    longTerm = totalUnits;
  } else if (totalUnits <= 100) {
    longTerm = 25 + Math.ceil((totalUnits - 25) / 1.5);
  } else if (totalUnits <= 200) {
    longTerm = 25 + 50 + Math.ceil((totalUnits - 100) / 2);
  } else {
    longTerm = 25 + 50 + 50 + Math.ceil((totalUnits - 200) / 4);
  }

  // Short-term: 1/10 units (0-25), 1/15 units (26-100), 1/20 units (101-200), 1/40 units (201+)
  let shortTerm = 0;
  if (totalUnits <= 25) {
    shortTerm = Math.ceil(totalUnits / 10);
  } else if (totalUnits <= 100) {
    shortTerm = 3 + Math.ceil((totalUnits - 25) / 15);
  } else if (totalUnits <= 200) {
    shortTerm = 3 + 5 + Math.ceil((totalUnits - 100) / 20);
  } else {
    shortTerm = 3 + 5 + 5 + Math.ceil((totalUnits - 200) / 40);
  }

  return { longTerm, shortTerm };
}

/**
 * Get parking method description based on program and location
 */
function getParkingMethod(
  program: IncentiveProgram,
  nearTransit: boolean,
  parkingRequired: number
): string {
  if (parkingRequired === 0) {
    if (nearTransit) {
      return 'No Parking per AB 2097 (within 1/2 mi of transit)';
    }
    return 'No Parking Required';
  }

  switch (program) {
    case IncentiveProgram.BY_RIGHT:
      return '1-2 spaces per unit per LAMC 12.21.A.4';
    case IncentiveProgram.STATE_DENSITY_BONUS:
      return nearTransit ? 'No Parking per AB 2097' : '0.5-1.5 spaces per unit per Gov Code 65915';
    case IncentiveProgram.MIIP_TRANSIT:
    case IncentiveProgram.MIIP_OPPORTUNITY:
      return 'No Parking per LAMC 12.22.A.38';
    case IncentiveProgram.AHIP:
      return 'No Parking per AB 2097';
    case IncentiveProgram.SB_79:
      return 'No Parking per SB 79';
    default:
      return `${parkingRequired} spaces required`;
  }
}

/**
 * Create density calculation explanation
 */
function createDensityCalculation(
  lotSizeSF: number,
  zone: ZoneType,
  buildableSF: number,
  totalUnits: number,
  program: IncentiveProgram
): DevelopmentPotential['densityCalculation'] {
  const zoneStandards = getZoneStandards(zone);
  const sfPerDU = zoneStandards?.densitySFperDU;

  if (program === IncentiveProgram.BY_RIGHT && sfPerDU) {
    return {
      method: `Lot SF / ${sfPerDU} SF per DU`,
      formula: `${lotSizeSF.toLocaleString()} SF / ${sfPerDU} = ${totalUnits} units`,
      notes: 'Per LAMC 12.03 density table',
    };
  }

  // For incentive programs with no max density
  const commonAreaPercent = 15;
  const netSF = Math.round(buildableSF * (1 - commonAreaPercent / 100));
  const avgUnitSF = 400;  // Typical studio/1BR average

  return {
    method: 'Buildable envelope / avg unit size',
    formula: `${buildableSF.toLocaleString()} SF × 0.85 (net) / ${avgUnitSF} SF = ${Math.floor(netSF / avgUnitSF)} units`,
    notes: `Assumes ${commonAreaPercent}% common areas, ${avgUnitSF} SF avg unit. Consult architect for massing study.`,
  };
}

/**
 * Add Brickwork-style fields to a partial DevelopmentPotential
 */
function addBrickworkFields(
  partial: Partial<DevelopmentPotential>,
  site: SiteInput,
  basePotential: DevelopmentPotential
): DevelopmentPotential {
  const buildableSF = partial.buildableSF || basePotential.buildableSF;
  const totalUnits = partial.totalUnits || basePotential.totalUnits;
  const program = partial.program || basePotential.program;
  const affordablePercent = partial.affordablePercent || 0;
  const incomeLevel = partial.incomeLevel || basePotential.incomeLevel;
  const parkingRequired = partial.parkingRequired ?? basePotential.parkingRequired;
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;

  const commonAreaSF = Math.round(buildableSF * 0.15);
  const netResidentialSF = buildableSF - commonAreaSF;
  const estimatedUnits = Math.floor(netResidentialSF / 400);
  const bikeParking = calculateBicycleParking(totalUnits);
  const isIncentiveProgram = program !== IncentiveProgram.BY_RIGHT;

  // Get affordability options for MIIP programs
  let affordabilityOptions: string[] = [];
  if (affordablePercent > 0) {
    affordabilityOptions = [`${affordablePercent}% at ${incomeLevel}`];
  } else {
    affordabilityOptions = ['None required'];
  }

  // Get available incentives
  let availableIncentives: string[] = [];
  const numIncentives = partial.additionalIncentivesAvailable || 0;
  if (numIncentives > 0) {
    availableIncentives = [
      'Setback reductions (up to 30%)',
      'Open space reduction',
      'Transitional height exemption',
      'Ground floor height reduction (20%)',
      'Lot width reduction (25%)',
      `Choose up to ${numIncentives} from menu`,
    ];
  }

  return {
    ...basePotential,
    ...partial,
    estimatedUnits: partial.estimatedUnits || estimatedUnits,
    buildableFootprintSF: partial.buildableFootprintSF || basePotential.buildableFootprintSF,
    commonAreaSF,
    netResidentialSF,
    setbacks: partial.setbacks || basePotential.setbacks,
    openSpace: calculateOpenSpaceRequirement(totalUnits, isIncentiveProgram),
    affordabilityOptions,
    parkingMethod: getParkingMethod(program, nearTransit, parkingRequired),
    bicycleParkingLongTerm: bikeParking.longTerm,
    bicycleParkingShortTerm: bikeParking.shortTerm,
    transitionalHeightApplies: partial.transitionalHeightApplies ?? false,
    transitionalHeightNotes: partial.transitionalHeightNotes || 'N/A',
    availableIncentives,
    densityCalculation: createDensityCalculation(
      site.lotSizeSF, site.baseZone, buildableSF, totalUnits, program
    ),
  } as DevelopmentPotential;
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
  const setbacks = getSetbackRequirements(site.baseZone);
  const buildableFootprintSF = calculateBuildableFootprint(site.lotSizeSF, setbacks);
  const commonAreaSF = Math.round(buildableSF * 0.15);
  const netResidentialSF = buildableSF - commonAreaSF;
  const estimatedUnits = Math.floor(netResidentialSF / 400);  // Avg 400 SF/unit

  const parkingRequired = baseDensity * (zoneStandards?.parkingPerUnit || 1);
  const bikeParking = calculateBicycleParking(baseDensity);
  const openSpace = calculateOpenSpaceRequirement(baseDensity, false);

  return {
    program: IncentiveProgram.BY_RIGHT,
    eligible: true,
    baseDensity,
    bonusDensity: 0,
    totalUnits: baseDensity,
    estimatedUnits,
    baseFAR,
    bonusFAR: 0,
    totalFAR: baseFAR,
    buildableSF,
    buildableFootprintSF,
    commonAreaSF,
    netResidentialSF,
    baseHeightFeet: height.maxFeet || 999,
    bonusHeightFeet: 0,
    totalHeightFeet: height.maxFeet || 999,
    baseStories: height.maxStories || 99,
    bonusStories: 0,
    totalStories: height.maxStories || 99,
    setbacks,
    openSpace,
    affordableUnits: 0,
    affordablePercent: 0,
    incomeLevel: IncomeLevel.MODERATE,
    affordabilityOptions: ['None required'],
    parkingRequired,
    parkingMethod: getParkingMethod(IncentiveProgram.BY_RIGHT, false, parkingRequired),
    bicycleParkingLongTerm: bikeParking.longTerm,
    bicycleParkingShortTerm: bikeParking.shortTerm,
    transitionalHeightApplies: false,
    transitionalHeightNotes: 'N/A',
    additionalIncentivesAvailable: 0,
    availableIncentives: [],
    densityCalculation: createDensityCalculation(
      site.lotSizeSF, site.baseZone, buildableSF, baseDensity, IncentiveProgram.BY_RIGHT
    ),
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

  const commonAreaSF = Math.round(buildableSF * 0.15);
  const netResidentialSF = buildableSF - commonAreaSF;
  const estimatedUnits = Math.floor(netResidentialSF / 400);
  const bikeParking = calculateBicycleParking(totalUnits);

  return {
    program: IncentiveProgram.STATE_DENSITY_BONUS,
    eligible: true,
    baseDensity,
    bonusDensity,
    totalUnits,
    estimatedUnits,
    baseFAR: basePotential.baseFAR,
    bonusFAR,
    totalFAR,
    buildableSF,
    buildableFootprintSF: basePotential.buildableFootprintSF,
    commonAreaSF,
    netResidentialSF,
    baseHeightFeet: basePotential.baseHeightFeet,
    bonusHeightFeet: heightBonus.additionalFeet,
    totalHeightFeet: basePotential.baseHeightFeet + heightBonus.additionalFeet,
    baseStories: basePotential.baseStories,
    bonusStories: heightBonus.additionalStories,
    totalStories: basePotential.baseStories + heightBonus.additionalStories,
    setbacks: basePotential.setbacks,
    openSpace: calculateOpenSpaceRequirement(totalUnits, true),
    affordableUnits,
    affordablePercent,
    incomeLevel,
    affordabilityOptions: [`${affordablePercent}% at ${incomeLevel}`],
    parkingRequired,
    parkingMethod: getParkingMethod(IncentiveProgram.STATE_DENSITY_BONUS, nearTransit, parkingRequired),
    bicycleParkingLongTerm: bikeParking.longTerm,
    bicycleParkingShortTerm: bikeParking.shortTerm,
    transitionalHeightApplies: false,
    transitionalHeightNotes: 'N/A - State law preempts local height limits',
    additionalIncentivesAvailable: incentives,
    availableIncentives: [
      'Up to 20% reduction in any development standard',
      'Yard setback reductions',
      'Open space reductions',
    ],
    densityCalculation: createDensityCalculation(
      site.lotSizeSF, site.baseZone, buildableSF, totalUnits, IncentiveProgram.STATE_DENSITY_BONUS
    ),
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

  return addBrickworkFields({
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
  }, site, basePotential);
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

  return addBrickworkFields({
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
    transitionalHeightApplies: true,  // OC zones may have transitional height
    transitionalHeightNotes: 'Check if adjacent to R1/R2 zone for transitional height limits',
  }, site, basePotential);
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

  return addBrickworkFields({
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
    bonusHeightFeet: totalHeightFeet - basePotential.baseHeightFeet,
    totalHeightFeet,
    baseStories: basePotential.baseStories,
    bonusStories: totalStories - basePotential.baseStories,
    totalStories,
    affordableUnits,
    affordablePercent,
    incomeLevel,
    parkingRequired: incentives.parkingRequired ? totalUnits : 0,
    additionalIncentivesAvailable: tier === MIIPCorridorTier.CT3 ? 4 : 3,
    transitionalHeightApplies: true,  // CT zones have transitional height requirements
    transitionalHeightNotes: 'Corridor Transition areas require step-backs adjacent to R1/R2 zones',
  }, site, basePotential);
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

  return addBrickworkFields({
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
    transitionalHeightApplies: false,  // State law preempts local requirements
    transitionalHeightNotes: 'N/A - 100% affordable overrides local height restrictions per Gov Code 65915',
  }, site, basePotential);
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

  // SB 79 allows MAX of base zoning density OR SB 79 density
  // The benefit is by-right approval + no parking, not necessarily more units
  const totalUnits = Math.max(sb79.maxUnits, basePotential.baseDensity);
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

  return addBrickworkFields({
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
    transitionalHeightApplies: false,  // State law preempts local restrictions
    transitionalHeightNotes: 'SB 79 preempts local zoning height restrictions near transit',
  }, site, basePotential);
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
