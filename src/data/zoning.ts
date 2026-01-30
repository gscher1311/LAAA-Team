/**
 * Base Zoning Reference Data
 *
 * SOURCES:
 * - LAMC Chapter 1, Article 2 (Zones and Restrictions): https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-107389
 * - LAMC 12.03 (Definitions): Density calculations
 * - LAMC 12.21.1 (General Provisions): Floor Area Ratio
 * - LAMC 12.21.A.4 (Parking): Parking requirements
 * - LA DCP "Generalized Summary of Zoning Regulations" (2023 edition)
 * - Height District Map: https://planning.lacity.gov/zoning/zoning-maps
 *
 * NOTES:
 * - Density in R3/R4/R5 zones = Lot Size / SF per Dwelling Unit
 * - FAR is Floor Area Ratio = Total Building SF / Lot SF
 * - Height Districts override zone-based height limits
 * - Commercial zones have no density limit; units limited by FAR/unit size
 */

import { ZoneType, ZoneStandards, HeightDistrict, HeightDistrictLimits } from '../types';

// ============================================================================
// ZONE STANDARDS
// Source: LAMC Chapter 1, Article 2; LA DCP Generalized Summary of Zoning Regulations
// ============================================================================

export const ZONE_STANDARDS: ZoneStandards[] = [
  // ============================================================================
  // RESIDENTIAL ESTATE ZONES (RE)
  // Source: LAMC 12.07.01
  // ============================================================================
  {
    zone: ZoneType.RE9,
    densitySFperDU: 9000,  // 1 unit per 9,000 SF
    baseFAR: 0.35,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 25,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RE11,
    densitySFperDU: 11000,
    baseFAR: 0.35,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 25,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RE15,
    densitySFperDU: 15000,
    baseFAR: 0.35,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 25,
    sideYardFeet: 5,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RE20,
    densitySFperDU: 20000,
    baseFAR: 0.3,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 25,
    sideYardFeet: 10,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RE40,
    densitySFperDU: 40000,
    baseFAR: 0.25,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 30,
    sideYardFeet: 10,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // RS (Suburban Residential) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RS,
    densitySFperDU: 7500,  // 7,500 SF per lot per Appendix E
    baseFAR: 3.0,  // HD-1 limit
    maxHeightFeet: 33,  // Per Appendix E
    maxStories: null,  // Height-limited
    frontYardFeet: 20,  // 20 ft min
    sideYardFeet: 5,   // Same as RE9-11
    rearYardFeet: 15,
    parkingPerUnit: 2,  // 2 covered spaces
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // RU (Residential Urban - Small Lot) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RU,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 3.0,
    maxHeightFeet: 30,  // Per Appendix E
    maxStories: null,
    frontYardFeet: 10,
    sideYardFeet: 3,   // 3 ft per Appendix E
    rearYardFeet: 10,
    parkingPerUnit: 2,  // 2 covered spaces
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // RZ ZONES (Residential Zero Side Yard) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RZ2_5,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 3.0,
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,
    frontYardFeet: 10,  // 10 ft min
    sideYardFeet: 0,   // Zero (3) + 1 ft per story over 2nd
    rearYardFeet: 15,  // Zero (3) or 15 ft
    parkingPerUnit: 2,  // 2 covered spaces
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RZ3,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 10,
    sideYardFeet: 0,
    rearYardFeet: 15,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RZ4,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 10,
    sideYardFeet: 0,
    rearYardFeet: 15,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Residential Agricultural (RA)
  {
    zone: ZoneType.RA,
    densitySFperDU: 17500,  // 2.5 units per acre
    baseFAR: 0.3,
    maxHeightFeet: 36,
    maxStories: 2,
    frontYardFeet: 25,
    sideYardFeet: 10,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // SINGLE-FAMILY RESIDENTIAL (R1, R2)
  // Source: LAMC 12.08
  // ============================================================================
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
  // Two-Family Residential - Source: Appendix E
  {
    zone: ZoneType.R2,
    densitySFperDU: 2500,  // 2,500 SF per DU per Appendix E
    baseFAR: 3.0,  // HD-1 limit
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,  // Unlimited (height-limited)
    frontYardFeet: 15,  // 20% lot depth, 20 ft max
    sideYardFeet: 5,    // 10% lot width < 50 ft; 5 ft; 3 ft min
    rearYardFeet: 15,
    parkingPerUnit: 2,  // 2 spaces, one covered
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
  // ============================================================================
  // RD ZONES (Restricted Density) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RD1_5,
    densitySFperDU: 1500,
    baseFAR: 3.0,  // HD-1 limit
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,  // Unlimited (height-limited)
    frontYardFeet: 15,
    sideYardFeet: 5,   // 10% lot width < 50 ft; 5 ft; 3 ft min + 1 ft/story over 2nd, max 16 ft
    rearYardFeet: 15,
    parkingPerUnit: 1,  // 1 space/unit < 3 hab rooms; 1.5 for 3 rooms; 2 for > 3 rooms
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RD2,
    densitySFperDU: 2000,
    baseFAR: 3.0,
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
  {
    zone: ZoneType.RD3,
    densitySFperDU: 3000,
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 15,
    sideYardFeet: 5,   // 10% lot width, 10 ft max; 5 ft min
    rearYardFeet: 15,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RD4,
    densitySFperDU: 4000,
    baseFAR: 3.0,
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
  {
    zone: ZoneType.RD5,
    densitySFperDU: 5000,
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 20,
    sideYardFeet: 10,  // 10 ft min per Appendix E
    rearYardFeet: 25,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RD6,
    densitySFperDU: 6000,
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 20,
    sideYardFeet: 10,
    rearYardFeet: 25,
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // RW ZONES (Residential Waterways) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RW1,
    densitySFperDU: null,  // 1 unit per lot
    baseFAR: 3.0,
    maxHeightFeet: 30,  // Per Appendix E
    maxStories: null,  // Height-limited only
    frontYardFeet: 10,  // 10 ft min per Appendix E
    sideYardFeet: 3,   // 10% lot width, 3 ft min
    rearYardFeet: 15,  // 15 ft min
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.RW2,
    densitySFperDU: 1150,  // 1,150 SF/DU per Appendix E
    baseFAR: 3.0,
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,
    frontYardFeet: 10,  // 10 ft min
    sideYardFeet: 3,   // 10% lot width < 50 ft; 3 ft min + 1 ft/story over 2nd
    rearYardFeet: 15,  // 15 ft
    parkingPerUnit: 2,  // 2 covered spaces
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // ============================================================================
  // RMP (Mobile Home Park) - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.RMP,
    densitySFperDU: 20000,  // 20,000 SF per unit
    baseFAR: 3.0,
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,
    frontYardFeet: 25,  // 20% lot depth, 25 ft max
    sideYardFeet: 10,
    rearYardFeet: 25,  // 25% lot depth, 25 ft max
    parkingPerUnit: 2,  // 2 covered spaces
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
  // Commercial/Residential CR - Source: Appendix E
  {
    zone: ZoneType.CR,
    densitySFperDU: 400,  // Same as R4 per Appendix E
    baseFAR: 1.5,  // C/M zones get 1.5:1 in HD-1
    maxHeightFeet: 75,  // 75 ft, 6 stories per Appendix E
    maxStories: 6,
    frontYardFeet: 10,  // 10 ft min
    sideYardFeet: 5,   // 10% lot width, 5 ft min for corner/adjacent to R
    rearYardFeet: 15,  // 15 ft min + 1 ft per story over 3rd
    parkingPerUnit: 1,
    allowsResidential: true,
    isCommercial: true,
    isManufacturing: false,
  },
  // Commercial/Manufacturing CM - Source: Appendix E
  {
    zone: ZoneType.CM,
    densitySFperDU: 800,  // Uses R3 density (800 SF/DU) per Appendix E
    baseFAR: 1.5,
    maxHeightFeet: null,  // Unlimited
    maxStories: null,
    frontYardFeet: 0,     // None for commercial
    sideYardFeet: 0,      // None for commercial; R4 for residential
    rearYardFeet: 0,      // R3 for residential
    parkingPerUnit: 1,
    allowsResidential: true,  // R3 uses allowed
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
  // ============================================================================
  // AGRICULTURAL ZONES - Source: Appendix E
  // ============================================================================
  {
    zone: ZoneType.A1,
    densitySFperDU: 108900,  // 2.5 acres (108,900 SF) per DU per Appendix E
    baseFAR: 3.0,  // HD-1 limit
    maxHeightFeet: 45,  // Per Appendix E
    maxStories: null,  // Unlimited (height-limited)
    frontYardFeet: 25,  // 20% lot depth, 25 ft max
    sideYardFeet: 10,   // 10% lot width, 25 ft max
    rearYardFeet: 25,   // 25% lot depth, 25 ft max
    parkingPerUnit: 2,  // 2 spaces per DU
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  {
    zone: ZoneType.A2,
    densitySFperDU: 43560,  // 1 acre (43,560 SF) per DU per Appendix E
    baseFAR: 3.0,
    maxHeightFeet: 45,
    maxStories: null,
    frontYardFeet: 25,
    sideYardFeet: 10,
    rearYardFeet: 25,
    parkingPerUnit: 2,
    allowsResidential: true,
    isCommercial: false,
    isManufacturing: false,
  },
  // Open Space - Source: LAMC 12.04
  {
    zone: ZoneType.OS,
    densitySFperDU: null,
    baseFAR: 0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Parks, recreation
    isCommercial: false,
    isManufacturing: false,
  },
  // Public Facilities - Source: Appendix E
  {
    zone: ZoneType.PF,
    densitySFperDU: null,
    baseFAR: 3.0,  // Varies by use
    maxHeightFeet: null,  // None per Appendix E
    maxStories: null,
    frontYardFeet: 0,     // None per Appendix E
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Government, schools, etc.
    isCommercial: false,
    isManufacturing: false,
  },
  // Submerged Lands - Source: Appendix E
  {
    zone: ZoneType.SL,
    densitySFperDU: null,
    baseFAR: 0,
    maxHeightFeet: null,
    maxStories: null,
    frontYardFeet: 0,
    sideYardFeet: 0,
    rearYardFeet: 0,
    parkingPerUnit: 0,
    allowsResidential: false,  // Navigation, shipping, fishing, recreation
    isCommercial: false,
    isManufacturing: false,
  },
];

// ============================================================================
// HEIGHT DISTRICT LIMITS
// Source: LAMC 12.21.1 (FAR by Height District)
// See: https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-117259
//
// Height District  |  FAR Limit  |  Height Limit
// ---------------  |  ---------  |  ------------
// 1                |  Zone FAR   |  Zone Height
// 1L               |  3:1        |  75 ft
// 1VL              |  1.5:1      |  45 ft
// 1XL              |  1:1        |  30 ft
// 1SS              |  3:1        |  30 ft
// 2                |  6:1        |  No limit
// 3                |  10:1       |  No limit
// 4                |  13:1       |  No limit
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
  return [ZoneType.R1, ZoneType.RU, ZoneType.RW1, ZoneType.RZ2_5, ZoneType.RZ3, ZoneType.RZ4].includes(zone) ||
    zone.startsWith('RE') || zone === ZoneType.RS || zone === ZoneType.RA;
}

// ============================================================================
// TRANSITIONAL HEIGHT RULES
// Source: LAMC Section 12.21.1 A 10 (Appendix E, page 7)
//
// Portions of buildings in C or M zones within certain distances of RW1 or
// more restrictive zones shall not exceed the following height limits:
//   Distance 0-49 ft:   25 ft max
//   Distance 50-99 ft:  33 ft max
//   Distance 100-199 ft: 61 ft max
// ============================================================================

export interface TransitionalHeightLimit {
  minDistanceFeet: number;
  maxDistanceFeet: number;
  maxHeightFeet: number;
}

export const TRANSITIONAL_HEIGHT_LIMITS: TransitionalHeightLimit[] = [
  { minDistanceFeet: 0, maxDistanceFeet: 49, maxHeightFeet: 25 },
  { minDistanceFeet: 50, maxDistanceFeet: 99, maxHeightFeet: 33 },
  { minDistanceFeet: 100, maxDistanceFeet: 199, maxHeightFeet: 61 },
];

/**
 * Calculate transitional height limit for C/M zone adjacent to residential
 * @param distanceToRZoneFeet Distance in feet from the R zone boundary
 * @param baseZone The base zone of the subject property
 * @returns Maximum height in feet, or null if no transitional limit applies
 */
export function getTransitionalHeightLimit(
  distanceToRZoneFeet: number,
  baseZone: ZoneType
): number | null {
  // Only applies to C and M zones
  const standards = getZoneStandards(baseZone);
  if (!standards) return null;
  if (!standards.isCommercial && !standards.isManufacturing) return null;

  // Find applicable transitional height limit
  const limit = TRANSITIONAL_HEIGHT_LIMITS.find(
    l => distanceToRZoneFeet >= l.minDistanceFeet && distanceToRZoneFeet <= l.maxDistanceFeet
  );

  return limit?.maxHeightFeet ?? null;
}

/**
 * Check if a zone is more restrictive than RW1 (triggers transitional height)
 * More restrictive means: A1, A2, RA, RE, RS, R1, R2, RZ, RU, RD zones
 */
export function isMoreRestrictiveThanRW1(zone: ZoneType): boolean {
  const restrictiveZones = [
    ZoneType.A1, ZoneType.A2, ZoneType.RA,
    ZoneType.RE9, ZoneType.RE11, ZoneType.RE15, ZoneType.RE20, ZoneType.RE40,
    ZoneType.RS, ZoneType.R1, ZoneType.R2, ZoneType.RU,
    ZoneType.RZ2_5, ZoneType.RZ3, ZoneType.RZ4,
    ZoneType.RD1_5, ZoneType.RD2, ZoneType.RD3, ZoneType.RD4, ZoneType.RD5, ZoneType.RD6,
    ZoneType.RW1,
  ];
  return restrictiveZones.includes(zone);
}
