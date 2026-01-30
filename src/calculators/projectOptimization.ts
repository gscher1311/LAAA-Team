/**
 * Project Optimization Module
 *
 * Analyzes construction type and parking configuration to find optimal development strategy.
 *
 * KEY PRINCIPLES:
 * 1. AVOID SUBTERRANEAN PARKING whenever possible - it's extremely expensive
 * 2. Understand construction cost cliffs (especially 5 to 6 stories)
 * 3. Sometimes building FEWER stories is more profitable
 * 4. Parking reduction programs (AB 2097, incentive programs) can save millions
 *
 * COST REALITY (2025 LA Market):
 * - Type V-A (4 stories max): $350/SF baseline
 * - Type III-A (5 stories max): $400/SF (+14%)
 * - Type I-B (6+ stories): $500/SF (+43%)
 *
 * - Tuck-under parking: $25K/space
 * - Podium parking: $45K/space
 * - Subterranean L1: $65K/space (+$20K vs podium)
 * - Subterranean L2: $75K/space
 * - Subterranean L3+: $90K/space
 *
 * A 100-space subterranean garage vs podium = $2-4.5M additional cost
 */

import { ConstructionType, DevelopmentPotential, SiteInput } from '../types';
import {
  CONSTRUCTION_TYPE_LIMITS,
  ConstructionTypeLimits,
  getConstructionTypeLimits,
  determineRequiredConstructionType,
  getRecommendedConfiguration,
} from '../data/constructionTypes';
import {
  ParkingType,
  ParkingRecommendation,
  PARKING_COSTS,
  recommendParkingType,
} from '../data/parkingCosts';

// ============================================================================
// TYPES
// ============================================================================

export interface ConstructionCostCliff {
  fromStories: number;
  toStories: number;
  fromType: ConstructionType;
  toType: ConstructionType;
  costIncreasePercent: number;
  costIncreasePSF: number;
  description: string;
  recommendation: string;
}

export interface ParkingStrategy {
  type: 'above_grade_only' | 'with_subterranean' | 'reduced_parking' | 'no_parking';
  parkingSpaces: number;
  parkingCost: number;
  parkingCostPerSpace: number;
  subterraneanSpaces: number;
  subterraneanCost: number;
  canAvoidSubterranean: boolean;
  avoidanceStrategy?: string;
  recommendation: ParkingRecommendation;
}

export interface OptimalConfiguration {
  stories: number;
  constructionType: ConstructionType;
  constructionCostPSF: number;
  parkingStrategy: ParkingStrategy;
  totalUnitsEstimate: number;
  buildableSF: number;
  totalHardCost: number;
  totalParkingCost: number;
  totalCost: number;
  costPerUnit: number;
  notes: string[];
  warnings: string[];
}

