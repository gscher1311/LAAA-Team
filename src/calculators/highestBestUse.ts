/**
 * Highest & Best Use Analysis
 *
 * This module implements the decision framework for determining optimal development strategy.
 *
 * KEY PRINCIPLE: Zoning shows MAXIMUM ALLOWED, Financial Analysis shows OPTIMAL TO BUILD.
 * These may differ because building less can sometimes create more land value.
 *
 * DECISION FRAMEWORK:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ STAGE 1: ZONING ANALYSIS - What's the MAXIMUM?                              │
 * │ ─────────────────────────────────────────────────────────────────────────── │
 * │ • Max FAR from zone + height district                                       │
 * │ • Max Height from zone + height district + Q conditions                     │
 * │ • Max Density from lot size / SF per unit                                   │
 * │ • Required Parking from unit count × parking ratio                          │
 * │                                                                             │
 * │ OUTPUT: "Under [LAMC 12.XX], you're entitled to X units, Y stories, Z FAR"  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                     │
 *                                     ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ STAGE 2: PHYSICAL FIT - What actually FITS on this lot?                     │
 * │ ─────────────────────────────────────────────────────────────────────────── │
 * │ • Building envelope: lot - setbacks = buildable footprint                   │
 * │ • Construction type required for height (IBC 2024 Table 504.3/504.4)        │
 * │ • Parking capacity above grade vs required                                  │
 * │   - If required > above-grade capacity → Subterranean needed                │
 * │                                                                             │
 * │ OUTPUT: "Physical constraints require Type [X] construction, [Y] parking"   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                     │
 *                                     ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ STAGE 3: FINANCIAL OPTIMIZATION - What MAXIMIZES land value?                │
 * │ ─────────────────────────────────────────────────────────────────────────── │
 * │ For each viable configuration (max, max-1 story, max-2, etc.):              │
 * │ • Calculate construction cost (× type multiplier)                           │
 * │ • Calculate parking cost (type-specific)                                    │
 * │ • Calculate revenue (units × submarket rent)                                │
 * │ • Calculate land residual = (NOI / YOC) - Total Cost                        │
 * │                                                                             │
 * │ OUTPUT: "Build [X] instead of [Y] because it creates $[Z] more land value"  │
 * │         "Reasoning: Avoiding subterranean saves $[A], outweighs [B] units"  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * COST CLIFFS (IBC 2024 / RSMeans 2025):
 * ─────────────────────────────────────
 * Stories  Type      Cost/SF   vs Baseline  Source
 * ──────── ───────── ───────── ──────────── ────────────────────────────
 * 1-4      V-A       $350      Baseline     IBC Table 601, RSMeans
 * 5        III-A     $400      +14%         IBC 504.4 (5-over-1 podium)
 * 6-7      I-B       $500      +43%         IBC 504.4 (requires concrete)
 * 8-12     I-B       $500      +43%         IBC 504.4
 * 13+      I-A       $550      +57%         IBC 504.4 (unlimited height)
 *
 * PARKING COST TIERS (LA Market 2025):
 * ────────────────────────────────────
 * Type            Cost/Space  Applicability           Source
 * ─────────────── ─────────── ─────────────────────── ────────────────
 * Surface         $8,000      Suburban, excess land   RSMeans 2025
 * Tuck-under      $25,000     1-4 story wood frame    RSMeans 2025
 * Podium          $45,000     5-7 story mid-rise      RSMeans 2025
 * Subterranean 1  $65,000     High density urban      RSMeans 2025
 * Subterranean 2  $75,000     Very high density       RSMeans 2025
 * Subterranean 3+ $90,000     Luxury/high-rise        RSMeans 2025
 *
 * KEY INSIGHT: $20-45K extra per subterranean space vs above-grade.
 * For 50 spaces, that's $1-2.25M extra cost.
 * Sometimes building 20% fewer units saves more than 20% of that cost.
 */

