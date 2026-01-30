/**
 * Multi-Parcel Assembly Module
 *
 * Handles land deals involving multiple parcels that will be combined
 * into a single development site.
 *
 * ============================================================================
 * COMMON SCENARIOS
 * ============================================================================
 *
 * 1. SAME ZONING (Simple)
 *    - All parcels have identical zone + height district
 *    - Simply sum lot sizes, treat as single site
 *    - Most common scenario (~80% of assemblages)
 *
 * 2. DIFFERENT ZONES (Complex)
 *    - Parcels have different base zones or height districts
 *    - Options:
 *      a) Use most restrictive zoning for entire site
 *      b) Calculate pro-rata based on lot areas
 *      c) Develop each portion according to its own zoning
 *
 * 3. MIXED Q CONDITIONS
 *    - Some parcels have Q conditions, others don't
 *    - Q conditions typically apply only to their parcel
 *    - But can affect overall site planning
 *
 * ============================================================================
 * ZONING RULES FOR ASSEMBLED SITES
 * ============================================================================
 *
 * Per LAMC and LA Planning practice:
 * - For UNIFIED development: Most restrictive zoning typically applies
 * - For SEPARATE development: Each parcel follows its own zoning
 * - Density bonuses apply to COMBINED site if unified
 * - Height transitions may apply at zone boundaries
 *
 * ============================================================================
 */

