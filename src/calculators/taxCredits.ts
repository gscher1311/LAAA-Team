/**
 * LIHTC Tax Credit Calculator
 * Models 4% and 9% Low Income Housing Tax Credits
 */

import { IncomeLevel } from '../types';
import { UnitMixWithRents } from './unitMix';
import { CostStack, RevenueAnalysis } from './financial';

// ============================================================================
// TYPES
// ============================================================================

export type LIHTCType = '4%' | '9%' | 'none';

export interface LIHTCAssumptions {
  // Credit rates (2025 rates)
  ninePercentRate: number;           // ~9% annual for 10 years
  fourPercentRate: number;           // ~4% annual for 10 years (with bonds)

  // Equity pricing (cents per dollar of credit)
  ninePercentPricing: number;        // $0.92-0.96 typically
  fourPercentPricing: number;        // $0.88-0.92 typically

  // Compliance
  creditPeriodYears: number;         // 10 years
  compliancePeriodYears: number;     // 15 years (extended compliance)
  affordabilityPeriodYears: number;  // 55 years typical in CA

  // Basis limits
  includeLandInBasis: boolean;       // Land generally not in basis
  basisBoostPercent: number;         // 30% boost in high-cost areas (DDA/QCT)
  eligibleBasisPercent: number;      // 100% for new construction
}

export interface LIHTCEligibility {
  eligible: boolean;
  type: LIHTCType;
  reason?: string;
  minimumAffordablePercent: number;
  minimumIncomeLevel: IncomeLevel;
}

export interface LIHTCCalculation {
  type: LIHTCType;
  eligibleBasis: number;
  applicableFraction: number;
  qualifiedBasis: number;
  annualCredit: number;
  totalCredits: number;           // Over 10 years
  equityFromCredits: number;      // Credits × pricing
  effectiveSubsidy: number;       // As % of dev cost
  metrics: {
    creditRate: number;
    equityPricing: number;
    basisBoost: boolean;
  };
}

export interface SubsidySource {
  name: string;
  amount: number;
  type: 'debt' | 'equity' | 'grant' | 'deferral';
  interestRate?: number;
  term?: number;
  notes?: string;
}

export interface GapFinancing {
  totalDevelopmentCost: number;
  permanentDebt: number;
  taxCreditEquity: number;
  deferredDeveloperFee: number;
  otherSubsidies: SubsidySource[];
  totalSources: number;
  fundingGap: number;
  gapAsPercentOfCost: number;
  isFeasible: boolean;
}

// ============================================================================
// DEFAULT ASSUMPTIONS
// ============================================================================

export const LIHTC_DEFAULTS: LIHTCAssumptions = {
  // 2025 credit rates (approximate - actual rates fluctuate)
  ninePercentRate: 0.09,
  fourPercentRate: 0.04,

  // Current market pricing
  ninePercentPricing: 0.94,  // $0.94 per dollar of credit
  fourPercentPricing: 0.90,  // $0.90 per dollar of credit

  // Periods
  creditPeriodYears: 10,
  compliancePeriodYears: 15,
  affordabilityPeriodYears: 55,

  // Basis
  includeLandInBasis: false,
  basisBoostPercent: 30,       // DDA/QCT boost
  eligibleBasisPercent: 100,   // New construction
};

// ============================================================================
// LIHTC ELIGIBILITY
// ============================================================================

/**
 * Check LIHTC eligibility based on affordability
 */
export function checkLIHTCEligibility(
  affordablePercent: number,
  incomeLevel: IncomeLevel,
  totalUnits: number
): LIHTCEligibility {
  // Must have at least 5 units
  if (totalUnits < 5) {
    return {
      eligible: false,
      type: 'none',
      reason: 'LIHTC requires minimum 5 units',
      minimumAffordablePercent: 0,
      minimumIncomeLevel: IncomeLevel.LOW_80,
    };
  }

  // LIHTC has two tests (must meet one):
  // 20-50 test: 20% of units at 50% AMI
  // 40-60 test: 40% of units at 60% AMI
  // Income averaging: Average 60% AMI across all restricted units

  const isVLI = incomeLevel === IncomeLevel.VLI || incomeLevel === IncomeLevel.ELI;
  const isLow = incomeLevel === IncomeLevel.LOW || incomeLevel === IncomeLevel.LOW_80;

  // Check 20-50 test (VLI)
  if (isVLI && affordablePercent >= 20) {
    return {
      eligible: true,
      type: affordablePercent >= 50 ? '9%' : '4%',  // 9% competitive, need high affordability
      minimumAffordablePercent: 20,
      minimumIncomeLevel: IncomeLevel.VLI,
    };
  }

  // Check 40-60 test (Low Income 60%)
  if ((isVLI || isLow) && affordablePercent >= 40) {
    return {
      eligible: true,
      type: affordablePercent >= 80 ? '9%' : '4%',
      minimumAffordablePercent: 40,
      minimumIncomeLevel: IncomeLevel.LOW,
    };
  }

  // Special case: 100% affordable always qualifies for 9%
  if (affordablePercent >= 100) {
    return {
      eligible: true,
      type: '9%',
      minimumAffordablePercent: 100,
      minimumIncomeLevel: IncomeLevel.LOW,
    };
  }

  // Doesn't meet minimum thresholds
  return {
    eligible: false,
    type: 'none',
    reason: `Need 20% at VLI or 40% at 60% AMI. Current: ${affordablePercent}% at ${incomeLevel}`,
    minimumAffordablePercent: 40,
    minimumIncomeLevel: IncomeLevel.LOW,
  };
}

