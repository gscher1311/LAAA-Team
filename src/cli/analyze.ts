#!/usr/bin/env node
/**
 * Interactive CLI for Land Residual Analysis
 * Production-ready command line interface
 */

import {
  collectSiteInput,
  selectSubmarket,
  selectIncomeLevel,
  selectAnalysisOptions,
  parseQuickInput,
  printUsage,
  closeInterface,
} from './index';

import {
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  IncomeLevel,
} from '../types';

import { runFullAnalysis } from '../index';
import { toFinancialAssumptions, printAssumptionsSummary } from '../config/assumptions';
import { generateFullAnalysisWithSubsidies } from '../calculators/output';

// ============================================================================
// MAIN CLI
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       LAND RESIDUAL ANALYSIS APP - LA DEVELOPMENT TOOL       ║');
  console.log('║       With LIHTC Tax Credits & Gap Financing                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Check for quick mode arguments
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-?')) {
    printUsage();
    process.exit(0);
  }

  let site: SiteInput;
  let marketAssumptions;
  let incomeLevel: IncomeLevel;
  let analysisOptions;

  // Quick mode or interactive mode
  const quickInput = parseQuickInput(args);

  if (quickInput) {
    // Quick mode - use defaults for missing values
    console.log('\n--- Quick Analysis Mode ---\n');

    site = {
      address: quickInput.address || 'Quick Analysis Site',
      lotSizeSF: quickInput.lotSizeSF || 10000,
      baseZone: quickInput.baseZone || ZoneType.R3,
      heightDistrict: quickInput.heightDistrict || HeightDistrict.HD_1L,
      distanceToMajorTransitFeet: quickInput.distanceToMajorTransitFeet || 2000,
      distanceToMetroRailFeet: quickInput.distanceToMetroRailFeet,
      tcacArea: quickInput.tcacArea || TCACOpportunityArea.MODERATE,
      marketArea: quickInput.marketArea || MarketArea.MEDIUM_HIGH,
      inVHFHSZ: quickInput.inVHFHSZ || false,
      inCoastalZone: quickInput.inCoastalZone || false,
    };

    // Use default assumptions
    const { getSubmarketAssumptions } = await import('../config/assumptions');
    marketAssumptions = getSubmarketAssumptions('default');
    incomeLevel = IncomeLevel.VLI;
    analysisOptions = {
      includeSubsidies: true,
      includeLIHTC: true,
      detailedOutput: true,
    };
  } else {
    // Interactive mode
    console.log('\n--- Interactive Mode ---\n');

    try {
      // Collect site information
      site = await collectSiteInput();

      // Select market assumptions
      marketAssumptions = await selectSubmarket();

      // Select income level
      incomeLevel = await selectIncomeLevel();

      // Select analysis options
      analysisOptions = await selectAnalysisOptions();
    } catch (error) {
      console.error('\nError collecting input:', error);
      closeInterface();
      process.exit(1);
    }
  }

  // Convert to financial assumptions
  const financialAssumptions = toFinancialAssumptions(marketAssumptions);

  // Run analysis
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    RUNNING ANALYSIS...                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const result = runFullAnalysis(
    site,
    incomeLevel,
    financialAssumptions,
    {
      includeSubsidies: analysisOptions.includeSubsidies,
      includeLIHTC: analysisOptions.includeLIHTC,
      detailedOutput: analysisOptions.detailedOutput,
      inDDAorQCT: true,  // Most LA sites qualify
    },
    true
  );

  // Show detailed output if requested
  if (analysisOptions.detailedOutput && result.withSubsidies.length > 0) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         DETAILED ANALYSIS - BEST PROGRAM                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    const best = result.withSubsidies[0];
    console.log(generateFullAnalysisWithSubsidies(
      best.analysis,
      best.lihtc,
      best.gap,
      best.subsidizedLandValue
    ));
  }

  // Print assumptions summary
  console.log('\n');
  console.log('MARKET ASSUMPTIONS USED:');
  console.log(printAssumptionsSummary(marketAssumptions));

  // Clean up
  closeInterface();
  console.log('\nAnalysis complete.\n');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