export interface ConfigurationComparison {
  configurations: OptimalConfiguration[];
  recommended: OptimalConfiguration;
  alternativeRecommendation?: OptimalConfiguration;
  savings?: {
    amount: number;
    description: string;
  };
  costCliffs: ConstructionCostCliff[];
  analysisNotes: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Base hard cost for Type V-A (2025 LA market)
const BASE_HARD_COST_PSF = 350;

// Floor-to-floor height assumptions
const FLOOR_HEIGHT_RESIDENTIAL = 10; // feet per residential floor
const FLOOR_HEIGHT_PARKING = 11;     // feet per parking level (including podium)

// Parking space assumptions
const SF_PER_PARKING_SPACE = 340; // Including drive aisles

// ============================================================================
// CONSTRUCTION COST CLIFF ANALYSIS
// ============================================================================

/**
 * Get all construction cost cliffs
 * Shows where building one more story triggers a major cost increase
 */
export function getConstructionCostCliffs(): ConstructionCostCliff[] {
  return [
    {
      fromStories: 4,
      toStories: 5,
      fromType: ConstructionType.TYPE_VA,
      toType: ConstructionType.TYPE_IIIA,
      costIncreasePercent: 14,
      costIncreasePSF: 50,
      description: 'Type V-A wood frame to Type III-A podium (5-over-1)',
      recommendation: 'Standard transition. Podium cost is justified by additional density.',
    },
    {
      fromStories: 5,
      toStories: 6,
      fromType: ConstructionType.TYPE_IIIA,
      toType: ConstructionType.TYPE_IB,
      costIncreasePercent: 25, // 1.43 vs 1.14 = 25% jump
      costIncreasePSF: 100,
      description: 'Type III-A (5-over-1) to Type I-B concrete/steel',
      recommendation: 'MAJOR COST CLIFF. Only proceed if FAR requires 6+ stories. Consider staying at 5 stories.',
    },
    {
      fromStories: 8,
      toStories: 9,
      fromType: ConstructionType.TYPE_IB,
      toType: ConstructionType.TYPE_IB,
      costIncreasePercent: 0,
      costIncreasePSF: 0,
      description: 'Still Type I-B, but structural systems get more complex',
      recommendation: 'No code cliff, but engineering complexity increases.',
    },
    {
      fromStories: 12,
      toStories: 13,
      fromType: ConstructionType.TYPE_IB,
      toType: ConstructionType.TYPE_IA,
      costIncreasePercent: 10, // 1.57 vs 1.43 = 10%
      costIncreasePSF: 50,
      description: 'Type I-B to Type I-A (tall high-rise)',
      recommendation: 'Maximum fire resistance required. Only for very tall buildings.',
    },
  ];
}

/**
 * Identify which cost cliff applies for a given story count increase
 */
export function identifyCostCliff(fromStories: number, toStories: number): ConstructionCostCliff | null {
  const cliffs = getConstructionCostCliffs();

  for (const cliff of cliffs) {
    if (fromStories <= cliff.fromStories && toStories >= cliff.toStories) {
      return cliff;
    }
  }

  return null;
}

/**
 * Calculate the cost impact of going from N stories to N+1 stories
 */
export function calculateStoryCostImpact(
  currentStories: number,
  buildableSFPerStory: number,
  parkingPerStory: number
): {
  additionalStories: number;
  currentType: ConstructionType;
  newType: ConstructionType;
  currentCostPSF: number;
  newCostPSF: number;
  costIncreasePercent: number;
  additionalHardCost: number;
  additionalParkingCost: number;
  totalAdditionalCost: number;
  recommendation: string;
} {
  const currentType = determineRequiredConstructionType(currentStories * 11, currentStories);
  const newType = determineRequiredConstructionType((currentStories + 1) * 11, currentStories + 1);

  const currentLimits = currentType ? getConstructionTypeLimits(currentType) : null;
  const newLimits = newType ? getConstructionTypeLimits(newType) : null;

  const currentCostPSF = Math.round(BASE_HARD_COST_PSF * (currentLimits?.costFactorMultiplier ?? 1.0));
  const newCostPSF = Math.round(BASE_HARD_COST_PSF * (newLimits?.costFactorMultiplier ?? 1.0));

  // Cost of the additional floor at new construction type cost
  const additionalHardCost = buildableSFPerStory * newCostPSF;

  // If construction type changed, also need to retrofit lower floors
  let retrofitCost = 0;
  if (currentType !== newType) {
    const costDifference = newCostPSF - currentCostPSF;
    retrofitCost = (buildableSFPerStory * currentStories) * costDifference;
  }

  // Additional parking for new floor
  const additionalParkingCost = parkingPerStory * PARKING_COSTS[ParkingType.PODIUM].costPerSpace;

  const totalAdditionalCost = additionalHardCost + retrofitCost + additionalParkingCost;
  const costIncreasePercent = ((newCostPSF - currentCostPSF) / currentCostPSF) * 100;

  let recommendation = '';
  if (currentType === newType) {
    recommendation = 'No construction type change. Marginal cost increase only.';
  } else if (currentStories === 5 && newType === ConstructionType.TYPE_IB) {
    recommendation = 'MAJOR COST CLIFF: Going to 6 stories requires full concrete/steel. Consider staying at 5 stories unless FAR requires it.';
  } else {
    recommendation = `Construction type changes from ${currentType} to ${newType}. Review cost-benefit.`;
  }

  return {
    additionalStories: 1,
    currentType: currentType || ConstructionType.TYPE_VA,
    newType: newType || ConstructionType.TYPE_VA,
    currentCostPSF,
    newCostPSF,
    costIncreasePercent,
    additionalHardCost,
    additionalParkingCost: additionalParkingCost + retrofitCost,
    totalAdditionalCost,
    recommendation,
  };
}

// ============================================================================
// PARKING OPTIMIZATION - AVOID SUBTERRANEAN
// ============================================================================

/**
 * Calculate maximum parking capacity WITHOUT subterranean
 *
 * This is critical for feasibility - subterranean parking is extremely expensive
 * and should be avoided whenever possible.
 */
export function calculateMaxAboveGradeParking(
  lotSizeSF: number,
  stories: number,
  includePodium: boolean = true
): {
  tuckUnderCapacity: number;
  podiumCapacity: number;
  totalAboveGradeCapacity: number;
  podiumLevels: number;
  notes: string;
} {
  // Available parking footprint (60% of lot for parking)
  const parkingFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(parkingFootprintSF / SF_PER_PARKING_SPACE);

  // Tuck-under only works for low-rise (1-4 stories)
  const tuckUnderCapacity = stories <= 4 ? spacesPerLevel : 0;

  // Podium capacity depends on building height
  let podiumLevels = 0;
  let podiumCapacity = 0;

  if (includePodium && stories >= 4) {
    // 5-over-1: 1 level parking podium
    // 5-over-2: 2 levels parking podium
    // Higher than 7 stories: typically 2-3 levels podium
    if (stories === 5) {
      podiumLevels = 1;
    } else if (stories === 6) {
      podiumLevels = 2;
    } else if (stories <= 8) {
      podiumLevels = 2;
    } else {
      podiumLevels = 3; // Max practical for podium
    }
    podiumCapacity = spacesPerLevel * podiumLevels;
  }

  const totalAboveGradeCapacity = Math.max(tuckUnderCapacity, podiumCapacity);

  let notes = '';
  if (tuckUnderCapacity > 0) {
    notes = `Tuck-under: ${tuckUnderCapacity} spaces at grade.`;
  } else if (podiumCapacity > 0) {
    notes = `Podium: ${podiumLevels} level(s) = ${podiumCapacity} spaces.`;
  } else {
    notes = 'No above-grade parking available.';
  }

  return {
    tuckUnderCapacity,
    podiumCapacity,
    totalAboveGradeCapacity,
    podiumLevels,
    notes,
  };
}

/**
 * Develop parking strategy that prioritizes avoiding subterranean
 */
export function developParkingStrategy(
  requiredSpaces: number,
  lotSizeSF: number,
  stories: number,
  nearTransit: boolean,
  parkingReductionAvailable: number = 0 // % reduction from incentive programs
): ParkingStrategy {
  // No parking required (AB 2097 or program incentive)
  if (requiredSpaces === 0 || nearTransit) {
    const recommendation = recommendParkingType(0, stories, lotSizeSF, nearTransit);
    return {
      type: 'no_parking',
      parkingSpaces: 0,
      parkingCost: 0,
      parkingCostPerSpace: 0,
      subterraneanSpaces: 0,
      subterraneanCost: 0,
      canAvoidSubterranean: true,
      avoidanceStrategy: nearTransit ? 'AB 2097 - No parking required near transit' : 'Program eliminates parking requirement',
      recommendation,
    };
  }

  // Calculate above-grade capacity
  const aboveGrade = calculateMaxAboveGradeParking(lotSizeSF, stories, stories >= 4);

  // Effective required spaces after program reductions
  const effectiveRequired = Math.ceil(requiredSpaces * (1 - parkingReductionAvailable));

  // CAN WE FIT ALL PARKING ABOVE GRADE?
  if (effectiveRequired <= aboveGrade.totalAboveGradeCapacity) {
    // YES! Great - no subterranean needed
    const recommendation = recommendParkingType(effectiveRequired, stories, lotSizeSF, false);
    return {
      type: 'above_grade_only',
      parkingSpaces: effectiveRequired,
      parkingCost: recommendation.totalCost,
      parkingCostPerSpace: recommendation.averageCostPerSpace,
      subterraneanSpaces: 0,
      subterraneanCost: 0,
      canAvoidSubterranean: true,
      avoidanceStrategy: parkingReductionAvailable > 0
        ? `Parking reduction (${Math.round(parkingReductionAvailable * 100)}%) allows all parking above grade`
        : 'All parking fits above grade without reduction',
      recommendation,
    };
  }

  // NOT ENOUGH ABOVE-GRADE CAPACITY
  // Calculate what it would take to avoid subterranean
  const subterraneanSpacesNeeded = effectiveRequired - aboveGrade.totalAboveGradeCapacity;
  const subterraneanCost = calculateSubterraneanCost(subterraneanSpacesNeeded, lotSizeSF);

  // Calculate how much parking reduction would eliminate subterranean need
  const reductionNeeded = (subterraneanSpacesNeeded / requiredSpaces);

  // Develop alternatives to avoid subterranean
  const avoidanceStrategies: string[] = [];

  // Strategy 1: Use parking reduction programs
  if (reductionNeeded <= 0.50) {
    avoidanceStrategies.push(
      `Apply for parking reduction: ${Math.round(reductionNeeded * 100)}% reduction would eliminate subterranean need (saves $${Math.round(subterraneanCost / 1000)}K)`
    );
  }

  // Strategy 2: Build fewer units (reduces parking need)
  const unitsToReduce = Math.ceil(subterraneanSpacesNeeded / 1.0); // Assuming 1 space per unit
  if (unitsToReduce <= 10) {
    avoidanceStrategies.push(
      `Reduce ${unitsToReduce} units to fit parking above grade (may improve per-unit economics)`
    );
  }

  // Strategy 3: Build fewer stories
  if (stories > 5) {
    avoidanceStrategies.push(
      `Consider 5 stories instead: cheaper construction AND may fit parking above grade`
    );
  }

  // Strategy 4: Mechanical parking (expensive but less than subterranean)
  const mechanicalSpaces = subterraneanSpacesNeeded;
  const mechanicalCost = mechanicalSpaces * PARKING_COSTS[ParkingType.MECHANICAL].costPerSpace;
  if (mechanicalCost < subterraneanCost) {
    avoidanceStrategies.push(
      `Use mechanical stackers for overflow: $${Math.round(mechanicalCost / 1000)}K vs $${Math.round(subterraneanCost / 1000)}K subterranean`
    );
  }

  const recommendation = recommendParkingType(effectiveRequired, stories, lotSizeSF, false);

  return {
    type: 'with_subterranean',
    parkingSpaces: effectiveRequired,
    parkingCost: recommendation.totalCost,
    parkingCostPerSpace: recommendation.averageCostPerSpace,
    subterraneanSpaces: subterraneanSpacesNeeded,
    subterraneanCost,
    canAvoidSubterranean: false,
    avoidanceStrategy: avoidanceStrategies.length > 0
      ? 'ALTERNATIVES TO AVOID SUBTERRANEAN:\n• ' + avoidanceStrategies.join('\n• ')
      : 'Subterranean parking appears unavoidable for this configuration',
    recommendation,
  };
}

/**
 * Calculate cost of subterranean parking
 */
function calculateSubterraneanCost(spaces: number, lotSizeSF: number): number {
  const parkingFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(parkingFootprintSF / SF_PER_PARKING_SPACE);

  if (spaces <= spacesPerLevel) {
    return spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
  } else if (spaces <= spacesPerLevel * 2) {
    const level1 = spacesPerLevel;
    const level2 = spaces - level1;
    return (level1 * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace) +
           (level2 * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace);
  } else {
    const level1 = spacesPerLevel;
    const level2 = spacesPerLevel;
    const level3 = spaces - level1 - level2;
    return (level1 * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace) +
           (level2 * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace) +
           (level3 * PARKING_COSTS[ParkingType.SUBTERRANEAN_3].costPerSpace);
  }
}

// ============================================================================
// INTEGRATED OPTIMIZATION
// ============================================================================

/**
 * Find optimal building configuration
 *
 * Analyzes multiple story counts to find the most economical development.
 * Key insight: Sometimes building FEWER stories is more profitable because
 * you avoid expensive construction type upgrades and subterranean parking.
 */
export function findOptimalConfiguration(
  lotSizeSF: number,
  maxAllowedStories: number,
  maxAllowedFAR: number,
  parkingRatioPerUnit: number,
  nearTransit: boolean = false,
  parkingReductionPercent: number = 0
): ConfigurationComparison {
  const configurations: OptimalConfiguration[] = [];
  const analysisNotes: string[] = [];

  // Calculate buildable SF per floor
  const buildableFootprintSF = lotSizeSF * 0.55; // 55% coverage typical

  // Analyze configurations from 3 stories to max allowed
  const minStories = 3;
  const maxStories = Math.min(maxAllowedStories, 15); // Cap at 15 for practical analysis

  for (let stories = minStories; stories <= maxStories; stories++) {
    // Check if this story count exceeds FAR
    const buildableSF = buildableFootprintSF * stories;
    const actualFAR = buildableSF / lotSizeSF;

    if (actualFAR > maxAllowedFAR * 1.1) { // Allow 10% overage for analysis
      continue;
    }

    // Determine construction type
    const heightFeet = stories * FLOOR_HEIGHT_RESIDENTIAL;
    const constructionType = determineRequiredConstructionType(heightFeet, stories);
    if (!constructionType) continue;

    const limits = getConstructionTypeLimits(constructionType);
    if (!limits) continue;

    const constructionCostPSF = Math.round(BASE_HARD_COST_PSF * limits.costFactorMultiplier);

    // Estimate units (using 650 SF average unit)
    const avgUnitSF = 650;
    const netResidentialSF = buildableSF * 0.85; // 85% efficiency
    const totalUnitsEstimate = Math.floor(netResidentialSF / avgUnitSF);

    // Calculate parking needed
    const parkingRequired = Math.ceil(totalUnitsEstimate * parkingRatioPerUnit);

    // Develop parking strategy
    const parkingStrategy = developParkingStrategy(
      parkingRequired,
      lotSizeSF,
      stories,
      nearTransit,
      parkingReductionPercent
    );

    // Calculate costs
    const totalHardCost = buildableSF * constructionCostPSF;
    const totalParkingCost = parkingStrategy.parkingCost;
    const totalCost = totalHardCost + totalParkingCost;
    const costPerUnit = totalCost / totalUnitsEstimate;

    const notes: string[] = [];
    const warnings: string[] = [];

    // Add relevant notes
    if (parkingStrategy.subterraneanSpaces > 0) {
      warnings.push(`SUBTERRANEAN PARKING REQUIRED: ${parkingStrategy.subterraneanSpaces} spaces ($${Math.round(parkingStrategy.subterraneanCost / 1000)}K)`);
      if (parkingStrategy.avoidanceStrategy) {
        notes.push(parkingStrategy.avoidanceStrategy);
      }
    }

    // Identify cost cliffs
    if (stories === 5) {
      notes.push('Sweet spot: Type III-A podium construction at lowest mid-rise cost');
    } else if (stories === 6) {
      warnings.push('COST CLIFF: Requires Type I-B concrete/steel (+25% vs 5 stories)');
    }

    configurations.push({
      stories,
      constructionType,
      constructionCostPSF,
      parkingStrategy,
      totalUnitsEstimate,
      buildableSF,
      totalHardCost,
      totalParkingCost,
      totalCost,
      costPerUnit,
      notes,
      warnings,
    });
  }

  // Sort by cost per unit (most efficient first)
  configurations.sort((a, b) => a.costPerUnit - b.costPerUnit);

  // Find recommended configuration
  // Prefer configurations without subterranean parking
  const withoutSubterranean = configurations.filter(c => c.parkingStrategy.subterraneanSpaces === 0);
  const recommended = withoutSubterranean.length > 0
    ? withoutSubterranean[0]
    : configurations[0];

  // Find alternative (best with subterranean, if different)
  const withSubterranean = configurations.filter(c => c.parkingStrategy.subterraneanSpaces > 0);
  const alternative = withSubterranean.length > 0 && withSubterranean[0] !== recommended
    ? withSubterranean[0]
    : undefined;

  // Calculate savings
  let savings = undefined;
  if (alternative && recommended.parkingStrategy.subterraneanSpaces === 0) {
    const savingsAmount = alternative.totalCost - recommended.totalCost;
    if (savingsAmount > 0) {
      savings = {
        amount: savingsAmount,
        description: `Avoiding subterranean saves $${Math.round(savingsAmount / 1000)}K vs ${alternative.stories}-story option`,
      };
    }
  }

  // Analysis notes
  if (recommended.stories === 5) {
    analysisNotes.push('5-story podium (5-over-1) is optimal: Best balance of density and cost');
  }
  if (configurations.some(c => c.stories === 6 && c.parkingStrategy.subterraneanSpaces > 0)) {
    analysisNotes.push('6+ stories triggers both Type I-B construction AND likely subterranean parking');
  }
  if (nearTransit) {
    analysisNotes.push('AB 2097 eliminates parking minimums - significant cost savings');
  }

  return {
    configurations,
    recommended,
    alternativeRecommendation: alternative,
    savings,
    costCliffs: getConstructionCostCliffs(),
    analysisNotes,
  };
}

/**
 * Generate optimization summary for output
 */
export function formatOptimizationSummary(comparison: ConfigurationComparison): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('PROJECT OPTIMIZATION ANALYSIS');
  lines.push('═'.repeat(70));

