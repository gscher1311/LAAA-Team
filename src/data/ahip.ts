/**
 * AHIP - Affordable Housing Incentive Program Data (Section 12.22 A.39)
 * For 100% affordable and high-affordability projects
 * Part of CHIP (Citywide Housing Incentive Program)
 */

import { AHIPProjectType, AHIPBaseIncentives, AHIPProjectRequirements } from '../types';

// ============================================================================
// PROJECT TYPE REQUIREMENTS (TABLE 12.22 A.39(c)(2)(i))
// ============================================================================

export const AHIP_PROJECT_REQUIREMENTS: AHIPProjectRequirements[] = [
  {
    projectType: AHIPProjectType.ONE_HUNDRED_PERCENT,
    minAffordablePercent: 100,
    // All units Lower Income or below (up to 20% may be Moderate)
  },
  {
    projectType: AHIPProjectType.PUBLIC_LAND,
    minAffordablePercent: 80,
    // On publicly-owned land
  },
  {
    projectType: AHIPProjectType.FAITH_BASED,
    minAffordablePercent: 80,
    // On religious institution land
  },
  {
    projectType: AHIPProjectType.SHARED_EQUITY,
    minAffordablePercent: 80,
    // Community Land Trust, Housing Coop, etc.
  },
];

// ============================================================================
// BASE INCENTIVES (TABLE 12.22 A.39(e)(1))
// ============================================================================

export const AHIP_BASE_INCENTIVES: AHIPBaseIncentives[] = [
  // Citywide - Sites with less than 5 units max density
  {
    subarea: 'CITYWIDE_LOW',
    siteHasLessThan5Units: true,
    densityBonus: 'Per State Gov Code 65915',
    maxFAR: 1.5,
    additionalHeightFeet: 11,
    additionalStories: 1,
    parkingPerUnit: 0.5,
  },
  // Higher/Moderate Opportunity Areas - Sites with 5+ units
  {
    subarea: 'HIGHER_MODERATE',
    siteHasLessThan5Units: false,
    densityBonus: 'Per State Gov Code 65915',
    maxFAR: 3.0,  // or 35% increase, whichever greater
    additionalHeightFeet: 33,
    additionalStories: 3,
    parkingPerUnit: null,  // No minimum required
  },
  // Within 1/2 mile Major Transit Stop or VLVTA - Sites with less than 5 units
  {
    subarea: 'TRANSIT_HALF_MILE',
    siteHasLessThan5Units: true,
    densityBonus: 'Per State Gov Code 65915',
    maxFAR: 2.0,
    additionalHeightFeet: 11,
    additionalStories: 1,
    parkingPerUnit: null,  // No minimum required
  },
  // Within 1/2 mile Major Transit Stop or VLVTA - Sites with 5+ units
  {
    subarea: 'TRANSIT_HALF_MILE',
    siteHasLessThan5Units: false,
    densityBonus: 'Per State Gov Code 65915',
    maxFAR: 4.5,  // or 50% increase, whichever greater
    additionalHeightFeet: 33,
    additionalStories: 3,
    parkingPerUnit: null,  // No minimum required
  },
];

// Higher Opportunity or Moderate Opportunity near Major Transit - even better incentives
export const AHIP_HIGHER_OPP_TRANSIT_INCENTIVES = {
  siteHasLessThan5Units: {
    maxFAR: 2.5,
    additionalHeightFeet: 11,
    additionalStories: 1,
    parkingPerUnit: null,
  },
  siteHas5PlusUnits: {
    maxFAR: 4.65,  // or 55% increase, whichever greater
    additionalHeightFeet: 33,
    additionalStories: 3,
    parkingPerUnit: null,
  },
};

// ============================================================================
// ADDITIONAL INCENTIVES (Section 12.22 A.39(f))
// ============================================================================

export const AHIP_MAX_ADDITIONAL_INCENTIVES = 5;

