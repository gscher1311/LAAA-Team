/**
 * Financial Model
 * Revenue, costs, and land residual calculations
 */

import { MarketArea, IncomeLevel, DevelopmentPotential, IncentiveProgram } from '../types';
import { calculateAHLFFee, isHighMarketArea } from '../data/amiAndFees';
import { UnitMixWithRents, generateUnitMixFromPotential } from './unitMix';

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialAssumptions {
  // Revenue
  marketRentPSF: number;          // Monthly rent per SF (e.g., $4.50)
  vacancyRate: number;            // 5% = 0.05
  operatingExpenseRatio: number;  // 35% = 0.35 of EGI

  // Hard Costs
  hardCostPSF: number;            // Construction cost per SF
  parkingCostPerSpace: number;    // Cost per parking space

  // Soft Costs
  softCostPercent: number;        // % of hard costs (25-30% typical)

  // Financing
  constructionLoanRate: number;   // Annual rate (e.g., 0.07 for 7%)
  constructionMonths: number;     // Duration (18-24 months typical)
  loanToValue: number;            // 65% = 0.65

  // Return Targets
  targetYieldOnCost: number;      // 5.5% = 0.055
  targetDevProfitMargin: number;  // 15% = 0.15
  targetUnleveredIRR: number;     // 12% = 0.12

  // Exit
  exitCapRate: number;            // 4.5% = 0.045

  // For-Sale (if applicable)
  salePricePSF?: number;
  brokerFeePercent?: number;
}

export interface RevenueAnalysis {
  grossPotentialRent: number;     // Annual GPR
  vacancyLoss: number;
  effectiveGrossIncome: number;   // EGI
  operatingExpenses: number;
  netOperatingIncome: number;     // NOI

  // Per unit metrics
  rentPerUnitMonth: number;
  noiPerUnit: number;
}

export interface CostStack {
  // Land (calculated via residual)
  landCost: number;

  // Hard Costs
  constructionCost: number;
  parkingCost: number;
  totalHardCosts: number;

  // Soft Costs
  softCosts: number;
  ahlfFee: number;
  permitFees: number;
  totalSoftCosts: number;

  // Financing
  constructionInterest: number;

  // Total
  totalDevelopmentCost: number;   // Excluding land
  totalProjectCost: number;       // Including land

  // Per unit/SF metrics
  costPerUnit: number;
  costPerSF: number;
}

export interface LandResidual {
  method: string;
  landValue: number;
  impliedLandPSF: number;         // Per lot SF
  supportedLandPSF: number;       // Per buildable SF
  metrics: Record<string, number>;
}

export interface FinancialAnalysis {
  program: IncentiveProgram;
  potential: DevelopmentPotential;
  unitMix: UnitMixWithRents;
  revenue: RevenueAnalysis;
  costs: CostStack;
  residuals: LandResidual[];
  recommendedLandValue: number;
  recommendedMethod: string;
}

// ============================================================================
// DEFAULT ASSUMPTIONS
// ============================================================================

export const LA_DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  // Revenue - LA market (2025)
  marketRentPSF: 4.25,            // ~$2,760/mo for 650 SF 1BR
  vacancyRate: 0.05,
  operatingExpenseRatio: 0.35,

  // Hard Costs - Type V wood frame (5 story)
  hardCostPSF: 350,
  parkingCostPerSpace: 45000,     // Podium parking

  // Soft Costs
  softCostPercent: 0.28,

  // Financing
  constructionLoanRate: 0.08,
  constructionMonths: 20,
  loanToValue: 0.65,

  // Return Targets
  targetYieldOnCost: 0.055,
  targetDevProfitMargin: 0.15,
  targetUnleveredIRR: 0.12,

  // Exit
  exitCapRate: 0.045,

  // For-Sale
  salePricePSF: 850,
  brokerFeePercent: 0.05,
};

// ============================================================================
// REVENUE CALCULATOR
// ============================================================================

/**
 * Calculate revenue from unit mix
 */
export function calculateRevenue(
  unitMix: UnitMixWithRents,
  assumptions: FinancialAssumptions
): RevenueAnalysis {
  const grossPotentialRent = unitMix.annualGrossRent;
  const vacancyLoss = grossPotentialRent * assumptions.vacancyRate;
  const effectiveGrossIncome = grossPotentialRent - vacancyLoss;
  const operatingExpenses = effectiveGrossIncome * assumptions.operatingExpenseRatio;
  const netOperatingIncome = effectiveGrossIncome - operatingExpenses;

  return {
    grossPotentialRent,
    vacancyLoss,
    effectiveGrossIncome,
    operatingExpenses,
    netOperatingIncome,
    rentPerUnitMonth: unitMix.blendedRentPerMonth,
    noiPerUnit: netOperatingIncome / unitMix.totalUnits,
  };
}

