/**
 * IBC Construction Type Data (2024 IBC / 2025 CBC)
 *
 * Sources:
 * - IBC 2024 Table 504.3 (Allowable Building Height in Feet)
 * - IBC 2024 Table 504.4 (Allowable Number of Stories)
 * - IBC 2024 Table 601 (Fire-Resistance Requirements)
 * - California Building Code 2025 (Title 24 Part 2)
 *
 * NOTE: Values shown are for R-2 occupancy (multifamily) with NFPA 13 sprinkler
 * system throughout, which is required for most multifamily in California.
 */

import { ConstructionType } from '../types';

// ============================================================================
// CONSTRUCTION TYPE LIMITS
// Per IBC 2024 Tables 504.3 and 504.4 for R-2 with NFPA 13 sprinklers
// ============================================================================

export interface ConstructionTypeLimits {
  type: ConstructionType;
  name: string;
  description: string;
  maxHeightFeet: number | null;  // null = unlimited
  maxStories: number | null;     // null = unlimited
  structuralSystem: string;
  fireRating: string;            // Fire resistance rating
  costFactorMultiplier: number;  // Relative to Type V-A baseline (1.0)
  typicalUse: string;
}

/**
 * IBC Construction Type Limits for R-2 Multifamily (Sprinklered)
 *
 * IMPORTANT: These are BASE limits. Additional increases may apply:
 * - +20 ft height for NFPA 13 (already included in these figures)
 * - +1 story for NFPA 13 (already included)
 * - California allows additional +10 ft and +1 story for Type III-A with
 *   3-hour rated first floor assembly (podium construction)
 */
