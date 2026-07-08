/* ==========================================================================
   Vaultora "About" block — handles 5 authored variants that all share this
   same file: default (hero), .philosophy, .team, .services, .cta.

   IMPORTANT FIX: each authored row is a 2-cell row: [field name label, value].
   The label ("Image", "Title", "Description"...) is only there for the
   author's reference in the doc and must never be rendered — only the
   second cell (the value) is real content. The previous version of this
   file read the *first* cell (via `rows[0].querySelector('div')` /
   `rows[n].textContent`), which grabbed the label text instead of the
   value, so the hero image never rendered and text fields were prefixed
   with their own field name (e.g. "DescriptionVaultora is a premium...").
   ========================================================================== */

/** Returns the row's value cell: the 2nd direct child div, falling back to
 *  the 1st if a row was only authored with a single cell. */
function valueCell(row) {
  if (!row) return null;
  const cells = row.querySelectorAll(':scope > div');
  return cells[1] || cells[0] || row;
}

function textOf(row) {
  return valueCell(row)?.textContent.trim() || '';
}

function imgOf(row) {
  return valueCell(row)?.querySelector('img') || null;
}

function linkOf(row) {
  return valueCell(row)?.querySelector('a') || null;
}

/** "Jay BrittoFOUNDER AND PRINCIPAL" -> { name: "Jay Britto", role: "FOUNDER AND PRINCIPAL" }
 *  Authored meta text has no separator, so we split on the trailing run of
 *  capitalized words. */
function splitNameRole(raw) {
  const match = raw.match(/^(.*?)\s*([A-Z][A-Z\s]{3,})$/);
  if (!match) return { name: raw, role: '' };
  return { name: match[1].trim(), role: match[2].trim() };
}

/* ==========================================================================
   Small shared signature element: the verification "seal" ring used in the
   hero. Kept as a static decorative mark (not content-driven), same idea as
   a wax seal on a certificate of authenticity.
   ========================================================================== */
function buildSealSVG() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'v-seal');
  svg.setAttribute('viewBox', '0 0 140 140');
  svg.innerHTML = `
    <circle class="v-seal-ring" cx="70" cy="70" r="60" fill="none" stroke="var(--gold-bright)" stroke-width="1" stroke-dasharray="1 6" stroke-linecap="round"/>
    <circle cx="70" cy="70" r="46" fill="none" stroke="var(--paper)" stroke-width="1"/>
    <text x="70" y="66" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-size="13" fill="var(--paper)">Verified</text>
    <text x="70" y="82" text-anchor="middle" font-family="Inter" font-size="7" letter-spacing="2" fill="var(--gold-bright)">VAULTORA</text>
  `;
  return svg;
}

/* ==========================================================================
   1. HERO
   ========================================================================== */
function decorateHero(block, rows) {
  const heroImg = imgOf(rows[0]);
  const label = textOf(rows[1]);
  const titleText = valueCell(rows[2])?.textContent.trim() || '';
  const titleHTML = titleText.replace(/Vaultora/g, '<em>Vaultora</em>');
  const desc = textOf(rows[3]);
  const btn1 = linkOf(rows[4]);
  const btn2 = linkOf(rows[5]);

  block.textContent = '';
  block.innerHTML = `
    <div class="v-hero">
      <div class="v-hero-copy">
        <span class="eyebrow on-light">${label}</span>
        <h1>${titleHTML}</h1>
        <p>${desc}</p>
        <div class="v-hero-actions"></div>
      </div>
      <div class="v-hero-visual">
        <div class="v-hero-frame"></div>
        <div class="v-tag"><b>Verified Listing</b><span>Authenticated by Vaultora</span></div>
      </div>
    </div>`;

  const actions = block.querySelector('.v-hero-actions');
  if (btn1) { btn1.className = 'v-btn v-btn-primary'; actions.append(btn1); }
  if (btn2) { btn2.className = 'v-btn v-btn-ghost'; actions.append(btn2); }

  const frame = block.querySelector('.v-hero-frame');
  if (heroImg) frame.append(heroImg);
  frame.append(buildSealSVG());
}

/* ==========================================================================
   2. PHILOSOPHY
   ========================================================================== */
function decoratePhilosophy(block, rows) {
  const mainImg = imgOf(rows[0]);
  const thumbImg = imgOf(rows[1]);
  const tagline = textOf(rows[2]);
  const approach = textOf(rows[3]);
  const title = textOf(rows[4]);
  const body = textOf(rows[5]);

  block.textContent = '';
  block.innerHTML = `
    <div class="v-phil">
      <div class="v-phil-gallery">
        <div class="v-phil-main"></div>
        <div class="v-phil-thumb"></div>
        <div class="v-tag v-tag-alt"><b>Curated Selection</b><span>Verified Provenance</span></div>
      </div>
      <div class="v-phil-copy">
        <span class="eyebrow on-light">${tagline}</span>
        <h2>${title}</h2>
        <p class="v-phil-approach">${approach}</p>
        <div class="v-phil-rule"></div>
        <p class="v-phil-body">${body}</p>
      </div>
    </div>`;

  if (mainImg) block.querySelector('.v-phil-main').append(mainImg);
  if (thumbImg) block.querySelector('.v-phil-thumb').append(thumbImg);
}

/* ==========================================================================
   3. TEAM ("The Council")
   Layout: N principal rows (photo + meta), pairs of 2 rows each, followed
   by one closing teaser row (image + text).
   ========================================================================== */