  // Recommended configuration
  const rec = comparison.recommended;
  lines.push('');
  lines.push('RECOMMENDED CONFIGURATION');
  lines.push('─'.repeat(50));
  lines.push(`Stories:              ${rec.stories}`);
  lines.push(`Construction Type:    ${rec.constructionType} ($${rec.constructionCostPSF}/SF)`);
  lines.push(`Buildable SF:         ${rec.buildableSF.toLocaleString()}`);
  lines.push(`Est. Units:           ${rec.totalUnitsEstimate}`);
  lines.push(`Parking:              ${rec.parkingStrategy.parkingSpaces} spaces (${rec.parkingStrategy.type.replace('_', ' ')})`);
  lines.push(`Hard Cost:            $${Math.round(rec.totalHardCost / 1000)}K`);
  lines.push(`Parking Cost:         $${Math.round(rec.totalParkingCost / 1000)}K`);
  lines.push(`Total Cost:           $${Math.round(rec.totalCost / 1000)}K`);
  lines.push(`Cost/Unit:            $${Math.round(rec.costPerUnit / 1000)}K`);

  if (rec.notes.length > 0) {
    lines.push('');
    lines.push('Notes:');
    rec.notes.forEach(n => lines.push(`  • ${n}`));
  }

  if (rec.warnings.length > 0) {
    lines.push('');
    lines.push('⚠ Warnings:');
    rec.warnings.forEach(w => lines.push(`  ⚠ ${w}`));
  }

