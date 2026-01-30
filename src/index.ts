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

// Example usage
import {
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  IncomeLevel,
} from './types';

import { checkAllProgramEligibility, summarizeEligibility } from './calculators/eligibility';
import { calculateAllProgramPotential, comparePotential } from './calculators/developmentPotential';

/**
 * Run analysis for a site
 */
export function analyzeSite(site: SiteInput, incomeLevel: IncomeLevel = IncomeLevel.VLI) {
  console.log('\n========================================');
  console.log('LAND RESIDUAL ANALYSIS');
  console.log('========================================\n');
  console.log(`Site: ${site.address}`);
  console.log(`Lot Size: ${site.lotSizeSF.toLocaleString()} SF`);
  console.log(`Zone: ${site.baseZone} / Height District: ${site.heightDistrict}`);
  console.log(`Market Area: ${site.marketArea}`);
  console.log(`TCAC Area: ${site.tcacArea}`);

  // Check eligibility
  const eligibility = checkAllProgramEligibility(site);
  console.log(`\nBase Density: ${eligibility.baseDensity} units`);
  console.log(summarizeEligibility(eligibility));

  // Calculate development potential
  const potentials = calculateAllProgramPotential(site, incomeLevel);

  console.log('\n----------------------------------------');
  console.log('DEVELOPMENT POTENTIAL BY PROGRAM');
  console.log('----------------------------------------\n');

  // Print comparison table
  console.log('Program'.padEnd(25) +
    'Units'.padStart(8) +
    'FAR'.padStart(8) +
    'Height'.padStart(10) +
    'Afford%'.padStart(10) +
    'Parking'.padStart(10));
  console.log('-'.repeat(71));

  for (const p of potentials) {
    if (!p.eligible) continue;

    const programName = p.program.replace('_', ' ').substring(0, 24);
    console.log(
      programName.padEnd(25) +
      p.totalUnits.toString().padStart(8) +
      p.totalFAR.toFixed(2).padStart(8) +
      `${p.totalHeightFeet}ft`.padStart(10) +
      `${p.affordablePercent}%`.padStart(10) +
      p.parkingRequired.toString().padStart(10)
    );
  }

  // Find best options
  const comparison = comparePotential(potentials);

  console.log('\n----------------------------------------');
  console.log('BEST OPTIONS');
  console.log('----------------------------------------');
  console.log(`Max Units: ${comparison.maxUnits.program} (${comparison.maxUnits.totalUnits} units)`);
  console.log(`Max FAR: ${comparison.maxFAR.program} (${comparison.maxFAR.totalFAR.toFixed(2)})`);
  console.log(`Max Height: ${comparison.maxHeight.program} (${comparison.maxHeight.totalHeightFeet} ft)`);

  return {
    site,
    eligibility,
    potentials,
    comparison,
  };
}

// Demo with sample site
if (require.main === module) {
  const sampleSite: SiteInput = {
    address: '1234 Main St, Los Angeles, CA',
    lotSizeSF: 15000,
    baseZone: ZoneType.R3,
    heightDistrict: HeightDistrict.HD_1L,
    distanceToMajorTransitFeet: 1200,  // Within 1/4 mile
    distanceToMetroRailFeet: 1200,
    tcacArea: TCACOpportunityArea.MODERATE,
    marketArea: MarketArea.HIGH,
    inVHFHSZ: false,
    inCoastalZone: false,
  };

  analyzeSite(sampleSite);
}
