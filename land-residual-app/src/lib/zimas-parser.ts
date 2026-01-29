/**
 * ZIMAS PDF Parser
 * Extracts property information from LA City ZIMAS Parcel Profile PDFs
 */

export interface ZIMASData {
  // Property Identification
  propertyAddress: string;
  additionalAddresses: string[];
  apn: string;
  pin: string;
  tractNumber: string;
  block: string;
  lot: string;
  arb: string;

  // Physical Characteristics
  lotSizeSF: number;
  lotSizeAcres: number;

  // Zoning & Planning
  zoning: string;
  zoningInfo: string;
  generalPlanLandUse: string;
  generalPlanFootnote: string;
  hillsideArea: boolean;
  specificPlanArea: string;
  specialLandUseZoning: string;
  designReviewBoard: string;
  historicPreservationReviewYes: boolean;
  historicPreservationOverlayZone: boolean;
  otherHistoricDesignations: string[];
  otherHistoricSurveyInfo: string[];
  communityPlanArea: string;
  areasPlanningCommission: string;
  neighborhoodCouncil: string;
  councilDistrict: string;
  censusTrack: string;
  ladbs: string;

  // Housing Incentives
  tocTier: string;
  ahlfMarketArea: string;

  // Environmental/Hazards
  floodZone: boolean;
  fireDistrictNo1: boolean;
  veryHighFireHazardSeverityZone: boolean;
  fireBrushClearanceZone: boolean;
  floodZoneType: string;
  methaneZone: string;
  highWindVelocityArea: boolean;
  specialGradingArea: boolean;
  oilWellsInArea: boolean;
  seismicHazards: {
    activeFault: boolean;
    nearSourceZoneDistance: string;
    nearSourceZoneType: string;
    faultZone: boolean;
    liquefaction: boolean;
    landslide: boolean;
    tsunamiInundation: boolean;
  };

  // Rent Stabilization
  rsoArea: boolean;
  ellisMortgageRestrictions: boolean;
  affordableHousingRestrictions: boolean;

  // Airport/Coastal
  airportHazardArea: boolean;
  coastalZone: boolean;

  // Building Info (if available)
  buildingInfo: {
    yearBuilt?: number;
    numberOfUnits?: number;
    numberOfStories?: number;
    buildingArea?: number;
  };

  // Raw text for debugging
  rawText?: string;
}

/**
 * Parse ZIMAS PDF text content to extract property data
 */
