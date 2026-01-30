# Zoning Analysis Accuracy Assessment

## Current Coverage

### ✅ Handled Correctly
| Data Point | Source | Notes |
|------------|--------|-------|
| Base Zone (R1-R5, RAS, RD, C1-C5, CR, CM, M1-M3) | LAMC 12.03-12.14 | Core zones implemented |
| Height Districts (1, 1L, 1VL, 1XL, 1SS, 2, 3, 4) | LAMC 12.21.1 | All common districts |
| Base Density (SF per DU) | LAMC 12.03 | Per zone table |
| Base FAR | Zone + HD interaction | MIN(zone FAR, HD FAR) |
| Base Setbacks | LAMC 12.08-12.14 | Front, side, rear |
| Parking Requirements | LAMC 12.21.A.4 | By zone and program |
| Open Space | LAMC 12.21.G | Standard + MIIP alternative |
| Bicycle Parking | LAMC 12.21.A.16 | Long-term + short-term |

### ⚠️ Partially Handled
| Data Point | Issue | Impact |
|------------|-------|--------|
| RD4, RD5, RD6 zones | In enum but no standards data | Will error on these zones |
| RW1, RW2 zones | In enum but no standards data | Will error on these zones |
| Transitional Height | Flag exists but no geometry check | May miss adjacency to R1/R2 |

### ❌ NOT Handled (Critical Gaps)

#### 1. Q Conditions (Qualified Classifications)
**What they are:** Parcel-specific restrictions recorded in City ordinances that modify base zoning.

**Examples:**
- "Q" limiting height to 45 feet when zone allows unlimited
- "Q" prohibiting certain uses (hotels, drive-throughs)
- "Q" requiring affordable housing percentage
- "Q" limiting density below base zone

**Impact:** Can COMPLETELY change what's allowed on a site. A Q condition could reduce allowed units from 50 to 10.

**Solution Required:** Must be looked up in ZIMAS for each parcel.

#### 2. D Conditions (Development Limitations)
**What they are:** Similar to Q but focused on development standards (height, setbacks, design).

**Impact:** Can restrict development significantly.

**Solution Required:** ZIMAS lookup.

#### 3. T Conditions (Tentative Classifications)
**What they are:** Temporary zone classifications pending approval.

**Impact:** May indicate zone change in process.

**Solution Required:** ZIMAS lookup.

#### 4. Specific Plans (40+ in LA)
**What they are:** Area-specific zoning overlays that REPLACE base zoning standards.

**Major Specific Plans:**
| Plan | Area | Key Difference |
|------|------|----------------|
| Hollywood Community Plan | Hollywood | Own FAR/height rules |
| Ventura-Cahuenga Boulevard | Valley | Corridor-specific standards |
| Warner Center | Woodland Hills | Own density system |
| Playa Vista | Westside | Phased development |
| Central City West | Downtown | Specific FAR tables |
| Vermont/Western SNAP | Koreatown | Transit-oriented rules |

**Impact:** Specific Plan rules OVERRIDE base zoning. A site might show R4 in ZIMAS but actually be governed by Hollywood Community Plan rules.

**Solution Required:** Specific Plan lookup + plan-specific rules.

#### 5. Overlay Zones
| Overlay | Effect |
|---------|--------|
| HPOZ (Historic) | Design review, may limit changes |
| CDO (Community Design) | Architectural requirements |
| NSO (Neighborhood Stabilization) | Limits on demolition/conversion |
| RFA (Residential Floor Area) | Limits floor area |
| RIO (River Improvement) | Environmental requirements |
| SN (Sign District) | Sign restrictions |

#### 6. Missing Base Zones
| Zone | Type | Common In |
|------|------|-----------|
| RE9, RE11, RE15, RE20, RE40 | Residential Estate | Hills, wealthy areas |
| RS | Suburban Residential | Valley |
| RA | Residential Agricultural | Rural areas |
| A1, A2 | Agricultural | Edge of city |
| OS | Open Space | Parks |
| PF | Public Facilities | Government land |

#### 7. Community Plan Designations
Even when zoning allows something, the Community Plan land use designation may restrict it. A site zoned C2 may be designated "Neighborhood Commercial" in the Community Plan, limiting height to 35 feet.

---

## Accuracy Rating by Scenario

| Scenario | Accuracy | Why |
|----------|----------|-----|
| Typical R4 in HD-1, no conditions | 90% | Base case handled well |
| C2 zone near transit | 85% | May miss specific plan |
| Site with Q condition | 30% | Q can change everything |
| Site in Specific Plan | 40% | Missing plan-specific rules |
| Site in HPOZ | 50% | May have design restrictions |
| Industrial conversion | 60% | Missing AB 2011 nuances |

---

## Data Sources Required for 95%+ Accuracy

1. **ZIMAS Parcel Report** (Free, online)
   - Base zone
   - Height district
   - Q/D/T conditions (ordinance numbers)
   - Specific Plan (if any)
   - Overlay zones
   - Community Plan designation
   - Council District

2. **Specific Plan Document** (If applicable)
   - Plan-specific FAR tables
   - Plan-specific height limits
   - Plan-specific design requirements

3. **Q Condition Ordinance** (If applicable)
   - Specific restrictions
   - Effective date
   - Expiration (if any)

---

## Recommendations

### Minimum for Production Use
1. Add input fields for Q conditions, Specific Plans, Overlays
2. Show WARNING if any of these are present
3. Require user to manually verify ZIMAS data
4. Output should clearly state "ASSUMES NO Q/D CONDITIONS"

### Better Approach
1. Integrate ZIMAS API (if available) or PDF parsing
2. Build Specific Plan rules database for major plans
3. Flag sites in HPOZ for manual review

### Best Approach
1. Use professional zoning service (Brickwork, Gridics)
2. Cross-reference model output against their data
3. Use this model for quick screening, not final pricing
