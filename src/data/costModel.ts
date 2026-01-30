/**
 * Comprehensive Cost Model
 *
 * This module handles:
 * 1. Entitlement stage-based cost adjustments
 * 2. Space type cost differentiation (rentable vs common, wet vs dry)
 * 3. Timeline and carry cost calculations
 * 4. Risk premiums by project stage
 *
 * ============================================================================
 * ENTITLEMENT STAGES
 * ============================================================================
 *
 * STAGE 1: RAW LAND (Unentitled)
 * - No plans submitted
 * - Full soft cost burden on buyer
 * - Highest risk, longest timeline
 * - Soft costs: 28-35% of hard costs
 *
 * STAGE 2: ENTITLED
 * - Discretionary approvals obtained (CUP, ZA, etc.)
 * - Plans not yet submitted for permits
 * - Soft costs: 22-28% (architectural/engineering done, permits remaining)
 *
 * STAGE 3: PLAN CHECK (In Review)
 * - Plans submitted to LADBS
 * - Waiting for corrections/approval
 * - Soft costs: 15-22% (most design done, permits pending)
 *
 * STAGE 4: RTI (Ready to Issue)
 * - Plans approved, permits ready to issue
 * - Only permit fees remaining
 * - Soft costs: 8-15% (permit fees + bonds)
 *
 * STAGE 5: PERMITTED
 * - Permits issued and paid
 * - Ready to break ground
 * - Soft costs: 5-8% (just contingency + oversight)
 *
 * ============================================================================
 */

import { EntitlementStage } from '../types';

// Re-export for convenience
export { EntitlementStage };

// ============================================================================
// TYPES
// ============================================================================

export interface EntitlementStageDetails {
  stage: EntitlementStage;
  displayName: string;
  description: string;

  // Cost implications
  softCostPercentMin: number;
  softCostPercentMax: number;
  softCostPercentTypical: number;

  // What's included vs excluded
  includedCosts: string[];
  excludedCosts: string[];  // Already paid by seller

  // Timeline
  monthsToPermit: number;      // Remaining months to permits
  monthsToBreakGround: number; // Total months to construction start

  // Risk
  riskPremiumPercent: number;  // Additional return required for risk

  // Carry costs
  carryMonths: number;         // Months of holding costs to add
}

export interface SpaceTypeBreakdown {
  // Gross building area breakdown
  grossBuildingSF: number;

  // Net rentable
  netRentableSF: number;
  efficiencyRatio: number;  // Net/Gross

  // Common areas
  corridorsSF: number;
  lobbySF: number;
  amenitySF: number;
  mechanicalSF: number;

  // Unit breakdown
  avgUnitSF: number;
  wetAreaSF: number;      // Kitchen + bathroom per unit
  dryAreaSF: number;      // Living/bedroom per unit
  wetAreaPercent: number;
}

export interface DetailedCostBreakdown {
  // Hard costs by space type
  unitConstructionCost: number;      // Cost to build unit interiors
  wetAreaCost: number;               // Kitchen/bath (higher $/SF)
  dryAreaCost: number;               // Living/bedroom (lower $/SF)
  corridorCost: number;              // Hallways
  lobbyCost: number;                 // Ground floor lobby
  amenityCost: number;               // Gym, pool, etc.
  structuralCost: number;            // Shell/core
  parkingCost: number;
  totalHardCost: number;

  // Soft costs by category
  architecturalCost: number;
  engineeringCost: number;
  permitFees: number;
  impactFees: number;
  legalCost: number;
  consultantCost: number;
  contingency: number;
  totalSoftCost: number;

  // Financing
  constructionInterest: number;
  carryingCosts: number;             // Pre-construction holding
  totalFinancingCost: number;

  // Grand total
  totalDevelopmentCost: number;
}

// ============================================================================
// ENTITLEMENT STAGE DATA
// ============================================================================