import {
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  EntitlementStage,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for a single parcel in an assemblage
 */
export interface ParcelInput {
  // Identification
  apn: string;                    // Assessor Parcel Number (required for multi-parcel)
  address?: string;               // Street address if different from main
  parcelLabel?: string;           // User-friendly label (e.g., "Corner Lot", "Parcel A")

  // Physical
  lotSizeSF: number;
  lotWidthFeet?: number;
  lotDepthFeet?: number;

  // Zoning
  baseZone: ZoneType;
  heightDistrict: HeightDistrict;

  // Q/D/T Conditions (parcel-specific)
  hasQCondition?: boolean;
  qConditionOrdinance?: string;
  qConditionDescription?: string;
  hasDLimitation?: boolean;
  dLimitationDescription?: string;

  // Specific Plan (may vary by parcel)
  specificPlan?: string;
  specificPlanSubarea?: string;

  // Overlays (parcel-specific)
  inHPOZ?: boolean;
  inNSO?: boolean;
  inRFA?: boolean;
}

/**
 * Analysis mode for multi-parcel sites
 */
export enum AssemblyAnalysisMode {
  /**
   * UNIFIED: Treat entire assemblage as single development site
   * - Uses most restrictive zoning
   * - Density calculated on combined lot size
   * - Most common for typical apartment developments
   */
  UNIFIED = 'UNIFIED',

  /**
   * PRO_RATA: Weight zoning by lot area
   * - Calculates effective FAR/density based on area-weighted average
   * - Used when zones are similar but not identical
   */
  PRO_RATA = 'PRO_RATA',

  /**
   * SEPARATE: Analyze each parcel independently
   * - May be required if zones are incompatible
   * - Results in separate building envelopes
   * - Sums land values at the end
   */
  SEPARATE = 'SEPARATE',
}

/**
 * Result of zone comparison between parcels
 */
export interface ZoneComparisonResult {
  allSameZone: boolean;
  allSameHeightDistrict: boolean;
  isUniformSite: boolean;          // Same zone AND height district
  dominantZone: ZoneType;          // Zone covering most area
  dominantHeightDistrict: HeightDistrict;
  mostRestrictiveZone: ZoneType;
  mostRestrictiveHeightDistrict: HeightDistrict;
  zoneBreakdown: Array<{
    zone: ZoneType;
    heightDistrict: HeightDistrict;
    totalSF: number;
    percentOfSite: number;
    parcels: string[];  // APNs
  }>;
  warnings: string[];
  recommendations: string[];
}

/**
 * Assembled site combining multiple parcels
 */
export interface AssembledSite {
  // Assembly metadata
  isMultiParcel: true;
  analysisMode: AssemblyAnalysisMode;
  parcels: ParcelInput[];
  parcelCount: number;

  // Combined physical characteristics
  totalLotSizeSF: number;
  combinedAddress: string;         // Primary address for the assemblage

  // Zone analysis
  zoneComparison: ZoneComparisonResult;

  // Effective zoning (based on analysis mode)
  effectiveZone: ZoneType;
  effectiveHeightDistrict: HeightDistrict;

  // Combined constraints
  hasAnyQCondition: boolean;
  qConditionSummary: string[];
  hasAnyDLimitation: boolean;

  // For conversion to SiteInput
  asSiteInput: SiteInput;
}

/**
 * Single site (for type consistency)
 */
export interface SingleSite {
  isMultiParcel: false;
  parcel: ParcelInput;
  asSiteInput: SiteInput;
}

export type AnalysisSite = AssembledSite | SingleSite;

// ============================================================================
// ZONE RESTRICTIVENESS RANKING
// ============================================================================

/**
 * Zone restrictiveness score (lower = more restrictive for residential)
 * Based on allowed density, FAR, and use flexibility
 */
const ZONE_RESTRICTIVENESS: Record<ZoneType, number> = {
  // Most restrictive (single-family, low density)
  [ZoneType.RA]: 10,
  [ZoneType.RE40]: 15,
  [ZoneType.RE20]: 20,
  [ZoneType.RE15]: 25,
  [ZoneType.RE11]: 30,
  [ZoneType.RE9]: 35,
  [ZoneType.RS]: 40,
  [ZoneType.R1]: 45,
  [ZoneType.RU]: 48,
  [ZoneType.R2]: 50,

  // Zero side yard (still low density)
  [ZoneType.RZ2_5]: 52,
  [ZoneType.RZ3]: 53,
  [ZoneType.RZ4]: 54,

  // Multi-family (more permissive)
  [ZoneType.RD6]: 55,
  [ZoneType.RD5]: 56,
  [ZoneType.RD4]: 57,
  [ZoneType.RD3]: 58,
  [ZoneType.RD2]: 59,
  [ZoneType.RD1_5]: 60,
  [ZoneType.RW1]: 62,
  [ZoneType.RW2]: 63,
  [ZoneType.R3]: 65,
  [ZoneType.RAS3]: 68,
  [ZoneType.R4]: 70,
  [ZoneType.RAS4]: 73,
  [ZoneType.R5]: 75,
  [ZoneType.RMP]: 50,  // Mobile home park - special case

  // Commercial (most flexible for residential)
  [ZoneType.CR]: 78,
  [ZoneType.C1]: 80,
  [ZoneType.C1_5]: 82,
  [ZoneType.C2]: 85,
  [ZoneType.C4]: 87,
  [ZoneType.C5]: 88,
  [ZoneType.CM]: 75,  // Limited residential

  // Manufacturing (limited/no residential)
  [ZoneType.MR1]: 30,
  [ZoneType.MR2]: 25,
  [ZoneType.M1]: 20,
  [ZoneType.M2]: 15,
  [ZoneType.M3]: 10,

  // Agricultural
  [ZoneType.A1]: 20,
  [ZoneType.A2]: 25,

  // Open Space / Public (no residential)
  [ZoneType.OS]: 5,
  [ZoneType.PF]: 5,
  [ZoneType.SL]: 5,
  [ZoneType.P]: 5,
  [ZoneType.PB]: 5,
};

/**
 * Height district restrictiveness (lower = more restrictive)
 */
const HEIGHT_DISTRICT_RESTRICTIVENESS: Record<HeightDistrict, number> = {
  [HeightDistrict.HD_1XL]: 10,  // Most restrictive
  [HeightDistrict.HD_1VL]: 20,
  [HeightDistrict.HD_1SS]: 25,
  [HeightDistrict.HD_1L]: 30,
  [HeightDistrict.HD_1]: 50,
  [HeightDistrict.HD_2]: 70,
  [HeightDistrict.HD_3]: 85,
  [HeightDistrict.HD_4]: 100,  // Least restrictive
};

// ============================================================================
// PARCEL ASSEMBLY FUNCTIONS
// ============================================================================

/**
 * Compare zones across parcels to determine compatibility
 */
export function compareZones(parcels: ParcelInput[]): ZoneComparisonResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Group parcels by zone + height district
  const zoneGroups = new Map<string, {
    zone: ZoneType;
    heightDistrict: HeightDistrict;
    totalSF: number;
    parcels: string[];
  }>();

  for (const parcel of parcels) {
    const key = `${parcel.baseZone}-${parcel.heightDistrict}`;
    const existing = zoneGroups.get(key);

    if (existing) {
      existing.totalSF += parcel.lotSizeSF;
      existing.parcels.push(parcel.apn);
    } else {
      zoneGroups.set(key, {
        zone: parcel.baseZone,
        heightDistrict: parcel.heightDistrict,
        totalSF: parcel.lotSizeSF,
        parcels: [parcel.apn],
      });
    }
  }

  const totalSF = parcels.reduce((sum, p) => sum + p.lotSizeSF, 0);

  // Convert to array with percentages
  const zoneBreakdown = Array.from(zoneGroups.values()).map(group => ({
    ...group,
    percentOfSite: (group.totalSF / totalSF) * 100,
  })).sort((a, b) => b.totalSF - a.totalSF);

  // Check uniformity
  const uniqueZones = new Set(parcels.map(p => p.baseZone));
  const uniqueHeightDistricts = new Set(parcels.map(p => p.heightDistrict));
  const allSameZone = uniqueZones.size === 1;
  const allSameHeightDistrict = uniqueHeightDistricts.size === 1;
  const isUniformSite = allSameZone && allSameHeightDistrict;

  // Find dominant zone (by area)
  const dominantGroup = zoneBreakdown[0];
  const dominantZone = dominantGroup.zone;
  const dominantHeightDistrict = dominantGroup.heightDistrict;

  // Find most restrictive
  let mostRestrictiveZone = parcels[0].baseZone;
  let mostRestrictiveHeightDistrict = parcels[0].heightDistrict;

  for (const parcel of parcels) {
    if (ZONE_RESTRICTIVENESS[parcel.baseZone] < ZONE_RESTRICTIVENESS[mostRestrictiveZone]) {
      mostRestrictiveZone = parcel.baseZone;
    }
    if (HEIGHT_DISTRICT_RESTRICTIVENESS[parcel.heightDistrict] <
        HEIGHT_DISTRICT_RESTRICTIVENESS[mostRestrictiveHeightDistrict]) {
      mostRestrictiveHeightDistrict = parcel.heightDistrict;
    }
  }

  // Generate warnings and recommendations
  if (!isUniformSite) {
    if (!allSameZone) {
      warnings.push(`Site includes ${uniqueZones.size} different base zones: ${Array.from(uniqueZones).join(', ')}`);

      // Check for incompatible zones
      const hasResidential = parcels.some(p =>
        p.baseZone.startsWith('R') || p.baseZone.startsWith('C'));
      const hasManufacturing = parcels.some(p => p.baseZone.startsWith('M'));

      if (hasResidential && hasManufacturing) {
        warnings.push('⚠️ Site mixes residential/commercial with manufacturing zones - verify allowed uses');
      }

      recommendations.push('Consider UNIFIED analysis using most restrictive zone for conservative estimate');
      recommendations.push('Or use PRO_RATA analysis for area-weighted density calculation');
    }

    if (!allSameHeightDistrict) {
      warnings.push(`Site includes ${uniqueHeightDistricts.size} different height districts: ${Array.from(uniqueHeightDistricts).join(', ')}`);
      recommendations.push('Building design may need to step down at zone boundaries');
    }
  }

  // Check for Q conditions
  const parcelsWithQ = parcels.filter(p => p.hasQCondition);
  if (parcelsWithQ.length > 0 && parcelsWithQ.length < parcels.length) {
    warnings.push(`Q conditions apply to ${parcelsWithQ.length} of ${parcels.length} parcels only`);
    recommendations.push('Q conditions may limit portions of unified development');
  }

  return {
    allSameZone,
    allSameHeightDistrict,
    isUniformSite,
    dominantZone,
    dominantHeightDistrict,
    mostRestrictiveZone,
    mostRestrictiveHeightDistrict,
    zoneBreakdown,
    warnings,
    recommendations,
  };
}

