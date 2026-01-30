/**
 * HTML Report Generator
 * Creates a professional HTML report for client presentations
 */

import { FullAnalysisResult, MultiParcelAnalysisResult } from '../index';
import { FinancialAnalysis } from '../calculators/financial';
import { LIHTCCalculation, GapFinancing } from '../calculators/taxCredits';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// STYLES
// ============================================================================

const CSS_STYLES = `
:root {
  --primary: #1a365d;
  --secondary: #2c5282;
  --accent: #3182ce;
  --success: #38a169;
  --warning: #d69e2e;
  --danger: #e53e3e;
  --light: #f7fafc;
  --dark: #1a202c;
  --border: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--light);
  color: var(--dark);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.header .subtitle {
  opacity: 0.9;
  font-size: 1.1rem;
}

.header .site-info {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.header .info-item {
  background: rgba(255,255,255,0.1);
  padding: 12px 16px;
  border-radius: 8px;
}

.header .info-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.header .info-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--border);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary);
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.badge-success { background: #c6f6d5; color: #22543d; }
.badge-warning { background: #fefcbf; color: #744210; }
.badge-danger { background: #fed7d7; color: #822727; }
.badge-info { background: #bee3f8; color: #2a4365; }

.best-program {
  background: linear-gradient(135deg, #f0fff4, #c6f6d5);
  border: 2px solid var(--success);
}

.best-program .card-header {
  border-bottom-color: var(--success);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.metric {
  text-align: center;
  padding: 20px;
  background: var(--light);
  border-radius: 8px;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
}

.metric-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.comparison-table th {
  background: var(--light);
  font-weight: 600;
  color: var(--primary);
}

.comparison-table tr:hover {
  background: #f8fafc;
}

.comparison-table .highlight {
  background: #f0fff4;
  font-weight: 600;
}

.comparison-table .number {
  text-align: right;
  font-family: 'Consolas', monospace;
}

.feasibility-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.feasibility-status.feasible { color: var(--success); }
.feasibility-status.not-feasible { color: var(--danger); }

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.detail-list {
  list-style: none;
}

.detail-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.detail-list li:last-child {
  border-bottom: none;
}

.detail-list .label {
  color: #666;
}

.detail-list .value {
  font-weight: 600;
  font-family: 'Consolas', monospace;
}

.footer {
  text-align: center;
  padding: 30px;
  color: #666;
  font-size: 0.9rem;
}

.assumptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.assumptions-group h4 {
  color: var(--secondary);
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.print-only {
  display: none;
}

@media print {
  .no-print { display: none; }
  .print-only { display: block; }
  .card { break-inside: avoid; }
  body { background: white; }
}
</style>
`;

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return '$' + (value / 1000).toFixed(0) + 'K';
  }
  return '$' + value.toFixed(0);
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateComparisonTable(result: FullAnalysisResult): string {
  const rows = result.withSubsidies.map((item, index) => {
    const isFirst = index === 0;
    const rowClass = isFirst ? 'highlight' : '';
    const feasible = item.gap.isFeasible;

    return `
      <tr class="${rowClass}">
        <td>${item.analysis.potential.program}${isFirst ? ' <span class="badge badge-success">BEST</span>' : ''}</td>
        <td class="number">${item.analysis.unitMix.totalUnits}</td>
        <td class="number">${formatPercent(item.analysis.potential.affordablePercent)}</td>
        <td class="number">${formatCurrency(item.analysis.revenue.netOperatingIncome)}</td>
        <td class="number">${formatCurrency(item.analysis.costs.totalDevelopmentCost)}</td>
        <td class="number">${item.lihtc.type !== 'none' ? item.lihtc.type : '-'}</td>
        <td class="number">${formatCurrency(item.gap.taxCreditEquity)}</td>
        <td class="number">${formatCurrency(item.gap.fundingGap)}</td>
        <td>
          <span class="feasibility-status ${feasible ? 'feasible' : 'not-feasible'}">
            ${feasible ? '✓ Feasible' : '✗ Gap'}
          </span>
        </td>
        <td class="number" style="font-weight: 600;">${formatCurrency(item.subsidizedLandValue || item.analysis.recommendedLandValue || 0)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Program</th>
          <th>Units</th>
          <th>Affordable</th>
          <th>NOI</th>
          <th>Dev Cost</th>
          <th>LIHTC</th>
          <th>TC Equity</th>
          <th>Gap</th>
          <th>Status</th>
          <th>Land Value</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function generateBestProgramCard(result: FullAnalysisResult): string {
  const best = result.withSubsidies[0];
  if (!best) return '';

  const analysis = best.analysis;
  const landValue = best.subsidizedLandValue || analysis.recommendedLandValue || 0;
  const landPSF = landValue / result.site.lotSizeSF;

  return `
    <div class="card best-program">
      <div class="card-header">
        <h2 class="card-title">Best Program: ${analysis.potential.program}</h2>
        <span class="badge badge-success">Recommended</span>
      </div>

      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value">${formatCurrency(landValue)}</div>
          <div class="metric-label">Land Value</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${landPSF.toFixed(0)}/SF</div>
          <div class="metric-label">Land $/PSF</div>
        </div>
        <div class="metric">
          <div class="metric-value">${analysis.unitMix.totalUnits}</div>
          <div class="metric-label">Total Units</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatPercent(analysis.potential.affordablePercent)}</div>
          <div class="metric-label">Affordable</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatCurrency(analysis.revenue.netOperatingIncome)}</div>
          <div class="metric-label">Annual NOI</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatCurrency(best.gap.taxCreditEquity)}</div>
          <div class="metric-label">Tax Credit Equity</div>
        </div>
      </div>
    </div>
  `;
}

function generateDetailSection(result: FullAnalysisResult): string {
  const best = result.withSubsidies[0];
  if (!best) return '';

  const analysis = best.analysis;
  const costs = analysis.costs;
  const revenue = analysis.revenue;

  return `
    <div class="section-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Development Program</h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Total Units</span><span class="value">${analysis.unitMix.totalUnits}</span></li>
          <li><span class="label">Market Units</span><span class="value">${analysis.unitMix.marketUnits}</span></li>
          <li><span class="label">Affordable Units</span><span class="value">${analysis.unitMix.affordableUnits} (${formatPercent(analysis.potential.affordablePercent)})</span></li>
          <li><span class="label">Income Level</span><span class="value">${analysis.potential.incomeLevel}</span></li>
          <li><span class="label">Buildable SF</span><span class="value">${formatNumber(analysis.potential.buildableSF)}</span></li>
          <li><span class="label">Avg Unit Size</span><span class="value">${(analysis.potential.buildableSF / analysis.unitMix.totalUnits).toFixed(0)} SF</span></li>
          <li><span class="label">FAR Achieved</span><span class="value">${analysis.potential.totalFAR.toFixed(2)}</span></li>
          <li><span class="label">Height</span><span class="value">${analysis.potential.totalHeightFeet ?? 'Unlimited'} ft</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Revenue (Annual)</h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Gross Potential Rent</span><span class="value">${formatCurrency(revenue.grossPotentialRent)}</span></li>
          <li><span class="label">Less: Vacancy</span><span class="value">(${formatCurrency(revenue.vacancyLoss)})</span></li>
          <li><span class="label">Effective Gross</span><span class="value">${formatCurrency(revenue.effectiveGrossIncome)}</span></li>
          <li><span class="label">Less: Operating Expenses</span><span class="value">(${formatCurrency(revenue.operatingExpenses)})</span></li>
          <li><span class="label" style="font-weight:600;">Net Operating Income</span><span class="value" style="font-weight:600;">${formatCurrency(revenue.netOperatingIncome)}</span></li>
          <li><span class="label">NOI per Unit</span><span class="value">${formatCurrency(revenue.noiPerUnit)}</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Development Costs</h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Construction</span><span class="value">${formatCurrency(costs.constructionCost)}</span></li>
          <li><span class="label">Parking</span><span class="value">${formatCurrency(costs.parkingCost)}</span></li>
          <li><span class="label">Total Hard Costs</span><span class="value">${formatCurrency(costs.totalHardCosts)}</span></li>
          <li><span class="label">Soft Costs (${formatPercent(costs.softCostPercent)})</span><span class="value">${formatCurrency(costs.softCosts)}</span></li>
          <li><span class="label">AHLF Fee</span><span class="value">${formatCurrency(costs.ahlfFee)}</span></li>
          <li><span class="label">Permits</span><span class="value">${formatCurrency(costs.permitFees)}</span></li>
          <li><span class="label">Construction Interest</span><span class="value">${formatCurrency(costs.constructionInterest)}</span></li>
          <li><span class="label" style="font-weight:600;">Total Dev Cost</span><span class="value" style="font-weight:600;">${formatCurrency(costs.totalDevelopmentCost)}</span></li>
          <li><span class="label">Cost per Unit</span><span class="value">${formatCurrency(costs.costPerUnit)}</span></li>
          <li><span class="label">Cost per SF</span><span class="value">$${costs.costPerSF.toFixed(0)}/SF</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sources & Uses</h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Total Development Cost</span><span class="value">${formatCurrency(best.gap.totalDevelopmentCost)}</span></li>
          <li><span class="label">Permanent Debt</span><span class="value">${formatCurrency(best.gap.permanentDebt)}</span></li>
          <li><span class="label">Tax Credit Equity</span><span class="value">${formatCurrency(best.gap.taxCreditEquity)}</span></li>
          <li><span class="label">Deferred Dev Fee</span><span class="value">${formatCurrency(best.gap.deferredDeveloperFee)}</span></li>
          <li><span class="label" style="font-weight:600;">Total Sources</span><span class="value" style="font-weight:600;">${formatCurrency(best.gap.totalSources)}</span></li>
          <li><span class="label" style="color: ${best.gap.isFeasible ? 'var(--success)' : 'var(--danger)'};">Funding Gap</span>
              <span class="value" style="color: ${best.gap.isFeasible ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(best.gap.fundingGap)} (${formatPercent(best.gap.gapAsPercentOfCost)})</span></li>
        </ul>
      </div>
    </div>
  `;
}

function generateAssumptions(): string {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Assumptions</h3>
      </div>
      <div class="assumptions-grid">
        <div class="assumptions-group">
          <h4>Revenue</h4>
          <ul class="detail-list">
            <li><span class="label">Market Rent</span><span class="value">$4.25/SF/mo</span></li>
            <li><span class="label">Vacancy</span><span class="value">5%</span></li>
            <li><span class="label">OpEx Ratio</span><span class="value">35%</span></li>
          </ul>
        </div>
        <div class="assumptions-group">
          <h4>Construction</h4>
          <ul class="detail-list">
            <li><span class="label">Hard Cost</span><span class="value">$320/SF</span></li>
            <li><span class="label">Soft Cost</span><span class="value">28-30%</span></li>
            <li><span class="label">Construction</span><span class="value">18 months</span></li>
          </ul>
        </div>
        <div class="assumptions-group">
          <h4>Returns</h4>
          <ul class="detail-list">
            <li><span class="label">Target YOC</span><span class="value">5.5%</span></li>
            <li><span class="label">Exit Cap Rate</span><span class="value">5.5%</span></li>
            <li><span class="label">Dev Profit</span><span class="value">15%</span></li>
          </ul>
        </div>
        <div class="assumptions-group">
          <h4>LIHTC</h4>
          <ul class="detail-list">
            <li><span class="label">9% Credit</span><span class="value">9.0%</span></li>
            <li><span class="label">4% Credit</span><span class="value">4.0%</span></li>
            <li><span class="label">DDA/QCT Boost</span><span class="value">+30%</span></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function generateHTMLReport(result: FullAnalysisResult): string {
  const site = result.site;
  const timestamp = new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Land Residual Analysis - ${site.address}</title>
  <style>${CSS_STYLES}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Land Residual Analysis Report</h1>
      <p class="subtitle">LA Real Estate Development Tool with LIHTC & Gap Financing</p>

      <div class="site-info">
        <div class="info-item">
          <div class="info-label">Address</div>
          <div class="info-value">${site.address}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Lot Size</div>
          <div class="info-value">${formatNumber(site.lotSizeSF)} SF</div>
        </div>
        <div class="info-item">
          <div class="info-label">Zoning</div>
          <div class="info-value">${site.baseZone} / HD ${site.heightDistrict}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Market Area</div>
          <div class="info-value">${site.marketArea}</div>
        </div>
        <div class="info-item">
          <div class="info-label">TCAC Area</div>
          <div class="info-value">${site.tcacArea}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Report Date</div>
          <div class="info-value">${timestamp}</div>
        </div>
      </div>
    </div>

    ${generateBestProgramCard(result)}

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Program Comparison</h2>
        <span class="badge badge-info">${result.withSubsidies.length} programs analyzed</span>
      </div>
      ${generateComparisonTable(result)}
    </div>

    ${generateDetailSection(result)}

    ${generateAssumptions()}

    <div class="footer">
      <p>Generated by Land Residual Analysis App | ${timestamp}</p>
      <p class="no-print">This report is for informational purposes only. Consult with professionals before making investment decisions.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Save HTML report to file and optionally open in browser
 */
export function saveHTMLReport(
  result: FullAnalysisResult,
  outputPath?: string,
  openInBrowser: boolean = true
): string {
  const html = generateHTMLReport(result);

  // Default path in project root
  const filePath = outputPath || path.join(process.cwd(), 'report.html');

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Report saved to: ${filePath}`);

  if (openInBrowser) {
    // Try to open in default browser
    const { exec } = require('child_process');
    const platform = process.platform;

    let command: string;
    if (platform === 'win32') {
      command = `start "" "${filePath}"`;
    } else if (platform === 'darwin') {
      command = `open "${filePath}"`;
    } else {
      command = `xdg-open "${filePath}"`;
    }

    exec(command, (error: any) => {
      if (error) {
        console.log('Could not auto-open browser. Please open the file manually.');
      }
    });
  }

  return filePath;
}