// ============================================================================
// COST STACK CALCULATOR
// ============================================================================

/**
 * Calculate development cost stack
 */
export function calculateCostStack(
  potential: DevelopmentPotential,
  unitMix: UnitMixWithRents,
  marketArea: MarketArea,
  assumptions: FinancialAssumptions,
  landCost: number = 0
): CostStack {
  // Hard Costs
  const constructionCost = unitMix.totalSF * assumptions.hardCostPSF;
  const parkingCost = potential.parkingRequired * assumptions.parkingCostPerSpace;
  const totalHardCosts = constructionCost + parkingCost;

  // Soft Costs
  const softCosts = totalHardCosts * assumptions.softCostPercent;
  const ahlfFee = calculateAHLFFee(
    unitMix.totalSF,
    marketArea,
    unitMix.totalUnits,
    0  // No commercial SF
  );
  const permitFees = unitMix.totalSF * 15;  // ~$15/SF for permits in LA
  const totalSoftCosts = softCosts + ahlfFee + permitFees;

  // Financing (construction interest)
  const totalCostsBeforeInterest = totalHardCosts + totalSoftCosts;
  // Average outstanding = 60% of total (draw schedule)
  const avgOutstanding = totalCostsBeforeInterest * 0.60;
  const constructionInterest = avgOutstanding * assumptions.constructionLoanRate *
    (assumptions.constructionMonths / 12);

  // Totals
  const totalDevelopmentCost = totalHardCosts + totalSoftCosts + constructionInterest;
  const totalProjectCost = totalDevelopmentCost + landCost;

  return {
    landCost,
    constructionCost,
    parkingCost,
    totalHardCosts,
    softCosts,
    ahlfFee,
    permitFees,
    totalSoftCosts,
    constructionInterest,
    totalDevelopmentCost,
    totalProjectCost,
    costPerUnit: totalDevelopmentCost / unitMix.totalUnits,
    costPerSF: totalDevelopmentCost / unitMix.totalSF,
  };
}

// ============================================================================
// LAND RESIDUAL CALCULATORS
// ============================================================================

/**
 * Land Residual via Yield on Cost (YOC)
 * Most common method for rental development
 */
export function calculateLandResidualYOC(
  revenue: RevenueAnalysis,
  costs: CostStack,
  targetYOC: number,
  lotSizeSF: number
): LandResidual {
  // Stabilized Value = NOI / Cap Rate
  // But we work backwards: Total Cost = NOI / Target YOC
  // Land = Total Allowable Cost - Development Costs

  const totalAllowableCost = revenue.netOperatingIncome / targetYOC;
  const landValue = Math.max(0, totalAllowableCost - costs.totalDevelopmentCost);

  return {
    method: 'Yield on Cost',
    landValue,
    impliedLandPSF: landValue / lotSizeSF,
    supportedLandPSF: landValue / costs.totalHardCosts,
    metrics: {
      targetYOC,
      achievedYOC: revenue.netOperatingIncome / (costs.totalDevelopmentCost + landValue),
      totalAllowableCost,
      noi: revenue.netOperatingIncome,
    },
  };
}

/**
 * Land Residual via Development Profit Margin
 * Developer wants X% profit on total costs
 */
export function calculateLandResidualDevProfit(
  revenue: RevenueAnalysis,
  costs: CostStack,
  exitCapRate: number,
  targetProfitMargin: number,
  lotSizeSF: number
): LandResidual {
  // Stabilized Value = NOI / Exit Cap Rate
  const stabilizedValue = revenue.netOperatingIncome / exitCapRate;

  // Required Profit = Target Margin * Total Costs
  // Value = Total Costs + Profit
  // Value = Total Costs * (1 + Margin)
  // Total Costs = Value / (1 + Margin)

  const totalAllowableCost = stabilizedValue / (1 + targetProfitMargin);
  const landValue = Math.max(0, totalAllowableCost - costs.totalDevelopmentCost);

  const actualProfit = stabilizedValue - (costs.totalDevelopmentCost + landValue);
  const actualMargin = actualProfit / (costs.totalDevelopmentCost + landValue);

  return {
    method: 'Development Profit',
    landValue,
    impliedLandPSF: landValue / lotSizeSF,
    supportedLandPSF: landValue / costs.totalHardCosts,
    metrics: {
      stabilizedValue,
      targetProfitMargin,
      actualMargin,
      profit: actualProfit,
      exitCapRate,
    },
  };
}

