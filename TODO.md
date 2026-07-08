# Vaultora-EDS Consolidation TODO

## Objective
Reduce the number of **JS/CSS files** and (where possible) the number of **EDS authoring blocks** by converting repeated page sections into **a smaller set of shared engines** with **variants**.

---

## Phase 1 — Audit & duplication mapping (no refactor yet)
- [ ] Inventory all `blocks/*/*.(js|css)` and classify by UI pattern
  - Types: header/footer/auth shell, cards+grid/list, carousel, bid status panels, auction filters, product detail controls, wishlist/favorites controls
- [ ] For each pattern, list the duplicated “engine behavior” and duplicated “style primitives”
  - Examples (from what we already saw):
    - Bid status panels: pill classes + rank + leading/outbid/won/lost states
    - Carousel/cards: image thumb, title text, “View”/navigation, responsive breakpoints
- [ ] Pick the first consolidation set (recommended): **Carousel blocks**

---

## Phase 2 — Shared engine plan (end-to-end mapping for JS/CSS consolidation)
### What we will create (new files)
1) **Carousel engine** (shared across all carousels)
- New: `blocks/ui/ui-carousel.js`
- New CSS (move shared styles out of per-block): `styles/eds-carousel.css`

2) **Grid/list engine** (shared across category/auction listing style blocks)
- New: `blocks/ui/ui-grid.js`
- New CSS: `styles/eds-grid.css`

3) **Shared primitives CSS** (buttons, pills, cards, containers)
- New: `styles/eds-primitives.css`

### How variants are driven (authoring/document table changes)
Each consolidated engine expects a config source. We will support **both**:
- Preferred: `block.dataset.variant` (requires authoring template to set `data-variant`)
- Fallback: authoring children key/value table (already used in `my-bid-details.js`)

We will standardize the authoring “config table” rows to include keys like:
- `variant` (e.g., `wine`, `fashion`, `electronics`, `featured`)
- `title`, `ctaText`, `ctaHref`
- `dataSource` (which storage array to read)
- Optional: `filterKey`, `filterValue`, `sortBy`, `maxItems`, `cardTemplate`

---

## Phase 3 — Convert existing blocks into thin variant wrappers (exact JS/CSS update strategy)
### 3.1 Carousel set conversion (first, lowest risk)
Current blocks to convert:
- `blocks/carousalwine/carousalwine.js` + `blocks/carousalwine/carousalwine.css`
- `blocks/carousalfashion/carousalfashion.js` + `blocks/carousalfashion/carousalfashion.css`

End-state target:
- Keep authoring blocks (initially) but shrink their JS to wrappers that only pass variant config into the shared engine.
- Move carousel shared CSS into `styles/eds-carousel.css`.

Implementation steps per block:
1) Update `blocks/carousalwine/carousalwine.js`
   - Remove carousel logic
   - Replace with: read `block.dataset.variant` OR set `variant="wine"` directly
   - Call: `uiCarousel(block, { variant: 'wine' })`
2) Update `blocks/carousalfashion/carousalfashion.js`
   - Same, variant `fashion`
3) CSS consolidation
   - Delete/stop using most of `carousalwine.css` + `carousalfashion.css`
   - Replace with imports/usage in your EDS pipeline (or keep empty files temporarily)
   - Put shared selectors into `styles/eds-carousel.css`

**Block-count reduction possible here**
- If your EDS page markup can be changed to use ONE carousel block with `variant` updated per instance, then you can reduce authoring blocks from **2 carousel blocks → 1 carousel block**.
- If authoring templates cannot be updated, then we still reduce **JS duplication** but authoring blocks remain (2 blocks).

### 3.2 Bid pages (second, higher complexity)
Current bid blocks:
- `blocks/mybids/mybids.js` + `blocks/mybids/mybids.css`
- `blocks/my-bid-details/my-bid-details.js` + `blocks/my-bid-details/my-bid-details.css`

End-state target (phase 2 within bid pages):
- Extract shared “bid status computation” + “rank calc” into a helper module:
  - New: `blocks/auction/bid-status.js` (or `scripts/bid-engine.js`)
- Both wrappers call bid-engine and share primitives CSS:
  - Move pill/status and shared button styles into `styles/eds-bid-primitives.css`

Important: we will keep the DOM rendering mostly intact initially to avoid regressions.

**Block-count reduction possible here**
- Potentially: convert both into a single `ui-bid-page` block with variants `dashboard` and `details`, reducing from **2 authoring blocks → 1**.
- This requires authoring template changes to let details page still read `?id=`.

### 3.3 Grid/list set (third)
Candidate blocks to convert:
- `blocks/category/category.js` + `blocks/category/category.css`
- `blocks/categories/categories.js` (folder exists as listed in repo)
- `blocks/auctionlisting/auctionlisting.js` + its CSS (exists)
- `blocks/auctionproducts/auctionproducts.js` + its CSS
- `blocks/featured-auctions/featured-auctions.js` + its CSS
- `blocks/auctionfilters/auctionfilters.js` (+ CSS) *if filters are shared UI primitives*

