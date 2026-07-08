# Vaultora-EDS Consolidation — Phase-by-Phase Execution (with AEM EDS authoring config spec)

This file breaks the consolidation work into actionable phases and provides **exact authoring table keys** to add for every new/converted “engine” block.

> Note: EDS “authoring table” refers to the block’s authorable configuration content (the key/value rows your JS reads from `block.children`, like you already do in `my-bid-details.js`).

---

## Phase 0 — Assumptions & constraints
1. Each EDS block gets loaded independently; consolidation must keep each block `decorate(block)` working.
2. Variants/config are read either from:
   - `block.dataset.variant` (preferred), or
   - authoring children key/value rows (fallback).
3. During migration we must keep DOM structure stable enough that existing CSS still applies until we migrate CSS.

---

## Phase 1 — Carousel consolidation (2 blocks → 1 engine, optional 1 block)
### Files impacted (current)
- `blocks/carousalwine/carousalwine.js`
- `blocks/carousalwine/carousalwine.css`
- `blocks/carousalfashion/carousalfashion.js`
- `blocks/carousalfashion/carousalfashion.css`

### Target
- Add shared JS engine:
  - `blocks/ui/ui-carousel.js`
- Move shared CSS to:
  - `styles/eds-carousel.css`
- Convert existing carousel blocks into **thin wrappers** that pass variant config.

### End-state authoring: how many blocks?
- Option 1 (minimal risk): keep **2 authoring blocks** (wine + fashion) but they call the same engine.
- Option 2 (max block reduction): update page template to use **1 authoring block** (carousel) and set variant per instance.

### Authoring document table — what to add (for carousalwine/carousalfashion variants)
These blocks currently read markdown-table layers from `block.children` and build cards from the authored rows. To convert them into variants of one shared carousel engine, add standardized **key/value rows** to the authoring table and/or set `data-variant`.

Add these rows/columns in the block’s authoring table:

#### Required rows
- `variant` (string, required):
  - for `carousalwine` use: `wine`
  - for `carousalfashion` use: `fashion`

#### Optional rows (recommended)
- `headerPreTitle` (string): overrides the small pre-title line
- `headerMainTitle` (string): overrides the main title
- `headerSubTitle` (string): overrides subtitle
- `ctaText` (string): text for the action link (default: `View Vault`)
- `ctaHref` (string): link target (default: `/auctions`)
- `autoScrollMs` (number): default `3800`
- `activeProgressThreshold` (number): default `0.45`

#### Data rows (the existing card rows)
Keep your current markdown-table rows for the card items, but standardize these 3 columns:
- Column 1: `card title` (name)
- Column 2: `lot counter` (total)
- Column 3: image (must include an `img` so `querySelector('img')` works)

#### If you can edit markup templates (best)
- Ensure the block root includes: `data-variant="{{variant}}"`

---


## Phase 2 — Bid status primitives (shared CSS + bid engine helpers)
### Files impacted (current)
- `blocks/mybids/mybids.js`
- `blocks/mybids/mybids.css`
- `blocks/my-bid-details/my-bid-details.js`
- `blocks/my-bid-details/my-bid-details.css`

### Target
- Add shared bid helper module:
  - `blocks/auction/bid-status.js` (or `scripts/bid-engine.js`)
- Add shared primitives CSS:
  - `styles/eds-bid-primitives.css`

### Conversion strategy
- Keep both pages as wrappers initially, but replace duplicate computations:
  - status mapping (leading/outbid/won/lost)
  - rank calc
  - pill class mapping
  - shared money/date formatting helpers

### Authoring document table — what to add
For `mybids` (dashboard wrapper), add:
- `leadingmessage`
- `outbidmessage`
- `wonmessage`

For `my-bid-details` (details wrapper), add:
- `leadingmessage`
- `outbidmessage`
- `wonmessage`
- `paybuttontext`
- `declinebuttontext`
- `terminatewarning`

The engine should read these keys and apply them to status/action UI.

---

## Phase 3 — Grid/list consolidation (category/auctionlisting/products)
### Candidate files impacted (current)
- `blocks/category/category.js` + `blocks/category/category.css`
- `blocks/categories/categories.js` + `blocks/categories/categories.css`
- `blocks/auctionlisting/auctionlisting.js` + CSS (exists in repo list)
- `blocks/auctionproducts/auctionproducts.js` + CSS
- `blocks/featured-auctions/featured-auctions.js` + CSS
- (Optionally) `blocks/auctionfilters/auctionfilters.js` + CSS if filters share UI primitives

### Target
- Add shared grid/list engine:
  - `blocks/ui/ui-grid.js`
- Add shared grid CSS:
  - `styles/eds-grid.css`
- Convert each block to a wrapper that passes config.

### Authoring document table — what to add
For each `ui-grid` instance, add:
- `variant` (required): `category`, `featured`, `auctionListing`, `auctionProducts`, etc.
- `dataSource` (required or default): `products` / `categories`
- `dataFilterKey` (optional): e.g. `category` / `seller` / `auctionStatus`
- `dataFilterValue` (optional)
- `queryParamKey` (optional): if filtering by route (example: `id`)
- `sortBy` (optional): field name
- `maxItems` (optional)
- `cardTemplate` (optional): choose which markup template to render

---

## Phase 4 — Reduce blocks on pages (authoring template updates)
This phase depends on your page template structure.

### How block reduction works
- Replace page markup that currently uses different blocks per section with a single shared engine block.
- Use variant keys in the authoring table to change dataset + template.

### Example replacements
- Replace 2 carousel blocks with 1 carousel block + two instances/variants (or just 1 instance with different variant set per section).
- Replace 5 list blocks with 1 `ui-grid` block in different zones/sections.

---

## Phase 5 — Delete old CSS/JS (only after parity verified)
After you confirm behavior parity across all pages:
- Remove unused selectors from per-block CSS
- Optionally leave stub files until EDS cache refresh
- Finally delete old duplicated JS if no longer referenced

---

## Success metrics
- Number of unique JS files loaded per page decreases.
- Number of unique CSS files decreases.
- Authoring blocks count decreases if template updates are done.