export const AHIP_ADDITIONAL_INCENTIVES_MENU = [
  {
    id: 'YARDS_C',
    description: 'Yard reduction (C-zones): Use RAS3 setbacks (5ft front, 5ft rear abutting R, 0ft other)',
  },
  {
    id: 'YARDS_R',
    description: 'Yard reduction (R-zones): Up to 30% decrease in yard depths',
  },
  {
    id: 'TRANSITIONAL_HEIGHT',
    description: 'Exempt from transitional height requirements',
  },
  {
    id: 'GROUND_FLOOR_ACTIVATION',
    description: '50% reduction in required commercial floor area',
  },
  {
    id: 'GROUND_FLOOR_HEIGHT',
    description: '30% reduction in ground floor height requirements',
  },
  {
    id: 'COMMERCIAL_PARKING',
    description: 'Eliminate commercial parking requirements',
  },
  {
    id: 'BUILDING_SPACING',
    description: '30% reduction in building separation',
  },
  {
    id: 'PASSAGEWAYS',
    description: '50% reduction in passageway width',
  },
  {
    id: 'LOT_COVERAGE',
    description: '20% increase in lot coverage limits',
  },
  {
    id: 'LOT_WIDTH',
    description: '25% decrease from lot width requirements',
  },
  {
    id: 'OPEN_SPACE',
    description: '15% of lot area OR 10% of unit floor area (whichever greater)',
  },
  {
    id: 'DENSITY_CALC',
    description: 'Include dedication area in lot area for density calculation',
  },
  {
    id: 'AVERAGING',
    description: 'Average FAR, density, parking, open space across contiguous lots',
  },
  {
    id: 'DEV_STANDARD_RELIEF',
    description: 'Up to 20% relief from any development standard (can use multiple times)',
  },
];

// Faith-Based and Shared Equity specific incentives
export const FAITH_SHARED_EQUITY_INCENTIVES = {
  lotRequirements: {
    minLotAreaSF: 600,
    minLotWidthFeet: 15,
    minPedestrianAccessFeet: 3,
  },
  yards: {
    frontYard: 'Average of adjacent buildings',
    sideYard3Story: 4,
    sideYard2Story: 3,
    interiorSideYard: 0,  // No setback between buildings in same development
    rearYard: 4,  // Must maintain height < 26ft within 15ft of rear
    alleySetback: 0,  // For structures < 26ft for first 15ft from alley
  },
  buildingSpacing: 'Exempt from zoning requirements',
};

// ============================================================================
// PUBLIC BENEFIT OPTIONS (TABLE 12.22 A.39(g))
// ============================================================================

export const AHIP_PUBLIC_BENEFITS = [
  {
    id: 'CHILD_CARE',
    description: 'Child Care Facility on premises (55-year covenant)',
    benefit: '+FAR equal to childcare SF OR +11 ft height + additional incentive',
  },
  {
    id: 'MULTI_BEDROOM_FAR',
    description: '10%+ units with 3+ bedrooms (covenant required)',
    benefitByUnits: [
      { minUnits: 0, maxUnits: 30, additionalFAR: 0.5, additionalStories: 1 },
      { minUnits: 31, maxUnits: 50, additionalFAR: 1.0, additionalStories: 1 },
      { minUnits: 51, maxUnits: 75, additionalFAR: 1.5, additionalStories: 2 },
      { minUnits: 76, maxUnits: 9999, additionalFAR: 2.0, additionalStories: 2 },
    ],
  },
  {
    id: 'MULTI_BEDROOM_EXEMPTION',
    description: '3BR+ unit square footage exempt from FAR + 1 bonus story',
    benefit: '3BR+ SF exempt from FAR calculation + 1 additional story',
  },
  {
    id: 'TREE_PRESERVATION',
    description: 'Maintain significant trees (12"+ diameter, 35ft+ height)',
    benefit: '+11 ft height',
    covenantYears: 15,
  },
  {
    id: 'LAND_DONATION',
    description: 'Donate land for affordable housing per Gov Code 65915(g)',
    benefit: '+15% density bonus',
  },
  {
    id: 'ACTIVE_GROUND_FLOOR',
    description: 'Neighborhood retail/service on ground floor',
    benefit: 'Exempt up to 1,500 SF from FAR calculation',
    requirements: [
      '60% transparency along building frontage',
      'Entrance every 50 ft along front property line',
    ],
  },
  {
    id: 'POPS',
    description: 'Privately Owned Public Space (4% of buildable lot area)',
    benefit: 'Zero rear yard setback + Relief from Development Standard incentive',
  },
  {
    id: 'HISTORIC_FACADE',
    description: 'Rehabilitate Surveyed Historic Resource facade',
    benefit: '+1.0 FAR and +22 ft height',
    requirements: [
      'Retain all street frontage facades to 10ft depth',
      'New construction setback behind 10ft retention area',
      'Comply with Secretary of Interior Standards',
    ],
  },
  {
    id: 'FIVE_BENEFITS_BONUS',
    description: 'Include 5+ Public Benefit Options',
    benefit: '+11 ft additional height',
  },
];

// ============================================================================
// ELIGIBILITY EXCLUSIONS
// ============================================================================

