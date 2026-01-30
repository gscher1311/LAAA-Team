/**
 * Web Server for Land Residual Analysis App
 * Professional web interface for LA real estate development analysis
 */

import express from 'express';
import path from 'path';
import {
  runFullAnalysis,
  FullAnalysisResult,
  SiteInput,
  ZoneType,
  HeightDistrict,
  TCACOpportunityArea,
  MarketArea,
  IncomeLevel,
} from '../index';
import { LA_DEFAULT_ASSUMPTIONS } from '../calculators/financial';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// SHARED STYLES
// ============================================================================

const SHARED_STYLES = `
:root {
  --primary: #0f172a;
  --primary-light: #1e293b;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-light: #3b82f6;
  --success: #059669;
  --success-light: #10b981;
  --warning: #d97706;
  --danger: #dc2626;
  --light: #f8fafc;
  --lighter: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-muted: #64748b;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  --radius: 12px;
  --radius-lg: 16px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

/* Header */
.app-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  padding: 48px 40px;
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
  box-shadow: var(--shadow-xl);
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, transparent 70%);
  transform: rotate(-15deg);
}

.app-header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
}

.app-header .tagline {
  font-size: 1.1rem;
  opacity: 0.9;
  position: relative;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: var(--accent);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: var(--shadow);
}

/* Cards */
.card {
  background: var(--lighter);
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.card-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title .icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.card-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: var(--text);
}

.form-group .hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--lighter);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.form-group input::placeholder {
  color: #94a3b8;
}

.required {
  color: var(--danger);
}

/* Checkbox styling */
.checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--light);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.checkbox-item:hover {
  background: #e0f2fe;
  border-color: var(--accent-light);
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: var(--accent);
  cursor: pointer;
}

.checkbox-item label {
  cursor: pointer;
  font-weight: 500;
  margin: 0;
}

.checkbox-item.warning {
  background: #fef3c7;
}

.checkbox-item.warning:hover {
  background: #fde68a;
  border-color: var(--warning);
}

/* Info Box */
.info-box {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  border-radius: var(--radius);
  padding: 20px 24px;
  margin-bottom: 24px;
}

.info-box h4 {
  color: var(--accent);
  margin-bottom: 12px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-box ul {
  margin-left: 24px;
  font-size: 0.9rem;
}

.info-box ul li {
  margin-bottom: 6px;
}

.info-box a {
  color: var(--accent);
  font-weight: 500;
}

/* Submit Button */
.submit-section {
  margin-top: 16px;
}

.submit-btn {
  width: 100%;
  padding: 18px 32px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn .icon {
  font-size: 1.3rem;
}

/* Loading State */
.submit-btn.loading {
  pointer-events: none;
  opacity: 0.85;
}

.submit-btn.loading .btn-text {
  display: none;
}

.submit-btn .loading-text {
  display: none;
}

.submit-btn.loading .loading-text {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.app-footer {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Quick Links */
.quick-links {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.quick-link {
  font-size: 0.8rem;
  color: var(--accent);
  text-decoration: none;
  padding: 4px 10px;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 6px;
  transition: all 0.2s;
}

.quick-link:hover {
  background: rgba(37, 99, 235, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .app-header {
    padding: 32px 24px;
  }

  .app-header h1 {
    font-size: 1.75rem;
  }

  .card {
    padding: 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .checkbox-row {
    flex-direction: column;
  }

  .checkbox-item {
    width: 100%;
  }
}
`;

// ============================================================================
// REPORT STYLES
// ============================================================================

