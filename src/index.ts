/**
 * Land Residual Analysis App
 * Main entry point with full LIHTC and subsidy integration
 */

// Export types
export * from './types';

// Export data
export * from './data';

// Export calculators
export * from './calculators';

// Export config
export * from './config';

// Imports for analysis
import {
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  IncomeLevel,
} from './types';

import { checkAllProgramEligibility } from './calculators/eligibility';
import { calculateAllProgramPotential } from './calculators/developmentPotential';
import {
  compareFinancials,
  LA_DEFAULT_ASSUMPTIONS,
  FinancialAssumptions,
  FinancialAnalysis,
} from './calculators/financial';
import {
  calculateLIHTC,
  calculateGapFinancing,
  calculateSubsidizedLandResidual,
  LIHTCCalculation,
  GapFinancing,
} from './calculators/taxCredits';
import {
  generateComparisonTable,
  generateSummary,
  generateDetailedAnalysis,
  generateLIHTCOutput,
  generateGapFinancingOutput,
  generateFullAnalysisWithSubsidies,
  generateComparisonTableWithSubsidies,
  generateZoningBreakdown,
  generateZoningReasoning,
} from './calculators/output';
import {
  MarketAssumptions,
  toFinancialAssumptions,
  printAssumptionsSummary,
} from './config/assumptions';
import {
  ParcelInput,
  AssembledSite,
  AssemblyAnalysisMode,
  assembleParcels,
  createSingleSite,
  validateAssemblage,
  formatAssemblageSummary,
  formatParcelInputGuide,
} from './data/parcelAssembly';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisResult {
  site: SiteInput;
  analyses: FinancialAnalysis[];
  bestProgram: FinancialAnalysis;
  comparisonTable: string;
  summary: string;
}

export interface FullAnalysisResult extends AnalysisResult {
  withSubsidies: Array<{
    analysis: FinancialAnalysis;
    lihtc: LIHTCCalculation;
    gap: GapFinancing;
    subsidizedLandValue: number;
  }>;
  subsidyComparisonTable: string;
  zoningBreakdown: string;
  zoningReasoning: string;
}

export interface AnalysisOptions {
  includeSubsidies: boolean;
  includeLIHTC: boolean;
  detailedOutput: boolean;
  showZoningBreakdown?: boolean;  // Show zoning analysis with sources (default: true)
  inDDAorQCT: boolean;  // DDA/QCT for LIHTC basis boost
}

/**
 * Multi-parcel analysis result
 */