// ============================================================================
// LIHTC CALCULATION
// ============================================================================

/**
 * Calculate LIHTC equity
 */
export function calculateLIHTC(
  costs: CostStack,
  affordablePercent: number,
  incomeLevel: IncomeLevel,
  totalUnits: number,
  inDDAorQCT: boolean = true,  // Most LA sites qualify
  assumptions: LIHTCAssumptions = LIHTC_DEFAULTS
): LIHTCCalculation {
  const eligibility = checkLIHTCEligibility(affordablePercent, incomeLevel, totalUnits);

  if (!eligibility.eligible) {
    return {
      type: 'none',
      eligibleBasis: 0,
      applicableFraction: 0,
      qualifiedBasis: 0,
      annualCredit: 0,
      totalCredits: 0,
      equityFromCredits: 0,
      effectiveSubsidy: 0,
      metrics: {
        creditRate: 0,
        equityPricing: 0,
        basisBoost: false,
      },
    };
  }

  const type = eligibility.type as '4%' | '9%';
  const creditRate = type === '9%' ? assumptions.ninePercentRate : assumptions.fourPercentRate;
  const equityPricing = type === '9%' ? assumptions.ninePercentPricing : assumptions.fourPercentPricing;

  // Eligible Basis = Development costs minus land and certain fees
  // Typically: Hard costs + most soft costs
  const eligibleBasis = costs.totalHardCosts + costs.softCosts + costs.permitFees;

  // Apply basis boost for DDA/QCT (30% increase)
  const boostedBasis = inDDAorQCT
    ? eligibleBasis * (1 + assumptions.basisBoostPercent / 100)
    : eligibleBasis;

  // Applicable Fraction = % of units that are affordable (capped at 100%)
  const applicableFraction = Math.min(affordablePercent / 100, 1);

  // Qualified Basis = Boosted Eligible Basis × Applicable Fraction
  const qualifiedBasis = boostedBasis * applicableFraction;

  // Annual Credit = Qualified Basis × Credit Rate
  const annualCredit = qualifiedBasis * creditRate;

  // Total Credits over 10 years
  const totalCredits = annualCredit * assumptions.creditPeriodYears;

  // Equity from Credits = Total Credits × Pricing
  const equityFromCredits = totalCredits * equityPricing;

  // Effective subsidy as % of dev cost
  const effectiveSubsidy = equityFromCredits / costs.totalDevelopmentCost;

  return {
    type,
    eligibleBasis,
    applicableFraction,
    qualifiedBasis,
    annualCredit,
    totalCredits,
    equityFromCredits,
    effectiveSubsidy,
    metrics: {
      creditRate,
      equityPricing,
      basisBoost: inDDAorQCT,
    },
  };
}

// ============================================================================
// GAP FINANCING / SOURCES & USES
// ============================================================================

/**
 * Calculate permanent debt capacity from NOI
 */
