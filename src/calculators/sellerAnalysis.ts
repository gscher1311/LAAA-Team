/**
 * Seller Analysis Module
 *
 * Provides comprehensive analysis for land sellers including:
 * - Build & Hold scenarios (Yield on Cost analysis)
 * - Build & Sell scenarios (Development Margin analysis)
 * - Sensitivity tables across different assumptions
 * - Buyer type guidance (who would pay what)
 * - Pricing recommendations
 *
 * METHODOLOGY:
 *
 * BUILD & HOLD (Rental Investors):
 * - Target metric: Yield on Cost (NOI / Total Project Cost)
 * - Typical targets: 5.5% - 6.5% depending on risk tolerance
 * - Higher YOC = more conservative buyer, lower land price
 * - Lower YOC = aggressive buyer (institutional), higher land price
 *
 * BUILD & SELL (Condo Developers):
 * - Target metric: Development Margin (Profit / Total Cost)
 * - Typical targets: 15% - 25% depending on project risk
 * - Lower margin = more aggressive, higher land price
 * - Higher margin = more conservative, lower land price
 *
 * Sources:
 * - CBRE LA Multifamily Market Report Q4 2024
 * - JLL Development Cost Survey 2025
 * - RSMeans Construction Cost Data 2025
 */

import { MarketArea, DevelopmentPotential } from '../types';
import {
  FinancialAssumptions,
  RevenueAnalysis,
  CostStack,
  calculateRevenue,
  calculateCostStack,
  calculateLandResidualYOC,
  calculateLandResidualDevProfit,
  calculateLandResidualCondo,
  formatCurrency,
  formatPercent,
} from './financial';
import { UnitMixWithRents, generateUnitMixFromPotential } from './unitMix';
import {
  LASubmarket,
  getSubmarketRents,
  getRentPSF,
  getSubmarketCapRate,
  identifySubmarket,
} from '../data/submarketRents';

// ============================================================================
// REALISTIC LA MARKET ASSUMPTIONS (2025)
// ============================================================================

/**
 * Construction Cost Tiers
 * Based on RSMeans 2025, JLL Development Cost Survey, and LA market data
 *
 * These are HARD COSTS ONLY (excludes soft costs, financing, fees)
 */
export const CONSTRUCTION_COST_TIERS = {
  // Aggressive - experienced developer with good GC relationships
  aggressive: {
    label: 'Aggressive (Experienced Developer)',
    typeVA: 280,      // Wood frame, 4 stories
    typeIIIA: 320,    // 5-over-1 podium
    typeIB: 420,      // Mid-rise concrete
    typeIA: 520,      // High-rise
    softCostPercent: 0.22,  // 22% soft costs
    notes: 'For experienced developers with established GC relationships, value engineering',
  },
  standard: {
    label: 'Standard (Market Average)',
    typeVA: 320,
    typeIIIA: 365,
    typeIB: 475,
    typeIA: 575,
    softCostPercent: 0.28,
    notes: 'Market average for competent developers, typical LA conditions',
  },
  conservative: {
    label: 'Conservative (First-time/Complex)',
    typeVA: 360,
    typeIIIA: 410,
    typeIB: 530,
    typeIA: 630,
    softCostPercent: 0.32,
    notes: 'For complex sites, first-time developers, or challenging entitlements',
  },
};

/**
 * Exit Cap Rate Tiers by Submarket Quality
 * Based on CBRE Q4 2024, CoStar, and recent transactions
 *
 * NOTE: LA cap rates are typically 5.0% - 6.0% (never in the 4s for stabilized)
 */
