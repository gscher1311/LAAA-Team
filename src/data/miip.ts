/**
 * MIIP - Mixed Income Incentive Program Data (Section 12.22 A.38)
 * Part of CHIP (Citywide Housing Incentive Program)
 */

import {
  MIIPTransitTier,
  MIIPOpportunityTier,
  MIIPCorridorTier,
  MIIPTransitIncentives,
  MIIPOpportunityIncentives,
  MIIPCorridorIncentives,
  MIIPAffordabilityRequirement,
} from '../types';

// ============================================================================
// TRANSIT ORIENTED INCENTIVE AREA (TABLE 12.22 A.38(e)(2)(i))
// ============================================================================

export const TRANSIT_INCENTIVES: MIIPTransitIncentives[] = [
  {
    tier: MIIPTransitTier.T1,
    densityBonusMin: 100,
    densityBonusMax: 120,
    farIncreaseRZone: 40,
    farCZone: 3.25,
    farIncreaseCZone: 40,
    additionalStories: 1,
    additionalHeightFeet: 11,
    parkingRequired: false,
  },
  {
    tier: MIIPTransitTier.T2,
    densityBonusMin: 110,
    densityBonusMax: 120,
    farIncreaseRZone: 45,  // 40-45%
    farCZone: 4.2,
    farIncreaseCZone: 45,
    additionalStories: 2,
    additionalHeightFeet: 22,
    parkingRequired: false,
  },
  {
    tier: MIIPTransitTier.T3,
    densityBonusMin: 120,
    densityBonusMax: 120,
    farIncreaseRZone: 50,  // 45-50%
    farCZone: 4.5,
    farIncreaseCZone: 50,
    additionalStories: 3,
    additionalHeightFeet: 33,
    parkingRequired: false,
  },
];

// TABLE 12.22 A.38(e)(1)(iv) - Transit Tier Subarea Definitions
export const TRANSIT_TIER_DEFINITIONS = {
  [MIIPTransitTier.T1]: {
    description: 'Highest transit accessibility',
    criteria: [
      'Within 1/4 mile (1,320 ft) of Metro Rail or BRT station',
      'Within 750 ft of Metrolink or Amtrak station',
      'Within 750 ft of 2+ intersecting high frequency bus routes',
    ],
    metroRailDistanceFeet: 1320,
    metrolinkDistanceFeet: 750,
    busRouteDistanceFeet: 750,
    requiresMultipleBusRoutes: true,
  },
  [MIIPTransitTier.T2]: {
    description: 'High transit accessibility',
    criteria: [
      'Within 1/2 mile (2,640 ft) of Metro Rail or BRT station',
      'Within 1,500 ft of Metrolink or Amtrak station',
      'Within 1/4 mile (1,320 ft) of high frequency bus route',
    ],
    metroRailDistanceFeet: 2640,
    metrolinkDistanceFeet: 1500,
    busRouteDistanceFeet: 1320,
    requiresMultipleBusRoutes: false,
  },
  [MIIPTransitTier.T3]: {
    description: 'Moderate transit accessibility or VLVTA',
    criteria: [
      'Very Low Vehicle Travel Area',
      'Within 3/4 mile (3,960 ft) of Metro Rail or BRT station',
      'Within 1/2 mile (2,640 ft) of high frequency bus route',
    ],
    metroRailDistanceFeet: 3960,
    metrolinkDistanceFeet: null,
    busRouteDistanceFeet: 2640,
    requiresMultipleBusRoutes: false,
    orVeryLowVehicleTravelArea: true,
  },
};

// ============================================================================
// OPPORTUNITY CORRIDOR INCENTIVE AREA (TABLE 12.22 A.38(f)(2)(i))
// ============================================================================

export const OPPORTUNITY_INCENTIVES: MIIPOpportunityIncentives[] = [
  {
    tier: MIIPOpportunityTier.OC1,
    farIncreaseRZone: 45,
    farCZone: 4.5,
    farIncreaseCZone: 50,
    maxStories: 5,
    additionalStories: 1,
    additionalHeightFeet: 11,
    parkingRequired: false,
  },
  {
    tier: MIIPOpportunityTier.OC2,
    farIncreaseRZone: 50,
    farCZone: 4.65,
    farIncreaseCZone: 55,
    maxStories: 6,
    additionalStories: 2,
    additionalHeightFeet: 22,
    parkingRequired: false,
  },
  {
    tier: MIIPOpportunityTier.OC3,
    farIncreaseRZone: 60,
    farCZone: 4.8,
    farIncreaseCZone: 60,
    maxStories: 7,
    additionalStories: 3,
    additionalHeightFeet: 33,
    parkingRequired: false,
  },
];

