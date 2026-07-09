/*
 * detail.js
 * Vaultora Premium High-End Luxury Auction Block Engine.
 * Fixed: Converted h2 valuation display into an explicit div container to bypass global boilerplate collapses.
 */

import { getProducts, getBids, getSession, saveBids, saveProducts, getFavorites, saveFavorites } from '../../scripts/storage.js';

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(msg) {
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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

export default async function decorate(block) {
  const cfg = {
    fallbackImg: 'https://placehold.co/800x520/e8dcc8/5a4a2e?text=Vaultora',
    chartCdn:    'https://cdn.jsdelivr.net/npm/chart.js'
  };

  const authCfg = {
    tabLedger:   'Bidding History Ledger',
    tabChart:    'Valuation Trajectory Map',
    lblHighVal:  'Current Highest Valuation',
    lblTimeRem:  'Time Remaining',
    lblBasePrc:  'Starting Bid Value'
  };

  const params = new URLSearchParams(window.location.search);
  const currentProductId = params.get('id');

  if (!currentProductId) {
    block.innerHTML = `<p class="pdp-error-fallback">Asset trace parameter unverified or missing from route paths.</p>`;
    return;
  }

  const products = getProducts() || [];
  let currentProduct = products.find(x => String(x.id) === String(currentProductId));

  if (!currentProduct) {
    block.innerHTML = `<p class="pdp-error-fallback">Luxury asset metrics not found within active databases.</p>`;
    return;
  }

  const session = getSession();
  const userEmail = session?.email ? session.email.toLowerCase() : '';
  
  const allBids = getBids() || [];
  const productBids = allBids.filter(b => String(b.productId) === String(currentProduct.id))
                             .sort((a, b) => b.amount - a.amount);
  
  const currentValuation = productBids.length ? productBids[0].amount : (currentProduct.price || 0);
  const lowestValuation = productBids.length ? productBids[productBids.length - 1].amount : (currentProduct.price || 0);
  const isAuctionActive = currentProduct.auctionStatus === 'active';
  const isCurrentlyLeadingBidder = productBids.length > 0 && productBids[0].user.toLowerCase() === userEmail;

  let isTableTruncated = true;
  let chartInstance = null;

  block.textContent = '';

  const favoritesMap = getFavorites() || {};
  const userFavs = session ? (favoritesMap[session.email] || []) : [];
  const isLiked = userFavs.includes(currentProduct.id);

  const pdpContainer = document.createElement('div');
  pdpContainer.className = 'pdp-frame-container';
  pdpContainer.innerHTML = `
    <div class="pdp-breadcrumbs">
      <a href="/">Collection</a> <span>/</span> 
      <a href="/shop">${currentProduct.category || 'Luxury'}</a> <span>/</span> 
      <span class="curr-crumb">${currentProduct.title}</span>
    </div>

    <div class="pdp-split-layout">
      <div class="pdp-media-column">
        <div class="pdp-main-frame" id="pdpZoomFrame">
          <button type="button" class="carousel-nav nav-prev" id="pdpPrevImg">‹</button>
          <img id="pdpMainImg" src="${currentProduct.image || cfg.fallbackImg}" alt="${currentProduct.title}" loading="eager" />
          <button type="button" class="carousel-nav nav-next" id="pdpNextImg">›</button>

          <button type="button" id="pdpHeartBtn" class="pdp-floating-heart-action ${isLiked ? 'is-active' : ''}" aria-label="Pin to Watchlist">
            <svg viewBox="0 0 24 24" width="20" height="24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div class="pdp-thumbs-strip" id="pdpThumbs"></div>

        <div class="pdp-seller-luxury-profile-card">
          <div class="seller-identity-header-row">
            <div class="seller-avatar-wrapper">
              <img src="https://vaultora.s3.ap-south-1.amazonaws.com/asset_data/user_profile_1781692892222.jpg" onerror="this.src='https://placehold.co/100x100/eae7df/46513f?text=V'" alt="Seller Profile" />
            </div>
            <div class="seller-identity-meta">
              <h5>Listing Merchant: ${currentProduct.seller || 'Vaultora Escrow Vault'}</h5>
              <p>Network Address: ${currentProduct.sellerEmail || 'escrow.registry@vaultora.com'}</p>
            </div>
          </div>
          <div class="seller-trust-matrix-grid">
            <div class="trust-pill">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin='round'><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Merchant Rank</span>
              <strong>✦ Premium Elite</strong>
            </div>
            <div class="trust-pill">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin='round'><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Pass Rate</span>
              <strong>✓ 100% Verified</strong>
            </div>
            <div class="trust-pill">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin='round'><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><polyline points="12 18 12 21"/><path d="M17 21h4"/></svg>
              <span>Fulfillment</span>
              <strong>⚡ Insured Route</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="pdp-action-column">
        <div class="pdp-badge-header-line">
          <span class="pdp-category-tag">${currentProduct.category || 'Limited Edition'}</span>
          <span class="pdp-condition-badge cond-lux">${currentProduct.condition || 'Mint'}</span>
        </div>
        
        <h1 class="pdp-product-title">${currentProduct.title}</h1>

        <div class="pdp-rating-header-row">
          <span class="editorial-review-ticker-label">
            <svg class="svg-inline-icon badge-gold" viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
            Certified Authentic Historical Asset Ledger Entry Line
          </span>
        </div>

        <div class="pdp-price-tier-row">
          <div class="price-block">
            <span class="price-sub-label">${authCfg.lblHighVal}</span>
            <div id="pdpCurrentBid" class="pdp-price-primary">${fmt(currentValuation)}</div>
          </div>
          <div class="price-block border-left">
            <span class="price-sub-label">Reserve Estimate Value</span>
            <span class="pdp-price-crossed">${fmt(currentValuation * 1.35)}</span>
          </div>
        </div>

        <div class="pdp-valuation-range-matrix-row">
          <div class="range-matrix-block">
            <span>Highest Bid</span>
            <strong>${productBids.length ? fmt(productBids[0].amount) : '—'}</strong>
          </div>
          <div class="range-matrix-block">
            <span>Lowest Offer</span>
            <strong>${productBids.length ? fmt(lowestValuation) : '—'}</strong>
          </div>
          <div class="range-matrix-block">
            <span>${authCfg.lblBasePrc}</span>
            <strong>${fmt(currentProduct.price)}</strong>
          </div>
        </div>

        <div class="pdp-bidding-console" id="pdpInteractiveConsoleWrapper"></div>

        <div class="pdp-compartments-accordion-stack">
          <div class="compartment-node">
            <button type="button" class="compartment-trigger"><span>Description Portfolio</span><span class="caret-indicator"></span></button>
            <div class="compartment-body-drawer"><p>${currentProduct.description || 'No supplementary data logged.'}</p></div>
          </div>
          <div class="compartment-node">
            <button type="button" class="compartment-trigger"><span>Provenance Specifications</span><span class="caret-indicator"></span></button>
            <div class="compartment-body-drawer">
              <div class="provenance-real-text-grid">
                <p><strong>Appraisal Certificate:</strong> Vaultora Archival Registry ID: <code>VLT-${currentProduct.id || 'N/A'}-2026</code>. Material density validation and chronological carbon signature analysis match documented origin metrics perfectly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pdp-analytics-block">
      <div class="pdp-tabs-header">
        <button type="button" class="pdp-tab-trigger active" id="btnToggleTable">${authCfg.tabLedger}</button>
        <button type="button" class="pdp-tab-trigger" id="btnToggleChart">${authCfg.tabChart}</button>
      </div>

      <div class="pdp-tabs-viewport">
        <div id="pdpTablePanel" class="pdp-panel active">
          <div class="pdp-table-scroll">
            <table class="pdp-history-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Bidder Signature Token</th>
                  <th>Amount Offered</th>
                  <th>Timestamp Log</th>
                  <th>Status State</th>
                </tr>
              </thead>
              <tbody id="pdpTableBody"></tbody>
            </table>
          </div>
          <div class="pdp-show-more-row-wrapper" id="pdpTableCollapseWrap" style="display: none;">
            <button type="button" class="btn-pdp-collapse-toggle" id="btnTableCollapseToggle">Show More Logs ▾</button>
          </div>
        </div>

        <div id="pdpChartPanel" class="pdp-panel" style="display:none;">
          <div class="pdp-chart-frame">
            <canvas id="pdpCanvasMap"></canvas>
            <div id="pdpChartFallback" class="pdp-chart-fallback" style="display:none;">No bids yet — be the first to bid!</div>
          </div>
        </div>
      </div>
    </div>

    <div class="pdp-related-block">
      <h3 class="pdp-related-title">Similar <em>Acquisitions</em></h3>
      <div class="pdp-related-grid" id="pdpRelatedGrid"></div>
    </div>
  `;

  block.append(pdpContainer);

  // --- HOVER LOUPE INTERACTION MODULE ---
  function initZoomLoupeEngine() {
    const frame = pdpContainer.querySelector('#pdpZoomFrame');
    const img = pdpContainer.querySelector('#pdpMainImg');
    if (!frame || !img) return;

    frame.addEventListener('mousemove', (e) => {
      const rect = frame.getBoundingClientRect();
      const xPercentage = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercentage = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${xPercentage}% ${yPercentage}%`;
      img.style.transform = 'scale(1.75)';
    });
    frame.addEventListener('mouseleave', () => {
      img.style.transformOrigin = 'center center';
      img.style.transform = 'scale(1)';
    });
  }
  initZoomLoupeEngine();

  // --- ACCORDIONS HOVER DRAWERS ---
  function initCompartmentStack() {
    pdpContainer.querySelectorAll('.compartment-node').forEach(node => {
      const trigger = node.querySelector('.compartment-trigger');
      if (trigger) {
        trigger.addEventListener('mouseenter', () => node.classList.add('is-open'));
        node.addEventListener('mouseleave', () => node.classList.remove('is-open'));
      }
    });
  }
  initCompartmentStack();

  // --- REPAINT INTERACTIVE TRANSACTION CONSOLES ---
  function repaintInteractiveConsole() {
    const consoleWrapper = pdpContainer.querySelector('#pdpInteractiveConsoleWrapper');
    if (!consoleWrapper) return;

    if (isAuctionActive) {
      if (isCurrentlyLeadingBidder) {
        consoleWrapper.innerHTML = `
          <div class="console-interactive-row locked-leading-state">
            <p class="leading-lock-alert-message">
              <span>🔒 Highest Bid Standing Locked</span>
              You are currently the leading bidder on this luxury asset lot. Additional strategic self-outbidding is restricted.
            </p>
          </div>
          <div class="pdp-horological-clock-panel">
            <div class="clock-icon-accent-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="clock-digits-wrapper">
              <span class="clock-label">Time Remaining Until Vault Close</span>
              <div id="pdpCountdown" class="clock-ticker-digits">Calculating...</div>
            </div>
          </div>
        `;
        return;
      }

      consoleWrapper.innerHTML = `
        <div class="console-interactive-row">
          <div class="quick-increment-chips-strip">
            <button type="button" class="btn-quick-pill" data-increment="500">+ ₹500</button>
            <button type="button" class="btn-quick-pill" data-increment="1000">+ ₹1,000</button>
            <button type="button" class="btn-quick-pill" data-increment="5000">+ ₹5,000</button>
          </div>

          <div class="pdp-input-wrapper">
            <div class="quantity-stepper-controls">
              <button type="button" class="step-btn" id="stepMinus">−</button>
              <input type="number" id="pdpBidInput" value="${currentValuation + 200}" min="1" />
              <button type="button" class="step-btn" id="stepPlus">+</button>
            </div>
            <button type="button" id="pdpBidBtn" class="btn-pdp-action">Commit Valuation Bid</button>
          </div>
        </div>
        
        <div class="pdp-horological-clock-panel">
          <div class="clock-icon-accent-wrapper">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="clock-digits-wrapper">
            <span class="clock-label">${authCfg.lblTimeRem}</span>
            <div id="pdpCountdown" class="clock-ticker-digits">Calculating...</div>
          </div>
        </div>
      `;
      bindConsoleActions();
    } else {
      consoleWrapper.innerHTML = `<p class="pdp-concluded-banner-message">This structural registry vault tracking line is currently closed.</p>`;
    }
  }

  function bindConsoleActions() {
    const bidInput = pdpContainer.querySelector('#pdpBidInput');
    const bidBtn = pdpContainer.querySelector('#pdpBidBtn');
    const stepMinus = pdpContainer.querySelector('#stepMinus');
    const stepPlus = pdpContainer.querySelector('#stepPlus');

    if (stepMinus && bidInput) {
      stepMinus.addEventListener('click', () => {
        let val = parseFloat(bidInput.value) || 0;
        if (val > 100) bidInput.value = (val - 100).toFixed(2);
      });
    }
    if (stepPlus && bidInput) {
      stepPlus.addEventListener('click', () => {
        let val = parseFloat(bidInput.value) || 0;
        bidInput.value = (val + 100).toFixed(2);
      });
    }

    pdpContainer.querySelectorAll('.btn-quick-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inc = parseFloat(btn.getAttribute('data-increment'));
        if (bidInput) bidInput.value = (currentValuation + inc).toFixed(2);
      });
    });

    if (bidBtn && bidInput) {
      bidBtn.addEventListener('click', async () => {
        if (!session) { showToast('Please log in.'); return; }
        const bidValue = parseFloat(bidInput.value);

        if (isNaN(bidValue) || bidValue <= 0) {
          showToast('Please enter a valid amount.');
          return;
        }

        if (bidValue <= currentValuation && !bidBtn.hasAttribute('data-force')) {
          showToast('Notice: This valuation is below the current leader. Click again to log anyway.');
          bidBtn.setAttribute('data-force', 'true');
          return;
        }
        bidBtn.removeAttribute('data-force');

        const freshProducts = getProducts() || [];
        const pRef = freshProducts.find(x => String(x.id) === String(currentProduct.id));
        
        if (pRef && bidValue > currentValuation) { 
          pRef.currentBid = bidValue; 
          pRef.bids = (pRef.bids || 0) + 1; 
          await saveProducts(freshProducts); 
        }

        allBids.push({ productId: currentProduct.id, productName: currentProduct.title, amount: bidValue, user: session.email, timestamp: new Date().toISOString() });
        await saveBids(allBids);

        showToast('Valuation point logged successfully.');
        setTimeout(() => window.location.reload(), 800);
      });
    }
  }

  // Floating Heart Watchlist Toggle Action Event
  const heartBtn = pdpContainer.querySelector('#pdpHeartBtn');
  if (heartBtn) {
    heartBtn.addEventListener('click', () => {
      if (!session) { showToast('Please register or log in first.'); return; }
      const currentFavs = getFavorites() || {};
      if (!currentFavs[session.email]) currentFavs[session.email] = [];

      const index = currentFavs[session.email].indexOf(currentProduct.id);
      if (index > -1) {
        currentFavs[session.email].splice(index, 1);
        heartBtn.classList.remove('is-active');
        showToast('Removed from favorites.');
      } else {
        currentFavs[session.email].push(currentProduct.id);
        heartBtn.classList.add('is-active');
        showToast('Added to watchlist.');
      }
      saveFavorites(currentFavs);
    });
  }

  // --- LEDGER DATA TABLE POPULATION WITH 3-ROW TRUNCATION LIMIT ---
  function populateLedgerTable() {
    const tbody = pdpContainer.querySelector('#pdpTableBody');
    const toggleWrap = pdpContainer.querySelector('#pdpTableCollapseWrap');
    if (!tbody) return;

    if (!productBids.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="pdp-table-empty">No historic registry trajectories saved yet.</td></tr>`;
      if (toggleWrap) toggleWrap.style.display = 'none';
      return;
    }

    const sliceBids = isTableTruncated ? productBids.slice(0, 3) : productBids;
    
    if (toggleWrap) {
      toggleWrap.style.display = productBids.length > 3 ? 'block' : 'none';
      const toggleBtn = pdpContainer.querySelector('#btnTableCollapseToggle');
      if (toggleBtn) toggleBtn.textContent = isTableTruncated ? 'Show More Logs ▾' : 'Show Less Logs ▴';
    }

    const globalMax = Math.max(...productBids.map(b => b.amount));
    tbody.innerHTML = sliceBids.map((b, idx) => {
      const rank = productBids.length - productBids.indexOf(b);
      const isLeading = b.amount === globalMax;
      const anonymizedUser = b.user.split('@')[0].slice(0, 4) + '***';
      const timestampString = new Date(b.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return `
        <tr>
          <td><span class="ledger-rank-node ${isLeading ? 'leading' : ''}">${rank}</span></td>
          <td class="ledger-sig-cell">${anonymizedUser}</td>
          <td class="ledger-amt-cell font-serif">${fmt(b.amount)}</td>
          <td>${timestampString}</td>
          <td><span class="ledger-pill ${isLeading ? 'leading' : 'outbid'}">${isLeading ? 'Leading' : 'Outbid'}</span></td>
        </tr>
      `;
    }).join('');
  }

  // --- TRAJECTORY CHART GENERATION ---
  async function populateTrajectoryChart() {
    const canvas = pdpContainer.querySelector('#pdpCanvasMap');
    const fallback = pdpContainer.querySelector('#pdpChartFallback');
    if (!canvas) return;

    if (!productBids.length) { canvas.style.display = 'none'; if (fallback) fallback.style.display = 'block'; return; }
    canvas.style.display = 'block'; if (fallback) fallback.style.display = 'none';

    await loadScript(cfg.chartCdn);
    const chronologicalBids = [...productBids].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chronologicalBids.map(b => new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
        datasets: [{
          data: chronologicalBids.map(b => b.amount),
          borderColor: '#46513f',
          backgroundColor: 'rgba(70, 81, 63, 0.02)',
          borderWidth: 1.5,
          pointBackgroundColor: '#b9925a',
          pointBorderColor: '#ffffff',
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: '#1a1a1a',
            titleFont: { size: 11, weight: '700' },
            bodyFont: { size: 11 },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                const index = context.dataIndex;
                const bidObj = chronologicalBids[index];
                const mask = bidObj.user.split('@')[0].slice(0, 4) + '***';
                const timeStr = new Date(bidObj.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                return [
                  `Valuation: ${fmt(bidObj.amount)}`,
                  `Log Time : ${timeStr}`,
                  `Signature: ${mask}`
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 }, callback: v => '₹' + Number(v).toLocaleString('en-IN') } }
        }
      }
    });
  }

  // --- SECOND-ACCURATE CHRONOMETER COUNTER ENGINE [Ticking Fixed] ---
  let countdownInterval = null;
  function startLiveTimer(endTime) {
    const clockNode = document.getElementById('pdpCountdown');
    if (!clockNode) return;

    const tick = () => {
      const targetTime = new Date(endTime).getTime();
      const nowTime = Date.now();
      const diff = targetTime - nowTime;
      
      if (diff <= 0) { 
        clockNode.textContent = '00d : 00h : 00m : 00s (Vault Closed)'; 
        clearInterval(countdownInterval); 
        return; 
      }
      
      const totalSecs = Math.floor(diff / 1000);
      const totalMins = Math.floor(totalSecs / 60);
      const totalHours = Math.floor(totalMins / 60);
      const days = Math.floor(totalHours / 24);
      
      const dayStr = String(days).padStart(2, '0');
      const hourStr = String(totalHours % 24).padStart(2, '0');
      const minStr = String(totalMins % 60).padStart(2, '0');
      const secStr = String(totalSecs % 60).padStart(2, '0');

      clockNode.textContent = `${dayStr}d : ${hourStr}h : ${minStr}m : ${secStr}s remaining`;
    };
    
    tick();
    clearInterval(countdownInterval);
    countdownInterval = setInterval(tick, 1000); 
  }

  repaintInteractiveConsole();
  if (currentProduct.endTime) startLiveTimer(currentProduct.endTime);

  // --- IMAGE CAROUSEL MANAGER ---
  let activeImageIndex = 0;
  const initialImgs = currentProduct.images && currentProduct.images.length ? currentProduct.images : [currentProduct.image].filter(Boolean);
  if (!initialImgs.length) initialImgs.push(cfg.fallbackImg);

  function syncCarouselFrame(index) {
    activeImageIndex = (index + initialImgs.length) % initialImgs.length;
    const mainImgNode = pdpContainer.querySelector('#pdpMainImg');
    if (mainImgNode) {
      mainImgNode.style.opacity = '0.2';
      setTimeout(() => { mainImgNode.src = initialImgs[activeImageIndex]; mainImgNode.style.opacity = '1'; }, 100);
    }
    pdpContainer.querySelectorAll('.pdp-thumb-pill').forEach((t, i) => t.classList.toggle('active', i === activeImageIndex));
  }

  const thumbsContainerNode = pdpContainer.querySelector('#pdpThumbs');
  if (thumbsContainerNode) {
    thumbsContainerNode.innerHTML = '';
    initialImgs.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Gallery Asset ${idx + 1}`;
      img.className = `pdp-thumb-pill ${idx === 0 ? 'active' : ''}`;
      img.addEventListener('click', () => syncCarouselFrame(idx));
      thumbsContainerNode.append(img);
    });
  }

  const prevBtn = pdpContainer.querySelector('#pdpPrevImg');
  const nextBtn = pdpContainer.querySelector('#pdpNextImg');
  if (prevBtn) prevBtn.addEventListener('click', () => syncCarouselFrame(activeImageIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => syncCarouselFrame(activeImageIndex + 1));

  // --- RELATED PRODUCTS DISCOVERY LOOP ---
function renderSimilarAssets() {
    const grid = pdpContainer.querySelector('#pdpRelatedGrid');
    if (!grid) return;
    
    // Filter active items and remove the current product
    const items = products.filter(x => String(x.id) !== String(currentProduct.id) && x.auctionStatus === 'active').slice(0, 4);

    if (!items.length) {
      grid.innerHTML = `<p class="pdp-table-empty">No similar dynamic item acquisitions tracked today.</p>`;
      return;
    }

    grid.innerHTML = items.map(p => `
      <div class="pdp-related-card" data-id="${p.id}" style="cursor: pointer;">
        <div class="rel-image-frame">
          <img src="${p.images?.[0] || p.image || cfg.fallbackImg}" alt="${p.title}" loading="lazy" />
        </div>
        <div class="rel-details-frame">
          <h4>${p.title}</h4>
          <div class="rel-footer-row"><strong>${fmt(p.currentBid || p.price)}</strong><span>Acquire</span></div>
        </div>
      </div>
    `).join('');

    // Attach click listeners to cards to handle navigation
    grid.querySelectorAll('.pdp-related-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        // This forces the page to navigate to the new asset
        window.location.href = `/detail?id=${id}`;
      });
    });
  }
  // --- TAB SWITCH LAYOUT PANELS ---
  const btnToggleTable = pdpContainer.querySelector('#btnToggleTable');
  const btnToggleChart = pdpContainer.querySelector('#btnToggleChart');
  const tablePanel = pdpContainer.querySelector('#pdpTablePanel');
  const chartPanel = pdpContainer.querySelector('#pdpChartPanel');

  if (btnToggleTable && btnToggleChart) {
    btnToggleTable.addEventListener('click', () => {
      btnToggleChart.classList.remove('active'); btnToggleTable.classList.add('active');
      if (chartPanel) chartPanel.style.display = 'none';
      if (tablePanel) tablePanel.style.display = 'block';
      populateLedgerTable();
    });

    btnToggleChart.addEventListener('click', () => {
      btnToggleTable.classList.remove('active'); btnToggleChart.classList.add('active');
      if (tablePanel) tablePanel.style.display = 'none';
      if (chartPanel) chartPanel.style.display = 'block';
      populateTrajectoryChart();
    });
  }

  const collapseToggleBtn = pdpContainer.querySelector('#btnTableCollapseToggle');
  if (collapseToggleBtn) {
    collapseToggleBtn.addEventListener('click', () => {
      isTableTruncated = !isTableTruncated;
      populateLedgerTable();
    });
  }

  renderSimilarAssets();
  block.classList.add('pdp-rendered');
}