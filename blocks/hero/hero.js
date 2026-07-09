import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Extracts and normalizes user role contexts safely from token stores.
 * Optimized to prevent repeated JSON string parsing patterns.
 */
function getUserRole() {
  const token = localStorage.getItem('user_token');
  if (!token) return null;
  
  const storedRole = localStorage.getItem('user_role');
  if (storedRole) return storedRole.toLowerCase().trim();

  try {
    if (token.includes('.')) {
      const payload = token.split('.')[1];
      if (payload) {
        const profile = JSON.parse(atob(payload));
        return (profile.role || 'buyer').toLowerCase().trim();
      }
    }
  } catch (e) {
    console.warn("Authentication profiling metadata reading caught exception:", e);
  }
  return 'buyer'; 
}

/**
 * High-performance layout structural card limiter.
 * Avoids global document mutations to protect viewport responsiveness.
 */
function enforceFiveAuctionsLimit(container) {
  const grid = container || document.querySelector('.featured-auctions-grid-five');
  if (!grid) return;
  
  const auctionCards = grid.children;
  const len = auctionCards.length;
  if (len === 0) return;

  for (let i = 0; i < len; i++) {
    if (i >= 5) {
      auctionCards[i].classList.add('is-hidden');
    } else {
      auctionCards[i].classList.remove('is-hidden');
    }
  }
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Detach block contents using a single structural clearance sweep
  block.textContent = '';
  
  const fragment = document.createDocumentFragment();
  const heroSection = document.createElement('div');
  heroSection.className = 'home-hero-section';

  const innerContainer = document.createElement('div');
  innerContainer.className = 'hero-inner-container';

  // Ribbon Label Element Extraction
  const targetCode = rows[1]?.children[0]?.querySelector('code');
  const ribbonText = targetCode ? targetCode.innerText : 'NEW DROPS DAILY';
  const ribbonSub = rows[1]?.children[0]?.innerText?.replace(ribbonText, '').trim() || '25,000+ products listed';
  
  const ribbon = document.createElement('div');
  ribbon.className = 'hero-top-ribbon';
  ribbon.innerHTML = `${ribbonText} &bull; ${ribbonSub}`;
  innerContainer.append(ribbon);

  // Structural Text Content Zone Layout
  const textZone = document.createElement('div');
  textZone.className = 'hero-text-zone';

  const badgeWrapper = document.createElement('div');
  badgeWrapper.className = 'hero-badge-wrapper';
  badgeWrapper.innerHTML = '<span class="hero-badge-pill">Live Auction</span><span class="hero-badge-info">Vaultora Verified Assets</span>';
  textZone.append(badgeWrapper);

  const rawTitle = rows[2]?.children[0]?.innerHTML || 'Buy, Sell & Bid on Extraordinary Finds';
  const mainTitle = document.createElement('h1');
  mainTitle.className = 'hero-main-title';
  mainTitle.innerHTML = rawTitle.replace('#', '').replace('<em>', '<span class="gold-font">').replace('</em>', '</span>');
  textZone.append(mainTitle);

  const descParagraph = rows[2]?.children[1]?.querySelector('p');
  const descText = descParagraph ? descParagraph.innerText : (rows[2]?.children[1]?.innerText || '');
  const descNode = document.createElement('p');
  descNode.className = 'hero-main-desc';
  descNode.textContent = descText;
  textZone.append(descNode);

  // Active Buttons Container Group
  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'hero-actions-wrapper';
  
  const startBiddingBtn = document.createElement('a');
  startBiddingBtn.className = 'hero-btn primary';
  startBiddingBtn.textContent = 'Start Bidding';
  startBiddingBtn.setAttribute('href', '/dashboard');
  
 // Locate this block in the decorate(block) function
const sellItemBtn = document.createElement('a');
sellItemBtn.className = 'hero-btn secondary ';
sellItemBtn.textContent = 'About Vaultora';
// Change the href from '#' to '/dashboard'
sellItemBtn.setAttribute('href', '/about');

  actionsWrapper.append(startBiddingBtn, sellItemBtn);
  textZone.append(actionsWrapper);

  // Bottom Statistics Block Slice
  const statsRow = document.createElement('div');
  statsRow.className = 'hero-right-stats-row';
  statsRow.innerHTML = `
    <div class="stat-metric-box"><h3>10,000+</h3><p>Active Sellers</p></div>
    <div class="stat-metric-box"><h3>50,000+</h3><p>Auctions Closed</p></div>
    <div class="stat-metric-box"><h3>$8.2M+</h3><p>In Transactions</p></div>
  `;
  textZone.append(statsRow);
  innerContainer.append(textZone);

  // Background Full-Bleed Canvas Image Implementation
  const bgCanvas = document.createElement('div');
  bgCanvas.className = 'hero-bg-canvas';
  
  const sourceImg = rows[0]?.children[0]?.querySelector('img');
  if (sourceImg) {
    const src = sourceImg.getAttribute('src');
    const optimizedPic = createOptimizedPicture(src, sourceImg.alt || 'Hero Background', true, [
      { media: '(min-width: 1024px)', width: '2000' },
      { media: '(min-width: 600px)', width: '1200' },
      { width: '750' }
    ]);
    const img = optimizedPic.querySelector('img');
    if (img) {
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('loading', 'eager');
    }
    bgCanvas.append(optimizedPic);
  } else {
    const sourcePic = rows[0]?.children[0]?.querySelector('picture');
    if (sourcePic) {
      const clonedPic = sourcePic.cloneNode(true);
      const img = clonedPic.querySelector('img');
      if (img) {
        img.setAttribute('fetchpriority', 'high');
        img.setAttribute('loading', 'eager');
      }
      bgCanvas.append(clonedPic);
    }
  }
  
  heroSection.append(bgCanvas, innerContainer);
  fragment.append(heroSection);
  block.append(fragment);

  // Initialize modular interface state features and events across components
  setupPageInteractions();
}