// TABLE 12.22 A.38(f)(1)(i) - Opportunity Corridor Subarea Definitions
export const OPPORTUNITY_TIER_DEFINITIONS = {
  [MIIPOpportunityTier.OC1]: {
    description: 'Lower Resource Area',
    tcacResourceArea: 'LOW',
  },
  [MIIPOpportunityTier.OC2]: {
    description: 'Moderate Resource Area',
    tcacResourceArea: 'MODERATE',
  },
  [MIIPOpportunityTier.OC3]: {
    description: 'High or Highest Resource Area',
    tcacResourceArea: ['HIGH', 'HIGHEST'],
  },
};

// ============================================================================
// CORRIDOR TRANSITION INCENTIVE AREA (TABLE 12.22 A.38(g)(3)(i))
// ============================================================================

export const CORRIDOR_INCENTIVES: MIIPCorridorIncentives[] = [
  {
    tier: MIIPCorridorTier.CT1A,
    maxUnitsMin: 4,
    maxUnitsMax: 6,
    farMin: 1.15,
    farMax: 1.45,
    maxStories: 2,
    parkingRequired: true,  // Per underlying zone
  },
  {
    tier: MIIPCorridorTier.CT1B,
    maxUnitsMin: 4,
    maxUnitsMax: 6,
    farMin: 1.15,
    farMax: 1.45,
    maxStories: 2,
    parkingRequired: true,  // Per underlying zone
  },
  {
    tier: MIIPCorridorTier.CT2,
    maxUnitsMin: 7,
    maxUnitsMax: 10,
    farMin: 1.6,
    farMax: 2.0,
    maxStories: 3,  // 2-3 stories
    parkingRequired: false,
  },
  {
    tier: MIIPCorridorTier.CT3,
    maxUnitsMin: 11,
    maxUnitsMax: 16,
    farMin: 2.15,
    farMax: 2.9,
    maxStories: 3,
    parkingRequired: false,
  },
];

// TABLE 12.22 A.38(g)(1)(i) - Corridor Transition Subarea Definitions
export const CORRIDOR_TIER_DEFINITIONS = {
  [MIIPCorridorTier.CT1A]: {
    description: 'Single-family zone near T-1/T-2 transit',
    zoneType: 'SINGLE_FAMILY',
    nearTransitTier: ['T-1', 'T-2'],
  },
  [MIIPCorridorTier.CT1B]: {
    description: 'Single-family zone near T-3/OC',
    zoneType: 'SINGLE_FAMILY',
    nearTransitTier: ['T-3', 'OC-1', 'OC-2', 'OC-3'],
  },
  [MIIPCorridorTier.CT2]: {
    description: 'Multi-family zone',
    zoneType: 'MULTI_FAMILY',
  },
  [MIIPCorridorTier.CT3]: {
    description: 'Commercial zone',
    zoneType: 'COMMERCIAL',
  },
};

// ============================================================================
// AFFORDABILITY REQUIREMENTS (TABLE 12.22 A.38(c)(3)(iii))
// ============================================================================

// High and Medium-High Market Areas
export const AFFORDABILITY_HIGH_MARKET: MIIPAffordabilityRequirement[] = [
  { tier: MIIPTransitTier.T1, marketType: 'HIGH', eli: 9, vli: 12, lower: 21 },
  { tier: MIIPTransitTier.T2, marketType: 'HIGH', eli: 10, vli: 14, lower: 23 },
  { tier: MIIPTransitTier.T3, marketType: 'HIGH', eli: 11, vli: 15, lower: 25 },
  { tier: MIIPOpportunityTier.OC1, marketType: 'HIGH', eli: 9, vli: 12, lower: 21 },
  { tier: MIIPOpportunityTier.OC2, marketType: 'HIGH', eli: 10, vli: 14, lower: 23 },
  { tier: MIIPOpportunityTier.OC3, marketType: 'HIGH', eli: 11, vli: 15, lower: 25 },
  { tier: MIIPCorridorTier.CT1A, marketType: 'HIGH', eli: 9, vli: 12, lower: 21 },
  { tier: MIIPCorridorTier.CT1B, marketType: 'HIGH', eli: 9, vli: 12, lower: 21 },
  { tier: MIIPCorridorTier.CT2, marketType: 'HIGH', eli: 10, vli: 14, lower: 23 },
  { tier: MIIPCorridorTier.CT3, marketType: 'HIGH', eli: 11, vli: 15, lower: 25 },
];

