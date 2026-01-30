/**
 * Development Potential Calculator
 * Calculates what can be built under each incentive program
 *
 * ============================================================================
 * ROUNDING RULES - CRITICAL FOR ACCURATE CALCULATIONS
 * ============================================================================
 *
 * BY-RIGHT CALCULATIONS (Conservative):
 * - Base density: ROUND DOWN (Math.floor)
 *   Source: LAMC 12.03 - standard density calculation
 *   Rationale: Conservative approach for by-right entitlements
 *
 * DENSITY BONUS CALCULATIONS (Round UP per State Law):
 * - Base density for bonus: ROUND UP (Math.ceil)
 * - Bonus units: ROUND UP (Math.ceil)
 * - Affordable set-aside: ROUND UP (Math.ceil)
 *
 *   Sources:
 *   - CA Gov Code 65915(o)(5): "The number of units permitted...shall be
 *     calculated based on the number of units permitted before the application
 *     of any density bonus, with fractional results ROUNDED UP to the next
 *     whole number."
 *   - LA AHIP Guidelines (Dec 2024), Page 5: "Calculate density by dividing
 *     lot area by minimum lot area per dwelling unit...ROUND UP."
 *   - ABAG Model Density Bonus Guidelines (April 2025), Section 3.2
 *
 * PARKING CALCULATIONS:
 * - Total parking spaces: ROUND UP (Math.ceil)
 *   Source: LAMC 12.21 A.4 - parking cannot be fractional
 *
 * OPEN SPACE CALCULATIONS:
 * - Total open space SF: ROUND UP (Math.ceil)
 *   Source: LAMC 12.21 G - minimum must be met
 *
 * FAR-BASED UNIT ESTIMATES:
 * - Units from envelope: ROUND DOWN (Math.floor)
 *   Rationale: Conservative estimate; actual unit count requires architect
 *
 * ============================================================================
 * EXAMPLE: 5,000 SF lot in R3 zone (800 SF/DU) with 35% density bonus
 * ============================================================================
 *
 * BY-RIGHT:
 *   Base density = 5,000 / 800 = 6.25 → FLOOR = 6 units
 *
 * DENSITY BONUS:
 *   Base density = 5,000 / 800 = 6.25 → CEIL = 7 units (per State law)
 *   Bonus units = 7 × 0.35 = 2.45 → CEIL = 3 units
 *   Total = 7 + 3 = 10 units
 *
 * AFFORDABLE SET-ASIDE (11% VLI):
 *   Required affordable = 10 × 0.11 = 1.1 → CEIL = 2 units
 *
 * ============================================================================
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
  calculateBaseDensityForBonus,
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
 * Calculate Open Space Requirement per LAMC 12.21 G
 *
 * BY-RIGHT PROJECTS (LAMC 12.21 G):
 * - <3 habitable rooms: 100 SF per unit
 * - 3 habitable rooms: 125 SF per unit
 * - >3 habitable rooms: 175 SF per unit
 * - At least 50% must be common open space
 * - Private open space: min 50 SF, min 6 ft dimension
 * - Common open space: min 400 SF, min 15 ft dimension
 *
 * INCENTIVE PROGRAMS (MIIP/AHIP/State DB):
 * - 15% of lot area OR 10% of floor area, whichever is GREATER
 * - At least 25% must be common open space
 * - Ground floor commercial can reduce requirement
 *
 * Source: LAMC 12.21 G; MIIP Guidelines (2024)
 */
