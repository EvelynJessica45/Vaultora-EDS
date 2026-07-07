/*
 * mylistings.js
 * Decorates the user's personal seller inventory dashboard.
 * Separates listings into 4 distinct visual sections based on real-time status parameters.
 */

import { getProducts, getBids, getSession, saveProducts } from '../../scripts/storage.js';

const SVGS = {
  active: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  pending: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  completed: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  ended: `<svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  badgeDot: `<svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="3"/></svg>`,
  powerOff: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`
};

export default function decorate(block) {
  block.textContent = '';

  const dashboard = document.createElement('div');
  dashboard.className = 'mylistings-dashboard';

  const header = document.createElement('div');
  header.className = 'mylistings-header';
  header.innerHTML = `
    <h1 class="mylistings-title">My <em>Listings</em></h1>
    <p class="mylistings-subtitle" id="listingsSubtitle">Loading listed items inventory...</p>
  `;
  dashboard.append(header);

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

  const filterRow = document.createElement('div');
  filterRow.className = 'mylistings-filter-row';
  filterRow.innerHTML = `
    <div class="mylistings-search-wrap">
      <input type="search" id="listingSearchInput" placeholder="Search listed products..." autocomplete="off" aria-label="Search listed products" />
      <button type="button" class="btn-clear-search" id="clearSearchBtn" aria-label="Clear search">✕</button>
    </div>
    <div class="mylistings-select-wrap">
      <select id="statusFilterSelector" aria-label="Filter listings by status">
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
        <div class="mylistings-skeleton-line" style="width: 80%"></div>
        <div class="mylistings-skeleton-line" style="width: 50%"></div>
        <div class="mylistings-skeleton-line" style="width: 30%"></div>
      </div>
    </div>`).join('')}</div>`;
  dashboard.append(container);
  block.append(dashboard);

  statsBar.addEventListener('click', (e) => {
    const card = e.target.closest('.mylistings-stat-card');
    if (!card) return;
    
    if (card.id === 'card-total') {
      dashboard.querySelector('.mylistings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (card.id === 'card-active') {
      dashboard.querySelector('#listing-group-active')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (card.id === 'card-ended') {
      const firstEndedSec = dashboard.querySelector('#listing-group-pending') || 
                            dashboard.querySelector('#listing-group-completed') || 
                            dashboard.querySelector('#listing-group-no_bids');
      firstEndedSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  function animateCount(el, target) {
    if (!el) return;
    const start = Number(el.textContent) || 0;
    if (start === target) return;
    const duration = 400;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); 
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else {
        const parentCard = el.closest('.mylistings-stat-card');
        if (parentCard) {
          parentCard.classList.add('is-updated');
          setTimeout(() => parentCard.classList.remove('is-updated'), 300);
        }
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
    const session = getSession();
    if (!session) return;

    const searchQuery = dashboard.querySelector('#listingSearchInput')?.value.toLowerCase() || '';
    const chosenFilter = dashboard.querySelector('#statusFilterSelector')?.value || 'all';

    const allProducts = getProducts() || [];
    const myProducts = allProducts.filter(p => {
      if (!p) return false;
      
      const sessionEmail = session.email ? session.email.toLowerCase() : '';
      const productEmail = p.sellerEmail ? p.sellerEmail.toLowerCase() : '';
      const sessionName = session.name ? session.name.toLowerCase() : '';
      const productName = p.seller ? p.seller.toLowerCase() : '';
      
      return (productEmail && sessionEmail && productEmail === sessionEmail) || 
             (productName && sessionName && productName === sessionName);
    });

    calculateAndPopulateMetrics(myProducts);

    const textFiltered = myProducts.filter(p => (p.title || '').toLowerCase().includes(searchQuery));

    const structuralGroups = {
      active: { title: "Active Live Auctions", icon: SVGS.active, items: [] },
      pending: { title: "Payment Pending Auctions", icon: SVGS.pending, items: [] },
      completed: { title: "Payment Completed Auctions", icon: SVGS.completed, items: [] },
      no_bids: { title: "Ended Auctions (No Bids)", icon: SVGS.ended, items: [] }
    };

    textFiltered.slice().reverse().forEach(p => {
      if (p.auctionStatus === 'active') {
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

    if (chosenFilter !== 'all') {
      Object.keys(structuralGroups).forEach(key => {
        if (key !== chosenFilter) structuralGroups[key].items = []; 
      });
    }

    const totalVisible = Object.values(structuralGroups).reduce((acc, g) => acc + g.items.length, 0);

    const subTitleText = dashboard.querySelector('#listingsSubtitle');
    if (subTitleText) {
      subTitleText.textContent = `Showing ${totalVisible} listed item${totalVisible === 1 ? '' : 's'}`;
    }

    if (totalVisible === 0) {
      container.innerHTML = `
        <div class="mylistings-no-results">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem;" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l3-4h12l3 4"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
          <p>No listings found matching your exact filter parameters.</p>
        </div>`;
      return;
    }

    let HTMLBuffer = '';

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
            ${group.items.map((p, idx) => {
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
                <div class="mylistings-item-card ${indicatorClass}" data-id="${p.id}" style="--i: ${idx % 15};">
                  <div class="mylistings-item-thumb">
                    <img src="${p.images?.[0] || p.image || 'https://placehold.co/100x100/e8dcc8/5a4a2e?text=Vaultora'}" alt="${p.title}" loading="lazy" decoding="async" width="84" height="84" />
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
                    <span style="font-size: 0.7rem; color: #666666;">${!isLive ? 'Final Value' : 'Current Value'}</span>
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
    });
  }

  container.onclick = function(e) {
    const earlyTerminationButton = e.target.closest('.btn-end-auction-early');
    if (earlyTerminationButton) {
      e.stopPropagation();
      triggerEarlyTermination(e, earlyTerminationButton.dataset.id);
      return;
    }

    const itemCard = e.target.closest('.mylistings-item-card');
    if (itemCard) {
      const targetProductId = itemCard.dataset.id;
      window.location.href = `/my-listing-details?id=${targetProductId}`;
    }
  };

  function triggerEarlyTermination(event, productId) {
    const existingModals = document.querySelectorAll('.modal-overlay');
    existingModals.forEach(modal => modal.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h3>Terminate Auction Lot?</h3>
        <p>Are you sure you want to end this auction immediately? Bidding will freeze and the status matrices will map strictly to your database history configurations.</p>
        <div class="modal-actions">
          <button type="button" class="btn-modal-cancel" id="btnCancelTerm">Cancel</button>
          <button type="button" class="btn-modal-submit" id="btnConfirmTerm" style="background:#d32f2f; color: #ffffff;">Terminate</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
      overlay.classList.add('open');
    });

    overlay.querySelector('#btnCancelTerm').addEventListener('click', () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    });
    
    overlay.querySelector('#btnConfirmTerm').addEventListener('click', async () => {
      try {
        const allProducts = getProducts() || [];
        const product = allProducts.find(p => p && String(p.id) === String(productId));

        if (product) {
          const allBids = getBids() || [];
          const productBids = allBids
            .filter(b => b && String(b.productId) === String(productId))
            .sort((a, b) => Number(b.amount) - Number(a.amount));

          product.endTime = new Date().toISOString();

          if (productBids.length > 0) {
            product.auctionStatus = 'inactive'; 
            product.winnerEmail = (productBids[0].user || "").toLowerCase();
            product.currentBid = Number(productBids[0].amount);
            product.paymentStatus = 'pending';
          } else {
            product.auctionStatus = 'ended'; 
            product.winnerEmail = null;
            product.paymentStatus = 'none';
          }

          await saveProducts(allProducts);
        }
      } catch (err) {
        console.error("Failed executing transaction termination hook:", err);
      } finally {
        overlay.classList.remove('open');
        setTimeout(() => {
          overlay.remove();
          renderMyListings();
        }, 300);
      }
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

  (async () => {
    const storeTimeout = new Promise((resolve) => setTimeout(resolve, 100));
    await Promise.race([window.__storeReady || Promise.resolve(), storeTimeout]);

    const initialSessionCheck = getSession() || JSON.parse(localStorage.getItem('Vaultora_session'));
    if (!initialSessionCheck) {
      window.location.replace('/register');
    } else {
      renderMyListings();
    }
  })();
}