export const ENTITLEMENT_STAGES: Record<EntitlementStage, EntitlementStageDetails> = {
  [EntitlementStage.RAW_LAND]: {
    stage: EntitlementStage.RAW_LAND,
    displayName: 'Raw Land (Unentitled)',
    description: 'No plans or approvals. Full entitlement process required.',

    softCostPercentMin: 0.28,
    softCostPercentMax: 0.35,
    softCostPercentTypical: 0.30,

    includedCosts: [
      'Architectural design',
      'Engineering (structural, MEP, civil)',
      'Entitlement consulting',
      'Environmental review (CEQA)',
      'Traffic study',
      'Legal fees',
      'Permit fees',
      'Impact fees (school, park, traffic)',
      'LADBS plan check fees',
      'Bonds and insurance',
      'Project management',
      'Contingency (10-15%)',
    ],
    excludedCosts: [],

    monthsToPermit: 18,        // 18 months typical for LA entitlement + permits
    monthsToBreakGround: 20,
    riskPremiumPercent: 0.05,  // 5% additional return for entitlement risk
    carryMonths: 18,
  },

  [EntitlementStage.ENTITLED]: {
    stage: EntitlementStage.ENTITLED,
    displayName: 'Entitled',
    description: 'Discretionary approvals obtained. Plans ready for permit submittal.',

    softCostPercentMin: 0.22,
    softCostPercentMax: 0.28,
    softCostPercentTypical: 0.25,

    includedCosts: [
      'Permit-ready drawings',
      'Engineering completion',
      'Permit fees',
      'Impact fees',
      'LADBS plan check fees',
      'Bonds and insurance',
      'Project management',
      'Contingency (8-10%)',
    ],
    excludedCosts: [
      'Entitlement consulting (completed)',
      'Environmental review (completed)',
      'Traffic study (completed)',
      'Initial architectural design (completed)',
    ],

    monthsToPermit: 8,
    monthsToBreakGround: 10,
    riskPremiumPercent: 0.03,
    carryMonths: 8,
  },

  [EntitlementStage.PLAN_CHECK]: {
    stage: EntitlementStage.PLAN_CHECK,
    displayName: 'In Plan Check',
    description: 'Plans submitted to LADBS. Awaiting approval or corrections.',

    softCostPercentMin: 0.15,
    softCostPercentMax: 0.22,
    softCostPercentTypical: 0.18,

    includedCosts: [
      'Plan check corrections',
      'Remaining permit fees',
      'Impact fees (if not yet paid)',
      'Bonds and insurance',
      'Project management',
      'Contingency (5-8%)',
    ],
    excludedCosts: [
      'Architectural design (completed)',
      'Engineering (completed)',
      'LADBS submittal fees (paid)',
      'Plan check fees (paid)',
    ],

    monthsToPermit: 4,
    monthsToBreakGround: 5,
    riskPremiumPercent: 0.02,
    carryMonths: 4,
  },

  [EntitlementStage.RTI]: {
    stage: EntitlementStage.RTI,
    displayName: 'RTI (Ready to Issue)',
    description: 'Plans approved. Permits ready to issue upon fee payment.',

    softCostPercentMin: 0.08,
    softCostPercentMax: 0.15,
    softCostPercentTypical: 0.12,

    includedCosts: [
      'Permit issuance fees',
      'Remaining impact fees',
      'Bonds',
      'Insurance',
      'Project management',
      'Contingency (3-5%)',
    ],
    excludedCosts: [
      'All design costs (completed)',
      'Plan check fees (paid)',
      'Most consultant fees (paid)',
    ],

    monthsToPermit: 1,
    monthsToBreakGround: 2,
    riskPremiumPercent: 0.01,
    carryMonths: 1,
  },

  [EntitlementStage.PERMITTED]: {
    stage: EntitlementStage.PERMITTED,
    displayName: 'Permitted',
    description: 'Permits issued. Ready to break ground.',

    softCostPercentMin: 0.05,
    softCostPercentMax: 0.08,
    softCostPercentTypical: 0.06,

    includedCosts: [
      'Insurance',
      'Project management/oversight',
      'Contingency (3%)',
    ],
    excludedCosts: [
      'All design costs (completed)',
      'All permit fees (paid)',
      'All impact fees (paid)',
      'Bonds (posted)',
    ],

    monthsToPermit: 0,
    monthsToBreakGround: 0,
    riskPremiumPercent: 0,
    carryMonths: 0,
  },
};

// ============================================================================
// SPACE TYPE COST DATA ($/SF by Space Type)
// ============================================================================

