/**
 * Site Input Validation
 *
 * Validates SiteInput data before analysis to prevent errors and ensure
 * accurate calculations. Returns structured errors and warnings.
 *
 * Categories:
 * - Errors: Analysis will fail or produce meaningless results
 * - Warnings: Analysis will run but results may be inaccurate
 * - Info: Suggestions for better data quality
 */

import { SiteInput, ZoneType, HeightDistrict, MarketArea, TCACOpportunityArea } from '../types';
import { getZoneStandards } from '../data/zoning';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  field: keyof SiteInput | 'general';
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;           // True if no errors (warnings OK)
  canProceed: boolean;        // True if analysis can run (even with warnings)
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  summary: string;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

// Reasonable lot size bounds for LA multifamily
const MIN_LOT_SIZE_SF = 2500;       // Minimum for multifamily (typical R3)
const MAX_LOT_SIZE_SF = 500000;     // ~11 acres, very large site
const TYPICAL_MIN_LOT_SF = 5000;    // Common minimum for feasible development
const TYPICAL_MAX_LOT_SF = 100000;  // ~2.3 acres, typical max without special handling

// Distance bounds (in feet)
const MAX_TRANSIT_DISTANCE = 15840;  // 3 miles - beyond this, transit irrelevant
const TRANSIT_BENEFIT_DISTANCE = 2640;  // 1/2 mile - typical transit benefit zone

// Valid enum values
const VALID_ZONES = Object.values(ZoneType);
const VALID_HEIGHT_DISTRICTS = Object.values(HeightDistrict);
const VALID_MARKET_AREAS = Object.values(MarketArea);
const VALID_TCAC_AREAS = Object.values(TCACOpportunityArea);

// Zones that don't allow multifamily
const NON_RESIDENTIAL_ZONES: ZoneType[] = [
  ZoneType.M1, ZoneType.M2, ZoneType.M3,
  ZoneType.A1, ZoneType.A2,
  ZoneType.OS, ZoneType.PF, ZoneType.SL,
  ZoneType.P, ZoneType.PB,
];

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate site input data
 *
 * @param site - The site input to validate
 * @returns Validation result with errors, warnings, and info
 */