/**
 * Assemble multiple parcels into a combined site
 */
export function assembleParcels(
  parcels: ParcelInput[],
  sharedInputs: {
    // Shared site-wide inputs (same for all parcels)
    address: string;
    distanceToMajorTransitFeet?: number;
    distanceToMetroRailFeet?: number;
    distanceToMetrolinkFeet?: number;
    distanceToBusRouteFeet?: number;
    inVeryLowVehicleTravelArea?: boolean;
    tcacArea: TCACOpportunityArea;
    marketArea: MarketArea;
    inVHFHSZ?: boolean;
    inCoastalZone?: boolean;
    inSeaLevelRiseArea?: boolean;
    adjacentToR1R2?: boolean;
    entitlementStage?: EntitlementStage;
  },
  mode: AssemblyAnalysisMode = AssemblyAnalysisMode.UNIFIED
): AssembledSite {
  if (parcels.length < 2) {
    throw new Error('Assembly requires at least 2 parcels');
  }

  const zoneComparison = compareZones(parcels);
  const totalLotSizeSF = parcels.reduce((sum, p) => sum + p.lotSizeSF, 0);

  // Determine effective zoning based on analysis mode
  let effectiveZone: ZoneType;
  let effectiveHeightDistrict: HeightDistrict;

  switch (mode) {
    case AssemblyAnalysisMode.UNIFIED:
      // Use most restrictive for unified development
      effectiveZone = zoneComparison.mostRestrictiveZone;
      effectiveHeightDistrict = zoneComparison.mostRestrictiveHeightDistrict;
      break;

    case AssemblyAnalysisMode.PRO_RATA:
      // Use dominant zone (largest area) - pro-rata calculations happen elsewhere
      effectiveZone = zoneComparison.dominantZone;
      effectiveHeightDistrict = zoneComparison.dominantHeightDistrict;
      break;

    case AssemblyAnalysisMode.SEPARATE:
      // For separate analysis, use dominant as "primary" but analyze each separately
      effectiveZone = zoneComparison.dominantZone;
      effectiveHeightDistrict = zoneComparison.dominantHeightDistrict;
      break;
  }

  // Collect Q conditions
  const hasAnyQCondition = parcels.some(p => p.hasQCondition);
  const qConditionSummary = parcels
    .filter(p => p.hasQCondition && p.qConditionDescription)
    .map(p => `${p.apn}: ${p.qConditionDescription}`);

  const hasAnyDLimitation = parcels.some(p => p.hasDLimitation);

  // Check for any HPOZ, NSO, etc.
  const hasAnyHPOZ = parcels.some(p => p.inHPOZ);
  const hasAnyNSO = parcels.some(p => p.inNSO);

  // Build combined SiteInput
  const asSiteInput: SiteInput = {
    address: sharedInputs.address,
    apn: parcels.map(p => p.apn).join(', '),
    lotSizeSF: totalLotSizeSF,

    baseZone: effectiveZone,
    heightDistrict: effectiveHeightDistrict,

    hasQCondition: hasAnyQCondition,
    qConditionDescription: qConditionSummary.join('; '),
    hasDLimitation: hasAnyDLimitation,

    // Use first parcel's specific plan if all same, otherwise note mixed
    specificPlan: parcels.every(p => p.specificPlan === parcels[0].specificPlan)
      ? parcels[0].specificPlan
      : undefined,

    inHPOZ: hasAnyHPOZ,
    inNSO: hasAnyNSO,

    // Shared inputs
    distanceToMajorTransitFeet: sharedInputs.distanceToMajorTransitFeet,
    distanceToMetroRailFeet: sharedInputs.distanceToMetroRailFeet,
    distanceToMetrolinkFeet: sharedInputs.distanceToMetrolinkFeet,
    distanceToBusRouteFeet: sharedInputs.distanceToBusRouteFeet,
    inVeryLowVehicleTravelArea: sharedInputs.inVeryLowVehicleTravelArea,
    tcacArea: sharedInputs.tcacArea,
    marketArea: sharedInputs.marketArea,
    inVHFHSZ: sharedInputs.inVHFHSZ,
    inCoastalZone: sharedInputs.inCoastalZone,
    inSeaLevelRiseArea: sharedInputs.inSeaLevelRiseArea,
    adjacentToR1R2: sharedInputs.adjacentToR1R2,
    entitlementStage: sharedInputs.entitlementStage,
  };

  return {
    isMultiParcel: true,
    analysisMode: mode,
    parcels,
    parcelCount: parcels.length,
    totalLotSizeSF,
    combinedAddress: sharedInputs.address,
    zoneComparison,
    effectiveZone,
    effectiveHeightDistrict,
    hasAnyQCondition,
    qConditionSummary,
    hasAnyDLimitation,
    asSiteInput,
  };
}