/**
 * Cost per SF by space type - LA Market 2025
 *
 * RATIONALE:
 * - Wet areas (kitchen/bath) require plumbing, waterproofing, tile, fixtures = expensive
 * - Dry areas (living/bedroom) are simpler = moderate cost
 * - Corridors are basic finishes = lower cost
 * - Structural/shell is consistent across = base cost
 *
 * Sources: RSMeans 2025, JLL Construction Cost Survey
 */
export const SPACE_TYPE_COSTS = {
  // Type V-A Wood Frame (4 stories max)
  TYPE_VA: {
    label: 'Type V-A (Wood Frame, 4 Stories)',
    shell: 180,           // Structure, envelope, roof
    wetArea: 220,         // Kitchen + bathroom (plumbing, tile, fixtures)
    dryArea: 140,         // Living, bedroom (drywall, flooring, paint)
    corridor: 120,        // Hallways (basic finishes)
    lobby: 180,           // Ground floor lobby (upgraded finishes)
    amenity: 200,         // Gym, lounge (specialty equipment)
    mechanical: 100,      // MEP rooms
    blendedAvg: 165,      // For quick estimates
  },

  // Type III-A (5-over-1 Podium)
  TYPE_IIIA: {
    label: 'Type III-A (5-over-1 Podium)',
    shell: 210,
    wetArea: 250,
    dryArea: 160,
    corridor: 140,
    lobby: 210,
    amenity: 230,
    mechanical: 120,
    blendedAvg: 190,
  },

  // Type I-B (Mid-Rise Concrete/Steel)
  TYPE_IB: {
    label: 'Type I-B (Mid-Rise Concrete)',
    shell: 280,
    wetArea: 300,
    dryArea: 200,
    corridor: 170,
    lobby: 260,
    amenity: 280,
    mechanical: 150,
    blendedAvg: 240,
  },

  // Type I-A (High-Rise)
  TYPE_IA: {
    label: 'Type I-A (High-Rise)',
    shell: 340,
    wetArea: 360,
    dryArea: 240,
    corridor: 200,
    lobby: 320,
    amenity: 340,
    mechanical: 180,
    blendedAvg: 290,
  },
};

/**
 * Typical unit breakdown assumptions
 *
 * Based on typical LA multifamily unit mix:
 * - Studios: ~450 SF, 20% wet area
 * - 1BR: ~650 SF, 18% wet area
 * - 2BR: ~900 SF, 16% wet area
 *
 * Wet area = kitchen (~80 SF) + bathroom(s) (~50 SF each)
 */
export const UNIT_TYPE_BREAKDOWN = {
  studio: {
    avgSF: 450,
    wetAreaPercent: 0.20,  // ~90 SF (small kitchen + bath)
    kitchenSF: 50,
    bathSF: 40,
  },
  oneBR: {
    avgSF: 650,
    wetAreaPercent: 0.18,  // ~117 SF (kitchen + bath)
    kitchenSF: 70,
    bathSF: 50,
  },
  twoBR: {
    avgSF: 900,
    wetAreaPercent: 0.16,  // ~144 SF (kitchen + 2 baths)
    kitchenSF: 80,
    bathSF: 65,            // 1.5 baths avg
  },
  threeBR: {
    avgSF: 1150,
    wetAreaPercent: 0.15,  // ~172 SF (kitchen + 2 baths)
    kitchenSF: 90,
    bathSF: 85,            // 2 baths
  },
};

/**
 * Building efficiency assumptions
 *
 * Net-to-Gross ratio varies by building type:
 * - Garden style (2-3 stories): 90-92% efficient
 * - Mid-rise (4-7 stories): 82-87% efficient
 * - High-rise (8+): 78-82% efficient
 *
 * Loss to corridors, stairs, elevators, mechanical, etc.
 */
export const BUILDING_EFFICIENCY = {
  gardenStyle: {
    label: 'Garden Style (2-3 Stories)',
    netToGross: 0.90,
    corridorPercent: 0.05,
    lobbyPercent: 0.01,
    amenityPercent: 0.02,
    mechanicalPercent: 0.02,
  },
  midRise: {
    label: 'Mid-Rise (4-7 Stories)',
    netToGross: 0.85,
    corridorPercent: 0.07,
    lobbyPercent: 0.02,
    amenityPercent: 0.03,
    mechanicalPercent: 0.03,
  },
  highRise: {
    label: 'High-Rise (8+ Stories)',
    netToGross: 0.80,
    corridorPercent: 0.08,
    lobbyPercent: 0.03,
    amenityPercent: 0.05,
    mechanicalPercent: 0.04,
  },
};

