/**
 * Input Guide - Required Data for Land Residual Analysis
 *
 * This module documents all required inputs, their sources, and which
 * incentive programs use each input. Users MUST provide accurate data
 * for the analysis to be valid.
 *
 * ============================================================================
 * DATA SOURCES
 * ============================================================================
 *
 * 1. ZIMAS (Zoning Information & Map Access System)
 *    URL: https://planning.lacity.gov/zimas/
 *    Provides: Zone, Height District, Q/D/T Conditions, Overlays, Specific Plans
 *
 * 2. CHIP MAP (Community Housing Incentive Program)
 *    URL: https://planning.lacity.gov/chip-map
 *    Provides: Transit Tier (T-1/T-2/T-3), Opportunity Corridor (OC-1/2/3),
 *              Corridor Transition areas
 *
 * 3. TCAC Opportunity Map
 *    URL: https://www.treasurer.ca.gov/ctcac/opportunity.asp
 *    Provides: TCAC Resource Area (Highest/High/Moderate/Low)
 *
 * 4. LA Metro Transit Finder
 *    URL: https://developer.metro.net/
 *    Provides: Distance to Metro Rail, Metrolink, Bus Routes
 *
 * 5. LA County Assessor
 *    URL: https://assessor.lacounty.gov/
 *    Provides: APN, Lot Size
 *
 * 6. LAHD (Housing Dept) Market Area Map
 *    URL: https://housing.lacity.org/
 *    Provides: Affordable Housing Linkage Fee Market Area
 *
 * ============================================================================
 */

import { SiteInput, ZoneType, HeightDistrict, MarketArea, TCACOpportunityArea, EntitlementStage } from '../types';

// ============================================================================
// INPUT CATEGORIES
// ============================================================================

export interface InputField {
  name: keyof SiteInput;
  displayName: string;
  required: boolean;
  source: string;
  sourceUrl: string;
  description: string;
  howToFind: string;
  usedBy: string[];  // Which programs use this input
  example?: string;
  validValues?: string[];
  // Inline hints for UI display
  inlineHint?: string;           // Short hint shown next to input field
  quickLink?: string;            // Direct link to open data source
  quickLinkLabel?: string;       // Label for the quick link button
}

// ============================================================================
// REQUIRED INPUTS - MUST HAVE FOR ANY ANALYSIS
// ============================================================================

