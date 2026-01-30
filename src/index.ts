/**
 * Land Residual Analysis App
 * Main entry point
 */

// Export types
export * from './types';

// Export data
export * from './data';

// Export calculators
export * from './calculators';

// Imports for demo
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
  generateComparisonTable,
  generateSummary,
  generateDetailedAnalysis,
} from './calculators/output';

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export interface AnalysisResult {
  site: SiteInput;
  analyses: FinancialAnalysis[];
  bestProgram: FinancialAnalysis;
  comparisonTable: string;
  summary: string;
}

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
 * Run detailed analysis for a specific program
 */
export function runDetailedAnalysis(
  site: SiteInput,
  programIndex: number = 0,
  incomeLevel: IncomeLevel = IncomeLevel.VLI,
  assumptions: FinancialAssumptions = LA_DEFAULT_ASSUMPTIONS
): void {
  const result = runAnalysis(site, incomeLevel, assumptions, false);

  if (programIndex >= result.analyses.length) {
    console.error(`Invalid program index. Max: ${result.analyses.length - 1}`);
    return;
  }

  const detailed = generateDetailedAnalysis(result.analyses[programIndex]);
  console.log(detailed);
}

// ============================================================================
// DEMO
// ============================================================================

if (require.main === module) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         LAND RESIDUAL ANALYSIS APP - DEMO                    ║');
  console.log('║         LA Real Estate Development Tool                      ║');
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

  // Run analysis
  const result = runAnalysis(sampleSite, IncomeLevel.VLI);

  // Show detailed analysis for best program
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         DETAILED ANALYSIS - BEST PROGRAM                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const detailed = generateDetailedAnalysis(result.bestProgram);
  console.log(detailed);

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
}