// ============================================================================
// PERMIT AND IMPACT FEES (LA Specific)
// ============================================================================

/**
 * LA Permit and Impact Fees (2025)
 *
 * Sources:
 * - LADBS Fee Schedule
 * - LAUSD Developer Fee Schedule
 * - LA DCP Impact Fee Schedule
 */
export const LA_PERMIT_FEES = {
  // LADBS fees
  buildingPermitPerSF: 3.50,      // Per gross SF
  planCheckPercent: 0.65,         // 65% of building permit
  smipFeePerSF: 0.10,             // Strong Motion Instrumentation
  energyFeePerSF: 0.05,           // Energy compliance

  // Impact fees
  schoolFeePerSF: 4.79,           // LAUSD Level 1 (residential)
  parkFeePerUnit: 1500,           // Quimby/park fee (varies by area)
  trafficFeePerUnit: 500,         // If applicable

  // AHLF is calculated separately in amiAndFees.ts

  // Bonds (refundable but tie up cash)
  performanceBondPercent: 0.01,   // 1% of construction cost
  laborMaterialBondPercent: 0.01, // 1% of construction cost
};

// ============================================================================
// CALCULATOR FUNCTIONS
// ============================================================================

/**
 * Get entitlement stage details
 */
export function getEntitlementStage(stage: EntitlementStage): EntitlementStageDetails {
  return ENTITLEMENT_STAGES[stage];
}

/**
 * Calculate soft cost percentage based on entitlement stage
 */
export function getSoftCostPercent(
  stage: EntitlementStage,
  aggressive: boolean = false
): number {
  const details = ENTITLEMENT_STAGES[stage];
  return aggressive ? details.softCostPercentMin : details.softCostPercentTypical;
}

/**
 * Calculate space type breakdown from gross building SF
 */
export function calculateSpaceBreakdown(
  grossBuildingSF: number,
  totalUnits: number,
  stories: number
): SpaceTypeBreakdown {
  // Determine building type for efficiency
  let efficiency;
  if (stories <= 3) {
    efficiency = BUILDING_EFFICIENCY.gardenStyle;
  } else if (stories <= 7) {
    efficiency = BUILDING_EFFICIENCY.midRise;
  } else {
    efficiency = BUILDING_EFFICIENCY.highRise;
  }

  const netRentableSF = Math.round(grossBuildingSF * efficiency.netToGross);
  const corridorsSF = Math.round(grossBuildingSF * efficiency.corridorPercent);
  const lobbySF = Math.round(grossBuildingSF * efficiency.lobbyPercent);
  const amenitySF = Math.round(grossBuildingSF * efficiency.amenityPercent);
  const mechanicalSF = Math.round(grossBuildingSF * efficiency.mechanicalPercent);

  const avgUnitSF = Math.round(netRentableSF / totalUnits);

  // Estimate wet/dry split (assume average 18% wet area)
  const wetAreaPercent = 0.18;
  const wetAreaSF = Math.round(avgUnitSF * wetAreaPercent);
  const dryAreaSF = avgUnitSF - wetAreaSF;

  return {
    grossBuildingSF,
    netRentableSF,
    efficiencyRatio: efficiency.netToGross,
    corridorsSF,
    lobbySF,
    amenitySF,
    mechanicalSF,
    avgUnitSF,
    wetAreaSF,
    dryAreaSF,
    wetAreaPercent,
  };
}

/**
 * Calculate detailed cost breakdown by space type
 */
