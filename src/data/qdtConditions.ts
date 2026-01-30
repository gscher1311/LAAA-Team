/**
 * Q/D/T Conditions Data
 *
 * LA Zoning Q/D/T Conditions from ZIMAS
 *
 * Q (Qualified) Classifications:
 * - Site-specific conditions imposed during zone changes
 * - Recorded with an ordinance number (e.g., "Ord. 186475")
 * - Can restrict: density, height, FAR, uses, setbacks, parking
 * - MUST be verified via full ordinance text
 *
 * D (Development) Limitations:
 * - Permanent development restrictions
 * - Often imposed by City Council as part of zone change approval
 * - Common restrictions: height limits, unit caps, FAR caps
 * - Usually more restrictive than base zoning
 *
 * T (Tentative) Classifications:
 * - Temporary designation pending completion of conditions
 * - May expire or convert to permanent zone
 * - Requires verification of current status
 *
 * Source: LA ZIMAS User Guide; LAMC 12.32
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type of Q/D/T restriction
 */
export enum QDTRestrictionType {
  HEIGHT_LIMIT = 'HEIGHT_LIMIT',
  STORY_LIMIT = 'STORY_LIMIT',
  FAR_LIMIT = 'FAR_LIMIT',
  DENSITY_LIMIT = 'DENSITY_LIMIT',
  UNIT_CAP = 'UNIT_CAP',
  USE_RESTRICTION = 'USE_RESTRICTION',
  SETBACK_REQUIREMENT = 'SETBACK_REQUIREMENT',
  PARKING_REQUIREMENT = 'PARKING_REQUIREMENT',
  DESIGN_REQUIREMENT = 'DESIGN_REQUIREMENT',
  LANDSCAPING = 'LANDSCAPING',
  OTHER = 'OTHER',
}

/**
 * Parsed Q/D/T condition that can modify calculations
 */
export interface QDTCondition {
  type: QDTRestrictionType;
  description: string;
  value?: number;          // Numeric value (e.g., 45 for 45 ft height limit)
  unit?: string;           // Unit of measurement (ft, stories, DU, %)
  ordinance?: string;      // Ordinance number
  isMoreRestrictive: boolean;  // True if more restrictive than base zoning
  overridesBaseZoning: boolean;
  notes?: string;
}

/**
 * Collection of Q/D/T conditions for a site
 */
export interface SiteQDTConditions {
  hasQCondition: boolean;
  qConditions: QDTCondition[];
  hasDLimitation: boolean;
  dLimitations: QDTCondition[];
  hasTClassification: boolean;
  tNotes?: string;
}

// ============================================================================
// COMMON Q CONDITION PATTERNS
// These are patterns commonly found in Q condition ordinances
// ============================================================================

/**
 * Common Q condition patterns and their effects
 * These help parse Q condition descriptions into actionable restrictions
 */
