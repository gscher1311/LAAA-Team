/**
 * Output Formatter
 * Formats analysis results for display (Brickwork-style)
 */

import { SiteInput, IncentiveProgram } from '../types';
import { FinancialAnalysis, formatCurrency, formatPercent } from './financial';
import { LIHTCCalculation, GapFinancing } from './taxCredits';

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function padRight(str: string, len: number): string {
  return str.substring(0, len).padEnd(len);
}

function padLeft(str: string, len: number): string {
  return str.substring(0, len).padStart(len);
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function getProgramShortName(program: IncentiveProgram): string {
  const names: Record<IncentiveProgram, string> = {
    [IncentiveProgram.BY_RIGHT]: 'By-Right',
    [IncentiveProgram.STATE_DENSITY_BONUS]: 'State DB',
    [IncentiveProgram.MIIP_TRANSIT]: 'MIIP Transit',
    [IncentiveProgram.MIIP_OPPORTUNITY]: 'MIIP Opp Corr',
    [IncentiveProgram.MIIP_CORRIDOR]: 'MIIP Corridor',
    [IncentiveProgram.AHIP]: 'AHIP',
    [IncentiveProgram.ED1]: 'ED1',
    [IncentiveProgram.SB_79]: 'SB 79',
    [IncentiveProgram.TOC]: 'TOC',
  };
  return names[program] || program;
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

/**
 * Generate comparison table for multiple programs
 */
export function generateComparisonTable(analyses: FinancialAnalysis[]): string {
  const lines: string[] = [];

  // Header
  const colWidth = 14;
  const labelWidth = 22;

  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));
  lines.push('PROGRAM COMPARISON');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));

  // Program names header
  let header = padRight('', labelWidth);
  for (const a of analyses) {
    header += padLeft(getProgramShortName(a.program), colWidth);
  }
  lines.push(header);
  lines.push('─'.repeat(labelWidth + (colWidth * analyses.length)));

  // Development Metrics
  lines.push('');
  lines.push('DEVELOPMENT METRICS');

  // Total Units
  let row = padRight('Total Units', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.totalUnits), colWidth);
  }
  lines.push(row);

  // Affordable Units
  row = padRight('Affordable Units', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.affordableUnits), colWidth);
  }
  lines.push(row);

  // Affordable %
  row = padRight('Affordable %', labelWidth);
  for (const a of analyses) {
    row += padLeft(`${a.potential.affordablePercent}%`, colWidth);
  }
  lines.push(row);

  // Buildable SF
  row = padRight('Buildable SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.unitMix.totalSF)), colWidth);
  }
  lines.push(row);

  // FAR
  row = padRight('FAR', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.totalFAR.toFixed(2), colWidth);
  }
  lines.push(row);

  // Height
  row = padRight('Max Height', labelWidth);
  for (const a of analyses) {
    row += padLeft(`${a.potential.totalHeightFeet} ft`, colWidth);
  }
  lines.push(row);

  // Parking
  row = padRight('Parking Spaces', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.parkingRequired), colWidth);
  }
  lines.push(row);

  // Revenue Section
  lines.push('');
  lines.push('REVENUE (Annual)');

  // GPR
  row = padRight('Gross Pot. Rent', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.revenue.grossPotentialRent), colWidth);
  }
  lines.push(row);

  // NOI
  row = padRight('Net Op. Income', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.revenue.netOperatingIncome), colWidth);
  }
  lines.push(row);

  // NOI/Unit
  row = padRight('NOI/Unit', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.revenue.noiPerUnit), colWidth);
  }
  lines.push(row);

  // Cost Section
  lines.push('');
  lines.push('DEVELOPMENT COSTS');

  // Hard Costs
  row = padRight('Hard Costs', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.costs.totalHardCosts), colWidth);
  }
  lines.push(row);

  // Soft Costs
  row = padRight('Soft Costs', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.costs.totalSoftCosts), colWidth);
  }
  lines.push(row);

  // AHLF Fee
  row = padRight('AHLF Fee', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.costs.ahlfFee), colWidth);
  }
  lines.push(row);

  // Total Dev Cost
  row = padRight('Total Dev Cost', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.costs.totalDevelopmentCost), colWidth);
  }
  lines.push(row);

  // Cost/Unit
  row = padRight('Cost/Unit', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.costs.costPerUnit), colWidth);
  }
  lines.push(row);

  // Land Residual Section
  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));
  lines.push('LAND RESIDUAL');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));

  // YOC Method
  row = padRight('Via Yield on Cost', labelWidth);
  for (const a of analyses) {
    const yoc = a.residuals.find(r => r.method === 'Yield on Cost');
    row += padLeft(yoc ? formatCurrency(yoc.landValue) : 'N/A', colWidth);
  }
  lines.push(row);

  // Dev Profit Method
  row = padRight('Via Dev Profit', labelWidth);
  for (const a of analyses) {
    const dp = a.residuals.find(r => r.method === 'Development Profit');
    row += padLeft(dp ? formatCurrency(dp.landValue) : 'N/A', colWidth);
  }
  lines.push(row);

  // Condo Method (if applicable)
  const hasCondo = analyses.some(a => a.residuals.some(r => r.method === 'Condo Margin'));
  if (hasCondo) {
    row = padRight('Via Condo Sale', labelWidth);
    for (const a of analyses) {
      const condo = a.residuals.find(r => r.method === 'Condo Margin');
      row += padLeft(condo ? formatCurrency(condo.landValue) : 'N/A', colWidth);
    }
    lines.push(row);
  }

  lines.push('─'.repeat(labelWidth + (colWidth * analyses.length)));

  // Recommended
  row = padRight('RECOMMENDED', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.recommendedLandValue), colWidth);
  }
  lines.push(row);

  // Land $/SF
  row = padRight('Land $/PSF Lot', labelWidth);
  for (const a of analyses) {
    const yoc = a.residuals.find(r => r.method === 'Yield on Cost');
    row += padLeft(yoc ? `$${yoc.impliedLandPSF.toFixed(0)}` : 'N/A', colWidth);
  }
  lines.push(row);

  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));

  return lines.join('\n');
}

