/**
 * Land Residual Analysis App - Type Definitions
 * Covers all LA housing incentive programs and calculation inputs/outputs
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum IncomeLevel {
  ELI = 'ELI',           // Extremely Low Income (30% AMI)
  VLI = 'VLI',           // Very Low Income (50% AMI)
  LOW = 'LOW',           // Lower Income (60% AMI)
  LOW_80 = 'LOW_80',     // Lower Income (80% AMI)
  MODERATE = 'MODERATE'  // Moderate Income (120% AMI)
}

export enum MarketArea {
  HIGH = 'HIGH',
  MEDIUM_HIGH = 'MEDIUM_HIGH',
  MEDIUM = 'MEDIUM',
  MEDIUM_LOW = 'MEDIUM_LOW',
  LOW = 'LOW'
}

export enum TCACOpportunityArea {
  HIGHEST = 'HIGHEST',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW'
}

export enum ZoneType {
  // Residential
  R1 = 'R1',
  R2 = 'R2',
  R3 = 'R3',
  R4 = 'R4',
  R5 = 'R5',
  RAS3 = 'RAS3',
  RAS4 = 'RAS4',
  RD1_5 = 'RD1.5',
  RD2 = 'RD2',
  RD3 = 'RD3',
  RD4 = 'RD4',
  RD5 = 'RD5',
  RD6 = 'RD6',
  RW1 = 'RW1',
  RW2 = 'RW2',
  // Commercial
  C1 = 'C1',
  C1_5 = 'C1.5',
  C2 = 'C2',
  C4 = 'C4',
  C5 = 'C5',
  CR = 'CR',
  CM = 'CM',
  // Manufacturing/Industrial
  M1 = 'M1',
  M2 = 'M2',
  M3 = 'M3',
  MR1 = 'MR1',
  MR2 = 'MR2',
  // Parking
  P = 'P',
  PB = 'PB'
}

export enum HeightDistrict {
  HD_1 = '1',
  HD_1L = '1L',
  HD_1VL = '1VL',
  HD_1XL = '1XL',
  HD_1SS = '1SS',
  HD_2 = '2',
  HD_3 = '3',
  HD_4 = '4'
}

export enum IncentiveProgram {
  BY_RIGHT = 'BY_RIGHT',
  STATE_DENSITY_BONUS = 'STATE_DENSITY_BONUS',
  MIIP_TRANSIT = 'MIIP_TRANSIT',
  MIIP_OPPORTUNITY = 'MIIP_OPPORTUNITY',
  MIIP_CORRIDOR = 'MIIP_CORRIDOR',
  AHIP = 'AHIP',
  ED1 = 'ED1',
  SB_79 = 'SB_79',
  TOC = 'TOC'  // Legacy, replaced by CHIP
}

export enum MIIPTransitTier {
  T1 = 'T-1',
  T2 = 'T-2',
  T3 = 'T-3'
}

export enum MIIPOpportunityTier {
  OC1 = 'OC-1',
  OC2 = 'OC-2',
  OC3 = 'OC-3'
}

export enum MIIPCorridorTier {
  CT1A = 'CT-1A',
  CT1B = 'CT-1B',
  CT2 = 'CT-2',
  CT3 = 'CT-3'
}

export enum AHIPProjectType {
  ONE_HUNDRED_PERCENT = '100_PERCENT',
  PUBLIC_LAND = 'PUBLIC_LAND',
  FAITH_BASED = 'FAITH_BASED',
  SHARED_EQUITY = 'SHARED_EQUITY'
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BR = '1BR',
  TWO_BR = '2BR',
  THREE_BR = '3BR',
  FOUR_BR_PLUS = '4BR+'
}

// ============================================================================
// SITE INPUT TYPES
// ============================================================================

export interface SiteInput {
  // Location
  address: string;
  apn?: string;

  // Physical
  lotSizeSF: number;

  // Zoning
  baseZone: ZoneType;
  heightDistrict: HeightDistrict;
  specificPlan?: string;
  overlays?: string[];

  // Geographic context
  distanceToMajorTransitFeet?: number;
  distanceToMetroRailFeet?: number;
  distanceToMetrolinkFeet?: number;
  distanceToBusRouteFeet?: number;
  inVeryLowVehicleTravelArea?: boolean;

  // TCAC/Market
  tcacArea: TCACOpportunityArea;
  marketArea: MarketArea;

  // Constraints
  inVHFHSZ?: boolean;      // Very High Fire Hazard Severity Zone
  inCoastalZone?: boolean;
  inSeaLevelRiseArea?: boolean;
  inHillsideArea?: boolean;
  hasHistoricResource?: boolean;
}

// ============================================================================
// ZONING DATA TYPES
// ============================================================================

export interface ZoneStandards {
  zone: ZoneType;
  densitySFperDU: number | null;  // null = no density limit
  baseFAR: number;
  maxHeightFeet: number | null;   // null = no limit (use height district)
  maxStories: number | null;
  frontYardFeet: number;
  sideYardFeet: number;
  rearYardFeet: number;
  parkingPerUnit: number;
  allowsResidential: boolean;
  isCommercial: boolean;
  isManufacturing: boolean;
}

export interface HeightDistrictLimits {
  district: HeightDistrict;
  maxFAR: number | null;
  maxHeightFeet: number | null;
}

// ============================================================================
// DENSITY BONUS TYPES
// ============================================================================

export interface DensityBonusTier {
  affordablePercent: number;
  densityBonusPercent: number;
}

export interface StateDensityBonusTable {
  vliTiers: DensityBonusTier[];
  lowerIncomeTiers: DensityBonusTier[];
  moderateTiers: DensityBonusTier[];
  additionalBonusPerPercent: {
    vli: number;      // 2.5%
    lower: number;    // 1.5%
    moderate: number; // 1.0%
  };
}

export interface ParkingRatio {
  unitType: UnitType;
  spacesRequired: number;
}

// ============================================================================
// MIIP TYPES
// ============================================================================

export interface MIIPAffordabilityRequirement {
  tier: MIIPTransitTier | MIIPOpportunityTier | MIIPCorridorTier;
  marketType: 'HIGH' | 'LOW';  // High/Med-High vs Med/Med-Low/Low
  eli: number;
  vli: number;
  lower: number;
}

export interface MIIPTransitIncentives {
  tier: MIIPTransitTier;
  densityBonusMin: number;
  densityBonusMax: number;
  farIncreaseRZone: number;
  farCZone: number;
  farIncreaseCZone: number;
  additionalStories: number;
  additionalHeightFeet: number;
  parkingRequired: boolean;
}

export interface MIIPOpportunityIncentives {
  tier: MIIPOpportunityTier;
  farIncreaseRZone: number;
  farCZone: number;
  farIncreaseCZone: number;
  maxStories: number;
  additionalStories: number;
  additionalHeightFeet: number;
  parkingRequired: boolean;
}

export interface MIIPCorridorIncentives {
  tier: MIIPCorridorTier;
  maxUnitsMin: number;
  maxUnitsMax: number;
  farMin: number;
  farMax: number;
  maxStories: number;
  parkingRequired: boolean;
}

// ============================================================================
// AHIP TYPES
// ============================================================================

export interface AHIPBaseIncentives {
  subarea: 'CITYWIDE_LOW' | 'HIGHER_MODERATE' | 'TRANSIT_HALF_MILE';
  siteHasLessThan5Units: boolean;
  densityBonus: string;  // "Per State Gov Code 65915"
  maxFAR: number;
  additionalHeightFeet: number;
  additionalStories: number;
  parkingPerUnit: number | null;  // null = no minimum
}

export interface AHIPProjectRequirements {
  projectType: AHIPProjectType;
  minAffordablePercent: number;
}

// ============================================================================
// AMI & RENT TYPES
// ============================================================================

export interface AMITable {
  year: number;
  byHouseholdSize: {
    [size: number]: number;  // 1-8 person household
  };
}

export interface RentLimitTable {
  year: number;
  byBedroomAndIncome: {
    [bedroom: number]: {
      [key in IncomeLevel]: number;
    };
  };
}

// ============================================================================
// FEE TYPES
// ============================================================================

export interface AHLFFees {
  residential: {
    [key in MarketArea]: number;  // per SF
  };
  nonResidential: {
    [key in MarketArea]: number;  // per SF
  };
}

// ============================================================================
// CALCULATION OUTPUT TYPES
// ============================================================================

export interface DevelopmentPotential {
  program: IncentiveProgram;
  eligible: boolean;
  ineligibilityReason?: string;

  // Density
  baseDensity: number;
  bonusDensity: number;
  totalUnits: number;
  estimatedUnits: number;  // Calculated from buildable envelope

  // Floor Area
  baseFAR: number;
  bonusFAR: number;
  totalFAR: number;
  buildableSF: number;  // Max buildable envelope (FAR × lot size)
  buildableFootprintSF: number;  // Max footprint (lot - setbacks)
  commonAreaSF: number;  // Estimated common area (15% of envelope)
  netResidentialSF: number;  // Buildable - common areas

  // Height
  baseHeightFeet: number;
  bonusHeightFeet: number;
  totalHeightFeet: number;
  baseStories: number;
  bonusStories: number;
  totalStories: number;

  // Setbacks (per LAMC)
  setbacks: {
    front: number;  // feet
    side: number;   // feet (base)
    sidePerStory: number;  // additional per story over 2nd
    sideMax: number;  // maximum side setback
    rear: number;  // feet (base)
    rearPerStory: number;  // additional per story over 3rd
    rearMax: number;  // maximum rear setback
  };

  // Open Space Requirements
  openSpace: {
    required: boolean;
    sqftPerUnit: number;  // varies by unit size
    totalRequired: number;
    method: string;  // e.g., "100 SF/unit <3 hab rooms"
  };

  // Affordability
  affordableUnits: number;
  affordablePercent: number;
  incomeLevel: IncomeLevel;
  affordabilityOptions: string[];  // e.g., ["12% ELI", "16% VLI", "28% Lower"]

  // Parking
  parkingRequired: number;
  parkingMethod: string;  // e.g., "No Parking per AB 2097"
  bicycleParkingLongTerm: number;
  bicycleParkingShortTerm: number;

  // Transitional Height
  transitionalHeightApplies: boolean;
  transitionalHeightNotes: string;

  // Additional Incentives Available
  additionalIncentivesAvailable: number;
  availableIncentives: string[];  // List of available incentives

  // Density calculation methodology
  densityCalculation: {
    method: string;  // e.g., "Lot SF / 400 SF per DU"
    formula: string;  // e.g., "15,000 SF / 400 = 37 units"
    notes: string;
  };
}

// Note: UnitMix, FinancialInputs, LandResidualResult, and ProgramComparison
// are defined in calculators/unitMix.ts and calculators/financial.ts