export const REQUIRED_INPUTS: InputField[] = [
  {
    name: 'address',
    displayName: 'Property Address',
    required: true,
    source: 'User / Title Report',
    sourceUrl: '',
    description: 'Full street address of the subject property',
    howToFind: 'Use the legal address from title report or assessor records',
    usedBy: ['All Programs'],
    example: '1234 Wilshire Blvd, Los Angeles, CA 90017',
    inlineHint: 'Use the exact legal address from title report',
  },
  {
    name: 'lotSizeSF',
    displayName: 'Lot Size (SF)',
    required: true,
    source: 'ZIMAS or LA County Assessor',
    sourceUrl: 'https://assessor.lacounty.gov/',
    description: 'Total lot area in square feet',
    howToFind: 'Enter APN in ZIMAS → Property Info tab → "Lot Size"',
    usedBy: ['All Programs - Density Calculation'],
    example: '15000',
    inlineHint: 'ZIMAS Property Info → "Lot Size" (in SF)',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Open ZIMAS',
  },
  {
    name: 'baseZone',
    displayName: 'Base Zone',
    required: true,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Base zoning classification (e.g., R3, R4, C2)',
    howToFind: 'Enter address in ZIMAS → Zoning tab → "Zone" field',
    usedBy: ['All Programs - Density, FAR, Height Limits'],
    example: 'R4',
    validValues: Object.values(ZoneType),
    inlineHint: 'ZIMAS Zoning tab → first part of zone code (e.g., "R4" from "R4-1L")',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Open ZIMAS',
  },
  {
    name: 'heightDistrict',
    displayName: 'Height District',
    required: true,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Height district designation (e.g., 1, 1L, 1VL, 2)',
    howToFind: 'ZIMAS → Zoning tab → Look for "Height District" (often shown as "1-VL" or "2")',
    usedBy: ['All Programs - FAR and Height Limits'],
    example: '1L',
    validValues: Object.values(HeightDistrict),
    inlineHint: 'ZIMAS Zoning tab → second part of zone code (e.g., "1L" from "R4-1L")',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Open ZIMAS',
  },
  {
    name: 'marketArea',
    displayName: 'Market Area (AHLF)',
    required: true,
    source: 'LAHD Affordable Housing Linkage Fee Map',
    sourceUrl: 'https://housing.lacity.org/',
    description: 'Market area for AHLF fee calculation',
    howToFind: 'Check LAHD website or AHLF fee schedule for market area designation by community plan',
    usedBy: ['All Programs - AHLF Fee', 'MIIP - Affordability Requirements'],
    example: 'HIGH',
    validValues: Object.values(MarketArea),
    inlineHint: 'Based on Community Plan area (HIGH/MED_HIGH in Westside, MED/LOW elsewhere)',
    quickLink: 'https://housing.lacity.org/developers/incentive-programs/inclusionary-housing',
    quickLinkLabel: 'LAHD Fee Schedule',
  },
  {
    name: 'tcacArea',
    displayName: 'TCAC Opportunity Area',
    required: true,
    source: 'TCAC Opportunity Map',
    sourceUrl: 'https://www.treasurer.ca.gov/ctcac/opportunity.asp',
    description: 'California Tax Credit Allocation Committee resource area designation',
    howToFind: 'Go to TCAC Opportunity Map → Enter address → Find "Resource Area" designation',
    usedBy: ['MIIP Opportunity (OC tier)', 'AHIP', 'MIIP Transit (A/B variant)'],
    example: 'HIGH',
    validValues: Object.values(TCACOpportunityArea),
    inlineHint: 'TCAC Map → "Resource Area" (HIGHEST/HIGH = OC-1, MODERATE = OC-2, LOW = OC-3)',
    quickLink: 'https://belonging.berkeley.edu/2024-tcac-opportunity-map',
    quickLinkLabel: 'Open TCAC Map',
  },
];

// ============================================================================
// TRANSIT DISTANCE INPUTS - REQUIRED FOR TRANSIT-ORIENTED PROGRAMS
// ============================================================================