export const EXIT_CAP_RATES = {
  premium: {
    label: 'Premium (Westside, Beach Cities)',
    capRate: 0.050,
    submarkets: ['SANTA_MONICA', 'VENICE', 'MAR_VISTA', 'CULVER_CITY', 'BEVERLY_HILLS', 'WEST_HOLLYWOOD'],
  },
  strong: {
    label: 'Strong (Mid-City, Hollywood)',
    capRate: 0.0525,
    submarkets: ['HOLLYWOOD', 'SILVER_LAKE', 'LOS_FELIZ', 'ECHO_PARK', 'KOREATOWN', 'MID_WILSHIRE'],
  },
  average: {
    label: 'Average (Valley, DTLA)',
    capRate: 0.055,
    submarkets: ['DOWNTOWN_LA', 'ARTS_DISTRICT', 'SHERMAN_OAKS', 'STUDIO_CITY', 'NORTH_HOLLYWOOD', 'BURBANK'],
  },
  value: {
    label: 'Value-Add (South LA, East LA)',
    capRate: 0.0575,
    submarkets: ['SOUTH_LA', 'INGLEWOOD', 'WATTS', 'COMPTON', 'EAST_LA', 'BOYLE_HEIGHTS'],
  },
  emerging: {
    label: 'Emerging (Higher Risk)',
    capRate: 0.060,
    submarkets: ['PALMDALE', 'LANCASTER', 'SAN_PEDRO', 'WILMINGTON'],
  },
};

/**
 * Yield on Cost Targets by Buyer Type
 * Source: CBRE Development Survey, industry interviews
 */
export const YOC_TARGETS = {
  institutional: {
    label: 'Institutional (REIT, Pension Fund)',
    yoc: 0.050,
    description: 'Large buyers with low cost of capital, willing to accept lower returns for quality assets',
  },
  privateEquity: {
    label: 'Private Equity',
    yoc: 0.055,
    description: 'PE funds seeking value-add opportunities with moderate risk',
  },
  regional: {
    label: 'Regional Developer',
    yoc: 0.060,
    description: 'Local/regional developers with good market knowledge, moderate risk tolerance',
  },
  opportunistic: {
    label: 'Opportunistic Buyer',
    yoc: 0.065,
    description: 'Higher return requirements, may seek distressed or turnaround opportunities',
  },
  value: {
    label: 'Value Buyer',
    yoc: 0.070,
    description: 'Conservative buyers requiring significant margin of safety',
  },
};

/**
 * Development Margin Targets by Project Type
 * Source: JLL Development Survey, NAHB Cost of Doing Business
 */
export const DEV_MARGIN_TARGETS = {
  lowRisk: {
    label: 'Low Risk (By-Right, Simple)',
    margin: 0.12,
    description: 'Simple by-right projects with minimal entitlement risk',
  },
  standard: {
    label: 'Standard (Typical Entitlement)',
    margin: 0.15,
    description: 'Standard projects with typical entitlement timeline',
  },
  moderate: {
    label: 'Moderate Risk',
    margin: 0.18,
    description: 'Projects with some complexity or entitlement uncertainty',
  },
  highRisk: {
    label: 'High Risk (Complex Entitlement)',
    margin: 0.22,
    description: 'Complex projects requiring discretionary approvals',
  },
  speculative: {
    label: 'Speculative',
    margin: 0.25,
    description: 'High-risk projects with significant execution risk',
  },
};

// ============================================================================
// USER OVERRIDE STRUCTURE
// ============================================================================

/**
 * User-configurable assumptions that can override defaults
 * Any field not provided uses the default
 */
export interface UserAssumptionOverrides {
  // Rents
  rentPSF?: number;                 // Override submarket rent
  vacancyRate?: number;             // Override vacancy (default 5%)
  operatingExpenseRatio?: number;   // Override OpEx (default 35%)

  // Construction Costs (Hard Costs Only)
  hardCostPSF?: number;             // Override hard cost per SF
  softCostPercent?: number;         // Override soft cost % (default 28%)
  parkingCostPerSpace?: number;     // Override parking cost

  // Return Targets
  targetYOC?: number;               // Override target YOC (default 5.5%)
  targetDevMargin?: number;         // Override target margin (default 15%)

  // Exit
  exitCapRate?: number;             // Override exit cap (default 5.5%)

  // For-Sale
  condoPricePSF?: number;           // Override condo sale price/SF

  // Financing
  constructionLoanRate?: number;    // Override loan rate (default 8%)
  constructionMonths?: number;      // Override duration (default 20)
}

// ============================================================================
// SCENARIO GENERATION
// ============================================================================

