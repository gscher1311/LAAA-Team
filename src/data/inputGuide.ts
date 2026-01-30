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

import { SiteInput, ZoneType, HeightDistrict, MarketArea, TCACOpportunityArea } from '../types';

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
