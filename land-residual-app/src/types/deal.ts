// Type definitions for Land Residual Analysis

export type ZoningType =
  | 'LAR3' | 'C2' | 'R1' | 'RD1.5' | 'RD2' | 'RD3' | 'RD4' | 'RD5' | 'RD6'
  | 'C1' | 'C4' | 'C5' | 'CM' | 'M1' | 'M2' | 'MR1' | 'MR2' | 'P' | 'PF'
  | 'OS' | 'A1' | 'A2' | 'RA' | 'RE' | 'RS' | 'R2' | 'R3' | 'R4' | 'R5' | 'Other';

export type DensityBonusProgram =
  | 'TOC Tier 1' | 'TOC Tier 2' | 'TOC Tier 3' | 'TOC Tier 4'
  | 'DB' | 'ED1' | 'IHO' | 'None';

export type ConstructionType =
  | 'Type V Wood-Frame'
  | 'Type III Podium'
  | 'Type I Concrete';

export type ParkingType =
  | 'Surface'
  | 'Tuck-Under'
  | 'Subterranean'
  | 'None';

export type ProductType =
  | 'For-Sale Condos'
  | 'Rental'
  | 'Both';

export type HighestBestUse =
  | 'Condo'
  | 'Rental'
  | 'Either';

export type Jurisdiction =
  | 'City of Los Angeles'
  | 'Unincorporated LA County'
  | 'Other';

export type RentalExitStrategy =
  | 'Sell Stabilized'
  | 'Refi & Hold';

export type AffordableIncomeLevel =
  | 'Extremely Low (30% AMI)'
  | 'Very Low (50% AMI)'
  | 'Low (80% AMI)'
  | 'Moderate (120% AMI)';

export type ParkFeeType =
  | 'Non-Subdivision'
  | 'Subdivision';

export type AHLFMarketArea =
  | 'Low'
  | 'Medium'
  | 'Medium-High'
  | 'High';

export type AHLFBasis =
  | 'Sellable SF'
  | 'Gross Building SF';

// Input form data structure
export interface DealInputs {
  // Deal metadata
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Section A: Site & Project Description
  propertyAddress: string;
  apn: string;
  zoning: ZoningType;
  densityBonusProgram: DensityBonusProgram;
  lotSize: number; // SF
  units: number;
  avgUnitSF: number;
  commonAreaFactor: number; // percentage as decimal
  stories: number;
  constructionType: ConstructionType;
  parkingIncentivesUsed: boolean;
  parkingSpacesBase: number;
  parkingSpacesOverride: number | null;
  parkingType: ParkingType;
  productType: ProductType;
  hbu: HighestBestUse;

  // Jurisdiction & Taxes
  jurisdiction: Jurisdiction;
  applyULA: boolean;
  ulaT1Threshold: number;
  ulaT2Threshold: number;
  ulaT1Rate: number;
  ulaT2Rate: number;

  // Section B: Revenue Assumptions - For-Sale
  salePricePSF: number;
  brokerCommission: number;
  transferTaxClosing: number;
  marketingSales: number;

  // Section C: Revenue Assumptions - Rental
  affordablePct: number;
  affordableLevel: AffordableIncomeLevel;
  ami: number; // LA County AMI (2-Person HH)
  utilityAllowance: number; // $/mo
  marketRentPSF: number; // $/SF/month
  otherIncome: number; // % of GPR
  vacancy: number;
  concessions: number;

  // Rental Exit
  rentalExitStrategy: RentalExitStrategy;
  dispositionBrokerage: number;
  rentalLegalClosing: number;

  // Section D: Operating Expenses - Rental
  propertyManagement: number; // % of EGI
  insurancePerUnit: number;
  propertyTaxRate: number;
  repairsMaintenancePerUnit: number;
  utilitiesCommonPerUnit: number;
  turnoverPerUnit: number;
  generalAdminPerUnit: number;
  reservesPerUnit: number;

  // Section E: Construction & Development Costs
  // Hard Costs
  baseBuildingCostPSF: number;
  parkingCostPerSpace: number;
  demolitionAbatement: number;
  gradingUtilities: number;
  landscapingHardscape: number;
  hardCostContingency: number;

  // Soft Costs & City Fees
  architectureEngineering: number; // % of hard
  surveysGeotechEnv: number;
  legalAccounting: number;
  ladbsPermitFeeRate: number; // % of hard
  planCheckPct: number; // % of permit fee
  lausdSchoolFeesPSF: number;

