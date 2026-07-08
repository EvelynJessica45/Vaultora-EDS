/*
 * mybids.js
 * Renders the logged-in user's consolidated unique auction bid history.
 * Aggregates duplicate bids to isolate highest personal valuations, tracks live statuses,
 * and splits rendering across Leading, Outbid, Won, and Lost metrics.
 */

import { getProducts, getBids, getSession } from '/scripts/storage.js';

// Centralised layout calculations matching dashboard status models
function getBidHistoryForProduct(productId) {
  return (getBids() || [])
    .filter(b => String(b.productId) === String(productId))
    .map(b => ({ ...b, amount: parseFloat(b.amount) || 0 }))
    .sort((a, b) => b.amount - a.amount);
}

// Minimal 60ms debounce mechanism to keep character entry non-blocking and protect TBT/INP
function debounce(fn, delay = 60) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function decorate(block) {
  block.textContent = '';

  const session = getSession();
  if (!session) {
    block.innerHTML = `
      <div class="mybids-empty-state">
        <p>Please log in to view your dynamic bidding matrix dashboard.</p>
        <button class="btn-modal-submit" onclick="window.location.href='register'">Go to Login</button>
      </div>`;
    return;
  }

  const userEmail = session.email.toLowerCase();

  // --- CORE DATA MATRIX ISOLATION LOGIC ---
  const allBids = getBids() || [];
  const allProducts = getProducts() || [];
  
  const userBiddedProductIds = [...new Set(
    allBids.filter(b => b.user && b.user.toLowerCase() === userEmail).map(b => String(b.productId))
  )];

  // Build the consolidated dynamic list of unique bidded items
  const uniqueUserBids = userBiddedProductIds.map(pid => {
    const product = allProducts.find(p => String(p.id) === pid);
    const productBids = getBidHistoryForProduct(pid);
    
    // Isolate the user's personal highest bid on this item
    const userPersonalBids = productBids.filter(b => b.user && b.user.toLowerCase() === userEmail);
    const personalHighestBid = userPersonalBids[0]?.amount || 0;
    const personalBidTime = userPersonalBids[0]?.timestamp || product?.endTime;

    // Isolate global standing metrics
    const globalHighestBid = productBids[0]?.amount || 0;
    const isGlobalLeader = productBids[0]?.user && productBids[0].user.toLowerCase() === userEmail;
    
    // Calculate the user's specific ranking (1-based index)
    const uniqueUserOrder = [...new Set(productBids.map(b => b.user.toLowerCase()))];
    const userRank = uniqueUserOrder.indexOf(userEmail) + 1;

    // Determine current live phase grouping
    let statusGroup = 'outbid';
    let statusLabel = `Outbid - Rank #${userRank}`;
    let statusClass = 'status-outbid';

    const isLive = product && product.auctionStatus === 'active';

    if (isLive) {
      if (isGlobalLeader) {
        statusGroup = 'leading';
        statusLabel = 'Leading Bid';
        statusClass = 'status-leading';
      }
    } else {
      // Auction has ended
      const initialPrice = Number(product?.startingBid || product?.price || 0);
      const isWinner = product?.winnerEmail && product.winnerEmail.toLowerCase() === userEmail;

      if (isWinner && personalHighestBid >= initialPrice) {
        statusGroup = 'won';
        const isPaid = product?.paymentStatus === 'completed';
        statusLabel = isPaid ? 'Won Auction - Purchased' : 'Won Auction - Pending Payment';
        statusClass = isPaid ? 'status-won-purchased' : 'status-won-pending';
      } else {
        statusGroup = 'lost';
        statusLabel = 'Lost Auction';
        statusClass = 'status-lost';
      }
    }

    return {
      id: pid,
      title: product?.title || 'Unknown Historical Asset',
      image: product?.images?.[0] || product?.image || '',
      endTime: product?.endTime,
      personalHighestBid,
      personalBidTime,
      statusGroup,
      statusLabel,
      statusClass,
      searchText: `${product?.title || ''} ${product?.seller || ''}`.toLowerCase()
    };
  });

  // --- COMPUTE TOP METRIC COUNTER BOXES ---
  const countTotal = uniqueUserBids.length;
  const countLeading = uniqueUserBids.filter(b => b.statusGroup === 'leading').length;
  const countWon = uniqueUserBids.filter(b => b.statusGroup === 'won').length;
  const countLost = uniqueUserBids.filter(b => b.statusGroup === 'lost').length;
  const maxBidVal = uniqueUserBids.reduce((max, b) => b.personalHighestBid > max ? b.personalHighestBid : max, 0);

  // --- RENDER COMPONENT DOM INTERFACE STRUCTS ---
  const container = document.createElement('div');
  container.className = 'mybids-dashboard';

  // Header Title
  container.innerHTML = `
    <div class="mybids-header">
      <h1 class="mybids-title">My <em>Bids</em></h1>
      <p class="mybids-subtitle">Showing ${countTotal} unique auctions</p>
    </div>
  `;

  // Summary Metrics Bar
  const statsBar = document.createElement('div');
  statsBar.className = 'mybids-stats-bar';
  statsBar.innerHTML = `
    <div class="mybids-stat-card"><h2>${countTotal}</h2><p>TOTAL BIDS</p></div>
    <div class="mybids-stat-card"><h2>${countLeading}</h2><p>LEADING</p></div>
    <div class="mybids-stat-card"><h2>${countWon}</h2><p>WON</p></div>
    <div class="mybids-stat-card"><h2>${countLost}</h2><p>LOST</p></div>
    <div class="mybids-stat-card mybids-stat-card--wide">
      <h2>₹${maxBidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
      <p>HIGHEST BID MAX</p>
    </div>
  `;
  container.append(statsBar);

  // Search & Filter Action Header with Explicit Accessibility Labels
  const filterRow = document.createElement('div');
  filterRow.className = 'mybids-filter-row';
  filterRow.innerHTML = `
    <div class="mybids-search-wrap">
      <input type="text" id="bidsSearchInput" placeholder="Search auctions..." aria-label="Search auctions" />
    </div>
    <div class="mybids-select-wrap">
      <select id="bidsStatusSelect" aria-label="Filter by status">
        <option value="all">All Statuses</option>
        <option value="leading">Leading</option>
        <option value="outbid">Outbid</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
    </div>
  `;
  container.append(filterRow);

  // Content Dynamic Wrapper Grid
  const listWrapper = document.createElement('div');
  listWrapper.className = 'mybids-sections-container';
  container.append(listWrapper);

  // Filter Engine Handler Execution
  function renderFilteredLists() {
    const query = container.querySelector('#bidsSearchInput').value.trim().toLowerCase();
    const filterStatus = container.querySelector('#bidsStatusSelect').value;

    const sectionsData = [
      { id: 'leading', label: 'Leading Bids', count: countLeading, icon: '⏆' },
      { id: 'outbid', label: 'Outbid', count: uniqueUserBids.filter(b => b.statusGroup === 'outbid').length, icon: '☉' },
      { id: 'won', label: 'Won Auctions', count: countWon, icon: '✧' },
      { id: 'lost', label: 'Lost Auctions', count: countLost, icon: '📁' }
    ];

    const fragment = document.createDocumentFragment();
    let computedSectionsVisible = 0;

    sectionsData.forEach(sec => {
      if (filterStatus !== 'all' && filterStatus !== sec.id) return;

      const filteredItems = uniqueUserBids.filter(b => 
        b.statusGroup === sec.id && 
        (!query || b.searchText.includes(query))
      );

      if (filteredItems.length === 0) return;

      computedSectionsVisible++;
      const secEl = document.createElement('section');
      secEl.className = `mybids-section mybids-section--${sec.id}`;
      
      let gridHTML = '';
      filteredItems.forEach((item, index) => {
        const timeString = item.personalBidTime ? new Date(item.personalBidTime).toLocaleString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true}) : '';
        
        const isPriority = index < 2;
        const imageDOM = item.image 
          ? `<img src="${item.image}" alt="${item.title}" loading="${isPriority ? 'eager' : 'lazy'}" width="85" height="85" decoding="async" ${isPriority ? 'fetchpriority="high"' : ''}/>` 
          : `<div class="thumb-placeholder" style="width:85px; height:85px; display:flex; align-items:center; justify-content:center;">${item.title.charAt(0)}</div>`;

        gridHTML += `
          <div class="mybids-item-card border-indicator--${sec.id}" data-id="${item.id}" role="button" tabIndex="0" aria-label="View auction details for ${item.title}">
            <div class="mybids-item-thumb">
              ${imageDOM}
            </div>
            <div class="mybids-item-details">
              <h3 class="mybids-item-name">${item.title}</h3>
              <p class="mybids-item-time">${timeString}</p>
              <div class="mybids-item-badge-row">
                <span class="mybids-status-pill ${item.statusClass}">${item.statusLabel}</span>
              </div>
            </div>
            <div class="mybids-item-financials">
              <span class="financial-value">₹${item.personalHighestBid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        `;
      });

      secEl.innerHTML = `
        <h2 class="mybids-section-title">
          <span class="sec-icon" aria-hidden="true">${sec.icon}</span> ${sec.label} (${filteredItems.length})
        </h2>
        <div class="mybids-grid">${gridHTML}</div>
      `;

      fragment.appendChild(secEl);
    });

    listWrapper.textContent = '';

    if (computedSectionsVisible === 0) {
      const fallback = document.createElement('p');
      fallback.className = 'mybids-no-results';
      fallback.textContent = 'No active bid summaries match your chosen parameters.';
      listWrapper.appendChild(fallback);
    } else {
      listWrapper.appendChild(fragment);
    }
  }

  function navigateToDetails(productId) {
    if (productId) {
      window.location.href = `my-bid-details?id=${productId}`;
    }
  }

  listWrapper.addEventListener('click', (e) => {
    const card = e.target.closest('.mybids-item-card');
    if (card) {
      navigateToDetails(card.getAttribute('data-id'));
    }
  });

  listWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.mybids-item-card');
      if (card) {
        e.preventDefault();
        navigateToDetails(card.getAttribute('data-id'));
      }
    }
  });

  container.querySelector('#bidsSearchInput').addEventListener('input', debounce(renderFilteredLists, 60));
  container.querySelector('#bidsStatusSelect').addEventListener('change', renderFilteredLists);

  block.append(container);
  renderFilteredLists();
}