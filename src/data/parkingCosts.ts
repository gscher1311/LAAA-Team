/**
 * Parking Cost Tiers
 * Different parking types have significantly different construction costs
 *
 * Sources:
 * - LA Construction Cost Data (2025)
 * - RSMeans Building Construction Cost Data
 * - BOMA Parking Study
 *
 * Cost factors:
 * - Surface: Land only, minimal construction
 * - Tuck-Under: Within building footprint at grade
 * - Podium: Concrete structure supporting wood-frame above
 * - Subterranean: Excavation, shoring, waterproofing
 */

// ============================================================================
// TYPES
// ============================================================================

export enum ParkingType {
  SURFACE = 'SURFACE',           // At-grade lot
  TUCK_UNDER = 'TUCK_UNDER',     // At-grade within building footprint
  PODIUM = 'PODIUM',             // Above-grade concrete structure
  SUBTERRANEAN_1 = 'SUBTERRANEAN_1',  // 1 level below grade
  SUBTERRANEAN_2 = 'SUBTERRANEAN_2',  // 2 levels below grade
  SUBTERRANEAN_3 = 'SUBTERRANEAN_3',  // 3+ levels below grade
  MECHANICAL = 'MECHANICAL',     // Stacker/lift systems
  NO_PARKING = 'NO_PARKING'      // AB 2097 - no parking required
}

export interface ParkingCostData {
  type: ParkingType;
  name: string;
  costPerSpace: number;        // $ per space (2025 LA market)
  sfPerSpace: number;          // Typical SF per space including drive aisles
  typicalEfficiency: number;   // Spaces per 1,000 SF of parking structure
  applicability: string;       // When this type is typically used
  notes: string;
}

export interface ParkingRecommendation {
  primaryType: ParkingType;
  fallbackType?: ParkingType;
  spacesPerType: {
    type: ParkingType;
    spaces: number;
    cost: number;
  }[];
  totalCost: number;
  averageCostPerSpace: number;
  notes: string;
}

// ============================================================================
// PARKING COST DATA (2025 LA Market)
// ============================================================================