import { ConstructionType, SiteInput, DevelopmentPotential, IncentiveProgram } from '../types';
import {
  CONSTRUCTION_TYPE_LIMITS,
  getConstructionTypeLimits,
  determineRequiredConstructionType,
} from '../data/constructionTypes';
import {
  ParkingType,
  PARKING_COSTS,
  recommendParkingType,
  requiresSubterranean,
  getSubterraneanDetails,
  calculateReductionToAvoidSubterranean,
} from '../data/parkingCosts';
import { FinancialAnalysis, formatCurrency } from './financial';

// ============================================================================
// TYPES
// ============================================================================

export interface ZoningMaximums {
  maxFAR: number;
  maxHeightFeet: number;
  maxStories: number;
  maxDensityUnits: number;
  parkingRequired: number;
  sources: {
    far: string;
    height: string;
    density: string;
    parking: string;
  };
}

export interface PhysicalConstraints {
  buildableFootprintSF: number;
  requiredConstructionType: ConstructionType;
  constructionCostPSF: number;
  aboveGradeParkingCapacity: number;
  subterraneanRequired: boolean;
  subterraneanSpaces: number;
  subterraneanCost: number;
  notes: string[];
}

export interface ConfigurationOption {
  stories: number;
  units: number;
  buildableSF: number;
  constructionType: ConstructionType;
  constructionCostPSF: number;
  parkingSpaces: number;
  parkingType: string;
  subterraneanSpaces: number;
  hardCost: number;
  parkingCost: number;
  totalCost: number;
  estimatedNOI: number;
  landResidual: number;
  costPerUnit: number;
  isMaximum: boolean;
  reasonNotMax?: string;
}

export interface HighestBestUseAnalysis {
  // Stage 1: Zoning Maximums
  zoningMaximums: ZoningMaximums;

  // Stage 2: Physical Constraints at Maximum
  physicalConstraintsAtMax: PhysicalConstraints;

  // Stage 3: All Viable Configurations
  configurations: ConfigurationOption[];

  // Recommendation
  optimal: ConfigurationOption;
  maximum: ConfigurationOption;