function setupPageInteractions() {
  // 1. Update Promo Banner Button target destination link tracking parameters
  const promoCtaBtn = document.querySelector('.promo-banner-cta-btn');
  if (promoCtaBtn) {
    promoCtaBtn.innerHTML = 'Link to Ending Auctions &rarr;';
    promoCtaBtn.setAttribute('href', '/dashboard?filter=ending-within-24h');
  }

  // // 2. Configure the "Browse All" button link routing
  // const browseAllBtn = document.querySelector('.categories-browse-all');
  // if (browseAllBtn) {
  //   browseAllBtn.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     window.location.href = '/dashboard';
  //   });
  // }

  // 3. Limit Featured Auctions using an optimized localized observer interface
  const gridContainer = document.querySelector('.featured-auctions-grid-five');
  if (gridContainer) {
    enforceFiveAuctionsLimit(gridContainer);
    const observer = new MutationObserver(() => enforceFiveAuctionsLimit(gridContainer));
    observer.observe(gridContainer, { childList: true });
  }

  // 4. Secure Auth Routing for the "Sell an Item" action link triggers
 // Remove this entire block from setupPageInteractions()
const textZoneContainer = document.querySelector('.hero-text-zone');
if (textZoneContainer) {
  textZoneContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.sell-item-trigger');
    if (!btn) return;
    
    e.preventDefault();
    
    const role = getUserRole();
    if (role === 'seller' || role === 'both' || role === 'seller-buyer' || role === 'admin') {
      window.location.href = '/seller-dashboard';
    } else if (localStorage.getItem('user_token') || localStorage.getItem('user_role')) {
      showSystemPopup('Access Denied', 'Your active profile is configured as a Buyer. Please update your profile parameters to gain access to vendor dashboards.');
    } else {
      showSystemPopup('Authentication Required', 'Authentication profiling context missing. Please log in to proceed.', () => {
        window.location.href = '/register';
      });
    }
  });
}

  // 5. Shared Click Event Handler for Favorites Buttons
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-editorial-btn-fav');
    if (!btn) return;

    e.preventDefault();
    
    const isFavorited = btn.getAttribute('data-favorited') === 'true';
    if (isFavorited) {
      btn.setAttribute('data-favorited', 'false');
      btn.style.backgroundColor = '';
      btn.style.color = '';
    } else {
      btn.setAttribute('data-favorited', 'true');
      btn.style.backgroundColor = '#b9925a';
      btn.style.color = '#ffffff';
    }
  });
}

function showSystemPopup(title, message, callback = null) {
  const existingModal = document.getElementById('system-alert-portal');
  if (existingModal) existingModal.remove();

  const portal = document.createElement('div');
  portal.id = 'system-alert-portal';
  portal.style.cssText = 'position:fixed; inset:0; background:rgba(18,21,28,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1.5rem; font-family:"DM Sans", sans-serif;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#ffffff; max-width:400px; width:100%; border-radius:16px; padding:2rem; box-shadow:0 20px 40px rgba(0,0,0,0.15); text-align:center; transform:scale(0.9); transition:transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);';

  box.innerHTML = `
    <h3 style="font-family:'Playfair Display',serif; font-size:1.5rem; margin:0 0 1rem 0; color:#2e362a;">${title}</h3>
    <p style="font-size:0.9rem; color:#666666; line-height:1.5; margin:0 0 1.75rem 0;">${message}</p>
    <button id="portal-close-trigger" style="background:#2e362a; color:#ffffff; border:none; padding:0.75rem 2rem; border-radius:50px; font-weight:600; font-size:0.88rem; cursor:pointer; width:100%;">Continue</button>
  `;

  portal.append(box);
  document.body.append(portal);

  requestAnimationFrame(() => {
    box.style.transform = 'scale(1)';
  });

  document.getElementById('portal-close-trigger').addEventListener('click', () => {
    portal.remove();
    if (callback) callback();
  }, { once: true });
}