export const PARKING_COSTS: Record<ParkingType, ParkingCostData> = {
  [ParkingType.SURFACE]: {
    type: ParkingType.SURFACE,
    name: 'Surface Lot',
    costPerSpace: 8000,          // Paving, striping, lighting, landscaping
    sfPerSpace: 350,             // Space + drive aisle + landscape
    typicalEfficiency: 2.9,      // ~3 spaces per 1,000 SF
    applicability: 'Suburban sites with excess land; interim parking',
    notes: 'Lowest cost but highest land consumption. Often replaced with structured parking later.'
  },

  [ParkingType.TUCK_UNDER]: {
    type: ParkingType.TUCK_UNDER,
    name: 'Tuck-Under (At-Grade)',
    costPerSpace: 25000,         // Within building footprint
    sfPerSpace: 325,
    typicalEfficiency: 3.1,
    applicability: '3-4 story wood frame with ground-floor parking',
    notes: 'Parking at grade within building footprint. Limited density but low cost.'
  },

  [ParkingType.PODIUM]: {
    type: ParkingType.PODIUM,
    name: 'Podium (Above-Grade)',
    costPerSpace: 45000,         // Concrete structure
    sfPerSpace: 320,
    typicalEfficiency: 3.1,
    applicability: '5-over-1 podium construction; most LA multifamily',
    notes: 'Concrete pedestal with wood-frame above. Standard for 5-8 story projects.'
  },

  [ParkingType.SUBTERRANEAN_1]: {
    type: ParkingType.SUBTERRANEAN_1,
    name: 'Subterranean (1 Level)',
    costPerSpace: 65000,         // Excavation, shoring, waterproofing
    sfPerSpace: 340,
    typicalEfficiency: 2.9,
    applicability: 'High-density urban sites; high land costs',
    notes: 'First level below grade. Adds ~$20K/space vs podium for excavation.'
  },

  [ParkingType.SUBTERRANEAN_2]: {
    type: ParkingType.SUBTERRANEAN_2,
    name: 'Subterranean (2 Levels)',
    costPerSpace: 75000,         // Deeper excavation, more shoring
    sfPerSpace: 340,
    typicalEfficiency: 2.9,
    applicability: 'Very high density sites; premium locations',
    notes: 'Second level below grade. Groundwater may require pumping systems.'
  },

  [ParkingType.SUBTERRANEAN_3]: {
    type: ParkingType.SUBTERRANEAN_3,
    name: 'Subterranean (3+ Levels)',
    costPerSpace: 90000,         // Deep excavation, extensive shoring, dewatering
    sfPerSpace: 340,
    typicalEfficiency: 2.9,
    applicability: 'Ultra-high density; luxury/high-rise; difficult sites',
    notes: 'Deep excavation often requires dewatering. Cost varies greatly by soil conditions.'
  },

  [ParkingType.MECHANICAL]: {
    type: ParkingType.MECHANICAL,
    name: 'Mechanical (Stackers/Lifts)',
    costPerSpace: 35000,         // Equipment plus structure
    sfPerSpace: 180,             // Much more efficient SF utilization
    typicalEfficiency: 5.5,      // ~5-6 spaces per 1,000 SF
    applicability: 'Space-constrained sites; luxury residential',
    notes: 'High efficiency but slower retrieval. May require attendant. Higher maintenance.'
  },

  [ParkingType.NO_PARKING]: {
    type: ParkingType.NO_PARKING,
    name: 'No Parking (AB 2097)',
    costPerSpace: 0,
    sfPerSpace: 0,
    typicalEfficiency: 0,
    applicability: 'Sites within 1/2 mile of major transit',
    notes: 'AB 2097 eliminates parking minimums near transit. Developer may still choose to build parking.'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine recommended parking type based on project characteristics
 */
export function recommendParkingType(
  totalSpacesRequired: number,
  stories: number,
  lotSizeSF: number,
  nearMajorTransit: boolean,
  constructionType?: string
): ParkingRecommendation {
  // No parking required near transit (AB 2097)
  if (nearMajorTransit && totalSpacesRequired === 0) {
    return {
      primaryType: ParkingType.NO_PARKING,
      spacesPerType: [{
        type: ParkingType.NO_PARKING,
        spaces: 0,
        cost: 0
      }],
      totalCost: 0,
      averageCostPerSpace: 0,
      notes: 'No parking required per AB 2097 (within 1/2 mile of major transit)'
    };
  }

  // If no spaces required but not near transit, assume by-right exemption
  if (totalSpacesRequired === 0) {
    return {
      primaryType: ParkingType.NO_PARKING,
      spacesPerType: [{
        type: ParkingType.NO_PARKING,
        spaces: 0,
        cost: 0
      }],
      totalCost: 0,
      averageCostPerSpace: 0,
      notes: 'No parking required per program incentives'
    };
  }

  // Calculate available parking footprint (rough estimate)
  // Assume 60% of lot can be parking footprint at grade
  const availableFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(availableFootprintSF / 340); // ~340 SF per space with aisles

  // Low-rise (1-3 stories): Tuck-under or surface
  if (stories <= 3) {
    if (totalSpacesRequired <= spacesPerLevel) {
      // All parking fits at grade
      return {
        primaryType: ParkingType.TUCK_UNDER,
        spacesPerType: [{
          type: ParkingType.TUCK_UNDER,
          spaces: totalSpacesRequired,
          cost: totalSpacesRequired * PARKING_COSTS[ParkingType.TUCK_UNDER].costPerSpace
        }],
        totalCost: totalSpacesRequired * PARKING_COSTS[ParkingType.TUCK_UNDER].costPerSpace,
        averageCostPerSpace: PARKING_COSTS[ParkingType.TUCK_UNDER].costPerSpace,
        notes: 'Tuck-under parking at grade within building footprint'
      };
    } else {
      // Need surface overflow
      const tuckUnderSpaces = spacesPerLevel;
      const surfaceSpaces = totalSpacesRequired - tuckUnderSpaces;
      const tuckCost = tuckUnderSpaces * PARKING_COSTS[ParkingType.TUCK_UNDER].costPerSpace;
      const surfaceCost = surfaceSpaces * PARKING_COSTS[ParkingType.SURFACE].costPerSpace;
      return {
        primaryType: ParkingType.TUCK_UNDER,
        fallbackType: ParkingType.SURFACE,
        spacesPerType: [
          { type: ParkingType.TUCK_UNDER, spaces: tuckUnderSpaces, cost: tuckCost },
          { type: ParkingType.SURFACE, spaces: surfaceSpaces, cost: surfaceCost }
        ],
        totalCost: tuckCost + surfaceCost,
        averageCostPerSpace: (tuckCost + surfaceCost) / totalSpacesRequired,
        notes: 'Tuck-under with surface overflow'
      };
    }
  }

  // Mid-rise (4-8 stories): Podium typical
  if (stories <= 8) {
    // Podium typically 1-2 levels above grade
    const podiumLevels = stories <= 5 ? 1 : 2;
    const podiumCapacity = spacesPerLevel * podiumLevels;

    if (totalSpacesRequired <= podiumCapacity) {
      return {
        primaryType: ParkingType.PODIUM,
        spacesPerType: [{
          type: ParkingType.PODIUM,
          spaces: totalSpacesRequired,
          cost: totalSpacesRequired * PARKING_COSTS[ParkingType.PODIUM].costPerSpace
        }],
        totalCost: totalSpacesRequired * PARKING_COSTS[ParkingType.PODIUM].costPerSpace,
        averageCostPerSpace: PARKING_COSTS[ParkingType.PODIUM].costPerSpace,
        notes: `Podium parking (${podiumLevels} level${podiumLevels > 1 ? 's' : ''} above grade)`
      };
    } else {
      // Need subterranean supplement
      const podiumSpaces = podiumCapacity;
      const subSpaces = totalSpacesRequired - podiumSpaces;
      const podiumCost = podiumSpaces * PARKING_COSTS[ParkingType.PODIUM].costPerSpace;
      const subCost = subSpaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
      return {
        primaryType: ParkingType.PODIUM,
        fallbackType: ParkingType.SUBTERRANEAN_1,
        spacesPerType: [
          { type: ParkingType.PODIUM, spaces: podiumSpaces, cost: podiumCost },
          { type: ParkingType.SUBTERRANEAN_1, spaces: subSpaces, cost: subCost }
        ],
        totalCost: podiumCost + subCost,
        averageCostPerSpace: (podiumCost + subCost) / totalSpacesRequired,
        notes: 'Podium parking with 1 level subterranean'
      };
    }
  }

  // High-rise (9+ stories): Subterranean typical
  const subLevels = Math.min(3, Math.ceil(totalSpacesRequired / spacesPerLevel));

  if (subLevels === 1) {
    return {
      primaryType: ParkingType.SUBTERRANEAN_1,
      spacesPerType: [{
        type: ParkingType.SUBTERRANEAN_1,
        spaces: totalSpacesRequired,
        cost: totalSpacesRequired * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace
      }],
      totalCost: totalSpacesRequired * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace,
      averageCostPerSpace: PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace,
      notes: '1 level subterranean parking'
    };
  }

  if (subLevels === 2) {
    const level1Spaces = spacesPerLevel;
    const level2Spaces = totalSpacesRequired - level1Spaces;
    const level1Cost = level1Spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
    const level2Cost = level2Spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace;
    return {
      primaryType: ParkingType.SUBTERRANEAN_1,
      fallbackType: ParkingType.SUBTERRANEAN_2,
      spacesPerType: [
        { type: ParkingType.SUBTERRANEAN_1, spaces: level1Spaces, cost: level1Cost },
        { type: ParkingType.SUBTERRANEAN_2, spaces: level2Spaces, cost: level2Cost }
      ],
      totalCost: level1Cost + level2Cost,
      averageCostPerSpace: (level1Cost + level2Cost) / totalSpacesRequired,
      notes: '2 levels subterranean parking'
    };
  }

  // 3+ levels subterranean
  const level1Spaces = spacesPerLevel;
  const level2Spaces = spacesPerLevel;
  const level3Spaces = totalSpacesRequired - level1Spaces - level2Spaces;
  const level1Cost = level1Spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_1].costPerSpace;
  const level2Cost = level2Spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_2].costPerSpace;
  const level3Cost = level3Spaces * PARKING_COSTS[ParkingType.SUBTERRANEAN_3].costPerSpace;

  return {
    primaryType: ParkingType.SUBTERRANEAN_1,
    fallbackType: ParkingType.SUBTERRANEAN_3,
    spacesPerType: [
      { type: ParkingType.SUBTERRANEAN_1, spaces: level1Spaces, cost: level1Cost },
      { type: ParkingType.SUBTERRANEAN_2, spaces: level2Spaces, cost: level2Cost },
      { type: ParkingType.SUBTERRANEAN_3, spaces: level3Spaces, cost: level3Cost }
    ],
    totalCost: level1Cost + level2Cost + level3Cost,
    averageCostPerSpace: (level1Cost + level2Cost + level3Cost) / totalSpacesRequired,
    notes: '3+ levels subterranean parking (cost varies significantly by soil conditions)'
  };
}

