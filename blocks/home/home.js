import { createOptimizedPicture } from '../../scripts/aem.js';
import { getProducts } from '../../scripts/storage.js';

// Global Authentication/Session Mock Tracker
const SessionManager = {
  isLoggedIn: () => {
    // Check for a dummy session token in localStorage
    return localStorage.getItem('user_session') !== null;
  },
  redirectToLogin: () => {
    alert('Authentication required. Redirecting to login page...');
    window.location.href = '/login';
  }
};

export default async function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';
  block.classList.add('home-orchestrator-container');

  // 1. Partition macro-rows based on layout divider keywords
  const sectionsData = {
    hero: [],
    marquee: [],
    categories: [],
    featured: [],
    how: [],
    promo: [],
    reviews: [],
    contact: []
  };

  let currentSection = 'hero';
  rows.forEach((row) => {
    const columns = [...row.children];
    const marker = columns[0]?.textContent?.trim().toLowerCase() || '';

    // Identify Section Marker Anchors
    if (marker.includes('[marquee]')) { currentSection = 'marquee'; return; }
    if (marker.includes('[categories]')) { currentSection = 'categories'; return; }
    if (marker.includes('[featured-auctions]')) { currentSection = 'featured'; return; }
    if (marker.includes('[how-it-works]')) { currentSection = 'how'; return; }
    if (marker.includes('[promo]')) { currentSection = 'promo'; return; }
    if (marker.includes('[reviews-carousel]')) { currentSection = 'reviews'; return; }
    if (marker.includes('[contact-connect]')) { currentSection = 'contact'; return; }
    if (marker.includes('[hero]')) { currentSection = 'hero'; return; }

    sectionsData[currentSection].push(row);
  });

  // 2. Build explicit structural slot layout containers immediately to prevent CLS
  const heroSlot = document.createElement('div'); heroSlot.className = 'home-hero-section';
  const marqueeSlot = document.createElement('div'); marqueeSlot.className = 'home-marquee-section';
  const categoriesSlot = document.createElement('div'); categoriesSlot.className = 'home-categories-section';
  const featuredSlot = document.createElement('div'); featuredSlot.className = 'home-featured-section';
  const howSlot = document.createElement('div'); howSlot.className = 'home-how-section';
  const promoSlot = document.createElement('div'); promoSlot.className = 'home-promo-section';
  const reviewsSlot = document.createElement('div'); reviewsSlot.className = 'home-reviews-section';
  const contactSlot = document.createElement('div'); contactSlot.className = 'home-contact-section';

  block.append(heroSlot, marqueeSlot, categoriesSlot, featuredSlot, howSlot, promoSlot, reviewsSlot, contactSlot);

  // 3. Render critical fold elements immediately
  if (sectionsData.hero.length) renderHero(heroSlot, sectionsData.hero);
  if (sectionsData.marquee.length) renderMarquee(marqueeSlot, sectionsData.marquee);

  // 4. Yield control back to main thread for lazy below-the-fold components
  setTimeout(() => {
    if (sectionsData.categories.length) renderCategories(categoriesSlot, sectionsData.categories);
    if (sectionsData.featured.length) renderFeatured(featuredSlot, sectionsData.featured);
    if (sectionsData.how.length) renderHowItWorks(howSlot, sectionsData.how);
    
    requestAnimationFrame(() => {
      if (sectionsData.promo.length) renderPromo(promoSlot, sectionsData.promo);
      if (sectionsData.reviews.length) renderReviews(reviewsSlot, sectionsData.reviews);
      if (sectionsData.contact.length) renderContact(contactSlot, sectionsData.contact);
    });
  }, 0);
}

/* ==========================================================================
   SUB-DECORATOR ENGINE 1: HERO VIEW (UPDATED BUTTON ROUTING & AUTH CHECK)
   ========================================================================== */