  // Savings
  if (comparison.savings) {
    lines.push('');
    lines.push('💰 COST SAVINGS');
    lines.push('─'.repeat(50));
    lines.push(comparison.savings.description);
  }

  // Alternative
  if (comparison.alternativeRecommendation) {
    const alt = comparison.alternativeRecommendation;
    lines.push('');
    lines.push('ALTERNATIVE (Higher Density)');
    lines.push('─'.repeat(50));
    lines.push(`${alt.stories} stories: ${alt.totalUnitsEstimate} units @ $${Math.round(alt.costPerUnit / 1000)}K/unit`);
    if (alt.parkingStrategy.subterraneanSpaces > 0) {
      lines.push(`⚠ Requires ${alt.parkingStrategy.subterraneanSpaces} subterranean spaces (+$${Math.round(alt.parkingStrategy.subterraneanCost / 1000)}K)`);
    }
  }

  // Cost cliffs
  lines.push('');
  lines.push('CONSTRUCTION COST CLIFFS');
  lines.push('─'.repeat(50));
  for (const cliff of comparison.costCliffs.slice(0, 3)) {
    lines.push(`${cliff.fromStories}→${cliff.toStories} stories: ${cliff.description}`);
    lines.push(`  +${cliff.costIncreasePercent}% (+$${cliff.costIncreasePSF}/SF)`);
  }