export const TRANSIT_INPUTS: InputField[] = [
  {
    name: 'distanceToMajorTransitFeet',
    displayName: 'Distance to Major Transit Stop (feet)',
    required: true,
    source: 'LA Metro / Measurement',
    sourceUrl: 'https://developer.metro.net/',
    description: 'Walking distance in feet to nearest major transit stop (Metro Rail, Metrolink, or high-frequency bus)',
    howToFind: 'Use Google Maps or LA Metro website. Major transit = Metro Rail/Metrolink station OR bus stop with 15-min frequency. Measure walking distance, not straight line.',
    usedBy: ['State Density Bonus (parking/FAR)', 'MIIP Transit', 'AHIP', 'SB 79'],
    example: '1320 (1/4 mile = 1,320 ft, 1/2 mile = 2,640 ft)',
    inlineHint: '≤2,640 ft = no parking req (AB 2097). ≤1,320 ft = SB 79 Tier 1. Google Maps "walking" distance.',
    quickLink: 'https://www.metro.net/riding/maps/',
    quickLinkLabel: 'LA Metro Maps',
  },
  {
    name: 'distanceToMetroRailFeet',
    displayName: 'Distance to Metro Rail (feet)',
    required: false,
    source: 'LA Metro',
    sourceUrl: 'https://www.metro.net/',
    description: 'Walking distance to nearest Metro Rail station (Red, Purple, Gold, Blue, Expo, Green lines)',
    howToFind: 'Find nearest Metro Rail station on LA Metro map. Measure walking distance.',
    usedBy: ['MIIP Transit Tier Calculation'],
    example: '1000',
    inlineHint: '≤1,500 ft = T-1 tier. Includes A/B/C/D/E/K lines.',
    quickLink: 'https://www.metro.net/riding/maps/',
    quickLinkLabel: 'Metro Rail Map',
  },
  {
    name: 'distanceToMetrolinkFeet',
    displayName: 'Distance to Metrolink (feet)',
    required: false,
    source: 'Metrolink',
    sourceUrl: 'https://www.metrolinktrains.com/',
    description: 'Walking distance to nearest Metrolink commuter rail station',
    howToFind: 'Find nearest Metrolink station on their website. Measure walking distance.',
    usedBy: ['MIIP Transit Tier Calculation'],
    example: '1500',
    inlineHint: '≤1,500 ft = T-1 tier. Commuter rail to OC, Riverside, Ventura, etc.',
    quickLink: 'https://metrolinktrains.com/rider-info/general-info/maps/',
    quickLinkLabel: 'Metrolink Map',
  },
  {
    name: 'distanceToBusRouteFeet',
    displayName: 'Distance to High-Frequency Bus (feet)',
    required: false,
    source: 'LA Metro',
    sourceUrl: 'https://www.metro.net/',
    description: 'Walking distance to nearest high-frequency bus stop (15-min or better headways)',
    howToFind: 'Check LA Metro bus schedules. Find stops with 15-minute or better peak frequency.',
    usedBy: ['MIIP Transit Tier Calculation'],
    example: '800',
    inlineHint: 'Must have ≤15 min frequency. Rapid lines (7xx) typically qualify.',
    quickLink: 'https://www.metro.net/riding/schedules/',
    quickLinkLabel: 'Bus Schedules',
  },
  {
    name: 'inVeryLowVehicleTravelArea',
    displayName: 'In Very Low Vehicle Travel Area?',
    required: false,
    source: 'CHIP Map or SCAG',
    sourceUrl: 'https://planning.lacity.gov/chip-map',
    description: 'Whether site is in a designated Very Low Vehicle Travel Area (VLVTA)',
    howToFind: 'Check CHIP map for VLVTA designation OR SCAG VMT screening tool',
    usedBy: ['MIIP Transit T-3 (alternative eligibility)', 'AHIP'],
    example: 'true/false',
    inlineHint: 'Alternative eligibility for T-3 tier if not near rail/bus. Check CHIP map.',
    quickLink: 'https://planning.lacity.gov/chip-map',
    quickLinkLabel: 'CHIP Map',
  },
];

// ============================================================================
// Q/D/T CONDITIONS - CRITICAL OVERRIDES
// ============================================================================

export const QDT_INPUTS: InputField[] = [
  {
    name: 'hasQCondition',
    displayName: 'Has Q Condition?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether property has a Q (Qualified) condition limiting development',
    howToFind: 'ZIMAS → Zoning tab → Look for "Q" in zone string or "Q Conditions" section. CRITICAL: Q conditions can override base zoning!',
    usedBy: ['All Programs - May restrict height, FAR, density'],
    example: 'true',
  },
  {
    name: 'qConditionOrdinance',
    displayName: 'Q Condition Ordinance #',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Ordinance number for Q condition (e.g., "Ord. 187,712")',
    howToFind: 'ZIMAS → Q Conditions section → Note ordinance number. Look up full text for restrictions.',
    usedBy: ['All Programs'],
    example: 'Ord. 187,712',
  },
  {
    name: 'qConditionDescription',
    displayName: 'Q Condition Description',
    required: false,
    source: 'ZIMAS / City Clerk',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Text description of Q condition restrictions',
    howToFind: 'ZIMAS may show summary. For full text, search ordinance at LA City Clerk or DCP.',
    usedBy: ['All Programs'],
    example: 'Maximum 6 stories, 75 feet height limit, no drive-through uses',
  },
  {
    name: 'hasDLimitation',
    displayName: 'Has D Limitation?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether property has a D (Development) limitation',
    howToFind: 'ZIMAS → Zoning tab → Look for "D" in zone string',
    usedBy: ['All Programs - May restrict development'],
    example: 'true',
  },
  {
    name: 'hasTClassification',
    displayName: 'Has T Classification?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether property has a T (Tentative) classification - zoning may change',
    howToFind: 'ZIMAS → Zoning tab → Look for "T" in zone string. Indicates pending zone change.',
    usedBy: ['All Programs - Warning flag'],
    example: 'true',
  },
];

