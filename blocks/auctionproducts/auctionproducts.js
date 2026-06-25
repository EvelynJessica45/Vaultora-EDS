/*
 * auctionproducts.js
 * Decorates the "auctionproducts" block. Seamlessly switches from static 
 * spreadsheet layout parsing to reading dynamic, real-time items from the 
 * centralized AWS S3 database state sync framework.
 */

import { getProducts, getBids, getSession, saveBids, saveProducts } from '../../scripts/storage.js';

const SEARCH_SORT_EVENT = 'auctionlisting:state-change';
const FILTER_EVENT = 'auctionfilters:change';

let activeBidProduct = null;

// FIXED: Strictly parses numbers as floats and forces rigorous high-to-low mathematical sorting
// function getBidHistoryForProduct(productId) {
//   return (getBids() || [])
//     .filter(b => String(b.productId) === String(productId))
//     .map(b => ({
//       ...b,
//       amount: parseFloat(b.amount) || 0 // Force evaluation to absolute real numbers
//     }))
//     .sort((a, b) => b.amount - a.amount); // Explicitly sorts numeric values: Highest to Lowest
// }

// FIXED: Checks user status against strictly sorted numeric values
function getUserBidStatus(productId, userEmail) {
  const bids = getBidHistoryForProduct(productId);
  if (!bids.length) return 'never_bid';
  
  // Isolate the true mathematical maximum entry
  const highestBid = bids[0]; 
  if (highestBid.user.toLowerCase() === userEmail.toLowerCase()) {
    return 'leading';
  }
  
  const hasUserBid = bids.some(b => b.user.toLowerCase() === userEmail.toLowerCase());
  return hasUserBid ? 'outbid' : 'never_bid';
}
function parseCurrency(val) {
  if (typeof val === 'number') return val;
  const digits = (val || '').replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function formatRupees(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function endsInToMinutes(endTimeStr) {
  if (!endTimeStr) return Number.MAX_SAFE_INTEGER;
  const diffMs = new Date(endTimeStr).getTime() - Date.now();
  return diffMs > 0 ? Math.floor(diffMs / 1000 / 60) : 0;
}

// FIXED: Added the required formatCountdown utility from dashboard.js to prevent runtime crashes
function formatCountdown(endTime) {
  if (!endTime) return null;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { label: 'Ended', cls: 'ended' };
  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const d = Math.floor(diff / 864e5);
  if (d > 1) return { label: `${d}d left`, cls: '' };
  if (h > 0) return { label: `${h}h ${m}m left`, cls: h < 3 ? 'ending' : '' };
  return { label: `${m}m left`, cls: 'ending' };
}

/* Modal Helper Interceptors */
function setMsg(text, type) {
  const el = document.getElementById('bidMsg');
  if (!el) return;
  el.textContent = text;
  el.className = `modal-msg ${type}`; 
}

function openModal() {
  const el = document.getElementById('bidModal');
  if (el) el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const el = document.getElementById('bidModal');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function createToast(msg) {
  let el = document.getElementById('toast-notification');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-notification';
    el.className = 'toast-bubble';
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// function buildDynamicCard(p, session, favList) {
//   const card = document.createElement('article');
//   card.className = 'auctionproducts-card';
//   card.setAttribute('role', 'article');

//   // ── THE CHOSEN LOGIC FROM DASHBOARD.JS ──
//   // 1. Fetch full bid history for this specific product asset
//   const bids = getBidHistoryForProduct(p.id);
  
//   // 2. Mathematically isolate the highest active bid amount, fallback to initial price
//   const currentHighestBidPrice = bids.length 
//     ? Number(bids[0].amount) 
//     : Number(p.startingBid || p.price || 0);

//   // 3. Match the timer configuration
//   const timer = formatCountdown(p.endTime);
//   const displayStatus = (p.auctionStatus === 'active' && timer?.label !== 'Ended') ? 'LIVE' : 'CLOSED';
//   const liked = session ? favList.includes(p.id) : false;

//   // Sync dataset tracking markers to make grid filters work instantly
//   card.dataset.id = p.id;
//   card.dataset.category = p.category || 'Luxury';
//   card.dataset.status = displayStatus;
//   card.dataset.currentBid = String(currentHighestBidPrice); // Feeds the correct price to sliders
//   card.dataset.endsInMinutes = String(p.endTime ? Math.floor((new Date(p.endTime).getTime() - Date.now()) / 60000) : Number.MAX_SAFE_INTEGER);
//   card.dataset.searchText = `${p.title || ''} ${p.seller || ''} ${p.category || ''}`.toLowerCase();
//   card.dataset.sellerType = p.goodSeller ? 'good' : 'standard';

//   const media = document.createElement('div');
//   media.className = 'auctionproducts-media';

//   if (p.images?.[0] || p.image) {
//     const img = document.createElement('img');
//     img.src = p.images?.[0] || p.image;
//     img.alt = p.title;
//     img.className = 'auctionproducts-img-single';
//     img.loading = 'lazy';
//     media.append(img);
//   } else {
//     media.classList.add('auctionproducts-media--placeholder');
//     media.textContent = (p.title || '?').charAt(0);
//   }

//   const body = document.createElement('div');
//   body.className = 'auctionproducts-body';

//   const sellerEl = document.createElement('p');
//   sellerEl.className = 'auctionproducts-seller';
//   sellerEl.textContent = `${p.seller || 'Verified Seller'}${p.goodSeller ? ' · ✦' : ''}`;

//   const titleEl = document.createElement('h3');
//   titleEl.className = 'auctionproducts-title';
//   titleEl.textContent = p.title || 'Untitled Asset';

//   const bidInfo = document.createElement('div');
//   bidInfo.className = 'auctionproducts-bid-info';

//   const bidLabel = document.createElement('span');
//   bidLabel.className = 'auctionproducts-bid-label';
  
//   // Dynamic descriptive labeling matching bid availability status
//   bidLabel.textContent = bids.length ? 'Current Highest Bid' : 'Starting Bid';
//   bidInfo.append(bidLabel);

//   if (timer) {
//     const timerSpan = document.createElement('span');
//     timerSpan.className = `auctionproducts-timer ${timer.cls}`;
//     timerSpan.innerHTML = `
//       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
//       ${timer.label}
//     `;
//     bidInfo.append(timerSpan);
//   }

//   const priceRow = document.createElement('div');
//   priceRow.className = 'auctionproducts-price-row';

//   const price = document.createElement('span');
//   price.className = 'auctionproducts-price';
  
//   // 4. Render the dynamically calculated highest valuation into Rupees string format
//   price.textContent = formatRupees(currentHighestBidPrice);

//   const bidsCount = document.createElement('span');
//   bidsCount.className = 'auctionproducts-bids-count';
//   bidsCount.textContent = `${bids.length} bids`;

//   priceRow.append(price, bidsCount);

//   const placeBidBtn = document.createElement('button');
//   placeBidBtn.type = 'button';
//   placeBidBtn.className = 'auctionproducts-bid-btn';
//   placeBidBtn.textContent = 'Place Bid';
//   placeBidBtn.addEventListener('click', (e) => {
//     e.stopPropagation();
//     openBidModalWindow(p.id);
//   });

//   const favBtn = document.createElement('button');
//   favBtn.type = 'button';
//   favBtn.className = `auctionproducts-fav ${liked ? 'is-active' : ''}`;
//   favBtn.setAttribute('aria-label', liked ? 'Remove from favourites' : 'Add to favourites');
//   favBtn.innerHTML = `
//     <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
//       <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4.5 5.3 4c2-.3 3.9.7 5 2.4C11.4 4.7 13.3 3.7 15.3 4c3.3.5 5 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3z" fill="currentColor"></path>
//     </svg>
//   `;
//   favBtn.addEventListener('click', (e) => {
//     e.stopPropagation();
//     toggleLikeStatus(p.id);
//   });

//   body.append(sellerEl, titleEl, bidInfo, priceRow, placeBidBtn, favBtn);
//   card.append(media, body);

//   card.addEventListener('click', () => {
//     window.location.href = `detail?id=${p.id}`;
//   });

//   return card;
// }


// 1. FORCE RIGOROUS FLOAT CONVERSION AND CORRECT MATH SORTING
function getBidHistoryForProduct(productId) {
  return (getBids() || [])
    .filter(b => String(b.productId) === String(productId))
    .map(b => ({
      ...b,
      amount: parseFloat(b.amount) || 0 // Ensures string "1500" is completely parsed as a number
    }))
    .sort((a, b) => b.amount - a.amount); // Strict mathematical sort: Highest to Lowest
}

function buildDynamicCard(p, session, favList) {
  const card = document.createElement('article');
  card.className = 'auctionproducts-card';
  card.setAttribute('role', 'article');

  // 2. THE LOGIC ROOT BYPASS: Compute the valuation strictly from the sorted database
  const bids = getBidHistoryForProduct(p.id);
  
  // Directly extract index [0] (the true maximum), fallback ONLY if no bids exist
  const trueHighestBidPrice = bids.length 
    ? bids[0].amount 
    : parseFloat(p.startingBid || p.price || 0);

  const timer = formatCountdown(p.endTime);
  const displayStatus = (p.auctionStatus === 'active' && timer?.label !== 'Ended') ? 'LIVE' : 'CLOSED';
  const liked = session ? favList.includes(p.id) : false;

  // Sync dataset tracking markers using the computed maximum to keep slider tracks synchronized
  card.dataset.id = p.id;
  card.dataset.category = p.category || 'Luxury';
  card.dataset.status = displayStatus;
  card.dataset.currentBid = String(trueHighestBidPrice); // <--- Feeds true math highest to sidebar sliders
  card.dataset.endsInMinutes = String(p.endTime ? Math.floor((new Date(p.endTime).getTime() - Date.now()) / 60000) : Number.MAX_SAFE_INTEGER);
  card.dataset.searchText = `${p.title || ''} ${p.seller || ''} ${p.category || ''}`.toLowerCase();
  card.dataset.sellerType = p.goodSeller ? 'good' : 'standard';

  const media = document.createElement('div');
  media.className = 'auctionproducts-media';

  if (p.images?.[0] || p.image) {
    const img = document.createElement('img');
    img.src = p.images?.[0] || p.image;
    img.alt = p.title;
    img.className = 'auctionproducts-img-single';
    img.loading = 'lazy';
    media.append(img);
  } else {
    media.classList.add('auctionproducts-media--placeholder');
    media.textContent = (p.title || '?').charAt(0);
  }

  const body = document.createElement('div');
  body.className = 'auctionproducts-body';

  const sellerEl = document.createElement('p');
  sellerEl.className = 'auctionproducts-seller';
  sellerEl.textContent = `${p.seller || 'Verified Seller'}${p.goodSeller ? ' · ✦' : ''}`;

  const titleEl = document.createElement('h3');
  titleEl.className = 'auctionproducts-title';
  titleEl.textContent = p.title || 'Untitled Asset';

  const bidInfo = document.createElement('div');
  bidInfo.className = 'auctionproducts-bid-info';

  const bidLabel = document.createElement('span');
  bidLabel.className = 'auctionproducts-bid-label';
  bidLabel.textContent = bids.length ? 'Current Highest Bid' : 'Starting Bid';
  bidInfo.append(bidLabel);

  if (timer) {
    const timerSpan = document.createElement('span');
    timerSpan.className = `auctionproducts-timer ${timer.cls}`;
    timerSpan.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${timer.label}
    `;
    bidInfo.append(timerSpan);
  }

  const priceRow = document.createElement('div');
  priceRow.className = 'auctionproducts-price-row';

  const price = document.createElement('span');
  price.className = 'auctionproducts-price';
  
  // 3. RENDER THE COMPUTED HIGHEST PRICE
  price.textContent = formatRupees(trueHighestBidPrice);

  const bidsCount = document.createElement('span');
  bidsCount.className = 'auctionproducts-bids-count';
  bidsCount.textContent = `${bids.length} bids`;

  priceRow.append(price, bidsCount);

  const placeBidBtn = document.createElement('button');
  placeBidBtn.type = 'button';
  placeBidBtn.className = 'auctionproducts-bid-btn';
  placeBidBtn.textContent = 'Place Bid';
  placeBidBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openBidModalWindow(p.id);
  });

  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = `auctionproducts-fav ${liked ? 'is-active' : ''}`;
  favBtn.setAttribute('aria-label', liked ? 'Remove from favourites' : 'Add to favourites');
  favBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4.5 5.3 4c2-.3 3.9.7 5 2.4C11.4 4.7 13.3 3.7 15.3 4c3.3.5 5 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3z" fill="currentColor"></path>
    </svg>
  `;
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLikeStatus(p.id);
  });

  body.append(sellerEl, titleEl, bidInfo, priceRow, placeBidBtn, favBtn);
  card.append(media, body);

  card.addEventListener('click', () => {
    window.location.href = `detail.html?id=${p.id}`;
  });

  return card;
}
function toggleLikeStatus(id) {
  const session = getSession();
  if (!session) { createToast('Please login first'); return; }

  const favorites = getFavorites() || {};
  if (!favorites[session.email]) favorites[session.email] = [];

  const alreadyLiked = favorites[session.email].includes(id);
  favorites[session.email] = alreadyLiked
    ? favorites[session.email].filter(f => f !== id)
    : [...favorites[session.email], id];

  saveFavorites(favorites);
  createToast(alreadyLiked ? 'Removed from favourites' : '❤️ Added to favourites');
  document.dispatchEvent(new CustomEvent('storefront:refresh'));
}

function openBidModalWindow(id) {
  const session = getSession();
  if (!session) {
    createToast('Please log in to place a bid');
    setTimeout(() => (window.location.href = 'register'), 900);
    return;
  }

  const p = getProducts().find(x => x.id === id);
  if (!p) return;

  activeBidProduct = id;
  document.getElementById('bidProductName').textContent = p.title;
  const bids = getBidHistoryForProduct(p.id);
  const hi = bids.length ? Number(bids[0].amount) : Number(p.startingBid || p.price || 0);
  document.getElementById('bidCurrentPrice').textContent = `Current bid: ₹${hi.toFixed(2)}`;

  const bidInp = document.getElementById('bidAmount');
  if (bidInp) {
    bidInp.value = '';
    bidInp.removeAttribute('data-warned');
    const existingWrapper = bidInp.parentNode.querySelector('.quick-bid-wrapper');
    if (existingWrapper) existingWrapper.remove();
    
    const values = [100, 200, 500, 1000];
    const wrap = document.createElement('div');
    wrap.className = 'quick-bid-wrapper';
    values.forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-quick-add';
      btn.textContent = `+₹${val}`;
      btn.onclick = () => {
        let baseValue = parseFloat(bidInp.value);
        if (isNaN(baseValue) || baseValue <= 0) baseValue = parseFloat(hi) || 0;
        bidInp.value = (baseValue + val).toFixed(2);
      };
      wrap.appendChild(btn);
    });
    bidInp.insertAdjacentElement('afterend', wrap);
  }

  setMsg('', 'ok');
  openModal();
}

async function handleBidSubmission() {
  const amount = parseFloat(document.getElementById('bidAmount').value);
  const p = getProducts().find(x => x.id === activeBidProduct);
  if (!p) return;

  const session = getSession();
  const bids = getBidHistoryForProduct(p.id);
  const hi = bids.length ? Number(bids[0].amount) : Number(p.startingBid || p.price || 0);
  const bidInp = document.getElementById('bidAmount');

  if (bids.length && bids[0].user.toLowerCase() === session.email.toLowerCase()) {
    setMsg('You are already the highest bidder.', 'err'); 
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    setMsg('Please enter a valid amount.', 'err'); 
    return;
  }

  if (amount < hi && !bidInp.hasAttribute('data-warned')) {
    setMsg('Your bid is lower than the current highest bid. The chances of winning are lower.', 'warn');
    bidInp.setAttribute('data-warned', 'true');
    return;
  }
  bidInp.removeAttribute('data-warned');

  setMsg('Placing bid and alerting outbid users...', 'ok');

  // 1. Append the fresh bid into the centralized ledger array
  const allBids = getBids();
  allBids.push({
    productId: p.id,
    productName: p.title,
    amount,
    user: session.email,
    timestamp: new Date().toISOString()
  });

  // 2. Fetch the newly updated history for this specific product to isolate the real highest amount
  const productBidsHistory = allBids
    .filter(b => b.productId === p.id)
    .sort((a, b) => b.amount - a.amount);

  const absoluteHighestBid = productBidsHistory.length ? Number(productBidsHistory[0].amount) : Number(p.startingBid || p.price || 0);

  // 3. Update the global products master array state reference safely
  const allProducts = getProducts();
  const pRef = allProducts.find(x => x.id === p.id);
  if (pRef) {
    // FIXED: pRef.currentBid will now ALWAYS save the true mathematical highest valuation
    pRef.currentBid = absoluteHighestBid;
    pRef.bids = productBidsHistory.length;
  }

  // 4. Commit values down to local/session database systems
  await saveBids(allBids);
  await saveProducts(allProducts);

  setMsg(`✅ Bid processed! Current highest is now ₹${absoluteHighestBid.toFixed(2)}`, 'ok');
  setTimeout(() => {
    closeModal();
    document.dispatchEvent(new CustomEvent('storefront:refresh'));
  }, 1200);
}

function applyFiltersAndSort(grid, state) {
  const cards = [...grid.children];
  let visibleCount = 0;
  let totalBidsInView = 0;

  cards.forEach((card) => {
    let visible = true;

    if (state.search && !card.dataset.searchText.includes(state.search)) visible = false;
    
    if (state.categories && state.categories.length > 0) {
      if (!state.categories.includes(card.dataset.category)) {
        visible = false;
      }
    }
    
    if (state.sellerFilter === 'good' && card.dataset.sellerType !== 'good') visible = false;

    const bid = parseFloat(card.dataset.currentBid);
    if (state.bidMin != null && bid < state.bidMin) visible = false;
    if (state.bidMax != null && bid > state.bidMax) visible = false;

    if (visible) {
      card.style.display = '';
      visibleCount++;
      
      // Extract the exact bid count number from the card's text sub-element to count active bids
      const bidsCountText = card.querySelector('.auctionproducts-bids-count')?.textContent || '0';
      const numBids = parseInt(bidsCountText, 10) || 0;
      totalBidsInView += numBids;
    } else {
      card.style.display = 'none';
    }
  });

  const visibleCards = cards.filter((c) => c.style.display !== 'none');
  if (state.sort) {
    visibleCards.sort((a, b) => {
      const valA = parseFloat(a.dataset.currentBid);
      const valB = parseFloat(b.dataset.currentBid);
      const timeA = parseInt(a.dataset.endsInMinutes, 10);
      const timeB = parseInt(b.dataset.endsInMinutes, 10);

      switch (state.sort) {
        case 'price_asc':  return valA - valB;
        case 'price_desc': return valB - valA;
        case 'ending_soon': return timeA - timeB;
        default: return 0; 
      }
    });
    visibleCards.forEach((card) => grid.append(card));
  }

  // UPDATED: Dynamically change header summary label text based on active bids availability
  const resultsEl = document.querySelector('.auctionlisting-results');
  if (resultsEl) {
    if (totalBidsInView > 0) {
      resultsEl.textContent = `Showing ${visibleCount} items at Current Highest Bids`;
    } else {
      resultsEl.textContent = `Showing ${visibleCount} items at Starting Bid`;
    }
  }
}

export default function decorate(block) {
  block.textContent = '';

  if (!document.getElementById('bidModal')) {
    const modalHTML = document.createElement('div');
    modalHTML.id = 'bidModal';
    modalHTML.className = 'modal-overlay';
    modalHTML.innerHTML = `
      <div class="modal-card">
        <h3 id="bidProductName"></h3>
        <p id="bidCurrentPrice"></p>
        <div class="modal-input-group">
          <input type="number" id="bidAmount" placeholder="Enter amount (₹)" step="0.01" />
        </div>
        <div id="bidMsg" class="modal-msg"></div>
        <div class="modal-actions">
          <button type="button" class="btn-modal-cancel">Cancel</button>
          <button type="button" class="btn-modal-submit">Submit Bid</button>
        </div>
      </div>
    `;
    document.body.append(modalHTML);
    modalHTML.querySelector('.btn-modal-cancel').addEventListener('click', closeModal);
    modalHTML.querySelector('.btn-modal-submit').addEventListener('click', handleBidSubmission);
  }

  const grid = document.createElement('div');
  grid.className = 'auctionproducts-grid';
  block.append(grid);

  const state = {
    search: '',
    sort: 'default',
    categories: [], 
    sellerFilter: 'all',
    bidMin: 0,
    bidMax: 50000000,
  };

  const reloadProductsGrid = () => {
    grid.innerHTML = '';
    const session = typeof localStorage !== 'undefined' && localStorage.getItem('Vaultora_session') ? JSON.parse(localStorage.getItem('Vaultora_session')) : null;
    const favorites = typeof localStorage !== 'undefined' && localStorage.getItem('vaultora_favorites') ? JSON.parse(localStorage.getItem('vaultora_favorites')) : {};
    const favList = session ? (favorites[session.email] || []) : [];
    let products = getProducts() || [];
    products = products.filter(p => p.auctionStatus === 'active');
    
    if (session?.email) {
      products = products.filter(p => p.sellerEmail !== session.email);
    }

    if (products.length > 0) {
      products.forEach((p) => grid.append(buildDynamicCard(p, session, favList)));
      applyFiltersAndSort(grid, state);
    } else {
      grid.innerHTML = '<p class="empty-state-text" style="padding:2rem; color:var(--text-muted);">No active auctions available.</p>';
    }
  };

  document.addEventListener('storefront:refresh', reloadProductsGrid);

  document.addEventListener(SEARCH_SORT_EVENT, (e) => {
    if (e.detail.search !== undefined) {
      state.search = e.detail.search;
      if (e.detail.search.trim() !== '') {
        state.categories = [];
      }
    }
    applyFiltersAndSort(grid, state);
  });

  document.addEventListener(FILTER_EVENT, (e) => {
    const { detail } = e;
    if (detail.reset) {
      state.categories = [];
      state.sellerFilter = 'all';
      state.bidMin = 0;
      state.bidMax = 50000000;
      state.sort = 'default';
    } else if (detail.group === 'category') {
      if (detail.value === 'all') {
        state.categories = [];
      } else if (detail.value) {
        state.categories = [detail.value];
      } else {
        state.categories = detail.values || [];
      }
    } else if (detail.group === 'seller') {
      state.sellerFilter = detail.value;
    } else if (detail.group === 'sort') {
      state.sort = detail.value;
    } else if (detail.group === 'bid') {
      state.bidMin = detail.min;
      state.bidMax = detail.max;
    }
    applyFiltersAndSort(grid, state);
  });

  reloadProductsGrid();
}