// ============================================================================
// ZONING BREAKDOWN OUTPUT
// ============================================================================

/**
 * Generate zoning breakdown showing base vs bonus for each program
 * Includes source citations and reasoning
 */
export function generateZoningBreakdown(
  site: SiteInput,
  analyses: FinancialAnalysis[]
): string {
  const lines: string[] = [];
  const colWidth = 12;
  const labelWidth = 24;

  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));
  lines.push('ZONING ANALYSIS BREAKDOWN');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));
  lines.push('');

  // Site info and sources
  lines.push('BASE ZONING STANDARDS');
  lines.push('─'.repeat(70));
  lines.push(`Zone:           ${site.baseZone}`);
  lines.push(`Height District: ${site.heightDistrict}`);
  lines.push(`Lot Size:       ${formatNumber(site.lotSizeSF)} SF`);
  lines.push('');
  lines.push('Sources:');
  lines.push('  • LAMC 12.03 - Density by Zone');
  lines.push('  • LAMC 12.21.1 - FAR by Height District');
  lines.push('  • LAMC 12.21.A.4 - Parking Requirements');
  lines.push('');

  // Program names header
  let header = padRight('', labelWidth);
  for (const a of analyses) {
    header += padLeft(getProgramShortName(a.program), colWidth);
  }
  lines.push(header);
  lines.push('─'.repeat(labelWidth + (colWidth * analyses.length)));

  // DENSITY SECTION
  lines.push('');
  lines.push('DENSITY (Units)');

  // Base Density
  let row = padRight('  Base (by zone)', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.baseDensity), colWidth);
  }
  lines.push(row);

  // Bonus Density
  row = padRight('  + Bonus', labelWidth);
  for (const a of analyses) {
    const bonus = a.potential.bonusDensity;
    row += padLeft(bonus > 0 ? `+${formatNumber(bonus)}` : '—', colWidth);
  }
  lines.push(row);

  // Total Density
  row = padRight('  = TOTAL UNITS', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.totalUnits), colWidth);
  }
  lines.push(row);

  // Density bonus %
  row = padRight('  Bonus %', labelWidth);
  for (const a of analyses) {
    const pct = a.potential.baseDensity > 0
      ? Math.round((a.potential.bonusDensity / a.potential.baseDensity) * 100)
      : 0;
    row += padLeft(pct > 0 ? `+${pct}%` : '—', colWidth);
  }
  lines.push(row);

  // FAR SECTION
  lines.push('');
  lines.push('FLOOR AREA RATIO');

  // Base FAR
  row = padRight('  Base FAR', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.baseFAR.toFixed(2), colWidth);
  }
  lines.push(row);

  // Bonus FAR
  row = padRight('  + Bonus FAR', labelWidth);
  for (const a of analyses) {
    const bonus = a.potential.bonusFAR;
    row += padLeft(bonus > 0 ? `+${bonus.toFixed(2)}` : '—', colWidth);
  }
  lines.push(row);

  // Total FAR
  row = padRight('  = TOTAL FAR', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.totalFAR.toFixed(2), colWidth);
  }
  lines.push(row);

  // Buildable SF
  row = padRight('  Buildable SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.potential.buildableSF)), colWidth);
  }
  lines.push(row);

  // HEIGHT SECTION
  lines.push('');
  lines.push('HEIGHT');

  // Base Height
  row = padRight('  Base Height (ft)', labelWidth);
  for (const a of analyses) {
    const h = a.potential.baseHeightFeet;
    row += padLeft(h && h < 999 ? h.toString() : 'No limit', colWidth);
  }
  lines.push(row);

  // Bonus Height
  row = padRight('  + Bonus (ft)', labelWidth);
  for (const a of analyses) {
    const bonus = a.potential.bonusHeightFeet;
    row += padLeft(bonus > 0 ? `+${bonus}` : '—', colWidth);
  }
  lines.push(row);

  // Total Height
  row = padRight('  = TOTAL HEIGHT', labelWidth);
  for (const a of analyses) {
    const h = a.potential.totalHeightFeet;
    row += padLeft(h && h < 999 ? `${h} ft` : 'No limit', colWidth);
  }
  lines.push(row);

  // Stories
  row = padRight('  Est. Stories', labelWidth);
  for (const a of analyses) {
    const stories = a.potential.totalStories;
    row += padLeft(stories && stories < 99 ? stories.toString() : '—', colWidth);
  }
  lines.push(row);

  // PARKING SECTION
  lines.push('');
  lines.push('PARKING');

  row = padRight('  Required Spaces', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.parkingRequired.toString(), colWidth);
  }
  lines.push(row);

  row = padRight('  Per Unit', labelWidth);
  for (const a of analyses) {
    const perUnit = a.potential.totalUnits > 0
      ? (a.potential.parkingRequired / a.potential.totalUnits).toFixed(2)
      : '0';
    row += padLeft(perUnit, colWidth);
  }
  lines.push(row);

  // AFFORDABILITY SECTION
  lines.push('');
  lines.push('AFFORDABILITY REQUIREMENT');

  row = padRight('  Affordable Units', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.affordableUnits.toString(), colWidth);
  }
  lines.push(row);

  row = padRight('  Affordable %', labelWidth);
  for (const a of analyses) {
    row += padLeft(`${a.potential.affordablePercent}%`, colWidth);
  }
  lines.push(row);

  row = padRight('  Income Level', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.affordablePercent > 0 ? a.potential.incomeLevel : '—', colWidth);
  }
  lines.push(row);

  // SETBACKS SECTION
  lines.push('');
  lines.push('SETBACK REQUIREMENTS (per LAMC)');

  row = padRight('  Front (ft)', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.setbacks?.front?.toString() || '—', colWidth);
  }
  lines.push(row);

  row = padRight('  Side (ft)', labelWidth);
  for (const a of analyses) {
    const s = a.potential.setbacks;
    const sideStr = s ? `${s.side}+${s.sidePerStory}/story` : '—';
    row += padLeft(sideStr, colWidth);
  }
  lines.push(row);

  row = padRight('  Rear (ft)', labelWidth);
  for (const a of analyses) {
    const s = a.potential.setbacks;
    const rearStr = s ? `${s.rear}+${s.rearPerStory}/story` : '—';
    row += padLeft(rearStr, colWidth);
  }
  lines.push(row);

  // BUILDABLE AREA SECTION
  lines.push('');
  lines.push('BUILDABLE AREA ANALYSIS');

  row = padRight('  Max Footprint SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.potential.buildableFootprintSF || 0)), colWidth);
  }
  lines.push(row);

  row = padRight('  Envelope SF (FAR)', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.potential.buildableSF)), colWidth);
  }
  lines.push(row);

  row = padRight('  Common Area SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.potential.commonAreaSF || 0)), colWidth);
  }
  lines.push(row);

  row = padRight('  Net Residential SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(Math.round(a.potential.netResidentialSF || 0)), colWidth);
  }
  lines.push(row);

  row = padRight('  Est. Units (envelope)', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.estimatedUnits || 0), colWidth);
  }
  lines.push(row);

  // OPEN SPACE SECTION
  lines.push('');
  lines.push('OPEN SPACE REQUIREMENTS');

  row = padRight('  Required SF', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatNumber(a.potential.openSpace?.totalRequired || 0), colWidth);
  }
  lines.push(row);

  // BICYCLE PARKING SECTION
  lines.push('');
  lines.push('BICYCLE PARKING (per LAMC 12.21.A.16)');

  row = padRight('  Long-term Spaces', labelWidth);
  for (const a of analyses) {
    row += padLeft((a.potential.bicycleParkingLongTerm || 0).toString(), colWidth);
  }
  lines.push(row);

  row = padRight('  Short-term Spaces', labelWidth);
  for (const a of analyses) {
    row += padLeft((a.potential.bicycleParkingShortTerm || 0).toString(), colWidth);
  }
  lines.push(row);

  // TRANSITIONAL HEIGHT SECTION
  lines.push('');
  lines.push('TRANSITIONAL HEIGHT LIMITS');

  row = padRight('  Applies?', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.transitionalHeightApplies ? 'Yes' : 'No', colWidth);
  }
  lines.push(row);

  // ADDITIONAL INCENTIVES SECTION
  lines.push('');
  lines.push('ADDITIONAL INCENTIVES AVAILABLE');

  row = padRight('  # of Incentives', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.potential.additionalIncentivesAvailable?.toString() || '0', colWidth);
  }
  lines.push(row);

  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));

  // Source citations
  lines.push('');
  lines.push('PROGRAM SOURCES:');
  lines.push('─'.repeat(70));

  const programSources: Record<IncentiveProgram, string> = {
    [IncentiveProgram.BY_RIGHT]: 'LAMC Chapter 1, Article 2 - Base zoning standards',
    [IncentiveProgram.STATE_DENSITY_BONUS]: 'CA Gov Code 65915; LAMC 12.22 A.37 - State Density Bonus Law',
    [IncentiveProgram.MIIP_TRANSIT]: 'LAMC 12.22 A.38 - MIIP Transit Oriented Area',
    [IncentiveProgram.MIIP_OPPORTUNITY]: 'LAMC 12.22 A.38 - MIIP Opportunity Corridor',
    [IncentiveProgram.MIIP_CORRIDOR]: 'LAMC 12.22 A.38 - MIIP Corridor Transition',
    [IncentiveProgram.AHIP]: 'LAMC 12.22 A.39 - Affordable Housing Incentive Program',
    [IncentiveProgram.ED1]: 'LAMC 12.22 A.31 - Executive Directive 1 (expired)',
    [IncentiveProgram.SB_79]: 'CA SB 79 - Transit-Oriented Development (eff. July 2026)',
    [IncentiveProgram.TOC]: 'LAMC 12.22 A.31 - Transit Oriented Communities (superseded)',
  };

  for (const a of analyses) {
    const source = programSources[a.program];
    if (source) {
      lines.push(`  ${getProgramShortName(a.program)}: ${source}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate reasoning explanation for zoning decisions
 */
export function generateZoningReasoning(
  site: SiteInput,
  analyses: FinancialAnalysis[]
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('ZONING REASONING & METHODOLOGY');
  lines.push('═'.repeat(70));
  lines.push('');

  // Base density calculation
  lines.push('1. BASE DENSITY CALCULATION');
  lines.push('─'.repeat(70));
  lines.push(`   Zone: ${site.baseZone}`);

  const byRight = analyses.find(a => a.program === IncentiveProgram.BY_RIGHT);
  if (byRight) {
    lines.push(`   Formula: Lot SF ÷ SF per Dwelling Unit`);
    lines.push(`   = ${formatNumber(site.lotSizeSF)} SF ÷ SF/DU (per zone table)`);
    lines.push(`   = ${byRight.potential.baseDensity} base units`);
    lines.push(`   Source: LAMC 12.03 Density Table`);
  }
  lines.push('');

  // FAR calculation
  lines.push('2. BASE FAR CALCULATION');
  lines.push('─'.repeat(70));
  lines.push(`   Zone FAR: Per ${site.baseZone} zone standards`);
  lines.push(`   Height District FAR: Per HD ${site.heightDistrict}`);
  lines.push(`   Effective FAR: MIN(Zone FAR, HD FAR)`);
  if (byRight) {
    lines.push(`   = ${byRight.potential.baseFAR.toFixed(2)}`);
    lines.push(`   Buildable SF: ${formatNumber(site.lotSizeSF)} × ${byRight.potential.baseFAR.toFixed(2)} = ${formatNumber(Math.round(byRight.potential.buildableSF))} SF`);
  }
  lines.push(`   Source: LAMC 12.21.1`);
  lines.push('');

  // Density bonus reasoning
  lines.push('3. DENSITY BONUS PROGRAMS');
  lines.push('─'.repeat(70));

  for (const a of analyses) {
    if (a.program === IncentiveProgram.BY_RIGHT) continue;
    if (a.potential.bonusDensity === 0 && a.potential.bonusFAR === 0) continue;

    lines.push(`   ${getProgramShortName(a.program)}:`);

    switch (a.program) {
      case IncentiveProgram.STATE_DENSITY_BONUS:
        lines.push(`     - Affordable requirement: ${a.potential.affordablePercent}% at ${a.potential.incomeLevel}`);
        lines.push(`     - Density bonus: +${Math.round((a.potential.bonusDensity / a.potential.baseDensity) * 100)}%`);
        lines.push(`     - Per Gov Code 65915(f): Each 1% VLI above 5% = +3% bonus`);
        break;
      case IncentiveProgram.MIIP_TRANSIT:
        lines.push(`     - Transit proximity: ${site.distanceToMetroRailFeet} ft to Metro Rail`);
        lines.push(`     - Density bonus: Up to 120% per LAMC 12.22 A.38(e)(2)`);
        lines.push(`     - FAR increase: Per Transit tier table`);
        break;
      case IncentiveProgram.MIIP_OPPORTUNITY:
        lines.push(`     - TCAC Area: ${site.tcacArea}`);
        lines.push(`     - FAR and height per LAMC 12.22 A.38(f)(2)`);
        break;
      case IncentiveProgram.AHIP:
        lines.push(`     - 100% affordable project`);
        lines.push(`     - Density bonus: +80% per Gov Code 65915`);
        lines.push(`     - FAR: Per LAMC 12.22 A.39 table`);
        break;
      case IncentiveProgram.SB_79:
        lines.push(`     - Within 1/4 mile of major transit`);
        lines.push(`     - Density: ${(site.distanceToMajorTransitFeet || Infinity) <= 1320 ? '120' : '100'} units/acre`);
        lines.push(`     - By-right approval, no parking required`);
        break;
    }
    lines.push('');
  }

  // Parking reasoning
  lines.push('4. PARKING REQUIREMENTS');
  lines.push('─'.repeat(70));
  lines.push(`   Transit distance: ${site.distanceToMajorTransitFeet || 'N/A'} ft`);
  lines.push(`   Base requirement: Per LAMC 12.21.A.4`);
  lines.push(`   Reductions:`);
  lines.push(`     - State DB near transit: 0 spaces (per AB 2097)`);
  lines.push(`     - MIIP: 0-0.5 spaces/unit per tier`);
  lines.push(`     - SB 79: 0 spaces (by statute)`);
  lines.push('');

  // Setbacks reasoning
  lines.push('5. SETBACK REQUIREMENTS');
  lines.push('─'.repeat(70));
  lines.push('   Per LAMC 12.08-12.14 (Zone regulations):');
  lines.push('   R-Zones (R3/R4/R5):');
  lines.push('     Front: 15 ft');
  lines.push('     Side: 5 ft base + 1 ft per story over 2nd (max 16 ft)');
  lines.push('     Rear: 15 ft base + 1 ft per story over 3rd (max 20 ft)');
  lines.push('   C-Zones (C1/C2/C4):');
  lines.push('     Front: 0 ft');
  lines.push('     Side: 0 ft');
  lines.push('     Rear: 0 ft (20 ft if abutting R zone)');
  lines.push('');
  lines.push('   Note: Incentive programs may allow setback reductions via incentives');
  lines.push('');

  // Open space reasoning
  lines.push('6. OPEN SPACE REQUIREMENTS');
  lines.push('─'.repeat(70));
  lines.push('   Per LAMC 12.21.G:');
  lines.push('   Standard calculation:');
  lines.push('     100 SF/unit (<3 habitable rooms)');
  lines.push('     125 SF/unit (3 habitable rooms)');
  lines.push('     175 SF/unit (>3 habitable rooms)');
  lines.push('');
  lines.push('   MIIP/AHIP alternative:');
  lines.push('     15% of lot area OR 10% of floor area (whichever greater)');
  lines.push('');

  // Bicycle parking reasoning
  lines.push('7. BICYCLE PARKING REQUIREMENTS');
  lines.push('─'.repeat(70));
  lines.push('   Per LAMC 12.21.A.16:');
  lines.push('   Long-term (secure/enclosed):');
  lines.push('     1/unit (0-25 units)');
  lines.push('     1/1.5 units (26-100 units)');
  lines.push('     1/2 units (101-200 units)');
  lines.push('     1/4 units (201+ units)');
  lines.push('');
  lines.push('   Short-term (visitor):');
  lines.push('     1/10 units (0-25 units)');
  lines.push('     1/15 units (26-100 units)');
  lines.push('     1/20 units (101-200 units)');
  lines.push('     1/40 units (201+ units)');
  lines.push('');

  // Transitional height reasoning
  lines.push('8. TRANSITIONAL HEIGHT LIMITS');
  lines.push('─'.repeat(70));
  lines.push('   Per LAMC 12.21.1:');
  lines.push('   Buildings within 50 ft of R1/R2 zone may require:');
  lines.push('     - Height step-backs');
  lines.push('     - 45-degree angular plane from property line');
  lines.push('');
  lines.push('   Exemptions available through:');
  lines.push('     - State Density Bonus incentives');
  lines.push('     - MIIP additional incentives menu');
  lines.push('     - AHIP incentives (100% affordable)');
  lines.push('');

  lines.push('═'.repeat(70));

  return lines.join('\n');
}

// ============================================================================
// SUMMARY OUTPUT
// ============================================================================

/**
 * Generate executive summary
 */
export function generateSummary(
  site: SiteInput,
  analyses: FinancialAnalysis[]
): string {
  const lines: string[] = [];

  // Find best program
  const sorted = [...analyses].sort((a, b) => b.recommendedLandValue - a.recommendedLandValue);
  const best = sorted[0];
  const baseline = analyses.find(a => a.program === IncentiveProgram.BY_RIGHT);

  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('EXECUTIVE SUMMARY');
  lines.push('═'.repeat(60));
  lines.push('');

  lines.push(`Site:     ${site.address}`);
  lines.push(`Lot Size: ${formatNumber(site.lotSizeSF)} SF`);
  lines.push(`Zoning:   ${site.baseZone} / Height District ${site.heightDistrict}`);
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push('BEST PROGRAM: ' + getProgramShortName(best.program));
  lines.push('─'.repeat(60));
  lines.push('');

  lines.push(`Land Value:        ${formatCurrency(best.recommendedLandValue)}`);
  lines.push(`Method:            ${best.recommendedMethod}`);
  lines.push(`Land $/PSF:        $${(best.recommendedLandValue / site.lotSizeSF).toFixed(0)}`);
  lines.push('');

  lines.push(`Total Units:       ${best.potential.totalUnits}`);
  lines.push(`Affordable Units:  ${best.potential.affordableUnits} (${best.potential.affordablePercent}%)`);
  lines.push(`Buildable SF:      ${formatNumber(Math.round(best.unitMix.totalSF))}`);
  lines.push(`Annual NOI:        ${formatCurrency(best.revenue.netOperatingIncome)}`);
  lines.push('');

  // Comparison to by-right
  if (baseline && baseline !== best) {
    const landUplift = best.recommendedLandValue - baseline.recommendedLandValue;
    const unitUplift = best.potential.totalUnits - baseline.potential.totalUnits;
    const upliftPercent = baseline.recommendedLandValue > 0
      ? formatPercent(landUplift / baseline.recommendedLandValue)
      : 'N/A (baseline $0)';

    lines.push('─'.repeat(60));
    lines.push('VS. BY-RIGHT BASELINE');
    lines.push('─'.repeat(60));
    lines.push('');
    lines.push(`Land Value Increase:  ${formatCurrency(landUplift)} (+${upliftPercent})`);
    lines.push(`Additional Units:     +${unitUplift} units`);
    lines.push(`By-Right Land Value:  ${formatCurrency(baseline.recommendedLandValue)}`);
    lines.push('');
  }

  // Ranking
  lines.push('─'.repeat(60));
  lines.push('ALL PROGRAMS RANKED BY LAND VALUE');
  lines.push('─'.repeat(60));
  lines.push('');

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const rank = i + 1;
    lines.push(
      `${rank}. ${padRight(getProgramShortName(a.program), 18)} ${padLeft(formatCurrency(a.recommendedLandValue), 12)}  (${a.potential.totalUnits} units)`
    );
  }

  lines.push('');
  lines.push('═'.repeat(60));

  return lines.join('\n');
}

// ============================================================================
// DETAILED PROGRAM OUTPUT
// ============================================================================

/**
 * Generate detailed analysis for a single program
 */
export function generateDetailedAnalysis(analysis: FinancialAnalysis): string {
  const lines: string[] = [];
  const a = analysis;

  lines.push('');
  lines.push('═'.repeat(50));
  lines.push(`${getProgramShortName(a.program)} - DETAILED ANALYSIS`);
  lines.push('═'.repeat(50));

  // Development
  lines.push('');
  lines.push('DEVELOPMENT PROGRAM');
  lines.push('─'.repeat(50));
  lines.push(`Total Units:         ${a.potential.totalUnits}`);
  lines.push(`  Market:            ${a.unitMix.marketUnits}`);
  lines.push(`  Affordable:        ${a.unitMix.affordableUnits} (${a.potential.affordablePercent}%)`);
  lines.push(`Income Level:        ${a.potential.incomeLevel}`);
  lines.push(`Buildable SF:        ${formatNumber(Math.round(a.unitMix.totalSF))}`);
  lines.push(`Avg Unit SF:         ${Math.round(a.unitMix.avgUnitSF)} SF`);
  lines.push(`FAR:                 ${a.potential.totalFAR.toFixed(2)}`);
  lines.push(`Height:              ${a.potential.totalHeightFeet} ft`);
  lines.push(`Parking Required:    ${a.potential.parkingRequired} spaces`);

  // Unit Mix
  lines.push('');
  lines.push('UNIT MIX');
  lines.push('─'.repeat(50));
  for (const unit of a.unitMix.units) {
    const pct = ((unit.count / a.unitMix.totalUnits) * 100).toFixed(0);
    lines.push(`  ${unit.type.padEnd(10)} ${unit.count.toString().padStart(4)} units (${pct}%) @ ${unit.avgSF} SF`);
  }

  // Revenue
  lines.push('');
  lines.push('REVENUE (Annual)');
  lines.push('─'.repeat(50));
  lines.push(`Gross Potential Rent:  ${formatCurrency(a.revenue.grossPotentialRent)}`);
  lines.push(`Less: Vacancy (5%):    (${formatCurrency(a.revenue.vacancyLoss)})`);
  lines.push(`Effective Gross:       ${formatCurrency(a.revenue.effectiveGrossIncome)}`);
  lines.push(`Less: OpEx (35%):      (${formatCurrency(a.revenue.operatingExpenses)})`);
  lines.push(`Net Operating Income:  ${formatCurrency(a.revenue.netOperatingIncome)}`);
  lines.push('');
  lines.push(`Avg Rent/Unit/Mo:      ${formatCurrency(a.revenue.rentPerUnitMonth)}`);
  lines.push(`NOI/Unit:              ${formatCurrency(a.revenue.noiPerUnit)}`);

  // Costs
  lines.push('');
  lines.push('DEVELOPMENT COSTS');
  lines.push('─'.repeat(50));
  lines.push(`Construction:          ${formatCurrency(a.costs.constructionCost)}`);
  lines.push(`Parking:               ${formatCurrency(a.costs.parkingCost)}`);
  lines.push(`Total Hard Costs:      ${formatCurrency(a.costs.totalHardCosts)}`);
  lines.push('');
  lines.push(`Soft Costs (28%):      ${formatCurrency(a.costs.softCosts)}`);
  lines.push(`AHLF Fee:              ${formatCurrency(a.costs.ahlfFee)}`);
  lines.push(`Permits:               ${formatCurrency(a.costs.permitFees)}`);
  lines.push(`Total Soft Costs:      ${formatCurrency(a.costs.totalSoftCosts)}`);
  lines.push('');
  lines.push(`Construction Interest: ${formatCurrency(a.costs.constructionInterest)}`);
  lines.push('');
  lines.push(`TOTAL DEV COST:        ${formatCurrency(a.costs.totalDevelopmentCost)}`);
  lines.push(`Cost/Unit:             ${formatCurrency(a.costs.costPerUnit)}`);
  lines.push(`Cost/SF:               $${a.costs.costPerSF.toFixed(0)}/SF`);

  // Land Residuals
  lines.push('');
  lines.push('LAND RESIDUAL ANALYSIS');
  lines.push('─'.repeat(50));

  for (const r of a.residuals) {
    lines.push('');
    lines.push(`Method: ${r.method}`);
    lines.push(`  Land Value:    ${formatCurrency(r.landValue)}`);
    lines.push(`  Land $/PSF:    $${r.impliedLandPSF.toFixed(0)}/SF (lot)`);

    if (r.method === 'Yield on Cost') {
      lines.push(`  Target YOC:    ${formatPercent(r.metrics.targetYOC)}`);
      lines.push(`  Achieved YOC:  ${formatPercent(r.metrics.achievedYOC)}`);
    } else if (r.method === 'Development Profit') {
      lines.push(`  Exit Cap:      ${formatPercent(r.metrics.exitCapRate)}`);
      lines.push(`  Stab. Value:   ${formatCurrency(r.metrics.stabilizedValue)}`);
      lines.push(`  Target Margin: ${formatPercent(r.metrics.targetProfitMargin)}`);
      lines.push(`  Actual Margin: ${formatPercent(r.metrics.actualMargin)}`);
    } else if (r.method === 'Condo Margin') {
      lines.push(`  Gross Sales:   ${formatCurrency(r.metrics.grossSales)}`);
      lines.push(`  Sale $/PSF:    $${r.metrics.salePricePSF}/SF`);
      lines.push(`  Target Margin: ${formatPercent(r.metrics.targetMargin)}`);
      lines.push(`  Actual Margin: ${formatPercent(r.metrics.actualMargin)}`);
    }
  }

  lines.push('');
  lines.push('═'.repeat(50));
  lines.push(`RECOMMENDED LAND VALUE: ${formatCurrency(a.recommendedLandValue)}`);
  lines.push('═'.repeat(50));

  return lines.join('\n');
}

// ============================================================================
// LIHTC AND SUBSIDY OUTPUT
// ============================================================================

/**
 * Generate LIHTC analysis output
 */
export function generateLIHTCOutput(lihtc: LIHTCCalculation): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(50));
  lines.push('LIHTC TAX CREDIT ANALYSIS');
  lines.push('═'.repeat(50));

  if (lihtc.type === 'none') {
    lines.push('');
    lines.push('Not eligible for LIHTC');
    lines.push('(Requires min 20% at VLI or 40% at 60% AMI)');
    return lines.join('\n');
  }

  lines.push('');
  lines.push(`Credit Type:           ${lihtc.type} LIHTC`);
  lines.push(`Credit Rate:           ${formatPercent(lihtc.metrics.creditRate)}`);
  lines.push(`Equity Pricing:        $${(lihtc.metrics.equityPricing).toFixed(2)} per $1 credit`);
  lines.push(`Basis Boost (DDA/QCT): ${lihtc.metrics.basisBoost ? 'Yes (+30%)' : 'No'}`);
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('');
  lines.push(`Eligible Basis:        ${formatCurrency(lihtc.eligibleBasis)}`);
  lines.push(`Applicable Fraction:   ${formatPercent(lihtc.applicableFraction)}`);
  lines.push(`Qualified Basis:       ${formatCurrency(lihtc.qualifiedBasis)}`);
  lines.push('');
  lines.push(`Annual Credit:         ${formatCurrency(lihtc.annualCredit)}`);
  lines.push(`Total Credits (10yr):  ${formatCurrency(lihtc.totalCredits)}`);
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push(`TAX CREDIT EQUITY:     ${formatCurrency(lihtc.equityFromCredits)}`);
  lines.push(`As % of Dev Cost:      ${formatPercent(lihtc.effectiveSubsidy)}`);
  lines.push('─'.repeat(50));

  return lines.join('\n');
}

/**
 * Generate gap financing / sources & uses output
 */
export function generateGapFinancingOutput(gap: GapFinancing): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(50));
  lines.push('SOURCES & USES / GAP ANALYSIS');
  lines.push('═'.repeat(50));
  lines.push('');

  lines.push('USES');
  lines.push('─'.repeat(50));
  lines.push(`Total Development Cost:  ${formatCurrency(gap.totalDevelopmentCost)}`);
  lines.push('');

  lines.push('SOURCES');
  lines.push('─'.repeat(50));
  lines.push(`Permanent Debt:          ${formatCurrency(gap.permanentDebt)}`);
  lines.push(`Tax Credit Equity:       ${formatCurrency(gap.taxCreditEquity)}`);

  if (gap.deferredDeveloperFee > 0) {
    lines.push(`Deferred Developer Fee:  ${formatCurrency(gap.deferredDeveloperFee)}`);
  }

  if (gap.otherSubsidies.length > 0) {
    lines.push('');
    lines.push('Other Subsidies:');
    for (const subsidy of gap.otherSubsidies) {
      const typeLabel = subsidy.type === 'debt' ? '(soft loan)' :
                        subsidy.type === 'grant' ? '(grant)' : '';
      lines.push(`  ${subsidy.name.padEnd(22)} ${formatCurrency(subsidy.amount)} ${typeLabel}`);
    }
  }

  lines.push('─'.repeat(50));
  lines.push(`TOTAL SOURCES:           ${formatCurrency(gap.totalSources)}`);
  lines.push('');

  const gapStatus = gap.isFeasible ? '✓ FEASIBLE' : '✗ GAP TOO LARGE';
  lines.push(`FUNDING GAP:             ${formatCurrency(gap.fundingGap)} (${formatPercent(gap.gapAsPercentOfCost)})`);
  lines.push(`STATUS:                  ${gapStatus}`);
  lines.push('═'.repeat(50));

  return lines.join('\n');
}

/**
 * Generate full analysis with subsidies
 */
export function generateFullAnalysisWithSubsidies(
  analysis: FinancialAnalysis,
  lihtc: LIHTCCalculation,
  gap: GapFinancing,
  subsidizedLandValue: number
): string {
  const lines: string[] = [];

  // Standard detailed analysis
  lines.push(generateDetailedAnalysis(analysis));

  // LIHTC section
  lines.push(generateLIHTCOutput(lihtc));

  // Gap financing section
  lines.push(generateGapFinancingOutput(gap));

  // Subsidized land value
  if (lihtc.type !== 'none') {
    lines.push('');
    lines.push('═'.repeat(50));
    lines.push('SUBSIDIZED LAND RESIDUAL');
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push(`Standard Land Value (YOC):     ${formatCurrency(analysis.recommendedLandValue)}`);
    lines.push(`With Tax Credits/Subsidies:    ${formatCurrency(subsidizedLandValue)}`);
    const uplift = subsidizedLandValue - analysis.recommendedLandValue;
    if (uplift > 0) {
      lines.push(`Subsidy Uplift:                +${formatCurrency(uplift)}`);
    }
    lines.push('═'.repeat(50));
  }

  return lines.join('\n');
}

/**
 * Generate comparison table with subsidies
 */
export function generateComparisonTableWithSubsidies(
  analyses: Array<{
    analysis: FinancialAnalysis;
    lihtc: LIHTCCalculation;
    gap: GapFinancing;
    subsidizedLandValue: number;
  }>
): string {
  const lines: string[] = [];
  const colWidth = 14;
  const labelWidth = 22;

  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));
  lines.push('PROGRAM COMPARISON WITH SUBSIDIES');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length) + 4));

  // Program names header
  let header = padRight('', labelWidth);
  for (const a of analyses) {
    header += padLeft(getProgramShortName(a.analysis.program), colWidth);
  }
  lines.push(header);
  lines.push('─'.repeat(labelWidth + (colWidth * analyses.length)));

  // Basic metrics
  lines.push('');
  lines.push('DEVELOPMENT');

  let row = padRight('Total Units', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.analysis.potential.totalUnits.toString(), colWidth);
  }
  lines.push(row);

  row = padRight('Affordable %', labelWidth);
  for (const a of analyses) {
    row += padLeft(`${a.analysis.potential.affordablePercent}%`, colWidth);
  }
  lines.push(row);

  row = padRight('NOI', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.analysis.revenue.netOperatingIncome), colWidth);
  }
  lines.push(row);

  row = padRight('Total Dev Cost', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.analysis.costs.totalDevelopmentCost), colWidth);
  }
  lines.push(row);

  // Tax Credits
  lines.push('');
  lines.push('TAX CREDITS');

  row = padRight('LIHTC Type', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.lihtc.type === 'none' ? 'N/A' : a.lihtc.type, colWidth);
  }
  lines.push(row);

  row = padRight('TC Equity', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.lihtc.equityFromCredits), colWidth);
  }
  lines.push(row);

  // Gap Financing
  lines.push('');
  lines.push('SOURCES & USES');

  row = padRight('Perm Debt', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.gap.permanentDebt), colWidth);
  }
  lines.push(row);

  row = padRight('Total Sources', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.gap.totalSources), colWidth);
  }
  lines.push(row);

  row = padRight('Gap', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.gap.fundingGap), colWidth);
  }
  lines.push(row);

  row = padRight('Feasible?', labelWidth);
  for (const a of analyses) {
    row += padLeft(a.gap.isFeasible ? 'YES' : 'NO', colWidth);
  }
  lines.push(row);

  // Land Residuals
  lines.push('');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));
  lines.push('LAND RESIDUAL');
  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));

  row = padRight('Standard (YOC)', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.analysis.recommendedLandValue), colWidth);
  }
  lines.push(row);

  row = padRight('With Subsidies', labelWidth);
  for (const a of analyses) {
    row += padLeft(formatCurrency(a.subsidizedLandValue), colWidth);
  }
  lines.push(row);

  lines.push('═'.repeat(labelWidth + (colWidth * analyses.length)));

  return lines.join('\n');
}
