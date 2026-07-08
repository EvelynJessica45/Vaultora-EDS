import { 
  getProducts, 
  getBids, 
  getSession, 
  saveBids, 
  saveProducts, 
  getFavorites,  
  saveFavorites  
} from '../../scripts/storage.js';

const FILTER_EVENT = 'auctionfilters:change';
const SEARCH_SORT_EVENT = 'auctionlisting:state-change';

let activeBidProduct = null;

/* ==========================================================================
   UTILITY HELPERS
   ========================================================================== */
function formatRupees(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
function applyFilter(filterType) {
  if (filterType === 'ending-within-24h') {
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // Logic to filter products
    const filtered = allProducts.filter(p => {
      const endTime = new Date(p.endTime);
      return (endTime - now) <= oneDayInMs && (endTime - now) > 0;
    });
    
    renderListings(filtered); // Refresh the UI with filtered results
  }
}
function formatRupeesFull(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getBidHistoryForProduct(productId) {
  return (getBids() || [])
    .filter(b => String(b.productId) === String(productId))
    .map(b => ({
      ...b,
      amount: parseFloat(b.amount) || 0 
    }))
    .sort((a, b) => b.amount - a.amount);
}

function formatCountdown(endTime) {
  if (!endTime) return null;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { label: 'Ended', cls: 'ended' };
  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const d = Math.floor(diff / 864e5);
  if (d > 1) return { label: `${d}d left`, cls: '' };
  if (h > 0) return { label: `${h}h left`, cls: h < 3 ? 'ending' : '' };
  return { label: `${m}m left`, cls: 'ending' };
}

function createToast(msg) {
  let el = document.getElementById('toast-notification');
  if (!el) {
    el = document.createElement('div'); el.id = 'toast-notification'; el.className = 'toast-bubble'; document.body.append(el);
  }
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function parseMetadataMap(block) {
  const map = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    map[cells[0].textContent.trim().toLowerCase()] = cells[1].textContent.trim();
  });
  return map;
}

/* ==========================================================================
   ACCESSIBLE PANE LAYOUT RENDER GENERATORS
   ========================================================================== */
function renderHeaderPane(layoutContainer, fields) {
  const pane = document.createElement('div'); pane.className = 'auction-products-header-pane auctionlisting block';
  const header = document.createElement('div'); header.className = 'auctionlisting-header';
  const titleRow = document.createElement('div'); titleRow.className = 'auctionlisting-title-row';
  const titleWrap = document.createElement('div'); titleWrap.className = 'auctionlisting-title-wrap';

  const h1 = document.createElement('h1'); h1.className = 'auctionlisting-title';
  const words = (fields.title || 'Product Listings').trim().split(/\s+/);
  if (words.length <= 1) { h1.textContent = fields.title; } 
  else {
    const lastWord = words.pop(); h1.append(`${words.join(' ')} `);
    const span = document.createElement('span'); span.className = 'gold-word'; span.textContent = lastWord; h1.append(span);
  }
  titleWrap.append(h1);

  if (fields.subtitle) {
    const sub = document.createElement('p'); sub.className = 'auctionlisting-subtitle'; sub.textContent = fields.subtitle; titleWrap.append(sub);
  }

  const actions = document.createElement('div'); actions.className = 'auctionlisting-actions-container';
  const searchWrap = document.createElement('div'); searchWrap.className = 'auctionlisting-search';
  searchWrap.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  
  // FIXED: Added an explicit semantic label + ID correlation for the search bar input
  const searchLabel = document.createElement('label');
  searchLabel.htmlFor = 'storefrontSearchInput';
  searchLabel.className = 'visually-hidden';
  searchLabel.textContent = fields['search placeholder'] || 'Search luxury auctions...';
  searchWrap.append(searchLabel);

  const input = document.createElement('input'); 
  input.type = 'search'; 
  input.id = 'storefrontSearchInput';
  input.className = 'auctionlisting-search-input'; 
  input.placeholder = fields['search placeholder'] || 'Search luxury auctions...';
  
  // FIXED: Added aria-label to the icon-only search cancellation button
  const clearBtn = document.createElement('button'); 
  clearBtn.type = 'button'; 
  clearBtn.className = 'btn-clear-search'; 
  clearBtn.innerHTML = '✕';
  clearBtn.setAttribute('aria-label', 'Clear search query');
  searchWrap.append(input, clearBtn);

  const toggleBtn = document.createElement('button'); toggleBtn.type = 'button'; toggleBtn.className = 'auctionlisting-toggle-filters-btn';
  toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> <span class="btn-label-text">Hide Filters</span>`;

  actions.append(searchWrap, toggleBtn); titleRow.append(titleWrap, actions);
  const metaRow = document.createElement('div'); metaRow.className = 'auctionlisting-meta-row';
  const results = document.createElement('div'); results.className = 'auctionlisting-results'; results.textContent = fields['results text'] || '';
  metaRow.append(results); header.append(titleRow, metaRow); pane.append(header); layoutContainer.append(pane);

  toggleBtn.addEventListener('click', () => {
    layoutContainer.classList.toggle('sidebar-closed');
    toggleBtn.querySelector('.btn-label-text').textContent = layoutContainer.classList.contains('sidebar-closed') ? 'Show Filters' : 'Hide Filters';
  });

  let debounceId;
  input.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', input.value.length > 0);
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      document.dispatchEvent(new CustomEvent(SEARCH_SORT_EVENT, { detail: { search: input.value.trim().toLowerCase() } }));
    }, 200);
  });

  clearBtn.addEventListener('click', () => {
    input.value = ''; clearBtn.classList.remove('visible');
    document.dispatchEvent(new CustomEvent(SEARCH_SORT_EVENT, { detail: { search: '' } })); input.focus();
  });
}

function renderFiltersPane(layoutContainer, categories) {
  const pane = document.createElement('div'); pane.className = 'auction-products-filters-pane auctionfilters block';
  const panel = document.createElement('div'); panel.className = 'auctionfilters-panel';
  
  const heading = document.createElement('div'); heading.className = 'auctionfilters-heading'; heading.textContent = 'Filters & Sorting';
  panel.append(heading);

  const sortSection = document.createElement('div'); sortSection.className = 'auctionfilters-section';
  
  // FIXED: Changed sort section title wrapper into a true semantic <label for="..."> element
  const sLabel = document.createElement('label'); 
  sLabel.htmlFor = 'storefrontSortDropdown';
  sLabel.className = 'auctionfilters-section-label'; 
  sLabel.textContent = 'Sort Order';
  
  const sWrap = document.createElement('div'); sWrap.className = 'auctionfilters-select-wrapper';
  const select = document.createElement('select'); 
  select.id = 'storefrontSortDropdown';
  select.className = 'auctionfilters-sort-dropdown';
  
  const opts = { 
    'default': 'Newest Additions', 
    'price_asc': 'Price: Low to High', 
    'price_desc': 'Price: High to Low', 
    'bids_desc': 'Most Bids',
    'bids_asc': 'Least Bids',
    'ending_soon': 'Ending Soon' 
  };
  Object.entries(opts).forEach(([k, v]) => { const opt = document.createElement('option'); opt.value = k; opt.textContent = v; select.append(opt); });
  select.addEventListener('change', () => document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { group: 'sort', value: select.value } })));
  sWrap.append(select); sortSection.append(sLabel, sWrap); panel.append(sortSection);

  const rSection = document.createElement('div'); rSection.className = 'auctionfilters-section';
  const rLabel = document.createElement('div'); rLabel.className = 'auctionfilters-section-label'; rLabel.textContent = 'Price Range (₹)';
  const pRow = document.createElement('div'); pRow.className = 'auctionfilters-range-pills';
  const minP = document.createElement('span'); minP.className = 'auctionfilters-range-pill';
  const maxP = document.createElement('span'); maxP.className = 'auctionfilters-range-pill';
  pRow.append(minP, maxP);

  const track = document.createElement('div'); track.className = 'auctionfilters-slider-track';
  
  // FIXED: Attached distinct aria-labels to slider track range sliders
  const minI = document.createElement('input'); minI.type = 'range'; minI.min = '0'; minI.max = '50000000'; minI.value = '0'; minI.className = 'auctionfilters-slider';
  minI.setAttribute('aria-label', 'Minimum price range selection slider');
  const maxI = document.createElement('input'); maxI.type = 'range'; maxI.min = '0'; maxI.max = '50000000'; maxI.value = '50000000'; maxI.className = 'auctionfilters-slider';
  maxI.setAttribute('aria-label', 'Maximum price range selection slider');
  track.append(minI, maxI);

  const inputsRow = document.createElement('div'); inputsRow.className = 'auctionfilters-range-inputs';
  
  // FIXED: Attached dedicated labels to numeric text entry boxes
  const minF = document.createElement('input'); minF.type = 'number'; minF.id = 'numInputMinPrice'; minF.className = 'auctionfilters-range-numinput'; minF.value = '0';
  minF.setAttribute('aria-label', 'Minimum price numerical value input');
  const maxF = document.createElement('input'); maxF.type = 'number'; maxF.id = 'numInputMaxPrice'; maxF.className = 'auctionfilters-range-numinput'; maxF.value = '50000000';
  maxF.setAttribute('aria-label', 'Maximum price numerical value input');
  inputsRow.append(minF, document.createTextNode('to'), maxF);

  const syncSliders = () => {
    const minPct = (minI.value / minI.max) * 100; const maxPct = (maxI.value / maxI.max) * 100;
    track.style.background = `linear-gradient(to right, var(--nav-circle-bg) ${minPct}%, var(--nav-text-gold) ${minPct}%, var(--nav-text-gold) ${maxPct}%, var(--nav-circle-bg) ${maxPct}%)`;
    minP.textContent = formatRupees(minI.value); maxP.textContent = formatRupees(maxI.value);
    document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { group: 'bid', min: parseFloat(minI.value), max: parseFloat(maxI.value) } }));
  };

  minI.addEventListener('input', () => { if (maxI.value - minI.value < 10) minI.value = maxI.value - 10; minF.value = minI.value; syncSliders(); });
  maxI.addEventListener('input', () => { if (maxI.value - minI.value < 10) maxI.value = parseInt(minI.value) + 10; maxF.value = maxI.value; syncSliders(); });

  rSection.append(rLabel, pRow, track, inputsRow); panel.append(rSection);
  setTimeout(syncSliders, 50);

  if (categories.length) {
    const catSec = document.createElement('div'); catSec.className = 'auctionfilters-section';
    const cLabel = document.createElement('div'); cLabel.className = 'auctionfilters-section-label'; cLabel.textContent = 'Category';
    const cList = document.createElement('div'); cList.className = 'auctionfilters-checklist';
    
    // FIXED: Ensured category input options establish unique, explicit ID tracking loops
    const allRow = document.createElement('label'); allRow.className = 'auctionfilters-check-row';
    allRow.htmlFor = 'catCheck_all';
    allRow.innerHTML = `<input type="checkbox" id="catCheck_all" value="all" checked /><span>All Categories</span>`;
    cList.append(allRow);

    const inputs = [];
    categories.forEach((cat, idx) => {
      const row = document.createElement('label'); row.className = 'auctionfilters-check-row';
      const uniqueId = `catCheck_${idx}`;
      row.htmlFor = uniqueId;
      row.innerHTML = `<input type="checkbox" id="${uniqueId}" value="${cat}" /><span>${cat}</span>`;
      cList.append(row); inputs.push(row.querySelector('input'));
    });

    allRow.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) { inputs.forEach(i => i.checked = false); document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { group: 'category', values: [] } })); }
    });
    inputs.forEach(inp => inp.addEventListener('change', () => {
      allRow.querySelector('input').checked = !inputs.some(i => i.checked);
      const activeCats = inputs.filter(i => i.checked).map(i => i.value);
      document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { group: 'category', values: activeCats } }));
    }));

    catSec.append(cLabel, cList); panel.append(catSec);
  }

  const resetBtn = document.createElement('button'); resetBtn.type = 'button'; resetBtn.className = 'auctionfilters-reset'; resetBtn.textContent = 'Reset Filters';
  resetBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { reset: true } }));
    select.value = 'default'; minI.value = '0'; maxI.value = '50000000'; minF.value = '0'; maxF.value = '50000000';
    panel.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = (i.value === 'all')); syncSliders();
  });
  
  panel.append(resetBtn); pane.append(panel); layoutContainer.append(pane);
}

function renderProductsGridPane(layoutContainer) {
  const pane = document.createElement('div'); pane.className = 'auction-products-grid-pane auctionproducts block';
  const grid = document.createElement('div'); grid.className = 'auctionproducts-grid'; pane.append(grid); layoutContainer.append(pane);
  return grid;
}

function buildDynamicCard(p, session, favList) {
  const card = document.createElement('article'); card.className = 'auctionproducts-card'; card.setAttribute('role', 'article');
  const bids = getBidHistoryForProduct(p.id);
  const trueHighestBidPrice = bids.length ? bids[0].amount : parseFloat(p.startingBid || p.price || 0);
  const timer = formatCountdown(p.endTime);
  const liked = session ? favList.includes(p.id) : false;

  card.dataset.category = p.category || 'Luxury';
  card.dataset.currentBid = String(trueHighestBidPrice);
  card.dataset.bidsCount = String(bids.length);
  card.dataset.endsInMinutes = String(p.endTime ? Math.floor((new Date(p.endTime).getTime() - Date.now()) / 60000) : Number.MAX_SAFE_INTEGER);
  card.dataset.searchText = `${p.title || ''} ${p.seller || ''} ${p.category || ''}`.toLowerCase();

  const media = document.createElement('div'); media.className = 'auctionproducts-media';
  if (p.images?.[0] || p.image) {
    const img = document.createElement('img'); 
    img.src = p.images?.[0] || p.image; 
    img.className = 'auctionproducts-img-single'; 
    img.loading = 'lazy'; 
    // FIXED: Appended a true structural alternative image label tracking description
    img.alt = `Luxurious auction showcase asset: ${p.title || 'Artifact'}`;
    media.append(img);
  } else {
    media.classList.add('auctionproducts-media--placeholder'); media.textContent = (p.title || '?').charAt(0);
  }

  const body = document.createElement('div'); body.className = 'auctionproducts-body';
  body.innerHTML = `
    <p class="auctionproducts-seller">${p.seller || 'Verified Seller'}</p>
    <h3 class="auctionproducts-title">${p.title || 'Untitled Asset'}</h3>
    <div class="auctionproducts-bid-info">
      <span class="auctionproducts-bid-label">${bids.length ? 'Current High' : 'Starting'}</span>
      ${timer ? `<span class="auctionproducts-timer ${timer.cls}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${timer.label}</span>` : ''}
    </div>
    <div class="auctionproducts-price-row">
      <span class="auctionproducts-price">${formatRupeesFull(trueHighestBidPrice)}</span>
      <span class="auctionproducts-bids-count">${bids.length} bids</span>
    </div>
    <button type="button" class="auctionproducts-bid-btn">Place Bid</button>
    <button type="button" class="auctionproducts-fav ${liked ? 'is-active' : ''}" aria-label="${liked ? 'Remove item from your saved favourites directory' : 'Add item to your saved favourites directory'}">
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4.5 5.3 4c2-.3 3.9.7 5 2.4C11.4 4.7 13.3 3.7 15.3 4c3.3.5 5 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3z" fill="currentColor"></path></svg>
    </button>
  `;

  body.querySelector('.auctionproducts-bid-btn').addEventListener('click', (e) => { e.stopPropagation(); openBidModalWindow(p.id); });
  body.querySelector('.auctionproducts-fav').addEventListener('click', (e) => {
    e.stopPropagation(); if (!session) { createToast('Please login first'); return; }
    const favorites = getFavorites() || {}; if (!favorites[session.email]) favorites[session.email] = [];
    const active = favorites[session.email].includes(p.id);
    favorites[session.email] = active ? favorites[session.email].filter(f => f !== p.id) : [...favorites[session.email], p.id];
    saveFavorites(favorites); createToast(active ? 'Removed from favourites' : '❤️ Added to favourites');
    document.dispatchEvent(new CustomEvent('storefront:refresh'));
  });

  card.append(media, body); card.addEventListener('click', () => { window.location.href = `detail?id=${p.id}`; });
  return card;
}

function openBidModalWindow(id) {
  const session = getSession();
  if (!session) { createToast('Please log in to place a bid'); setTimeout(() => (window.location.href = 'register'), 900); return; }
  const p = getProducts().find(x => x.id === id); if (!p) return;

  activeBidProduct = id; document.getElementById('bidProductName').textContent = p.title;
  const bids = getBidHistoryForProduct(p.id);
  const hi = bids.length ? Number(bids[0].amount) : Number(p.startingBid || p.price || 0);
  document.getElementById('bidCurrentPrice').textContent = `Current bid: ₹${hi.toFixed(2)}`;

  const bidInp = document.getElementById('bidAmount'); bidInp.value = '';
  const existingW = bidInp.parentNode.querySelector('.quick-bid-wrapper'); if (existingW) existingW.remove();
  
  const wrap = document.createElement('div'); wrap.className = 'quick-bid-wrapper';
  [100, 200, 500, 1000].forEach(val => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-quick-add'; btn.textContent = `+₹${val}`;
    btn.onclick = () => { let base = parseFloat(bidInp.value); if (isNaN(base) || base <= 0) base = parseFloat(hi) || 0; bidInp.value = (base + val).toFixed(2); };
    wrap.appendChild(btn);
  });
  bidInp.insertAdjacentElement('afterend', wrap);
  document.getElementById('bidMsg').textContent = ''; document.getElementById('bidModal').classList.add('open');
}

async function handleBidSubmission() {
  const amount = parseFloat(document.getElementById('bidAmount').value);
  const p = getProducts().find(x => x.id === activeBidProduct); if (!p) return;
  const session = getSession(); const bids = getBidHistoryForProduct(p.id);
  const hi = bids.length ? Number(bids[0].amount) : Number(p.startingBid || p.price || 0);
  const msgEl = document.getElementById('bidMsg');

  if (bids.length && bids[0].user.toLowerCase() === session.email.toLowerCase()) { msgEl.textContent = 'You are already the highest bidder.'; msgEl.className = 'modal-msg err'; return; }
  if (isNaN(amount) || amount <= 0) { msgEl.textContent = 'Please enter a valid amount.'; msgEl.className = 'modal-msg err'; return; }
  if (amount < hi && !document.getElementById('bidAmount').hasAttribute('data-warned')) { msgEl.textContent = 'Your bid is lower than the current highest bid.'; msgEl.className = 'modal-msg warn'; document.getElementById('bidAmount').setAttribute('data-warned', 'true'); return; }

  const allBids = getBids(); allBids.push({ productId: p.id, productName: p.title, amount, user: session.email, timestamp: new Date().toISOString() });
  const sortedH = allBids.filter(b => b.productId === p.id).sort((a,b) => b.amount - a.amount);
  const maxBid = sortedH.length ? Number(sortedH[0].amount) : Number(p.startingBid || p.price || 0);

  const allProducts = getProducts(); const pRef = allProducts.find(x => x.id === p.id);
  if (pRef) { pRef.currentBid = maxBid; pRef.bids = sortedH.length; }

  await saveBids(allBids); await saveProducts(allProducts);
  msgEl.textContent = `✅ Bid processed! Current is ₹${maxBid.toFixed(2)}`;
  setTimeout(() => { document.getElementById('bidModal').classList.remove('open'); document.dispatchEvent(new CustomEvent('storefront:refresh')); }, 1200);
}

function applyFiltersAndSort(grid, state) {
  const cards = [...grid.children]; 
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  cards.forEach((card) => {
    let visible = true;
    
    // Existing search/category/price logic...
    if (state.search && !card.dataset.searchText.includes(state.search)) visible = false;
    if (state.categories?.length && !state.categories.includes(card.dataset.category)) visible = false;
    
    // NEW: 24-hour filter logic
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('filter') === 'ending-within-24h') {
      const endsIn = parseInt(card.dataset.endsInMinutes, 10) * 60000;
      if (endsIn > oneDayInMs || endsIn < 0) visible = false;
    }

    card.style.display = visible ? '' : 'none';
  });
  if (state.sort) {
    visibleCards.sort((a, b) => {
      if (state.sort === 'price_asc') return parseFloat(a.dataset.currentBid) - parseFloat(b.dataset.currentBid);
      if (state.sort === 'price_desc') return parseFloat(b.dataset.currentBid) - parseFloat(a.dataset.currentBid);
      if (state.sort === 'bids_desc') return parseInt(b.dataset.bidsCount, 10) - parseInt(a.dataset.bidsCount, 10);
      if (state.sort === 'bids_asc') return parseInt(a.dataset.bidsCount, 10) - parseInt(b.dataset.bidsCount, 10);
      if (state.sort === 'ending_soon') return parseInt(a.dataset.endsInMinutes, 10) - parseInt(b.dataset.endsInMinutes, 10);
      return 0;
    });
    visibleCards.forEach(card => grid.append(card));
  }
  const resultsEl = document.querySelector('.auctionlisting-results');
  if (resultsEl) resultsEl.textContent = `Showing ${visibleCount} items active`;
}

export default function decorate(block) {
  const fields = parseMetadataMap(block);
  const dbProducts = getProducts() || [];
  const categories = [...new Set(dbProducts.map(p => p.category).filter(Boolean))].sort();

  block.textContent = '';
  
  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'auction-products-container';
  block.append(layoutContainer);

  if (!document.getElementById('bidModal')) {
    const modal = document.createElement('div'); modal.id = 'bidModal'; modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'bidProductName');
    
    modal.innerHTML = `
      <div class="modal-card">
        <h3 id="bidProductName"></h3>
        <p id="bidCurrentPrice"></p>
        <div class="modal-input-group">
          <label for="bidAmount" class="visually-hidden">Enter your bid value in Indian Rupees (₹)</label>
          <input type="number" id="bidAmount" placeholder="Enter amount (₹)" step="0.01" />
        </div>
        <div id="bidMsg" class="modal-msg" aria-live="polite"></div>
        <div class="modal-actions">
          <button type="button" class="btn-modal-cancel">Cancel</button>
          <button type="button" class="btn-modal-submit">Submit Bid</button>
        </div>
      </div>`;
    document.body.append(modal);
    modal.querySelector('.btn-modal-cancel').addEventListener('click', () => modal.classList.remove('open'));
    modal.querySelector('.btn-modal-submit').addEventListener('click', handleBidSubmission);
  }

  renderHeaderPane(layoutContainer, fields);
  renderFiltersPane(layoutContainer, categories);
  const grid = renderProductsGridPane(layoutContainer);

  const state = { search: '', sort: 'default', categories: [], bidMin: 0, bidMax: 50000000 };

  const reloadGrid = () => {
    grid.innerHTML = '';
    
    const session = getSession();
    const favorites = typeof localStorage !== 'undefined' && localStorage.getItem('vaultora_favorites') ? JSON.parse(localStorage.getItem('vaultora_favorites')) : {};
    let activeItems = (getProducts() || []).filter(p => p.auctionStatus === 'active');
    if (session?.email) activeItems = activeItems.filter(p => p.sellerEmail !== session.email);

    if (activeItems.length > 0) {
      activeItems.forEach(p => grid.append(buildDynamicCard(p, session, session ? (favorites[session.email] || []) : [])));
      applyFiltersAndSort(grid, state);
    } else {
      grid.innerHTML = '<p class="empty-state-text" style="padding:2rem; color:var(--text-muted); grid-column: 1 / -1; text-align: center;">No active auctions available.</p>';
    }
  };

  document.addEventListener('storefront:refresh', reloadGrid);
  document.addEventListener(SEARCH_SORT_EVENT, (e) => { if (e.detail.search !== undefined) state.search = e.detail.search; applyFiltersAndSort(grid, state); });
  document.addEventListener(FILTER_EVENT, (e) => {
    const { detail } = e;
    if (detail.reset) { state.categories = []; state.bidMin = 0; state.bidMax = 50000000; state.sort = 'default'; }
    else if (detail.group === 'category') state.categories = detail.values;
    else if (detail.group === 'sort') state.sort = detail.value;
    else if (detail.group === 'bid') { state.bidMin = detail.min; state.bidMax = detail.max; }
    applyFiltersAndSort(grid, state);
  });
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('filter') === 'ending-within-24h') {
  state.sort = 'ending_soon'; // Sets the dropdown/sort state
}
  reloadGrid();
}