export interface MultiParcelAnalysisResult extends FullAnalysisResult {
  assembledSite: AssembledSite;
  assemblySummary: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Run complete land residual analysis for a site
 */
export function runAnalysis(
  site: SiteInput,
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS,
  verbose: boolean = true
): AnalysisResult {
  // Step 1: Check eligibility and calculate development potential
  const eligibility = checkAllProgramEligibility(site);
  const potentials = calculateAllProgramPotential(site, incomeLevel);

  // Step 2: Run financial analysis for all eligible programs
  const analyses = compareFinancials(
    potentials,
    site.lotSizeSF,
    site.marketArea,
    assumptions
  );

  // Step 3: Generate formatted output
  const comparisonTable = generateComparisonTable(analyses);
  const summary = generateSummary(site, analyses);

  // Step 4: Output results
  if (verbose) {
    console.log(summary);
    console.log(comparisonTable);
  }

  return {
    site,
    analyses,
    bestProgram: analyses[0],  // Already sorted by land value
    comparisonTable,
    summary,
  };
}

/**
 * Run complete analysis with LIHTC and subsidies
 */
export function runFullAnalysis(
  site: SiteInput,
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS,
  options: AnalysisOptions = {
    includeSubsidies: true,
    includeLIHTC: true,
    detailedOutput: false,
    showZoningBreakdown: true,
    inDDAorQCT: true,
  },
  verbose: boolean = true
): FullAnalysisResult {
  // Run base analysis
  const baseResult = runAnalysis(site, incomeLevel, assumptions, false);

  // Add LIHTC and subsidy analysis for each program
  const withSubsidies = baseResult.analyses.map(analysis => {
    // Calculate LIHTC
    const lihtc = options.includeLIHTC
      ? calculateLIHTC(
          analysis.costs,
          analysis.potential.affordablePercent,
          analysis.potential.incomeLevel,
          analysis.unitMix.totalUnits,
          options.inDDAorQCT
        )
      : {
          type: 'none' as const,
          eligibleBasis: 0,
          applicableFraction: 0,
          qualifiedBasis: 0,
          annualCredit: 0,
          totalCredits: 0,
          equityFromCredits: 0,
          effectiveSubsidy: 0,
          metrics: { creditRate: 0, equityPricing: 0, basisBoost: false },
        };

    // Calculate gap financing
    const gap = options.includeSubsidies
      ? calculateGapFinancing(
          analysis.costs,
          analysis.revenue,
          lihtc,
          analysis.potential.affordablePercent,
          analysis.unitMix.totalUnits,
          true
        )
      : {
          totalDevelopmentCost: analysis.costs.totalDevelopmentCost,
          permanentDebt: 0,
          taxCreditEquity: 0,
          deferredDeveloperFee: 0,
          otherSubsidies: [],
          totalSources: 0,
          fundingGap: analysis.costs.totalDevelopmentCost,
          gapAsPercentOfCost: 1,
          isFeasible: false,
        };

    // Calculate subsidized land residual
    const subsidizedResidual = calculateSubsidizedLandResidual(
      analysis.costs,
      lihtc,
      gap
    );

    return {
      analysis,
      lihtc,
      gap,
      subsidizedLandValue: subsidizedResidual.landValue,
    };
  });

  // Generate subsidy comparison table
  const subsidyComparisonTable = generateComparisonTableWithSubsidies(withSubsidies);

  // Generate zoning breakdown with sources
  const zoningBreakdown = generateZoningBreakdown(site, baseResult.analyses);
  const zoningReasoning = generateZoningReasoning(site, baseResult.analyses);

  // Output
  if (verbose) {
    // Show zoning breakdown first (Brickwork-style)
    if (options.showZoningBreakdown) {
      console.log(zoningBreakdown);
      console.log(zoningReasoning);
    }

    console.log(baseResult.summary);
    console.log(subsidyComparisonTable);

    if (options.detailedOutput && withSubsidies.length > 0) {
      const best = withSubsidies[0];
      console.log(generateFullAnalysisWithSubsidies(
        best.analysis,
        best.lihtc,
        best.gap,
        best.subsidizedLandValue
      ));
    }
  }

  return {
    ...baseResult,
    withSubsidies,
    subsidyComparisonTable,
    zoningBreakdown,
    zoningReasoning,
  };
}

/**
 * Run detailed analysis for a specific program with subsidies
 */
export function runDetailedAnalysis(
  site: SiteInput,
  programIndex: number = 0,
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS,
  includeSubsidies: boolean = true
): void {
  const result = runFullAnalysis(site, incomeLevel, assumptions, {
    includeSubsidies,
    includeLIHTC: true,
    detailedOutput: false,
    inDDAorQCT: true,
  }, false);

  if (programIndex >= result.withSubsidies.length) {
    console.error(`Invalid program index. Max: ${result.withSubsidies.length - 1}`);
    return;
  }

  const program = result.withSubsidies[programIndex];
  const output = generateFullAnalysisWithSubsidies(
    program.analysis,
    program.lihtc,
    program.gap,
    program.subsidizedLandValue
  );
  console.log(output);
}

// ============================================================================
// MULTI-PARCEL ANALYSIS
// ============================================================================

/**
 * Run analysis for a multi-parcel assemblage
 *
 * @param parcels - Array of 2-10 parcels to combine
 * @param sharedInputs - Inputs that apply to the entire assemblage
 * @param mode - How to combine zones (UNIFIED, PRO_RATA, or SEPARATE)
 * @param incomeLevel - Target income level for affordability
 * @param assumptions - Financial assumptions
 * @param options - Analysis options
 * @param verbose - Whether to print output
 */
export function runMultiParcelAnalysis(
  parcels: ParcelInput[],
  sharedInputs: {
    address: string;
    distanceToMajorTransitFeet?: number;
    distanceToMetroRailFeet?: number;
    distanceToMetrolinkFeet?: number;
    distanceToBusRouteFeet?: number;
    inVeryLowVehicleTravelArea?: boolean;
    tcacArea: TCACOpportunityArea;
    marketArea: MarketArea;
    inVHFHSZ?: boolean;
    inCoastalZone?: boolean;
    inSeaLevelRiseArea?: boolean;
    adjacentToR1R2?: boolean;
  },
  mode: AssemblyAnalysisMode = AssemblyAnalysisMode.UNIFIED,
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS,
  options: AnalysisOptions = {
    includeSubsidies: true,
    includeLIHTC: true,
    detailedOutput: false,
    showZoningBreakdown: true,
    inDDAorQCT: true,
  },
  verbose: boolean = true
): MultiParcelAnalysisResult {
  // Validate the assemblage
  const validation = validateAssemblage(parcels);
  if (!validation.valid) {
    throw new Error(`Invalid assemblage: ${validation.errors.join(', ')}`);
  }

  // Assemble the parcels
  const assembledSite = assembleParcels(parcels, sharedInputs, mode);
  const assemblySummary = formatAssemblageSummary(assembledSite);

  // Run analysis on the combined site
  const result = runFullAnalysis(
    assembledSite.asSiteInput,
    incomeLevel,
    assumptions,
    options,
    false  // Don't print yet
  );

  // Output
  if (verbose) {
    // Show assemblage summary first
    console.log(assemblySummary);

    // Show any warnings
    if (validation.warnings.length > 0) {
      console.log('\nWARNINGS:');
      for (const warning of validation.warnings) {
        console.log(`  ⚠️ ${warning}`);
      }
      console.log('');
    }

    // Show zoning breakdown
    if (options.showZoningBreakdown) {
      console.log(result.zoningBreakdown);
      console.log(result.zoningReasoning);
    }

    // Show analysis results
    console.log(result.summary);
    console.log(result.subsidyComparisonTable);

    if (options.detailedOutput && result.withSubsidies.length > 0) {
      const best = result.withSubsidies[0];
      console.log(generateFullAnalysisWithSubsidies(
        best.analysis,
        best.lihtc,
        best.gap,
        best.subsidizedLandValue
      ));
    }
  }

  return {
    ...result,
    assembledSite,
    assemblySummary,
  };
}

/**
 * Quick helper: Run single parcel analysis with the same API
 * (for consistency when switching between single and multi-parcel)
 */
export function runSingleParcelAnalysis(
  parcel: ParcelInput,
  sharedInputs: {
    address: string;
    distanceToMajorTransitFeet?: number;
    distanceToMetroRailFeet?: number;
    distanceToMetrolinkFeet?: number;
    distanceToBusRouteFeet?: number;
    inVeryLowVehicleTravelArea?: boolean;
    tcacArea: TCACOpportunityArea;
    marketArea: MarketArea;
    inVHFHSZ?: boolean;
    inCoastalZone?: boolean;
    inSeaLevelRiseArea?: boolean;
    adjacentToR1R2?: boolean;
  },
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS,
  options: AnalysisOptions = {
    includeSubsidies: true,
    includeLIHTC: true,
    detailedOutput: false,
    showZoningBreakdown: true,
    inDDAorQCT: true,
  },
  verbose: boolean = true
): FullAnalysisResult {
  const singleSite = createSingleSite(parcel, sharedInputs);

  return runFullAnalysis(
    singleSite.asSiteInput,
    incomeLevel,
    assumptions,
    options,
    verbose
  );
}

// Re-export multi-parcel types and functions for convenience
export {
  ParcelInput,
  AssembledSite,
  AssemblyAnalysisMode,
  assembleParcels,
  createSingleSite,
  validateAssemblage,
  formatAssemblageSummary,
  formatParcelInputGuide,
};

// ============================================================================
// DEMO
// ============================================================================

if (require.main === module) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         LAND RESIDUAL ANALYSIS APP - PRODUCTION DEMO         ║');
  console.log('║         LA Real Estate Development Tool                      ║');
  console.log('║         With LIHTC Tax Credits & Gap Financing               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Sample site: 15,000 SF R3 lot near Metro Rail
  const sampleSite: SiteInput = {
    address: '1234 Wilshire Blvd, Los Angeles, CA 90017',
    lotSizeSF: 15000,
    baseZone: ZoneType.R3,
    heightDistrict: HeightDistrict.HD_1L,
    distanceToMajorTransitFeet: 1200,  // Within 1/4 mile of Metro
    distanceToMetroRailFeet: 1200,
    tcacArea: TCACOpportunityArea.MODERATE,
    marketArea: MarketArea.HIGH,
    inVHFHSZ: false,
    inCoastalZone: false,
  };

  // Run full analysis with subsidies
  const result = runFullAnalysis(
    sampleSite,
    IncomeLevel.VLI,
    LA_DEFAULT_ASSUMPTIONS,
    {
      includeSubsidies: true,
      includeLIHTC: true,
      detailedOutput: false,
      inDDAorQCT: true,
    },
    true
  );

  // Show detailed analysis for best program
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         DETAILED ANALYSIS - BEST PROGRAM WITH SUBSIDIES      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (result.withSubsidies.length > 0) {
    const best = result.withSubsidies[0];
    console.log(generateFullAnalysisWithSubsidies(
      best.analysis,
      best.lihtc,
      best.gap,
      best.subsidizedLandValue
    ));
  }

  // Assumptions used
  console.log('\n');
  console.log('ASSUMPTIONS USED:');
  console.log('─'.repeat(50));
  console.log(`Market Rent:        $${LA_DEFAULT_ASSUMPTIONS.marketRentPSF}/SF/mo`);
  console.log(`Hard Cost:          $${LA_DEFAULT_ASSUMPTIONS.hardCostPSF}/SF`);
  console.log(`Soft Cost:          ${(LA_DEFAULT_ASSUMPTIONS.softCostPercent * 100).toFixed(0)}% of hard`);
  console.log(`Target YOC:         ${(LA_DEFAULT_ASSUMPTIONS.targetYieldOnCost * 100).toFixed(1)}%`);
  console.log(`Exit Cap Rate:      ${(LA_DEFAULT_ASSUMPTIONS.exitCapRate * 100).toFixed(1)}%`);
  console.log(`Dev Profit Target:  ${(LA_DEFAULT_ASSUMPTIONS.targetDevProfitMargin * 100).toFixed(0)}%`);
  console.log('');
  console.log('LIHTC ASSUMPTIONS:');
  console.log('─'.repeat(50));
  console.log('9% Credit Rate:     9.0%');
  console.log('4% Credit Rate:     4.0%');
  console.log('9% Equity Pricing:  $0.94 per $1 credit');
  console.log('4% Equity Pricing:  $0.90 per $1 credit');
  console.log('DDA/QCT Boost:      +30% basis');
  console.log('');
}
