import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

// Global shared variables and utility formatters
const inrFormatter = new Intl.NumberFormat('en-IN');
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timelineDateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
let countdownInterval = null;

export default async function decorate(block) {
  // Clear any existing intervals when switching dashboards dynamically
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  const rows = [...block.children];
  const isBidsList = block.classList.contains('mybids');
  const isBidDetails = block.classList.contains('my-bid-details');
  const isListingsList = block.classList.contains('mylistings');
  const isListingDetails = block.classList.contains('my-listing-details');
  const isOrders = block.classList.contains('orders');

  const session = typeof getSession === 'function' ? getSession() : null;

  // Ensure security redirection path for user states
  if (!session && (isBidsList || isListingsList || isOrders)) {
    block.innerHTML = `<div class="dashboard-empty-state"><p>Please log in to access your personal dashboard area.</p><button onclick="window.location.href='register'">Go to Login</button></div>`;
    return;
  }

  // Parse key-value configuration matrices from the AEM authoring table
  const cfg = {};
  let fallbackPicture = null;
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].innerHTML.trim();
      cfg[key] = val;
      const pic = cells[1].querySelector('picture');
      if (pic) fallbackPicture = pic.cloneNode(true);
    }
  });

  block.innerHTML = '';

  // ==========================================================================
  // PIPELINE 1: MY BIDS MAIN DASHBOARD SUMMARY LIST
  // ==========================================================================
  if (isBidsList) {
    block.classList.add('mybids-dashboard');
    block.innerHTML = `
      <div class="mybids-header"><h1 class="mybids-title">My <em>Bids Matrix</em></h1><p class="mybids-subtitle">Track, filter, and settle your active premium collection offers.</p></div>
      <div class="mybids-list-wrapper"><div class="mylistings-skeleton-card"><div class="mylistings-skeleton-lines"><div class="mylistings-skeleton-line"></div></div></div></div>
    `;
    
    const listWrapper = block.querySelector('.mybids-list-wrapper');
    const allProducts = getProducts() || [];
    const myBids = (getBids() || []).filter(b => b.user.toLowerCase() === session.email.toLowerCase());

    const uniqueProductIds = [...new Set(myBids.map(b => String(b.productId)))];
    const userBidSummary = uniqueProductIds.map(pId => {
      const prod = allProducts.find(p => String(p.id) === pId);
      if (!prod) return null;
      const prodBids = myBids.filter(b => String(b.productId) === pId).sort((a,b) => b.amount - a.amount);
      const allProductBids = (getBids() || []).filter(b => String(b.productId) === pId).sort((a,b) => b.amount - a.amount);
      
      const highestGlobalBid = allProductBids[0]?.amount || Number(prod.currentBid) || Number(prod.startingBid);
      const highestUserBid = prodBids[0]?.amount || 0;
      
      let status = 'outbid';
      if (prod.auctionStatus === 'active') {
        if (String(allProductBids[0]?.user).toLowerCase() === session.email.toLowerCase()) status = 'leading';
      } else {
        if (String(prod.winnerEmail).toLowerCase() === session.email.toLowerCase()) {
          status = prod.paymentStatus === 'paid' ? 'won-purchased' : 'won-pending';
        } else {
          status = 'lost';
        }
      }
      return { product: prod, userMax: highestUserBid, globalMax: highestGlobalBid, status };
    }).filter(Boolean);

    const SECTIONS = [
      { id: 'won-pending', label: 'Lots Awaiting Settlement', icon: '✨' },
      { id: 'leading', label: 'Active Leading Bids', icon: '🟢' },
      { id: 'outbid', label: 'Outbid Positions', icon: '🟠' },
      { id: 'won-purchased', label: 'Acquired Acquisitions', icon: '💼' },
      { id: 'lost', label: 'Closed Opportunities', icon: '🔒' }
    ];

    listWrapper.innerHTML = '';
    let sectionsVisible = 0;

    SECTIONS.forEach(sec => {
      const filtered = userBidSummary.filter(item => item.status === sec.id);
      if (!filtered.length) return;
      sectionsVisible++;

      const secEl = document.createElement('section');
      secEl.className = 'mybids-section-group';
      secEl.innerHTML = `<h2 class="mybids-section-title"><span class="sec-icon">${sec.icon}</span> ${sec.label} (${filtered.length})</h2><div class="mybids-grid"></div>`;
      
      const grid = secEl.querySelector('.mybids-grid');
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'mybids-item-card';
        card.setAttribute('data-id', item.product.id);
        card.innerHTML = `
          <div class="mybids-item-thumb"><img src="${item.product.image || item.product.images?.[0] || ''}" alt="${item.product.title}"></div>
          <div class="mybids-item-details"><h3>${item.product.title}</h3><p class="item-seller">Seller: ${item.product.seller || 'Verified Desk'}</p><span class="status-badge status-${item.status}">${item.status.replace('-', ' ')}</span></div>
          <div class="mybids-item-financials"><span class="financial-label">Your Max Bid</span><span class="financial-value">₹${inrFormatter.format(item.userMax)}</span></div>
        `;
        card.addEventListener('click', () => { window.location.href = `my-bid-details?id=${item.product.id}`; });
        grid.appendChild(card);
      });
      listWrapper.appendChild(secEl);
    });

    if (sectionsVisible === 0) {
      listWrapper.innerHTML = `<p class="mybids-no-results">No active bid summaries matched your account ledger profile matrix.</p>`;
    }
  }

  // ==========================================================================
  // PIPELINE 2: DETAILED BID PRODUCT VIEW + FORMS
  // ==========================================================================
  else if (isBidDetails) {
    block.classList.add('my-bid-details');
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('id');
    const allProducts = getProducts() || [];
    const productData = allProducts.find(p => String(p.id) === pId);

    if (!productData) {
      block.innerHTML = `<div class="dashboard-empty-state"><p>Requested auction collection lot could not be resolved.</p></div>`;
      return;
    }

    const productBids = (getBids() || []).filter(b => String(b.productId) === pId).sort((a,b) => b.amount - a.amount);
    const currentPrice = productBids[0]?.amount || Number(productData.currentBid) || Number(productData.startingBid);

    block.innerHTML = `
      <div class="media-display-column">
        <div class="main-image-viewport"><img src="${productData.image || productData.images?.[0] || ''}" alt="${productData.title}"></div>
      </div>
      <div class="auction-actions-column">
        <span class="provenance-micro-tag">Registry Lot Reference #${productData.id}</span>
        <h1 class="pdp-main-title">${productData.title}</h1>
        <p class="pdp-editorial-manifest">${productData.description || 'Verified luxury asset listing carry certified digital provenance tokens.'}</p>
        <div id="dynamicBiddingControlContainer"></div>
      </div>
    `;

    const controlContainer = block.querySelector('#dynamicBiddingControlContainer');
    
    // Determine user relationship status to the asset lot
    let stateMode = 'active';
    if (productData.auctionStatus === 'active') {
      if (productBids[0]?.user.toLowerCase() === session?.email?.toLowerCase()) stateMode = 'leading';
    } else {
      if (productData.winnerEmail?.toLowerCase() === session?.email?.toLowerCase()) {
        stateMode = productData.paymentStatus === 'paid' ? 'settled' : 'won';
      } else {
        stateMode = 'closed';
      }
    }

    if (stateMode === 'leading') {
      controlContainer.innerHTML = `<div class="status-banner success">🟢 ${cfg['leading message'] || 'You currently hold the highest active bid on this lot.'}</div><div class="financial-performance-ticker"><div class="ticker-box"><span class="ticker-label">Your Bid Price</span><span class="ticker-value">₹${inrFormatter.format(currentPrice)}</span></div></div>`;
    } else if (stateMode === 'won') {
      controlContainer.innerHTML = `
        <div class="status-banner trophy">🏆 ${cfg['won message'] || 'Congratulations! You won this auction lot.'}</div>
        <div class="financial-performance-ticker"><div class="ticker-box"><span class="ticker-label">Final Value</span><span class="ticker-value">₹${inrFormatter.format(currentPrice)}</span></div></div>
        <div class="split-button-container">
          <button class="btn-primary-action" id="payNowBtn">${cfg['pay button text'] || 'Secure Escrow & Pay Now'}</button>
          <button class="btn-secondary-action" id="declineBtn">${cfg['decline button text'] || 'Decline Purchase Lot'}</button>
        </div>
      `;
      block.querySelector('#payNowBtn').onclick = () => { window.location.href = `checkout?productId=${productData.id}&bid=${currentPrice}`; };
    } else {
      // Allow bidding forms input entries if active
      controlContainer.innerHTML = `
        <div class="financial-performance-ticker"><div class="ticker-box"><span class="ticker-label">Current Bid</span><span class="ticker-value">₹${inrFormatter.format(currentPrice)}</span></div></div>
        <form class="bidding-input-dock" id="bidForm">
          <input type="number" id="bidAmount" min="${currentPrice + 500}" value="${currentPrice + 1000}" required>
          <button type="submit" class="btn-primary-action">Transmit Offer</button>
        </form>
      `;
      block.querySelector('#bidForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const amt = parseFloat(block.querySelector('#bidAmount').value);
        if (amt <= currentPrice) return;
        const newBid = { productId: productData.id, user: session.email, amount: amt, timestamp: new Date().toISOString() };
        const currentBids = getBids() || []; currentBids.push(newBid); saveBids(currentBids);
        productData.currentBid = amt; saveProducts(allProducts);
        location.reload();
      });
    }
  }

  // ==========================================================================
  // PIPELINE 3: SELLER INVENTORY DASHBOARD
  // ==========================================================================
  else if (isListingsList) {
    block.classList.add('mylistings-dashboard');
    block.innerHTML = `
      <div class="mylistings-header"><h1 class="mylistings-title">${cfg['title override'] || 'My Active <em>Listings Catalog</em>'}</h1><p class="mylistings-subtitle">Track asset classifications, appraisals, and verified payouts.</p></div>
      <div class="mylistings-track-space"></div>
    `;

    const trackSpace = block.querySelector('.mylistings-track-space');
    const listings = (getProducts() || []).filter(p => p.seller?.toLowerCase() === session.email.toLowerCase());

    if (!listings.length) {
      trackSpace.innerHTML = `<div class="mybids-no-results"><p>Your active sales collection ledger has no recorded properties mapped.</p></div>`;
      if (fallbackPicture) trackSpace.querySelector('div').prepend(fallbackPicture);
      return;
    }

    listings.forEach(listing => {
      const rowCard = document.createElement('div');
      rowCard.className = 'mylistings-item-card';
      rowCard.innerHTML = `
        <div class="mylistings-item-thumb"><img src="${listing.image || listing.images?.[0] || ''}" alt="${listing.title}"></div>
        <div class="mylistings-item-details"><h3>${listing.title}</h3><span class="status-badge status-${listing.auctionStatus}">${listing.auctionStatus}</span></div>
        <div class="mylistings-item-financials"><span class="financial-label">Valuation</span><span class="financial-value">₹${inrFormatter.format(Number(listing.startingBid || listing.price))}</span></div>
      `;
      rowCard.onclick = () => { window.location.href = `my-listing-details?id=${listing.id}`; };
      trackSpace.appendChild(rowCard);
    });
  }

  // ==========================================================================
  // PIPELINE 4: SELLER DETAILED PRODUCT ANALYTICS
  // ==========================================================================
  else if (isListingDetails) {
    block.classList.add('my-listing-details');
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('id');
    const listing = (getProducts() || []).find(p => String(p.id) === pId);

    if (!listing) {
      block.innerHTML = `<div class="dashboard-empty-state"><p>Inventory reference record data could not be parsed.</p></div>`;
      return;
    }

    block.innerHTML = `
      <div class="listing-identity-panel">
        <div class="identity-thumb-wrapper"><img src="${listing.image || listing.images?.[0] || ''}" alt="${listing.title}"></div>
        <h2>${listing.title}</h2>
        <span class="status-pill status-${listing.auctionStatus}">${listing.auctionStatus}</span>
      </div>
      <div class="dashboard-section-card">
        <h3>${cfg['bidders activity'] || 'Lot Performance Data Analysis Engine'}</h3>
        <p class="empty-state-notice-text">Transactional analytics modules are mapping blockchain registry tracks dynamically...</p>
        <div class="metrics-ticker-tape">
          <div class="ticker-box"><span class="ticker-label">Starting Reserve</span><span class="ticker-value">₹${inrFormatter.format(Number(listing.startingBid || listing.price))}</span></div>
          <div class="ticker-box"><span class="ticker-label">Current Counter</span><span class="ticker-value">₹${inrFormatter.format(Number(listing.currentBid || listing.startingBid))}</span></div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // PIPELINE 5: INVOICING ORDERS HISTORY LEDGER
  // ==========================================================================
  else if (isOrders) {
    block.classList.add('orders-master-layout-canvas');
    const allProducts = getProducts() || [];
    const myOrders = allProducts.filter(p => p.winnerEmail?.toLowerCase() === session.email.toLowerCase() && p.paymentStatus === 'paid');

    if (!myOrders.length) {
      block.innerHTML = `
        <div class="main-content">
          <div class="orders-title-row"><h1 class="page-title">${cfg['fin title'] || 'Financial Statement Orders'}</h1></div>
          <div class="empty-state-container" style="text-align:center; padding: 4rem 1rem;">
            <div class="illustration-mask" style="max-width:200px; margin: 0 auto 2rem;"></div>
            <p class="empty-notice" style="font-family:'DM Sans'; color:#666;">${cfg['empty text'] || 'You have not completed any collection checkout invoices yet.'}</p>
          </div>
        </div>
      `;
      if (fallbackPicture) block.querySelector('.illustration-mask').append(fallbackPicture);
      return;
    }

    block.innerHTML = `
      <div class="main-content">
        <div class="orders-title-row"><h1 class="page-title">Completed <span>Invoices</span></h1><p class="page-subtitle">Review historical physical transfers, consignee logs, and sustainability records.</p></div>
        <div class="orders-master-list-mesh"></div>
      </div>
    `;

    const listContainer = block.querySelector('.orders-master-list-mesh');
    myOrders.forEach(order => {
      const cardRow = document.createElement('div');
      cardRow.className = 'minimal-order-row-card';
      cardRow.innerHTML = `
        <div class="order-meta-info"><h3>Order #${order.id}</h3><span class="status-badge-pill green">${cfg['status label'] || 'Paid Checkout'}</span></div>
        <div class="order-item-description-line"><span>${order.title}</span><strong class="font-numeric">${fmt(order.currentBid || order.price)}</strong></div>
      `;
      
      // Dynamic inline pop-up layout receipt engine logic trigger
      cardRow.onclick = () => {
        const modal = document.createElement('div');
        modal.className = 'receipt-overlay-modal-mesh';
        modal.innerHTML = `
          <div class="receipt-box-card animate-popup">
            <div class="receipt-header-branding"><h2>Vaultora <span>Invoice Ledger</span></h2><button class="close-btn" id="closeModalBtn">&times;</button></div>
            <div class="receipt-body-content">
              <h3>Lot: ${order.title}</h3>
              <p>Settled Value: <strong>${fmt(order.currentBid || order.price)}</strong></p>
              <p>Consignee Route Target: <em>${cfg['dest title'] || 'Consignee Verification Destination Hub'}</em></p>
            </div>
          </div>
        `;
        modal.querySelector('#closeModalBtn').onclick = () => modal.remove();
        document.body.append(modal);
      };
      listContainer.appendChild(cardRow);
    });
  }
}