/**
 * Web Server for Land Residual Analysis App
 * Provides a web interface for the team to input properties and generate reports
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
import { generateHTMLReport } from '../output/htmlReport';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// INPUT FORM PAGE
// ============================================================================

app.get('/', (req, res) => {
  res.send(generateInputForm());
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
      false // Don't print to console
    );

    // Generate HTML report
    const html = generateHTMLReport(result);
    res.send(html);
  } catch (error: any) {
    res.status(400).send(`
      <html>
      <head><title>Error</title></head>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1 style="color: #e53e3e;">Analysis Error</h1>
        <p>${error.message}</p>
        <a href="/" style="color: #3182ce;">Go Back</a>
      </body>
      </html>
    `);
  }
});

// ============================================================================
// INPUT FORM HTML
// ============================================================================

function generateInputForm(): string {
  // Zone options
  const zones = Object.values(ZoneType).map(z =>
    `<option value="${z}">${z}</option>`
  ).join('');

  // Height district options
  const heightDistricts = Object.values(HeightDistrict).map(h =>
    `<option value="${h}">${h.replace('HD_', '')}</option>`
  ).join('');

  // Market area options
  const marketAreas = Object.values(MarketArea).map(m =>
    `<option value="${m}">${m}</option>`
  ).join('');

  // TCAC area options
  const tcacAreas = Object.values(TCACOpportunityArea).map(t =>
    `<option value="${t}">${t}</option>`
  ).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Land Residual Analysis - Input</title>
  <style>
    :root {
      --primary: #1a365d;
      --secondary: #2c5282;
      --accent: #3182ce;
      --light: #f7fafc;
      --border: #e2e8f0;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: var(--light);
      color: #1a202c;
      line-height: 1.6;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }

    .header h1 { font-size: 1.8rem; margin-bottom: 8px; }
    .header p { opacity: 0.9; }

    .form-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }

    .form-card h2 {
      color: var(--primary);
      font-size: 1.2rem;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 0.95rem;
    }

    .form-group .hint {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 6px;
    }

    .form-group input,
    .form-group select {
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 0;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    .submit-btn {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      padding: 16px 40px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3);
    }

    .required { color: #e53e3e; }

    .info-box {
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .info-box h4 {
      color: var(--secondary);
      margin-bottom: 8px;
    }

    .info-box ul {
      margin-left: 20px;
      font-size: 0.9rem;
    }

    .quick-link {
      display: inline-block;
      font-size: 0.8rem;
      color: var(--accent);
      text-decoration: none;
      margin-top: 4px;
    }

    .quick-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Land Residual Analysis</h1>
      <p>LA Real Estate Development Tool with LIHTC & Gap Financing</p>
    </div>

    <div class="info-box">
      <h4>Data Sources</h4>
      <ul>
        <li><a href="https://planning.lacity.gov/zimas/" target="_blank">ZIMAS</a> - Zone, Height District, Fire Zone, Coastal Zone</li>
        <li><a href="https://belonging.berkeley.edu/2024-tcac-opportunity-map" target="_blank">TCAC Map</a> - Opportunity Area</li>
        <li><a href="https://www.metro.net/riding/maps/" target="_blank">LA Metro</a> - Transit Distances</li>
      </ul>
    </div>

    <form action="/analyze" method="POST">
      <!-- Site Information -->
      <div class="form-card">
        <h2>Site Information</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Property Address <span class="required">*</span></label>
            <input type="text" name="address" required placeholder="1234 Wilshire Blvd, Los Angeles, CA 90017">
          </div>

          <div class="form-group">
            <label>Lot Size (SF) <span class="required">*</span></label>
            <span class="hint">ZIMAS Property Info tab</span>
            <input type="number" name="lotSizeSF" required placeholder="15000">
          </div>

          <div class="form-group">
            <label>Base Zone <span class="required">*</span></label>
            <span class="hint">ZIMAS Zoning tab (e.g., R3, R4, C2)</span>
            <select name="baseZone" required>
              <option value="">Select Zone...</option>
              ${zones}
            </select>
          </div>

          <div class="form-group">
            <label>Height District <span class="required">*</span></label>
            <span class="hint">ZIMAS Zoning tab (1, 1L, 1VL, 2)</span>
            <select name="heightDistrict" required>
              <option value="">Select Height District...</option>
              ${heightDistricts}
            </select>
          </div>

          <div class="form-group">
            <label>Market Area (AHLF) <span class="required">*</span></label>
            <span class="hint">Based on Community Plan area</span>
            <select name="marketArea" required>
              <option value="">Select Market Area...</option>
              ${marketAreas}
            </select>
          </div>

          <div class="form-group">
            <label>TCAC Opportunity Area <span class="required">*</span></label>
            <span class="hint">TCAC Map "Resource Area"</span>
            <select name="tcacArea" required>
              <option value="">Select TCAC Area...</option>
              ${tcacAreas}
            </select>
          </div>
        </div>
      </div>

      <!-- Transit Information -->
      <div class="form-card">
        <h2>Transit Information</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Distance to Major Transit (feet)</label>
            <span class="hint">Walking distance to Metro Rail/Metrolink/high-freq bus</span>
            <input type="number" name="distanceToMajorTransitFeet" placeholder="1320">
            <a href="https://www.metro.net/riding/maps/" target="_blank" class="quick-link">Open Metro Map</a>
          </div>

          <div class="form-group">
            <label>Distance to Metro Rail (feet)</label>
            <span class="hint">A/B/C/D/E/K lines</span>
            <input type="number" name="distanceToMetroRailFeet" placeholder="1500">
          </div>

          <div class="form-group">
            <label>Distance to Metrolink (feet)</label>
            <span class="hint">Commuter rail stations</span>
            <input type="number" name="distanceToMetrolinkFeet" placeholder="">
          </div>

          <div class="form-group">
            <label>Distance to High-Freq Bus (feet)</label>
            <span class="hint">Rapid lines with ≤15 min frequency</span>
            <input type="number" name="distanceToBusRouteFeet" placeholder="800">
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="inVeryLowVehicleTravelArea" value="true" id="vlvta">
              <label for="vlvta">In Very Low Vehicle Travel Area (VLVTA)</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Constraints / Exclusions -->
      <div class="form-card">
        <h2>Constraints & Exclusions</h2>
        <div class="form-grid">
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="inVHFHSZ" value="true" id="vhfhsz">
              <label for="vhfhsz" style="color: #e53e3e;">In Very High Fire Hazard Severity Zone</label>
            </div>
            <span class="hint">Excludes from MIIP/AHIP if checked</span>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="inCoastalZone" value="true" id="coastal">
              <label for="coastal" style="color: #e53e3e;">In Coastal Zone</label>
            </div>
            <span class="hint">Excludes from MIIP/AHIP if checked</span>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="inSeaLevelRiseArea" value="true" id="slr">
              <label for="slr">In Sea Level Rise Area</label>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="adjacentToR1R2" value="true" id="r1r2">
              <label for="r1r2">Adjacent to R1/R2 Zone</label>
            </div>
            <span class="hint">May trigger transitional height limits</span>
          </div>
        </div>
      </div>

      <!-- Analysis Options -->
      <div class="form-card">
        <h2>Analysis Options</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Target Income Level</label>
            <select name="incomeLevel">
              <option value="VLI" selected>Very Low Income (VLI - 50% AMI)</option>
              <option value="LI">Low Income (LI - 80% AMI)</option>
              <option value="MODERATE">Moderate (120% AMI)</option>
            </select>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" name="inDDAorQCT" value="true" id="dda" checked>
              <label for="dda">In DDA or QCT (LIHTC 30% Basis Boost)</label>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" class="submit-btn">Generate Analysis Report</button>
    </form>
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
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         LAND RESIDUAL ANALYSIS - WEB APP                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log('');
  console.log('  Open this URL in Chrome to use the app.');
  console.log('');
});

export default app;