const REPORT_STYLES = `
${SHARED_STYLES}

/* Report-specific styles */
.report-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  padding: 40px;
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
  box-shadow: var(--shadow-xl);
}

.report-header h1 {
  font-size: 1.75rem;
  margin-bottom: 4px;
}

.report-header .subtitle {
  opacity: 0.85;
  font-size: 0.95rem;
}

.site-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.site-info-item {
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.site-info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.75;
  margin-bottom: 4px;
}

.site-info-value {
  font-size: 1.15rem;
  font-weight: 600;
}

/* Best Program Card */
.best-program-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid var(--success);
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 28px;
  box-shadow: var(--shadow);
}

.best-program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.best-program-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 10px;
}

.best-badge {
  background: var(--success);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.metric-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
}

.metric-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Comparison Table */
.table-container {
  overflow-x: auto;
  margin-top: 20px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.comparison-table th {
  background: var(--light);
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--primary);
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.comparison-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
}

.comparison-table tr:hover {
  background: #f8fafc;
}

.comparison-table tr.highlight {
  background: #ecfdf5;
}

.comparison-table tr.highlight:hover {
  background: #d1fae5;
}

.comparison-table .number {
  text-align: right;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.feasible {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.gap {
  background: #fee2e2;
  color: #991b1b;
}

/* Detail Cards */
.detail-grid {
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
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.detail-list li:last-child {
  border-bottom: none;
}

.detail-list .label {
  color: var(--text-muted);
}

.detail-list .value {
  font-weight: 600;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.detail-list .highlight-row {
  background: var(--light);
  margin: 0 -20px;
  padding: 12px 20px;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.action-btn.primary {
  background: var(--accent);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: white;
  color: var(--text);
  border: 2px solid var(--border);
}

.action-btn.secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Assumptions */
.assumptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.assumption-group h4 {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* Print Styles */
@media print {
  body {
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .container {
    max-width: 100%;
    padding: 0;
  }

  .actions-bar {
    display: none;
  }

  .card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
    margin-bottom: 16px;
  }

  .report-header {
    background: var(--primary) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .best-program-card {
    background: #ecfdf5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .app-footer {
    page-break-before: always;
  }
}

@media (max-width: 768px) {
  .report-header {
    padding: 24px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-value {
    font-size: 1.4rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
`;

// ============================================================================
// INPUT FORM PAGE
// ============================================================================

