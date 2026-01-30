/**
 * Eligibility Checker
 * Determines which incentive programs apply to a given site
 */

import {
  SiteInput,
  IncentiveProgram,
  MIIPTransitTier,
  MIIPOpportunityTier,
  MIIPCorridorTier,
  AHIPProjectType,
  ZoneType,
} from '../types';

import {
  getZoneStandards,
  calculateBaseDensity,
  isSingleFamilyZone,
  isCommercialZone,
} from '../data/zoning';

import {
  determineTransitTier,
  determineOpportunityTier,
} from '../data/miip';

import {
  checkAHIPEligibility,
} from '../data/ahip';

import {
  calculateSB79Density,
} from '../data/amiAndFees';

// ============================================================================
// TYPES
// ============================================================================

export interface EligibilityResult {
  program: IncentiveProgram;
  eligible: boolean;
  reason?: string;
  tier?: MIIPTransitTier | MIIPOpportunityTier | MIIPCorridorTier | string;
  notes?: string[];
}

export interface SiteEligibility {
  site: SiteInput;
  baseDensity: number;
  results: EligibilityResult[];
  eligiblePrograms: IncentiveProgram[];
}

// ============================================================================
// MAIN ELIGIBILITY CHECKER
// ============================================================================

/**
 * Check eligibility for all programs for a given site
 */
export function checkAllProgramEligibility(site: SiteInput): SiteEligibility {
  const zoneStandards = getZoneStandards(site.baseZone);
  const baseDensity = calculateBaseDensity(site.lotSizeSF, site.baseZone);

  const results: EligibilityResult[] = [
    checkByRightEligibility(site, zoneStandards),
    checkStateDensityBonusEligibility(site, baseDensity),
    checkMIIPTransitEligibility(site, baseDensity),
    checkMIIPOpportunityEligibility(site),
    checkMIIPCorridorEligibility(site, zoneStandards),
    checkAHIPEligibilityWrapper(site, baseDensity),
    checkSB79Eligibility(site),
  ];

  const eligiblePrograms = results
    .filter(r => r.eligible)
    .map(r => r.program);

  return {
    site,
    baseDensity,
    results,
    eligiblePrograms,
  };
}

// ============================================================================
// INDIVIDUAL PROGRAM CHECKS
// ============================================================================

/**
 * Check By-Right eligibility (always eligible if residential allowed)
 */
function checkByRightEligibility(
  site: SiteInput,
  zoneStandards: ReturnType<typeof getZoneStandards>
): EligibilityResult {
  if (!zoneStandards) {
    return {
      program: IncentiveProgram.BY_RIGHT,
      eligible: false,
      reason: 'Unknown zone type',
    };
  }

  if (!zoneStandards.allowsResidential) {
    return {
      program: IncentiveProgram.BY_RIGHT,
      eligible: false,
      reason: 'Residential use not permitted in this zone',
    };
  }

  return {
    program: IncentiveProgram.BY_RIGHT,
    eligible: true,
    notes: ['Baseline development with no incentives'],
  };
}

/**
 * Check State Density Bonus eligibility
 */
function checkStateDensityBonusEligibility(
  site: SiteInput,
  baseDensity: number
): EligibilityResult {
  // State DB requires 5+ units
  if (baseDensity < 5) {
    return {
      program: IncentiveProgram.STATE_DENSITY_BONUS,
      eligible: false,
      reason: 'Requires 5+ base units for State Density Bonus',
    };
  }

  const zoneStandards = getZoneStandards(site.baseZone);
  if (!zoneStandards?.allowsResidential) {
    return {
      program: IncentiveProgram.STATE_DENSITY_BONUS,
      eligible: false,
      reason: 'Residential use not permitted',
    };
  }

  const notes: string[] = [];

  // Check if near transit for enhanced benefits
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
  if (nearTransit) {
    notes.push('Within 1/2 mile of Major Transit Stop - enhanced FAR and height bonuses');
    notes.push('No parking required');
  }

  return {
    program: IncentiveProgram.STATE_DENSITY_BONUS,
    eligible: true,
    notes,
  };
}

/**
 * Check MIIP Transit Oriented eligibility
 */