export function parseZIMASText(text: string): Partial<ZIMASData> {
  const data: Partial<ZIMASData> = {
    additionalAddresses: [],
    otherHistoricDesignations: [],
    otherHistoricSurveyInfo: [],
    seismicHazards: {
      activeFault: false,
      nearSourceZoneDistance: '',
      nearSourceZoneType: '',
      faultZone: false,
      liquefaction: false,
      landslide: false,
      tsunamiInundation: false,
    },
    buildingInfo: {},
    rawText: text,
  };

  // Property Address - look for address pattern, stop at Tract/APN/PIN
  const addressMatch = text.match(/Address:\s*([^\n]+?)(?:\s+(?:Tract|APN|PIN|Block|Lot):|$)/i) ||
    text.match(/Address:\s*([^\n]+)/i);
  if (addressMatch) {
    // Clean up address - remove trailing Tract/Zoning info if captured
    let addr = addressMatch[1].trim();
    addr = addr.replace(/\s+Tract:.*$/i, '').replace(/\s+Zoning:.*$/i, '').trim();
    data.propertyAddress = addr;
  }

  // APN (Assessor Parcel Number) - formats: "APN: 1234567890" or "Assessor Parcel No. (APN) 1234567890"
  const apnMatch = text.match(/Assessor\s*Parcel\s*No\.?\s*\(APN\)\s*(\d{10})/i) ||
    text.match(/APN[:\s]+(\d{10})/i) ||
    text.match(/(\d{10})/);
  if (apnMatch) {
    data.apn = apnMatch[1];
  }

  // PIN
  const pinMatch = text.match(/PIN:\s*(\d+)/i);
  if (pinMatch) {
    data.pin = pinMatch[1];
  }

  // Lot Size - various formats in ZIMAS PDFs
  const lotSizePatterns = [
    /Lot\/Parcel\s*Area\s*\(Calculated\)\s*([\d,]+\.?\d*)\s*\(sq\s*ft\)/i, // "Lot/Parcel Area (Calculated) 19,496.3 (sq ft)"
    /Lot\s*Size\s*\(SF\)[:\s]*([\d,]+)/i,
    /Lot\s*Area\s*\(SF\)[:\s]*([\d,]+)/i,
    /Lot\s*Area\s*\(Calculated\)[:\s]*([\d,]+)/i,
    /Approx\.?\s*Lot\s*Area[^:]*[:\s]*([\d,]+)/i,
    /Parcel\s*Area[:\s]*([\d,]+\.?\d*)\s*\(sq\s*ft\)/i,
    /Parcel\s*Area[:\s]*([\d,]+)\s*(?:SF|sq\.?\s*ft)/i,
    /Area[:\s]*([\d,]+)\s*(?:SF|sq\.?\s*ft)/i,
    /Size[:\s]*([\d,]+)\s*(?:SF|sq\.?\s*ft)/i,
    /([\d,]+\.?\d*)\s*\(sq\s*ft\)/i, // "19,496.3 (sq ft)"
    /([\d,]+)\s*(?:SF|sq\.?\s*ft|square\s*feet)/i,
  ];

  for (const pattern of lotSizePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Handle decimal values like "19,496.3"
      const value = Math.round(parseFloat(match[1].replace(/,/g, '')));
      // Reasonable lot size range: 500 SF to 5,000,000 SF
      if (value >= 500 && value <= 5000000) {
        data.lotSizeSF = value;
        break;
      }
    }
  }

  const lotSizeAcresMatch = text.match(/Lot\s*Size\s*\(Acres\):\s*([\d.]+)/i);
  if (lotSizeAcresMatch) {
    data.lotSizeAcres = parseFloat(lotSizeAcresMatch[1]);
  }

  // Zoning
  const zoningMatch = text.match(/Zoning:\s*([A-Z0-9-]+)/i) ||
    text.match(/Zone:\s*([A-Z0-9-]+)/i);
  if (zoningMatch) {
    data.zoning = zoningMatch[1];
  }

  // General Plan Land Use
  const generalPlanMatch = text.match(/General\s*Plan\s*Land\s*Use:\s*([^\n]+)/i);
  if (generalPlanMatch) {
    data.generalPlanLandUse = generalPlanMatch[1].trim();
  }

  // TOC Tier - format: "Transit Oriented Communities (TOC) Tier 3"
  const tocMatch = text.match(/Transit\s*Oriented\s*Communities\s*\(TOC\)\s*(Tier\s*\d+)/i) ||
    text.match(/TOC[:\s]*(Tier\s*\d+)/i) ||
    text.match(/TOC\s*(?:Tier)?:?\s*(Tier\s*\d+|Not\s*in\s*TOC)/i);
  if (tocMatch) {
    data.tocTier = tocMatch[1].trim();
  }

  // AHLF Market Area - format: "Affordable Housing Linkage Fee Residential Market Area Medium"
  const ahlfMatch = text.match(/Affordable\s*Housing\s*Linkage\s*Fee\s*Residential\s*Market\s*Area\s*(\w+)/i) ||
    text.match(/Residential\s*Market\s*Area\s*(\w+)/i) ||
    text.match(/AHLF\s*Market\s*Area[:\s]*([^\n]+)/i);
  if (ahlfMatch) {
    data.ahlfMarketArea = ahlfMatch[1].trim();
  }

  // Hillside Area
  data.hillsideArea = /Hillside\s*Area:\s*Yes/i.test(text) ||
    /Hillside\s*Area\s*\(Zoning\s*Code\):\s*Yes/i.test(text);

  // Community Plan Area
  const communityPlanMatch = text.match(/Community\s*Plan\s*Area:\s*([^\n]+)/i);
  if (communityPlanMatch) {
    data.communityPlanArea = communityPlanMatch[1].trim();
  }

  // Council District
  const councilMatch = text.match(/Council\s*District:\s*(\d+)/i);
  if (councilMatch) {
    data.councilDistrict = councilMatch[1];
  }

  // RSO (Rent Stabilization Ordinance) Area - format: "Rent Stabilization Ordinance (RSO) Yes"
  data.rsoArea = /Rent\s*Stabilization\s*Ordinance\s*\(RSO\)\s*Yes/i.test(text) ||
    /RSO\s*Area:\s*Yes/i.test(text) ||
    /\(RSO\)\s*Yes/i.test(text);

  // Flood Zone
  data.floodZone = /Flood\s*Zone:\s*Yes/i.test(text) ||
    /Special\s*Flood\s*Hazard\s*Area:\s*Yes/i.test(text);

  // Fire Districts
  data.fireDistrictNo1 = /Fire\s*District\s*No\.?\s*1:\s*Yes/i.test(text);
  data.veryHighFireHazardSeverityZone = /Very\s*High\s*Fire\s*Hazard\s*Severity\s*Zone:\s*Yes/i.test(text);
  data.fireBrushClearanceZone = /Fire.*Brush.*Clearance.*Zone:\s*Yes/i.test(text);

  // Methane Zone
  const methaneMatch = text.match(/Methane\s*(?:Hazard\s*)?Zone:\s*([^\n]+)/i);
  if (methaneMatch) {
    data.methaneZone = methaneMatch[1].trim();
  }

  // High Wind Velocity Area
  data.highWindVelocityArea = /High\s*Wind\s*Velocity\s*Area:\s*Yes/i.test(text);

  // Seismic Hazards
  if (data.seismicHazards) {
    data.seismicHazards.activeFault = /Active\s*Fault\s*Near-Source\s*Zone:\s*Yes/i.test(text);
    data.seismicHazards.faultZone = /(?:Alquist-Priolo\s*)?Fault\s*Zone:\s*Yes/i.test(text);
    data.seismicHazards.liquefaction = /Liquefaction:\s*Yes/i.test(text);
    data.seismicHazards.landslide = /Landslide:\s*Yes/i.test(text);
    data.seismicHazards.tsunamiInundation = /Tsunami\s*Inundation\s*Zone:\s*Yes/i.test(text);
  }

  // Coastal Zone
  data.coastalZone = /Coastal\s*Zone:\s*Yes/i.test(text);

  // Airport Hazard Area
  data.airportHazardArea = /Airport\s*Hazard:\s*Yes/i.test(text);

  // Tract Number
  const tractMatch = text.match(/Tract:\s*([^\n]+)/i);
  if (tractMatch) {
    data.tractNumber = tractMatch[1].trim();
  }

  // Census Tract
  const censusMatch = text.match(/Census\s*Tract:\s*(\d+\.?\d*)/i);
  if (censusMatch) {
    data.censusTrack = censusMatch[1];
  }

  // Specific Plan Area
  const specificPlanMatch = text.match(/Specific\s*Plan\s*Area:\s*([^\n]+)/i);
  if (specificPlanMatch) {
    const value = specificPlanMatch[1].trim();
    data.specificPlanArea = value === 'None' ? '' : value;
  }

  return data;
}