  // Reasoning (why optimal ≠ maximum, if applicable)
  buildingLessThanMax: boolean;
  reasoning: string[];
  costSavings?: {
    subterraneanAvoided: number;
    constructionTypeSavings: number;
    totalSavings: number;
    unitsForegone: number;
    savingsPerForegoneUnit: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_HARD_COST_PSF = 350; // Type V-A baseline
const AVG_UNIT_SF = 700; // Average unit size for calculations
const FLOOR_HEIGHT_FT = 11; // Floor-to-floor height
const SF_PER_PARKING_SPACE = 340; // Including aisles

// ============================================================================
// STAGE 1: ZONING MAXIMUMS
// ============================================================================

/**
 * Calculate zoning maximums from site data
 *
 * This always shows the MAXIMUM allowed under zoning, regardless of
 * whether it's financially optimal to build that much.
 *
 * NOTE: Many zones in LA don't have explicit story limits - they're height-limited.
 * We derive max stories from height: maxHeight / 11 ft per floor (standard residential).
 */
export function calculateZoningMaximums(
  site: SiteInput,
  potential: DevelopmentPotential
): ZoningMaximums {
  // Derive stories from height if not explicitly limited
  const FLOOR_HEIGHT_FT = 11;
  let maxStories = potential.totalStories;
  let heightSource = '';

  if (potential.totalHeightFeet > 0 && (potential.totalStories === 0 || potential.totalStories > 50)) {
    // Stories not set or unrealistically high - derive from height
    maxStories = Math.floor(potential.totalHeightFeet / FLOOR_HEIGHT_FT);
    heightSource = `${potential.totalHeightFeet} ft max (${maxStories} stories at 11 ft/floor)`;
  } else if (potential.totalHeightFeet > 0) {
    heightSource = `${potential.totalHeightFeet} ft / ${maxStories} stories`;
  } else {
    heightSource = `${maxStories} stories (no height limit)`;
  }

  return {
    maxFAR: potential.totalFAR,
    maxHeightFeet: potential.totalHeightFeet,
    maxStories: maxStories,
    maxDensityUnits: potential.totalUnits,
    parkingRequired: potential.parkingRequired,
    sources: {
      far: `LAMC 12.21.1 (${site.baseZone}), Height District ${site.heightDistrict}`,
      height: site.hasQCondition && site.qConditionDescription
        ? `Q Condition (${site.qConditionOrdinance}): ${heightSource}`
        : `LAMC 12.21.1, Height District ${site.heightDistrict}: ${heightSource}`,
      density: `LAMC 12.22 - ${site.baseZone} density standards`,
      parking: potential.parkingRequired === 0
        ? 'AB 2097 (within 1/2 mile major transit) or program incentive'
        : `LAMC 12.21 A.4 - ${potential.parkingMethod}`,
    },
  };
}

// ============================================================================
// STAGE 2: PHYSICAL CONSTRAINTS
// ============================================================================

/**
 * Calculate physical constraints at maximum development
 */
export function calculatePhysicalConstraints(
  lotSizeSF: number,
  stories: number,
  units: number,
  parkingRatio: number
): PhysicalConstraints {
  // Buildable footprint (lot minus setbacks, ~55% typical)
  const buildableFootprintSF = lotSizeSF * 0.55;

  // Construction type required
  const heightFeet = stories * FLOOR_HEIGHT_FT;
  const constructionType = determineRequiredConstructionType(heightFeet, stories) || ConstructionType.TYPE_IA;
  const limits = getConstructionTypeLimits(constructionType);
  const constructionCostPSF = Math.round(BASE_HARD_COST_PSF * (limits?.costFactorMultiplier || 1.0));

  // Parking capacity above grade
  const parkingFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(parkingFootprintSF / SF_PER_PARKING_SPACE);

  // Podium levels based on building height
  let podiumLevels = 0;
  if (stories <= 4) {
    podiumLevels = 1; // Tuck-under
  } else if (stories <= 5) {
    podiumLevels = 1; // 5-over-1
  } else if (stories <= 7) {
    podiumLevels = 2; // 5-over-2 or similar
  } else {
    podiumLevels = 3; // Max practical podium
  }

  const aboveGradeParkingCapacity = spacesPerLevel * podiumLevels;
  const parkingRequired = Math.ceil(units * parkingRatio);
  const subterraneanRequired = parkingRequired > aboveGradeParkingCapacity;
  const subterraneanSpaces = Math.max(0, parkingRequired - aboveGradeParkingCapacity);

  // Calculate subterranean cost
  let subterraneanCost = 0;
  if (subterraneanSpaces > 0) {
    if (subterraneanSpaces <= spacesPerLevel) {
      subterraneanCost = subterraneanSpaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
    } else if (subterraneanSpaces <= spacesPerLevel * 2) {
      const l1 = spacesPerLevel;
      const l2 = subterraneanSpaces - l1;
      subterraneanCost = l1 * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace +
                         l2 * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace;
    } else {
      const l1 = spacesPerLevel;
      const l2 = spacesPerLevel;
      const l3 = subterraneanSpaces - l1 - l2;
      subterraneanCost = l1 * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace +
                         l2 * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace +
                         l3 * PARKING_COSTS[ParkingType.SUBTERRANEAN_3].costPerSpace;
    }
  }

  const notes: string[] = [];
  if (subterraneanRequired) {
    notes.push(`⚠ Subterranean parking required: ${subterraneanSpaces} spaces ($${Math.round(subterraneanCost / 1000)}K)`);
    notes.push(`Above-grade capacity: ${aboveGradeParkingCapacity} spaces (${podiumLevels} podium level${podiumLevels > 1 ? 's' : ''})`);
  }
  if (stories >= 6 && constructionType === ConstructionType.TYPE_IB) {
    notes.push(`⚠ ${stories} stories requires Type I-B construction (+43% vs Type V-A)`);
  }

  return {
    buildableFootprintSF,
    requiredConstructionType: constructionType,
    constructionCostPSF,
    aboveGradeParkingCapacity,
    subterraneanRequired,
    subterraneanSpaces,
    subterraneanCost,
    notes,
  };
}

// ============================================================================
// STAGE 3: CONFIGURATION ANALYSIS
// ============================================================================

/**
 * Generate configuration option for a specific story count
 *
 * IMPORTANT: Units are capped by zoning maximum, not just what fits physically.
 * This ensures we don't show configurations that exceed entitlements.
 */
function generateConfiguration(
  lotSizeSF: number,
  stories: number,
  maxStories: number,
  maxUnits: number,  // Zoning limit on units
  parkingRatio: number,
  rentPSF: number,
  targetYOC: number,
  nearTransit: boolean
): ConfigurationOption {
  // Calculate building size
  const buildableFootprintSF = lotSizeSF * 0.55;
  const buildableSF = buildableFootprintSF * stories;
  const netResidentialSF = buildableSF * 0.85; // 85% efficiency

  // Units limited by BOTH physical capacity AND zoning maximum
  const physicalUnits = Math.floor(netResidentialSF / AVG_UNIT_SF);
  const units = Math.min(physicalUnits, maxUnits);

  // Construction type
  const heightFeet = stories * FLOOR_HEIGHT_FT;
  const constructionType = determineRequiredConstructionType(heightFeet, stories) || ConstructionType.TYPE_VA;
  const limits = getConstructionTypeLimits(constructionType);
  const constructionCostPSF = Math.round(BASE_HARD_COST_PSF * (limits?.costFactorMultiplier || 1.0));

  // Parking - properly calculate above-grade capacity
  const parkingSpaces = nearTransit ? 0 : Math.ceil(units * parkingRatio);

  // Calculate above-grade parking capacity properly
  const parkingFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(parkingFootprintSF / SF_PER_PARKING_SPACE);

  // Determine parking type based on building configuration
  let parkingType: ParkingType;
  let podiumLevels = 0;
  let aboveGradeCapacity = 0;

  if (stories <= 3) {
    // Tuck-under at grade
    parkingType = ParkingType.TUCK_UNDER;
    aboveGradeCapacity = spacesPerLevel;
  } else if (stories <= 5) {
    // 5-over-1 podium
    podiumLevels = 1;
    parkingType = ParkingType.PODIUM;
    aboveGradeCapacity = spacesPerLevel;
  } else if (stories <= 7) {
    // 5-over-2 or similar
    podiumLevels = 2;
    parkingType = ParkingType.PODIUM;
    aboveGradeCapacity = spacesPerLevel * 2;
  } else {
    // High-rise - max 3 podium levels practical
    podiumLevels = 3;
    parkingType = ParkingType.PODIUM;
    aboveGradeCapacity = spacesPerLevel * 3;
  }

  // Calculate subterranean need
  const subterraneanSpaces = Math.max(0, parkingSpaces - aboveGradeCapacity);

  // Calculate parking costs
  let parkingCost = 0;
  const aboveGradeSpaces = Math.min(parkingSpaces, aboveGradeCapacity);

  if (nearTransit) {
    parkingCost = 0;
    parkingType = ParkingType.NO_PARKING;
  } else if (stories <= 3) {
    // Tuck-under
    parkingCost = aboveGradeSpaces * PARKING_COSTS[ParkingType.TUCK_UNDER].costPerSpace;
  } else {
    // Podium
    parkingCost = aboveGradeSpaces * PARKING_COSTS[ParkingType.PODIUM].costPerSpace;
  }

  // Add subterranean cost
  if (subterraneanSpaces > 0) {
    if (subterraneanSpaces <= spacesPerLevel) {
      parkingCost += subterraneanSpaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
    } else if (subterraneanSpaces <= spacesPerLevel * 2) {
      parkingCost += spacesPerLevel * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
      parkingCost += (subterraneanSpaces - spacesPerLevel) * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace;
    } else {
      parkingCost += spacesPerLevel * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
      parkingCost += spacesPerLevel * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace;
      parkingCost += (subterraneanSpaces - spacesPerLevel * 2) * PARKING_COSTS[ParkingType.SUBTERRANEAN_3].costPerSpace;
    }
  }

  // Costs
  const hardCost = buildableSF * constructionCostPSF;
  const softCosts = (hardCost + parkingCost) * 0.28;
  const totalCost = hardCost + parkingCost + softCosts;

  // Revenue (simplified)
  const annualRent = netResidentialSF * rentPSF * 12;
  const effectiveRent = annualRent * 0.95; // 5% vacancy
  const noi = effectiveRent * 0.65; // 35% OpEx

  // Land residual
  const landResidual = Math.max(0, (noi / targetYOC) - totalCost);

  const isMaximum = stories === maxStories || units === maxUnits;
  let reasonNotMax = undefined;
  if (!isMaximum) {
    if (subterraneanSpaces === 0) {
      reasonNotMax = 'Avoids subterranean parking';
    } else if (constructionType === ConstructionType.TYPE_VA || constructionType === ConstructionType.TYPE_IIIA) {
      reasonNotMax = 'Lower construction cost per SF';
    }
  }

  return {
    stories,
    units,
    buildableSF,
    constructionType,
    constructionCostPSF,
    parkingSpaces,
    parkingType: parkingType,
    subterraneanSpaces,
    hardCost,
    parkingCost,
    totalCost,
    estimatedNOI: noi,
    landResidual,
    costPerUnit: units > 0 ? totalCost / units : 0,
    isMaximum,
    reasonNotMax,
  };
}

/**
 * Run full highest & best use analysis
 *
 * NOTE: AB 2097 (effective July 2023) eliminates minimum parking requirements
 * for projects within 1/2 mile (2,640 ft) of major transit stops.
 * This is reflected when potential.parkingRequired === 0.
 */
export function analyzeHighestBestUse(
  site: SiteInput,
  potential: DevelopmentPotential,
  rentPSF: number = 4.25,
  targetYOC: number = 0.055,
  parkingRatio: number = 1.0
): HighestBestUseAnalysis {
  // Check AB 2097: If the site is within 1/2 mile of major transit, no parking required
  // This is already reflected in potential.parkingRequired when calculated
  const nearTransit = potential.parkingRequired === 0 ||
    (site.distanceToMajorTransitFeet !== undefined && site.distanceToMajorTransitFeet <= 2640);

  // Stage 1: Zoning maximums
  const zoningMaximums = calculateZoningMaximums(site, potential);

  // Stage 2: Physical constraints at maximum
  const physicalConstraintsAtMax = calculatePhysicalConstraints(
    site.lotSizeSF,
    potential.totalStories,
    potential.totalUnits,
    nearTransit ? 0 : parkingRatio
  );

  // Stage 3: Generate all configurations from 3 stories to max
  // Cap stories at practical mid-rise limits unless high-rise is explicitly permitted
  // Most LA incentive projects (MIIP, AHIP, State DB) max out at 5-7 stories
  // Full high-rise (8+) requires Type I-B/I-A construction with significant cost premium
  const minStories = 3;

  // Derive practical max stories from height if height-limited
  // Standard floor-to-floor: 11 ft for residential
  const FLOOR_HEIGHT_FT = 11;
  const derivedMaxStories = potential.totalHeightFeet
    ? Math.floor(potential.totalHeightFeet / FLOOR_HEIGHT_FT)
    : 8; // Default practical limit for mid-rise

  // Use the lesser of: zoning stories, derived from height, or 12 (practical analysis cap)
  const maxStories = Math.min(
    potential.totalStories > 0 ? potential.totalStories : 99,
    derivedMaxStories,
    12
  );
  const maxUnits = potential.totalUnits; // Zoning limit on units
  const configurations: ConfigurationOption[] = [];

  for (let stories = minStories; stories <= maxStories; stories++) {
    const config = generateConfiguration(
      site.lotSizeSF,
      stories,
      maxStories,
      maxUnits,  // Pass zoning limit on units
      nearTransit ? 0 : parkingRatio,
      rentPSF,
      targetYOC,
      nearTransit
    );
    configurations.push(config);
  }

  // Sort by land residual (highest first)
  configurations.sort((a, b) => b.landResidual - a.landResidual);

  // Find optimal and maximum
  const optimal = configurations[0];
  const maximum = configurations.find(c => c.isMaximum) || optimal;

  // Determine if we're recommending less than max
  const buildingLessThanMax = optimal.stories < maximum.stories;

  // Generate reasoning
  const reasoning: string[] = [];
  let costSavings = undefined;

  if (buildingLessThanMax) {
    reasoning.push(`RECOMMENDATION: Build ${optimal.stories} stories instead of maximum ${maximum.stories} stories`);
    reasoning.push('');
    reasoning.push('REASONING:');

    // Calculate savings
    const constructionTypeSavings = (maximum.constructionCostPSF - optimal.constructionCostPSF) * optimal.buildableSF;
    const subterraneanAvoided = maximum.subterraneanSpaces > 0 && optimal.subterraneanSpaces === 0
      ? physicalConstraintsAtMax.subterraneanCost
      : 0;
    const totalSavings = constructionTypeSavings + subterraneanAvoided;
    const unitsForegone = maximum.units - optimal.units;
    const savingsPerForegoneUnit = unitsForegone > 0 ? totalSavings / unitsForegone : 0;

    if (constructionTypeSavings > 0) {
      reasoning.push(`• Construction type: ${optimal.constructionType} ($${optimal.constructionCostPSF}/SF) vs ${maximum.constructionType} ($${maximum.constructionCostPSF}/SF)`);
      reasoning.push(`  Savings: $${Math.round(constructionTypeSavings / 1000)}K`);
      reasoning.push(`  Source: IBC 2024 Table 504.4 - Stories by Construction Type`);
    }

    if (subterraneanAvoided > 0) {
      reasoning.push(`• Parking: ${optimal.stories} stories allows all ${optimal.parkingSpaces} spaces above grade`);
      reasoning.push(`  ${maximum.stories} stories would require ${maximum.subterraneanSpaces} subterranean spaces`);
      reasoning.push(`  Savings: $${Math.round(subterraneanAvoided / 1000)}K`);
      reasoning.push(`  Source: RSMeans 2025 - Subterranean costs $20-45K more per space than podium`);
    }

    reasoning.push('');
    reasoning.push(`TRADE-OFF ANALYSIS:`);
    reasoning.push(`• Units foregone: ${unitsForegone} (${maximum.units} → ${optimal.units})`);
    reasoning.push(`• Cost savings: $${Math.round(totalSavings / 1000)}K`);
    reasoning.push(`• Savings per foregone unit: $${Math.round(savingsPerForegoneUnit / 1000)}K`);
    reasoning.push(`• Land residual improvement: +$${Math.round((optimal.landResidual - maximum.landResidual) / 1000)}K`);

    costSavings = {
      subterraneanAvoided,
      constructionTypeSavings,
      totalSavings,
      unitsForegone,
      savingsPerForegoneUnit,
    };
  } else {
    reasoning.push(`RECOMMENDATION: Build to zoning maximum (${maximum.stories} stories)`);
    reasoning.push('');
    reasoning.push('REASONING:');
    reasoning.push(`• Maximum development produces highest land residual`);
    if (!physicalConstraintsAtMax.subterraneanRequired) {
      reasoning.push(`• All parking fits above grade - no subterranean cost penalty`);
    }
    if (maximum.constructionType === ConstructionType.TYPE_VA || maximum.constructionType === ConstructionType.TYPE_IIIA) {
      reasoning.push(`• Efficient construction type (${maximum.constructionType})`);
    }
  }

  return {
    zoningMaximums,
    physicalConstraintsAtMax,
    configurations,
    optimal,
    maximum,
    buildingLessThanMax,
    reasoning,
    costSavings,
  };
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Format highest & best use analysis for display
 */
export function formatHighestBestUseAnalysis(analysis: HighestBestUseAnalysis): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('HIGHEST & BEST USE ANALYSIS');
  lines.push('═'.repeat(80));

  // Stage 1: Zoning Maximums
  lines.push('');
  lines.push('STAGE 1: ZONING MAXIMUMS (What\'s ENTITLED)');
  lines.push('─'.repeat(80));
  lines.push(`Max FAR:       ${analysis.zoningMaximums.maxFAR.toFixed(2)}`);
  lines.push(`  Source:      ${analysis.zoningMaximums.sources.far}`);
  lines.push(`Max Height:    ${analysis.zoningMaximums.maxHeightFeet} ft / ${analysis.zoningMaximums.maxStories} stories`);
  lines.push(`  Source:      ${analysis.zoningMaximums.sources.height}`);
  lines.push(`Max Units:     ${analysis.zoningMaximums.maxDensityUnits}`);
  lines.push(`  Source:      ${analysis.zoningMaximums.sources.density}`);
  lines.push(`Parking Req:   ${analysis.zoningMaximums.parkingRequired} spaces`);
  lines.push(`  Source:      ${analysis.zoningMaximums.sources.parking}`);

  // Stage 2: Physical Constraints
  lines.push('');
  lines.push('STAGE 2: PHYSICAL CONSTRAINTS (What FITS)');
  lines.push('─'.repeat(80));
  lines.push(`Construction:  ${analysis.physicalConstraintsAtMax.requiredConstructionType} @ $${analysis.physicalConstraintsAtMax.constructionCostPSF}/SF`);
  lines.push(`Above-grade parking capacity: ${analysis.physicalConstraintsAtMax.aboveGradeParkingCapacity} spaces`);
  if (analysis.physicalConstraintsAtMax.subterraneanRequired) {
    lines.push(`⚠ SUBTERRANEAN REQUIRED: ${analysis.physicalConstraintsAtMax.subterraneanSpaces} spaces`);
    lines.push(`  Additional cost: $${Math.round(analysis.physicalConstraintsAtMax.subterraneanCost / 1000)}K`);
  } else {
    lines.push(`✓ All parking fits above grade`);
  }

  // Stage 3: Configurations
  lines.push('');
  lines.push('STAGE 3: CONFIGURATION COMPARISON');
  lines.push('─'.repeat(80));
  lines.push(
    'Stories'.padEnd(8) +
    'Units'.padEnd(7) +
    'Type'.padEnd(8) +
    '$/SF'.padEnd(7) +
    'Sub?'.padEnd(8) +
    'Cost'.padEnd(10) +
    'Land Val'.padEnd(10) +
    'Note'
  );
  lines.push('─'.repeat(80));

  for (const config of analysis.configurations.slice(0, 8)) {
    const subFlag = config.subterraneanSpaces > 0 ? `${config.subterraneanSpaces} sp` : 'No';
    const isOptimal = config === analysis.optimal ? ' ★ OPTIMAL' : '';
    const isMax = config.isMaximum ? ' (MAX)' : '';
    lines.push(
      String(config.stories).padEnd(8) +
      String(config.units).padEnd(7) +
      config.constructionType.padEnd(8) +
      `$${config.constructionCostPSF}`.padEnd(7) +
      subFlag.padEnd(8) +
      `$${Math.round(config.totalCost / 1000)}K`.padEnd(10) +
      `$${Math.round(config.landResidual / 1000)}K`.padEnd(10) +
      isOptimal + isMax
    );
  }

  // Reasoning
  lines.push('');
  lines.push('─'.repeat(80));
  for (const line of analysis.reasoning) {
    lines.push(line);
  }

  lines.push('');
  lines.push('═'.repeat(80));

  return lines.join('\n');
}

/**
 * Generate short recommendation for summary output
 */
export function generateHBURecommendation(analysis: HighestBestUseAnalysis): string {
  if (analysis.buildingLessThanMax) {
    return `Build ${analysis.optimal.stories} stories (not max ${analysis.maximum.stories}) to avoid ${
      analysis.costSavings?.subterraneanAvoided ? 'subterranean parking' : 'Type I-B construction'
    }. Saves $${Math.round((analysis.costSavings?.totalSavings || 0) / 1000)}K.`;
  }
  return `Build to zoning maximum: ${analysis.maximum.stories} stories, ${analysis.maximum.units} units.`;
}