function checkMIIPTransitEligibility(
  site: SiteInput,
  baseDensity: number
): EligibilityResult {
  // Check if in excluded areas
  if (site.inVHFHSZ) {
    return {
      program: IncentiveProgram.MIIP_TRANSIT,
      eligible: false,
      reason: 'Not eligible in Very High Fire Hazard Severity Zone',
    };
  }

  if (site.inCoastalZone) {
    return {
      program: IncentiveProgram.MIIP_TRANSIT,
      eligible: false,
      reason: 'Not eligible in Coastal Zone',
    };
  }

  // MIIP requires 5+ units
  if (baseDensity < 5) {
    return {
      program: IncentiveProgram.MIIP_TRANSIT,
      eligible: false,
      reason: 'Requires 5+ base units',
    };
  }

  // Determine transit tier
  const tier = determineTransitTier(
    site.distanceToMetroRailFeet || null,
    site.distanceToMetrolinkFeet || null,
    site.distanceToBusRouteFeet || null,
    false,  // TODO: Need to track multiple bus routes
    site.inVeryLowVehicleTravelArea || false
  );

  if (!tier) {
    return {
      program: IncentiveProgram.MIIP_TRANSIT,
      eligible: false,
      reason: 'Not within Transit Oriented Incentive Area',
    };
  }

  return {
    program: IncentiveProgram.MIIP_TRANSIT,
    eligible: true,
    tier,
    notes: [`Qualifies for ${tier} incentives`],
  };
}

/**
 * Check MIIP Opportunity Corridor eligibility
 */
function checkMIIPOpportunityEligibility(site: SiteInput): EligibilityResult {
  // Check if in excluded areas
  if (site.inVHFHSZ) {
    return {
      program: IncentiveProgram.MIIP_OPPORTUNITY,
      eligible: false,
      reason: 'Not eligible in Very High Fire Hazard Severity Zone',
    };
  }

  if (site.inCoastalZone) {
    return {
      program: IncentiveProgram.MIIP_OPPORTUNITY,
      eligible: false,
      reason: 'Not eligible in Coastal Zone',
    };
  }

  // Determine opportunity tier based on TCAC area
  const tier = determineOpportunityTier(site.tcacArea);

  if (!tier) {
    return {
      program: IncentiveProgram.MIIP_OPPORTUNITY,
      eligible: false,
      reason: 'TCAC Opportunity Area not determined',
    };
  }

  // OC areas are specifically mapped - we'd need GIS data to verify
  // For now, assume eligible if in appropriate TCAC area
  return {
    program: IncentiveProgram.MIIP_OPPORTUNITY,
    eligible: true,
    tier,
    notes: [
      `TCAC ${site.tcacArea} Resource Area maps to ${tier}`,
      'Verify site is within designated Opportunity Corridor on CHIP map',
    ],
  };
}

/**
 * Check MIIP Corridor Transition eligibility
 */
function checkMIIPCorridorEligibility(
  site: SiteInput,
  zoneStandards: ReturnType<typeof getZoneStandards>
): EligibilityResult {
  if (!zoneStandards) {
    return {
      program: IncentiveProgram.MIIP_CORRIDOR,
      eligible: false,
      reason: 'Unknown zone type',
    };
  }

  // Corridor Transition is for sites adjacent to Transit/OC areas
  // Typically single-family, multi-family, or commercial zones

  let tier: MIIPCorridorTier | null = null;
  const notes: string[] = [];

  if (isSingleFamilyZone(site.baseZone)) {
    // CT-1A or CT-1B depending on adjacent tier
    const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
    tier = nearTransit ? MIIPCorridorTier.CT1A : MIIPCorridorTier.CT1B;
    notes.push('Single-family zone in Corridor Transition area');
  } else if (zoneStandards.allowsResidential && !isCommercialZone(site.baseZone)) {
    // Multi-family R zone
    tier = MIIPCorridorTier.CT2;
    notes.push('Multi-family zone in Corridor Transition area');
  } else if (isCommercialZone(site.baseZone)) {
    tier = MIIPCorridorTier.CT3;
    notes.push('Commercial zone in Corridor Transition area');
  }

  if (!tier) {
    return {
      program: IncentiveProgram.MIIP_CORRIDOR,
      eligible: false,
      reason: 'Zone type not eligible for Corridor Transition',
    };
  }

  notes.push('Verify site is within designated Corridor Transition area on CHIP map');

  return {
    program: IncentiveProgram.MIIP_CORRIDOR,
    eligible: true,
    tier,
    notes,
  };
}