/**
 * Create a single-parcel site (for API consistency)
 */
export function createSingleSite(
  parcel: ParcelInput,
  sharedInputs: {
    address: string;
    distanceToMajorTransitFeet?: number;
    distanceToMetroRailFeet?: number;
    distanceToMetrolinkFeet?: number;
    distanceToBusRouteFeet?: number;
    inVeryLowVehicleTravelArea?: boolean;
    tcacArea: TCACOpportunityArea;
    marketArea: MarketArea;
    inVHFHSZ?: boolean;
    inCoastalZone?: boolean;
    inSeaLevelRiseArea?: boolean;
    adjacentToR1R2?: boolean;
    entitlementStage?: EntitlementStage;
  }
): SingleSite {
  const asSiteInput: SiteInput = {
    // Shared inputs (site-wide)
    address: sharedInputs.address,
    distanceToMajorTransitFeet: sharedInputs.distanceToMajorTransitFeet,
    distanceToMetroRailFeet: sharedInputs.distanceToMetroRailFeet,
    distanceToMetrolinkFeet: sharedInputs.distanceToMetrolinkFeet,
    distanceToBusRouteFeet: sharedInputs.distanceToBusRouteFeet,
    inVeryLowVehicleTravelArea: sharedInputs.inVeryLowVehicleTravelArea,
    tcacArea: sharedInputs.tcacArea,
    marketArea: sharedInputs.marketArea,
    inVHFHSZ: sharedInputs.inVHFHSZ,
    inCoastalZone: sharedInputs.inCoastalZone,
    inSeaLevelRiseArea: sharedInputs.inSeaLevelRiseArea,
    adjacentToR1R2: sharedInputs.adjacentToR1R2,
    entitlementStage: sharedInputs.entitlementStage,

    // Parcel-specific inputs
    apn: parcel.apn,
    lotSizeSF: parcel.lotSizeSF,
    lotWidthFeet: parcel.lotWidthFeet,
    lotDepthFeet: parcel.lotDepthFeet,
    baseZone: parcel.baseZone,
    heightDistrict: parcel.heightDistrict,
    hasQCondition: parcel.hasQCondition,
    qConditionOrdinance: parcel.qConditionOrdinance,
    qConditionDescription: parcel.qConditionDescription,
    hasDLimitation: parcel.hasDLimitation,
    dLimitationDescription: parcel.dLimitationDescription,
    specificPlan: parcel.specificPlan,
    specificPlanSubarea: parcel.specificPlanSubarea,
    inHPOZ: parcel.inHPOZ,
    inNSO: parcel.inNSO,
    inRFA: parcel.inRFA,
  };

  return {
    isMultiParcel: false,
    parcel,
    asSiteInput,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ParcelValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single parcel input
 */
export function validateParcel(parcel: ParcelInput, index: number): ParcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = parcel.parcelLabel || `Parcel ${index + 1}`;

  if (!parcel.apn || parcel.apn.trim() === '') {
    errors.push(`${label}: APN is required for multi-parcel analysis`);
  }

  if (!parcel.lotSizeSF || parcel.lotSizeSF <= 0) {
    errors.push(`${label}: Lot size must be greater than 0`);
  }

  if (!parcel.baseZone) {
    errors.push(`${label}: Base zone is required`);
  }

  if (!parcel.heightDistrict) {
    errors.push(`${label}: Height district is required`);
  }

  if (parcel.hasQCondition && !parcel.qConditionDescription) {
    warnings.push(`${label}: Q condition flagged but no description provided`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an assemblage of parcels
 */
export function validateAssemblage(parcels: ParcelInput[]): ParcelValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (parcels.length < 2) {
    allErrors.push('Multi-parcel analysis requires at least 2 parcels');
    return { valid: false, errors: allErrors, warnings: allWarnings };
  }

  if (parcels.length > 10) {
    allWarnings.push('Large assemblage (10+ parcels) - verify all parcels are contiguous');
  }

  // Validate each parcel
  for (let i = 0; i < parcels.length; i++) {
    const result = validateParcel(parcels[i], i);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Check for duplicate APNs
  const apns = parcels.map(p => p.apn);
  const duplicates = apns.filter((apn, i) => apns.indexOf(apn) !== i);
  if (duplicates.length > 0) {
    allErrors.push(`Duplicate APNs found: ${duplicates.join(', ')}`);
  }

  // Zone compatibility warnings
  const zoneComparison = compareZones(parcels);
  allWarnings.push(...zoneComparison.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format assemblage summary for display
 */
export function formatAssemblageSummary(site: AssembledSite): string {
  const lines: string[] = [];
  const width = 90;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('MULTI-PARCEL ASSEMBLAGE SUMMARY');
  lines.push('═'.repeat(width));
  lines.push('');

  lines.push(`Address:        ${site.combinedAddress}`);
  lines.push(`Parcel Count:   ${site.parcelCount}`);
  lines.push(`Total Lot Size: ${site.totalLotSizeSF.toLocaleString()} SF (${(site.totalLotSizeSF / 43560).toFixed(2)} acres)`);
  lines.push(`Analysis Mode:  ${site.analysisMode}`);
  lines.push('');

  lines.push('PARCELS:');
  lines.push('─'.repeat(width));
  const header = 'APN'.padEnd(20) +
    'Lot SF'.padStart(12) +
    'Zone'.padStart(10) +
    'Height'.padStart(10) +
    'Q Cond'.padStart(10) +
    '% of Site'.padStart(12);
  lines.push(header);
  lines.push('─'.repeat(width));

  for (const parcel of site.parcels) {
    const pct = ((parcel.lotSizeSF / site.totalLotSizeSF) * 100).toFixed(1);
    const row = parcel.apn.substring(0, 19).padEnd(20) +
      parcel.lotSizeSF.toLocaleString().padStart(12) +
      parcel.baseZone.padStart(10) +
      parcel.heightDistrict.padStart(10) +
      (parcel.hasQCondition ? 'Yes' : 'No').padStart(10) +
      `${pct}%`.padStart(12);
    lines.push(row);
  }
  lines.push('─'.repeat(width));

  lines.push('');
  lines.push('ZONE ANALYSIS:');
  lines.push('─'.repeat(width));

  if (site.zoneComparison.isUniformSite) {
    lines.push('✓ All parcels have identical zoning - simple unified analysis');
  } else {
    lines.push('⚠️ Mixed zoning detected:');
    for (const breakdown of site.zoneComparison.zoneBreakdown) {
      lines.push(`  • ${breakdown.zone}-${breakdown.heightDistrict}: ${breakdown.percentOfSite.toFixed(1)}% of site (${breakdown.totalSF.toLocaleString()} SF)`);
    }
  }

  lines.push('');
  lines.push(`Effective Zone:           ${site.effectiveZone}`);
  lines.push(`Effective Height District: ${site.effectiveHeightDistrict}`);

  if (site.zoneComparison.warnings.length > 0) {
    lines.push('');
    lines.push('WARNINGS:');
    for (const warning of site.zoneComparison.warnings) {
      lines.push(`  ⚠️ ${warning}`);
    }
  }

  if (site.zoneComparison.recommendations.length > 0) {
    lines.push('');
    lines.push('RECOMMENDATIONS:');
    for (const rec of site.zoneComparison.recommendations) {
      lines.push(`  → ${rec}`);
    }
  }

  if (site.hasAnyQCondition) {
    lines.push('');
    lines.push('Q CONDITIONS:');
    for (const qc of site.qConditionSummary) {
      lines.push(`  • ${qc}`);
    }
  }

  lines.push('');
  lines.push('═'.repeat(width));

  return lines.join('\n');
}

/**
 * Format parcel input guide
 */
export function formatParcelInputGuide(): string {
  const lines: string[] = [];
  const width = 90;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('MULTI-PARCEL INPUT GUIDE');
  lines.push('═'.repeat(width));
  lines.push('');

  lines.push('WHEN TO USE MULTI-PARCEL ANALYSIS:');
  lines.push('─'.repeat(width));
  lines.push('• Land deal involves 2+ contiguous parcels');
  lines.push('• Parcels will be merged for a single development');
  lines.push('• Different parcels may have different zonings');
  lines.push('');

  lines.push('REQUIRED INPUTS PER PARCEL:');
  lines.push('─'.repeat(width));
  lines.push('• APN (Assessor Parcel Number) - from ZIMAS or County Assessor');
  lines.push('• Lot Size in SF - from ZIMAS "Property Info" tab');
  lines.push('• Base Zone - from ZIMAS "Zoning" tab (e.g., R3, R4, C2)');
  lines.push('• Height District - from ZIMAS "Zoning" tab (e.g., 1, 1L, 2)');
  lines.push('');

  lines.push('OPTIONAL INPUTS PER PARCEL:');
  lines.push('─'.repeat(width));
  lines.push('• Q Condition - Check ZIMAS for "Q" in zone string');
  lines.push('• D Limitation - Check ZIMAS for "D" in zone string');
  lines.push('• Specific Plan - May vary by parcel in some areas');
  lines.push('• HPOZ/NSO status - Check overlays in ZIMAS');
  lines.push('');

  lines.push('SHARED INPUTS (Same for all parcels):');
  lines.push('─'.repeat(width));
  lines.push('• Primary Address - Use main/corner address');
  lines.push('• Transit Distances - Measure from center of assembled site');
  lines.push('• TCAC Area - Usually same for adjacent parcels');
  lines.push('• Market Area - Usually same for adjacent parcels');
  lines.push('• Fire/Coastal Zone - Usually same for adjacent parcels');
  lines.push('');

  lines.push('ANALYSIS MODES:');
  lines.push('─'.repeat(width));
  lines.push('UNIFIED (Recommended for most cases):');
  lines.push('  • Treats entire site as single development');
  lines.push('  • Uses most restrictive zoning for whole site');
  lines.push('  • Best for typical apartment/condo developments');
  lines.push('');
  lines.push('PRO_RATA:');
  lines.push('  • Weights zoning by lot area');
  lines.push('  • Good when zones are similar but not identical');
  lines.push('  • Calculates effective FAR/density as weighted average');
  lines.push('');
  lines.push('SEPARATE:');
  lines.push('  • Analyzes each parcel independently');
  lines.push('  • Use when zones are incompatible');
  lines.push('  • Results in separate land values summed at end');
  lines.push('');

  lines.push('═'.repeat(width));

  return lines.join('\n');
}
