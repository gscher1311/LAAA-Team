/**
 * Base Zoning Reference Data
 * From "Generalized Summary of Zoning Regulations" and LAMC Chapter 1
 */

import { ZoneType, ZoneStandards, HeightDistrict, HeightDistrictLimits } from '../types';

// ============================================================================
// ZONE STANDARDS (From E Generalized Summary of Zoning Regulations.pdf)
// ============================================================================

export const ZONE_STANDARDS: ZoneStandards[] = [
  // Single-Family Residential
  {
    zone: ZoneType.R1,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 0.5,
    maxHeightFeet: 33,
    maxStories: 2,
    frontYardFeet: 20,  // 20% of lot depth, min 15ft, max 20ft
    sideYardFeet: 5,
    rearYardFeet: 15,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Two-Family Residential
  {
    zone: ZoneType.R2,
    densitySFperDU: null,  // 2 units per lot
    baseFAR: 0.5,
    maxHeightFeet: 33,
    maxStories: 2,
    frontYardFeet: 15,
    sideYardFeet: 5,
    rearYardFeet: 15,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Multi-Family R3
  {
    zone: ZoneType.R3,
    densitySFperDU: 800,
    baseFAR: 3.0,  // May be limited by height district
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 15,
    sideYardFeet: 5,
    rearYardFeet: 15,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Multi-Family R4
  {
    zone: ZoneType.R4,
    densitySFperDU: 400,
    baseFAR: 3.0,  // May be limited by height district
    maxHeightFeet: null,  // No limit in zone, use height district
    maxStories: null,
    frontYardFeet: 15,
    sideYardFeet: 5,
    rearYardFeet: 15,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Multi-Family R5
  {
    zone: ZoneType.R5,
    densitySFperDU: 200,
    baseFAR: 13.0,  // May be limited by height district
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 15,
    sideYardFeet: 5,
    rearYardFeet: 15,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Residential/Accessory Services RAS3
  {
    zone: ZoneType.RAS3,
    densitySFperDU: 800,
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 5,
    sideYardFeet: 5,  // 0 if abutting commercial
    rearYardFeet: 5,  // 0 if abutting commercial
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,  // Allows ground floor commercial
    isManufacturing: false,
  },
  // Residential/Accessory Services RAS4
  {
    zone: ZoneType.RAS4,
    densitySFperDU: 400,
    baseFAR: 3.0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 5,
    sideYardFeet: 5,
    rearYardFeet: 5,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  // RD Zones (Restricted Density)
  {
    zone: ZoneType.RD1_5,
    densitySFperDU: 1500,
    baseFAR: 0.5,
    maxHeightFeet: 33,
    maxStories: 2,
    frontYardFeet: 20,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RD2,
    densitySFperDU: 2000,
    baseFAR: 0.5,
    maxHeightFeet: 33,
    maxStories: 2,
    frontYardFeet: 20,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RD3,
    densitySFperDU: 3000,
    baseFAR: 0.5,
    maxHeightFeet: 33,
    maxStories: 2,
    frontYardFeet: 20,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Commercial Zones
  {
    zone: ZoneType.C1,
    densitySFperDU: null,  // No density limit
    baseFAR: 1.5,
    maxHeightFeet: 45,  // May vary
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,  // 20ft if abutting R zone
    parkingPerUnit: 1,
    allowsResidential: true,  // By conditional use
    isCommercial: true,
    isManufacturing: false,
  },
  {
    zone: ZoneType.C1_5,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  {
    zone: ZoneType.C2,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  {
    zone: ZoneType.C4,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  {
    zone: ZoneType.C5,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  // Commercial/Residential CR
  {
    zone: ZoneType.CR,
    densitySFperDU: 400,
    baseFAR: 3.0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 20,  // If abutting R zone
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  // Commercial/Manufacturing CM
  {
    zone: ZoneType.CM,
    densitySFperDU: 400,  // Uses R4 density when residential allowed
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 5,
    rearYardFeet: 0,
    parkingPerUnit: 1,
    allowsResidential: true,  // By CUP or per overlay
    isCommercial: true,
    isManufacturing: true,
  },
  // Manufacturing Zones
  {
    zone: ZoneType.M1,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Generally not allowed
    isCommercial: false,
    isManufacturing: true,
  },
  {
    zone: ZoneType.M2,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,
    isCommercial: false,
    isManufacturing: true,
  },
  {
    zone: ZoneType.M3,
    densitySFperDU: null,
    baseFAR: 10.0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,
    isCommercial: false,
    isManufacturing: true,
  },
  // Hybrid Industrial
  {
    zone: ZoneType.MR1,
    densitySFperDU: null,
    baseFAR: 1.5,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Per overlay only
    isCommercial: true,
    isManufacturing: true,
  },
  {
    zone: ZoneType.MR2,
    densitySFperDU: null,
    baseFAR: 3.0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Per overlay only
    isCommercial: true,
    isManufacturing: true,
  },
  // Parking Zones
  {
    zone: ZoneType.P,
    densitySFperDU: null,
    baseFAR: 0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Use adjacent zone standards under CHIP
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.PB,
    densitySFperDU: null,
    baseFAR: 0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,
    isCommercial: false,
    isManufacturing: false,
  },
];

// ============================================================================
// HEIGHT DISTRICT LIMITS
// ============================================================================

export const HEIGHT_DISTRICT_LIMITS: HeightDistrictLimits[] = [
  {
    district: HeightDistrict.HD_1,
    maxFAR: null,  // No FAR limit from height district
    maxHeightFeet: null,  // Use zone limit
  },
  {
    district: HeightDistrict.HD_1L,
    maxFAR: 3.0,
    maxHeightFeet: 75,
  },
  {
    district: HeightDistrict.HD_1VL,
    maxFAR: 1.5,
    maxHeightFeet: 45,
  },
  {
    district: HeightDistrict.HD_1XL,
    maxFAR: 1.0,
    maxHeightFeet: 30,
  },
  {
    district: HeightDistrict.HD_1SS,
    maxFAR: 3.0,
    maxHeightFeet: 30,
  },
  {
    district: HeightDistrict.HD_2,
    maxFAR: 6.0,
    maxHeightFeet: null,  // No height limit
  },
  {
    district: HeightDistrict.HD_3,
    maxFAR: 10.0,
    maxHeightFeet: null,
  },
  {
    district: HeightDistrict.HD_4,
    maxFAR: 13.0,
    maxHeightFeet: null,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get zone standards for a given zone type
 */
export function getZoneStandards(zone: ZoneType): ZoneStandards | null {
  return ZONE_STANDARDS.find(z => z.zone === zone) || null;
}

/**
 * Get height district limits
 */
export function getHeightDistrictLimits(district: HeightDistrict): HeightDistrictLimits | null {
  return HEIGHT_DISTRICT_LIMITS.find(h => h.district === district) || null;
}

/**
 * Calculate base density for a site
 */
export function calculateBaseDensity(
  lotSizeSF: number,
  zone: ZoneType
): number {
  const standards = getZoneStandards(zone);
  if (!standards) return 0;

  // Handle fixed-unit zones (R1, R2)
  if (standards.densitySFperDU === null) {
    if (zone === ZoneType.R1) return 1;
    if (zone === ZoneType.R2) return 2;
    // Commercial zones with no density limit - use a reasonable default
    // In practice, limited by FAR and unit size
    return Math.floor(lotSizeSF / 400);  // Assume 400 SF/unit as default
  }

  // Calculate density from SF/DU requirement
  const baseUnits = lotSizeSF / standards.densitySFperDU;
  return Math.floor(baseUnits);  // Round down to whole units
}

/**
 * Calculate effective FAR considering height district
 */
export function calculateEffectiveFAR(
  zone: ZoneType,
  heightDistrict: HeightDistrict
): number {
  const zoneStandards = getZoneStandards(zone);
  const hdLimits = getHeightDistrictLimits(heightDistrict);

  if (!zoneStandards) return 0;

  const zoneFAR = zoneStandards.baseFAR;
  const hdFAR = hdLimits?.maxFAR ?? null;

  // Use the more restrictive (lower) FAR
  if (hdFAR === null || hdFAR === undefined) return zoneFAR;
  return Math.min(zoneFAR, hdFAR);
}

/**
 * Calculate effective height considering zone and height district
 */
export function calculateEffectiveHeight(
  zone: ZoneType,
  heightDistrict: HeightDistrict
): { maxFeet: number | null; maxStories: number | null } {
  const zoneStandards = getZoneStandards(zone);
  const hdLimits = getHeightDistrictLimits(heightDistrict);

  if (!zoneStandards) return { maxFeet: null, maxStories: null };

  const zoneHeight = zoneStandards.maxHeightFeet;
  const hdHeight = hdLimits?.maxHeightFeet ?? null;

  let effectiveHeight: number | null;
  if (zoneHeight === null && hdHeight === null) {
    effectiveHeight = null;  // No limit
  } else if (zoneHeight === null) {
    effectiveHeight = hdHeight;
  } else if (hdHeight === null || hdHeight === undefined) {
    effectiveHeight = zoneHeight;
  } else {
    effectiveHeight = Math.min(zoneHeight, hdHeight);
  }

  return {
    maxFeet: effectiveHeight,
    maxStories: zoneStandards.maxStories,
  };
}

/**
 * Check if zone is residential
 */
export function isResidentialZone(zone: ZoneType): boolean {
  return zone.startsWith('R') || zone === ZoneType.CR;
}

/**
 * Check if zone is commercial
 */
export function isCommercialZone(zone: ZoneType): boolean {
  const standards = getZoneStandards(zone);
  return standards?.isCommercial || false;
}

/**
 * Check if zone is single-family
 */
export function isSingleFamilyZone(zone: ZoneType): boolean {
  return [ZoneType.R1, ZoneType.RW1, ZoneType.RW2].includes(zone) ||
    zone.startsWith('RD');
}
