# BOV (Broker Opinion of Value) — Master Instructions

> **Purpose:** This document provides comprehensive instructions for creating BOV presentation websites for the LAAA Team (LA Apartment Advisors at Marcus & Millichap). Every future BOV must follow these standards. This is the authoritative reference — read it completely before starting any BOV.

---

## Table of Contents

1. [General Architecture](#1-general-architecture)
2. [Section Order & Content](#2-section-order--content)
3. [Photo Labels & Descriptions](#3-photo-labels--descriptions)
4. [Map Geocoding — CRITICAL](#4-map-geocoding--critical)
5. [Table of Contents Navigation](#5-table-of-contents-navigation)
6. [Track Record / Resume Section](#6-track-record--resume-section)
7. [Pricing Metrics (Blue Boxes)](#7-pricing-metrics-blue-boxes)
8. [Pricing Matrix](#8-pricing-matrix)
9. [Visual Design Standards](#9-visual-design-standards)
10. [Narrative & Content Quality](#10-narrative--content-quality)
11. [Technical Standards](#11-technical-standards)
12. [Deployment & GitHub Pages](#12-deployment--github-pages)

---

## 1. General Architecture

Each BOV is a **single `index.html` file** deployed to GitHub Pages at `gscher1311.github.io/{repo-name}/`.

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
| 1 | Cover Page | — | Hero with property photo, address, suggested list price, key stats, client greeting |
| 2 | Table of Contents Nav | `toc-nav` | Sticky navigation bar |
| 3 | Team Track Record | `track-record` | LAAA team credentials, closings map |
| 4 | Property Overview | `overview` | Photos, narrative description, property details tables, target buyer profile |
| 5 | Building Systems | `building-systems` | Capital improvements table |
| 6 | Regulatory & Compliance | `regulatory` | Zoning, rent control, hazard status, legal nonconforming use note |
| 7 | Transaction History | `transactions` | Prior sales table |
| 8 | Comparable Sales (Closed) | `sale-comps` | Interactive Leaflet map + comp table + narrative analysis |
| 9 | On-Market Comparables | `on-market` | Interactive Leaflet map + active listing table + narrative |
| 10 | Rent Comparables | `rent-comps` | Interactive Leaflet map + rent comp tables by bedroom count + narrative |
| 11 | Financial Analysis | `financials` | Pricing metrics, unit mix/rent roll, operating statement, returns, financing terms, pricing matrix, narrative |
| 12 | Footer / Contact | `contact` | Agent headshots/contact info, office address, disclaimer |

---

## 3. Photo Labels & Descriptions

### CRITICAL RULE: Never guess photo descriptions.

When embedding property photos:
- **Always ask the broker** for accurate descriptions of each photo
- If descriptions are not provided, use **generic sequential labels**: "Property Photo 1", "Property Photo 2", etc.
- **Never assume** what a photo shows based on the image content — the AI cannot reliably interpret base64-encoded images
- Common acceptable labels (when verified by broker): "Front House (2BR/1BA)", "Rear Duplex Exterior", "Kitchen", "Living Room", "Bathroom", "Rear Patio", "Street View"
- Photo grid should be 2 columns on desktop, 1 column on mobile

---

## 4. Map Geocoding — CRITICAL

### NEVER estimate or guess coordinates. ALWAYS geocode every address.

**For every address** (subject property AND every comp), you MUST obtain exact latitude/longitude coordinates using:

**Nominatim OpenStreetMap Geocoding API:**
```
https://nominatim.openstreetmap.org/search?q={ADDRESS}&format=json&limit=1
```

**Example:**
```
https://nominatim.openstreetmap.org/search?q=2341+Beach+Ave+Venice+CA+90291&format=json&limit=1
```

Response will contain `lat` and `lon` fields — use these exact values.

**If the API times out or returns no results:**
1. Try a simplified address (e.g., remove zip code)
2. Use Google Maps to manually look up the address and extract coordinates
3. Document which addresses could not be geocoded and flag for manual verification

**Map Implementation:**
- Use Leaflet.js with OpenStreetMap tiles
- Subject property: Gold star marker (`&#9733;`) with navy background
- Comp properties: Numbered circle markers with navy background
- Each marker should have a popup with: Address, Units, Price, $/Unit
- Use `fitBounds()` to auto-zoom to show all markers with padding `[40, 40]`

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

## Full Audit Checklist (for reviewing any BOV)

Before considering a BOV complete, verify ALL of the following:

### Cover Page
- [ ] M&M logo present
- [ ] "Broker Opinion of Value" label
- [ ] Property address (street + city/state/zip)
- [ ] Suggested list price
- [ ] Key stats: Units, Square Feet, Year Built, Lot Size (Acres)
- [ ] Client greeting with URL parameter personalization
- [ ] Property cover photo with gold border

### Track Record
- [ ] 4 headline stat cards (transactions, volume, units, active listings)
- [ ] Interactive closings map embed
- [ ] Clean, modern card layout

### Property Overview
- [ ] 4 property photos in 2×2 grid
- [ ] **Photo captions verified against actual images**
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
- [ ] Averages and medians row
- [ ] Table note about GRM methodology and exclusions
- [ ] Narrative analysis positioning subject vs. comps

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
- [ ] Operating statement (Income: GSR, Vacancy, ERI, Other Income, EGI; Expenses itemized; NOI)
- [ ] Returns at suggested price table (Cap Rate, GRM, Cash-on-Cash, DCR, Total Return — both Current and Market)
- [ ] Financing terms table
- [ ] **Pricing matrix: ~11 rows with ~1% increments, highlighted suggested price**
- [ ] Closing narrative about investment thesis

### Footer
- [ ] Agent headshots (circular, gold border)
- [ ] Agent names, titles, phone, email, license numbers
- [ ] Office address
- [ ] Legal disclaimer

### Technical
- [ ] All maps geocoded correctly (verified against actual addresses)
- [ ] Smooth scroll working
- [ ] Active TOC highlighting working
- [ ] Mobile responsive (test at 768px and 420px)
- [ ] Print styles working (maps hidden, page breaks correct)
- [ ] Client URL parameter working
- [ ] All financial calculations internally consistent
- [ ] No broken images or missing data