export function calculateDetailedCosts(
  spaceBreakdown: SpaceTypeBreakdown,
  totalUnits: number,
  constructionType: 'TYPE_VA' | 'TYPE_IIIA' | 'TYPE_IB' | 'TYPE_IA',
  entitlementStage: EntitlementStage,
  parkingCost: number = 0
): DetailedCostBreakdown {
  const costs = SPACE_TYPE_COSTS[constructionType];
  const stageDetails = ENTITLEMENT_STAGES[entitlementStage];

  // Calculate hard costs by space type
  const totalWetSF = spaceBreakdown.wetAreaSF * totalUnits;
  const totalDrySF = spaceBreakdown.dryAreaSF * totalUnits;

  const wetAreaCost = totalWetSF * costs.wetArea;
  const dryAreaCost = totalDrySF * costs.dryArea;
  const unitConstructionCost = wetAreaCost + dryAreaCost;

  const corridorCost = spaceBreakdown.corridorsSF * costs.corridor;
  const lobbyCost = spaceBreakdown.lobbySF * costs.lobby;
  const amenityCost = spaceBreakdown.amenitySF * costs.amenity;

  // Structural/shell cost (applies to gross SF)
  const structuralCost = spaceBreakdown.grossBuildingSF * costs.shell;

  // Note: structuralCost includes the shell, wet/dry/corridor/etc. are interior finishes
  // Total hard = structural + interior finishes + parking
  const interiorFinishCost = unitConstructionCost + corridorCost + lobbyCost + amenityCost;
  const totalHardCost = structuralCost + interiorFinishCost + parkingCost;

  // Calculate soft costs based on entitlement stage
  const softCostPercent = stageDetails.softCostPercentTypical;

  // Break down soft costs by category
  const architecturalCost = totalHardCost * 0.06;   // 6% of hard costs
  const engineeringCost = totalHardCost * 0.04;     // 4% of hard costs
  const consultantCost = totalHardCost * 0.02;      // 2% other consultants

  // Permit and impact fees (LA specific)
  const permitFees =
    spaceBreakdown.grossBuildingSF * LA_PERMIT_FEES.buildingPermitPerSF +
    spaceBreakdown.grossBuildingSF * LA_PERMIT_FEES.buildingPermitPerSF * LA_PERMIT_FEES.planCheckPercent +
    spaceBreakdown.grossBuildingSF * LA_PERMIT_FEES.smipFeePerSF +
    spaceBreakdown.grossBuildingSF * LA_PERMIT_FEES.energyFeePerSF;

  const impactFees =
    spaceBreakdown.grossBuildingSF * LA_PERMIT_FEES.schoolFeePerSF +
    totalUnits * LA_PERMIT_FEES.parkFeePerUnit;

  const legalCost = totalHardCost * 0.01;           // 1% legal
  const contingency = totalHardCost * 0.05;         // 5% contingency

  // Adjust for what's already paid at this entitlement stage
  let totalSoftCost: number;
  if (entitlementStage === EntitlementStage.RAW_LAND) {
    totalSoftCost = architecturalCost + engineeringCost + permitFees + impactFees +
                    legalCost + consultantCost + contingency;
  } else if (entitlementStage === EntitlementStage.ENTITLED) {
    // Architecture mostly done, permits still needed
    totalSoftCost = (architecturalCost * 0.3) + engineeringCost + permitFees + impactFees +
                    (legalCost * 0.5) + contingency;
  } else if (entitlementStage === EntitlementStage.PLAN_CHECK) {
    // Most design done, some permits paid
    totalSoftCost = (permitFees * 0.6) + impactFees + contingency;
  } else if (entitlementStage === EntitlementStage.RTI) {
    // Just permit issuance and impact fees
    totalSoftCost = (permitFees * 0.3) + (impactFees * 0.5) + (contingency * 0.5);
  } else {
    // Permitted - just contingency
    totalSoftCost = contingency * 0.3;
  }

  // Financing costs
  const constructionMonths = 20;
  const constructionRate = 0.08;
  const avgOutstanding = (totalHardCost + totalSoftCost) * 0.6;
  const constructionInterest = avgOutstanding * constructionRate * (constructionMonths / 12);

  // Carrying costs during entitlement
  const carryRate = 0.06;  // 6% annual carry
  const carryingCosts = (totalHardCost * 0.1) * carryRate * (stageDetails.carryMonths / 12);

  const totalFinancingCost = constructionInterest + carryingCosts;
  const totalDevelopmentCost = totalHardCost + totalSoftCost + totalFinancingCost;

  return {
    unitConstructionCost,
    wetAreaCost,
    dryAreaCost,
    corridorCost,
    lobbyCost,
    amenityCost,
    structuralCost,
    parkingCost,
    totalHardCost,

    architecturalCost,
    engineeringCost,
    permitFees,
    impactFees,
    legalCost,
    consultantCost,
    contingency,
    totalSoftCost,

    constructionInterest,
    carryingCosts,
    totalFinancingCost,

    totalDevelopmentCost,
  };
}