// Medium, Medium-Low, and Low Market Areas
export const AFFORDABILITY_LOW_MARKET: MIIPAffordabilityRequirement[] = [
  { tier: MIIPTransitTier.T1, marketType: 'LOW', eli: 6, vli: 9, lower: 15 },
  { tier: MIIPTransitTier.T2, marketType: 'LOW', eli: 7, vli: 10, lower: 17 },
  { tier: MIIPTransitTier.T3, marketType: 'LOW', eli: 8, vli: 11, lower: 18 },
  { tier: MIIPOpportunityTier.OC1, marketType: 'LOW', eli: 6, vli: 9, lower: 15 },
  { tier: MIIPOpportunityTier.OC2, marketType: 'LOW', eli: 7, vli: 10, lower: 17 },
  { tier: MIIPOpportunityTier.OC3, marketType: 'LOW', eli: 8, vli: 11, lower: 18 },
  { tier: MIIPCorridorTier.CT1A, marketType: 'LOW', eli: 6, vli: 9, lower: 15 },
  { tier: MIIPCorridorTier.CT1B, marketType: 'LOW', eli: 6, vli: 9, lower: 15 },
  { tier: MIIPCorridorTier.CT2, marketType: 'LOW', eli: 7, vli: 10, lower: 17 },
  { tier: MIIPCorridorTier.CT3, marketType: 'LOW', eli: 8, vli: 11, lower: 18 },
];

// ============================================================================
// ADDITIONAL INCENTIVES MENU (Section 12.22 A.38(h)(2))
// ============================================================================

export const MIIP_ADDITIONAL_INCENTIVES = {
  maxIncentives: {
    T1: 3,
    T2: 3,
    T3: 4,
    OC1: 3,
    OC2: 3,
    OC3: 4,
    CT1A: 3,
    CT1B: 3,
    CT2: 3,
    CT3: 4,
  },
  menu: [
    { id: 'YARDS_C', description: 'Yard reduction (C-zones): Use RAS3 setbacks', zones: ['C'] },
    { id: 'YARDS_R', description: 'Yard reduction (R-zones): Up to 30% decrease', zones: ['R'] },
    { id: 'TRANSITIONAL_HEIGHT', description: 'Exempt from transitional height requirements' },
    { id: 'GROUND_FLOOR_ACTIVATION', description: '50% reduction in required commercial floor area' },
    { id: 'GROUND_FLOOR_HEIGHT', description: '30% reduction in ground floor height requirements' },
    { id: 'COMMERCIAL_PARKING', description: 'Eliminate commercial parking requirements' },
    { id: 'BUILDING_SPACING', description: '30% reduction in building separation' },
    { id: 'PASSAGEWAYS', description: '50% reduction in passageway width' },
    { id: 'LOT_COVERAGE', description: '20% increase in lot coverage limits' },
    { id: 'LOT_WIDTH', description: '25% decrease from lot width requirements' },
    { id: 'OPEN_SPACE', description: '15% of lot OR 10% of unit floor area (whichever greater)' },
    { id: 'DENSITY_CALC', description: 'Include dedication area in lot area for density' },
    { id: 'AVERAGING', description: 'Average FAR, density, parking, open space across lots' },
    { id: 'DEV_STANDARD_RELIEF', description: 'Up to 20% relief from any development standard' },
  ],
};

// ============================================================================
// PUBLIC BENEFIT OPTIONS (Section 12.22 A.38(i))
// ============================================================================