/**
 * Land Residual via Condo Margin (For-Sale)
 * Revenue - Costs - Margin = Land
 */
export function calculateLandResidualCondo(
  unitMix: UnitMixWithRents,
  costs: CostStack,
  salePricePSF: number,
  brokerFeePercent: number,
  targetMargin: number,
  lotSizeSF: number
): LandResidual {
  // Gross Sales
  const grossSales = unitMix.totalSF * salePricePSF;

  // Less: Selling Costs
  const sellingCosts = grossSales * brokerFeePercent;
  const netSales = grossSales - sellingCosts;

  // Required profit
  const allowableCosts = netSales / (1 + targetMargin);
  const landValue = Math.max(0, allowableCosts - costs.totalDevelopmentCost);

  const actualProfit = netSales - (costs.totalDevelopmentCost + landValue);
  const actualMargin = actualProfit / (costs.totalDevelopmentCost + landValue);

  return {
    method: 'Condo Margin',
    landValue,
    impliedLandPSF: landValue / lotSizeSF,
    supportedLandPSF: landValue / costs.totalHardCosts,
    metrics: {
      grossSales,
      netSales,
      salePricePSF,
      targetMargin,
      actualMargin,
      profit: actualProfit,
    },
  };
}

/**
 * Land Residual via Simple Multiplier
 * Quick rule of thumb: Land = X months of gross rent
 */
export function calculateLandResidualMultiplier(
  revenue: RevenueAnalysis,
  multiplierMonths: number,
  lotSizeSF: number
): LandResidual {
  const monthlyGross = revenue.grossPotentialRent / 12;
  const landValue = monthlyGross * multiplierMonths;

  return {
    method: 'Rent Multiplier',
    landValue,
    impliedLandPSF: landValue / lotSizeSF,
    supportedLandPSF: 0,
    metrics: {
      multiplierMonths,
      monthlyGross,
    },
  };
}

// ============================================================================
// FULL FINANCIAL ANALYSIS
// ============================================================================

/**
 * Run complete financial analysis for a development scenario
 */
export function analyzeFinancials(
  potential: DevelopmentPotential,
  lotSizeSF: number,
  marketArea: MarketArea,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS
): FinancialAnalysis {
  // Generate unit mix
  const isTransitOriented = potential.parkingRequired === 0;
  const unitMix = generateUnitMixFromPotential(
    potential,
    assumptions.marketRentPSF,
    isTransitOriented
  );

  // Calculate revenue
  const revenue = calculateRevenue(unitMix, assumptions);

  // Calculate costs (without land initially)
  const costs = calculateCostStack(potential, unitMix, marketArea, assumptions, 0);

  // Calculate land residuals via multiple methods
  const residuals: LandResidual[] = [
    calculateLandResidualYOC(
      revenue,
      costs,
      assumptions.targetYieldOnCost,
      lotSizeSF
    ),
    calculateLandResidualDevProfit(
      revenue,
      costs,
      assumptions.exitCapRate,
      assumptions.targetDevProfitMargin,
      lotSizeSF
    ),
  ];

  // Add condo method if sale price provided
  if (assumptions.salePricePSF) {
    residuals.push(
      calculateLandResidualCondo(
        unitMix,
        costs,
        assumptions.salePricePSF,
        assumptions.brokerFeePercent || 0.05,
        assumptions.targetDevProfitMargin,
        lotSizeSF
      )
    );
  }

  // Use YOC as primary recommendation (most conservative for rental)
  const recommended = residuals[0];

  return {
    program: potential.program,
    potential,
    unitMix,
    revenue,
    costs,
    residuals,
    recommendedLandValue: recommended.landValue,
    recommendedMethod: recommended.method,
  };
}

/**
 * Run financial analysis for all programs and compare
 */
export function compareFinancials(
  potentials: DevelopmentPotential[],
  lotSizeSF: number,
  marketArea: MarketArea,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS
): FinancialAnalysis[] {
  return potentials
    .filter(p => p.eligible)
    .map(p => analyzeFinancials(p, lotSizeSF, marketArea, assumptions))
    .sort((a, b) => b.recommendedLandValue - a.recommendedLandValue);
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