  // Configuration comparison table
  lines.push('');
  lines.push('ALL CONFIGURATIONS');
  lines.push('─'.repeat(70));
  lines.push(
    'Stories'.padEnd(8) +
    'Type'.padEnd(8) +
    'Units'.padEnd(7) +
    '$/SF'.padEnd(7) +
    'Parking'.padEnd(12) +
    'Sub?'.padEnd(6) +
    '$/Unit'.padEnd(10)
  );
  lines.push('─'.repeat(70));

  for (const config of comparison.configurations.slice(0, 8)) {
    const subFlag = config.parkingStrategy.subterraneanSpaces > 0 ? '⚠ YES' : 'No';
    lines.push(
      String(config.stories).padEnd(8) +
      config.constructionType.padEnd(8) +
      String(config.totalUnitsEstimate).padEnd(7) +
      `$${config.constructionCostPSF}`.padEnd(7) +
      String(config.parkingStrategy.parkingSpaces).padEnd(12) +
      subFlag.padEnd(6) +
      `$${Math.round(config.costPerUnit / 1000)}K`.padEnd(10)
    );
  }

  // Analysis notes
  if (comparison.analysisNotes.length > 0) {
    lines.push('');
    lines.push('KEY INSIGHTS');
    lines.push('─'.repeat(50));
    comparison.analysisNotes.forEach(n => lines.push(`• ${n}`));
  }

  lines.push('');
  lines.push('═'.repeat(70));

  return lines.join('\n');
}

// Note: All functions are exported inline with their declarations