End-state target:
- New shared engine `blocks/ui/ui-grid.js`
- Replace per-block JS with wrappers passing config:
  - variant: `category`, `featured`, `auctionListing`, `auctionProducts`, etc.
  - dataset: products, categories, etc.
  - cardTemplate: which markup to use (we can keep existing markup per variant if needed)

**Block-count reduction possible here**
- If your authoring pages can use the same `ui-grid` block for all these sections, you can reduce from ~**5–6 authoring blocks → 1**.
- If not, you still reduce JS duplication by using wrappers.

---

## Phase 4 — Concrete “authoring document table” changes (what to add)
EDS uses the block markup/authoring content children as configuration (as seen in `my-bid-details.js`).
We will update your authoring configuration table (for the converted engines) to include standardized keys.

### 4.1 For carousel blocks (`ui-carousel.js`)
Required config rows in the authoring table:
- `variant` (e.g. `wine`, `fashion`)
Optional keys (if supported):
- `title`
- `ctaText`
- `ctaHrefBase`
- `maxItems`
- `dataFilterKey` (e.g. product.category)
- `dataFilterValue`

### 4.2 For bid dashboard/detail (`bid-status` + UI wrappers)
Required config rows:
- For `mybids`-like dashboard:
  - `leadingmessage`, `outbidmessage`, `wonmessage`
- For details:
  - `leadingmessage`, `outbidmessage`, `wonmessage`
  - `paybuttontext`, `declinebuttontext`, `terminatewarning`

### 4.3 For grid/list (`ui-grid.js`)
Required config rows:
- `variant` (e.g. `category`, `featured`, `auctionListing`)
- `dataSource` (`products`, `categories`, etc.)
Optional:
- `queryParamKey` (if route param is used)
- `filterKey`, `filterValue`
- `maxItems`

---

## Phase 5 — What every existing JS/CSS file becomes (full file-level mapping)
Because we can’t run repo-wide grep here (ripgrep missing), we will do file-by-file migration in this order and update mapping as we open each file:

### Carousel CSS/JS mapping
- `blocks/carousalwine/carousalwine.js` → wrapper only (no rendering logic)
- `blocks/carousalwine/carousalwine.css` → remove duplicate rules; keep only variant-specific overrides if any (or empty)
- `blocks/carousalfashion/carousalfashion.js` → wrapper only
- `blocks/carousalfashion/carousalfashion.css` → move into shared `styles/eds-carousel.css`

### Bid CSS/JS mapping
- `blocks/mybids/mybids.js` → keep UI markup, but use shared bid-engine for status/rank/pill mapping
- `blocks/mybids/mybids.css` → move shared pill/button/card styles into `styles/eds-bid-primitives.css`
- `blocks/my-bid-details/my-bid-details.js` → same, replace duplicated status computations
- `blocks/my-bid-details/my-bid-details.css` → move repeated primitives

### Grid/list mapping (next)
- Each of: `category`, `categories`, `auctionlisting`, `auctionproducts`, `featured-auctions`
  - JS becomes wrapper around `ui-grid.js`
  - CSS shared into `styles/eds-grid.css` + `styles/eds-primitives.css`

---

## Phase 6 — Block conversion count (how many blocks we can convert)
Based on the currently visible set of blocks in this workspace, realistic initial conversions:
- Carousel blocks: **2 blocks** (`carousalwine`, `carousalfashion`) → wrappers, and optionally **1** authoring block if markup is changed.
- Bid blocks: **2 blocks** (`mybids`, `my-bid-details`) → can become **1 authoring block** only if you’re willing to change the EDS page templates.
- Grid/list blocks: currently at least **5** candidate blocks (`category`, `categories`, `auctionlisting`, `auctionproducts`, `featured-auctions`) → wrappers around **1** shared grid engine.

So, by the end of all phases (if authoring templates are changed):
- Authoring blocks could reduce from roughly **~9–10** major UI blocks → **~3–4** engines (carousel, grid, bid dashboard/details) + remaining unique pages.

---

## Phase 7 — Validation
- [ ] Run `npm run lint` after each phase
- [ ] Browser test each affected page:
  - mybids loads and filters
  - my-bid-details loads by `?id=` and countdown works
  - carousel variants render correct dataset
  - no missing CSS rules

---

## Completion Criteria
- [ ] Fewer unique JS/CSS bundles per page (measured in Network tab)
- [ ] Carousel pages share the same `ui-carousel.js`
- [ ] Status/rank logic for bids is centralized
- [ ] CSS primitives are consolidated into fewer shared stylesheets
- [ ] Behavior unchanged across all variants


