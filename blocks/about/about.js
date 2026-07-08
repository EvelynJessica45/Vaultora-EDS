/* ==========================================================================
   Vaultora — "About" page matching the supplied reference design exactly.
   Compact version: image dimensions reduced to match the smaller, more
   condensed layout in about.css (hero now fits within one desktop viewport).
   Fully self-contained: no authored HTML content is read, this file owns
   all copy/structure/interactivity. Drop in as the `about` block.
   ========================================================================== */

const PORTFOLIO = [
  { icon: 'clock', title: 'Luxury Timepieces', body: 'Mechanical masterpieces, vintage references, and highly limited independent watches.' },
  { icon: 'shield', title: 'Premium Tech Gear', body: 'Rare prototypes, custom-engineered desktop configurations, and high-performance digital systems.' },
  { icon: 'star', title: 'High-Fidelity Audio', body: 'Audiophile headphones, boutique tube amplifiers, and meticulously maintained analog setups.' },
  { icon: 'frame', title: 'Heritage Objects', body: 'Exceptional design collectibles, luxury travel goods, and architectural items looking for a second lifecycle.' },
];

const STATS = [
  { value: '100%', label: 'Verified Authenticity' },
  { value: '$0', label: 'Risk Escrow Protection' },
  { value: '15k+', label: 'Global Premium Collectors' },
  { value: '24 Hrs', label: 'Inspection & Verification Window' },
];

const TEAM = [
  { seed: 'portrait-woman-evelyn', name: 'Evelyn Jessica', role: 'Founder & Vision Lead', bio: 'Manages our platform\u2019s design ideas and coordinates global business strategy.' },
  { seed: 'portrait-man-dharun', name: 'Dharun S', role: 'Co-Founder & Systems', bio: 'Builds and protects our high-speed product verification network systems.' },
  { seed: 'portrait-man-gururaj', name: 'Gururaj S', role: 'Chief Logistics Officer', bio: 'Oversees our worldwide packing paths and eco-friendly delivery rules.' },
  { seed: 'portrait-man-marcus', name: 'Marcus Vance', role: 'Head Of Appraisal', bio: 'Leads item evaluation, history matching, and luxury art authentications.' },
  { seed: 'portrait-woman-helena', name: 'Helena Rostova', role: 'Compliance Counsel', bio: 'Handles user safety rules, payment security protection, and legal checks.' },
];

const FAQS = [
  { q: 'Are all products on your site real?', a: 'Yes — every listing passes a physical inspection and authenticity review by our specialists before it\u2019s approved for sale.' },
  { q: 'How do I pay if I win an auction?', a: 'Payment is collected securely through escrow immediately after the auction closes. Funds are only released to the seller after you confirm the item matches its listing.' },
  { q: 'What happens if the item is broken or fake?', a: 'You\u2019re covered by our inspection window — if the item doesn\u2019t match its listing, you get a full refund and we handle the return at no cost to you.' },
  { q: 'How does proxy bidding work?', a: 'Set the maximum you\u2019re willing to pay, and Vaultora automatically places the minimum bid needed to keep you in the lead — right up to your limit.' },
  { q: 'How much does shipping cost?', a: 'Shipping is calculated at checkout based on the item\u2019s size, value, and destination, and always includes full insurance.' },
];

const ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>',
  star: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.4-.6L12 3z"/>',
  frame: '<path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  pin: '<path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
  x: '<path d="M4 4l16 16M20 4L4 20"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* Stable, seeded placeholder photography — swap for real asset URLs whenever
   available; nothing else needs to change. Dimensions trimmed down to match
   the more compact layout. */
function photoUrl(seed, w, h) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/* ==========================================================================
   1. HERO
   ========================================================================== */
function buildHero() {
  return `
    <section class="v-hero">
      <div class="v-hero-copy">
        <span class="eyebrow on-light">Premium Auction Marketplace</span>
        <h1 class="v-hero-title"><span>About</span><span>Vaultora</span></h1>
        <p>Vaultora is a premium auction platform built for high-end, rare items. We connect passionate collectors with authenticated products while keeping our focus purely on quality, safety, and sustainable choices.</p>
        <div class="v-hero-actions">
          <a href="/dashboard" class="v-btn v-btn-dark">Explore Products</a>
          <a href="mailto:sellers@vaultora.com" class="v-btn v-btn-ghost">Become an Approved Seller</a>
        </div>
      </div>
      <div class="v-hero-visual">
        <div class="v-hero-accent"></div>
        <!-- Swapped to bidding-related imagery -->
        <div class="v-hero-main"><img src="${photoUrl('auction-bidding-gavel', 560, 620)}" alt="Gavel on auction block"></div>
        <div class="v-hero-sub"><img src="${photoUrl('bidding-paddle', 260, 260)}" alt="Auction paddle"></div>
        <div class="v-philosophy-card">
          <p>Great items shouldn\u2019t go to waste. We give high-end creations a second life, passing them safely from one passionate owner to the next.</p>
          <span>&mdash; Our Philosophy</span>
        </div>
      </div>
    </section>`;
}

