import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

let product = null;
let bids = [];
let session = null;
let countdownInterval = null;
let showingAllBidders = false;

const inrFormatter = new Intl.NumberFormat('en-IN');
const timelineDateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const scheduleIdle = (typeof window !== 'undefined' && window.requestIdleCallback)
  ? window.requestIdleCallback.bind(window)
  : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function initialsFor(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || trimmed[0].toUpperCase();
}

function debounce(fn, delay = 60) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const SVGS = {
  status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  reserve: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  ceiling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6"/></svg>',
  bids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  active: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  pending: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  completed: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  ended: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  badgeDot: `<svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="3"/></svg>`,
  powerOff: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`
};

export default function decorate(block) {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  const isMyBids = block.classList.contains('mybids');
  const isMyBidDetails = block.classList.contains('my-bid-details');
  const isMyListings = block.classList.contains('mylistings');
  const isMyListingDetails = block.classList.contains('my-listing-details');

  const unblockAEMSEO = () => {
    document.querySelectorAll('meta[name="robots"]').forEach(meta => meta.remove());
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'index, follow';
    document.head.appendChild(metaRobots);
  };
  unblockAEMSEO();

  session = typeof getSession === 'function' ? getSession() : null;
  if (!session) {
    try { session = JSON.parse(localStorage.getItem('Vaultora_session')); } catch(e) {}
  }
  if (!session && window.location.hostname === 'localhost') {
    session = { name: "Demo Bidder", email: "bidder@vaultora.local" };
  }
  if (!session) { window.location.href = "register.html"; return; }

  // ==========================================================================
  // CONFIG 1: USER ACTIVE BIDS CORE MATRIX OVERVIEW LIST
  // ==========================================================================
  if (isMyBids) {
    const userEmail = session.email.toLowerCase();
    const allBids = getBids() || [];
    const allProducts = getProducts() || [];

    const getBidHistoryForProduct = (productId) => {
      return allBids
        .filter(b => String(b.productId) === String(productId))
        .map(b => ({ ...b, amount: parseFloat(b.amount) || 0 }))
        .sort((a, b) => b.amount - a.amount);
    };

    const userBiddedProductIds = [...new Set(
      allBids.filter(b => b.user && b.user.toLowerCase() === userEmail).map(b => String(b.productId))
    )];

    const uniqueUserBids = userBiddedProductIds.map(pid => {
      const productItem = allProducts.find(p => String(p.id) === pid);
      const productBids = getBidHistoryForProduct(pid);
      const userPersonalBids = productBids.filter(b => b.user && b.user.toLowerCase() === userEmail);
      const personalHighestBid = userPersonalBids[0]?.amount || 0;
      const personalBidTime = userPersonalBids[0]?.timestamp || productItem?.endTime;
      const isGlobalLeader = productBids[0]?.user && productBids[0].user.toLowerCase() === userEmail;
      const uniqueUserOrder = [...new Set(productBids.map(b => b.user.toLowerCase()))];
      const userRank = uniqueUserOrder.indexOf(userEmail) + 1;

      let statusGroup = 'outbid', statusLabel = `Outbid - Rank #${userRank}`, statusClass = 'status-outbid';
      const isLive = productItem && productItem.auctionStatus === 'active';

      if (isLive) {
        if (isGlobalLeader) { statusGroup = 'leading'; statusLabel = 'Leading Bid'; statusClass = 'status-leading'; }
      } else {
        const initialPrice = Number(productItem?.startingBid || productItem?.price || 0);
        const isWinner = productItem?.winnerEmail && productItem.winnerEmail.toLowerCase() === userEmail;
        if (isWinner && personalHighestBid >= initialPrice) {
          statusGroup = 'won';
          statusLabel = productItem?.paymentStatus === 'completed' ? 'Won Auction - Purchased' : 'Won Auction - Pending Payment';
          statusClass = productItem?.paymentStatus === 'completed' ? 'status-won-purchased' : 'status-won-pending';
        } else { statusGroup = 'lost'; statusLabel = 'Lost Auction'; statusClass = 'status-lost'; }
      }

      return { id: pid, title: productItem?.title || 'Unknown Historical Asset', image: productItem?.images?.[0] || productItem?.image || '', endTime: productItem?.endTime, personalHighestBid, personalBidTime, statusGroup, statusLabel, statusClass, searchText: `${productItem?.title || ''} ${productItem?.seller || ''}`.toLowerCase() };
    });

    const countTotal = uniqueUserBids.length, countLeading = uniqueUserBids.filter(b => b.statusGroup === 'leading').length, countWon = uniqueUserBids.filter(b => b.statusGroup === 'won').length, countLost = uniqueUserBids.filter(b => b.statusGroup === 'lost').length, maxBidVal = uniqueUserBids.reduce((max, b) => b.personalHighestBid > max ? b.personalHighestBid : max, 0);

    block.innerHTML = `
      <div class="mybids-dashboard">
        <div class="mybids-header"><h1 class="mybids-title">My <em>Bids</em></h1><p class="mybids-subtitle">Showing ${countTotal} unique auctions</p></div>
        <div class="mybids-stats-bar">
          <div class="mybids-stat-card"><h2>${countTotal}</h2><p>TOTAL BIDS</p></div><div class="mybids-stat-card"><h2>${countLeading}</h2><p>LEADING</p></div><div class="mybids-stat-card"><h2>${countWon}</h2><p>WON</p></div><div class="mybids-stat-card"><h2>${countLost}</h2><p>LOST</p></div>
          <div class="mybids-stat-card mybids-stat-card--wide"><h2>₹${maxBidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2><p>HIGHEST BID MAX</p></div>
        </div>
        <div class="mybids-filter-row">
          <div class="mybids-search-wrap"><input type="search" id="bidsSearchInput" placeholder="Search auctions..." aria-label="Search auctions" /><button type="button" class="btn-clear-search" id="clearBidsSearchBtn">✕</button></div>
          <div class="mybids-select-wrap"><select id="bidsStatusSelect" aria-label="Filter by status"><option value="all">All Statuses</option><option value="leading">Leading</option><option value="outbid">Outbid</option><option value="won">Won</option><option value="lost">Lost</option></select></div>
        </div>
        <div class="mybids-sections-container" id="bidsListWrapper"></div>
      </div>
    `;

    const listWrapper = block.querySelector('#bidsListWrapper');
    const searchInput = block.querySelector('#bidsSearchInput');
    const clearBtn = block.querySelector('#clearBidsSearchBtn');

    const renderFilteredLists = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filterStatus = block.querySelector('#bidsStatusSelect').value;
      const sectionsData = [{ id: 'leading', label: 'Leading Bids', icon: '⏆' }, { id: 'outbid', label: 'Outbid', icon: '☉' }, { id: 'won', label: 'Won Auctions', icon: '✧' }, { id: 'lost', label: 'Lost Auctions', icon: '📁' }];
      const frag = document.createDocumentFragment(); let visibleSecs = 0;

      sectionsData.forEach(sec => {
        if (filterStatus !== 'all' && filterStatus !== sec.id) return;
        const filtered = uniqueUserBids.filter(b => b.statusGroup === sec.id && (!query || b.searchText.includes(query)));
        if (filtered.length === 0) return;
        visibleSecs++;

        const secEl = document.createElement('section'); secEl.className = `mybids-section mybids-section--${sec.id}`;
        let gridHTML = filtered.map((item, index) => {
          const timeString = item.personalBidTime ? new Date(item.personalBidTime).toLocaleString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true}) : '';
          const isPriority = index < 2;
          return `
            <div class="mybids-item-card border-indicator--${sec.id}" data-id="${item.id}" role="button" tabIndex="0" aria-label="View details for ${item.title}">
              <div class="mybids-item-thumb">${item.image ? `<img src="${item.image}" alt="${item.title}" loading="${isPriority ? 'eager' : 'lazy'}" width="85" height="85" decoding="async" />` : `<div class="thumb-placeholder">${item.title.charAt(0)}</div>`}</div>
              <div class="mybids-item-details"><h3 class="mybids-item-name">${item.title}</h3><p class="mybids-item-time">${timeString}</p><div class="mybids-item-badge-row"><span class="mybids-status-pill ${item.statusClass}">${item.statusLabel}</span></div></div>
              <div class="mybids-item-financials"><span class="financial-value">₹${item.personalHighestBid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>`;
        }).join('');

        secEl.innerHTML = `<h2 class="mybids-section-title"><span class="sec-icon" aria-hidden="true">${sec.icon}</span> ${sec.label} (${filtered.length})</h2><div class="mybids-grid">${gridHTML}</div>`;
        frag.appendChild(secEl);
      });

      listWrapper.textContent = '';
      if (visibleSecs === 0) {
        listWrapper.innerHTML = `<p class="mybids-no-results">No active bid summaries match your chosen parameters.</p>`;
      } else listWrapper.appendChild(frag);
    };

    listWrapper.onclick = (e) => { const card = e.target.closest('.mybids-item-card'); if (card) window.location.href = `my-bid-details?id=${card.getAttribute('data-id')}`; };
    searchInput.addEventListener('input', () => { clearBtn.classList.toggle('visible', searchInput.value.length > 0); renderFilteredLists(); });
    clearBtn.onclick = () => { searchInput.value = ''; clearBtn.classList.remove('visible'); renderFilteredLists(); };
    block.querySelector('#bidsStatusSelect').addEventListener('change', renderFilteredLists);
    renderFilteredLists();
  }

  // ==========================================================================
  // CONFIG 2: USER ACTIVE BID DETAILS CARD INSPECTION
  // ==========================================================================
  else if (isMyBidDetails) {
    const rows = [...block.children];
    const config = {};
    rows.forEach(row => {
      const cols = row.querySelectorAll(':scope > div');
      if (cols.length >= 2) {
        config[cols[0].textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = cols[1].textContent.trim();
      }
    });

    const authorText = {
      leadingMsg: config.leadingmessage || "🟢 You currently hold the highest bid.",
      outbidMsg: config.outbidmessage || "🔴 You have been outbid by a higher offer.",
      wonMsg: config.wonmessage || "🏆 Congratulations! You won this auction.",
      payBtn: config.paybuttontext || "Secure Escrow & Pay Now",
      declineBtn: config.declinebuttontext || "Decline Purchase Lot",
      confirmDecline: config.terminatewarning || "Are you sure you want to decline this purchase lot?"
    };

    block.innerHTML = '';
    const wrapper = document.createElement('div'); wrapper.className = 'my-bid-details-wrapper';
    const mainComponent = document.createElement('div'); mainComponent.className = 'my-bid-details';
    const leftCol = document.createElement('div'); leftCol.className = 'media-display-column';
    const rightCol = document.createElement('div'); rightCol.className = 'auction-actions-column';

    mainComponent.append(leftCol, rightCol); wrapper.appendChild(mainComponent); block.appendChild(wrapper);

    let toastNode = document.getElementById('toast');
    if (!toastNode) {
      toastNode = document.createElement('div'); toastNode.id = 'toast'; toastNode.className = 'my-bid-details-toast';
      toastNode.setAttribute('role', 'alert'); toastNode.setAttribute('aria-live', 'polite'); document.body.appendChild(toastNode);
    }

    const productId = new URLSearchParams(window.location.search).get("id");
    if (!productId) { window.location.href = "my-bids.html"; return; }

    const loadBidDetails = (pId) => {
      const products = getProducts() || []; product = products.find(p => String(p.id) === String(pId));
      if (!product) { rightCol.innerHTML = `<div class="status-notice-box" role="alert">Requested catalog auction lot entries are no longer verified.</div>`; return; }

      bids = (getBids() || []).filter(b => String(b.productId) === String(pId)).sort((a, b) => b.amount - a.amount);
      if (product.auctionStatus !== "active" && !product.winnerEmail && bids.length) {
        const validOverBids = bids.filter(b => !product.declinedBy?.includes(b.user) && Number(b.amount) >= Number(product.startingBid || product.price || 0));
        if (validOverBids.length) { product.winnerEmail = validOverBids[0].user; product.paymentStatus = product.paymentStatus || "pending"; }
      }

      requestAnimationFrame(() => {
        const images = product.images?.length ? product.images : [product.image];
        leftCol.innerHTML = `<div class="main-showcase-frame"><div class="showcase-clear-scrim"></div><img id=\"mainImage\" src=\"${images[0] || ''}\" alt=\"Asset\" loading=\"eager\" decoding=\"async\" width=\"648\" height=\"460\" fetchpriority=\"high\" /></div><div class="thumbnail-strip-carousel"></div>`;
        const tc = leftCol.querySelector('.thumbnail-strip-carousel');
        images.forEach((img, i) => { if(img) tc.innerHTML += `<img src=\"${img}\" data-src=\"${img}\" alt=\"Thumb ${i+1}\" decoding=\"async\" loading=\"lazy\" width=\"84\" height=\"84\" />`; });
        tc.onclick = (evt) => { const t = evt.target.closest('img[data-src]'); if(t) document.getElementById('mainImage').src = t.dataset.src; };

        const myBids = bids.filter(b => b.user.toLowerCase() === session.email.toLowerCase());
        const myHighest = myBids.length ? Math.max(...myBids.map(b => Number(b.amount))) : 0;
        const highest = bids.length ? Number(bids[0].amount) : Number(product.startingBid || product.price || 0);
        const uniqueAmounts = [...new Set(bids.map(b => b.amount))].sort((a, b) => b - a);
        const rank = uniqueAmounts.indexOf(myHighest) + 1; const isLive = product.auctionStatus === 'active';

        rightCol.innerHTML = `
          <div><div class="auction-badge" id="auctionBadge">Active</div><h1 id="productTitle">${product.title}</h1><div class="catalog-metadata-bar"><span>Category: <strong>${product.category || 'General'}</strong></span><span>Seller: <strong>${product.seller || 'Vaultora Partner'}</strong></span></div></div>
          <div class="financial-performance-ticker">
            <div class="ticker-node-card"><label id="max-offer-lbl">Your Max Offer</label><span aria-labelledby="max-offer-lbl">₹${inrFormatter.format(myHighest)}</span></div><div class="ticker-node-card"><label id="current-ceil-lbl">Current Ceiling</label><span aria-labelledby="current-ceil-lbl">₹${inrFormatter.format(highest)}</span></div>
            <div class="ticker-node-card"><label id="rank-lbl">Rank Position</label><span aria-labelledby="rank-lbl" style="color:#5c3c00;">${rank ? `#${rank}` : '-'}</span></div><div class="ticker-node-card"><label id="time-lbl">Time Window</label><span id="countdown">--</span></div>
          </div>
          <div class="status-notice-box" id="statusMessage" role="status">Evaluating state indexes...</div>
          <div class="action-block-card hidden" id="rebidSection"><label for="rebidAmount">Escrow Upgrade Threshold (INR)</label><div class="rebid-input-wrapper"><input type="number" id="rebidAmount" class="rebid-field-ctrl" placeholder="Greater than ₹${highest}" /><button type="button" class="btn-primary-action" id="rebidBtn">Submit Rebid</button></div></div>
          <div class="action-block-card hidden" id="paymentSection"><div class="split-button-container"><button type="button" class="btn-primary-action" id="payNowBtn">${authorText.payBtn}</button><button type="button" class="btn-secondary-action" id="declineBtn">${authorText.declineBtn}</button></div></div>
          <div class="action-block-card hidden" id="paymentCompletedSection"><div style="font-size:14px; color:#0f2414; font-weight:600; margin-bottom:6px;">✅ Settlement Audit Complete</div><p style="font-size:13px; margin:0; color:#000000; line-height:1.5;">Consignment tracking is active.</p></div>
          <div class="dashboard-section-card"><div style="font-family:'Playfair Display', serif; font-size:1.35rem; font-weight:600;">Historical Allocation Ledger</div><div class="timeline-ledger-deck" id="bidHistoryContainer"></div></div>`;

        const badge = document.getElementById("auctionBadge"), status = document.getElementById("statusMessage");
        const rebidSec = document.getElementById("rebidSection"), paySec = document.getElementById("paymentSection"), compSec = document.getElementById("paymentCompletedSection");

        if (isLive) {
          if (myHighest >= highest) { badge.textContent = "Leading"; badge.className = "auction-badge"; status.innerHTML = authorText.leadingMsg; } 
          else { badge.textContent = "Outbid"; badge.className = "auction-badge outbid"; status.innerHTML = `${authorText.outbidMsg}<br><span style="font-size:13px; font-weight:700; color:#822210; display:inline-block; margin-top:4px;">Deficiency: ₹${inrFormatter.format(highest - myHighest)}</span>`; rebidSec.classList.remove("hidden"); }
          document.getElementById("rebidBtn")?.addEventListener("click", async () => {
            const amt = Number(document.getElementById("rebidAmount")?.value); if (!amt || amt <= highest) return;
            const bList = getBids() || []; bList.push({ productId: product.id, productName: product.title, amount: amt, user: session.email, timestamp: new Date().toISOString() });
            product.currentBid = amt; const pList = getProducts() || []; const idx = pList.findIndex(x => String(x.id) === String(product.id)); if (idx !== -1) { pList[idx].currentBid = amt; pList[idx].bids = bList.filter(b => String(b.productId) === String(product.id)).length; await saveProducts(pList); }
            await saveBids(bList); if (toastNode) { toastNode.textContent = `Offer submitted.`; toastNode.classList.add("show"); } setTimeout(() => location.reload(), 1200);
          });
        } else {
          badge.textContent = "Auction Ended"; badge.className = "auction-badge ended";
          if (product.winnerEmail === session.email) {
            if (product.paymentStatus === "completed") { compSec.classList.remove("hidden"); status.innerHTML = "🏆 Escrow cleared."; } 
            else {
              paySec.classList.remove("hidden"); status.innerHTML = authorText.wonMsg;
              document.getElementById("payNowBtn")?.addEventListener("click", () => { window.location.href = `checkout?productId=${product.id}&bid=${highest}`; });
              document.getElementById("declineBtn")?.addEventListener("click", async () => {
                if (!confirm(authorText.confirmDecline)) return; product.declinedBy = product.declinedBy || []; product.declinedBy.push(session.email); product.winnerEmail = null;
                const pList = getProducts() || []; const idx = pList.findIndex(p => String(p.id) === String(product.id)); if (idx !== -1) { pList[idx] = product; await saveProducts(pList); } location.reload();
              });
            }
          } else status.innerHTML = "Closed.";
        }

        const containerHist = document.getElementById("bidHistoryContainer");
        if (!bids.length) containerHist.innerHTML = `<div style="font-size:13px; color:#000000; padding:10px 0;">No offers.</div>`;
        else containerHist.innerHTML = bids.map(b => `<div class="timeline-item"><div class="timeline-left"><div class="timeline-user">${b.user === session.email ? "You (Client)" : "Verified Token"}</div><div class="timeline-time">${timelineDateFormatter.format(new Date(b.timestamp))}</div></div><div class="timeline-amount">₹${inrFormatter.format(Number(b.amount))}</div></div>`).join('');

        if (product.endTime) {
          const end = new Date(product.endTime).getTime();
          const tick = () => { const diff = end - Date.now(); if (diff <= 0) { document.getElementById("countdown").textContent = "Ended"; clearInterval(countdownInterval); return; } const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000); document.getElementById("countdown").textContent = `${d}d ${h}h ${m}m ${s}s`; };
          tick(); countdownInterval = setInterval(tick, 1000);
        }
      });
    };
    loadBidDetails(productId);
  }

  // ==========================================================================
  // CONFIG 3: SELLER ACTIVE INVENTORY TRACK SUMMARY DIRECTORY
  // ==========================================================================
  else if (isMyListings) {
    block.innerHTML = `
      <div class="mylistings-dashboard">
        <div class="mylistings-header"><h1 class="mylistings-title">My <em>Listings</em></h1><p class="mylistings-subtitle" id="listingsSubtitle">Loading listed items inventory...</p></div>
        <div class="mylistings-stats-bar">
          <div class="mylistings-stat-card" id="card-total"><h3 id="metric-total">0</h3><p>Total Items</p></div><div class="mylistings-stat-card" id="card-active"><h3 id="metric-active">0</h3><p>Active Live</p></div><div class="mylistings-stat-card" id="card-ended"><h3 id="metric-ended">0</h3><p>Ended Auctions</p></div>
        </div>
        <div class="mylistings-filter-row">
          <div class="mylistings-search-wrap"><input type="search" id="listingSearchInput" placeholder="Search listed products..." autocomplete="off" aria-label="Search listed products" /><button type="button" class="btn-clear-search" id="clearSearchBtn">✕</button></div>
          <div class="mylistings-select-wrap"><select id="statusFilterSelector" aria-label="Filter listings by status"><option value="all">Show All Sections</option><option value="active">Active Auctions Only</option><option value="pending">Payment Pending Only</option><option value="completed">Payment Completed Only</option><option value="no_bids">Ended (No Bids) Only</option></select></div>
        </div>
        <div class="mylistings-sections-container" id="dynamicCategorizedContainer"></div>
      </div>
    `;

    const listContainer = block.querySelector('#dynamicCategorizedContainer');
    const searchInput = block.querySelector('#listingSearchInput');
    const clearBtn = block.querySelector('#clearSearchBtn');

    const renderMyListings = () => {
      const query = searchInput.value.toLowerCase();
      const filter = block.querySelector('#statusFilterSelector').value;
      const listings = (getProducts() || []).filter(p => p && (p.sellerEmail?.toLowerCase() === session.email.toLowerCase() || p.seller?.toLowerCase() === session.name?.toLowerCase()));

      block.querySelector('#metric-total').textContent = listings.length;
      block.querySelector('#metric-active').textContent = listings.filter(p => p.auctionStatus === 'active').length;
      block.querySelector('#metric-ended').textContent = listings.filter(p => p.auctionStatus !== 'active').length;

      const groups = { active: { title: "Active Live Auctions", icon: SVGS.active, items: [] }, pending: { title: "Payment Pending Auctions", icon: SVGS.pending, items: [] }, completed: { title: "Payment Completed Auctions", icon: SVGS.completed, items: [] }, no_bids: { title: "Ended Auctions (No Bids)", icon: SVGS.ended, items: [] } };
      listings.filter(p => p.title?.toLowerCase().includes(query)).reverse().forEach(p => {
        if (p.auctionStatus === 'active') groups.active.items.push(p);
        else if (p.paymentStatus === 'completed') groups.completed.items.push(p);
        else if (p.paymentStatus === 'pending') groups.pending.items.push(p);
        else groups.no_bids.items.push(p);
      });

      if (filter !== 'all') Object.keys(groups).forEach(k => { if (k !== filter) groups[k].items = []; });
      const visibleCount = Object.values(groups).reduce((acc, g) => acc + g.items.length, 0);
      block.querySelector('#listingsSubtitle').textContent = `Showing ${visibleCount} listed item${visibleCount === 1 ? '' : 's'}`;

      if (visibleCount === 0) { listContainer.innerHTML = `<div class="mylistings-no-results"><p>No listings found matching filter parameters.</p></div>`; return; }

      listContainer.innerHTML = Object.keys(groups).map(k => {
        const g = groups[k]; if (!g.items.length) return '';
        return `
          <div class="mylistings-section">
            <h2 class="mylistings-section-title">${g.icon}<span>${g.title} (${g.items.length})</span></h2>
            <div class="mylistings-grid">${g.items.map((p, idx) => {
              const live = p.auctionStatus === 'active';
              let sText = "Live & Active", sClass = "status-leading", iClass = "border-indicator--leading";
              if (!live) {
                if (p.paymentStatus === 'completed') { sText = "Payment Completed"; sClass = "status-won-purchased"; iClass = "border-indicator--won"; }
                else if (p.paymentStatus === 'pending') { sText = "Payment Pending"; sClass = "status-won-pending"; iClass = "border-indicator--outbid"; }
                else { sText = "Ended (No Bids)"; sClass = "status-lost"; iClass = "border-indicator--lost"; }
              }
              return `<div class="mylistings-item-card ${iClass}" data-id="${p.id}" style="--i: ${idx % 15};"><div class="mylistings-item-thumb"><img src="${p.images?.[0] || p.image || ''}" alt="${p.title}" loading="lazy" width="84" height="84" /></div><div class="mylistings-item-details"><h3 class="mylistings-item-name">${p.title}</h3><p class="mylistings-item-time">Category: ${p.category || 'General'}</p><div class="mylistings-status-pill ${sClass}">${SVGS.badgeDot} <span>${sText}</span></div></div><div class="mylistings-item-financials"><span class="financial-value">₹${Number(p.currentBid || p.startingBid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>${live ? `<button type="button" class="btn-end-auction-early" data-id="${p.id}">${SVGS.powerOff} End Early</button>` : ''}</div></div>`;
            }).join('')}</div>
          </div>`;
      }).join('');
    };

    listContainer.onclick = async (e) => {
      const earlyBtn = e.target.closest('.btn-end-auction-early');
      if (earlyBtn) {
        e.stopPropagation(); if (confirm("Terminate auction immediately?")) {
          const pId = earlyBtn.dataset.id, pList = getProducts() || [], item = pList.find(x => String(x.id) === String(pId)), pBids = (getBids()||[]).filter(b => String(b.productId) === String(pId)).sort((a,b)=>Number(b.amount)-Number(a.amount));
          if (item) { item.endTime = new Date().toISOString(); if (pBids.length) { item.auctionStatus = 'inactive'; item.winnerEmail = pBids[0].user?.toLowerCase(); item.currentBid = Number(pBids[0].amount); item.paymentStatus = 'pending'; } else { item.auctionStatus = 'ended'; item.paymentStatus = 'none'; } await saveProducts(pList); renderMyListings(); }
        } return;
      }
      const card = e.target.closest('.mylistings-item-card'); if (card) window.location.href = `/my-listing-details?id=${card.dataset.id}`;
    };

    searchInput.addEventListener('input', () => { clearBtn.classList.toggle('visible', searchInput.value.length > 0); renderMyListings(); });
    clearBtn.onclick = () => { searchInput.value = ''; clearBtn.classList.remove('visible'); renderMyListings(); };
    block.querySelector('#statusFilterSelector').onchange = renderMyListings;
    renderMyListings();
  }

  // ==========================================================================
  // CONFIG 4: SELLER DETAILED PRODUCT ANALYTICS MODULE
  // ==========================================================================
  else if (isMyListingDetails) {
    const pId = new URLSearchParams(window.location.search).get('id');
    const productItem = (getProducts() || []).find(p => String(p?.id) === String(pId));
    if (!productItem) { block.innerHTML = `<div class="dashboard-section-card"><div class="plain-empty-box-notice">Product statistics unavailable.</div></div>`; return; }

    const itemBids = (getBids() || []).filter(b => String(b?.productId) === String(productItem.id));
    const systemOrders = JSON.parse(localStorage.getItem('Vaultora_orders') || '[]');
    const matchedOrder = systemOrders.find(o => String(o?.productId) === String(productItem.id));

    block.className = 'my-listing-details cards block';
    block.innerHTML = `
      <div class="my-listing-details-wrapper">
        <div class="details-dashboard-header"><span class="dashboard-eyebrow">Auction Dashboard</span><h1 class="dashboard-main-title">Listing <em>Performance Analytics</em></h1></div>
        <div class="details-scaffold-layout">
          <div class="listing-identity-panel">
            <div class="media-frame"><img src="${productItem.images?.[0] || productItem.image || ''}" alt="${productItem.title}"></div>
            <div class="identity-top-row"><span class="asset-category-badge">${productItem.category || 'Collection Item'}</span></div>
            <h2 class="asset-title">${productItem.title}</h2><div class="lot-ticket"><span class="lot-ticket-label">Lot No.</span><span class="lot-ticket-value">${productItem.id}</span></div>
            <div class="asset-divider"></div><div class="asset-description-box"><p>${productItem.description || ''}</p></div>
          </div>
          <div class="performance-metrics-panel">
            <div class="metrics-ticker-tape">
              <div class="ticker-card" data-metric="status"><div class="ticker-icon">${ICONS.status}</div><span class="ticker-label">Listing Status</span><span class="status-pill" data-live="${productItem.auctionStatus==='active'}"><span class="status-dot"></span>${productItem.auctionStatus==='active'?'Live Active':'Ended'}</span></div>
              <div class="ticker-card" data-metric="reserve"><div class="ticker-icon">${ICONS.reserve}</div><span class="ticker-label">Starting Reserve</span><span class="ticker-value">₹${Number(productItem.startingBid || productItem.price || 0).toLocaleString('en-IN')}</span></div>
              <div class="ticker-card" data-metric="ceiling"><div class="ticker-icon">${ICONS.ceiling}</div><span class="ticker-label">Current Ceiling</span><span class="ticker-value">₹${Number(productItem.currentBid || productItem.startingBid || 0).toLocaleString('en-IN')}</span></div>
              <div class="ticker-card" data-metric="bids"><div class="ticker-icon">${ICONS.bids}</div><span class="ticker-label">Total Bids Cast</span><span class="ticker-value">${itemBids.length}</span></div>
            </div>
            ${itemBids.length ? `<div class="dashboard-section-card"><h3>Bidding Ceiling Progress Spline</h3><div class="canvas-graph-container"><canvas id="bidsSparklineCanvas" width="700" height="180"></canvas></div></div>` : ''}
            <div class="dashboard-section-card"><div class="card-header-row"><h3>Active Offers Placement Ledger</h3></div><div id="biddersActivityList"></div></div>
            <div class="dashboard-section-card" id="shippingLogisticsBox" style="display:none;"><h3>Fulfillment Logistics Dispatch Records</h3><div id="shippingDetailsPayload"></div></div>
          </div>
        </div>
      </div>
    `;

    const bList = block.querySelector('#biddersActivityList');
    if (!itemBids.length) bList.innerHTML = `<div class="plain-empty-box-notice">No user bids recorded against this asset lot.</div>`;
    else {
      const sorted = [...itemBids].sort((a, b) => Number(b.amount) - Number(a.amount));
      bList.innerHTML = sorted.map((b, i) => `<div class="bid-item ${i===0?'is-leading':''}"><div class="bid-user-cell"><div class="bid-avatar">${initialsFor(b.userName || b.user)}</div><div class="bid-user-profile"><h4>${escapeHtml(b.userName || b.user)}</h4><span class="bid-timestamp">${new Date(b.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</span><span class="rank-indicator-tag">${i===0?'Leading':`Rank #${i+1}`}</span></div></div><div class="bid-financial-side"><span class="bid-amt">₹${Number(b.amount).toLocaleString('en-IN')}</span></div></div>`).join('');
      
      requestAnimationFrame(() => {
        const canvas = document.getElementById('bidsSparklineCanvas'); if (!canvas) return;
        const ctx = canvas.getContext('2d'), points = [...itemBids].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).map(x=>Number(x.amount));
        points.unshift(Number(productItem.startingBid || productItem.price || 0));
        const high = Math.max(...points), low = Math.min(...points), pad = 25, gW = canvas.width - (pad*2), gH = canvas.height - (pad*2), range = (high - low) || 1;
        ctx.clearRect(0,0,canvas.width,canvas.height); ctx.strokeStyle = 'rgba(0,0,0,0.03)';
        for(let i=0;i<=4;i++) { let y = pad+(gH*(i/4)); ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(canvas.width-pad,y); ctx.stroke(); }
        ctx.beginPath(); ctx.strokeStyle = '#1a3020'; ctx.lineWidth = 2.5;
        points.forEach((v, i) => { const x = pad + (gW * (i / (points.length - 1))), y = canvas.height - pad - (gH * ((v - low) / range)); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      });
    }

    if (matchedOrder && matchedOrder.shippingAddress) {
      block.querySelector('#shippingLogisticsBox').style.display = 'block'; const addr = matchedOrder.shippingAddress;
      block.querySelector('#shippingDetailsPayload').innerHTML = `<div class="order-fulfillment-card"><div style="margin-bottom:0.5rem;"><span class="invoice-reference-badge">Invoice Reference Ledger #${matchedOrder.id}</span></div><div class="item-prop-row"><span class="item-prop-lbl">Recipient Name</span><span class="item-prop-val">${escapeHtml(addr.name)}</span></div><div class="item-prop-row"><span class="item-prop-lbl">Shipping Destination</span><span class="item-prop-val">${escapeHtml(addr.address)}</span></div><div class="item-prop-row"><span class="item-prop-lbl">City & PIN</span><span class="item-prop-val">${escapeHtml(addr.city)} — ${escapeHtml(addr.pin)}</span></div></div>`;
    }
  }
}