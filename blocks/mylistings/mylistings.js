/*
 * mylistings.js
 * Decorates the user's personal seller inventory dashboard.
 * Separates listings into 4 distinct visual sections based on real-time status parameters.
 */

import { getProducts, getBids, getSession, saveProducts } from '../../scripts/storage.js';

const SVGS = {
  active: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  pending: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  completed: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  ended: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  badgeDot: `<svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="3"/></svg>`,
  powerOff: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`
};

export default function decorate(block) {
  block.textContent = '';

  const session = getSession();
  if (!session) {
    window.location.replace('register');
    return;
  }

  const dashboard = document.createElement('div');
  dashboard.className = 'mylistings-dashboard';

  // Header Section
  const header = document.createElement('div');
  header.className = 'mylistings-header';
  header.innerHTML = `
    <h1 class="mylistings-title">My <em>Listings</em></h1>
    <p class="mylistings-subtitle" id="listingsSubtitle">Loading listed items inventory...</p>
  `;
  dashboard.append(header);

  // Metrics Summary Panel Bar
  const statsBar = document.createElement('div');
  statsBar.className = 'mylistings-stats-bar';
  statsBar.innerHTML = `
    <div class="mylistings-stat-card" id="card-total">
      <h3 id="metric-total">0</h3>
      <p>Total Items</p>
    </div>
    <div class="mylistings-stat-card" id="card-active">
      <h3 id="metric-active">0</h3>
      <p>Active Live</p>
    </div>
    <div class="mylistings-stat-card" id="card-ended">
      <h3 id="metric-ended">0</h3>
      <p>Ended Auctions</p>
    </div>
  `;
  dashboard.append(statsBar);

  // Controls Filter Selector Menu Row
  const filterRow = document.createElement('div');
  filterRow.className = 'mylistings-filter-row';
  filterRow.innerHTML = `
    <div class="mylistings-search-wrap">
      <input type="search" id="listingSearchInput" placeholder="Search listed products..." autocomplete="off" />
      <button type="button" class="btn-clear-search" id="clearSearchBtn">✕</button>
    </div>
    <div class="mylistings-select-wrap">
      <select id="statusFilterSelector">
        <option value="all">Show All Sections</option>
        <option value="active">Active Auctions Only</option>
        <option value="pending">Payment Pending Only</option>
        <option value="completed">Payment Completed Only</option>
        <option value="no_bids">Ended (No Bids) Only</option>
      </select>
    </div>
  `;
  dashboard.append(filterRow);

 const container = document.createElement('div');
container.className = 'mylistings-sections-container';
container.id = 'dynamicCategorizedContainer';
container.innerHTML = `<div class="mylistings-grid">${Array.from({ length: 4 }).map(() => `
  <div class="mylistings-skeleton-card">
    <div class="mylistings-skeleton-thumb"></div>
    <div class="mylistings-skeleton-lines">
      <div class="mylistings-skeleton-line"></div>
      <div class="mylistings-skeleton-line short"></div>
      <div class="mylistings-skeleton-line" style="width:40%"></div>
    </div>
  </div>`).join('')}</div>`;
dashboard.append(container);
block.append(dashboard);
  block.append(dashboard);

 function animateCount(el, target) {
  if (!el) return;
  const start = Number(el.textContent) || 0;
  if (start === target) return;
  const duration = 500;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else {
      el.closest('.mylistings-stat-card')?.classList.add('is-updated');
      setTimeout(() => el.closest('.mylistings-stat-card')?.classList.remove('is-updated'), 400);
    }
  }
  requestAnimationFrame(step);
}

function calculateAndPopulateMetrics(myProducts) {
  let activeCount = 0;
  let endedCount = 0;

  myProducts.forEach(p => {
    if (p.auctionStatus === 'active') activeCount++;
    else endedCount++;
  });

  animateCount(dashboard.querySelector('#metric-total'), myProducts.length);
  animateCount(dashboard.querySelector('#metric-active'), activeCount);
  animateCount(dashboard.querySelector('#metric-ended'), endedCount);
}

  function renderMyListings() {
    const searchQuery = dashboard.querySelector('#listingSearchInput')?.value.toLowerCase() || '';
    const chosenFilter = dashboard.querySelector('#statusFilterSelector')?.value || 'all';

    const allProducts = getProducts() || [];
    const myProducts = allProducts.filter(p => {
      if (!p) return false;
      if (p.sellerEmail && session.email) return p.sellerEmail.toLowerCase() === session.email.toLowerCase();
      if (p.seller && session.name) return p.seller === session.name;
      return false;
    });

    calculateAndPopulateMetrics(myProducts);

    // Apply basic text query filtering baseline first
    const textFiltered = myProducts.filter(p => (p.title || '').toLowerCase().includes(searchQuery));

    // ── FIXED: INITIALIZE 4 ENTIRELY SEPARATE SECTIONS ──
    const structuralGroups = {
      active: { title: "Active Live Auctions", icon: SVGS.active, items: [] },
      pending: { title: "Payment Pending Auctions", icon: SVGS.pending, items: [] },
      completed: { title: "Payment Completed Auctions", icon: SVGS.completed, items: [] },
      no_bids: { title: "Ended Auctions (No Bids)", icon: SVGS.ended, items: [] }
    };

    // Sort items into their absolute structural buckets matching database states
    textFiltered.slice().reverse().forEach(p => {
      const isLive = p.auctionStatus === 'active';
      if (isLive) {
        structuralGroups.active.items.push(p);
      } else {
        if (p.paymentStatus === "completed") {
          structuralGroups.completed.items.push(p);
        } else if (p.paymentStatus === "pending") {
          structuralGroups.pending.items.push(p);
        } else {
          structuralGroups.no_bids.items.push(p);
        }
      }
    });

    // Handle Dropdown Filter updates across the newly formed 4 sections
    if (chosenFilter !== 'all') {
      Object.keys(structuralGroups).forEach(key => {
        if (key !== chosenFilter) {
          structuralGroups[key].items = []; // Empties non-selected tracks completely
        }
      });
    }

    // Calculate dynamic display length counters
    const totalVisible = Object.values(structuralGroups).reduce((acc, g) => acc + g.items.length, 0);

    const subTitleText = dashboard.querySelector('#listingsSubtitle');
    if (subTitleText) {
      subTitleText.textContent = `Showing ${totalVisible} listed item${totalVisible === 1 ? '' : 's'}`;
    }

    if (totalVisible === 0) {
     container.innerHTML = `
  <div class="mylistings-no-results">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l3-4h12l3 4"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
    <p>No listings found matching your exact filter parameters.</p>
  </div>`;
return;
    }

    let HTMLBuffer = '';

    // Render loop processing the 4 individual segment templates
    for (const key in structuralGroups) {
      const group = structuralGroups[key];
      if (group.items.length === 0) continue;

      HTMLBuffer += `
        <div class="mylistings-section" id="listing-group-${key}">
          <h2 class="mylistings-section-title">
            ${group.icon}
            <span>${group.title} (${group.items.length})</span>
          </h2>
          <div class="mylistings-grid">
            ${group.items.map(p => {
              const isLive = p.auctionStatus === 'active';
              
              let statusText = "Live & Active";
              let statusClass = "status-leading"; 
              let indicatorClass = "border-indicator--leading";

              if (!isLive) {
                if (p.paymentStatus === "completed") {
                  statusText = "Payment Completed";
                  statusClass = "status-won-purchased"; 
                  indicatorClass = "border-indicator--won";
                } else if (p.paymentStatus === "pending") {
                  statusText = "Payment Pending";
                  statusClass = "status-won-pending"; 
                  indicatorClass = "border-indicator--outbid";
                } else {
                  statusText = "Ended (No Bids)";
                  statusClass = "status-lost";
                  indicatorClass = "border-indicator--lost";
                }
              }

              const actionButtonElement = isLive ? `
                <button type="button" class="btn-end-auction-early" data-id="${p.id}" title="Terminate auction early">
                  ${SVGS.powerOff} End Early
                </button>
              ` : '';

              return `
                <div class="mylistings-item-card ${indicatorClass}" data-id="${p.id}">
                  <div class="mylistings-item-thumb">
                    <img src="${p.images?.[0] || p.image || 'https://placehold.co/100x100/e8dcc8/5a4a2e?text=Vaultora'}" alt="${p.title}" loading="lazy" width="85" height="85" />
                  </div>
                  <div class="mylistings-item-details">
                    <h3 class="mylistings-item-name">${p.title}</h3>
                    <p class="mylistings-item-time">Category: ${p.category || 'General Curio'}</p>
                    <div class="mylistings-status-pill ${statusClass}">
                      ${SVGS.badgeDot} <span>${statusText}</span>
                    </div>
                  </div>
                  <div class="mylistings-item-financials">
                    <span class="financial-value">₹${Number(p.currentBid || p.startingBid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${!isLive ? 'Final Value' : 'Current Value'}</span>
                    ${actionButtonElement}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    requestAnimationFrame(() => {
      container.innerHTML = HTMLBuffer;
      attachInteractionListeners();
    });
  }

function attachInteractionListeners() {
  container.querySelectorAll('.mylistings-item-card').forEach((card, idx) => {
    card.style.setProperty('--i', idx % 12); // cap stagger so late cards aren't delayed too long

    card.addEventListener('click', () => {
      // FIX: Changed from 'my-listing-details.html' to pure AEM router directory format
      window.location.href = `my-listing-details?id=${card.dataset.id}`;
    });

    // Subtle tilt-on-hover, respects reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--rx', `${px * 4}deg`);
        card.style.setProperty('--ry', `${py * -4}deg`);
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    }
  });

  container.querySelectorAll('.btn-end-auction-early').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerEarlyTermination(e, btn.dataset.id);
    });
  });
}

  function triggerEarlyTermination(event, productId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-card">
        <h3>Terminate Auction?</h3>
        <p style="font-size:0.85rem; line-height:1.45; color:var(--text-muted); margin-bottom:1.5rem;">
          Are you sure you want to end this auction immediately? Bidding will freeze and the highest current offer will be processed instantly.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn-modal-cancel" id="btnCancelTerm">Cancel</button>
          <button type="button" class="btn-modal-submit" id="btnConfirmTerm" style="background:#ff3333;">Terminate</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#btnCancelTerm').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#btnConfirmTerm').addEventListener('click', async () => {
      overlay.remove();
      const allProducts = getProducts() || [];
      const product = allProducts.find(p => p && String(p.id) === String(productId));

      if (!product) return;

      const allBids = getBids() || [];
      const productBids = allBids
        .filter(b => String(b.productId) === String(productId))
        .sort((a, b) => Number(b.amount) - Number(a.amount));

      product.auctionStatus = 'ended';
      product.endTime = new Date().toISOString();

      if (productBids.length > 0) {
        product.winnerEmail = (productBids[0].user || "").toLowerCase();
        product.currentBid = Number(productBids[0].amount);
        product.paymentStatus = 'pending';
      } else {
        product.winnerEmail = null;
        product.paymentStatus = 'none';
      }

      await saveProducts(allProducts);
      
      renderMyListings();
    });
  }

  const searchInput = dashboard.querySelector('#listingSearchInput');
  const filterSelect = dashboard.querySelector('#statusFilterSelector');
  const clearBtn = dashboard.querySelector('#clearSearchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchInput.value.length > 0) clearBtn.classList.add('visible');
      else clearBtn.classList.remove('visible');
      renderMyListings();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      renderMyListings();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', renderMyListings);
  }

  // Metric Console anchor clicks route seamlessly to the four new specific sections
  dashboard.querySelectorAll('.mylistings-stat-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.id === 'card-total') {
        dashboard.querySelector('.mylistings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (card.id === 'card-active') {
        dashboard.querySelector('#listing-group-active')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (card.id === 'card-ended') {
        // Automatically scrolls down to the first available ended structural section category
        const firstEndedSec = dashboard.querySelector('#listing-group-pending') || 
                              dashboard.querySelector('#listing-group-completed') || 
                              dashboard.querySelector('#listing-group-no_bids');
        firstEndedSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  renderMyListings();
}