/**
 * Check AHIP eligibility (100% affordable projects)
 */
function checkAHIPEligibilityWrapper(
  site: SiteInput,
  baseDensity: number
): EligibilityResult {
  // For eligibility check, assume 100% affordable project type
  const projectType = AHIPProjectType.ONE_HUNDRED_PERCENT;

  const eligibility = checkAHIPEligibility(
    site.inVHFHSZ || false,
    site.inCoastalZone || false,
    site.inSeaLevelRiseArea || false,
    projectType,
    site.baseZone,
    baseDensity,
    false  // hasChurchNearby - would need to check
  );

  if (!eligibility.eligible) {
    return {
      program: IncentiveProgram.AHIP,
      eligible: false,
      reason: eligibility.reason,
    };
  }

  const notes: string[] = [
    'Requires 100% affordable (or 80% for Public Land/Faith-Based/Shared Equity)',
    'All units must be Lower Income or below (up to 20% Moderate allowed)',
  ];

  // Check for enhanced benefits
  const nearTransit = (site.distanceToMajorTransitFeet || Infinity) <= 2640;
  if (nearTransit || site.inVeryLowVehicleTravelArea) {
    notes.push('Enhanced incentives available near transit');
  }

  return {
    program: IncentiveProgram.AHIP,
    eligible: true,
    notes,
  };
}

/**
 * Check SB 79 eligibility (effective July 2026)
 */
function checkSB79Eligibility(site: SiteInput): EligibilityResult {
  const sb79 = calculateSB79Density(
    site.lotSizeSF,
    site.distanceToMajorTransitFeet || Infinity,
    new Date('2026-07-01')  // Use effective date for eligibility check
  );

  if (!sb79.eligible) {
    return {
      program: IncentiveProgram.SB_79,
      eligible: false,
      reason: 'Not within 1/2 mile of major transit (SB 79 requirement)',
    };
  }

  return {
    program: IncentiveProgram.SB_79,
    eligible: true,
    tier: sb79.tier || undefined,
    notes: [
      `Effective July 1, 2026`,
      `${sb79.tier}: Up to ${sb79.maxUnits} units allowed`,
      'By-right approval, no parking minimums',
    ],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the best MIIP tier for a site (Transit > Opportunity > Corridor)
 */
export function getBestMIIPTier(
  eligibility: SiteEligibility
): { program: IncentiveProgram; tier: string } | null {
  // Priority: Transit (highest bonuses) > Opportunity > Corridor
  const transit = eligibility.results.find(
    r => r.program === IncentiveProgram.MIIP_TRANSIT && r.eligible
  );
  if (transit?.tier) {
    return { program: IncentiveProgram.MIIP_TRANSIT, tier: transit.tier };
  }

  const opportunity = eligibility.results.find(
    r => r.program === IncentiveProgram.MIIP_OPPORTUNITY && r.eligible
  );
  if (opportunity?.tier) {
    return { program: IncentiveProgram.MIIP_OPPORTUNITY, tier: opportunity.tier };
  }

  const corridor = eligibility.results.find(
    r => r.program === IncentiveProgram.MIIP_CORRIDOR && r.eligible
  );
  if (corridor?.tier) {
    return { program: IncentiveProgram.MIIP_CORRIDOR, tier: corridor.tier };
  }

  return null;
}

/**
 * Summarize eligibility for display
 */
export function summarizeEligibility(eligibility: SiteEligibility): string {
  const eligible = eligibility.eligiblePrograms;

  if (eligible.length === 0) {
    return 'No incentive programs available for this site.';
  }

  const programNames = eligible.map(p => {
    switch (p) {
      case IncentiveProgram.BY_RIGHT: return 'By-Right';
      case IncentiveProgram.STATE_DENSITY_BONUS: return 'State Density Bonus';
      case IncentiveProgram.MIIP_TRANSIT: return 'MIIP Transit';
      case IncentiveProgram.MIIP_OPPORTUNITY: return 'MIIP Opportunity Corridor';
      case IncentiveProgram.MIIP_CORRIDOR: return 'MIIP Corridor Transition';
      case IncentiveProgram.AHIP: return 'AHIP (100% Affordable)';
      case IncentiveProgram.SB_79: return 'SB 79 (July 2026)';
      default: return p;
    }
  });

  return `Eligible programs: ${programNames.join(', ')}`;
}