app.get('/', (req, res) => {
  const zones = Object.values(ZoneType).map(z =>
    `<option value="${z}">${z}</option>`
  ).join('');

  const heightDistricts = Object.values(HeightDistrict).map(h =>
    `<option value="${h}">${h.replace('HD_', 'HD ')}</option>`
  ).join('');

  const marketAreas = Object.values(MarketArea).map(m =>
    `<option value="${m}">${m.replace(/_/g, ' ')}</option>`
  ).join('');

  const tcacAreas = Object.values(TCACOpportunityArea).map(t =>
    `<option value="${t}">${t.replace(/_/g, ' ')}</option>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Land Residual Analysis | LA Development Tool</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏗️</text></svg>">
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="container">
    <header class="app-header">
      <div class="logo-area">
        <div class="logo-icon">🏗️</div>
        <div>
          <h1>Land Residual Analysis</h1>
          <p class="tagline">LA Development Feasibility Tool with LIHTC & Gap Financing</p>
        </div>
      </div>
    </header>

    <div class="info-box">
      <h4>📊 Data Sources for Input</h4>
      <ul>
        <li><a href="https://planning.lacity.gov/zimas/" target="_blank" rel="noopener">ZIMAS</a> — Zone, Height District, Fire Zone, Coastal Zone, Lot Size</li>
        <li><a href="https://belonging.berkeley.edu/2024-tcac-opportunity-map" target="_blank" rel="noopener">TCAC/HCD Map</a> — Opportunity Area designation</li>
        <li><a href="https://www.metro.net/riding/maps/" target="_blank" rel="noopener">LA Metro</a> — Transit distances (rail, bus)</li>
      </ul>
    </div>

    <form action="/analyze" method="POST" id="analysisForm">
      <!-- Site Information -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="icon">📍</span>
            Site Information
          </h2>
          <p class="card-subtitle">Enter the property details from ZIMAS</p>
        </div>

        <div class="form-grid">
          <div class="form-group full-width">
            <label>Property Address <span class="required">*</span></label>
            <input type="text" name="address" required placeholder="e.g., 1234 Wilshire Blvd, Los Angeles, CA 90017">
          </div>

          <div class="form-group">
            <label>Lot Size (SF) <span class="required">*</span></label>
            <span class="hint">ZIMAS → Property Info tab</span>
            <input type="number" name="lotSizeSF" required placeholder="e.g., 15000" min="1000" max="10000000">
          </div>

          <div class="form-group">
            <label>Base Zone <span class="required">*</span></label>
            <span class="hint">ZIMAS → Zoning tab</span>
            <select name="baseZone" required>
              <option value="">Select zone...</option>
              ${zones}
            </select>
          </div>

          <div class="form-group">
            <label>Height District <span class="required">*</span></label>
            <span class="hint">ZIMAS → Zoning tab (e.g., 1, 1L, 1VL, 2)</span>
            <select name="heightDistrict" required>
              <option value="">Select height district...</option>
              ${heightDistricts}
            </select>
          </div>

          <div class="form-group">
            <label>Market Area <span class="required">*</span></label>
            <span class="hint">Based on Community Plan Area</span>
            <select name="marketArea" required>
              <option value="">Select market area...</option>
              ${marketAreas}
            </select>
          </div>

          <div class="form-group">
            <label>TCAC Opportunity Area <span class="required">*</span></label>
            <span class="hint">TCAC/HCD Opportunity Map</span>
            <select name="tcacArea" required>
              <option value="">Select TCAC area...</option>
              ${tcacAreas}
            </select>
          </div>
        </div>
      </div>

      <!-- Transit Information -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="icon">🚇</span>
            Transit Proximity
          </h2>
          <p class="card-subtitle">Distance to transit affects density bonuses under TOC/SB 4</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Distance to Major Transit Stop (feet)</label>
            <span class="hint">Closest Metro Rail/Metrolink/high-freq bus</span>
            <input type="number" name="distanceToMajorTransitFeet" placeholder="e.g., 1320" min="0">
            <div class="quick-links">
              <a href="https://www.metro.net/riding/maps/" target="_blank" class="quick-link">Metro Map ↗</a>
            </div>
          </div>

          <div class="form-group">
            <label>Distance to Metro Rail (feet)</label>
            <span class="hint">A, B, C, D, E, K Lines</span>
            <input type="number" name="distanceToMetroRailFeet" placeholder="e.g., 1500" min="0">
          </div>

          <div class="form-group">
            <label>Distance to Metrolink (feet)</label>
            <span class="hint">Commuter rail stations</span>
            <input type="number" name="distanceToMetrolinkFeet" placeholder="Optional" min="0">
          </div>

          <div class="form-group">
            <label>Distance to High-Freq Bus (feet)</label>
            <span class="hint">Rapid lines with ≤15 min frequency</span>
            <input type="number" name="distanceToBusRouteFeet" placeholder="e.g., 800" min="0">
          </div>

          <div class="form-group full-width">
            <div class="checkbox-row">
              <label class="checkbox-item">
                <input type="checkbox" name="inVeryLowVehicleTravelArea" value="true">
                <span>In Very Low Vehicle Travel Area (VLVTA)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Constraints -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="icon">⚠️</span>
            Site Constraints
          </h2>
          <p class="card-subtitle">These may exclude the site from certain programs</p>
        </div>

        <div class="checkbox-row">
          <label class="checkbox-item warning">
            <input type="checkbox" name="inVHFHSZ" value="true">
            <span>Very High Fire Hazard Severity Zone</span>
          </label>
          <label class="checkbox-item warning">
            <input type="checkbox" name="inCoastalZone" value="true">
            <span>Coastal Zone</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" name="inSeaLevelRiseArea" value="true">
            <span>Sea Level Rise Area</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" name="adjacentToR1R2" value="true">
            <span>Adjacent to R1/R2 Zone</span>
          </label>
        </div>
      </div>

      <!-- Analysis Options -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="icon">⚙️</span>
            Analysis Options
          </h2>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Target Income Level</label>
            <span class="hint">For affordable unit rent calculations</span>
            <select name="incomeLevel">
              <option value="VLI" selected>Very Low Income (VLI - 50% AMI)</option>
              <option value="LI">Low Income (LI - 80% AMI)</option>
              <option value="MODERATE">Moderate (120% AMI)</option>
            </select>
          </div>

          <div class="form-group">
            <div class="checkbox-row" style="margin-top: 28px;">
              <label class="checkbox-item">
                <input type="checkbox" name="inDDAorQCT" value="true" checked>
                <span>In DDA or QCT (LIHTC 30% Basis Boost)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="submit-section">
        <button type="submit" class="submit-btn" id="submitBtn">
          <span class="btn-text">
            <span class="icon">📊</span>
            Generate Analysis Report
          </span>
          <span class="loading-text">
            <div class="spinner"></div>
            Analyzing...
          </span>
        </button>
      </div>
    </form>

    <footer class="app-footer">
      <p>Land Residual Analysis App — LA Real Estate Development Tool</p>
    </footer>
  </div>

  <script>
    document.getElementById('analysisForm').addEventListener('submit', function() {
      document.getElementById('submitBtn').classList.add('loading');
    });
  </script>
</body>
</html>
  `;

  res.send(html);
});

// ============================================================================
// ANALYZE ENDPOINT
// ============================================================================

app.post('/analyze', (req, res) => {
  try {
    const body = req.body;

    // Build site input from form data
    const site: SiteInput = {
      address: body.address,
      lotSizeSF: parseInt(body.lotSizeSF, 10),
      baseZone: body.baseZone as ZoneType,
      heightDistrict: body.heightDistrict as HeightDistrict,
      distanceToMajorTransitFeet: body.distanceToMajorTransitFeet ? parseInt(body.distanceToMajorTransitFeet, 10) : undefined,
      distanceToMetroRailFeet: body.distanceToMetroRailFeet ? parseInt(body.distanceToMetroRailFeet, 10) : undefined,
      distanceToMetrolinkFeet: body.distanceToMetrolinkFeet ? parseInt(body.distanceToMetrolinkFeet, 10) : undefined,
      distanceToBusRouteFeet: body.distanceToBusRouteFeet ? parseInt(body.distanceToBusRouteFeet, 10) : undefined,
      inVeryLowVehicleTravelArea: body.inVeryLowVehicleTravelArea === 'true',
      tcacArea: body.tcacArea as TCACOpportunityArea,
      marketArea: body.marketArea as MarketArea,
      inVHFHSZ: body.inVHFHSZ === 'true',
      inCoastalZone: body.inCoastalZone === 'true',
      inSeaLevelRiseArea: body.inSeaLevelRiseArea === 'true',
      adjacentToR1R2: body.adjacentToR1R2 === 'true',
    };

    // Run analysis
    const result = runFullAnalysis(
      site,
      body.incomeLevel as IncomeLevel || IncomeLevel.VLI,
      LA_DEFAULT_ASSUMPTIONS,
      {
        includeSubsidies: true,
        includeLIHTC: true,
        detailedOutput: false,
        showZoningBreakdown: true,
        inDDAorQCT: body.inDDAorQCT === 'true',
      },
      false
    );

    // Generate HTML report
    const html = generateReport(result);
    res.send(html);
  } catch (error: any) {
    res.status(400).send(generateErrorPage(error.message));
  }
});

// ============================================================================
// REPORT GENERATION
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

function generateReport(result: FullAnalysisResult): string {
  const site = result.site;
  const timestamp = new Date().toLocaleString();
  const best = result.withSubsidies[0];

  if (!best) {
    return generateErrorPage('No feasible development scenarios found for this site.');
  }

  const analysis = best.analysis;
  const landValue = best.subsidizedLandValue || analysis.recommendedLandValue || 0;
  const landPSF = landValue / site.lotSizeSF;

  // Comparison table rows
  const comparisonRows = result.withSubsidies.map((item, index) => {
    const isFirst = index === 0;
    const feasible = item.gap.isFeasible;
    return `
      <tr class="${isFirst ? 'highlight' : ''}">
        <td>${item.analysis.potential.program}${isFirst ? ' <span class="best-badge">BEST</span>' : ''}</td>
        <td class="number">${item.analysis.unitMix.totalUnits}</td>
        <td class="number">${formatPercent(item.analysis.potential.affordablePercent)}</td>
        <td class="number">${formatCurrency(item.analysis.revenue.netOperatingIncome)}</td>
        <td class="number">${formatCurrency(item.analysis.costs.totalDevelopmentCost)}</td>
        <td class="number">${item.lihtc.type !== 'none' ? item.lihtc.type.toUpperCase() : '—'}</td>
        <td class="number">${formatCurrency(item.gap.taxCreditEquity)}</td>
        <td class="number">${formatCurrency(item.gap.fundingGap)}</td>
        <td><span class="status-badge ${feasible ? 'feasible' : 'gap'}">${feasible ? '✓ Feasible' : '✗ Gap'}</span></td>
        <td class="number" style="font-weight: 700;">${formatCurrency(item.subsidizedLandValue || item.analysis.recommendedLandValue || 0)}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Report | ${site.address}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <style>${REPORT_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="actions-bar">
      <a href="/" class="action-btn secondary">← New Analysis</a>
      <button onclick="window.print()" class="action-btn primary">🖨️ Print Report</button>
    </div>

    <header class="report-header">
      <h1>Land Residual Analysis Report</h1>
      <p class="subtitle">LA Development Feasibility with LIHTC & Gap Financing</p>

      <div class="site-info-grid">
        <div class="site-info-item">
          <div class="site-info-label">Address</div>
          <div class="site-info-value">${site.address}</div>
        </div>
        <div class="site-info-item">
          <div class="site-info-label">Lot Size</div>
          <div class="site-info-value">${formatNumber(site.lotSizeSF)} SF</div>
        </div>
        <div class="site-info-item">
          <div class="site-info-label">Zoning</div>
          <div class="site-info-value">${site.baseZone} / ${site.heightDistrict.replace('HD_', 'HD ')}</div>
        </div>
        <div class="site-info-item">
          <div class="site-info-label">Market Area</div>
          <div class="site-info-value">${site.marketArea.replace(/_/g, ' ')}</div>
        </div>
        <div class="site-info-item">
          <div class="site-info-label">TCAC Area</div>
          <div class="site-info-value">${site.tcacArea.replace(/_/g, ' ')}</div>
        </div>
        <div class="site-info-item">
          <div class="site-info-label">Report Date</div>
          <div class="site-info-value">${timestamp}</div>
        </div>
      </div>
    </header>

    <!-- Best Program -->
    <div class="best-program-card">
      <div class="best-program-header">
        <h2 class="best-program-title">✓ ${analysis.potential.program}</h2>
        <span class="best-badge">Recommended</span>
      </div>

      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-value">${formatCurrency(landValue)}</div>
          <div class="metric-label">Land Value</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">$${landPSF.toFixed(0)}/SF</div>
          <div class="metric-label">Price per SF</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${analysis.unitMix.totalUnits}</div>
          <div class="metric-label">Total Units</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${formatPercent(analysis.potential.affordablePercent)}</div>
          <div class="metric-label">Affordable %</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${formatCurrency(analysis.revenue.netOperatingIncome)}</div>
          <div class="metric-label">Annual NOI</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${formatCurrency(best.gap.taxCreditEquity)}</div>
          <div class="metric-label">Tax Credit Equity</div>
        </div>
      </div>
    </div>

    <!-- Program Comparison -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">
          <span class="icon">📋</span>
          Program Comparison
        </h2>
      </div>
      <div class="table-container">
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
            ${comparisonRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Cards -->
    <div class="detail-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon">🏢</span>
            Development Program
          </h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Total Units</span><span class="value">${analysis.unitMix.totalUnits}</span></li>
          <li><span class="label">Market Rate Units</span><span class="value">${analysis.unitMix.marketUnits}</span></li>
          <li><span class="label">Affordable Units</span><span class="value">${analysis.unitMix.affordableUnits}</span></li>
          <li><span class="label">Income Level</span><span class="value">${analysis.potential.incomeLevel}</span></li>
          <li><span class="label">Buildable SF</span><span class="value">${formatNumber(analysis.potential.buildableSF)} SF</span></li>
          <li><span class="label">Avg Unit Size</span><span class="value">${Math.round(analysis.potential.buildableSF / analysis.unitMix.totalUnits)} SF</span></li>
          <li><span class="label">FAR Achieved</span><span class="value">${analysis.potential.totalFAR.toFixed(2)}</span></li>
          <li><span class="label">Building Height</span><span class="value">${analysis.potential.totalHeightFeet ?? 'Unlimited'} ft</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon">💵</span>
            Annual Revenue
          </h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Gross Potential Rent</span><span class="value">${formatCurrency(analysis.revenue.grossPotentialRent)}</span></li>
          <li><span class="label">Less: Vacancy</span><span class="value">(${formatCurrency(analysis.revenue.vacancyLoss)})</span></li>
          <li><span class="label">Effective Gross Income</span><span class="value">${formatCurrency(analysis.revenue.effectiveGrossIncome)}</span></li>
          <li><span class="label">Less: Operating Expenses</span><span class="value">(${formatCurrency(analysis.revenue.operatingExpenses)})</span></li>
          <li class="highlight-row"><span class="label"><strong>Net Operating Income</strong></span><span class="value"><strong>${formatCurrency(analysis.revenue.netOperatingIncome)}</strong></span></li>
          <li><span class="label">NOI per Unit</span><span class="value">${formatCurrency(analysis.revenue.noiPerUnit)}</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon">🔨</span>
            Development Costs
          </h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Construction</span><span class="value">${formatCurrency(analysis.costs.constructionCost)}</span></li>
          <li><span class="label">Parking</span><span class="value">${formatCurrency(analysis.costs.parkingCost)}</span></li>
          <li><span class="label">Total Hard Costs</span><span class="value">${formatCurrency(analysis.costs.totalHardCosts)}</span></li>
          <li><span class="label">Soft Costs (${formatPercent(analysis.costs.softCostPercent)})</span><span class="value">${formatCurrency(analysis.costs.softCosts)}</span></li>
          <li><span class="label">AHLF Fee</span><span class="value">${formatCurrency(analysis.costs.ahlfFee)}</span></li>
          <li><span class="label">Permits & Fees</span><span class="value">${formatCurrency(analysis.costs.permitFees)}</span></li>
          <li><span class="label">Construction Interest</span><span class="value">${formatCurrency(analysis.costs.constructionInterest)}</span></li>
          <li class="highlight-row"><span class="label"><strong>Total Dev Cost</strong></span><span class="value"><strong>${formatCurrency(analysis.costs.totalDevelopmentCost)}</strong></span></li>
          <li><span class="label">Cost per Unit</span><span class="value">${formatCurrency(analysis.costs.costPerUnit)}</span></li>
          <li><span class="label">Cost per SF</span><span class="value">$${analysis.costs.costPerSF.toFixed(0)}/SF</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon">💰</span>
            Sources & Uses
          </h3>
        </div>
        <ul class="detail-list">
          <li><span class="label">Total Development Cost</span><span class="value">${formatCurrency(best.gap.totalDevelopmentCost)}</span></li>
          <li><span class="label">Permanent Debt</span><span class="value">${formatCurrency(best.gap.permanentDebt)}</span></li>
          <li><span class="label">Tax Credit Equity</span><span class="value">${formatCurrency(best.gap.taxCreditEquity)}</span></li>
          <li><span class="label">Deferred Developer Fee</span><span class="value">${formatCurrency(best.gap.deferredDeveloperFee)}</span></li>
          <li class="highlight-row"><span class="label"><strong>Total Sources</strong></span><span class="value"><strong>${formatCurrency(best.gap.totalSources)}</strong></span></li>
          <li style="color: ${best.gap.isFeasible ? 'var(--success)' : 'var(--danger)'};">
            <span class="label"><strong>Funding Gap</strong></span>
            <span class="value"><strong>${formatCurrency(best.gap.fundingGap)} (${formatPercent(best.gap.gapAsPercentOfCost)})</strong></span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Assumptions -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <span class="icon">📐</span>
          Key Assumptions
        </h3>
      </div>
      <div class="assumptions-grid">
        <div class="assumption-group">
          <h4>Revenue</h4>
          <ul class="detail-list">
            <li><span class="label">Market Rent</span><span class="value">$4.25/SF/mo</span></li>
            <li><span class="label">Vacancy Rate</span><span class="value">5%</span></li>
            <li><span class="label">OpEx Ratio</span><span class="value">35%</span></li>
          </ul>
        </div>
        <div class="assumption-group">
          <h4>Construction</h4>
          <ul class="detail-list">
            <li><span class="label">Hard Cost</span><span class="value">$320/SF</span></li>
            <li><span class="label">Soft Cost</span><span class="value">28-30%</span></li>
            <li><span class="label">Duration</span><span class="value">18 months</span></li>
          </ul>
        </div>
        <div class="assumption-group">
          <h4>Returns</h4>
          <ul class="detail-list">
            <li><span class="label">Target YOC</span><span class="value">5.5%</span></li>
            <li><span class="label">Exit Cap Rate</span><span class="value">5.5%</span></li>
            <li><span class="label">Dev Profit</span><span class="value">15%</span></li>
          </ul>
        </div>
        <div class="assumption-group">
          <h4>Tax Credits</h4>
          <ul class="detail-list">
            <li><span class="label">9% Credit Rate</span><span class="value">9.0%</span></li>
            <li><span class="label">4% Credit Rate</span><span class="value">4.0%</span></li>
            <li><span class="label">DDA/QCT Boost</span><span class="value">+30%</span></li>
          </ul>
        </div>
      </div>
    </div>

    <footer class="app-footer">
      <p><strong>Land Residual Analysis App</strong></p>
      <p>Report generated ${timestamp}</p>
      <p style="margin-top: 12px; font-size: 0.8rem; color: #94a3b8;">
        This analysis is for informational purposes only. Consult with professionals before making investment decisions.
      </p>
    </footer>
  </div>
</body>
</html>
  `;
}

function generateErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Error</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="card" style="text-align: center; padding: 60px 40px;">
      <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
      <h1 style="color: var(--danger); margin-bottom: 16px;">Analysis Error</h1>
      <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 1.1rem;">${message}</p>
      <a href="/" class="action-btn primary" style="display: inline-flex;">← Try Again</a>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         LAND RESIDUAL ANALYSIS - WEB APPLICATION              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Server running at: http://localhost:${PORT}`);
  console.log('');
  console.log('  Open this URL in your browser to use the app.');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('');
});

export default app;