function calculateOpenSpaceRequirement(
  totalUnits: number,
  isIncentiveProgram: boolean,
  lotSizeSF: number = 0,
  buildableSF: number = 0
): DevelopmentPotential['openSpace'] {
  if (isIncentiveProgram && lotSizeSF > 0 && buildableSF > 0) {
    // MIIP/AHIP/State DB: 15% of lot OR 10% of floor area, whichever greater
    const lotBasedOpenSpace = Math.ceil(lotSizeSF * 0.15);
    const floorAreaBasedOpenSpace = Math.ceil(buildableSF * 0.10);
    const totalRequired = Math.max(lotBasedOpenSpace, floorAreaBasedOpenSpace);
    const governingMethod = lotBasedOpenSpace >= floorAreaBasedOpenSpace ? 'lot area' : 'floor area';

    return {
      required: true,
      sqftPerUnit: Math.round(totalRequired / totalUnits),
      totalRequired,
      method: `${totalRequired.toLocaleString()} SF (15% lot = ${lotBasedOpenSpace.toLocaleString()} SF, 10% floor = ${floorAreaBasedOpenSpace.toLocaleString()} SF; ${governingMethod} governs)`,
    };
  }

  if (isIncentiveProgram) {
    // Fallback for incentive programs without lot/floor data
    return {
      required: true,
      sqftPerUnit: 0,
      totalRequired: 0,
      method: '15% of lot area OR 10% of floor area (whichever greater) - per MIIP Guidelines',
    };
  }

  // BY-RIGHT: Standard requirement per LAMC 12.21 G
  // Using weighted average: assume 60% studios/1BR (<3 hab), 30% 2BR (3 hab), 10% 3BR (>3 hab)
  // Weighted: 0.6×100 + 0.3×125 + 0.1×175 = 60 + 37.5 + 17.5 = 115 SF avg
  const avgSqftPerUnit = 115;
  const totalRequired = Math.ceil(totalUnits * avgSqftPerUnit);

  return {
    required: true,
    sqftPerUnit: avgSqftPerUnit,
    totalRequired,
    method: `${totalRequired.toLocaleString()} SF (LAMC 12.21 G: 100-175 SF/unit based on hab rooms; using 115 SF avg)`,
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
 * Calculate lot coverage constraint
 * Per LAMC 12.07-12.11, certain zones have explicit lot coverage limits
 *
 * @returns Maximum footprint allowed by lot coverage, or null if no limit
 */
function calculateLotCoverageLimit(
  lotSizeSF: number,
  zone: ZoneType
): { maxFootprintSF: number; coveragePercent: number } | null {
  const standards = getZoneStandards(zone);
  if (!standards?.maxLotCoveragePercent) {
    return null;  // No explicit lot coverage limit
  }

  const maxFootprintSF = Math.floor(lotSizeSF * (standards.maxLotCoveragePercent / 100));
  return {
    maxFootprintSF,
    coveragePercent: standards.maxLotCoveragePercent,
  };
}

/**
 * Calculate FAR vs Density constraint analysis
 * Critical for Brickwork-style analysis: determines which constraint governs
 *
 * METHODOLOGY:
 * - Density-based: Units allowed by zoning density (with bonus if applicable)
 * - FAR-based: Units that physically fit within the buildable envelope
 *   Formula: (buildableSF × 0.85 efficiency) / avgUnitSF
 * - Lot coverage: May limit footprint, affecting how many floors needed
 *
 * The LIMITING FACTOR is whichever produces fewer units
 * This tells developers whether they're "leaving units on the table" due to FAR
 */
function calculateConstraintAnalysis(
  densityBasedUnits: number,
  buildableSF: number,
  avgUnitSF: number = 750,  // More realistic avg (mix of studios to 2BR)
  lotSizeSF: number = 0,
  zone: ZoneType | null = null,
  totalStories: number = 0
): {
  densityBasedUnits: number;
  farBasedUnits: number;
  effectiveUnits: number;
  limitingFactor: 'density' | 'FAR' | 'equal';
  limitingFactorNotes: string;
} {
  // Calculate FAR-based units (85% efficiency for common areas/circulation)
  const netEfficiency = 0.85;
  const netResidentialSF = buildableSF * netEfficiency;
  let farBasedUnits = Math.floor(netResidentialSF / avgUnitSF);

  // Check if lot coverage constrains the footprint
  let lotCoverageNote = '';
  if (lotSizeSF > 0 && zone) {
    const lotCoverageLimit = calculateLotCoverageLimit(lotSizeSF, zone);
    if (lotCoverageLimit) {
      // If lot coverage limits footprint, check if we can achieve the FAR
      const maxFootprint = lotCoverageLimit.maxFootprintSF;
      const setbackBasedFootprint = buildableSF / Math.max(totalStories, 1);

      if (maxFootprint < setbackBasedFootprint) {
        // Lot coverage is more restrictive than setbacks
        // Recalculate FAR-based units with constrained footprint
        const adjustedBuildableSF = maxFootprint * Math.max(totalStories, 1);
        const adjustedNetSF = adjustedBuildableSF * netEfficiency;
        const adjustedFarUnits = Math.floor(adjustedNetSF / avgUnitSF);

        if (adjustedFarUnits < farBasedUnits) {
          farBasedUnits = adjustedFarUnits;
          lotCoverageNote = ` (lot coverage ${lotCoverageLimit.coveragePercent}% limits footprint to ${maxFootprint.toLocaleString()} SF)`;
        }
      }
    }
  }

  // Determine limiting factor
  let limitingFactor: 'density' | 'FAR' | 'equal';
  let effectiveUnits: number;
  let limitingFactorNotes: string;

  if (farBasedUnits < densityBasedUnits) {
    limitingFactor = 'FAR';
    effectiveUnits = farBasedUnits;
    limitingFactorNotes = `FAR constrains: ${farBasedUnits} units fit in envelope vs ${densityBasedUnits} allowed by density${lotCoverageNote}. ` +
      `Consider requesting FAR incentive or reducing unit sizes.`;
  } else if (densityBasedUnits < farBasedUnits) {
    limitingFactor = 'density';
    effectiveUnits = densityBasedUnits;
    limitingFactorNotes = `Density constrains: ${densityBasedUnits} units allowed vs ${farBasedUnits} that would fit. ` +
      `Additional density bonus or larger units could utilize available FAR.`;
  } else {
    limitingFactor = 'equal';
    effectiveUnits = densityBasedUnits;
    limitingFactorNotes = `Density and FAR align at ${densityBasedUnits} units. Balanced development envelope.`;
  }

  return {
    densityBasedUnits,
    farBasedUnits,
    effectiveUnits,
    limitingFactor,
    limitingFactorNotes,
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

  // Calculate FAR vs Density constraint analysis
  // This is critical for brickwork-style analysis to show which constraint governs
  const constraintAnalysis = calculateConstraintAnalysis(totalUnits, buildableSF);

  return {
    ...basePotential,
    ...partial,
    estimatedUnits: partial.estimatedUnits || estimatedUnits,
    buildableFootprintSF: partial.buildableFootprintSF || basePotential.buildableFootprintSF,
    commonAreaSF,
    netResidentialSF,
    setbacks: partial.setbacks || basePotential.setbacks,
    openSpace: calculateOpenSpaceRequirement(totalUnits, isIncentiveProgram, site.lotSizeSF, buildableSF),
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
    constraintAnalysis,
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

  // Calculate FAR vs Density constraint analysis for by-right
  const constraintAnalysis = calculateConstraintAnalysis(baseDensity, buildableSF);

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
    constraintAnalysis,
  };
}

// ============================================================================
// STATE DENSITY BONUS CALCULATOR
// ============================================================================

/**
 * STATE DENSITY BONUS ROUNDING RULES (Gov Code 65915; AHIP Guidelines Dec 2024)
 *
 * Per State law and LA AHIP Guidelines, all fractional numbers must be ROUNDED UP:
 * - Base density: ROUND UP (calculateBaseDensityForBonus)
 * - Bonus units: ROUND UP (Math.ceil)
 * - Affordable set-aside: ROUND UP (Math.ceil)
 *
 * Example: 5,000 SF lot in R3 zone (800 SF/DU)
 * - Base density: 5,000 / 800 = 6.25 → ROUND UP = 7 units
 * - With 35% bonus: 7 × 0.35 = 2.45 → ROUND UP = 3 bonus units
 * - Total: 7 + 3 = 10 units
 * - 11% VLI set-aside: 10 × 0.11 = 1.1 → ROUND UP = 2 affordable units
 */
function calculateStateDensityBonusPotential(
  site: SiteInput,
  incomeLevel: IncomeLevel
): DevelopmentPotential {
  const basePotential = calculateByRight(site);

  // Use ROUND UP base density per State Density Bonus Law
  const baseDensity = calculateBaseDensityForBonus(site.lotSizeSF, site.baseZone);

  // Determine affordability percentage (use minimum for max incentives at this income level)
  // For VLI: 5% minimum for 20% bonus, up to 24% for 50% bonus
  const affordablePercent = getOptimalAffordablePercent(incomeLevel);
  const densityBonusPercent = calculateStateDensityBonus(
    affordablePercent,
    incomeLevel === IncomeLevel.VLI ? 'VLI' :
      incomeLevel === IncomeLevel.MODERATE ? 'MODERATE' : 'LOWER'
  );

  // ROUND UP bonus density per State law (Gov Code 65915)
  const bonusDensity = Math.ceil(baseDensity * (densityBonusPercent / 100));
  const totalUnits = baseDensity + bonusDensity;
  // ROUND UP affordable units per State law
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
    openSpace: calculateOpenSpaceRequirement(totalUnits, true, site.lotSizeSF, buildableSF),
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
    constraintAnalysis: calculateConstraintAnalysis(totalUnits, buildableSF),
  };
}

// ============================================================================
// MIIP TRANSIT CALCULATOR
// ============================================================================

/**
 * MIIP uses same rounding rules as State Density Bonus
 * (MIIP is layered on top of State DB per LAMC 12.22 A.38)
 */
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

  // Use ROUND UP base density per State DB law (MIIP builds on State DB)
  const baseDensity = calculateBaseDensityForBonus(site.lotSizeSF, site.baseZone);

  // Get affordability requirement
  const isHighMarket = isHighMarketArea(site.marketArea);
  const affordReq = getAffordabilityRequirement(tier, isHighMarket);
  const affordablePercent = affordReq ?
    (incomeLevel === IncomeLevel.VLI ? affordReq.vli :
      incomeLevel === IncomeLevel.ELI ? affordReq.eli : affordReq.lower) : 0;

  // Density bonus (use max for calculation) - ROUND UP per State law
  const densityBonusPercent = incentives.densityBonusMax;
  const bonusDensity = Math.ceil(baseDensity * (densityBonusPercent / 100));
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

/**
 * AHIP ROUNDING RULES (Gov Code 65915; AHIP Guidelines Dec 2024)
 * AHIP projects qualify for State Density Bonus, so all fractional
 * numbers must be ROUNDED UP per State law.
 * Source: LA AHIP Guidelines (Dec 2024), Page 5
 */
function calculateAHIPPotential(site: SiteInput): DevelopmentPotential {
  const basePotential = calculateByRight(site);

  // Use ROUND UP base density per State Density Bonus Law (AHIP qualifies for State DB)
  const baseDensity = calculateBaseDensityForBonus(site.lotSizeSF, site.baseZone);

  // Determine subarea
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
  const inHigherOpp = ['HIGH', 'HIGHEST', 'MODERATE'].includes(site.tcacArea);

  const incentives = getAHIPBaseIncentives(
    baseDensity,
    nearTransit,
    inHigherOpp,
    site.inVeryLowVehicleTravelArea || false
  );

  // AHIP uses State DB for density bonus - 100% affordable gets 80% density bonus
  // Per Gov Code 65915 and AHIP Guidelines, ROUND UP bonus density
  const densityBonusPercent = 80;
  const bonusDensity = Math.ceil(baseDensity * (densityBonusPercent / 100));
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