export const MIIP_PUBLIC_BENEFITS = [
  {
    id: 'CHILD_CARE',
    description: 'Child Care Facility on premises',
    benefit: '+FAR equal to childcare SF OR +11 ft height',
  },
  {
    id: 'MULTI_BEDROOM',
    description: '10%+ units with 3+ bedrooms',
    benefit: 'Additional FAR and stories per table',
  },
  {
    id: 'TREE_PRESERVATION',
    description: 'Maintain significant trees (12"+ diameter)',
    benefit: '+11 ft height',
  },
  {
    id: 'LAND_DONATION',
    description: 'Donate land for affordable housing',
    benefit: '+15% density bonus',
  },
  {
    id: 'ACTIVE_GROUND_FLOOR',
    description: 'Active retail/service uses on ground floor',
    benefit: 'Exempt up to 1,500 SF from FAR',
  },
  {
    id: 'POPS',
    description: 'Privately Owned Public Space (4% of lot)',
    benefit: 'Zero rear yard + development relief',
  },
  {
    id: 'HISTORIC_FACADE',
    description: 'Rehabilitate historic facade',
    benefit: '+1.0 FAR, +22 ft height',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine Transit tier based on distances
 */
export function determineTransitTier(
  distanceToMetroRailFeet: number | null,
  distanceToMetrolinkFeet: number | null,
  distanceToBusRouteFeet: number | null,
  hasMultipleBusRoutes: boolean,
  inVeryLowVehicleTravelArea: boolean
): MIIPTransitTier | null {
  const t1 = TRANSIT_TIER_DEFINITIONS[MIIPTransitTier.T1];
  const t2 = TRANSIT_TIER_DEFINITIONS[MIIPTransitTier.T2];
  const t3 = TRANSIT_TIER_DEFINITIONS[MIIPTransitTier.T3];

  // Check T-1 first (most restrictive)
  if (
    (distanceToMetroRailFeet !== null && distanceToMetroRailFeet <= t1.metroRailDistanceFeet) ||
    (distanceToMetrolinkFeet !== null && distanceToMetrolinkFeet <= t1.metrolinkDistanceFeet) ||
    (distanceToBusRouteFeet !== null && distanceToBusRouteFeet <= t1.busRouteDistanceFeet && hasMultipleBusRoutes)
  ) {
    return MIIPTransitTier.T1;
  }

  // Check T-2
  if (
    (distanceToMetroRailFeet !== null && distanceToMetroRailFeet <= t2.metroRailDistanceFeet) ||
    (distanceToMetrolinkFeet !== null && distanceToMetrolinkFeet <= t2.metrolinkDistanceFeet) ||
    (distanceToBusRouteFeet !== null && distanceToBusRouteFeet <= t2.busRouteDistanceFeet)
  ) {
    return MIIPTransitTier.T2;
  }

  // Check T-3
  if (
    inVeryLowVehicleTravelArea ||
    (distanceToMetroRailFeet !== null && distanceToMetroRailFeet <= t3.metroRailDistanceFeet) ||
    (distanceToBusRouteFeet !== null && distanceToBusRouteFeet <= t3.busRouteDistanceFeet)
  ) {
    return MIIPTransitTier.T3;
  }

  return null;
}

/**
 * Determine Opportunity Corridor tier based on TCAC area
 */
export function determineOpportunityTier(
  tcacArea: string
): MIIPOpportunityTier | null {
  switch (tcacArea) {
    case 'LOW':
      return MIIPOpportunityTier.OC1;
    case 'MODERATE':
      return MIIPOpportunityTier.OC2;
    case 'HIGH':
    case 'HIGHEST':
      return MIIPOpportunityTier.OC3;
    default:
      return null;
  }
}

/**
 * Get affordability requirement for a tier
 */
export function getAffordabilityRequirement(
  tier: MIIPTransitTier | MIIPOpportunityTier | MIIPCorridorTier,
  isHighMarket: boolean
): MIIPAffordabilityRequirement | null {
  const list = isHighMarket ? AFFORDABILITY_HIGH_MARKET : AFFORDABILITY_LOW_MARKET;
  return list.find(r => r.tier === tier) || null;
}

/**
 * Get incentives for a transit tier
 */
export function getTransitIncentives(tier: MIIPTransitTier): MIIPTransitIncentives | null {
  return TRANSIT_INCENTIVES.find(i => i.tier === tier) || null;
}

/**
 * Get incentives for an opportunity tier
 */
export function getOpportunityIncentives(tier: MIIPOpportunityTier): MIIPOpportunityIncentives | null {
  return OPPORTUNITY_INCENTIVES.find(i => i.tier === tier) || null;
}

/**
 * Get incentives for a corridor tier
 */
export function getCorridorIncentives(tier: MIIPCorridorTier): MIIPCorridorIncentives | null {
  return CORRIDOR_INCENTIVES.find(i => i.tier === tier) || null;
}