function renderHero(container, rows) {
  // Simple structure building logic assuming typical authoring output
  container.innerHTML = `
    <div class="hero-inner-container">
      <div class="hero-split-grid">
        <div class="hero-text-zone">
          <h1 class="hero-main-title"><span class="title-line">Discover Rare</span><span class="title-line gold-font">Collections</span></h1>
          <p class="hero-main-desc">The premier global arena for elite collectors and historic luxury assets.</p>
          <div class="hero-actions-wrapper"></div>
        </div>
      
      </div>
    </div>
  `;

  // Fix Action Buttons Requirement
  const actionsWrapper = container.querySelector('.hero-actions-wrapper');
  
  const startBiddingBtn = document.createElement('a');
  startBiddingBtn.className = 'hero-btn primary';
  startBiddingBtn.href = '/dashboard';
  startBiddingBtn.textContent = 'Start Bidding';
  
  const sellItemBtn = document.createElement('a');
  sellItemBtn.className = 'hero-btn secondary';
  sellItemBtn.href = '#';
  sellItemBtn.textContent = 'Sell an Item';
  sellItemBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!SessionManager.isLoggedIn()) {
      SessionManager.redirectToLogin();
    } else {
      window.location.href = '/seller-dashboard';
    }
  });

  actionsWrapper.append(startBiddingBtn, sellItemBtn);

  // Link Watch Box Card to dashboard filtering for ending soon items
  const liveCard = container.querySelector('.hero-auction-card');
  if (liveCard) {
    liveCard.style.cursor = 'pointer';
    liveCard.addEventListener('click', () => {
      window.location.href = '/dashboard?filter=ending-soon';
    });
  }
}

/* ==========================================================================
   SUB-DECORATOR ENGINE 4: FEATURED LIVE AUCTIONS (5 INITIAL + TOGGLE)
   ========================================================================= */
async function renderFeatured(container, rows) {
  container.className = 'home-featured-section';

  const featuredAuctions = document.createElement('div');
  featuredAuctions.className = 'featured-auctions';
  featuredAuctions.innerHTML = `
    <div class="featured-auctions-header-editorial">
      <h2>Featured <span>Live Auctions</span></h2>
      <p class="featured-auctions-desc">Handpicked elite lots ending soon</p>
    </div>
    <div class="featured-auctions-grid-five"></div>
    <div class="featured-controls-wrapper" style="display: flex; justify-content: center; gap: 1rem; margin-top: 2.5rem;">
      <button class="filter-chip is-active" id="btn-featured-toggle" style="cursor:pointer;">Show More</button>
      <a href="/dashboard" class="filter-chip" style="text-decoration: none; text-align: center; cursor:pointer;">Browse Collection</a>
    </div>
  `;

  const gridContainer = featuredAuctions.querySelector('.featured-auctions-grid-five');
  const toggleBtn = featuredAuctions.querySelector('#btn-featured-toggle');
  
  // Pull database data array from storage engine dynamically
  const allProducts = await getProducts() || [];
  let showingMore = false;

  function displayItems() {
    gridContainer.innerHTML = '';
    // Show exactly 5 items initially; show all available rows if toggled open
    const targetItems = showingMore ? allProducts : allProducts.slice(0, 5);

    if (targetItems.length === 0) {
      gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#666;">No active auctions found.</p>`;
      return;
    }

    targetItems.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'featured-auctions-editorial-card';
      card.innerHTML = `
        <div class="card-image-arch-frame" style="height: 180px; overflow: hidden;">
          <img src="${product.image || ''}" alt="${product.title || 'Auction Item'}" style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div class="card-editorial-details">
          <h4 class="card-editorial-title">${product.title || 'Elite Lot Item'}</h4>
          <span class="card-editorial-author">Lot #${product.id || 'Unassigned'}</span>
          <div class="card-editorial-action-row" style="margin-top: 1rem;">
            <span class="card-editorial-price">$${product.price || '—'}</span>
            <div class="card-editorial-buttons">
              <button class="card-editorial-btn-bid">Bid Now</button>
            </div>
          </div>
        </div>
      `;

      // Authentication intercept checkpoint on click
      card.querySelector('.card-editorial-btn-bid').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!SessionManager.isLoggedIn()) {
          SessionManager.redirectToLogin();
        } else {
          window.location.href = `/auctions/${product.id || ''}`;
        }
      });

      gridContainer.append(card);
    });
  }

  toggleBtn.addEventListener('click', () => {
    showingMore = !showingMore;
    toggleBtn.textContent = showingMore ? 'Show Less' : 'Show More';
    displayItems();
  });

  displayItems();
  container.append(featuredAuctions);
}