/**
 * Format entitlement stage summary for display
 */
export function formatEntitlementStages(): string {
  const lines: string[] = [];
  const width = 90;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('ENTITLEMENT STAGES & SOFT COST IMPLICATIONS');
  lines.push('═'.repeat(width));
  lines.push('');

  for (const stage of Object.values(ENTITLEMENT_STAGES)) {
    lines.push(`${stage.displayName}`);
    lines.push('─'.repeat(width));
    lines.push(`Description: ${stage.description}`);
    lines.push('');
    lines.push(`Soft Costs: ${(stage.softCostPercentMin * 100).toFixed(0)}% - ${(stage.softCostPercentMax * 100).toFixed(0)}% of hard costs`);
    lines.push(`Typical:    ${(stage.softCostPercentTypical * 100).toFixed(0)}%`);
    lines.push('');
    lines.push(`Timeline to Permits: ${stage.monthsToPermit} months`);
    lines.push(`Timeline to Construction: ${stage.monthsToBreakGround} months`);
    lines.push(`Risk Premium: +${(stage.riskPremiumPercent * 100).toFixed(1)}% required return`);
    lines.push('');
    lines.push('Costs INCLUDED (buyer pays):');
    for (const cost of stage.includedCosts.slice(0, 5)) {
      lines.push(`  • ${cost}`);
    }
    if (stage.includedCosts.length > 5) {
      lines.push(`  ... and ${stage.includedCosts.length - 5} more`);
    }
    lines.push('');
    if (stage.excludedCosts.length > 0) {
      lines.push('Costs EXCLUDED (already paid by seller):');
      for (const cost of stage.excludedCosts.slice(0, 3)) {
        lines.push(`  • ${cost}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format space type cost breakdown for display
 */
export function formatSpaceTypeCosts(): string {
  const lines: string[] = [];
  const width = 90;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('CONSTRUCTION COST BY SPACE TYPE ($/SF)');
  lines.push('═'.repeat(width));
  lines.push('');
  lines.push('Why costs vary by space type:');
  lines.push('• Wet Areas (kitchen/bath): Plumbing, waterproofing, tile, fixtures = EXPENSIVE');
  lines.push('• Dry Areas (living/bedroom): Drywall, flooring, paint = MODERATE');
  lines.push('• Corridors: Basic finishes, code egress = LOWER');
  lines.push('• Shell/Structure: Consistent regardless of interior = BASE COST');
  lines.push('');

  const header = 'Construction Type'.padEnd(30) +
    'Shell'.padStart(10) +
    'Wet'.padStart(10) +
    'Dry'.padStart(10) +
    'Corridor'.padStart(10) +
    'Blended'.padStart(10);
  lines.push(header);
  lines.push('─'.repeat(width));

  for (const [key, costs] of Object.entries(SPACE_TYPE_COSTS)) {
    const row = costs.label.padEnd(30) +
      `$${costs.shell}`.padStart(10) +
      `$${costs.wetArea}`.padStart(10) +
      `$${costs.dryArea}`.padStart(10) +
      `$${costs.corridor}`.padStart(10) +
      `$${costs.blendedAvg}`.padStart(10);
    lines.push(row);
  }

  lines.push('');
  lines.push('Typical Unit Wet Area Breakdown:');
  lines.push('─'.repeat(width));
  lines.push('• Studio (450 SF):   ~20% wet area = 90 SF kitchen/bath');
  lines.push('• 1BR (650 SF):      ~18% wet area = 117 SF kitchen/bath');
  lines.push('• 2BR (900 SF):      ~16% wet area = 144 SF kitchen/2 baths');
  lines.push('• 3BR (1150 SF):     ~15% wet area = 172 SF kitchen/2 baths');
  lines.push('');

  return lines.join('\n');
}