/**
 * Get parking cost for a specific type
 */
export function getParkingCost(type: ParkingType): number {
  return PARKING_COSTS[type].costPerSpace;
}

/**
 * Calculate blended parking cost given a mix of types
 */
export function calculateBlendedParkingCost(
  recommendation: ParkingRecommendation
): number {
  return recommendation.totalCost;
}

/**
 * Get parking type name for display
 */
export function getParkingTypeName(type: ParkingType): string {
  return PARKING_COSTS[type].name;
}

/**
 * Format parking cost summary for output
 */
export function formatParkingCostSummary(recommendation: ParkingRecommendation): string {
  if (recommendation.primaryType === ParkingType.NO_PARKING) {
    return recommendation.notes;
  }

  const lines: string[] = [];
  for (const item of recommendation.spacesPerType) {
    const data = PARKING_COSTS[item.type];
    lines.push(`  ${data.name}: ${item.spaces} spaces × $${data.costPerSpace.toLocaleString()} = $${item.cost.toLocaleString()}`);
  }

  lines.push(`  Total: ${recommendation.spacesPerType.reduce((sum, i) => sum + i.spaces, 0)} spaces = $${recommendation.totalCost.toLocaleString()}`);
  lines.push(`  Average: $${Math.round(recommendation.averageCostPerSpace).toLocaleString()}/space`);

  return lines.join('\n');
}

