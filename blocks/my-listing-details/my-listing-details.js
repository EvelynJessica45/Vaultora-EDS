import { getProducts, getBids, getSession } from '../../scripts/storage.js';
let showingAllBidders = false;

// Small inline icon set (stroke-based, single color via currentColor so it
// always matches the ticker card's accent token).
const ICONS = {
  status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  reserve: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  ceiling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6"/></svg>',
  bids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};

// Escape user-authored strings before they're dropped into innerHTML, so a
// stray "<" or "&" in a title/description/name can't break the layout.
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

export default function decorate(block) {
  // Clear the placeholder authoring content
  block.innerHTML = '';

  // Ensure Adobe EDS wrapper container hierarchy handles luxury grid layouts cleanly
  const parentSection = block.closest('.my-listing-details-wrapper');
  if (!parentSection && block.parentNode) {
    const wrapper = document.createElement('div');
    wrapper.className = 'my-listing-details-wrapper';
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);
  }

  // Setup layout architecture scaffolding frames with layout-shift prevention
  const container = document.createElement('div');
  container.className = 'my-listing-details-container';
  container.style.width = '100%';

  // Top Title Bar Scaffolding to remove plain/bland presentation layers
  const topHeaderBar = document.createElement('div');
  topHeaderBar.className = 'details-dashboard-header';
  topHeaderBar.innerHTML = `
    <span class="dashboard-eyebrow">Auction Dashboard</span>
    <h1 class="dashboard-main-title">Listing <em>Performance Analytics</em></h1>
    <p class="dashboard-meta-subtitle" id="dashboardSubtitleHeader">Real-time valuation metrics, bidding spline vectors, and order records.</p>
  `;
  container.appendChild(topHeaderBar);

  // Core Scaffold Outer Split Wrapper Frame
  const scaffoldSplitWrap = document.createElement('div');
  scaffoldSplitWrap.className = 'details-scaffold-layout';

  // Create Left Panel Node Frame
  const leftPanel = document.createElement('div');
  leftPanel.className = 'listing-identity-panel';

  // Create Right Panel Node Frame
  const rightPanel = document.createElement('div');
  rightPanel.className = 'performance-metrics-panel';
  rightPanel.setAttribute('aria-live', 'polite');

  scaffoldSplitWrap.appendChild(leftPanel);
  scaffoldSplitWrap.appendChild(rightPanel);
  container.appendChild(scaffoldSplitWrap);
  block.appendChild(container);

  // High-performance single central click listener for dynamic pagination elements
  rightPanel.onclick = function(e) {
    const targetToggleButton = e.target.closest('.toggle-bidders-btn');
    if (targetToggleButton) {
      showingAllBidders = !showingAllBidders;
      renderSellerListingDetailsLoop();
    }
  };

  // Core execution loop routine
  function renderSellerListingDetailsLoop() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    // --- BYPASS SETUP FOR LOCAL TESTING ---
    let session = typeof getSession === 'function' ? getSession() : null;

    if (!session) {
      session = JSON.parse(localStorage.getItem('Vaultora_session'));
    }
    // --------------------------------------

    // Route authentication check validations smoothly
    if (!session) {
      window.location.replace('/register');
      return;
    }

    // Defensive Fallback Layer: Query framework memory, fall back to storage parsing if cache is blank
    let products = typeof getProducts === 'function' ? getProducts() : [];
    if (!products || products.length === 0) {
      try {
        const rawLocalProducts = localStorage.getItem('Vaultora_products');
        if (rawLocalProducts) {
          products = JSON.parse(rawLocalProducts);
        }
      } catch (e) {
        console.warn("Direct LocalStorage recovery drop bypassed:", e);
      }
    }

    const product = products.find(p => p && String(p.id) === String(productId));
    
    // Direct robust check for bids fallback parameters
    let allBids = typeof getBids === 'function' ? getBids() : [];
    if (!allBids || allBids.length === 0) {
      const rawLocalBids = localStorage.getItem('Vaultora_bids');
      if (rawLocalBids) allBids = JSON.parse(rawLocalBids);
    }

    const rawOrders = localStorage.getItem('Vaultora_orders');
    const systemOrders = rawOrders ? JSON.parse(rawOrders) : [];

    // Fallback handler if parameters miss match criteria endpoints
    if (!product) {
      leftPanel.innerHTML = `<h2 class="asset-title">Asset Entry Error</h2>`;
      rightPanel.innerHTML = `
        <div class="dashboard-section-card">
          <div class="plain-empty-box-notice">
            The requested product listing performance data is unavailable or was cleared.
          </div>
        </div>`;
      return;
    }

    // Dynamic Title Update to personalize presentation frame context
    const subtitleEl = document.getElementById('dashboardSubtitleHeader');
    if (subtitleEl) {
      subtitleEl.textContent = `Reviewing item performance records for "${product.title || product.id}"`;
    }

    // 1. Build and Inject Left Side Profile Frame with async image decoding to eliminate frame drops
    const imageSource = product.images?.[0] || product.image || 'https://placehold.co/400x300/e8dcc8/5a4a2e?text=Vaultora';
    leftPanel.innerHTML = `
      <div class="media-frame">
        <img src="${escapeHtml(imageSource)}" alt="${escapeHtml(product.title)}" decoding="async" width="400" height="300">
      </div>
      <div class="identity-top-row">
        <span class="asset-category-badge">${escapeHtml(product.category || 'General Collection')}</span>
      </div>
      <h2 class="asset-title">${escapeHtml(product.title)}</h2>
      <div class="lot-ticket">
        <span class="lot-ticket-label">Lot No.</span>
        <span class="lot-ticket-value">${escapeHtml(product.id)}</span>
      </div>
      <div class="asset-divider"></div>
      <div class="asset-description-box">
        <p>${escapeHtml(product.description || 'No descriptive catalog records accompanied this asset allocation.')}</p>
      </div>
    `;

    // Extract financials metrics data profiles
    const filteredItemBids = allBids.filter(b => b && String(b.productId) === String(product.id));
    const isLive = product.auctionStatus === 'active';
    const statusText = isLive ? "Live Active" : "Ended";

    const formattedStart = `₹${Number(product.startingBid || product.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    const formattedCurrent = `₹${Number(product.currentBid || product.startingBid || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    // 2. Assemble Financial Metrics Ticker Tape Blocks
    let performanceHTML = `
      <div class="metrics-ticker-tape">
        <div class="ticker-card" data-metric="status">
          <div class="ticker-icon">${ICONS.status}</div>
          <span class="ticker-label">Listing Status</span>
          <span class="status-pill" id="m-status" data-live="${isLive}"><span class="status-dot"></span>${statusText}</span>
        </div>
        <div class="ticker-card" data-metric="reserve">
          <div class="ticker-icon">${ICONS.reserve}</div>
          <span class="ticker-label">Starting Reserve</span>
          <span class="ticker-value">${formattedStart}</span>
        </div>
        <div class="ticker-card" data-metric="ceiling">
          <div class="ticker-icon">${ICONS.ceiling}</div>
          <span class="ticker-label">Current Ceiling</span>
          <span class="ticker-value">${formattedCurrent}</span>
        </div>
        <div class="ticker-card" data-metric="bids">
          <div class="ticker-icon">${ICONS.bids}</div>
          <span class="ticker-label">Total Bids Cast</span>
          <span class="ticker-value" style="font-family: var(--vd-font-body);">${filteredItemBids.length}</span>
        </div>
      </div>
    `;

    // 3. Assemble Chart Panel Frame
    if (filteredItemBids.length > 0) {
      performanceHTML += `
        <div class="dashboard-section-card" id="graphPanelWrapper">
          <div class="card-header-row">
            <h3>Bidding Ceiling Progress Spline</h3>
            <div class="chart-extremes-legend">
              <span class="extreme-peak" id="graphHighLabel">Peak: --</span>
              <span class="extreme-floor" id="graphLowLabel">Floor: --</span>
            </div>
          </div>
          <div class="canvas-graph-container">
            <canvas id="bidsSparklineCanvas" width="700" height="180"></canvas>
          </div>
        </div>
      `;
    }

    // 4. Assemble Live Bidders Ledger list loop tracking tables
    performanceHTML += `
      <div class="dashboard-section-card">
        <div class="card-header-row">
          <h3>Active Offers Placement Ledger</h3>
          <span class="card-header-count">${filteredItemBids.length} ${filteredItemBids.length === 1 ? 'bid' : 'bids'}</span>
        </div>
        <div id="biddersActivityList"></div>
      </div>
    `;

    // 5. Assemble Logistics box targets
    performanceHTML += `
      <div class="dashboard-section-card" id="shippingLogisticsBox" style="display: none;">
        <div class="card-header-row">
          <h3>Fulfillment Logistics Dispatch Records</h3>
        </div>
        <div id="shippingDetailsPayload"></div>
      </div>
    `;

    rightPanel.innerHTML = performanceHTML;

    // Manage Nested Asynchronous DOM Mutations inside layout pipeline animation frames safely
    requestAnimationFrame(() => {
      const listContainer = document.getElementById('biddersActivityList');
      if (!listContainer) return;

      if (filteredItemBids.length === 0) {
        listContainer.innerHTML = `<div class="plain-empty-box-notice">No client users have placed active bids against this catalog lot entry yet.</div>`;
        return;
      }

      // Initialize analytics sparkline rendering vectors
      renderBidsSparklineGraph(filteredItemBids, Number(product.startingBid || product.price || 0));

      const executionSortedBids = [...filteredItemBids].sort((a, b) => Number(b.amount) - Number(a.amount));
      const rowLimitThreshold = 5;
      const processSliceLimit = (executionSortedBids.length > rowLimitThreshold && !showingAllBidders)
        ? executionSortedBids.slice(0, rowLimitThreshold)
        : executionSortedBids;

      let listHTML = processSliceLimit.map((bid, index) => {
        const bidderName = bid.userName || bid.user || 'Anonymous Bidder';
        const isLeading = index === 0;
        const positionBadge = isLeading ? 'Leading Bid' : `Rank #${index + 1}`;

        return `
          <div class="bid-item${isLeading ? ' is-leading' : ''}">
            <div class="bid-user-cell">
              <div class="bid-avatar" aria-hidden="true">${escapeHtml(initialsFor(bidderName))}</div>
              <div class="bid-user-profile">
                <h4>${escapeHtml(bidderName)}</h4>
                <span class="bid-timestamp">${new Date(bid.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</span>
                <span class="rank-indicator-tag">${positionBadge}</span>
              </div>
            </div>
            <div class="bid-financial-side">
              <span class="bid-amt">₹${Number(bid.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        `;
      }).join('');

      // Add pagination toggle expand buttons if lists transcend threshold benchmarks
      if (executionSortedBids.length > rowLimitThreshold) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-bidders-btn';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-expanded', showingAllBidders ? 'true' : 'false');
        toggleBtn.textContent = showingAllBidders ? 'Show Less ↑' : `Show More (${executionSortedBids.length - rowLimitThreshold} Hidden) ↓`;

        listHTML += `<div id="toggleBtnAnchor"></div>`;
        setTimeout(() => {
          const anchor = document.getElementById('toggleBtnAnchor');
          if(anchor) anchor.replaceWith(toggleBtn);
        }, 0);
      }

      listContainer.innerHTML = listHTML;

      // Mount logistical processing fields if matches evaluate true entries
      const matchingOrderRecord = systemOrders.find(o => o && String(o.productId) === String(product.id));
      const shippingBox = document.getElementById('shippingLogisticsBox');

      if (matchingOrderRecord && matchingOrderRecord.shippingAddress) {
        shippingBox.style.display = 'block';
        const addr = matchingOrderRecord.shippingAddress;
        document.getElementById('shippingDetailsPayload').innerHTML = `
          <div class="order-fulfillment-card">
            <div style="margin-bottom: 0.5rem;">
              <span class="invoice-reference-badge">Invoice: ${escapeHtml(matchingOrderRecord.id)}</span>
            </div>
            <div class="item-prop-row"><span class="item-prop-lbl">Recipient Name</span><span class="item-prop-val">${escapeHtml(addr.name)}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">Shipping Destination</span><span class="item-prop-val">${escapeHtml(addr.address)}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">City & Postal Code</span><span class="item-prop-val">${escapeHtml(addr.city)} — ${escapeHtml(addr.pin)}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">State Region</span><span class="item-prop-val">${escapeHtml(addr.state)}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">Phone Contact</span><span class="item-prop-val">${escapeHtml(addr.phone)}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">Buyer Communications Contact</span><span class="item-prop-val" style="color: var(--vd-accent);">${escapeHtml(addr.email)}</span></div>
          </div>`;
      }
    });
  }

  // Analytics Sparkline Render Logic Mapping Core Mathematical Scalers
  function renderBidsSparklineGraph(bidsList, startingPrice) {
    const canvas = document.getElementById('bidsSparklineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const chronologicalAmounts = [...bidsList]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(b => Number(b.amount));

    chronologicalAmounts.unshift(startingPrice);

    const peakHigh = Math.max(...chronologicalAmounts);
    const floorLow = Math.min(...chronologicalAmounts);

    const highLabel = document.getElementById('graphHighLabel');
    const lowLabel = document.getElementById('graphLowLabel');
    if (highLabel) highLabel.textContent = `Peak: ₹${peakHigh.toLocaleString('en-IN')}`;
    if (lowLabel) lowLabel.textContent = `Floor: ₹${floorLow.toLocaleString('en-IN')}`;

    const padding = 25;
    const graphW = canvas.width - (padding * 2);
    const graphH = canvas.height - (padding * 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(43, 33, 24, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      let y = padding + (graphH * (i / 4));
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(canvas.width - padding, y); ctx.stroke();
    }

    if (chronologicalAmounts.length === 1) return;

    const deltaRange = (peakHigh - floorLow) || 1;
    const points = chronologicalAmounts.map((amount, idx) => {
      const x = padding + (graphW * (idx / (chronologicalAmounts.length - 1)));
      const y = canvas.height - padding - (graphH * ((amount - floorLow) / deltaRange));
      return { x, y, val: amount };
    });

    ctx.beginPath();
    ctx.strokeStyle = '#1a3020';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    ctx.lineTo(points[points.length - 1].x, canvas.height - padding);
    ctx.lineTo(points[0].x, canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(26, 48, 32, 0.03)';
    ctx.fill();

    points.forEach((pt) => {
      const isBoundaryExtreme = (pt.val === peakHigh || pt.val === floorLow);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isBoundaryExtreme ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isBoundaryExtreme ? '#b23c00' : '#1a3020';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // Trigger setup loops safely ONLY after the storage handshake resolves completely
  (async () => {
    console.log("DEBUG [Details Page]: Checking store hydration status...");
    const storeTimeout = new Promise((resolve) => setTimeout(resolve, 100));
    await Promise.race([window.__storeReady || Promise.resolve(), storeTimeout]);

    const initialSessionCheck = JSON.parse(localStorage.getItem('Vaultora_session'));
    console.log("DEBUG [Details Page]: Session resolved state:", initialSessionCheck);

    if (!initialSessionCheck) {
      console.warn("DEBUG [Details Page]: Unauthorized access state. Kicking back to /register");
      window.location.replace('/register');
    } else {
      console.log("DEBUG [Details Page]: Verification complete. Executing loop render layout engine.");
      renderSellerListingDetailsLoop();
    }
  })();
}