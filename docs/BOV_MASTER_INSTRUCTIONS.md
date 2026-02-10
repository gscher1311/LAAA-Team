# BOV (Broker Opinion of Value) — Master Instructions

> **Purpose:** This document provides comprehensive instructions for creating BOV presentation websites for the LAAA Team (LA Apartment Advisors at Marcus & Millichap). Every future BOV must follow these standards. This is the authoritative reference — read it completely before starting any BOV.

---

## Table of Contents

1. [General Architecture](#1-general-architecture)
2. [Section Order & Content](#2-section-order--content)
3. [Property Photos](#3-property-photos)
4. [Map Geocoding — CRITICAL](#4-map-geocoding--critical)
5. [Table of Contents Navigation](#5-table-of-contents-navigation)
6. [Track Record / Resume Section](#6-track-record--resume-section)
7. [Pricing Metrics (Blue Boxes)](#7-pricing-metrics-blue-boxes)
8. [Pricing Matrix](#8-pricing-matrix)
9. [Visual Design Standards](#9-visual-design-standards)
10. [Narrative & Content Quality](#10-narrative--content-quality)
11. [Technical Standards](#11-technical-standards)
12. [Deployment & GitHub Pages](#12-deployment--github-pages)
13. [Cover Page — Agent & Date Requirements](#13-cover-page--agent--date-requirements)
14. [Operating Statement — Per Unit & %EGI Columns](#14-operating-statement--per-unit--egi-columns)
15. [Comp Tiering & Classification](#15-comp-tiering--classification)
16. [Pricing Rationale Narrative](#16-pricing-rationale-narrative)
17. [Deal-Specific Conditions & Assumptions](#17-deal-specific-conditions--assumptions)
18. [BOV Template Engine — Automated Build Pipeline](#18-bov-template-engine--automated-build-pipeline)
19. [Phase 2 Features (Future)](#phase-2-features-future-implementation)

---

## 1. General Architecture

Each BOV is a **single `index.html` file** deployed to GitHub Pages at `gscher1311.github.io/{repo-name}/`.

**Preferred method:** Use the **BOV Template Engine** (see Section 18). Fill in a JSON data file, run the render script, and deploy. This guarantees consistency across all BOVs.

**Key features:**
- Self-contained HTML with inline CSS (no external CSS frameworks)
- Google Fonts: Inter (weights 300–700)
- Leaflet.js for interactive maps (via CDN)
- Client personalization via URL query parameter: `?client=Client+Name`
- Print-ready CSS via `@media print`
- Mobile-responsive via `@media (max-width: 768px)` and `@media (max-width: 420px)`
- Color scheme: Navy `#1B3A5C`, Gold `#C5A258`

**Repo naming convention:** `{address-number}-{street}-bov` (e.g., `2341-beach-bov`)

---

## 2. Section Order & Content

The BOV must contain these sections **in this exact order**:

| # | Section | ID | Purpose |
|---|---------|-----|---------|
| 1 | Cover Page | — | Hero with property photo, address, suggested list price, key stats, client greeting, lead agent name/title, date |
| 2 | Table of Contents Nav | `toc-nav` | Sticky navigation bar |
| 3 | Team Track Record | `track-record` | LAAA team credentials, closings map |
| 4 | Property Overview | `overview` | Photos, narrative description, property details tables, target buyer profile |
| 5 | Building Systems | `building-systems` | Capital improvements table |
| 6 | Regulatory & Compliance | `regulatory` | Zoning, rent control, hazard status, legal nonconforming use note |
| 7 | Transaction History | `transactions` | Prior sales table |
| 8 | Comparable Sales (Closed) | `sale-comps` | Interactive Leaflet map + comp table + narrative analysis |
| 9 | On-Market Comparables | `on-market` | Interactive Leaflet map + active listing table + narrative |
| 10 | Rent Comparables | `rent-comps` | Interactive Leaflet map + rent comp tables by bedroom count + narrative |
| 11 | Financial Analysis | `financials` | Pricing metrics, unit mix/rent roll, operating statement (with Per Unit + %EGI columns), returns, financing terms, pricing matrix, **pricing rationale narrative** |
| 12 | Footer / Contact | `contact` | Agent headshots/contact info, office address, disclaimer |

---

## 3. Property Photos

### Display Rules:
- Add a **"Property Photos"** heading (`<h3>`) above the photo grid — this replaces individual captions
- **Do NOT add individual photo captions** — AI cannot reliably identify what each photo shows, and incorrect captions look worse than no captions
- Photo grid: 2 columns on desktop (`grid-template-columns: 1fr 1fr`), 1 column on mobile
- Photos should use `border-radius: 8px`, `aspect-ratio: 16/10`, `object-fit: cover`
- All `<img>` tags must have `alt="Property Photo"` (generic, not descriptive)
- If the broker explicitly provides verified captions, they may be added — but default is NO captions

---

## 4. Map Geocoding — CRITICAL

### NEVER estimate or guess coordinates. ALWAYS geocode every address.

**For every address** (subject property AND every comp), you MUST obtain exact latitude/longitude coordinates using the **geopy** Python library with the ArcGIS provider (already installed on this machine).

**Geocoding Script (use this exact pattern):**
```python
from geopy.geocoders import ArcGIS
import time

geolocator = ArcGIS()

addresses = [
    ('Subject', '2341 Beach Ave, Venice, CA 90291'),
    ('Comp 1', '11 19th Ave, Venice, CA 90291'),
    # ... add all comp addresses
]

for label, addr in addresses:
    try:
        loc = geolocator.geocode(addr)
        if loc:
            print(f'{label}: [{loc.latitude:.6f}, {loc.longitude:.6f}]')
        else:
            print(f'{label}: NOT FOUND')
        time.sleep(0.5)  # Rate limit courtesy
    except Exception as e:
        print(f'{label}: ERROR {e}')
```

**Run this script BEFORE building the HTML.** Copy the exact coordinates into the Leaflet marker code.

**If an address is NOT FOUND:**
1. Try simplifying (remove unit numbers, zip codes)
2. Try alternate providers: `from geopy.geocoders import Nominatim` with `user_agent="bov_geocoder"`
3. If still not found, use placeholder `[0, 0]` and add HTML comment: `<!-- WARNING: Coordinates not verified for [ADDRESS] -->`

**DO NOT use Nominatim as the primary geocoder** — it is rate-limited and often times out. ArcGIS is free, reliable, and accurate for US addresses.

**Map Implementation:**
- Use Leaflet.js with OpenStreetMap tiles
- Subject property: Gold star marker (`&#9733;`) with navy background
- Comp properties: Numbered circle markers with navy background
- Each marker should have a popup with: Address, Units, Price, $/Unit
- Use `fitBounds()` to auto-zoom to show all markers with padding `[40, 40]`

---

### Pre-Build Geocoding Checklist
Before generating any BOV HTML, complete these steps:
1. Collect ALL addresses: subject property + every sale comp + every active comp + every rent comp
2. Run the geopy script above with ALL addresses in a single batch
3. Verify every address returned coordinates (no NOT FOUND or ERROR results)
4. Spot-check at least 2-3 coordinates using Google Maps to confirm accuracy
5. Only then proceed to generate the HTML with the verified coordinates

---

## 5. Table of Contents Navigation

### Design Requirements:
- **Sticky** to top of viewport (`position: sticky; top: 0; z-index: 100`)
- Navy background (`#1B3A5C`)
- Single row on desktop (use `flex-wrap: wrap` as fallback)
- Links: Gold accent on active, subtle hover effect
- **Improved formatting:**
  - Use `gap: 8px 20px` for better spacing
  - Font size: 13px on desktop, 11px on mobile
  - Add a subtle gold bottom border to the active link (`border-bottom: 2px solid #C5A258`)
  - Use `text-transform: uppercase` and `letter-spacing: 1px` for cleaner look
  - Ensure links don't wrap mid-word (`white-space: nowrap`)
- Smooth scroll with JavaScript on click
- Active section highlighting on scroll
- Hidden in print (`display: none !important` in `@media print`)

---

## 6. Track Record / Resume Section

### Current Issue: The section looks flat and unengaging.

### Improved Design Requirements:
- **4 headline stat cards** in a 2×2 grid (or 4×1 on wide screens):
  - Closed Transactions (with "Since 1/1/2013" subtitle)
  - Total Sales Volume (with "All-Time" subtitle)
  - Apartment Units Sold (with "All-Time" subtitle)
  - Active Listings (with "$XXM Inventory" subtitle)
- Cards should use navy background with gold labels (matching the existing `metric-card` style)
- **Embedded Google Maps iframe** showing the LAAA interactive closings map
- Add a fallback text link for print: "View our interactive closings map at www.LAAA.com"
- **DO NOT include** a current inventory/active listings table in this section (it was removed because it changes too frequently)

---

## 7. Pricing Metrics (Blue Boxes)

### The Financial Analysis section must show exactly 4 metric cards:

| Metric | Label | Subtitle |
|--------|-------|----------|
| $/Unit (at suggested price) | Price / Unit | $/SF value |
| $/SF (at suggested price) | Price / SF | — |
| Current Cap Rate | Current Cap Rate | — |
| Current GRM | Current GRM | — |

### Key Rules:
- Use `metrics-grid metrics-grid-4` class (4 columns on desktop, 2 on tablet, 1 on mobile)
- **Cap Rate and GRM must be CURRENT (actual), NOT pro forma/market**
- Cap Rate = Current NOI ÷ Suggested List Price
- GRM = Suggested List Price ÷ Current Gross Scheduled Rent
- All values calculated from the property's actual current income, not projected/market rents

---

## 8. Pricing Matrix

### Rules:
- Show approximately **11 rows total**: 5 prices below + suggested price (highlighted) + 5 prices above
- **Increment size** should be approximately 1% of the suggested list price, rounded to standard increments:
  - Under $500K: use $5K increments
  - $500K–$1M: use $10K or $15K increments
  - $1M–$2M: use $20K or $25K increments
  - $2M–$5M: use $25K or $50K increments
  - $5M–$10M: use $50K or $100K increments
  - Over $10M: use $100K or $250K increments
- **Example:** For a $1,995,000 suggested price → 1% ≈ $20K → use $25K increments → show $1,870K to $2,120K
- The suggested list price row gets the `highlight` class (gold background, bold)
- Columns: Price, Cap Rate, $/Unit, $/SF, GRM, Cash-on-Cash, DCR
- Include a table note: "Highlighted row represents the suggested list price. Cash-on-cash assumes [X]% down, [X]% rate, [X]-year amortization."

---

## 9. Visual Design Standards

### Color Palette:
- Primary Navy: `#1B3A5C`
- Accent Gold: `#C5A258`
- Light Background (alternating sections): `#f8f9fa`
- White: `#fff`
- Text: `#333`
- Subtle text: `#888`
- Table header: Navy background, white text
- Highlighted row: `#FFF8E7` background with gold borders

### Typography:
- Font: `'Inter', 'Helvetica Neue', Arial, sans-serif`
- Section titles: 28px, bold, navy
- Section subtitles: 13px, uppercase, letter-spacing 2px, gold
- Body text: 15px, line-height 1.7
- Table text: 13px
- Table headers: 12px, uppercase, letter-spacing 0.5px

### Layout:
- Max width: 1000px, centered
- Section padding: 50px horizontal, 60px on desktop; 30px/16px on tablet; 24px/12px on mobile
- Alternating section backgrounds (white / light gray)
- Gold gradient divider under each section title

### Print Styles:
- Page size: letter, 0.5in margins
- Section breaks between major sections
- Maps hidden in print (show fallback text)
- TOC nav hidden
- Reduce font sizes and spacing for print

---

## 10. Narrative & Content Quality

### Writing Standards:
- **Professional, institutional investment tone** — write as if presenting to a sophisticated investor or 1031 exchange buyer
- Use specific numbers and data points — never vague language
- Compare subject property explicitly to comps with specific $/unit, cap rate, and GRM benchmarks
- Address the investment thesis clearly: current income, appreciation potential, zoning/scarcity value
- Include location context: neighborhood name, Walk Score, nearby employers/amenities, median income
- Highlight renovation/capital improvement history with specific dates and permits

### Comp Analysis Narrative:
- Always position the subject relative to the comp set (above/below/in-line)
- Call out the most comparable same-street or nearest comp
- Identify the ceiling (highest comp) and floor (lowest comp)
- Note any stale listings (>90 DOM) or price reductions in the active comp set
- For rent comps, address both absolute rent and $/SF comparisons

### Data Accuracy:
- All financial calculations must be internally consistent
- NOI = EGI - Total Expenses
- Cap Rate = NOI / Price
- GRM = Price / Gross Scheduled Rent
- Cash-on-Cash = (NOI - Debt Service) / Down Payment
- DCR = NOI / Debt Service
- Verify all comp data (sale prices, dates, $/unit, cap rates) against public records or MLS data

---

## 11. Technical Standards

### JavaScript:
- Client personalization: Read `client` URL parameter and set greeting text
- Smooth scroll for TOC links with offset for sticky nav height
- Active TOC link highlighting on scroll
- Leaflet maps initialized on `DOMContentLoaded`

### Images:
- Property photos: embedded as base64 `data:image/jpeg;base64,...`
- Agent headshots: embedded as base64
- Marcus & Millichap logo: embedded as base64 PNG
- Alt text on all images for accessibility

### Performance:
- All CSS inline in `<style>` tag (no external stylesheets except Google Fonts and Leaflet)
- All JS inline in `<script>` tag (no external scripts except Leaflet)
- Lazy loading on map iframes (`loading="lazy"`)

---

## 12. Deployment & GitHub Pages

### Workflow:
1. Create repo: `gscher1311/{address}-bov`
2. Description: "Broker Opinion of Value - {Full Address}"
3. Single `index.html` file on `main` branch
4. Enable GitHub Pages on `main` branch
5. URL format: `https://gscher1311.github.io/{repo-name}/?client=Client+Name`
6. Commit messages should use the `Co-authored-by: Cursor` tag

### Commit Message Standards:
- Initial: "Deploy BOV presentation - {Address}"
- Subsequent: Descriptive of changes (e.g., "Add sticky table of contents nav with smooth scroll")

---

## 13. Cover Page — Agent & Date Requirements

### Always include on the cover page:
- **Lead agent name and title** (e.g., "Glen Scher, Senior Managing Director Investments")
- **Date** in format "Month Year" (e.g., "February 2026")
- **NYSE: MMI** should appear in the Marcus & Millichap branding/logo area
- The `?client=Client+Name` URL parameter populates the "Prepared Exclusively for" greeting

### Cover Layout (top to bottom):
1. M&M logo (with "NYSE: MMI" if space permits)
2. "Broker Opinion of Value" label
3. Property address (street)
4. City, State, Zip
5. Gold divider line
6. "Suggested List Price" label + price
7. Key stats row: Units, Square Feet, Year Built, Acres
8. Client greeting ("Prepared Exclusively for [Client]")
9. **Date line** (e.g., "February 2026")
10. Cover photo with gold border

---

## 14. Operating Statement — Per Unit & %EGI Columns

### The operating statement MUST include three value columns:

| Line Item | Annual | Per Unit | % EGI |
|-----------|-------:|--------:|------:|
| Gross Scheduled Rent | $XXX,XXX | $XX,XXX | — |
| Less: Vacancy (X%) | ($X,XXX) | ($X,XXX) | — |
| Other Income | $X,XXX | $XXX | — |
| **Effective Gross Income** | **$XXX,XXX** | **$XX,XXX** | **100.0%** |
| Real Estate Taxes | $XX,XXX | $X,XXX | X.X% |
| Insurance | $X,XXX | $XXX | X.X% |
| *(all other expense lines)* | ... | ... | ... |
| **Total Expenses** | **$XX,XXX** | **$X,XXX** | **XX.X%** |
| **Net Operating Income** | **$XX,XXX** | **$XX,XXX** | **XX.X%** |

### Calculation Rules:
- **Per Unit** = Annual amount ÷ Total number of units
- **% EGI** = Annual amount ÷ Effective Gross Income × 100
- Income lines (GSR, Vacancy, Other Income) do NOT get % EGI
- Only expense lines and NOI get % EGI
- Round Per Unit to nearest dollar, % EGI to one decimal place

---

## 15. Comp Tiering & Classification

### Every comp in the sale comps table should have a classification/tier:

**Standard tiers:**
- **Stabilized** — Renovated, fully leased at market rents, minimal deferred maintenance
- **Value-Add** — Below-market rents, deferred maintenance, needs renovation
- **Distressed** — REO, foreclosure, trust/estate sale, significant issues

### Implementation:
- Add a **Notes** column to the comp table that includes the tier label
- In the comp narrative, explicitly reference the tiers: "The comps stratify into [X] tiers..."
- Position the subject property relative to the tiers: "At $XXK/unit, the subject sits between the stabilized ceiling ($XXK) and the value-add middle ($XXK)..."
- Identify the ceiling (highest stabilized comp) and floor (lowest comp) explicitly

### The subject row in the comp table should always be bold and clearly labeled.

---

## 16. Pricing Rationale Narrative

### After the pricing matrix, include a dedicated "Pricing Rationale" section.

This is NOT the same as the general financial analysis narrative. The pricing rationale must:

1. **State the recommended price** and its key metrics ($/unit, $/SF, cap rate, GRM)
2. **Position against comp tiers** — explain which comps the subject is above/below and why
3. **Justify the premium or discount** — what property-specific attributes support the price (renovation, location, zoning, lot size, views, etc.)
4. **Address the expected negotiation range** — where offers are likely to come in
5. **Reference specific comps by address** — not generic statements

### Example structure:
> "At the suggested list price of $X,XXX,XXX, the subject trades at $XXXK/unit and $X,XXX/SF. This positions the property [above/below/in-line with] the [stabilized/value-add] tier of comps, where [Comp Address] traded at $XXXK/unit. The [premium/discount] is justified by [specific reasons]. The pricing captures buyers filtering under the $XM threshold, where [market observation about active inventory/DOM]."

---

## 17. Deal-Specific Conditions & Assumptions

### At the bottom of the Financial Analysis section, include a conditions block:

**Format:** A subtle callout box (similar to the Legal Nonconforming Use Note style) listing key assumptions and conditions.

**Always include:**
- Financing assumptions used in cash-on-cash and DCR calculations (LTV%, rate, amortization)
- Vacancy rate assumption and justification
- Management fee assumption and whether owner-managed is assumed
- Any property-specific conditions (e.g., "Subject to title clearance", "Assumes all units delivered vacant", "Excludes deferred maintenance costs")

**Example:**
> **Assumptions & Conditions:** Cash-on-cash and DCR assume 36% down payment, 6.25% interest rate, 30-year amortization. Vacancy at 3% reflects Venice multifamily historical average. Management at 5% of EGI assumes third-party management; owner-operators may achieve higher returns. This analysis is not an appraisal; it is a broker opinion of value for listing purposes.

---

## 18. BOV Template Engine — Automated Build Pipeline

### Overview
The LAAA Team has a Jinja2-based template engine that automates BOV creation. Instead of hand-coding each HTML file, Cursor fills in a **JSON data file** and the engine renders a fully compliant HTML page.

### Location
All files are in `LAAA-Team/bov-engine/`:
```
bov-engine/
├── templates/
│   └── bov.html              ← Master Jinja2 HTML template
├── sample-data/
│   └── 2341-beach.json       ← Example JSON (use as reference)
├── scripts/
│   ├── render_bov.py          ← Python: JSON → HTML
│   ├── geocode_addresses.py   ← Python: Geocode all addresses
│   └── export_pdf.js          ← Node.js: HTML → PDF
└── output/                    ← Rendered HTML + PDF files
```

### New BOV Workflow (Step by Step)

**Step 1: Create the JSON data file**
- Copy `sample-data/2341-beach.json` as a starting point
- Replace ALL values with the new deal's data
- Key sections: `cover`, `property`, `sale_comps`, `active_comps`, `rent_comps`, `financials`
- For photos, replace `"REPLACE_WITH_BASE64"` with actual base64-encoded image strings
- For coordinates, leave them as `[0, 0]` — the geocoder will fill them in

**Step 2: Geocode all addresses**
```bash
python scripts/geocode_addresses.py sample-data/NEW-DEAL.json --update
```
This reads every address from the JSON, geocodes it via ArcGIS, and writes the coordinates back.

**Step 3: Render HTML**
```bash
python scripts/render_bov.py sample-data/NEW-DEAL.json
```
Output appears in `output/{repo-name}.html`.

**Step 4: Local preview**
```bash
live-server output/
```
Opens a browser with hot-reload. Review every section visually.

**Step 5: Export PDF (optional)**
```bash
node scripts/export_pdf.js output/NEW-DEAL.html
```
Generates a Letter-format PDF using Puppeteer headless Chrome.

**Step 6: Deploy to GitHub Pages**
```bash
# Create repo
gh repo create gscher1311/{repo-name} --public --description "Broker Opinion of Value - {Address}"
# Clone and copy
git clone https://github.com/gscher1311/{repo-name}
cp output/{repo-name}.html {repo-name}/index.html
cd {repo-name}
git add index.html && git commit -m "Deploy BOV presentation - {Address}"
git push origin main
# Enable GitHub Pages in repo Settings → Pages → Source: main branch
```

### JSON Data Schema — Required Keys
| Key | Type | Description |
|-----|------|-------------|
| `meta` | object | `repo_name`, `generated_date`, `version` |
| `cover` | object | Address, price, units, SF, year built, lead agent, cover photo |
| `team` | object | Team name, firm, track record stats, closings map URL |
| `property` | object | Description, location, target buyers, photos, details |
| `building_systems` | array | System name, condition, year for each building component |
| `regulatory` | object | `line_items` array + source note + optional legal nonconforming note |
| `transaction_history` | object | Prior sales array + narrative |
| `coordinates` | object | `subject` lat/lng array |
| `sale_comps` | object | `comps` array (with coords), averages, medians, narrative |
| `active_comps` | object | `comps` array (with coords), as_of_date, narrative |
| `rent_comps` | object | `groups` array (by bedroom count, each with comps + coords), narrative |
| `financials` | object | Units, income, expenses, NOI, returns, financing, pricing rationale, conditions |
| `agents` | array | Name, title, phone, email, license, headshot for each agent |
| `office` | object | Office name, address, website |
| `disclaimer` | string | Legal disclaimer text |

### Benefits Over Manual HTML
- **Consistency:** Every BOV uses the exact same template, formatting, and structure
- **Speed:** 5 minutes to fill in JSON vs. hours of HTML editing
- **Accuracy:** Financial calculations happen in the template (auto-computed Per Unit, %EGI, pricing matrix)
- **Geocoding:** Automated — no more guessed coordinates
- **PDF Export:** One command generates a professional PDF
- **Maintenance:** Fix a bug once in the template, all future BOVs inherit the fix

### When NOT to Use the Template Engine
- If the deal requires a completely custom layout (rare)
- If base64 image embedding is causing file size issues > 5MB — consider external image hosting

---

## Phase 2 Features (Future Implementation)

The following features are approved for future implementation once the core template is stable:

- **Comp $/Unit bar chart** — Visual bar chart comparing subject to all comps (requires Chart.js or similar)
- **Expense breakdown pie chart** — Visual showing expense allocation
- **Scenario analysis section** — For REO/distressed deals only: High End, Expected, Low End, Downside scenarios
- **Walk-away floor pricing** — For REO deals: 3-tier recommendation (List Price | Expected Range | Floor)
- **Optional "Property Context" section** — For unusual deal circumstances (REO, estate, legal issues)

These are NOT to be implemented until explicitly requested. They add chart library dependencies and calculation complexity that increases error risk.

---

## Full Audit Checklist (for reviewing any BOV)

Before considering a BOV complete, verify ALL of the following:

### Cover Page
- [ ] M&M logo present (with NYSE: MMI)
- [ ] "Broker Opinion of Value" label
- [ ] Property address (street + city/state/zip)
- [ ] Suggested list price
- [ ] Key stats: Units, Square Feet, Year Built, Lot Size (Acres)
- [ ] **Lead agent name and title**
- [ ] **Date (Month Year)**
- [ ] Client greeting with URL parameter personalization
- [ ] Property cover photo with gold border

### Track Record
- [ ] 4 headline stat cards (transactions, volume, units, active listings)
- [ ] Interactive closings map embed
- [ ] Clean, modern card layout

### Property Overview
- [ ] **"Property Photos" heading** above photo grid
- [ ] 4 property photos in 2×2 grid — **NO individual captions** (unless broker-verified)
- [ ] Narrative description (2-3 paragraphs minimum)
- [ ] Location paragraph with Walk Score, transit, employers, median income
- [ ] Target buyer profile callout box
- [ ] Two-column property details tables (physical + zoning)

### Building Systems
- [ ] Capital improvements table with System, Condition/Status, Year columns
- [ ] All systems documented (Roof, Plumbing, HVAC, Electrical, Kitchen, Flooring, Windows/Doors, Soundproofing, Laundry, Parking)

### Regulatory & Compliance
- [ ] Zoning, Rent Control, Hazard status table
- [ ] Legal nonconforming use note (if applicable) in callout box
- [ ] Source citation

### Transaction History
- [ ] Prior sales table with Date, Price, $/Unit, $/SF, Notes
- [ ] Narrative connecting purchase price to suggested list price

### Comparable Sales
- [ ] **Interactive Leaflet map with geocoded coordinates for EVERY comp**
- [ ] Comp table with #, Address, Units, Sale Date, Price, $/Unit, Cap, GRM, DOM, Notes
- [ ] **Comp tiering labels** (Stabilized, Value-Add, Distressed) in Notes column
- [ ] **Subject row** bold and clearly labeled in comp table
- [ ] Averages and medians row
- [ ] Table note about GRM methodology and exclusions
- [ ] Narrative analysis positioning subject vs. comp **tiers** with ceiling/floor identification

### On-Market Comparables
- [ ] **Interactive Leaflet map with geocoded coordinates**
- [ ] Active listing table
- [ ] Date note ("Active listing data as of {month year}")
- [ ] Narrative about market positioning and DOM trends

### Rent Comparables
- [ ] **Interactive Leaflet map with geocoded coordinates**
- [ ] Separate tables by bedroom count (2BR, 1BR, etc.)
- [ ] Averages row per bedroom type
- [ ] Narrative about rent positioning (absolute and $/SF)

### Financial Analysis
- [ ] **4 metric cards: Price/Unit, Price/SF, Current Cap Rate, Current GRM**
- [ ] Unit mix & rent roll table
- [ ] Operating statement with **Annual, Per Unit, AND % EGI columns**
- [ ] Returns at suggested price table (Cap Rate, GRM, Cash-on-Cash, DCR, Total Return — both Current and Market)
- [ ] Financing terms table
- [ ] **Pricing matrix: ~11 rows with ~1% increments, highlighted suggested price**
- [ ] **Pricing Rationale narrative** (positions subject vs. comp tiers, references specific comps, explains the "why")
- [ ] **Deal-specific conditions/assumptions block** (financing terms, vacancy assumption, management assumption, disclaimers)

### Footer
- [ ] Agent headshots (circular, gold border)
- [ ] Agent names, titles, phone, email, license numbers
- [ ] Office address
- [ ] Legal disclaimer

### Technical
- [ ] All maps geocoded correctly (verified via `geocode_addresses.py`)
- [ ] Smooth scroll working
- [ ] Active TOC highlighting working
- [ ] Mobile responsive (test at 768px and 420px)
- [ ] Print styles working (maps hidden, page breaks correct)
- [ ] Client URL parameter working
- [ ] All financial calculations internally consistent
- [ ] No broken images or missing data
- [ ] BOV rendered via template engine (`render_bov.py`) — not hand-coded HTML
- [ ] PDF export tested (`export_pdf.js`)