function decorateTeam(block, rows) {
  const teaserTextRow = rows[rows.length - 1];
  const teaserImgRow = rows[rows.length - 2];
  const principalRows = rows.slice(0, rows.length - 2);

  const principals = [];
  for (let i = 0; i < principalRows.length; i += 2) {
    const photo = imgOf(principalRows[i]);
    const { name, role } = splitNameRole(textOf(principalRows[i + 1]));
    principals.push({ photo, name, role });
  }

  block.textContent = '';
  block.innerHTML = `
    <div class="v-council-inner">
      <div class="v-council-head">
        <span class="eyebrow">The Council</span>
        <h2>The specialists behind every authentication.</h2>
      </div>
      <div class="v-council-grid"></div>
      <div class="v-council-teaser">
        <div class="v-council-teaser-img"></div>
        <p></p>
      </div>
    </div>`;

  const grid = block.querySelector('.v-council-grid');
  principals.forEach(({ photo, name, role }) => {
    const card = document.createElement('div');
    card.className = 'v-principal';
    card.innerHTML = `
      <div class="v-principal-photo"></div>
      <div class="v-principal-meta">
        <h3>${name}</h3>
        <span class="v-role">${role}</span>
      </div>`;
    if (photo) card.querySelector('.v-principal-photo').append(photo);
    grid.append(card);
  });

  const teaserImg = imgOf(teaserImgRow);
  if (teaserImg) block.querySelector('.v-council-teaser-img').append(teaserImg);
  block.querySelector('.v-council-teaser p').textContent = textOf(teaserTextRow);
}

/* ==========================================================================
   4. SERVICES ("How It Works" accordion)
   Row 0: main image, Row 1: intro text, remaining rows: [service name,
   service description] pairs — here BOTH cells are real content (unlike
   the label/value rows elsewhere), since the first cell doubles as the
   visible service title.
   ========================================================================== */
function decorateServices(block, rows) {
  const mainImg = imgOf(rows[0]);
  const intro = textOf(rows[1]);
  const serviceRows = rows.slice(2);

  block.textContent = '';
  block.innerHTML = `
    <div class="v-services">
      <div class="v-services-head">
        <span class="eyebrow on-light">How It Works</span>
        <p class="v-services-intro">${intro}</p>
      </div>
      <div class="v-services-layout">
        <div class="v-services-img"></div>
        <div class="v-accordion"></div>
      </div>
    </div>`;

  if (mainImg) block.querySelector('.v-services-img').append(mainImg);

  const accordion = block.querySelector('.v-accordion');
  serviceRows.forEach((row, i) => {
    const cells = row.querySelectorAll(':scope > div');
    const name = (cells[0]?.textContent || '').trim();
    const desc = (cells[1]?.textContent || '').trim();
    if (!name) return;

    const item = document.createElement('div');
    item.className = 'v-acc-row';
    const panelId = `v-acc-panel-${i}`;
    item.innerHTML = `
      <button class="v-acc-trigger" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="${panelId}">
        <span class="v-acc-no">0${i + 1}</span>
        <span class="v-acc-title">${name}</span>
        <span class="v-acc-cross"></span>
      </button>
      <div class="v-acc-panel" id="${panelId}">
        <p>${desc}</p>
      </div>`;
    accordion.append(item);
  });

  accordion.addEventListener('click', (e) => {
    const trigger = e.target.closest('.v-acc-trigger');
    if (!trigger) return;
    const panel = trigger.nextElementSibling;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    accordion.querySelectorAll('.v-acc-trigger').forEach((t) => {
      t.setAttribute('aria-expanded', 'false');
      t.nextElementSibling.style.maxHeight = null;
    });

    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    }
  });

  // Open the first panel by default.
  const first = accordion.querySelector('.v-acc-panel');
  if (first) first.style.maxHeight = `${first.scrollHeight}px`;
}

/* ==========================================================================
   5. CTA
   ========================================================================== */
function decorateCta(block, rows) {
  const bgImg = imgOf(rows[0]);
  const heading = textOf(rows[1]);
  const sub = textOf(rows[2]);
  const ctaBtn = linkOf(rows[3]);
  const emailLink = linkOf(rows[4]);

  block.textContent = '';
  block.innerHTML = `
    <div class="v-cta">
      <div class="v-cta-bg"></div>
      <div class="v-cta-scrim"></div>
      <svg class="v-cta-watermark" width="320" height="320" viewBox="0 0 300 300" aria-hidden="true">
        <circle cx="150" cy="150" r="128" fill="none" stroke="var(--gold-bright)" stroke-width="1"/>
        <circle cx="150" cy="150" r="104" fill="none" stroke="var(--gold-bright)" stroke-width="1"/>
      </svg>
      <div class="v-cta-inner">
        <span class="eyebrow">Ready When You Are</span>
        <h2>${heading}</h2>
        <p>${sub}</p>
        <div class="v-cta-actions"></div>
      </div>
    </div>`;

  const bg = block.querySelector('.v-cta-bg');
  if (bgImg) bg.append(bgImg);

  const actionsEl = block.querySelector('.v-cta-actions');
  if (ctaBtn) { ctaBtn.className = 'v-cta-btn'; actionsEl.append(ctaBtn); }
  if (emailLink) {
    const wrap = document.createElement('div');
    wrap.className = 'v-cta-email';
    wrap.append(emailLink);
    actionsEl.append(wrap);
  }
}

/* ==========================================================================
   Dispatch by variant class
   ========================================================================== */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  if (block.classList.contains('philosophy')) return decoratePhilosophy(block, rows);
  if (block.classList.contains('team')) return decorateTeam(block, rows);
  if (block.classList.contains('services')) return decorateServices(block, rows);
  if (block.classList.contains('cta')) return decorateCta(block, rows);
  return decorateHero(block, rows);
}