export const CONSTRUCTION_TYPE_LIMITS: ConstructionTypeLimits[] = [
  // ============================================================================
  // TYPE I: Non-combustible (Steel/Concrete)
  // ============================================================================
  {
    type: ConstructionType.TYPE_IA,
    name: 'Type I-A',
    description: 'Non-combustible, highest fire resistance',
    maxHeightFeet: null,  // Unlimited
    maxStories: null,     // Unlimited
    structuralSystem: 'Steel frame or cast-in-place concrete',
    fireRating: '3-hour structural, 2-hour floor',
    costFactorMultiplier: 1.57,  // ~$550/SF vs $350/SF baseline
    typicalUse: 'High-rise 20+ stories',
  },
  {
    type: ConstructionType.TYPE_IB,
    name: 'Type I-B',
    description: 'Non-combustible, high fire resistance',
    maxHeightFeet: 180,
    maxStories: 12,
    structuralSystem: 'Steel frame or concrete',
    fireRating: '2-hour structural, 2-hour floor',
    costFactorMultiplier: 1.43,  // ~$500/SF
    typicalUse: 'High-rise 7-20 stories',
  },

  // ============================================================================
  // TYPE II: Non-combustible (Lighter construction)
  // ============================================================================
  {
    type: ConstructionType.TYPE_IIA,
    name: 'Type II-A',
    description: 'Non-combustible with fire protection',
    maxHeightFeet: 85,
    maxStories: 5,
    structuralSystem: 'Steel frame with fire protection',
    fireRating: '1-hour structural',
    costFactorMultiplier: 1.29,  // ~$450/SF
    typicalUse: 'Mid-rise 5-6 stories (concrete podium)',
  },
  {
    type: ConstructionType.TYPE_IIB,
    name: 'Type II-B',
    description: 'Non-combustible, no fire protection',
    maxHeightFeet: 75,
    maxStories: 4,
    structuralSystem: 'Unprotected steel',
    fireRating: '0-hour (non-rated)',
    costFactorMultiplier: 1.21,  // ~$425/SF
    typicalUse: 'Low-rise commercial/industrial with residential',
  },

  // ============================================================================
  // TYPE III: Mixed (Exterior non-combustible, interior combustible)
  // Most common for "5-over-1" and "5-over-2" podium construction in LA
  // ============================================================================
  {
    type: ConstructionType.TYPE_IIIA,
    name: 'Type III-A',
    description: 'Exterior non-combustible, interior wood with 1-hr rating',
    maxHeightFeet: 85,  // Base 65 + 20 for sprinkler
    maxStories: 5,      // Base 4 + 1 for sprinkler
    structuralSystem: 'Concrete/steel podium with wood frame above',
    fireRating: '1-hour structural',
    costFactorMultiplier: 1.14,  // ~$400/SF - Most common mid-rise
    typicalUse: '"5-over-1" podium: 5 stories wood over 1-2 stories concrete',
  },
  {
    type: ConstructionType.TYPE_IIIB,
    name: 'Type III-B',
    description: 'Exterior non-combustible, interior wood unrated',
    maxHeightFeet: 75,
    maxStories: 4,
    structuralSystem: 'Mixed construction, unrated interior',
    fireRating: '0-hour interior',
    costFactorMultiplier: 1.07,  // ~$375/SF
    typicalUse: 'Low-rise mixed-use',
  },

  // ============================================================================
  // TYPE IV: Mass Timber (Added in 2021 IBC)
  // Growing in popularity for sustainable construction
  // ============================================================================
  {
    type: ConstructionType.TYPE_IVA,
    name: 'Type IV-A',
    description: 'Mass timber, fully protected (no exposed wood)',
    maxHeightFeet: 270,
    maxStories: 18,
    structuralSystem: 'Cross-laminated timber (CLT), glulam',
    fireRating: '3-hour structural',
    costFactorMultiplier: 1.50,  // Premium for tall timber
    typicalUse: 'Tall mass timber building (rare in LA currently)',
  },
  {
    type: ConstructionType.TYPE_IVB,
    name: 'Type IV-B',
    description: 'Mass timber, partially protected',
    maxHeightFeet: 180,
    maxStories: 12,
    structuralSystem: 'CLT with partial protection',
    fireRating: '2-hour structural',
    costFactorMultiplier: 1.36,
    typicalUse: 'Mid-rise mass timber',
  },
  {
    type: ConstructionType.TYPE_IVC,
    name: 'Type IV-C',
    description: 'Mass timber, exposed (full timber exposure)',
    maxHeightFeet: 85,
    maxStories: 8,
    structuralSystem: 'Exposed CLT/glulam',
    fireRating: '2-hour structural',
    costFactorMultiplier: 1.29,
    typicalUse: 'Low-rise mass timber with exposed wood aesthetic',
  },
  {
    type: ConstructionType.TYPE_IVHT,
    name: 'Type IV-HT (Heavy Timber)',
    description: 'Traditional heavy timber construction',
    maxHeightFeet: 85,
    maxStories: 5,
    structuralSystem: 'Heavy timber members',
    fireRating: '1-hour structural',
    costFactorMultiplier: 1.21,
    typicalUse: 'Traditional heavy timber (less common)',
  },

  // ============================================================================
  // TYPE V: Combustible (Wood Frame)
  // Most common and cost-effective for LA multifamily
  // ============================================================================
  {
    type: ConstructionType.TYPE_VA,
    name: 'Type V-A',
    description: 'Wood frame with 1-hour fire rating (sprinklered)',
    maxHeightFeet: 60,   // Base 50 + 10 for sprinkler
    maxStories: 4,       // Base 3 + 1 for sprinkler
    structuralSystem: 'Light wood frame (2x4, 2x6 studs)',
    fireRating: '1-hour structural',
    costFactorMultiplier: 1.0,  // BASELINE - $350/SF
    typicalUse: 'Garden-style apartments, townhomes, 3-4 story walk-ups',
  },
  {
    type: ConstructionType.TYPE_VB,
    name: 'Type V-B',
    description: 'Wood frame, unrated',
    maxHeightFeet: 50,
    maxStories: 3,
    structuralSystem: 'Light wood frame, unprotected',
    fireRating: '0-hour (non-rated)',
    costFactorMultiplier: 0.93,  // ~$325/SF
    typicalUse: 'Small apartments, residential over retail (limited)',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get construction type limits
 */
export function getConstructionTypeLimits(type: ConstructionType): ConstructionTypeLimits | null {
  return CONSTRUCTION_TYPE_LIMITS.find(t => t.type === type) || null;
}

/**
 * Determine the minimum required construction type for a given height/stories
 *
 * Returns the CHEAPEST (lowest cost) construction type that meets the requirements.
 * This is critical for feasibility - developers want the lowest-cost option.
 *
 * @param heightFeet - Required building height in feet
 * @param stories - Required number of stories
 * @returns The most cost-effective construction type, or null if impossible
 */
export function determineRequiredConstructionType(
  heightFeet: number,
  stories: number
): ConstructionType | null {
  // Sort by cost factor (cheapest first)
  const sorted = [...CONSTRUCTION_TYPE_LIMITS].sort(
    (a, b) => a.costFactorMultiplier - b.costFactorMultiplier
  );

  // Find the cheapest type that works
  for (const limits of sorted) {
    const heightOK = limits.maxHeightFeet === null || heightFeet <= limits.maxHeightFeet;
    const storiesOK = limits.maxStories === null || stories <= limits.maxStories;

    if (heightOK && storiesOK) {
      return limits.type;
    }
  }

  return null;  // No construction type can accommodate this building
}

/**
 * Get the maximum height allowed for a construction type
 */
export function getMaxHeightForType(type: ConstructionType): number | null {
  const limits = getConstructionTypeLimits(type);
  return limits?.maxHeightFeet ?? null;
}

/**
 * Get the maximum stories allowed for a construction type
 */
export function getMaxStoriesForType(type: ConstructionType): number | null {
  const limits = getConstructionTypeLimits(type);
  return limits?.maxStories ?? null;
}

/**
 * Get construction cost factor (multiplier relative to Type V-A baseline)
 */
export function getCostFactorForType(type: ConstructionType): number {
  const limits = getConstructionTypeLimits(type);
  return limits?.costFactorMultiplier ?? 1.0;
}

/**
 * Calculate hard cost per SF based on construction type and base cost
 *
 * @param type - Construction type
 * @param baseHardCostPSF - Base hard cost (typically Type V-A cost)
 * @returns Adjusted hard cost per SF
 */
export function calculateHardCostForType(
  type: ConstructionType,
  baseHardCostPSF: number
): number {
  const factor = getCostFactorForType(type);
  return Math.round(baseHardCostPSF * factor);
}

/**
 * Get all construction types that can accommodate a building
 *
 * Useful for showing developers their options and cost implications
 */
export function getViableConstructionTypes(
  heightFeet: number,
  stories: number
): ConstructionTypeLimits[] {
  return CONSTRUCTION_TYPE_LIMITS.filter(limits => {
    const heightOK = limits.maxHeightFeet === null || heightFeet <= limits.maxHeightFeet;
    const storiesOK = limits.maxStories === null || stories <= limits.maxStories;
    return heightOK && storiesOK;
  }).sort((a, b) => a.costFactorMultiplier - b.costFactorMultiplier);
}

/**
 * Check if a "podium" configuration is needed
 *
 * Podium construction (Type I podium with Type III or V above) is used
 * when a building exceeds Type V limits but wants to minimize cost.
 *
 * Common configurations in LA:
 * - 5-over-1: 5 stories Type III-A over 1 story Type I (parking/retail)
 * - 5-over-2: 5 stories Type III-A over 2 stories Type I (parking/retail)
 * - 4-over-1: 4 stories Type V-A over 1 story Type I
 */
export function isPodiumRecommended(stories: number): boolean {
  // Podium is typically used for 5-7 story buildings
  // Below 5 stories: Type V-A is cheaper
  // Above 7 stories: Full Type I-B or II-A is needed
  return stories >= 5 && stories <= 7;
}

/**
 * Get recommended construction configuration based on stories
 */
export function getRecommendedConfiguration(
  stories: number
): {
  constructionType: ConstructionType;
  configuration: string;
  notes: string;
} {
  if (stories <= 4) {
    return {
      constructionType: ConstructionType.TYPE_VA,
      configuration: 'Type V-A wood frame',
      notes: 'Most cost-effective for 1-4 stories. Consider at-grade or tuck-under parking.',
    };
  } else if (stories === 5) {
    return {
      constructionType: ConstructionType.TYPE_IIIA,
      configuration: '5-over-1 podium (5 Type III-A over 1 Type I)',
      notes: 'Standard LA mid-rise. 1 level retail/parking below 5 levels residential.',
    };
  } else if (stories === 6) {
    return {
      constructionType: ConstructionType.TYPE_IIIA,
      configuration: '5-over-2 podium (5 Type III-A over 2 Type I)',
      notes: '2 levels parking below 5 levels residential. Watch FAR limits.',
    };
  } else if (stories <= 8) {
    return {
      constructionType: ConstructionType.TYPE_IB,
      configuration: 'Type I-B concrete/steel',
      notes: 'Full non-combustible required above 6 stories. Significant cost increase.',
    };
  } else if (stories <= 12) {
    return {
      constructionType: ConstructionType.TYPE_IB,
      configuration: 'Type I-B high-rise',
      notes: 'High-rise construction. Requires full concrete/steel structure.',
    };
  } else {
    return {
      constructionType: ConstructionType.TYPE_IA,
      configuration: 'Type I-A high-rise',
      notes: 'Tall high-rise. Maximum fire resistance required. Highest construction cost.',
    };
  }
}