export interface ScenarioResult {
  label: string;
  assumption: number;
  landValue: number;
  landValuePSF: number;
  isViable: boolean;
  notes: string;
}

export interface BuildHoldScenarios {
  title: string;
  description: string;
  baseNOI: number;
  baseCosts: number;
  scenarios: ScenarioResult[];
  recommendation: string;
}

export interface BuildSellScenarios {
  title: string;
  description: string;
  baseValue: number;
  baseCosts: number;
  scenarios: ScenarioResult[];
  recommendation: string;
}

export interface CostScenarios {
  title: string;
  description: string;
  scenarios: ScenarioResult[];
  recommendation: string;
}

export interface SellerAnalysis {
  // Site info
  address: string;
  lotSizeSF: number;
  submarket: LASubmarket | null;

  // Program analyzed
  program: string;
  totalUnits: number;
  buildableSF: number;

  // Base assumptions used
  rentPSF: number;
  hardCostPSF: number;
  softCostPercent: number;
  exitCapRate: number;

  // Scenario analyses
  buildHold: BuildHoldScenarios;
  buildSell: BuildSellScenarios;
  costScenarios: CostScenarios;

  // Pricing guidance
  aggressivePrice: number;
  recommendedPrice: number;
  conservativePrice: number;

  // Buyer guidance
  buyerGuidance: string[];
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get submarket-adjusted assumptions
 * Uses submarket data as default, with user overrides taking precedence
 */
export function getAdjustedAssumptions(
  submarket: LASubmarket | null,
  potential: DevelopmentPotential,
  overrides: UserAssumptionOverrides = {}
): FinancialAssumptions {
  // Start with construction type base cost
  let baseHardCost = CONSTRUCTION_COST_TIERS.standard.typeVA;

  // Adjust for construction type
  const constructionMultiplier = potential.constructionCostMultiplier ?? 1.0;
  if (constructionMultiplier >= 1.4) {
    baseHardCost = CONSTRUCTION_COST_TIERS.standard.typeIB;
  } else if (constructionMultiplier >= 1.1) {
    baseHardCost = CONSTRUCTION_COST_TIERS.standard.typeIIIA;
  }

  // Get submarket data if available
  let rentPSF = 4.25;  // Default
  let vacancyRate = 0.05;
  let exitCapRate = 0.055;

  if (submarket) {
    const submarketData = getSubmarketRents(submarket);
    const nearTransit = potential.parkingRequired === 0;
    rentPSF = getRentPSF(submarket, nearTransit);
    vacancyRate = submarketData.vacancyRate;
    exitCapRate = getSubmarketCapRate(submarket);

    // Ensure exit cap is never below 5%
    exitCapRate = Math.max(exitCapRate, 0.05);
  }

  return {
    // Revenue - use submarket or override
    marketRentPSF: overrides.rentPSF ?? rentPSF,
    vacancyRate: overrides.vacancyRate ?? vacancyRate,
    operatingExpenseRatio: overrides.operatingExpenseRatio ?? 0.35,

    // Construction - use override or construction-type-adjusted cost
    hardCostPSF: overrides.hardCostPSF ?? baseHardCost,
    parkingCostPerSpace: overrides.parkingCostPerSpace ?? 45000,

    // Soft costs
    softCostPercent: overrides.softCostPercent ?? CONSTRUCTION_COST_TIERS.standard.softCostPercent,

    // Financing
    constructionLoanRate: overrides.constructionLoanRate ?? 0.08,
    constructionMonths: overrides.constructionMonths ?? 20,
    loanToValue: 0.65,

    // Return targets
    targetYieldOnCost: overrides.targetYOC ?? 0.055,
    targetDevProfitMargin: overrides.targetDevMargin ?? 0.15,
    targetUnleveredIRR: 0.12,

    // Exit - never below 5%
    exitCapRate: Math.max(overrides.exitCapRate ?? exitCapRate, 0.05),

    // For-sale
    salePricePSF: overrides.condoPricePSF ?? 850,
    brokerFeePercent: 0.05,

    // Submarket tracking
    submarket: submarket ?? undefined,
    useSubmarketData: submarket !== null,
  };
}

/**
 * Generate Build & Hold scenarios (YOC analysis)
 */
export function generateBuildHoldScenarios(
  revenue: RevenueAnalysis,
  costs: CostStack,
  lotSizeSF: number
): BuildHoldScenarios {
  const scenarios: ScenarioResult[] = [];

  // Generate scenarios for each YOC target
  for (const [key, target] of Object.entries(YOC_TARGETS)) {
    const residual = calculateLandResidualYOC(revenue, costs, target.yoc, lotSizeSF);

    scenarios.push({
      label: target.label,
      assumption: target.yoc,
      landValue: residual.landValue,
      landValuePSF: residual.impliedLandPSF,
      isViable: residual.landValue > 0,
      notes: target.description,
    });
  }

  // Find best viable scenario
  const viableScenarios = scenarios.filter(s => s.isViable);
  const bestViable = viableScenarios.length > 0
    ? viableScenarios.reduce((a, b) => a.landValue > b.landValue ? a : b)
    : null;

  return {
    title: 'BUILD & HOLD ANALYSIS (Rental Development)',
    description: 'Land values based on Yield on Cost (NOI / Total Project Cost). Higher YOC targets = more conservative buyers, lower land values.',
    baseNOI: revenue.netOperatingIncome,
    baseCosts: costs.totalDevelopmentCost,
    scenarios,
    recommendation: bestViable
      ? `Most likely buyer: ${bestViable.label} at ${formatCurrency(bestViable.landValue)} (${formatPercent(bestViable.assumption)} YOC)`
      : 'Project does not pencil for rental development at current assumptions',
  };
}

/**
 * Generate Build & Sell scenarios (Development Margin analysis)
 */
export function generateBuildSellScenarios(
  revenue: RevenueAnalysis,
  costs: CostStack,
  exitCapRate: number,
  lotSizeSF: number
): BuildSellScenarios {
  const scenarios: ScenarioResult[] = [];

  // Calculate stabilized value
  const stabilizedValue = revenue.netOperatingIncome / exitCapRate;

  // Generate scenarios for each margin target
  for (const [key, target] of Object.entries(DEV_MARGIN_TARGETS)) {
    const residual = calculateLandResidualDevProfit(
      revenue,
      costs,
      exitCapRate,
      target.margin,
      lotSizeSF
    );

    scenarios.push({
      label: target.label,
      assumption: target.margin,
      landValue: residual.landValue,
      landValuePSF: residual.impliedLandPSF,
      isViable: residual.landValue > 0,
      notes: target.description,
    });
  }

  // Find best viable scenario
  const viableScenarios = scenarios.filter(s => s.isViable);
  const bestViable = viableScenarios.length > 0
    ? viableScenarios.reduce((a, b) => a.landValue > b.landValue ? a : b)
    : null;

  return {
    title: 'BUILD & SELL ANALYSIS (Development for Sale)',
    description: 'Land values based on Developer Margin (Profit / Total Cost). Lower margin = more aggressive buyers, higher land values.',
    baseValue: stabilizedValue,
    baseCosts: costs.totalDevelopmentCost,
    scenarios,
    recommendation: bestViable
      ? `Most likely buyer: ${bestViable.label} at ${formatCurrency(bestViable.landValue)} (${formatPercent(bestViable.assumption)} margin)`
      : 'Project does not pencil for development sale at current assumptions',
  };
}

/**
 * Generate cost scenarios (different construction cost assumptions)
 */
export function generateCostScenarios(
  potential: DevelopmentPotential,
  unitMix: UnitMixWithRents,
  revenue: RevenueAnalysis,
  marketArea: MarketArea,
  assumptions: FinancialAssumptions,
  lotSizeSF: number
): CostScenarios {
  const scenarios: ScenarioResult[] = [];

  for (const [key, tier] of Object.entries(CONSTRUCTION_COST_TIERS)) {
    // Get the appropriate base cost for construction type
    let baseCost = tier.typeVA;
    const multiplier = potential.constructionCostMultiplier ?? 1.0;
    if (multiplier >= 1.4) {
      baseCost = tier.typeIB;
    } else if (multiplier >= 1.1) {
      baseCost = tier.typeIIIA;
    }

    // Recalculate costs with this tier
    const tierAssumptions = {
      ...assumptions,
      hardCostPSF: baseCost,
      softCostPercent: tier.softCostPercent,
    };

    const tierCosts = calculateCostStack(potential, unitMix, marketArea, tierAssumptions, 0, lotSizeSF);
    const residual = calculateLandResidualYOC(revenue, tierCosts, assumptions.targetYieldOnCost, lotSizeSF);

    scenarios.push({
      label: tier.label,
      assumption: baseCost,
      landValue: residual.landValue,
      landValuePSF: residual.impliedLandPSF,
      isViable: residual.landValue > 0,
      notes: tier.notes,
    });
  }

  return {
    title: 'COST SCENARIO ANALYSIS',
    description: 'Land values under different construction cost assumptions. Aggressive costs = experienced developer; Conservative = complex/first-time.',
    scenarios,
    recommendation: scenarios.filter(s => s.isViable).length > 0
      ? `Land values range from ${formatCurrency(Math.min(...scenarios.filter(s => s.isViable).map(s => s.landValue)))} to ${formatCurrency(Math.max(...scenarios.filter(s => s.isViable).map(s => s.landValue)))}`
      : 'Project requires lower costs or higher rents to be viable',
  };
}

/**
 * Run full seller analysis
 */
export function analyzeForSeller(
  address: string,
  potential: DevelopmentPotential,
  lotSizeSF: number,
  marketArea: MarketArea,
  overrides: UserAssumptionOverrides = {}
): SellerAnalysis {
  // Identify submarket from address
  const submarket = identifySubmarket(address);

  // Get adjusted assumptions
  const assumptions = getAdjustedAssumptions(submarket, potential, overrides);

  // Generate unit mix
  const isTransitOriented = potential.parkingRequired === 0;
  const unitMix = generateUnitMixFromPotential(potential, assumptions.marketRentPSF, isTransitOriented);

  // Calculate revenue
  const revenue = calculateRevenue(unitMix, assumptions);

  // Calculate costs
  const costs = calculateCostStack(potential, unitMix, marketArea, assumptions, 0, lotSizeSF);

  // Generate all scenarios
  const buildHold = generateBuildHoldScenarios(revenue, costs, lotSizeSF);
  const buildSell = generateBuildSellScenarios(revenue, costs, assumptions.exitCapRate, lotSizeSF);
  const costScenarios = generateCostScenarios(potential, unitMix, revenue, marketArea, assumptions, lotSizeSF);

  // Calculate pricing guidance
  const viableHold = buildHold.scenarios.filter(s => s.isViable);
  const viableSell = buildSell.scenarios.filter(s => s.isViable);
  const allViable = [...viableHold, ...viableSell];

  let aggressivePrice = 0;
  let recommendedPrice = 0;
  let conservativePrice = 0;

  if (allViable.length > 0) {
    const values = allViable.map(s => s.landValue).sort((a, b) => b - a);
    aggressivePrice = values[0];  // Highest
    conservativePrice = values[values.length - 1];  // Lowest
    recommendedPrice = values[Math.floor(values.length / 2)];  // Median
  }

  // Generate buyer guidance
  const buyerGuidance: string[] = [];

  if (viableHold.length > 0) {
    const bestHold = viableHold.reduce((a, b) => a.landValue > b.landValue ? a : b);
    buyerGuidance.push(`BUILD & HOLD: ${bestHold.label} most likely at ${formatCurrency(bestHold.landValue)} (${formatPercent(bestHold.assumption)} YOC)`);
  }

  if (viableSell.length > 0) {
    const bestSell = viableSell.reduce((a, b) => a.landValue > b.landValue ? a : b);
    buyerGuidance.push(`BUILD & SELL: ${bestSell.label} most likely at ${formatCurrency(bestSell.landValue)} (${formatPercent(bestSell.assumption)} margin)`);
  }

  if (aggressivePrice > 0) {
    buyerGuidance.push(`AGGRESSIVE LIST: ${formatCurrency(aggressivePrice)} - for motivated institutional buyer or condo developer`);
    buyerGuidance.push(`RECOMMENDED LIST: ${formatCurrency(recommendedPrice)} - balanced price attracting multiple buyer types`);
    buyerGuidance.push(`CONSERVATIVE LIST: ${formatCurrency(conservativePrice)} - quick sale to value-oriented buyer`);
  }

  return {
    address,
    lotSizeSF,
    submarket,
    program: potential.program,
    totalUnits: potential.totalUnits,
    buildableSF: potential.buildableSF,
    rentPSF: assumptions.marketRentPSF,
    hardCostPSF: assumptions.hardCostPSF,
    softCostPercent: assumptions.softCostPercent,
    exitCapRate: assumptions.exitCapRate,
    buildHold,
    buildSell,
    costScenarios,
    aggressivePrice,
    recommendedPrice,
    conservativePrice,
    buyerGuidance,
  };
}

// ============================================================================
// FORMATTED OUTPUT
// ============================================================================

function padRight(str: string, len: number): string {
  return str.padEnd(len);
}

function padLeft(str: string, len: number): string {
  return str.padStart(len);
}

/**
 * Format seller analysis for display
 */
export function formatSellerAnalysis(analysis: SellerAnalysis): string {
  const lines: string[] = [];
  const width = 90;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('SELLER LAND RESIDUAL ANALYSIS');
  lines.push('═'.repeat(width));
  lines.push('');

  // Site summary
  lines.push('SITE SUMMARY');
  lines.push('─'.repeat(width));
  lines.push(`Address:        ${analysis.address}`);
  lines.push(`Lot Size:       ${analysis.lotSizeSF.toLocaleString()} SF`);
  lines.push(`Submarket:      ${analysis.submarket || 'Not identified'}`);
  lines.push(`Program:        ${analysis.program}`);
  lines.push(`Units:          ${analysis.totalUnits}`);
  lines.push(`Buildable SF:   ${analysis.buildableSF.toLocaleString()} SF`);
  lines.push('');

  // Key assumptions
  lines.push('KEY ASSUMPTIONS (User can override)');
  lines.push('─'.repeat(width));
  lines.push(`Rent:           $${analysis.rentPSF.toFixed(2)}/SF/month${analysis.submarket ? ' (submarket default)' : ''}`);
  lines.push(`Hard Cost:      $${analysis.hardCostPSF}/SF`);
  lines.push(`Soft Costs:     ${(analysis.softCostPercent * 100).toFixed(0)}% of hard costs`);
  lines.push(`Exit Cap:       ${(analysis.exitCapRate * 100).toFixed(2)}%`);
  lines.push('');

  // Build & Hold Table
  lines.push('═'.repeat(width));
  lines.push(analysis.buildHold.title);
  lines.push('═'.repeat(width));
  lines.push(analysis.buildHold.description);
  lines.push('');
  lines.push(`Base NOI:       ${formatCurrency(analysis.buildHold.baseNOI)}/year`);
  lines.push(`Dev Costs:      ${formatCurrency(analysis.buildHold.baseCosts)}`);
  lines.push('');

  // Table header
  lines.push(padRight('Buyer Type', 35) + padLeft('YOC Target', 12) + padLeft('Land Value', 15) + padLeft('$/SF Lot', 12) + padLeft('Viable?', 10));
  lines.push('─'.repeat(width));

  for (const scenario of analysis.buildHold.scenarios) {
    const viable = scenario.isViable ? '✓' : '✗';
    lines.push(
      padRight(scenario.label, 35) +
      padLeft(formatPercent(scenario.assumption), 12) +
      padLeft(formatCurrency(scenario.landValue), 15) +
      padLeft(`$${scenario.landValuePSF.toFixed(0)}`, 12) +
      padLeft(viable, 10)
    );
  }
  lines.push('');
  lines.push(`→ ${analysis.buildHold.recommendation}`);
  lines.push('');

  // Build & Sell Table
  lines.push('═'.repeat(width));
  lines.push(analysis.buildSell.title);
  lines.push('═'.repeat(width));
  lines.push(analysis.buildSell.description);
  lines.push('');
  lines.push(`Stabilized Value: ${formatCurrency(analysis.buildSell.baseValue)} (at ${formatPercent(analysis.exitCapRate)} cap)`);
  lines.push(`Dev Costs:        ${formatCurrency(analysis.buildSell.baseCosts)}`);
  lines.push('');

  // Table header
  lines.push(padRight('Risk Profile', 35) + padLeft('Margin', 12) + padLeft('Land Value', 15) + padLeft('$/SF Lot', 12) + padLeft('Viable?', 10));
  lines.push('─'.repeat(width));

  for (const scenario of analysis.buildSell.scenarios) {
    const viable = scenario.isViable ? '✓' : '✗';
    lines.push(
      padRight(scenario.label, 35) +
      padLeft(formatPercent(scenario.assumption), 12) +
      padLeft(formatCurrency(scenario.landValue), 15) +
      padLeft(`$${scenario.landValuePSF.toFixed(0)}`, 12) +
      padLeft(viable, 10)
    );
  }
  lines.push('');
  lines.push(`→ ${analysis.buildSell.recommendation}`);
  lines.push('');

  // Cost Scenarios Table
  lines.push('═'.repeat(width));
  lines.push(analysis.costScenarios.title);
  lines.push('═'.repeat(width));
  lines.push(analysis.costScenarios.description);
  lines.push('');

  // Table header
  lines.push(padRight('Cost Scenario', 35) + padLeft('Hard $/SF', 12) + padLeft('Land Value', 15) + padLeft('$/SF Lot', 12) + padLeft('Viable?', 10));
  lines.push('─'.repeat(width));

  for (const scenario of analysis.costScenarios.scenarios) {
    const viable = scenario.isViable ? '✓' : '✗';
    lines.push(
      padRight(scenario.label, 35) +
      padLeft(`$${scenario.assumption}`, 12) +
      padLeft(formatCurrency(scenario.landValue), 15) +
      padLeft(`$${scenario.landValuePSF.toFixed(0)}`, 12) +
      padLeft(viable, 10)
    );
  }
  lines.push('');
  lines.push(`→ ${analysis.costScenarios.recommendation}`);
  lines.push('');

  // Pricing Guidance
  lines.push('═'.repeat(width));
  lines.push('PRICING GUIDANCE FOR SELLER');
  lines.push('═'.repeat(width));
  lines.push('');

  if (analysis.aggressivePrice > 0) {
    lines.push(`AGGRESSIVE:    ${formatCurrency(analysis.aggressivePrice).padEnd(15)} ($${(analysis.aggressivePrice / analysis.lotSizeSF).toFixed(0)}/SF lot)`);
    lines.push('               For institutional buyers or aggressive condo developers');
    lines.push('');
    lines.push(`RECOMMENDED:   ${formatCurrency(analysis.recommendedPrice).padEnd(15)} ($${(analysis.recommendedPrice / analysis.lotSizeSF).toFixed(0)}/SF lot)`);
    lines.push('               Balanced price attracting multiple buyer types');
    lines.push('');
    lines.push(`CONSERVATIVE:  ${formatCurrency(analysis.conservativePrice).padEnd(15)} ($${(analysis.conservativePrice / analysis.lotSizeSF).toFixed(0)}/SF lot)`);
    lines.push('               Quick sale to value-oriented buyers');
  } else {
    lines.push('⚠ Project does not generate positive land value at current assumptions.');
    lines.push('  Consider:');
    lines.push('  • Higher rent assumptions (premium finishes, amenities)');
    lines.push('  • Lower cost assumptions (experienced developer relationships)');
    lines.push('  • Different incentive program (more units/FAR)');
  }
  lines.push('');

  // Buyer Guidance
  lines.push('BUYER TYPE GUIDANCE');
  lines.push('─'.repeat(width));
  for (const guidance of analysis.buyerGuidance) {
    lines.push(`• ${guidance}`);
  }
  lines.push('');

  lines.push('═'.repeat(width));
  lines.push('');

  return lines.join('\n');
}