// ============================================================================
// OVERLAY AND SPECIFIC PLAN INPUTS
// ============================================================================

export const OVERLAY_INPUTS: InputField[] = [
  {
    name: 'specificPlan',
    displayName: 'Specific Plan',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Name of applicable Specific Plan (overrides base zoning)',
    howToFind: 'ZIMAS → Planning & Zoning tab → "Specific Plan" section. CRITICAL: Specific Plans override base zoning!',
    usedBy: ['All Programs - Specific Plan standards override base zoning'],
    example: 'Hollywood Community Plan',
  },
  {
    name: 'specificPlanSubarea',
    displayName: 'Specific Plan Subarea',
    required: false,
    source: 'ZIMAS / Specific Plan Document',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Subarea within Specific Plan (determines applicable standards)',
    howToFind: 'Check Specific Plan document for subarea designations',
    usedBy: ['All Programs'],
    example: 'Regional Center Commercial',
  },
  {
    name: 'inHPOZ',
    displayName: 'In HPOZ?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in a Historic Preservation Overlay Zone',
    howToFind: 'ZIMAS → Zoning tab → "HPOZ" section',
    usedBy: ['All Programs - Additional design review required'],
    example: 'true',
  },
  {
    name: 'inNSO',
    displayName: 'In NSO (Neighborhood Stabilization)?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in Neighborhood Stabilization Overlay',
    howToFind: 'ZIMAS → Zoning tab → Look for NSO designation',
    usedBy: ['All Programs - Demolition restrictions may apply'],
    example: 'true',
  },
  {
    name: 'inRFA',
    displayName: 'In RFA District?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in Residential Floor Area district',
    howToFind: 'ZIMAS → Zoning tab → "RFA" section',
    usedBy: ['By-Right - May affect FAR calculations'],
    example: 'true',
  },
];

// ============================================================================
// ENTITLEMENT STAGE INPUTS - AFFECTS SOFT COSTS
// ============================================================================

export const ENTITLEMENT_INPUTS: InputField[] = [
  {
    name: 'entitlementStage',
    displayName: 'Entitlement Stage',
    required: false,
    source: 'Seller / Due Diligence',
    sourceUrl: '',
    description: 'Current stage of entitlement/permitting - affects soft cost calculations',
    howToFind: 'Ask seller or check with LADBS for permit status. Default is RAW_LAND if unknown.',
    usedBy: ['All Programs - Soft Cost Calculation', 'Carry Cost Calculation'],
    example: 'RAW_LAND',
    validValues: Object.values(EntitlementStage),
    inlineHint: 'RAW=30%, ENTITLED=25%, PLAN_CHECK=18%, RTI=12%, PERMITTED=6% soft costs',
  },
];

/**
 * Entitlement stage descriptions for display
 */
export const ENTITLEMENT_STAGE_INFO = {
  [EntitlementStage.RAW_LAND]: {
    displayName: 'Raw Land (Unentitled)',
    softCostRange: '28-35%',
    typicalSoftCost: '30%',
    monthsToConstruction: '18-20',
    description: 'No plans submitted. Full entitlement process required.',
    whatsIncluded: ['Architecture/Engineering', 'Entitlement', 'Environmental', 'Permits', 'Impact Fees'],
  },
  [EntitlementStage.ENTITLED]: {
    displayName: 'Entitled',
    softCostRange: '22-28%',
    typicalSoftCost: '25%',
    monthsToConstruction: '8-10',
    description: 'Discretionary approvals done. Ready for permit submittal.',
    whatsIncluded: ['Permit-ready drawings', 'Permits', 'Impact Fees', 'Bonds'],
  },
  [EntitlementStage.PLAN_CHECK]: {
    displayName: 'In Plan Check',
    softCostRange: '15-22%',
    typicalSoftCost: '18%',
    monthsToConstruction: '4-5',
    description: 'Plans submitted to LADBS. Awaiting approval.',
    whatsIncluded: ['Plan check corrections', 'Remaining permits', 'Impact Fees', 'Bonds'],
  },
  [EntitlementStage.RTI]: {
    displayName: 'RTI (Ready to Issue)',
    softCostRange: '8-15%',
    typicalSoftCost: '12%',
    monthsToConstruction: '1-2',
    description: 'Plans approved. Permits ready upon fee payment.',
    whatsIncluded: ['Permit issuance fees', 'Bonds', 'Insurance'],
  },
  [EntitlementStage.PERMITTED]: {
    displayName: 'Permitted',
    softCostRange: '5-8%',
    typicalSoftCost: '6%',
    monthsToConstruction: '0',
    description: 'Permits issued. Ready to break ground.',
    whatsIncluded: ['Insurance', 'Project management', 'Contingency'],
  },
};