export function validateSiteInput(site: SiteInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // ============================================
  // CRITICAL VALIDATIONS (Errors)
  // ============================================

  // Address validation
  if (!site.address || site.address.trim().length === 0) {
    errors.push({
      field: 'address',
      severity: 'error',
      message: 'Address is required',
      suggestion: 'Provide a valid street address',
    });
  }

  // Lot size validation
  if (site.lotSizeSF === undefined || site.lotSizeSF === null) {
    errors.push({
      field: 'lotSizeSF',
      severity: 'error',
      message: 'Lot size is required',
      suggestion: 'Enter lot size in square feet',
    });
  } else if (site.lotSizeSF <= 0) {
    errors.push({
      field: 'lotSizeSF',
      severity: 'error',
      message: 'Lot size must be positive',
      suggestion: `Enter a valid lot size (minimum ${MIN_LOT_SIZE_SF.toLocaleString()} SF for multifamily)`,
    });
  } else if (site.lotSizeSF < MIN_LOT_SIZE_SF) {
    errors.push({
      field: 'lotSizeSF',
      severity: 'error',
      message: `Lot size ${site.lotSizeSF.toLocaleString()} SF is below minimum for multifamily (${MIN_LOT_SIZE_SF.toLocaleString()} SF)`,
      suggestion: 'This lot may be too small for multifamily development',
    });
  }

  // Zone validation
  if (!site.baseZone) {
    errors.push({
      field: 'baseZone',
      severity: 'error',
      message: 'Base zone is required',
      suggestion: 'Enter the zoning designation (e.g., R3, C2)',
    });
  } else if (!VALID_ZONES.includes(site.baseZone)) {
    errors.push({
      field: 'baseZone',
      severity: 'error',
      message: `Invalid zone type: ${site.baseZone}`,
      suggestion: `Valid zones include: ${VALID_ZONES.slice(0, 10).join(', ')}...`,
    });
  } else if (NON_RESIDENTIAL_ZONES.includes(site.baseZone)) {
    errors.push({
      field: 'baseZone',
      severity: 'error',
      message: `Zone ${site.baseZone} does not allow residential development`,
      suggestion: 'This analysis is for multifamily residential. Check if zone allows housing.',
    });
  }

  // Height district validation
  if (!site.heightDistrict) {
    errors.push({
      field: 'heightDistrict',
      severity: 'error',
      message: 'Height district is required',
      suggestion: 'Enter the height district (e.g., 1, 1L, 2)',
    });
  } else if (!VALID_HEIGHT_DISTRICTS.includes(site.heightDistrict)) {
    errors.push({
      field: 'heightDistrict',
      severity: 'error',
      message: `Invalid height district: ${site.heightDistrict}`,
      suggestion: `Valid height districts: ${VALID_HEIGHT_DISTRICTS.join(', ')}`,
    });
  }

  // Market area validation
  if (!site.marketArea) {
    errors.push({
      field: 'marketArea',
      severity: 'error',
      message: 'Market area is required for financial analysis',
      suggestion: 'Select a market area (HIGH, MEDIUM_HIGH, MEDIUM, MEDIUM_LOW, LOW)',
    });
  } else if (!VALID_MARKET_AREAS.includes(site.marketArea)) {
    errors.push({
      field: 'marketArea',
      severity: 'error',
      message: `Invalid market area: ${site.marketArea}`,
      suggestion: `Valid market areas: ${VALID_MARKET_AREAS.join(', ')}`,
    });
  }

  // TCAC area validation
  if (!site.tcacArea) {
    errors.push({
      field: 'tcacArea',
      severity: 'error',
      message: 'TCAC opportunity area is required',
      suggestion: 'Select TCAC area (HIGHEST, HIGH, MODERATE, LOW)',
    });
  } else if (!VALID_TCAC_AREAS.includes(site.tcacArea)) {
    errors.push({
      field: 'tcacArea',
      severity: 'error',
      message: `Invalid TCAC area: ${site.tcacArea}`,
      suggestion: `Valid TCAC areas: ${VALID_TCAC_AREAS.join(', ')}`,
    });
  }

  // ============================================
  // WARNINGS (Analysis will run but may be inaccurate)
  // ============================================

  // Large lot size warning
  if (site.lotSizeSF > TYPICAL_MAX_LOT_SF) {
    warnings.push({
      field: 'lotSizeSF',
      severity: 'warning',
      message: `Large lot (${site.lotSizeSF.toLocaleString()} SF / ${(site.lotSizeSF / 43560).toFixed(2)} acres)`,
      suggestion: 'Consider phased development or multiple buildings. Single-building assumptions may not apply.',
    });
  }

  // Small lot warning
  if (site.lotSizeSF > 0 && site.lotSizeSF < TYPICAL_MIN_LOT_SF) {
    warnings.push({
      field: 'lotSizeSF',
      severity: 'warning',
      message: `Small lot (${site.lotSizeSF.toLocaleString()} SF) may have limited feasibility`,
      suggestion: 'Development costs may be disproportionately high for small lots.',
    });
  }

  // Transit distance validation
  if (site.distanceToMajorTransitFeet !== undefined) {
    if (site.distanceToMajorTransitFeet < 0) {
      warnings.push({
        field: 'distanceToMajorTransitFeet',
        severity: 'warning',
        message: 'Transit distance cannot be negative',
        suggestion: 'Enter distance in feet (0 or positive)',
      });
    } else if (site.distanceToMajorTransitFeet > MAX_TRANSIT_DISTANCE) {
      warnings.push({
        field: 'distanceToMajorTransitFeet',
        severity: 'warning',
        message: `Transit distance ${site.distanceToMajorTransitFeet.toLocaleString()} ft is very far from transit`,
        suggestion: 'Transit-oriented incentives will not apply at this distance.',
      });
    }
  }

  // Metro Rail distance validation
  if (site.distanceToMetroRailFeet !== undefined && site.distanceToMetroRailFeet < 0) {
    warnings.push({
      field: 'distanceToMetroRailFeet',
      severity: 'warning',
      message: 'Metro Rail distance cannot be negative',
    });
  }

  // Q/D/T condition warnings
  if (site.hasQCondition && !site.qConditionDescription) {
    warnings.push({
      field: 'qConditionDescription',
      severity: 'warning',
      message: 'Q condition indicated but no description provided',
      suggestion: 'Add Q condition details for accurate analysis. Check ZIMAS for ordinance text.',
    });
  }

  if (site.hasDLimitation && !site.dLimitationDescription) {
    warnings.push({
      field: 'dLimitationDescription',
      severity: 'warning',
      message: 'D limitation indicated but no description provided',
      suggestion: 'Add D limitation details. This may significantly affect development potential.',
    });
  }

  // Specific Plan warning
  if (site.specificPlan) {
    warnings.push({
      field: 'specificPlan',
      severity: 'warning',
      message: `Site is in "${site.specificPlan}" Specific Plan`,
      suggestion: 'Specific Plan rules may override base zoning. Analysis uses base zoning only.',
    });
  }

  // HPOZ warning
  if (site.inHPOZ) {
    warnings.push({
      field: 'inHPOZ',
      severity: 'warning',
      message: 'Site is in Historic Preservation Overlay Zone',
      suggestion: 'New construction requires HPOZ Board approval. May add time and cost.',
    });
  }

  // Fire hazard zone warning
  if (site.inVHFHSZ) {
    warnings.push({
      field: 'inVHFHSZ',
      severity: 'warning',
      message: 'Site is in Very High Fire Hazard Severity Zone',
      suggestion: 'Fire-resistant construction required. May affect costs and insurance.',
    });
  }

  // Coastal zone warning
  if (site.inCoastalZone) {
    warnings.push({
      field: 'inCoastalZone',
      severity: 'warning',
      message: 'Site is in Coastal Zone',
      suggestion: 'Coastal Development Permit may be required. Additional review possible.',
    });
  }

  // Hillside warning
  if (site.inHillsideArea) {
    warnings.push({
      field: 'inHillsideArea',
      severity: 'warning',
      message: 'Site is in Hillside Area',
      suggestion: 'Hillside ordinance may further restrict development beyond base zoning.',
    });
  }

  // ============================================
  // INFO (Suggestions for better data)
  // ============================================

  // ZIMAS verification
  if (!site.zimasVerified) {
    info.push({
      field: 'zimasVerified',
      severity: 'info',
      message: 'Zoning data has not been verified against ZIMAS',
      suggestion: 'Verify all zoning data at planning.lacity.gov/zimas before making decisions.',
    });
  }

  // Missing transit distance
  if (site.distanceToMajorTransitFeet === undefined) {
    info.push({
      field: 'distanceToMajorTransitFeet',
      severity: 'info',
      message: 'Transit distance not provided',
      suggestion: 'Add transit distance to evaluate transit-oriented incentive programs.',
    });
  }

  // Missing Metro Rail distance
  if (site.distanceToMetroRailFeet === undefined && site.distanceToMajorTransitFeet !== undefined) {
    info.push({
      field: 'distanceToMetroRailFeet',
      severity: 'info',
      message: 'Metro Rail distance not specified separately',
      suggestion: 'Metro Rail distance affects MIIP tier eligibility.',
    });
  }

  // Check if zone allows residential
  if (site.baseZone) {
    const zoneStandards = getZoneStandards(site.baseZone);
    if (zoneStandards && !zoneStandards.allowsResidential) {
      // Already caught as error above, but add detail
    } else if (zoneStandards && zoneStandards.densitySFperDU === null) {
      info.push({
        field: 'baseZone',
        severity: 'info',
        message: `Zone ${site.baseZone} has no density limit`,
        suggestion: 'Development is FAR-limited, not density-limited. Unit count based on buildable envelope.',
      });
    }
  }

  // ============================================
  // COMPILE RESULT
  // ============================================

  const isValid = errors.length === 0;
  const canProceed = isValid; // Could be more lenient in future

  let summary: string;
  if (errors.length === 0 && warnings.length === 0) {
    summary = 'Site data is valid. Ready for analysis.';
  } else if (errors.length === 0) {
    summary = `Site data is valid with ${warnings.length} warning(s). Analysis can proceed.`;
  } else {
    summary = `${errors.length} error(s) found. Please fix errors before analysis.`;
  }

  return {
    isValid,
    canProceed,
    errors,
    warnings,
    info,
    summary,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick validation check - returns true if site can be analyzed
 */
export function isValidSite(site: SiteInput): boolean {
  const result = validateSiteInput(site);
  return result.canProceed;
}

/**
 * Get validation errors only (for quick error checking)
 */
export function getValidationErrors(site: SiteInput): ValidationIssue[] {
  const result = validateSiteInput(site);
  return result.errors;
}

/**
 * Format validation result for console output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('SITE DATA VALIDATION');
  lines.push('═'.repeat(60));
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('ERRORS (must fix):');
    lines.push('─'.repeat(60));
    for (const err of result.errors) {
      lines.push(`  ✗ [${err.field}] ${err.message}`);
      if (err.suggestion) {
        lines.push(`    → ${err.suggestion}`);
      }
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS (review recommended):');
    lines.push('─'.repeat(60));
    for (const warn of result.warnings) {
      lines.push(`  ⚠ [${warn.field}] ${warn.message}`);
      if (warn.suggestion) {
        lines.push(`    → ${warn.suggestion}`);
      }
    }
    lines.push('');
  }

  if (result.info.length > 0) {
    lines.push('INFO (suggestions):');
    lines.push('─'.repeat(60));
    for (const inf of result.info) {
      lines.push(`  ℹ [${inf.field}] ${inf.message}`);
      if (inf.suggestion) {
        lines.push(`    → ${inf.suggestion}`);
      }
    }
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push(`STATUS: ${result.summary}`);
  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Sanitize and normalize site input
 * Fixes common issues without changing meaning
 */
export function sanitizeSiteInput(site: SiteInput): SiteInput {
  return {
    ...site,
    // Trim strings
    address: site.address?.trim() || '',
    qConditionDescription: site.qConditionDescription?.trim(),
    qConditionOrdinance: site.qConditionOrdinance?.trim(),
    dLimitationDescription: site.dLimitationDescription?.trim(),
    specificPlan: site.specificPlan?.trim(),
    specificPlanSubarea: site.specificPlanSubarea?.trim(),

    // Ensure positive numbers
    lotSizeSF: Math.max(0, site.lotSizeSF || 0),
    distanceToMajorTransitFeet: site.distanceToMajorTransitFeet !== undefined
      ? Math.max(0, site.distanceToMajorTransitFeet)
      : undefined,
    distanceToMetroRailFeet: site.distanceToMetroRailFeet !== undefined
      ? Math.max(0, site.distanceToMetroRailFeet)
      : undefined,
    distanceToMetrolinkFeet: site.distanceToMetrolinkFeet !== undefined
      ? Math.max(0, site.distanceToMetrolinkFeet)
      : undefined,
    distanceToBusRouteFeet: site.distanceToBusRouteFeet !== undefined
      ? Math.max(0, site.distanceToBusRouteFeet)
      : undefined,

    // Ensure booleans
    hasQCondition: !!site.hasQCondition,
    hasDLimitation: !!site.hasDLimitation,
    hasTClassification: !!site.hasTClassification,
    inVHFHSZ: !!site.inVHFHSZ,
    inCoastalZone: !!site.inCoastalZone,
    inHillsideArea: !!site.inHillsideArea,
    inHPOZ: !!site.inHPOZ,
    adjacentToR1R2: !!site.adjacentToR1R2,
    zimasVerified: !!site.zimasVerified,
  };
}