export const Q_CONDITION_PATTERNS: Array<{
  pattern: RegExp;
  type: QDTRestrictionType;
  extractValue: (match: RegExpMatchArray) => number | undefined;
  unit?: string;
  description: string;
}> = [
  // Height limits
  {
    pattern: /height.*(?:limited|restricted|maximum|not.*exceed).*?(\d+)\s*(?:ft|feet)/i,
    type: QDTRestrictionType.HEIGHT_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'ft',
    description: 'Height limited to {value} ft',
  },
  {
    pattern: /(?:not|no).*(?:exceed|more than).*?(\d+)\s*(?:ft|feet).*height/i,
    type: QDTRestrictionType.HEIGHT_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'ft',
    description: 'Height not to exceed {value} ft',
  },
  {
    pattern: /(\d+)\s*(?:ft|feet|foot).*height.*limit/i,
    type: QDTRestrictionType.HEIGHT_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'ft',
    description: 'Height limit of {value} ft',
  },

  // Story limits
  {
    pattern: /(?:limited|restricted|maximum).*?(\d+)\s*stor(?:y|ies)/i,
    type: QDTRestrictionType.STORY_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'stories',
    description: 'Limited to {value} stories',
  },
  {
    pattern: /(\d+)\s*stor(?:y|ies).*(?:limit|maximum|max)/i,
    type: QDTRestrictionType.STORY_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'stories',
    description: 'Maximum {value} stories',
  },
  {
    pattern: /not.*exceed.*?(\d+)\s*stor(?:y|ies)/i,
    type: QDTRestrictionType.STORY_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'stories',
    description: 'Not to exceed {value} stories',
  },

  // FAR limits
  {
    pattern: /FAR.*(?:limited|restricted|not.*exceed).*?(\d+(?:\.\d+)?)/i,
    type: QDTRestrictionType.FAR_LIMIT,
    extractValue: (m) => parseFloat(m[1]),
    unit: 'FAR',
    description: 'FAR limited to {value}',
  },
  {
    pattern: /(?:floor area ratio|FAR).*?(\d+(?:\.\d+)?):1/i,
    type: QDTRestrictionType.FAR_LIMIT,
    extractValue: (m) => parseFloat(m[1]),
    unit: 'FAR',
    description: 'FAR of {value}:1',
  },
  {
    pattern: /(\d+(?:\.\d+)?)\s*FAR.*(?:limit|maximum)/i,
    type: QDTRestrictionType.FAR_LIMIT,
    extractValue: (m) => parseFloat(m[1]),
    unit: 'FAR',
    description: 'FAR limit of {value}',
  },

  // Density/Unit limits
  {
    pattern: /(?:limited|restricted).*?(\d+)\s*(?:dwelling )?units?/i,
    type: QDTRestrictionType.UNIT_CAP,
    extractValue: (m) => parseInt(m[1]),
    unit: 'units',
    description: 'Limited to {value} units',
  },
  {
    pattern: /(?:not.*exceed|maximum).*?(\d+)\s*(?:dwelling )?units?/i,
    type: QDTRestrictionType.UNIT_CAP,
    extractValue: (m) => parseInt(m[1]),
    unit: 'units',
    description: 'Maximum {value} units',
  },
  {
    pattern: /(\d+)\s*(?:dwelling )?units?.*(?:max|limit)/i,
    type: QDTRestrictionType.UNIT_CAP,
    extractValue: (m) => parseInt(m[1]),
    unit: 'units',
    description: '{value} unit limit',
  },
  {
    pattern: /density.*(?:limited|restricted).*?(\d+)\s*(?:SF|sq\.?\s*ft)/i,
    type: QDTRestrictionType.DENSITY_LIMIT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'SF/DU',
    description: 'Density limited to {value} SF per DU',
  },

  // Setback requirements
  {
    pattern: /(?:front|side|rear).*setback.*?(\d+)\s*(?:ft|feet)/i,
    type: QDTRestrictionType.SETBACK_REQUIREMENT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'ft',
    description: 'Setback of {value} ft required',
  },

  // Parking requirements
  {
    pattern: /parking.*?(\d+(?:\.\d+)?)\s*(?:spaces?|stalls?).*(?:per|\/)\s*unit/i,
    type: QDTRestrictionType.PARKING_REQUIREMENT,
    extractValue: (m) => parseFloat(m[1]),
    unit: 'spaces/unit',
    description: '{value} parking spaces per unit',
  },
  {
    pattern: /(?:minimum|min).*?(\d+)\s*parking/i,
    type: QDTRestrictionType.PARKING_REQUIREMENT,
    extractValue: (m) => parseInt(m[1]),
    unit: 'spaces',
    description: 'Minimum {value} parking spaces',
  },
];

// ============================================================================
// COMMON D LIMITATION PATTERNS
// ============================================================================

/**
 * Common D limitation types
 */
export const D_LIMITATION_PATTERNS: Array<{
  pattern: RegExp;
  type: QDTRestrictionType;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
}> = [
  {
    pattern: /D.*height/i,
    type: QDTRestrictionType.HEIGHT_LIMIT,
    description: 'Development height limitation applies',
    severity: 'moderate',
  },
  {
    pattern: /D.*density/i,
    type: QDTRestrictionType.DENSITY_LIMIT,
    description: 'Development density limitation applies',
    severity: 'severe',
  },
  {
    pattern: /D.*FAR/i,
    type: QDTRestrictionType.FAR_LIMIT,
    description: 'Development FAR limitation applies',
    severity: 'severe',
  },
  {
    pattern: /D.*use/i,
    type: QDTRestrictionType.USE_RESTRICTION,
    description: 'Development use restriction applies',
    severity: 'moderate',
  },
];

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse a Q condition description into structured conditions
 *
 * @param description - The Q condition description from ZIMAS
 * @param ordinance - Optional ordinance number
 * @returns Array of parsed Q/D/T conditions
 */