// ============================================================================
// CONSTRAINT INPUTS - EXCLUSIONS
// ============================================================================

export const CONSTRAINT_INPUTS: InputField[] = [
  {
    name: 'inVHFHSZ',
    displayName: 'In Very High Fire Hazard Severity Zone?',
    required: true,
    source: 'ZIMAS or Cal Fire',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in VHFHSZ - EXCLUDES from MIIP/AHIP',
    howToFind: 'ZIMAS → General tab → "Fire District" section OR Cal Fire FHSZ map',
    usedBy: ['MIIP (exclusion)', 'AHIP (exclusion)'],
    example: 'true/false',
    inlineHint: '⚠️ If TRUE, site is EXCLUDED from MIIP and AHIP programs',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Check ZIMAS',
  },
  {
    name: 'inCoastalZone',
    displayName: 'In Coastal Zone?',
    required: true,
    source: 'ZIMAS or California Coastal Commission',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in Coastal Zone - EXCLUDES from MIIP/AHIP',
    howToFind: 'ZIMAS → General tab → Look for Coastal Zone designation',
    usedBy: ['MIIP (exclusion)', 'AHIP (exclusion)'],
    example: 'true/false',
    inlineHint: '⚠️ If TRUE, site is EXCLUDED from MIIP and AHIP programs',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Check ZIMAS',
  },
  {
    name: 'inSeaLevelRiseArea',
    displayName: 'In Sea Level Rise Area?',
    required: false,
    source: 'ZIMAS or Coastal Commission',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site is in designated Sea Level Rise area',
    howToFind: 'Check coastal hazard maps or ZIMAS',
    usedBy: ['AHIP (exclusion)'],
    example: 'true/false',
    inlineHint: 'If TRUE, site is excluded from AHIP program',
  },
  {
    name: 'adjacentToR1R2',
    displayName: 'Adjacent to R1/R2 Zone?',
    required: false,
    source: 'ZIMAS',
    sourceUrl: 'https://planning.lacity.gov/zimas/',
    description: 'Whether site abuts single-family zoning (affects transitional height)',
    howToFind: 'Check ZIMAS for adjacent parcel zoning',
    usedBy: ['All Programs - Transitional height limits may apply'],
    example: 'true/false',
    inlineHint: 'Check ZIMAS for neighboring parcels. May trigger 45 ft / 6 story transitional limit.',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Check Neighbors',
  },
];

// ============================================================================
// PROGRAM-SPECIFIC REQUIREMENT MATRIX
// ============================================================================