// ============================================================================
// SUBTERRANEAN AVOIDANCE ANALYSIS
// ============================================================================

/**
 * Check if parking configuration requires subterranean
 */
export function requiresSubterranean(recommendation: ParkingRecommendation): boolean {
  return recommendation.spacesPerType.some(s =>
    s.type === ParkingType.SUBTERRANEAN_1 ||
    s.type === ParkingType.SUBTERRANEAN_2 ||
    s.type === ParkingType.SUBTERRANEAN_3
  );
}

/**
 * Calculate subterranean spaces and cost from recommendation
 */
export function getSubterraneanDetails(recommendation: ParkingRecommendation): {
  spaces: number;
  cost: number;
  levels: number;
} {
  let spaces = 0;
  let cost = 0;
  let levels = 0;

  for (const item of recommendation.spacesPerType) {
    if (item.type === ParkingType.SUBTERRANEAN_1) {
      spaces += item.spaces;
      cost += item.cost;
      levels = Math.max(levels, 1);
    } else if (item.type === ParkingType.SUBTERRANEAN_2) {
      spaces += item.spaces;
      cost += item.cost;
      levels = Math.max(levels, 2);
    } else if (item.type === ParkingType.SUBTERRANEAN_3) {
      spaces += item.spaces;
      cost += item.cost;
      levels = Math.max(levels, 3);
    }
  }

  return { spaces, cost, levels };
}

/**
 * Calculate parking reduction needed to avoid subterranean
 *
 * Returns percentage reduction needed to fit all parking above grade
 */
