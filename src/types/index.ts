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

  // Floor Area
  baseFAR: number;
  bonusFAR: number;
  totalFAR: number;
  buildableSF: number;

  // Height
  baseHeightFeet: number;
  bonusHeightFeet: number;
  totalHeightFeet: number;
  baseStories: number;
  bonusStories: number;
  totalStories: number;

  // Affordability
  affordableUnits: number;
  affordablePercent: number;
  incomeLevel: IncomeLevel;

  // Parking
  parkingRequired: number;

  // Additional Incentives Available
  additionalIncentivesAvailable: number;
}

export interface UnitMix {
  unitType: UnitType;
  count: number;
  avgSF: number;
  totalSF: number;
  isAffordable: boolean;
  rentPerMonth?: number;
}

export interface FinancialInputs {
  // Revenue assumptions
  marketRentPSF: number;
  vacancyRate: number;
  operatingExpenseRatio: number;

  // Cost assumptions
  hardCostPSF: number;
  softCostPercent: number;
  financingRate: number;
  constructionMonths: number;

  // Return targets
  targetYieldOnCost: number;
  targetDevProfitMargin: number;
  targetEquityMultiple: number;
  targetLeveredIRR: number;

  // For-sale assumptions (if applicable)
  salePricePSF?: number;
  condoMargin?: number;
}

export interface LandResidualResult {
  program: IncentiveProgram;

  // Revenue
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;

  // Costs
  hardCosts: number;
  softCosts: number;
  financingCosts: number;
  ahlfFees: number;
  totalDevelopmentCost: number;

  // Land Residuals by Method
  landResidualYOC: number;
  landResidualDevProfit: number;
  landResidualCondoMargin?: number;
  landResidualEquityMultiple?: number;
  landResidualLeveredIRR?: number;
  landResidualUnleveredROC?: number;

  // Selected/Recommended
  recommendedLandValue: number;
  recommendedMethod: string;
}

export interface ProgramComparison {
  siteInput: SiteInput;
  results: LandResidualResult[];
  bestProgram: IncentiveProgram;
  bestLandValue: number;
  summary: string;
}