export const PROGRAM_INPUT_REQUIREMENTS = {
  BY_RIGHT: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea'],
    recommended: ['hasQCondition', 'qConditionDescription', 'specificPlan'],
    optional: ['inHPOZ', 'inNSO', 'inRFA', 'adjacentToR1R2'],
  },
  STATE_DENSITY_BONUS: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea', 'distanceToMajorTransitFeet'],
    recommended: ['hasQCondition', 'qConditionDescription', 'specificPlan'],
    optional: ['tcacArea'],
    notes: 'distanceToMajorTransitFeet determines parking exemption (≤2,640 ft) and enhanced FAR',
  },
  MIIP_TRANSIT: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea', 'tcacArea',
               'distanceToMajorTransitFeet', 'inVHFHSZ', 'inCoastalZone'],
    recommended: ['distanceToMetroRailFeet', 'distanceToMetrolinkFeet', 'distanceToBusRouteFeet',
                  'inVeryLowVehicleTravelArea'],
    optional: ['hasQCondition', 'specificPlan'],
    notes: 'Transit tier (T-1/T-2/T-3) determined by distances. TCAC area determines A/B variant.',
  },
  MIIP_OPPORTUNITY: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea', 'tcacArea',
               'inVHFHSZ', 'inCoastalZone'],
    recommended: ['hasQCondition', 'specificPlan'],
    optional: [],
    notes: 'Opportunity tier (OC-1/2/3) determined by TCAC Resource Area. Must verify on CHIP map.',
  },
  MIIP_CORRIDOR: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea',
               'distanceToMajorTransitFeet'],
    recommended: ['tcacArea', 'hasQCondition'],
    optional: [],
    notes: 'Corridor tier determined by zone type. Must verify site is in Corridor Transition area on CHIP map.',
  },
  AHIP: {
    required: ['address', 'lotSizeSF', 'baseZone', 'heightDistrict', 'marketArea', 'tcacArea',
               'distanceToMajorTransitFeet', 'inVHFHSZ', 'inCoastalZone', 'inSeaLevelRiseArea'],
    recommended: ['inVeryLowVehicleTravelArea', 'hasQCondition', 'specificPlan'],
    optional: [],
    notes: 'AHIP is for 100% affordable projects (or 80% for Public Land/Faith-Based/Shared Equity)',
  },
  SB_79: {
    required: ['address', 'lotSizeSF', 'distanceToMajorTransitFeet'],
    recommended: ['baseZone', 'heightDistrict'],
    optional: [],
    notes: 'SB 79 effective July 1, 2026. Tier 1 = ≤1,320 ft (120 DU/acre), Tier 2 = ≤2,640 ft (100 DU/acre). Tier is calculated automatically from distance - user does not enter tier manually.',
  },
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate site input for completeness
 */