export function calculateReductionToAvoidSubterranean(
  totalSpacesRequired: number,
  stories: number,
  lotSizeSF: number
): {
  reductionNeeded: number;  // As decimal (0.20 = 20% reduction)
  spacesToReduce: number;
  currentCost: number;
  costWithReduction: number;
  savings: number;
  feasible: boolean;
  strategy: string;
} {
  // Calculate above-grade capacity
  const parkingFootprintSF = lotSizeSF * 0.60;
  const spacesPerLevel = Math.floor(parkingFootprintSF / 340);

  // Determine above-grade capacity based on building type
  let aboveGradeCapacity: number;
  if (stories <= 3) {
    // Tuck-under only
    aboveGradeCapacity = spacesPerLevel;
  } else if (stories <= 8) {
    // Podium (1-2 levels)
    const podiumLevels = stories <= 5 ? 1 : 2;
    aboveGradeCapacity = spacesPerLevel * podiumLevels;
  } else {
    // High-rise - typically 2-3 podium levels max
    aboveGradeCapacity = spacesPerLevel * 3;
  }

  // If we already fit, no reduction needed
  if (totalSpacesRequired <= aboveGradeCapacity) {
    const currentRec = recommendParkingType(totalSpacesRequired, stories, lotSizeSF, false);
    return {
      reductionNeeded: 0,
      spacesToReduce: 0,
      currentCost: currentRec.totalCost,
      costWithReduction: currentRec.totalCost,
      savings: 0,
      feasible: true,
      strategy: 'All parking fits above grade - no reduction needed',
    };
  }

  // Calculate reduction needed
  const spacesToReduce = totalSpacesRequired - aboveGradeCapacity;
  const reductionNeeded = spacesToReduce / totalSpacesRequired;

  // Calculate current cost (with subterranean)
  const currentRec = recommendParkingType(totalSpacesRequired, stories, lotSizeSF, false);

  // Calculate cost with reduction (all above grade)
  const reducedRec = recommendParkingType(aboveGradeCapacity, stories, lotSizeSF, false);

  const savings = currentRec.totalCost - reducedRec.totalCost;

  // Determine if feasible (most programs allow 20-50% reduction)
  const feasible = reductionNeeded <= 0.50;

  let strategy = '';
  if (reductionNeeded <= 0.20) {
    strategy = `Request 20% parking reduction via density bonus incentive (need ${Math.round(reductionNeeded * 100)}%)`;
  } else if (reductionNeeded <= 0.35) {
    strategy = `Use MIIP/AHIP parking elimination or request 35% reduction (need ${Math.round(reductionNeeded * 100)}%)`;
  } else if (reductionNeeded <= 0.50) {
    strategy = `Combine density bonus + transit adjacency reductions (need ${Math.round(reductionNeeded * 100)}%)`;
  } else {
    strategy = `Reduction of ${Math.round(reductionNeeded * 100)}% unlikely achievable - subterranean may be required`;
  }

  return {
    reductionNeeded,
    spacesToReduce,
    currentCost: currentRec.totalCost,
    costWithReduction: reducedRec.totalCost,
    savings,
    feasible,
    strategy,
  };
}

/**
 * Format subterranean avoidance analysis for output
 */
export function formatSubterraneanAvoidanceAnalysis(
  totalSpacesRequired: number,
  stories: number,
  lotSizeSF: number
): string {
  const analysis = calculateReductionToAvoidSubterranean(totalSpacesRequired, stories, lotSizeSF);

  const lines: string[] = [];
  lines.push('');
  lines.push('SUBTERRANEAN PARKING AVOIDANCE ANALYSIS');
  lines.push('─'.repeat(50));

  if (analysis.reductionNeeded === 0) {
    lines.push('✓ All parking fits above grade');
    lines.push(`  Parking cost: $${analysis.currentCost.toLocaleString()}`);
  } else {
    lines.push(`⚠ SUBTERRANEAN PARKING REQUIRED`);
    lines.push(`  Current: ${totalSpacesRequired} spaces required`);
    lines.push(`  Above-grade capacity: ${totalSpacesRequired - analysis.spacesToReduce} spaces`);
    lines.push(`  Subterranean needed: ${analysis.spacesToReduce} spaces`);
    lines.push('');
    lines.push(`  Current cost: $${analysis.currentCost.toLocaleString()}`);
    lines.push(`  Cost if reduced: $${analysis.costWithReduction.toLocaleString()}`);
    lines.push(`  POTENTIAL SAVINGS: $${analysis.savings.toLocaleString()}`);
    lines.push('');
    lines.push(`  Reduction needed: ${Math.round(analysis.reductionNeeded * 100)}%`);
    lines.push(`  ${analysis.feasible ? '✓ Feasible' : '✗ Difficult'}: ${analysis.strategy}`);
  }

  return lines.join('\n');
}