export const AHIP_EXCLUSIONS = {
  // Areas where AHIP projects cannot locate
  excludedAreas: [
    'Very High Fire Hazard Severity Zone (VHFHSZ)',
    'Coastal Zone',
    'Sea Level Rise Area',
  ],
  // Additional exclusions for certain project types
  faithBasedSharedEquityExclusions: [
    'Manufacturing zones (M1, M2, M3) without residential',
    'Hybrid industrial zones (CM, MR1, MR2) with residential restrictions',
  ],
  // Single-family zone restrictions
  singleFamilyRestrictions: {
    oneHundredPercent: 'Cannot locate if max density < 5 units',
    faithBased: 'Cannot locate unless religious institution owns church/worship within 528ft',
    sharedEquity: 'Cannot locate in single-family zones (RW or more restrictive)',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get base incentives based on site characteristics
 */
export function getAHIPBaseIncentives(
  maxDensityUnits: number,
  isNearMajorTransit: boolean,  // within 1/2 mile
  isInHigherOpportunityArea: boolean,
  isInVeryLowVehicleTravelArea: boolean
): AHIPBaseIncentives {
  const hasLessThan5Units = maxDensityUnits < 5;

  // Priority: Transit/VLVTA > Higher Opportunity > Citywide
  if (isNearMajorTransit || isInVeryLowVehicleTravelArea) {
    return AHIP_BASE_INCENTIVES.find(
      i => i.subarea === 'TRANSIT_HALF_MILE' && i.siteHasLessThan5Units === hasLessThan5Units
    )!;
  }

  if (isInHigherOpportunityArea) {
    return AHIP_BASE_INCENTIVES.find(
      i => i.subarea === 'HIGHER_MODERATE' && i.siteHasLessThan5Units === hasLessThan5Units
    )!;
  }

  // Default citywide
  return AHIP_BASE_INCENTIVES.find(
    i => i.subarea === 'CITYWIDE_LOW' && i.siteHasLessThan5Units === hasLessThan5Units
  )!;
}

/**
 * Check if site is eligible for AHIP
 */
export function checkAHIPEligibility(
  inVHFHSZ: boolean,
  inCoastalZone: boolean,
  inSeaLevelRiseArea: boolean,
  projectType: AHIPProjectType,
  zoneType: string,
  maxDensityUnits: number,
  hasChurchNearby?: boolean
): { eligible: boolean; reason?: string } {
  // Check general exclusions
  if (inVHFHSZ) {
    return { eligible: false, reason: 'Site is in Very High Fire Hazard Severity Zone' };
  }
  if (inCoastalZone) {
    return { eligible: false, reason: 'Site is in Coastal Zone' };
  }
  if (inSeaLevelRiseArea) {
    return { eligible: false, reason: 'Site is in Sea Level Rise Area' };
  }

  // Check single-family zone restrictions
  const isSingleFamily = zoneType.startsWith('R1') || zoneType.startsWith('RW');

  if (isSingleFamily) {
    if (projectType === AHIPProjectType.ONE_HUNDRED_PERCENT && maxDensityUnits < 5) {
      return { eligible: false, reason: '100% Affordable cannot locate in single-family zone with max density < 5 units' };
    }
    if (projectType === AHIPProjectType.FAITH_BASED && !hasChurchNearby) {
      return { eligible: false, reason: 'Faith-Based project requires church/worship within 528ft' };
    }
    if (projectType === AHIPProjectType.SHARED_EQUITY) {
      return { eligible: false, reason: 'Shared Equity projects cannot locate in single-family zones' };
    }
  }

  // Check manufacturing zone restrictions
  const isManufacturing = ['M1', 'M2', 'M3', 'CM', 'MR1', 'MR2'].includes(zoneType);
  if (isManufacturing && projectType !== AHIPProjectType.ONE_HUNDRED_PERCENT) {
    // Only 100% affordable with 5+ base units can go in manufacturing
    if (maxDensityUnits < 5) {
      return { eligible: false, reason: 'Cannot locate in manufacturing zone with max density < 5 units' };
    }
  }

  return { eligible: true };
}

/**
 * Calculate multi-bedroom FAR bonus
 */
export function getMultiBedroomBonus(totalUnits: number): { additionalFAR: number; additionalStories: number } {
  const benefit = AHIP_PUBLIC_BENEFITS.find(b => b.id === 'MULTI_BEDROOM_FAR');
  if (!benefit || !benefit.benefitByUnits) {
    return { additionalFAR: 0, additionalStories: 0 };
  }

  const tier = benefit.benefitByUnits.find(
    t => totalUnits >= t.minUnits && totalUnits <= t.maxUnits
  );

  return tier
    ? { additionalFAR: tier.additionalFAR, additionalStories: tier.additionalStories }
    : { additionalFAR: 0, additionalStories: 0 };
}

/**
 * Get minimum affordable percentage for project type
 */
export function getMinAffordablePercent(projectType: AHIPProjectType): number {
  const req = AHIP_PROJECT_REQUIREMENTS.find(r => r.projectType === projectType);
  return req?.minAffordablePercent || 100;
}