  // Park Fees
  parkFeeApplies: boolean;
  parkFeeType: ParkFeeType;
  parkFeeNonSub: number;
  parkFeeSub: number;

  // AHLF
  ahlfApplies: boolean;
  ahlfMarketArea: AHLFMarketArea;
  ahlfBasis: AHLFBasis;
  ahlfLow: number;
  ahlfMedium: number;
  ahlfMediumHigh: number;
  ahlfHigh: number;

  // Other Soft Costs
  culturalArtsFeePct: number;
  affordableHousingInLieu: number;
  fireLAFDGreen: number;
  dwpSewerConnections: number;
  buildersRiskInsurance: number;
  wrapGLInsuranceCondo: number; // for-sale only
  softCostContingency: number;

  // Financing & Carry
  constructionLoanLTC: number;
  interestRate: number;
  loanOriginationFee: number;
  constructionMonths: number;
  selloutLeaseUpMonths: number;
  avgOutstandingBalanceFactor: number;
  leaseUpReserve: number; // rental only
  monthsToPermit: number;
  landCarryInterestRate: number;
  landCarryBaseValue: number;

  // Section F: Return Targets
  condoProfitMargin: number;
  yocTarget: number;
  devProfitMarginTarget: number;
  targetEquityMultiple: number;
  equityPctOfTotalCost: number;
  targetLeveredIRR: number;
  unleveredROCTarget: number;
  exitCapRate: number;
}

// Calculated values structure
export interface DealCalculations {
  // Calculated building metrics
  totalSellableSF: number;
  grossBuildingSF: number;
  effectiveParkingSpaces: number;

  // Cost Stack
  totalVerticalConstruction: number;
  totalParkingCost: number;
  totalSiteWork: number;
  hardCostContingencyAmount: number;
  totalHardCosts: number;

  // Soft Costs
  architectureEngineeringAmount: number;
  permitFees: number;
  planCheckFees: number;
  schoolFees: number;
  parkFees: number;
  ahlfFees: number;
  culturalArtsFee: number;
  buildersRiskAmount: number;
  wrapGLAmount: number;
  softCostContingencyAmount: number;
  totalSoftCosts: number;

  // Financing
  constructionLoanAmount: number;
  interestReserveConstruction: number;
  interestReserveSellout: number;
  loanOrigination: number;
  landCarry: number;
  totalFinancingCarry: number;

  // Total Development Cost
  totalDevCostExLand: number;

  // For-Sale Revenue
  grossSalesRevenue: number;
  totalSellingCosts: number;
  netSalesRevenue: number;
  developerProfitCondo: number;
  residualLandCondo: number;

  // Rental Income
  affordableUnits: number;
  marketUnits: number;
  maxAffordableRent: number;
  netAffordableRent: number;
  marketUnitRent: number;
  gpr: number;
  otherIncomeAmount: number;
  gpi: number;
  egi: number;

  // Rental OpEx
  managementExpense: number;
  insuranceExpense: number;
  repairsMaintenanceExpense: number;
  utilitiesExpense: number;
  turnoverExpense: number;
  generalAdminExpense: number;
  reservesExpense: number;
  totalOpExBeforeTax: number;
  noiBeforeTax: number;

  // Exit Valuation
  stabilizedValue: number;
  propertyTaxAnnual: number;
  noiAfterTax: number;
  ulaAmount: number;
  totalExitCosts: number;
  netExitProceeds: number;

  // Rental Residuals
  residualYOC: number;
  residualDevMargin: number;
  residualEquityMultiple: number;
  residualLeveredIRR: number;
  residualUnleveredROC: number;

  // HBU Results
  primaryResidual: number;
  primaryResidualMethod: string;
  listingRangeLow: number;
  listingRangeHigh: number;
  fullBuyerSpectrumLow: number;
  fullBuyerSpectrumHigh: number;

  // Per-unit & per-SF metrics
  primaryPerUnit: number;
  primaryPerSFLand: number;
  primaryPerBuildableSF: number;

  // Key Metrics
  yocAtResidual: number;
  devSpreadBps: number;
  noiPerUnit: number;
  expenseRatio: number;
  grm: number;
  landPctOfTotalCost: number;
}

