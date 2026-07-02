/* =========================================================================
   MY BID DETAILS — HIGH-PERFORMANCE RENDERING ENGINE
   ========================================================================= */

import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

let product = null;
let bids = [];
let session = null;
let countdownInterval = null;

export default function decorate(block) {
  // 1. Extract block authoring configuration metadata mappings
  const rows = [...block.children];
  const config = {};
  rows.forEach(row => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = cols[1].textContent.trim();
      config[key] = val;
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

  // Clear inner table rows representation safely from the DOM tree
  block.innerHTML = '';

  // 2. Structural Authentication Check Validations
  session = typeof getSession === 'function' ? getSession() : null;
  if (!session && window.location.hostname === 'localhost') {
    session = { name: "Demo Bidder", email: "bidder@vaultora.local" }; // Local dev diagnostic bypass
  }
  if (!session) {
    window.location.href = "register.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    window.location.href = "my-bids.html";
    return;
  }

  // 3. Assemble Core Layout Panel Pillars
  const leftCol = document.createElement('div');
  leftCol.className = 'media-display-column';
  
  const rightCol = document.createElement('div');
  rightCol.className = 'auction-actions-column';

  block.appendChild(leftCol);
  block.appendChild(rightCol);

  // Mount active application toast status notification nodes globally
  if (!document.getElementById('toast')) {
    const toastNode = document.createElement('div');
    toastNode.id = 'toast';
    toastNode.className = 'my-bid-details-toast';
    document.body.appendChild(toastNode);
  }

  // Core functional state management pipeline methods
  function loadBidDetails(pId) {
    const products = typeof getProducts === 'function' ? getProducts() : [];
    product = products.find(p => String(p.id) === String(pId));

    if (!product) {
      rightCol.innerHTML = `<div class="status-notice-box">Requested catalog auction lot entries are no longer verified.</div>`;
      return;
    }

    bids = (typeof getBids === 'function' ? getBids() : [])
      .filter(b => String(b.productId) === String(pId))
      .sort((a, b) => b.amount - a.amount);

    determineWinner();

    requestAnimationFrame(() => {
      renderProductPanel();
      renderTimelineLedger();
      renderBidStatusCore();
      startCountdownTimer();
    });
  }

  async function determineWinner() {
    if (product.auctionStatus === "active" || product.winnerEmail || !bids.length) return;
    const declined = product.declinedBy || [];
    const availableBids = bids.filter(bid => !declined.includes(bid.user));
    if (!availableBids.length) return;

    const initialPrice = Number(product.startingBid || product.price || 0);
    const validOverBids = availableBids.filter(b => Number(b.amount) >= initialPrice);
    const underBids = availableBids.filter(b => Number(b.amount) < initialPrice);

    let winner = null;
    if (validOverBids.length > 0) {
      validOverBids.sort((a, b) => Number(b.amount) - Number(a.amount));
      winner = validOverBids[0];
    } else {
      underBids.sort((a, b) => (initialPrice - Number(a.amount)) - (initialPrice - Number(b.amount)));
      winner = underBids[0];
    }

    product.winnerEmail = winner.user;
    product.paymentStatus = product.paymentStatus || "pending";

    const products = typeof getProducts === 'function' ? getProducts() : [];
    const idx = products.findIndex(p => String(p.id) === String(product.id));
    if (idx !== -1) {
      products[idx] = product;
      if (typeof saveProducts === 'function') await saveProducts(products);
    }
  }

  function renderProductPanel() {
    leftCol.innerHTML = `
      <div class="main-showcase-frame">
        <div class="showcase-clear-scrim"></div>
        <img id="mainImage" src="" alt="Main Showcase Lot" />
      </div>
      <div class="thumbnail-strip-carousel" id="thumbnailContainer"></div>
    `;

    const images = product.images?.length ? product.images : [product.image];
    const mainImgEl = document.getElementById("mainImage");
    if (mainImgEl && images[0]) mainImgEl.src = images[0];

    const thumbsContainer = document.getElementById("thumbnailContainer");
    if (!thumbsContainer) return;

    images.forEach(img => {
      const imgNode = document.createElement('img');
      imgNode.src = img;
      imgNode.addEventListener('click', () => { if(mainImgEl) mainImgEl.src = img; });
      thumbsContainer.appendChild(imgNode);
    });
  }

  function renderBidStatusCore() {
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const fresh = products.find(p => String(p.id) === String(product.id));
    if (fresh) product = fresh;

    const myBids = bids.filter(b => b.user.toLowerCase() === session.email.toLowerCase());
    const myHighest = myBids.length ? Math.max(...myBids.map(b => Number(b.amount))) : 0;
    
    const bidsList = bids.sort((a, b) => Number(b.amount) - Number(a.amount));
    const highest = bidsList.length ? Number(bidsList[0].amount) : Number(product.startingBid || product.price || 0);

    const uniqueAmounts = [...new Set(bids.map(b => b.amount))].sort((a, b) => b - a);
    const rank = uniqueAmounts.indexOf(myHighest) + 1;
    const isLive = product.auctionStatus === 'active';

    rightCol.innerHTML = `
      <div>
        <div class="auction-badge" id="auctionBadge">Active</div>
        <h1 id="productTitle">${product.title}</h1>
        <div class="catalog-metadata-bar">
          <span>Category: <strong>${product.category || 'General'}</strong></span>
          <span>Seller: <strong>${product.seller || 'Vaultora Partner'}</strong></span>
        </div>
      </div>

      <div class="financial-performance-ticker">
        <div class="ticker-node-card"><label>Your Max Offer</label><span>₹${myHighest.toLocaleString('en-IN')}</span></div>
        <div class="ticker-node-card"><label>Current Ceiling</label><span>₹${highest.toLocaleString('en-IN')}</span></div>
        <div class="ticker-node-card"><label>Rank Position</label><span style="color:#b9925a;">${rank ? `#${rank}` : '-'}</span></div>
        <div class="ticker-node-card"><label>Time Window</label><span id="countdown">--</span></div>
      </div>

      <div class="status-notice-box" id="statusMessage">Evaluating state indexes...</div>

      <div class="action-block-card hidden" id="rebidSection">
        <label>Escrow Upgrade Threshold (INR)</label>
        <div class="rebid-input-wrapper">
          <input type="number" id="rebidAmount" class="rebid-field-ctrl" placeholder="Enter amount greater than ₹${highest}" />
          <button type="button" class="btn-primary-action" id="rebidBtn">Submit Rebid</button>
        </div>
      </div>

      <div class="action-block-card hidden" id="paymentSection">
        <div class="split-button-container">
          <button type="button" class="btn-primary-action" id="payNowBtn">${authorText.payBtn}</button>
          <button type="button" class="btn-secondary-action" id="declineBtn">${authorText.declineBtn}</button>
        </div>
      </div>

      <div class="action-block-card hidden" id="paymentCompletedSection">
        <div style="font-size:13.5px; color:#1a3020; font-weight:600; margin-bottom:6px;">✅ Settlement Audit Complete</div>
        <p style="font-size:12.5px; margin:0; color:#555555;">Consignment tracking is active. Invoices dispatched to client records window node channels.</p>
      </div>

      <div class="dashboard-section-card" style="margin-top:10px;">
        <div style="font-family:'Playfair Display', serif; font-size:1.2rem; font-weight:600; margin-bottom:1rem;">Historical Allocation Ledger</div>
        <div class="timeline-ledger-deck" id="bidHistoryContainer"></div>
      </div>
    `;

    // Operational assignment logic loops matching extracted configuration profiles
    const badge = document.getElementById("auctionBadge");
    const status = document.getElementById("statusMessage");
    const rebidSec = document.getElementById("rebidSection");
    const paySec = document.getElementById("paymentSection");
    const compSec = document.getElementById("paymentCompletedSection");

    if (isLive) {
      if (myHighest >= highest) {
        badge.textContent = "Leading";
        badge.className = "auction-badge";
        status.innerHTML = authorText.leadingMsg;
      } else {
        badge.textContent = "Outbid";
        badge.className = "auction-badge outbid";
        status.innerHTML = `${authorText.outbidMsg}<br><span style="font-size:12px; font-weight:700; color:#a34c37;">Ceiling Deficiency: ₹${(highest - myHighest).toLocaleString('en-IN')}</span>`;
        rebidSec.classList.remove("hidden");
      }
      bindRebidActionListeners();
      return;
    }

    badge.textContent = "Auction Ended";
    badge.className = "auction-badge ended";

    if (product.winnerEmail === session.email) {
      if (product.paymentStatus === "completed") {
        compSec.classList.remove("hidden");
        status.innerHTML = "🏆 Escrow cleared. Consignment routing initiated.";
        return;
      }
      paySec.classList.remove("hidden");
      status.innerHTML = authorText.wonMsg;
      bindPaymentSelectionControls();
    } else {
      status.innerHTML = product.paymentStatus === "completed" ? "Auction finalized. Items routed to highest bidder clearance records." : "⏳ Settlement configuration pending.";
    }
  }

  function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownEl = document.getElementById("countdown");
    const end = new Date(product.endTime).getTime();

    countdownInterval = setInterval(() => {
      const diff = end - Date.now();
      if (diff <= 0) {
        if(countdownEl) countdownEl.textContent = "Ended";
        clearInterval(countdownInterval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if(countdownEl) countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
  }

  function renderTimelineLedger() {
    const container = document.getElementById("bidHistoryContainer");
    if (!container) return;

    const timeline = [...bids].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    container.innerHTML = timeline.map(bid => `
      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-user">${bid.user === session.email ? "You (Client)" : "Verified Bidder Token"}</div>
          <div class="timeline-time">${new Date(bid.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</div>
        </div>
        <div class="timeline-amount">₹${Number(bid.amount).toLocaleString('en-IN')}</div>
      </div>
    `).join('');
  }

  function bindRebidActionListeners() {
    document.getElementById("rebidBtn")?.addEventListener("click", async () => {
      const rebidInput = document.getElementById("rebidAmount");
      const amount = Number(rebidInput?.value);
      const currentHighest = bids.length ? Number(bids[0].amount) : Number(product.startingBid || product.price || 0);

      if (!amount || amount <= currentHighest) {
        alert(`Your upgrade increments must transcend the active ceiling threshold of ₹${currentHighest.toLocaleString('en-IN')}`);
        return;
      }

      const allBids = typeof getBids === 'function' ? getBids() : [];
      allBids.push({
        productId: product.id,
        productName: product.title,
        amount: amount,
        user: session.email,
        timestamp: new Date().toISOString()
      });

      const products = typeof getProducts === 'function' ? getProducts() : [];
      const idx = products.findIndex(x => String(x.id) === String(product.id));
      if (idx !== -1) {
        products[idx].currentBid = amount;
        products[idx].bids = allBids.filter(b => String(b.productId) === String(product.id)).length;
        if(typeof saveProducts === 'function') await saveProducts(products);
      }

      if (typeof saveBids === 'function') await saveBids(allBids);

      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = `Success! Staged offer of ₹${amount.toLocaleString('en-IN')} committed safely.`;
        toast.style.background = "#1a3020";
        toast.classList.add("show");
      }

      setTimeout(() => { location.reload(); }, 1200);
    });
  }

  function bindPaymentSelectionControls() {
    document.getElementById("payNowBtn")?.addEventListener("click", () => {
      const myBids = bids.filter(b => b.user.toLowerCase() === session.email.toLowerCase());
      const winningBid = myBids.length ? Math.max(...myBids.map(b => Number(b.amount))) : Number(product.currentBid) || 0;
      // Redirect seamlessly into the core system directory paths checkout architecture parameters
      window.location.href = `checkout?productId=${encodeURIComponent(product.id)}&bid=${winningBid}`;
    });

    document.getElementById("declineBtn")?.addEventListener("click", async () => {
      if (!confirm(authorText.confirmDecline)) return;

      product.declinedBy = product.declinedBy || [];
      if (!product.declinedBy.includes(session.email)) {
        product.declinedBy.push(session.email);
      }
      product.winnerEmail = null;
      product.paymentStatus = "pending";

      const products = typeof getProducts === 'function' ? getProducts() : [];
      const idx = products.findIndex(p => String(p.id) === String(product.id));
      if (idx !== -1) {
        products[idx] = product;
        if (typeof saveProducts === 'function') await saveProducts(products);
      }
      location.reload();
    });
  }

  // Initial execution step
  loadBidDetails(productId);
}

function showToast(msg, success = true) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = success ? "#1a3020" : "#a34c37";
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2800);
}