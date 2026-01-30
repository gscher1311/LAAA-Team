/**
 * Interactive CLI for Land Residual Analysis
 */

import * as readline from 'readline';
import {
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  IncomeLevel,
} from '../types';
import {
  SUBMARKETS,
  getSubmarketAssumptions,
  toFinancialAssumptions,
  printAssumptionsSummary,
  MarketAssumptions,
} from '../config/assumptions';

// ============================================================================
// CLI INTERFACE
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function questionWithDefault(prompt: string, defaultValue: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${prompt} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function selectFromList<T>(prompt: string, options: { value: T; label: string }[]): Promise<T> {
  console.log(`\n${prompt}`);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt.label}`);
  });

  while (true) {
    const answer = await question('Enter number: ');
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < options.length) {
      return options[index].value;
    }
    console.log('Invalid selection. Try again.');
  }
}

// ============================================================================
// INPUT COLLECTORS
// ============================================================================

export async function collectSiteInput(): Promise<SiteInput> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              SITE INFORMATION                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Address
  const address = await question('Site Address: ');

  // Lot Size
  const lotSizeStr = await question('Lot Size (SF): ');
  const lotSizeSF = parseInt(lotSizeStr) || 10000;

  // Zone
  const baseZone = await selectFromList('Select Base Zone:', [
    { value: ZoneType.R1, label: 'R1 - Single Family' },
    { value: ZoneType.R2, label: 'R2 - Two Family' },
    { value: ZoneType.R3, label: 'R3 - Multi-Family (800 SF/DU)' },
    { value: ZoneType.R4, label: 'R4 - Multi-Family (400 SF/DU)' },
    { value: ZoneType.R5, label: 'R5 - Multi-Family (200 SF/DU)' },
    { value: ZoneType.RAS3, label: 'RAS3 - Residential/Commercial' },
    { value: ZoneType.RAS4, label: 'RAS4 - Residential/Commercial' },
    { value: ZoneType.C1, label: 'C1 - Limited Commercial' },
    { value: ZoneType.C2, label: 'C2 - Commercial' },
    { value: ZoneType.C4, label: 'C4 - Commercial' },
    { value: ZoneType.CR, label: 'CR - Commercial/Residential' },
    { value: ZoneType.CM, label: 'CM - Commercial/Manufacturing' },
  ]);

  // Height District
  const heightDistrict = await selectFromList('Select Height District:', [
    { value: HeightDistrict.HD_1, label: '1 - No FAR limit' },
    { value: HeightDistrict.HD_1L, label: '1L - 3:1 FAR, 75ft max' },
    { value: HeightDistrict.HD_1VL, label: '1VL - 1.5:1 FAR, 45ft max' },
    { value: HeightDistrict.HD_1XL, label: '1XL - 1:1 FAR, 30ft max' },
    { value: HeightDistrict.HD_2, label: '2 - 6:1 FAR' },
    { value: HeightDistrict.HD_3, label: '3 - 10:1 FAR' },
    { value: HeightDistrict.HD_4, label: '4 - 13:1 FAR' },
  ]);

  // Transit Distance
  console.log('\n--- Transit Proximity ---');
  const transitStr = await questionWithDefault('Distance to Major Transit Stop (feet)', '2000');
  const distanceToMajorTransitFeet = parseInt(transitStr) || 2000;

  const metroStr = await questionWithDefault('Distance to Metro Rail (feet, or "none")', 'none');
  const distanceToMetroRailFeet = metroStr.toLowerCase() === 'none' ? undefined : parseInt(metroStr);

  // TCAC Area
  const tcacArea = await selectFromList('TCAC Opportunity Area:', [
    { value: TCACOpportunityArea.HIGHEST, label: 'Highest Resource' },
    { value: TCACOpportunityArea.HIGH, label: 'High Resource' },
    { value: TCACOpportunityArea.MODERATE, label: 'Moderate Resource' },
    { value: TCACOpportunityArea.LOW, label: 'Low Resource' },
  ]);

  // Market Area
  const marketArea = await selectFromList('AHLF Market Area:', [
    { value: MarketArea.HIGH, label: 'High' },
    { value: MarketArea.MEDIUM_HIGH, label: 'Medium-High' },
    { value: MarketArea.MEDIUM, label: 'Medium' },
    { value: MarketArea.MEDIUM_LOW, label: 'Medium-Low' },
    { value: MarketArea.LOW, label: 'Low' },
  ]);

  // Constraints
  console.log('\n--- Site Constraints ---');
  const vhfhsz = await questionWithDefault('In Very High Fire Hazard Zone? (y/n)', 'n');
  const coastal = await questionWithDefault('In Coastal Zone? (y/n)', 'n');
  const historic = await questionWithDefault('Has Historic Resource? (y/n)', 'n');

  return {
    address,
    lotSizeSF,
    baseZone,
    heightDistrict,
    distanceToMajorTransitFeet,
    distanceToMetroRailFeet,
    tcacArea,
    marketArea,
    inVHFHSZ: vhfhsz.toLowerCase() === 'y',
    inCoastalZone: coastal.toLowerCase() === 'y',
    hasHistoricResource: historic.toLowerCase() === 'y',
  };
}

export async function selectSubmarket(): Promise<MarketAssumptions> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              MARKET ASSUMPTIONS                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const options = SUBMARKETS.map(s => ({
    value: s.name,
    label: `${s.name.toUpperCase()} - ${s.description}`,
  }));

  const submarketName = await selectFromList('Select Submarket:', options);
  const assumptions = getSubmarketAssumptions(submarketName);

  console.log(printAssumptionsSummary(assumptions));

  const customize = await questionWithDefault('Customize assumptions? (y/n)', 'n');
  if (customize.toLowerCase() === 'y') {
    return await customizeAssumptions(assumptions);
  }

  return assumptions;
}

export async function customizeAssumptions(base: MarketAssumptions): Promise<MarketAssumptions> {
  console.log('\n--- Customize (press Enter to keep default) ---');

  const rentStr = await questionWithDefault('Market Rent ($/SF/mo)', base.marketRentPSF.toString());
  const hardCostStr = await questionWithDefault('Hard Cost Type V ($/SF)', base.hardCostTypeV.toString());
  const yocStr = await questionWithDefault('Target YOC (%)', (base.targetYieldOnCost * 100).toString());
  const capStr = await questionWithDefault('Exit Cap Rate (%)', (base.exitCapRate * 100).toString());
  const salePriceStr = await questionWithDefault('Condo Sale Price ($/SF)', base.salePricePSF.toString());

  return {
    ...base,
    marketRentPSF: parseFloat(rentStr) || base.marketRentPSF,
    hardCostTypeV: parseFloat(hardCostStr) || base.hardCostTypeV,
    targetYieldOnCost: (parseFloat(yocStr) || base.targetYieldOnCost * 100) / 100,
    exitCapRate: (parseFloat(capStr) || base.exitCapRate * 100) / 100,
    salePricePSF: parseFloat(salePriceStr) || base.salePricePSF,
  };
}

export async function selectIncomeLevel(): Promise<IncomeLevel> {
  return await selectFromList('Target Affordability Level:', [
    { value: IncomeLevel.ELI, label: 'ELI - Extremely Low (30% AMI)' },
    { value: IncomeLevel.VLI, label: 'VLI - Very Low (50% AMI)' },
    { value: IncomeLevel.LOW, label: 'LOW - Lower Income (60% AMI)' },
    { value: IncomeLevel.LOW_80, label: 'LOW 80% - Lower Income (80% AMI)' },
    { value: IncomeLevel.MODERATE, label: 'MODERATE - Moderate (120% AMI)' },
  ]);
}

export async function selectAnalysisOptions(): Promise<{
  includeSubsidies: boolean;
  includeLIHTC: boolean;
  detailedOutput: boolean;
}> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              ANALYSIS OPTIONS                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const subsidies = await questionWithDefault('Include subsidy/gap financing analysis? (y/n)', 'y');
  const lihtc = await questionWithDefault('Include LIHTC tax credit modeling? (y/n)', 'y');
  const detailed = await questionWithDefault('Show detailed per-program analysis? (y/n)', 'n');

  return {
    includeSubsidies: subsidies.toLowerCase() === 'y',
    includeLIHTC: lihtc.toLowerCase() === 'y',
    detailedOutput: detailed.toLowerCase() === 'y',
  };
}

// ============================================================================
// QUICK INPUT MODE
// ============================================================================

export function parseQuickInput(args: string[]): Partial<SiteInput> | null {
  // Usage: npm run analyze -- --address "123 Main St" --lot 15000 --zone R3 --hd 1L
  const result: Partial<SiteInput> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--address':
      case '-a':
        result.address = value;
        i++;
        break;
      case '--lot':
      case '-l':
        result.lotSizeSF = parseInt(value);
        i++;
        break;
      case '--zone':
      case '-z':
        result.baseZone = value as ZoneType;
        i++;
        break;
      case '--hd':
      case '-h':
        result.heightDistrict = value as HeightDistrict;
        i++;
        break;
      case '--transit':
      case '-t':
        result.distanceToMajorTransitFeet = parseInt(value);
        i++;
        break;
      case '--market':
      case '-m':
        result.marketArea = value.toUpperCase() as MarketArea;
        i++;
        break;
      case '--tcac':
        result.tcacArea = value.toUpperCase() as TCACOpportunityArea;
        i++;
        break;
    }
  }

  if (!result.address && !result.lotSizeSF) {
    return null;
  }

  return result;
}

export function printUsage(): void {
  console.log(`
Land Residual Analysis App - Usage
══════════════════════════════════════════════════════════════

Interactive Mode:
  npm run analyze

Quick Mode:
  npm run analyze -- --address "123 Main St" --lot 15000 --zone R3

Options:
  -a, --address <addr>    Site address
  -l, --lot <sf>          Lot size in square feet
  -z, --zone <zone>       Base zone (R1, R2, R3, R4, R5, C1, C2, etc.)
  -h, --hd <district>     Height district (1, 1L, 1VL, 2, 3, 4)
  -t, --transit <feet>    Distance to major transit in feet
  -m, --market <area>     Market area (HIGH, MEDIUM_HIGH, MEDIUM, LOW)
  --tcac <area>           TCAC area (HIGHEST, HIGH, MODERATE, LOW)

Examples:
  npm run analyze -- -a "1234 Wilshire Blvd" -l 15000 -z R3 -h 1L -t 1200
  npm run analyze -- --address "456 Main St" --lot 10000 --zone C2

`);
}

// ============================================================================
// CLOSE INTERFACE
// ============================================================================

export function closeInterface(): void {
  rl.close();
}
