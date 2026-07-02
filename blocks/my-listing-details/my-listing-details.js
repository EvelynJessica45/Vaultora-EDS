let showingAllBidders = false;

export default function decorate(block) {
  // Clear the placeholder authoring content
  block.innerHTML = '';

  // Setup layout architecture scaffolding frames
  const container = document.createElement('div');
  container.className = 'my-listing-details-container';
  container.style.width = '100%';
  
  // Create Left Panel Node Frame
  const leftPanel = document.createElement('div');
  leftPanel.className = 'listing-identity-panel';
  
  // Create Right Panel Node Frame
  const rightPanel = document.createElement('div');
  rightPanel.className = 'performance-metrics-panel';

  block.appendChild(leftPanel);
  block.appendChild(rightPanel);

  // Core execution loop routine
  function renderSellerListingDetailsLoop() {
   const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    // --- BYPASS SETUP FOR LOCAL TESTING ---
    let session = typeof getSession === 'function' ? getSession() : null;
    
    if (!session && window.location.hostname === 'localhost') {
      // Inject a temporary mock session so your page renders locally
      session = { name: "Mock Seller", email: "seller@vaultora.com" };
    }
    // --------------------------------------

    // Route authentication check validations smoothly
    if (!session) {
      window.location.replace('/register'); // Added absolute slash to fix 404 target
      return;
    }
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const product = products.find(p => String(p.id) === String(productId));
    const allBids = typeof getBids === 'function' ? getBids() : [];
    
    const rawOrders = localStorage.getItem('Vaultora_orders');
    const systemOrders = rawOrders ? JSON.parse(rawOrders) : [];

    // Fallback handler if parameters miss match criteria endpoints
    if (!product) {
      leftPanel.innerHTML = `<h1 class="asset-title">Asset Entry Error</h1>`;
      rightPanel.innerHTML = `
        <div class="plain-empty-box-notice">
          The requested product listing performance data is unavailable or was cleared.
        </div>`;
      return;
    }

    // 1. Build and Inject Left Side Profile Frame
    const imageSource = product.images?.[0] || product.image || 'https://placehold.co/400x300/e8dcc8/5a4a2e?text=Vaultora';
    leftPanel.innerHTML = `
      <div class="media-frame">
        <img src="${imageSource}" alt="${product.title}">
      </div>
      <span class="asset-category-badge">${product.category || 'General Collection'}</span>
      <h1 class="asset-title">${product.title}</h1>
      <span class="asset-id-label">Listing ID: ${product.id}</span>
      <div class="asset-divider"></div>
      <div class="asset-description-box">
        <p>${product.description || 'No descriptive catalog records accompanied this asset allocation.'}</p>
      </div>
    `;

    // Extract financials metrics data profiles
    const filteredItemBids = allBids.filter(b => String(b.productId) === String(product.id));
    const isLive = product.auctionStatus === 'active';
    const statusText = isLive ? "🟢 Live Active" : "🔴 Ended";
    const statusColor = isLive ? "#1f8f4d" : "#5c677d";

    const formattedStart = `₹${Number(product.startingBid || product.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    const formattedCurrent = `₹${Number(product.currentBid || product.startingBid || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    // 2. Assemble Financial Metrics Ticker Tape Blocks
    let performanceHTML = `
      <div class="metrics-ticker-tape">
        <div class="ticker-card"><span class="ticker-label">Listing Status</span><span id="m-status" style="color: ${statusColor}">${statusText}</span></div>
        <div class="ticker-card"><span class="ticker-label">Starting Reserve</span><span class="ticker-value">${formattedStart}</span></div>
        <div class="ticker-card"><span class="ticker-label">Current Ceiling</span><span class="ticker-value">${formattedCurrent}</span></div>
        <div class="ticker-card"><span class="ticker-label">Total Bids Cast</span><span class="ticker-value" style="font-family: sans-serif;">${filteredItemBids.length}</span></div>
      </div>
    `;

    // 3. Assemble Chart Panel Frame
    if (filteredItemBids.length > 0) {
      performanceHTML += `
        <div class="dashboard-section-card" id="graphPanelWrapper">
          <div class="card-header-row">
            <h2>Bidding Ceiling Progress</h2>
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
          <h2>Active Offers Placement Ledger</h2>
        </div>
        <div id="biddersActivityList"></div>
      </div>
    `;

    // 5. Assemble Logistics box targets
    performanceHTML += `
      <div class="dashboard-section-card" id="shippingLogisticsBox" style="display: none;">
        <div class="card-header-row">
          <h2>Fulfillment Logistics Dispatch Records</h2>
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
        const borderStyle = index === 0 ? 'border-left: 4px solid #1f8f4d; background: rgba(31,143,77,0.02);' : 'border-left: 4px solid #dddddd;';
        const positionBadge = index === 0 ? '👑 Highest Ceiling Winner' : `Rank Level Floor #${index + 1}`;
        const badgeColor = index === 0 ? '#1f8f4d' : '#777777';

        return `
          <div class="bid-item" style="${borderStyle}">
            <div class="bid-user-profile">
              <h3>${bid.userName || bid.user}</h3>
              <span class="bid-timestamp">${new Date(bid.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</span>
              <span class="rank-indicator-tag" style="color: ${badgeColor}">${positionBadge}</span>
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
        toggleBtn.textContent = showingAllBidders ? 'Show Less ↑' : `Show More (${executionSortedBids.length - rowLimitThreshold} Hidden) ↓`;
        toggleBtn.addEventListener('click', () => {
          showingAllBidders = !showingAllBidders;
          renderSellerListingDetailsLoop();
        });
        
        listHTML += `<div id="toggleBtnAnchor"></div>`;
        setTimeout(() => {
          const anchor = document.getElementById('toggleBtnAnchor');
          if(anchor) anchor.replaceWith(toggleBtn);
        }, 0);
      }

      listContainer.innerHTML = listHTML;

      // Mount logistical processing fields if matches evaluate true entries
      const matchingOrderRecord = systemOrders.find(o => String(o.productId) === String(product.id));
      const shippingBox = document.getElementById('shippingLogisticsBox');
      
      if (matchingOrderRecord && matchingOrderRecord.shippingAddress) {
        shippingBox.style.display = 'block';
        const addr = matchingOrderRecord.shippingAddress;
        document.getElementById('shippingDetailsPayload').innerHTML = `
          <div class="order-fulfillment-card">
            <div style="margin-bottom: 0.5rem;">
              <span class="invoice-reference-badge">Fulfillment Reference Invoice: ${matchingOrderRecord.id}</span>
            </div>
            <div class="item-prop-row"><span class="item-prop-lbl">Recipient Name</span><span class="item-prop-val">${addr.name}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">Shipping Destination</span><span class="item-prop-val">${addr.address}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">City & Postal Code</span><span class="item-prop-val">${addr.city} — ${addr.pin}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">State Region</span><span class="item-prop-val">${addr.state}</span></div>
            <div class="item-prop-row"><span class="item-prop-lbl">Phone Contact</span><span class="item-prop-val">${addr.phone}</span></div>
            <div class="item-prop-row" style="border:none;"><span class="item-prop-lbl">Buyer Communications Contact</span><span class="item-prop-val" style="color:#b9925a;">${addr.email}</span></div>
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
    
    document.getElementById('graphHighLabel').textContent = `Peak: ₹${peakHigh.toLocaleString('en-IN')}`;
    document.getElementById('graphLowLabel').textContent = `Floor: ₹${floorLow.toLocaleString('en-IN')}`;

    const padding = 25;
    const graphW = canvas.width - (padding * 2);
    const graphH = canvas.height - (padding * 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render underlying layout support grid vectors
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

    // Draw progression path spline trends
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

    // Fill under spline trajectory
    ctx.lineTo(points[points.length - 1].x, canvas.height - padding);
    ctx.lineTo(points[0].x, canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(26, 48, 32, 0.03)';
    ctx.fill();

    // Plot tracking extreme milestones node markers
    points.forEach((pt) => {
      const isBoundaryExtreme = (pt.val === peakHigh || pt.val === floorLow);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isBoundaryExtreme ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isBoundaryExtreme ? '#e65100' : '#1a3020';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // Trigger setup loops safely on event hook callbacks
  (async () => {
    await (window.__storeReady || Promise.resolve());
    renderSellerListingDetailsLoop();
  })();
}