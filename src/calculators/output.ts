/**
 * Output Formatter
 * Formats analysis results for display (Brickwork-style)
 */

import { SiteInput, IncentiveProgram } from '../types';
import { FinancialAnalysis, formatCurrency, formatPercent } from './financial';

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

    lines.push('─'.repeat(60));
    lines.push('VS. BY-RIGHT BASELINE');
    lines.push('─'.repeat(60));
    lines.push('');
    lines.push(`Land Value Increase:  ${formatCurrency(landUplift)} (+${formatPercent(landUplift / baseline.recommendedLandValue)})`);
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
