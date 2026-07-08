/*
 * orders.js
 * Vaultora - Buyer Purchase Invoice Processing Engine (Sleek Master-Detail View)
 * Edge Delivery Services (EDS) block configuration template.
 */

import { getProducts, getSession } from '../../scripts/storage.js';

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function decorate(block) {
  // 1. Parse configuration parameters from the authored da.live structure
  const cfg = {
    emptyImg:    block.children[0]?.children[1]?.textContent?.trim() || '../images/empty-cart-girl.png',
    emptyText:   block.children[1]?.children[1]?.textContent?.trim() || 'You have not completed any collection checkout invoices yet.',
    statusLabel: block.children[2]?.children[1]?.textContent?.trim() || 'Paid Checkout',
    routeLabel:  block.children[3]?.children[1]?.textContent?.trim() || 'Standard Route',
    destTitle:   block.children[4]?.children[1]?.textContent?.trim() || 'Consignee Destination',
    finTitle:    block.children[5]?.children[1]?.textContent?.trim() || 'Financial Statement'
  };

  block.textContent = '';

  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session) {
    window.location.replace('register');
    return;
  }

  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';

  const titleRow = document.createElement('div');
  titleRow.className = 'orders-title-row';
  titleRow.innerHTML = `
    <!-- UPDATED: Re-mapped with explicit luxury semantic detail tokens -->
    <h1 class="page-title">Historical <em>Manifest Ledger</em></h1>
    <span class="page-sub" id="pageSubtitle">Syncing server database fields...</span>
  `;
  mainContent.append(titleRow);

  const containerBoundary = document.createElement('div');
  containerBoundary.className = 'orders-isolation-boundary';
  
  const ordersMasterList = document.createElement('div');
  ordersMasterList.className = 'orders-master-list';
  ordersMasterList.id = 'ordersContainer';
  
  containerBoundary.append(ordersMasterList);
  mainContent.append(containerBoundary);
  block.append(mainContent);

  const rawOrders = localStorage.getItem('Vaultora_orders');
  const systemOrders = rawOrders ? JSON.parse(rawOrders) : [];
  const globalInventory = typeof getProducts === 'function' ? getProducts() : [];

  const userPurchases = systemOrders.filter(order => 
    order.buyerEmail && order.buyerEmail.toLowerCase() === session.email.toLowerCase()
  );

  const subTitleText = document.getElementById('pageSubtitle');
  if (subTitleText) {
    // UPDATED: Injected an italic decoration label segment directly for the counter metric text layer
    subTitleText.innerHTML = `Showing <em>${userPurchases.length} settled purchase${userPurchases.length === 1 ? '' : 's'}</em>`;
  }

  if (userPurchases.length === 0) {
    ordersMasterList.innerHTML = `
      <div class="bids-empty-wrapper" style="text-align: center; padding: 4rem 1rem;">
        <img src="${cfg.emptyImg}" class="empty-state-img" alt="No Purchases Found" width="280" height="200" onerror="this.onerror=null;this.src='https://placehold.co/280x200/e8dcc8/5a4a2e?text=No+Orders'"/>
        <p class="empty-state-text" style="margin-top:1rem; color:#5a5852; font-weight:500;">${cfg.emptyText}</p>
      </div>`;
    block.classList.add('orders-pdp-rendered');
    return;
  }

  const chronologicalReceipts = [...userPurchases].sort((a, b) => {
    return new Date(b.paidAt || b.timestamp) - new Date(a.paidAt || a.timestamp);
  });

  // Render minimal list view cards
  ordersMasterList.innerHTML = chronologicalReceipts.map((order, index) => {
    const itemMatch = globalInventory.find(p => String(p.id) === String(order.productId));
    const renderThumbSrc = itemMatch?.images?.[0] || itemMatch?.image || '../images/placeholder-product.webp';
    
    let displayTitle = order.productTitle || itemMatch?.title || 'Conscious Luxury Piece';
    let extraMetaDetails = '';
    if (displayTitle.includes('(')) {
      const parts = displayTitle.split('(');
      displayTitle = parts[0].trim();
      extraMetaDetails = parts[1].replace(')', '').trim();
    }

    return `
      <div class="minimal-order-row-card" data-order-id="${order.id}" style="animation-delay: ${index * 0.05}s;">
        <div class="minimal-thumb-frame">
          <img src="${renderThumbSrc}" alt="${displayTitle}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e8dcc8/5a4a2e?text=Vaultora'"/>
        </div>
        <div class="minimal-details-frame">
          <div class="minimal-title-line">
            <h3 class="minimal-item-title">${displayTitle}</h3>
            <span class="minimal-status-badge">${cfg.statusLabel}</span>
          </div>
          <p class="minimal-item-desc">${extraMetaDetails || itemMatch?.description || 'Curated catalog ledger acquisition piece.'}</p>
          <div class="minimal-price-line">
            <span class="minimal-price-val">${fmt(order.total)}</span>
            <button type="button" class="btn-invoice-expand-trigger" aria-label="View Detailed Statement">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 4. DIALOG BOX MODAL RE-ARCHITECTED LAYER
  function spawnDetailedReceiptModal(orderId) {
    const order = chronologicalReceipts.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const itemMatch = globalInventory.find(p => String(p.id) === String(order.productId));
    const renderThumbSrc = itemMatch?.images?.[0] || itemMatch?.image || '../images/placeholder-product.webp';
    
    const formattedDate = new Date(order.paidAt || order.timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short'
    });

    const shippingLine = order.shippingCost > 0 ? `₹${Number(order.shippingCost).toFixed(2)}` : 'Free Delivery';
    const offsetLine = order.ecoOffset > 0 ? `₹${Number(order.ecoOffset).toFixed(2)}` : '₹0.00';

    let displayTitle = order.productTitle || itemMatch?.title || 'Conscious Luxury Piece';
    if (displayTitle.includes('(')) displayTitle = displayTitle.split('(')[0].trim();

    const overlay = document.createElement('div');
    overlay.className = 'pdp-modal-overlay-shroud';
    overlay.innerHTML = `
      <div class="pdp-modal-content-card">
        <button type="button" class="btn-close-modal-canvas" id="pdpCloseModalBtn" aria-label="Close Portal">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="receipt-header-row">
          <div class="receipt-meta-block">
            <span class="receipt-id-lbl">ORDER REFERENCE: <span class="hash-id">#${order.id}</span></span>
            <span class="receipt-date-val">Ordered on ${formattedDate}</span>
          </div>
          <div>
            <span class="luxury-status-badge success">${cfg.statusLabel}</span>
          </div>
        </div>

        <div class="receipt-manifest-body">
          <div class="image-arch-frame">
            <img src="${renderThumbSrc}" class="receipt-thumb-frame" alt="Purchased Manifest Item" width="64" height="64"/>
          </div>
          <div class="manifest-text-details">
            <h3 class="manifest-item-title">${displayTitle}</h3>
            <span class="fulfillment-tier-label">Fulfillment Tier: <strong>${order.shippingOption || cfg.routeLabel}</strong></span>
          </div>
        </div>

        <div class="receipt-summary-split">
          <div class="shipping-address-summary">
            <h4 class="summary-block-heading">I. ${cfg.destTitle}</h4>
            <div class="address-grid-matrix">
              <span class="grid-label">Recipient</span><span class="grid-value core-name">${order.shippingAddress?.name || order.buyerName}</span>
              <span class="grid-label">Street</span><span class="grid-value">${order.shippingAddress?.address || 'Collection Drop-off Point Location'}</span>
              <span class="grid-label">City / PIN</span><span class="grid-value">${order.shippingAddress?.city || ''} — ${order.shippingAddress?.pin || ''}</span>
              <span class="grid-label">Region</span><span class="grid-value">${order.shippingAddress?.state || ''}</span>
              <span class="grid-label">Contact</span><span class="grid-value font-numeric">${order.shippingAddress?.phone || '—'}</span>
            </div>
          </div>

          <div class="financial-ledger-table">
            <h4 class="summary-block-heading">II. ${cfg.finTitle}</h4>
            <div class="ledger-line-row"><span>Hammer Price Valuation</span><span class="font-numeric">${fmt(order.winningBid || order.total)}</span></div>
            <div class="ledger-line-row"><span>Logistic Transit Premium</span><span class="font-numeric">${shippingLine}</span></div>
            ${order.ecoPackaging ? `<div class="ledger-detail-note">✓ Eco-Shield Premium Active Upgrade</div>` : ''}
            <div class="ledger-line-row"><span>UN Sustainability Contribution</span><span class="font-numeric">${offsetLine}</span></div>
            <div class="ledger-line-row total-bold"><span>Total Settled Value</span><span class="font-numeric">${fmt(order.total)}</span></div>
          </div>
        </div>
      </div>
    `;

    document.body.append(overlay);
    document.body.style.overflow = 'hidden';

    setTimeout(() => overlay.classList.add('active'), 10);

    const closeTargetModal = () => {
      overlay.classList.remove('active');
      setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 250);
    };

    overlay.querySelector('#pdpCloseModalBtn').addEventListener('click', closeTargetModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTargetModal(); });
  }

  // Intercept click sequences onto list cards cleanly [Fixed Click Trigger]
  ordersMasterList.querySelectorAll('.minimal-order-row-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.getAttribute('data-order-id');
      spawnDetailedReceiptModal(orderId);
    });
  });

  block.classList.add('orders-pdp-rendered');
}