/**
 * Convert ZIMAS data to DealInputs fields
 */
export function zimasToInputs(zimas: Partial<ZIMASData>): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  // Property Address
  if (zimas.propertyAddress) {
    inputs.propertyAddress = zimas.propertyAddress;
  }

  // Lot Size
  if (zimas.lotSizeSF) {
    inputs.lotSize = zimas.lotSizeSF;
  }

  // Zoning
  if (zimas.zoning) {
    inputs.zoning = zimas.zoning;
  }

  // TOC Tier - map to inputs
  if (zimas.tocTier) {
    const tierMatch = zimas.tocTier.match(/Tier\s*(\d+)/i);
    if (tierMatch) {
      inputs.tocTier = parseInt(tierMatch[1], 10);
    } else if (/not\s*in\s*toc/i.test(zimas.tocTier)) {
      inputs.tocTier = 0;
    }
  }

  // AHLF Market Area - determine fee rate
  if (zimas.ahlfMarketArea) {
    const area = zimas.ahlfMarketArea.toLowerCase();
    if (area.includes('high')) {
      inputs.ahlfRate = area.includes('medium') ? 15 : 18; // Medium-High vs High
    } else if (area.includes('medium')) {
      inputs.ahlfRate = 12;
    } else if (area.includes('low')) {
      inputs.ahlfRate = 8;
    }
  }

  // Hazard flags that might affect costs
  if (zimas.hillsideArea) {
    inputs.hillsideArea = true;
  }

  if (zimas.floodZone) {
    inputs.floodZone = true;
  }

  if (zimas.veryHighFireHazardSeverityZone) {
    inputs.fireHazardZone = true;
  }

  if (zimas.rsoArea !== undefined) {
    inputs.rsoArea = zimas.rsoArea;
  }

  return inputs;
}