export function parseQConditionDescription(
  description: string,
  ordinance?: string
): QDTCondition[] {
  const conditions: QDTCondition[] = [];

  for (const pattern of Q_CONDITION_PATTERNS) {
    const match = description.match(pattern.pattern);
    if (match) {
      const value = pattern.extractValue(match);
      conditions.push({
        type: pattern.type,
        description: pattern.description.replace('{value}', value?.toString() || ''),
        value,
        unit: pattern.unit,
        ordinance,
        isMoreRestrictive: true,  // Q conditions are typically more restrictive
        overridesBaseZoning: true,
        notes: `Parsed from: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`,
      });
    }
  }

  // If no patterns matched but there's text, add a generic condition
  if (conditions.length === 0 && description.trim().length > 0) {
    conditions.push({
      type: QDTRestrictionType.OTHER,
      description: description.substring(0, 200),
      isMoreRestrictive: true,
      overridesBaseZoning: true,
      ordinance,
      notes: 'Unparsed Q condition - manual review required',
    });
  }

  return conditions;
}

/**
 * Parse a D limitation description
 */
export function parseDLimitationDescription(
  description: string
): QDTCondition[] {
  const conditions: QDTCondition[] = [];

  for (const pattern of D_LIMITATION_PATTERNS) {
    if (pattern.pattern.test(description)) {
      conditions.push({
        type: pattern.type,
        description: pattern.description,
        isMoreRestrictive: true,
        overridesBaseZoning: true,
        notes: `Severity: ${pattern.severity}. Full text: "${description.substring(0, 100)}"`,
      });
    }
  }

  // Generic fallback
  if (conditions.length === 0 && description.trim().length > 0) {
    conditions.push({
      type: QDTRestrictionType.OTHER,
      description: `D Limitation: ${description.substring(0, 150)}`,
      isMoreRestrictive: true,
      overridesBaseZoning: true,
      notes: 'Unparsed D limitation - manual review required',
    });
  }

  return conditions;
}

// ============================================================================
// CALCULATION MODIFIERS
// ============================================================================

/**
 * Calculate modified development standards based on Q/D/T conditions
 *
 * @param baseStandards - Base zoning standards
 * @param conditions - Parsed Q/D/T conditions
 * @returns Modified standards with notes
 */
export interface ModifiedStandards {
  maxHeightFeet: number | null;
  maxStories: number | null;
  maxFAR: number | null;
  maxUnits: number | null;
  minSFperDU: number | null;
  parkingPerUnit: number | null;
  modifications: string[];
  warnings: string[];
}

export function applyQDTModifications(
  baseStandards: {
    maxHeightFeet: number | null;
    maxStories: number | null;
    maxFAR: number | null;
    maxUnits?: number | null;
    minSFperDU?: number | null;
    parkingPerUnit?: number | null;
  },
  conditions: QDTCondition[]
): ModifiedStandards {
  const modified: ModifiedStandards = {
    maxHeightFeet: baseStandards.maxHeightFeet,
    maxStories: baseStandards.maxStories,
    maxFAR: baseStandards.maxFAR,
    maxUnits: baseStandards.maxUnits ?? null,
    minSFperDU: baseStandards.minSFperDU ?? null,
    parkingPerUnit: baseStandards.parkingPerUnit ?? null,
    modifications: [],
    warnings: [],
  };

  for (const condition of conditions) {
    if (!condition.isMoreRestrictive) continue;

    switch (condition.type) {
      case QDTRestrictionType.HEIGHT_LIMIT:
        if (condition.value !== undefined) {
          const oldHeight = modified.maxHeightFeet;
          if (oldHeight === null || condition.value < oldHeight) {
            modified.maxHeightFeet = condition.value;
            modified.modifications.push(
              `Height reduced from ${oldHeight ?? 'unlimited'} ft to ${condition.value} ft per Q condition`
            );
          }
        }
        break;

      case QDTRestrictionType.STORY_LIMIT:
        if (condition.value !== undefined) {
          const oldStories = modified.maxStories;
          if (oldStories === null || condition.value < oldStories) {
            modified.maxStories = condition.value;
            modified.modifications.push(
              `Stories reduced from ${oldStories ?? 'unlimited'} to ${condition.value} per Q condition`
            );
          }
        }
        break;

      case QDTRestrictionType.FAR_LIMIT:
        if (condition.value !== undefined) {
          const oldFAR = modified.maxFAR;
          if (oldFAR === null || condition.value < oldFAR) {
            modified.maxFAR = condition.value;
            modified.modifications.push(
              `FAR reduced from ${oldFAR ?? 'unlimited'} to ${condition.value} per Q condition`
            );
          }
        }
        break;

      case QDTRestrictionType.UNIT_CAP:
        if (condition.value !== undefined) {
          modified.maxUnits = condition.value;
          modified.modifications.push(
            `Maximum units capped at ${condition.value} per Q condition`
          );
        }
        break;

      case QDTRestrictionType.DENSITY_LIMIT:
        if (condition.value !== undefined) {
          const oldSFperDU = modified.minSFperDU;
          if (oldSFperDU === null || condition.value > oldSFperDU) {
            modified.minSFperDU = condition.value;
            modified.modifications.push(
              `Minimum lot area per DU increased from ${oldSFperDU ?? 'N/A'} to ${condition.value} SF per Q condition`
            );
          }
        }
        break;

      case QDTRestrictionType.PARKING_REQUIREMENT:
        if (condition.value !== undefined) {
          modified.parkingPerUnit = condition.value;
          modified.modifications.push(
            `Parking requirement set to ${condition.value} spaces/unit per Q condition`
          );
        }
        break;

      case QDTRestrictionType.OTHER:
        modified.warnings.push(
          `Unparsed restriction: ${condition.description}. Manual review required.`
        );
        break;
    }
  }

  // Add warnings for unparsed or complex conditions
  if (modified.modifications.length === 0 && conditions.length > 0) {
    modified.warnings.push(
      'Q/D/T conditions present but could not be automatically parsed. ' +
      'Manual verification of ordinance text is strongly recommended.'
    );
  }

  return modified;
}