export function calculatePermanentDebt(
  noi: number,
  debtServiceCoverageRatio: number = 1.20,
  interestRate: number = 0.065,
  amortizationYears: number = 35
): number {
  // Max debt service = NOI / DSCR
  const maxDebtService = noi / debtServiceCoverageRatio;

  // Calculate loan amount from annual debt service
  // Using mortgage constant formula
  const monthlyRate = interestRate / 12;
  const numPayments = amortizationYears * 12;
  const monthlyPayment = maxDebtService / 12;

  // PV = PMT × [(1 - (1 + r)^-n) / r]
  const pvFactor = (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
  const loanAmount = monthlyPayment * pvFactor;

  return Math.max(0, loanAmount);
}

/**
 * Calculate deferred developer fee
 */
export function calculateDeferredDeveloperFee(
  totalDevelopmentCost: number,
  developerFeePercent: number = 0.15,
  deferralPercent: number = 0.50
): number {
  const totalFee = totalDevelopmentCost * developerFeePercent;
  return totalFee * deferralPercent;
}

/**
 * Common LA subsidy sources
 */
export function getLASubsidySources(
  isAffordable: boolean,
  totalUnits: number,
  affordableUnits: number
): SubsidySource[] {
  const sources: SubsidySource[] = [];

  if (!isAffordable || affordableUnits < 5) {
    return sources;
  }

  // LAHD Affordable Housing Trust Fund
  sources.push({
    name: 'LAHD AHTF',
    amount: affordableUnits * 75000,  // ~$75K per affordable unit typical
    type: 'debt',
    interestRate: 0.03,
    term: 55,
    notes: 'LA Housing Dept soft loan, 3% simple, 55-year term',
  });

  // Measure ULA / House LA (if 100% affordable)
  if (affordableUnits === totalUnits) {
    sources.push({
      name: 'House LA (ULA)',
      amount: affordableUnits * 50000,  // ~$50K per unit
      type: 'grant',
      notes: 'Measure ULA funds for 100% affordable',
    });
  }

  // State HCD programs
  sources.push({
    name: 'HCD MHP/VHHP',
    amount: affordableUnits * 100000,  // Up to $100K per unit
    type: 'debt',
    interestRate: 0.03,
    term: 55,
    notes: 'State MHP or VHHP soft loan',
  });

  return sources;
}

/**
 * Calculate full gap financing / sources and uses
 */
export function calculateGapFinancing(
  costs: CostStack,
  revenue: RevenueAnalysis,
  lihtc: LIHTCCalculation,
  affordablePercent: number,
  totalUnits: number,
  includeStateSubsidies: boolean = true
): GapFinancing {
  const affordableUnits = Math.ceil(totalUnits * (affordablePercent / 100));
  const isAffordable = affordablePercent >= 50;

  // Permanent debt from NOI
  const permanentDebt = calculatePermanentDebt(revenue.netOperatingIncome);

  // Tax credit equity
  const taxCreditEquity = lihtc.equityFromCredits;

  // Deferred developer fee (common in affordable deals)
  const deferredDeveloperFee = isAffordable
    ? calculateDeferredDeveloperFee(costs.totalDevelopmentCost)
    : 0;

  // Other subsidies
  const otherSubsidies = includeStateSubsidies
    ? getLASubsidySources(isAffordable, totalUnits, affordableUnits)
    : [];

  const otherSubsidyTotal = otherSubsidies.reduce((sum, s) => sum + s.amount, 0);

  // Total sources
  const totalSources = permanentDebt + taxCreditEquity + deferredDeveloperFee + otherSubsidyTotal;

  // Gap
  const fundingGap = costs.totalDevelopmentCost - totalSources;
  const gapAsPercentOfCost = fundingGap / costs.totalDevelopmentCost;

  // Feasibility: Gap should be < 10% of costs for a fundable deal
  const isFeasible = gapAsPercentOfCost < 0.10;

  return {
    totalDevelopmentCost: costs.totalDevelopmentCost,
    permanentDebt,
    taxCreditEquity,
    deferredDeveloperFee,
    otherSubsidies,
    totalSources,
    fundingGap: Math.max(0, fundingGap),
    gapAsPercentOfCost: Math.max(0, gapAsPercentOfCost),
    isFeasible,
  };
}

// ============================================================================
// ADJUSTED LAND RESIDUAL WITH SUBSIDIES
// ============================================================================

/**
 * Calculate land residual including tax credits and subsidies
 */
export function calculateSubsidizedLandResidual(
  costs: CostStack,
  lihtc: LIHTCCalculation,
  gapFinancing: GapFinancing,
  targetDeveloperReturn: number = 0.12  // 12% return on invested equity
): {
  landValue: number;
  method: string;
  metrics: Record<string, number>;
} {
  // Total development cost
  const tdc = costs.totalDevelopmentCost;

  // Subsidy value = tax credit equity + other grants
  const subsidyValue = lihtc.equityFromCredits +
    gapFinancing.otherSubsidies
      .filter(s => s.type === 'grant')
      .reduce((sum, s) => sum + s.amount, 0);

  // Developer's required equity (after debt and subsidies)
  const requiredEquity = tdc - gapFinancing.permanentDebt - subsidyValue - gapFinancing.deferredDeveloperFee;

  // Land can absorb subsidy value minus required developer return
  // Land = Subsidy Value - Required Return on Remaining Equity
  const developerReturn = requiredEquity * targetDeveloperReturn;
  const landValue = Math.max(0, subsidyValue - developerReturn);

  return {
    landValue,
    method: 'Subsidized Development',
    metrics: {
      totalSubsidy: subsidyValue,
      taxCreditEquity: lihtc.equityFromCredits,
      permanentDebt: gapFinancing.permanentDebt,
      requiredEquity,
      developerReturn,
      effectiveSubsidyPercent: subsidyValue / tdc,
    },
  };
}