// Sanity check warnings
export interface SanityCheck {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  field?: string;
}

// Sensitivity table cell
export interface SensitivityCell {
  value: number;
  isPositive: boolean;
}

// Full deal with inputs and calculations
export interface Deal {
  inputs: DealInputs;
  calculations: DealCalculations;
  sanityChecks: SanityCheck[];
}

// Default input values
export const DEFAULT_INPUTS: Omit<DealInputs, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
  // Site & Project
  propertyAddress: '',
  apn: '',
  zoning: 'LAR3',
  densityBonusProgram: 'None',
  lotSize: 7500,
  units: 16,
  avgUnitSF: 850,
  commonAreaFactor: 0.15,
  stories: 4,
  constructionType: 'Type V Wood-Frame',
  parkingIncentivesUsed: false,
  parkingSpacesBase: 16,
  parkingSpacesOverride: null,
  parkingType: 'Subterranean',
  productType: 'For-Sale Condos',
  hbu: 'Either',

  // Jurisdiction
  jurisdiction: 'City of Los Angeles',
  applyULA: true,
  ulaT1Threshold: 5300000,
  ulaT2Threshold: 10600000,
  ulaT1Rate: 0.04,
  ulaT2Rate: 0.055,

  // Revenue - Condo
  salePricePSF: 750,
  brokerCommission: 0.05,
  transferTaxClosing: 0.015,
  marketingSales: 0.02,

  // Revenue - Rental
  affordablePct: 0.11,
  affordableLevel: 'Extremely Low (30% AMI)',
  ami: 85300,
  utilityAllowance: 125,
  marketRentPSF: 3.75,
  otherIncome: 0.05,
  vacancy: 0.05,
  concessions: 0.02,

  // Rental Exit
  rentalExitStrategy: 'Sell Stabilized',
  dispositionBrokerage: 0.015,
  rentalLegalClosing: 0.005,

  // Operating Expenses
  propertyManagement: 0.04,
  insurancePerUnit: 1600,
  propertyTaxRate: 0.0115,
  repairsMaintenancePerUnit: 750,
  utilitiesCommonPerUnit: 600,
  turnoverPerUnit: 300,
  generalAdminPerUnit: 400,
  reservesPerUnit: 300,

  // Hard Costs
  baseBuildingCostPSF: 325,
  parkingCostPerSpace: 65000,
  demolitionAbatement: 25000,
  gradingUtilities: 50000,
  landscapingHardscape: 30000,
  hardCostContingency: 0.05,

  // Soft Costs
  architectureEngineering: 0.07,
  surveysGeotechEnv: 35000,
  legalAccounting: 25000,
  ladbsPermitFeeRate: 0.035,
  planCheckPct: 0.65,
  lausdSchoolFeesPSF: 5.17,

  // Park Fees
  parkFeeApplies: true,
  parkFeeType: 'Non-Subdivision',
  parkFeeNonSub: 8805,
  parkFeeSub: 17964,

  // AHLF
  ahlfApplies: true,
  ahlfMarketArea: 'Medium',
  ahlfBasis: 'Sellable SF',
  ahlfLow: 10.32,
  ahlfMedium: 12.91,
  ahlfMediumHigh: 16.77,
  ahlfHigh: 23.20,

  // Other Soft
  culturalArtsFeePct: 0.01,
  affordableHousingInLieu: 0,
  fireLAFDGreen: 15000,
  dwpSewerConnections: 20000,
  buildersRiskInsurance: 0.01,
  wrapGLInsuranceCondo: 0.025,
  softCostContingency: 0.05,

  // Financing
  constructionLoanLTC: 0.65,
  interestRate: 0.085,
  loanOriginationFee: 0.015,
  constructionMonths: 20,
  selloutLeaseUpMonths: 8,
  avgOutstandingBalanceFactor: 0.55,
  leaseUpReserve: 100000,
  monthsToPermit: 0,
  landCarryInterestRate: 0.08,
  landCarryBaseValue: 0,

  // Return Targets
  condoProfitMargin: 0.15,
  yocTarget: 0.06,
  devProfitMarginTarget: 0.15,
  targetEquityMultiple: 1.8,
  equityPctOfTotalCost: 0.35,
  targetLeveredIRR: 0.18,
  unleveredROCTarget: 0.055,
  exitCapRate: 0.05,
};