/**
 * Validate extracted ZIMAS data
 */
export function validateZIMASData(data: Partial<ZIMASData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.propertyAddress) {
    errors.push('Property address not found');
  }

  if (!data.lotSizeSF || data.lotSizeSF <= 0) {
    errors.push('Lot size not found or invalid');
  }

  if (!data.zoning) {
    warnings.push('Zoning not found - manual entry required');
  }

  if (!data.tocTier) {
    warnings.push('TOC Tier not found - may need manual verification');
  }

  if (!data.ahlfMarketArea) {
    warnings.push('AHLF Market Area not found - fee rate may need adjustment');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format ZIMAS data for display
 */
export function formatZIMASDisplay(data: Partial<ZIMASData>): string {
  const lines: string[] = [];

  lines.push('=== ZIMAS Property Summary ===\n');

  if (data.propertyAddress) {
    lines.push(`Address: ${data.propertyAddress}`);
  }
  if (data.apn) {
    lines.push(`APN: ${data.apn}`);
  }
  if (data.lotSizeSF) {
    lines.push(`Lot Size: ${data.lotSizeSF.toLocaleString()} SF`);
  }

  lines.push('\n--- Zoning & Planning ---');
  if (data.zoning) {
    lines.push(`Zoning: ${data.zoning}`);
  }
  if (data.generalPlanLandUse) {
    lines.push(`General Plan: ${data.generalPlanLandUse}`);
  }
  if (data.tocTier) {
    lines.push(`TOC Tier: ${data.tocTier}`);
  }
  if (data.ahlfMarketArea) {
    lines.push(`AHLF Market Area: ${data.ahlfMarketArea}`);
  }
  if (data.communityPlanArea) {
    lines.push(`Community Plan: ${data.communityPlanArea}`);
  }

  lines.push('\n--- Property Flags ---');
  lines.push(`Hillside Area: ${data.hillsideArea ? 'Yes' : 'No'}`);
  lines.push(`RSO Area: ${data.rsoArea ? 'Yes' : 'No'}`);
  lines.push(`Flood Zone: ${data.floodZone ? 'Yes' : 'No'}`);
  lines.push(`Fire Hazard Zone: ${data.veryHighFireHazardSeverityZone ? 'Yes' : 'No'}`);

  return lines.join('\n');
}