// ============================================================================
// EXPORTS FOR USE IN CALCULATORS
// ============================================================================

/**
 * Check if site has Q/D/T conditions that need manual review
 */
export function needsManualQDTReview(
  hasQ: boolean,
  hasD: boolean,
  hasT: boolean,
  qDescription?: string,
  dDescription?: string
): { needsReview: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (hasQ) {
    reasons.push('Site has Q (Qualified) condition - verify full ordinance text');
    if (qDescription) {
      const parsed = parseQConditionDescription(qDescription);
      if (parsed.some(p => p.type === QDTRestrictionType.OTHER)) {
        reasons.push('Q condition text could not be fully parsed - manual interpretation needed');
      }
    }
  }

  if (hasD) {
    reasons.push('Site has D (Development) limitation - may significantly restrict development');
  }

  if (hasT) {
    reasons.push('Site has T (Tentative) classification - zoning status may be pending');
  }

  return {
    needsReview: reasons.length > 0,
    reasons,
  };
}

/**
 * Generate Q/D/T warning summary for output
 */
export function generateQDTWarningSummary(
  conditions: SiteQDTConditions
): string {
  const lines: string[] = [];

  if (!conditions.hasQCondition && !conditions.hasDLimitation && !conditions.hasTClassification) {
    return ''; // No warnings needed
  }

  lines.push('');
  lines.push('⚠️  Q/D/T CONDITIONS DETECTED');
  lines.push('─'.repeat(50));

  if (conditions.hasQCondition) {
    lines.push('Q CONDITION (Qualified):');
    for (const q of conditions.qConditions) {
      lines.push(`  • ${q.description}`);
      if (q.ordinance) {
        lines.push(`    Ordinance: ${q.ordinance}`);
      }
    }
    lines.push('');
  }

  if (conditions.hasDLimitation) {
    lines.push('D LIMITATION (Development):');
    for (const d of conditions.dLimitations) {
      lines.push(`  • ${d.description}`);
    }
    lines.push('');
  }

  if (conditions.hasTClassification) {
    lines.push('T CLASSIFICATION (Tentative):');
    lines.push('  • Zone change may be pending');
    lines.push('  • Verify current zoning status with Planning');
    if (conditions.tNotes) {
      lines.push(`  • ${conditions.tNotes}`);
    }
    lines.push('');
  }

  lines.push('IMPORTANT: Q/D/T conditions can override base zoning standards.');
  lines.push('This analysis may NOT reflect actual allowed development.');
  lines.push('Verify full ordinance text before making decisions.');
  lines.push('─'.repeat(50));

  return lines.join('\n');
}