/* ==========================================================================
   3. PORTFOLIO ("What You Can Find on Vaultora")
   ========================================================================== */
function buildPortfolio() {
  const cards = PORTFOLIO.map((p) => `
    <article class="v-portfolio-card">
      <div class="v-portfolio-icon">${icon(p.icon)}</div>
      <h3>${p.title}</h3>
      <p>${p.body}</p>
    </article>`).join('');

  return `
    <section class="v-portfolio" id="portfolio">
      <div class="v-section-head">
        <span class="eyebrow on-light">Curated Portfolio</span>
        <h2>What You Can Find on Vaultora</h2>
        <p class="v-section-sub">We explicitly specialize in high-caliber, exceptionally preserved luxury niches.</p>
        <div class="v-rule"></div>
      </div>
      <div class="v-portfolio-grid">${cards}</div>
    </section>`;
}

/* ==========================================================================
   5. STATS BAND
   ========================================================================== */
function buildStats() {
  const items = STATS.map((s) => `
    <div class="v-stat"><strong>${s.value}</strong><span>${s.label}</span></div>`).join('');
  return `<section class="v-stats-band"><div class="v-stats-inner">${items}</div></section>`;
}

/* ==========================================================================
   6. TEAM
   ========================================================================== */
function buildTeam() {
  const cards = TEAM.map((m) => `
    <div class="v-member">
      <div class="v-member-photo"><img src="${photoUrl(m.seed, 280, 330)}" alt="${m.name}" loading="lazy"></div>
      <h3>${m.name}</h3>
      <span class="v-member-role">${m.role}</span>
      <p>${m.bio}</p>
    </div>`).join('');

  return `
    <section class="v-team">
      <div class="v-section-head">
        <span class="eyebrow on-light">The Directors</span>
        <h2>Meet the Team</h2>
        <div class="v-rule"></div>
      </div>
      <div class="v-team-grid">${cards}</div>
    </section>`;
}

/* ==========================================================================
   7. FAQ
   ========================================================================== */
function buildFaq() {
  const rows = FAQS.map((f, i) => `
    <div class="v-acc-row">
      <button class="v-acc-trigger" aria-expanded="false" aria-controls="v-faq-${i}">
        <span>${f.q}</span>
        <span class="v-acc-plus">${icon('plus')}</span>
      </button>
      <div class="v-acc-panel" id="v-faq-${i}"><p>${f.a}</p></div>
    </div>`).join('');

  return `
    <section class="v-faq">
      <div class="v-section-head">
        <span class="eyebrow on-light">FAQ</span>
        <h2>Frequently Asked Questions</h2>
        <div class="v-rule"></div>
      </div>
      <div class="v-accordion">${rows}</div>
    </section>`;
}

/* ==========================================================================
   8. FOOTER
   ========================================================================== */
function buildFooter() {
  return `
    <footer class="v-footer">
      <div class="v-footer-grid">
        <div class="v-footer-brand">
          <div class="v-wordmark"><span class="v-wordmark-mark">V</span><span>VAULTORA</span></div>
          <p>Luxury sustainable auctions for the conscious collector.</p>
          <div class="v-footer-social">
            <a href="#" aria-label="Instagram">${icon('ig')}</a>
            <a href="#" aria-label="Pinterest">${icon('pin')}</a>
            <a href="#" aria-label="X">${icon('x')}</a>
          </div>
        </div>
        <div class="v-footer-col">
          <h4>Marketplace</h4>
          <a href="#">Browse Auctions</a><a href="#">List an Item</a><a href="#">My Bids</a><a href="#">Favourites</a><a href="#">My Listings</a>
        </div>
        <div class="v-footer-col">
          <h4>Account</h4>
          <a href="#">Profile</a><a href="#">Login / Sign Up</a>
        </div>
        <div class="v-footer-col">
          <h4>About</h4>
          <a href="#">About Vaultora</a><a href="#portfolio">What We Offer</a><a href="#">FAQ</a><a href="mailto:concierge@vaultora.com">Contact Us</a>
        </div>
      </div>
      <div class="v-footer-bottom">&copy; ${new Date().getFullYear()} Vaultora. All rights reserved.</div>
    </footer>`;
}

/* ==========================================================================
   Interactivity
   ========================================================================== */
function wireAccordion(root) {
  const accordion = root.querySelector('.v-accordion');
  if (!accordion) return;
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
}

export default function decorate(block) {
  // This file always builds the entire page — guard against running more
  // than once if multiple block instances exist on the page.
  if (document.querySelector('.v-about-final')) {
    block.remove();
    return;
  }

  block.textContent = '';
  block.classList.add('v-about-final');
  block.innerHTML = [
    buildHero(),
    buildPortfolio(),
    buildStats(),
    buildTeam(),
    buildFaq(),
    buildFooter(),
  ].join('');

  wireAccordion(block);
}