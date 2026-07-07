/* =========================================================================
   MY BID DETAILS — HIGH-PERFORMANCE RENDERING ENGINE (OPTIMIZED)
   ========================================================================= */

import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

let product = null;
let bids = [];
let session = null;
let countdownInterval = null;

let cachedLeftCol = null;
let cachedRightCol = null;
let cachedToastNode = null;

const stateCache = {
  myHighest: 0,
  highest: 0,
  rank: 0,
  isLive: false,
  uniqueAmounts: []
};

const scheduleIdle = (typeof window !== 'undefined' && window.requestIdleCallback)
  ? window.requestIdleCallback.bind(window)
  : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1);

const inrFormatter = new Intl.NumberFormat('en-IN');
const timelineDateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function decorate(block) {
  const unblockAEMSEO = () => {
    document.querySelectorAll('meta[name="robots"]').forEach(meta => meta.remove());
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'index, follow, max-image-preview:large';
    document.head.appendChild(metaRobots);

    if (!document.querySelector('meta[name="description"]')) {
      const metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = 'Realtime allocation ledger execution view details inside Vaultora workspace dashboards.';
      document.head.appendChild(metaDesc);
    }
  };
  unblockAEMSEO();

  const rows = [...block.children];
  const config = {};
  const rowsLen = rows.length;
  for (let i = 0; i < rowsLen; i++) {
    const cols = rows[i].querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = cols[1].textContent.trim();
      config[key] = val;
    }
  }

  const authorText = {
    leadingMsg: config.leadingmessage || "🟢 You currently hold the highest bid.",
    outbidMsg: config.outbidmessage || "🔴 You have been outbid by a higher offer.",
    wonMsg: config.wonmessage || "🏆 Congratulations! You won this auction.",
    payBtn: config.paybuttontext || "Secure Escrow & Pay Now",
    declineBtn: config.declinebuttontext || "Decline Purchase Lot",
    confirmDecline: config.terminatewarning || "Are you sure you want to decline this purchase lot?"
  };

  block.innerHTML = '';

  session = typeof getSession === 'function' ? getSession() : null;
  if (!session && window.location.hostname === 'localhost') {
    session = { name: "Demo Bidder", email: "bidder@vaultora.local" };
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

  const baseFragment = document.createDocumentFragment();

  cachedLeftCol = document.createElement('div');
  cachedLeftCol.className = 'media-display-column';

  cachedRightCol = document.createElement('div');
  cachedRightCol.className = 'auction-actions-column';

  baseFragment.appendChild(cachedLeftCol);
  baseFragment.appendChild(cachedRightCol);
  block.appendChild(baseFragment);

  cachedToastNode = document.getElementById('toast');
  if (!cachedToastNode) {
    cachedToastNode = document.createElement('div');
    cachedToastNode.id = 'toast';
    cachedToastNode.className = 'my-bid-details-toast';
    cachedToastNode.setAttribute('role', 'alert');
    cachedToastNode.setAttribute('aria-live', 'polite');
    document.body.appendChild(cachedToastNode);
  }

  function loadBidDetails(pId) {
    const products = typeof getProducts === 'function' ? getProducts() : [];
    product = products.find(p => String(p.id) === String(pId));

    if (!product) {
      cachedRightCol.innerHTML = `<div class="status-notice-box" role="alert">Requested catalog auction lot entries are no longer verified.</div>`;
      return;
    }

    bids = (typeof getBids === 'function' ? getBids() : [])
      .filter(b => String(b.productId) === String(pId))
      .sort((a, b) => b.amount - a.amount);

    determineWinner();

    requestAnimationFrame(() => {
      renderProductPanel();
      calculateBidStatusMetrics();
      renderBidStatusCore();

      scheduleIdle(() => {
        renderTimelineLedger();
        startCountdownTimer();
      });
    });
  }

  async function determineWinner() {
    if (product.auctionStatus === "active" || product.winnerEmail || !bids.length) return;
    const declined = product.declinedBy || [];
    const availableBids = bids.filter(bid => !declined.includes(bid.user));
    if (!availableBids.length) return;

    const initialPrice = Number(product.startingBid || product.price || 0);
    const validOverBids = [];
    const underBids = [];
    const abLen = availableBids.length;

    for (let i = 0; i < abLen; i++) {
      const b = availableBids[i];
      if (Number(b.amount) >= initialPrice) validOverBids.push(b);
      else underBids.push(b);
    }

    let winner = null;
    if (validOverBids.length > 0) {
      validOverBids.sort((a, b) => Number(b.amount) - Number(a.amount));
      winner = validOverBids[0];
    } else {
      underBids.sort((a, b) => (initialPrice - Number(a.amount)) - (initialPrice - Number(b.amount)));
      winner = underBids[0];
    }

    if (winner) {
      product.winnerEmail = winner.user;
      product.paymentStatus = product.paymentStatus || "pending";

      const products = typeof getProducts === 'function' ? getProducts() : [];
      const idx = products.findIndex(p => String(p.id) === String(product.id));
      if (idx !== -1) {
        products[idx] = product;
        if (typeof saveProducts === 'function') await saveProducts(products);
      }
    }
  }

  function renderProductPanel() {
    const fragment = document.createDocumentFragment();

    const showcaseFrame = document.createElement('div');
    showcaseFrame.className = 'main-showcase-frame';

    const scrim = document.createElement('div');
    scrim.className = 'showcase-clear-scrim';
    showcaseFrame.appendChild(scrim);

    const mainImgEl = document.createElement('img');
    mainImgEl.id = 'mainImage';
    mainImgEl.alt = product.title || 'Main Showcase Lot';
    mainImgEl.setAttribute('loading', 'eager');
    mainImgEl.setAttribute('decoding', 'async');
    mainImgEl.setAttribute('fetchpriority', 'high');
    mainImgEl.width = 648;
    mainImgEl.height = 460;
    showcaseFrame.appendChild(mainImgEl);

    const thumbsContainer = document.createElement('div');
    thumbsContainer.className = 'thumbnail-strip-carousel';
    thumbsContainer.id = 'thumbnailContainer';

    fragment.appendChild(showcaseFrame);
    fragment.appendChild(thumbsContainer);

    cachedLeftCol.innerHTML = '';
    cachedLeftCol.appendChild(fragment);

    const images = product.images?.length ? product.images : [product.image];
    if (images[0]) {
      mainImgEl.src = images[0];
    } else {
      mainImgEl.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="648" height="460" viewBox="0 0 648 460"><rect width="100%" height="100%" fill="%23f5f4f0"/></svg>';
    }

    thumbsContainer.addEventListener('click', (event) => {
      const target = event.target.closest('img[data-src]');
      if (!target) return;
      mainImgEl.src = target.dataset.src;
    }, { passive: true });

    const thumbFragment = document.createDocumentFragment();
    const imgLen = images.length;
    for (let i = 0; i < imgLen; i++) {
      const img = images[i];
      if (!img) continue;
      const imgNode = document.createElement('img');
      imgNode.src = img;
      imgNode.dataset.src = img;
      imgNode.alt = `Thumbnail visualization asset node slot ${i + 1}`;
      imgNode.setAttribute('decoding', 'async');
      imgNode.setAttribute('loading', 'lazy');
      imgNode.width = 84;
      imgNode.height = 84;
      thumbFragment.appendChild(imgNode);
    }
    thumbsContainer.appendChild(thumbFragment);
  }

  function calculateBidStatusMetrics() {
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const fresh = products.find(p => String(p.id) === String(product.id));
    if (fresh) product = fresh;

    const emailLower = session.email.toLowerCase();
    let myHighest = 0;
    const bidsLen = bids.length;

    for (let i = 0; i < bidsLen; i++) {
      const b = bids[i];
      if (b.user.toLowerCase() === emailLower) {
        const amt = Number(b.amount);
        if (amt > myHighest) myHighest = amt;
      }
    }

    const highest = bidsLen ? Number(bids[0].amount) : Number(product.startingBid || product.price || 0);

    const uniqueAmounts = [];
    for (let i = 0; i < bidsLen; i++) {
      const amt = bids[i].amount;
      if (uniqueAmounts.indexOf(amt) === -1) uniqueAmounts.push(amt);
    }
    uniqueAmounts.sort((a, b) => b - a);
    const rank = uniqueAmounts.indexOf(myHighest) + 1;

    stateCache.myHighest = myHighest;
    stateCache.highest = highest;
    stateCache.rank = rank;
    stateCache.isLive = product.auctionStatus === 'active';
    stateCache.uniqueAmounts = uniqueAmounts;
  }

  function renderBidStatusCore() {
    const { myHighest, highest, rank, isLive } = stateCache;

    cachedRightCol.innerHTML = `
      <div>
        <div class="auction-badge" id="auctionBadge">Active</div>
        <h1 id="productTitle">${product.title}</h1>
        <div class="catalog-metadata-bar">
          <span>Category: <strong>${product.category || 'General'}</strong></span>
          <span>Seller: <strong>${product.seller || 'Vaultora Partner'}</strong></span>
        </div>
      </div>

      <div class="financial-performance-ticker">
        <div class="ticker-node-card"><label id="max-offer-lbl">Your Max Offer</label><span aria-labelledby="max-offer-lbl">₹${inrFormatter.format(myHighest)}</span></div>
        <div class="ticker-node-card"><label id="current-ceil-lbl">Current Ceiling</label><span aria-labelledby="current-ceil-lbl">₹${inrFormatter.format(highest)}</span></div>
        <div class="ticker-node-card"><label id="rank-lbl">Rank Position</label><span aria-labelledby="rank-lbl" style="color:#5c3c00;">${rank ? `#${rank}` : '-'}</span></div>
        <div class="ticker-node-card"><label id="time-lbl">Time Window</label><span id="countdown" aria-labelledby="time-lbl">--</span></div>
      </div>

      <div class="status-notice-box" id="statusMessage" role="status" aria-live="polite">Evaluating state indexes...</div>

      <div class="action-block-card hidden" id="rebidSection">
        <label for="rebidAmount">Escrow Upgrade Threshold (INR)</label>
        <div class="rebid-input-wrapper">
          <input type="number" id="rebidAmount" class="rebid-field-ctrl" placeholder="Enter amount greater than ₹${highest}" aria-describedby="statusMessage" />
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
        <div style="font-size:13px; color:#0f2414; font-weight:600; margin-bottom:6px;">✅ Settlement Audit Complete</div>
        <p style="font-size:12px; margin:0; color:#000000; line-height:1.5;">Consignment tracking is active. Invoices dispatched to client records window node channels.</p>
      </div>

      <div class="dashboard-section-card">
        <div style="font-family:'Playfair Display', Georgia, serif; font-size:1.25rem; font-weight:600; color:#121212;">Historical Allocation Ledger</div>
        <div class="timeline-ledger-deck" id="bidHistoryContainer"></div>
      </div>
    `;

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
        status.innerHTML = `${authorText.outbidMsg}<br><span style="font-size:12px; font-weight:700; color:#822210; display:inline-block; margin-top:4px;">Ceiling Deficiency: ₹${inrFormatter.format(highest - myHighest)}</span>`;
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
    if (!countdownEl || !product.endTime) return;

    const end = new Date(product.endTime).getTime();

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        countdownEl.textContent = "Ended";
        clearInterval(countdownInterval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
    };

    tick();
    countdownInterval = setInterval(tick, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(countdownInterval);
      } else {
        tick();
        countdownInterval = setInterval(tick, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    window.addEventListener('pagehide', () => {
      clearInterval(countdownInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    }, { once: true });
  }

  function renderTimelineLedger() {
    const container = document.getElementById("bidHistoryContainer");
    if (!container) return;

    if (!bids.length) {
      container.innerHTML = `<div style="font-size:12px; color:#000000; padding:10px 0;">No transactional offers recorded yet.</div>`;
      return;
    }

    const timeline = [...bids].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const fragment = document.createDocumentFragment();
    const tLen = timeline.length;
    const clientText = "You (Client)";
    const tokenText = "Verified Bidder Token";

    for (let i = 0; i < tLen; i++) {
      const bid = timeline[i];
      const entry = document.createElement('div');
      entry.className = 'timeline-item';

      const left = document.createElement('div');
      left.className = 'timeline-left';

      const user = document.createElement('div');
      user.className = 'timeline-user';
      user.textContent = bid.user === session.email ? clientText : tokenText;

      const time = document.createElement('div');
      time.className = 'timeline-time';
      time.textContent = timelineDateFormatter.format(new Date(bid.timestamp));

      left.appendChild(user);
      left.appendChild(time);

      const amount = document.createElement('div');
      amount.className = 'timeline-amount';
      amount.textContent = `₹${inrFormatter.format(Number(bid.amount))}`;

      entry.appendChild(left);
      entry.appendChild(amount);
      fragment.appendChild(entry);
    }

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  function lazyLoadDependencies(callback) {
    if (window.AWS) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.amazonaws.com/js/aws-sdk-2.1450.0.min.js';
    script.async = true;
    script.id = 'aws-sdk-runtime';
    script.onload = () => { if (typeof callback === 'function') callback(); };
    document.body.appendChild(script);
  }

  function bindRebidActionListeners() {
    document.getElementById("rebidBtn")?.addEventListener("click", () => {
      lazyLoadDependencies(async () => {
        const rebidInput = document.getElementById("rebidAmount");
        const amount = Number(rebidInput?.value);
        const currentHighest = bids.length ? Number(bids[0].amount) : Number(product.startingBid || product.price || 0);

        if (!amount || amount <= currentHighest) {
          alert(`Your upgrade increments must transcend the active ceiling threshold of ₹${inrFormatter.format(currentHighest)}`);
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

        if (cachedToastNode) {
          cachedToastNode.textContent = `Success! Staged offer of ₹${inrFormatter.format(amount)} committed safely.`;
          cachedToastNode.style.background = "#0f2414";
          cachedToastNode.classList.add("show");
        }

        setTimeout(() => { location.reload(); }, 1200);
      });
    }, { passive: true });
  }

  function bindPaymentSelectionControls() {
    document.getElementById("payNowBtn")?.addEventListener("click", () => {
      lazyLoadDependencies(() => {
        const myBids = bids.filter(b => b.user.toLowerCase() === session.email.toLowerCase());
        const winningBid = myBids.length ? Math.max(...myBids.map(b => Number(b.amount))) : Number(product.currentBid) || 0;
        window.location.href = `checkout?productId=${encodeURIComponent(product.id)}&bid=${winningBid}`;
      });
    }, { passive: true });

    document.getElementById("declineBtn")?.addEventListener("click", () => {
      lazyLoadDependencies(async () => {
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
    }, { passive: true });
  }

  loadBidDetails(productId);
}