export function validateSiteInput(site: Partial<SiteInput>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check required fields
  if (!site.address) errors.push('Address is required');
  if (!site.lotSizeSF || site.lotSizeSF <= 0) errors.push('Lot size must be a positive number');
  if (!site.baseZone) errors.push('Base zone is required (from ZIMAS)');
  if (!site.heightDistrict) errors.push('Height district is required (from ZIMAS)');
  if (!site.marketArea) errors.push('Market area is required for AHLF fee calculation');
  if (!site.tcacArea) errors.push('TCAC Opportunity Area is required (from TCAC map)');

  // Check transit distance for transit-oriented programs
  if (site.distanceToMajorTransitFeet === undefined) {
    warnings.push('Distance to major transit not provided - transit-oriented programs cannot be evaluated');
  }

  // Check for Q/D/T conditions
  if (site.hasQCondition && !site.qConditionDescription) {
    warnings.push('Q condition flagged but no description provided - restrictions may not be applied');
  }

  // Check exclusion zones
  if (site.inVHFHSZ === undefined) {
    suggestions.push('Check if site is in Very High Fire Hazard Severity Zone (excludes from MIIP/AHIP)');
  }
  if (site.inCoastalZone === undefined) {
    suggestions.push('Check if site is in Coastal Zone (excludes from MIIP/AHIP)');
  }

  // Check for specific plan
  if (!site.specificPlan) {
    suggestions.push('Check ZIMAS for Specific Plan - may override base zoning standards');
  }

  // Check ZIMAS verification
  if (!site.zimasVerified) {
    warnings.push('Zoning data has not been verified against ZIMAS');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Format input guidance for display
 */
export function formatInputGuide(): string {
  const lines: string[] = [];
  const width = 100;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('LAND RESIDUAL ANALYSIS - REQUIRED INPUTS');
  lines.push('═'.repeat(width));
  lines.push('');

  lines.push('STEP 1: BASIC SITE INFORMATION');
  lines.push('─'.repeat(width));
  for (const input of REQUIRED_INPUTS) {
    lines.push(`• ${input.displayName}`);
    lines.push(`  Source: ${input.source}`);
    lines.push(`  How to find: ${input.howToFind}`);
    lines.push('');
  }

  lines.push('STEP 2: TRANSIT DISTANCES (Required for Transit Programs)');
  lines.push('─'.repeat(width));
  for (const input of TRANSIT_INPUTS) {
    const req = input.required ? '[REQUIRED]' : '[Optional]';
    lines.push(`• ${input.displayName} ${req}`);
    lines.push(`  Source: ${input.source}`);
    lines.push(`  How to find: ${input.howToFind}`);
    lines.push(`  Used by: ${input.usedBy.join(', ')}`);
    lines.push('');
  }

  lines.push('STEP 3: Q/D/T CONDITIONS (Critical - Can Override Zoning)');
  lines.push('─'.repeat(width));
  lines.push('⚠️  Q conditions can significantly restrict development. Always check ZIMAS.');
  lines.push('');
  for (const input of QDT_INPUTS) {
    lines.push(`• ${input.displayName}`);
    lines.push(`  How to find: ${input.howToFind}`);
    lines.push('');
  }

  lines.push('STEP 4: CONSTRAINTS (Exclusions from Incentive Programs)');
  lines.push('─'.repeat(width));
  for (const input of CONSTRAINT_INPUTS) {
    const req = input.required ? '[REQUIRED]' : '[Optional]';
    lines.push(`• ${input.displayName} ${req}`);
    lines.push(`  Used by: ${input.usedBy.join(', ')}`);
    lines.push('');
  }

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('DATA SOURCES');
  lines.push('═'.repeat(width));
  lines.push('');
  lines.push('1. ZIMAS (Zone, Height District, Q/D/T, Overlays)');
  lines.push('   https://planning.lacity.gov/zimas/');
  lines.push('');
  lines.push('2. CHIP Map (MIIP Transit/Opportunity/Corridor Areas)');
  lines.push('   https://planning.lacity.gov/chip-map');
  lines.push('');
  lines.push('3. TCAC Opportunity Map (Resource Area)');
  lines.push('   https://www.treasurer.ca.gov/ctcac/opportunity.asp');
  lines.push('');
  lines.push('4. LA Metro (Transit Distances)');
  lines.push('   https://www.metro.net/');
  lines.push('');
  lines.push('═'.repeat(width));

  return lines.join('\n');
}

/**
 * Get inputs required for a specific program
 */
export function getRequiredInputsForProgram(program: string): string[] {
  const requirements = PROGRAM_INPUT_REQUIREMENTS[program as keyof typeof PROGRAM_INPUT_REQUIREMENTS];
  return requirements?.required || [];
}

/**
 * Check if site has all required inputs for a program
 */
export function hasRequiredInputsForProgram(site: Partial<SiteInput>, program: string): {
  complete: boolean;
  missing: string[];
} {
  const required = getRequiredInputsForProgram(program);
  const missing: string[] = [];

  for (const field of required) {
    const value = site[field as keyof SiteInput];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}

// ============================================================================
// MULTI-PARCEL INPUT GUIDE
// ============================================================================

/**
 * Parcel-specific inputs required for multi-parcel assemblages
 */
export const PARCEL_INPUTS: InputField[] = [
  {
    name: 'apn' as keyof SiteInput,
    displayName: 'APN (Assessor Parcel Number)',
    required: true,
    source: 'ZIMAS or LA County Assessor',
    sourceUrl: 'https://assessor.lacounty.gov/',
    description: 'Unique parcel identifier from the County Assessor',
    howToFind: 'ZIMAS → Property Info tab → "APN" field. Format: ####-###-###',
    usedBy: ['Multi-Parcel Identification', 'Title/Due Diligence'],
    example: '5544-018-015',
    inlineHint: 'ZIMAS Property Info → APN (10-digit format)',
    quickLink: 'https://planning.lacity.gov/zimas/',
    quickLinkLabel: 'Open ZIMAS',
  },
];

/**
 * Shared inputs that apply to the entire assemblage
 */
export const SHARED_ASSEMBLY_INPUTS = [
  'address',
  'distanceToMajorTransitFeet',
  'distanceToMetroRailFeet',
  'distanceToMetrolinkFeet',
  'distanceToBusRouteFeet',
  'inVeryLowVehicleTravelArea',
  'tcacArea',
  'marketArea',
  'inVHFHSZ',
  'inCoastalZone',
  'inSeaLevelRiseArea',
  'adjacentToR1R2',
  'entitlementStage',
];

/**
 * Inputs that can vary per parcel
 */
export const PARCEL_SPECIFIC_INPUTS = [
  'apn',
  'lotSizeSF',
  'lotWidthFeet',
  'lotDepthFeet',
  'baseZone',
  'heightDistrict',
  'hasQCondition',
  'qConditionOrdinance',
  'qConditionDescription',
  'hasDLimitation',
  'dLimitationDescription',
  'specificPlan',
  'specificPlanSubarea',
  'inHPOZ',
  'inNSO',
  'inRFA',
];

/**
 * Format multi-parcel input section for the input guide
 */
export function formatMultiParcelGuide(): string {
  const lines: string[] = [];
  const width = 100;

  lines.push('');
  lines.push('═'.repeat(width));
  lines.push('MULTI-PARCEL ASSEMBLAGE INPUTS');
  lines.push('═'.repeat(width));
  lines.push('');

  lines.push('Use multi-parcel mode when your land deal includes 2+ contiguous parcels.');
  lines.push('');

  lines.push('STEP 1: CHOOSE ANALYSIS TYPE');
  lines.push('─'.repeat(width));
  lines.push('• Single Parcel: One APN, one zone analysis');
  lines.push('• Multi-Parcel:  2-10 APNs, combined or separate analysis');
  lines.push('');

  lines.push('STEP 2: FOR EACH PARCEL, ENTER:');
  lines.push('─'.repeat(width));
  lines.push('Required:');
  lines.push('  • APN (from ZIMAS or County Assessor)');
  lines.push('  • Lot Size SF (from ZIMAS Property Info)');
  lines.push('  • Base Zone (from ZIMAS Zoning tab)');
  lines.push('  • Height District (from ZIMAS Zoning tab)');
  lines.push('');
  lines.push('Optional (per parcel):');
  lines.push('  • Q Condition (if shown in ZIMAS)');
  lines.push('  • D Limitation (if shown in ZIMAS)');
  lines.push('  • Specific Plan (if applicable)');
  lines.push('  • HPOZ / NSO status');
  lines.push('');

  lines.push('STEP 3: ENTER SHARED INPUTS (same for all parcels):');
  lines.push('─'.repeat(width));
  lines.push('  • Primary Address (use main/corner address)');
  lines.push('  • Transit Distances (measure from center of assembled site)');
  lines.push('  • TCAC Opportunity Area');
  lines.push('  • Market Area (for AHLF fee)');
  lines.push('  • Fire Zone / Coastal Zone status');
  lines.push('  • Entitlement Stage');
  lines.push('');

  lines.push('STEP 4: CHOOSE ANALYSIS MODE:');
  lines.push('─'.repeat(width));
  lines.push('');
  lines.push('UNIFIED (Default - Best for most cases):');
  lines.push('  ✓ Treats all parcels as single development site');
  lines.push('  ✓ Uses most restrictive zoning across all parcels');
  lines.push('  ✓ Density bonus applies to combined lot size');
  lines.push('  ✓ Single land residual for entire assemblage');
  lines.push('');
  lines.push('PRO_RATA (When zones are similar):');
  lines.push('  ✓ Calculates area-weighted average for density/FAR');
  lines.push('  ✓ Good when parcels have slightly different zones');
  lines.push('  ✓ Example: 60% R4-1L + 40% R3-1L');
  lines.push('');
  lines.push('SEPARATE (When zones are incompatible):');
  lines.push('  ✓ Analyzes each parcel independently');
  lines.push('  ✓ Use when parcels have very different zones');
  lines.push('  ✓ Sums individual land values at end');
  lines.push('  ✓ Example: R4 commercial + R1 residential');
  lines.push('');

  lines.push('═'.repeat(width));

  return lines.join('\n');
}