/* ==========================================================================
   SUB-DECORATOR ENGINE 8: CONTACT CONNECT (DUMMY REFLECTIVE STREAM ENGINE)
   ========================================================================== */
function renderContact(container, rows) {
  container.className = 'contact-connect-container';

  const contactConnect = document.createElement('div');
  contactConnect.className = 'contact-connect';
  
  contactConnect.innerHTML = `
    <div class="connect-info-column">
      <h2>Let's <span>Connect</span></h2>
      <p class="connect-description">Reach out to our global curation desk for custom portfolio integrations or private collection evaluations.</p>
    </div>
    <div class="connect-form-column">
      <form class="connect-editorial-form" novalidate="true">
        <div class="form-group-row"><div class="form-input-field"><label for="connect-name">Your Full Name</label><input type="text" id="connect-name" placeholder="E.g., Eleanor Vance" required /></div></div>
        <div class="form-group-row"><div class="form-input-field"><label for="connect-email">Secure Email Address</label><input type="email" id="connect-email" placeholder="name@domain.com" required /></div></div>
        <div class="form-group-row"><div class="form-input-field"><label for="connect-message">Inquiry Specifications</label><textarea id="connect-message" rows="4" placeholder="Detail your collection provenance..." required></textarea></div></div>
        <div class="form-action-wrapper"><button type="submit" class="form-submit-btn">Send Message <span>&rarr;</span></button></div>
        <div class="form-submission-toast hidden" style="margin-top:1.5rem; text-align:left; background-color: #f6f5f0; border: 1px solid #eae7df; padding: 1rem; border-radius: 8px;"></div>
      </form>
    </div>
  `;

  const formNode = contactConnect.querySelector('form');
  const toastMessageZone = formNode.querySelector('.form-submission-toast');

  formNode.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameField = formNode.querySelector('#connect-name').value.trim();
    const msgField = formNode.querySelector('#connect-message').value.trim();

    if (!nameField || !msgField) {
      toastMessageZone.innerHTML = `<span style="color: #c0532e; font-weight: bold;">Error: Please fill out all fields.</span>`;
      toastMessageZone.classList.remove('hidden');
      return;
    }

    // Dynamic Live Mirror Feedback Loop
    requestAnimationFrame(() => {
      toastMessageZone.innerHTML = `
        <div style="border-left: 3px solid #b9925a; padding-left: 10px; margin-bottom: 0.5rem;">
          <small style="color:#b9925a; font-weight:bold; text-transform: uppercase; font-size: 0.7rem;">Message Transmitted:</small>
          <p style="margin: 4px 0 0 0; font-style: italic; color:#555; font-size: 0.85rem;">"${msgField}"</p>
        </div>
        <p style="margin:0; font-size:0.8rem; color:#2e362a;">Thank you, <strong>${nameField}</strong>. Your query was mirrored successfully.</p>
      `;
      toastMessageZone.classList.remove('hidden');
      formNode.reset();
    });
  });

  container.append(contactConnect);
}

// Stub Placeholders for unaltered layout code to avoid dependency broken links
function renderMarquee(c, r) { c.innerHTML = ''; }
function renderCategories(c, r) { c.innerHTML = ''; }
function renderHowItWorks(c, r) { c.innerHTML = ''; }
function renderPromo(c, r) { c.innerHTML = ''; }
function renderReviews(c, r) { c.innerHTML = ''; }