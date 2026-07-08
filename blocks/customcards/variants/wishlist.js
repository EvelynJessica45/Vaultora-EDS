/*
 * wishlist.js
 * Renders the logged-in user's active favorite luxury items grid.
 * Features live time remaining countdowns and active bid counters.
 */

import { getProducts, getFavorites, saveFavorites, getSession, getBids } from '../../scripts/storage.js';

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

function getCountdownText(endTimeStr) {
  if (!endTimeStr) return { text: 'Ended', urgent: false };
  const diff = new Date(endTimeStr) - new Date();
  if (diff <= 0) return { text: 'Ended', urgent: false };

  const totalMins = Math.floor(diff / 60000);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    return { text: `${days}d ${totalHours % 24}h left`, urgent: false };
  }
  if (totalHours === 0 && totalMins % 60 < 5) {
    return { text: `${totalMins % 60}m left`, urgent: true };
  }
  return { text: `${totalHours}h ${totalMins % 60}m left`, urgent: false };
}

export default function decorate(block) {
  block.textContent = '';

  const session = getSession();
  if (!session) {
    window.location.replace('register');
    return;
  }

  const userEmail = session.email ? session.email.toLowerCase() : '';
  const container = document.createElement('div');
  container.className = 'wishlist-dashboard';

  const headerZone = document.createElement('div');
  headerZone.className = 'wishlist-header';
  headerZone.innerHTML = `
    <h1 class="wishlist-title">My <em>Favourites</em></h1>
    <p class="wishlist-subtitle" id="wishlistSubtitle">Loading active favourites...</p>
  `;
  container.append(headerZone);

  const listGrid = document.createElement('div');
  listGrid.className = 'auctionproducts-grid';
  container.append(listGrid);
  block.append(container);

  let countdownInterval = null;

  function renderMyFavourites() {
    if (countdownInterval) clearInterval(countdownInterval);

    const allProducts = getProducts() || [];
    const favorites = getFavorites() || {};
    const allBids = getBids() || [];

    const favoriteKey = Object.keys(favorites).find(k => k.toLowerCase() === userEmail);
    const userFavorites = favoriteKey ? favorites[favoriteKey] : [];
    
    const likedProducts = allProducts.filter(p => 
      p && userFavorites.includes(p.id) && p.auctionStatus === 'active' && p.sellerEmail !== session.email
    );

    const subtitle = headerZone.querySelector('#wishlistSubtitle');
    if (subtitle) {
      subtitle.textContent = `Showing ${likedProducts.length} active favourites`;
    }

    if (likedProducts.length === 0) {
      listGrid.innerHTML = `<p class="wishlist-empty-msg">No favourites yet — heart an item to begin tracking!</p>`;
      return;
    }

    // LCP PRELOAD INJECTION: Optimize above-the-fold image discovery instantly
    const firstProduct = likedProducts[0];
    if (firstProduct) {
      let preloadSrc = firstProduct.images?.[0] || firstProduct.image || 'https://placehold.co/400x300/e8dcc8/5a4a2e?text=Vaultora';
      if (preloadSrc.includes('media_') && !preloadSrc.includes('format=')) {
        const separator = preloadSrc.includes('?') ? '&' : '?';
        preloadSrc = `${preloadSrc}${separator}width=360&format=webp&optimize=medium`;
      }
      
      // Look for an existing preload to avoid duplication
      let existingPreload = document.querySelector(`link[rel="preload"][href="${preloadSrc}"]`);
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = preloadSrc;
        preloadLink.fetchPriority = 'high';
        document.head.appendChild(preloadLink);
      }
    }

    const fragment = document.createDocumentFragment();
    const cardsToUpdate = [];
    const fallbackImg = 'https://placehold.co/400x300/e8dcc8/5a4a2e?text=Vaultora';

    let index = 0;
    function processBatch() {
      const batchSize = 4; 
      const limit = Math.min(index + batchSize, likedProducts.length);

      for (; index < limit; index++) {
        const p = likedProducts[index];
        const card = document.createElement('article');
        card.className = 'auctionproducts-card';
        card.style.animationDelay = `${index * 0.02}s`;

        const productBids = allBids.filter(b => String(b.productId) === String(p.id));
        const totalBidsCount = productBids.length;
        const timeMetrics = getCountdownText(p.endTime);
        const formattedPrice = Number(p.currentBid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const isAboveFold = index < 2;

        let optimizedImageSrc = p.images?.[0] || p.image || fallbackImg;
        if (optimizedImageSrc.includes('media_') && !optimizedImageSrc.includes('format=')) {
          const separator = optimizedImageSrc.includes('?') ? '&' : '?';
          optimizedImageSrc = `${optimizedImageSrc}${separator}width=360&format=webp&optimize=medium`;
        }

        card.innerHTML = `
          <div class="auctionproducts-media">
            <img class="auctionproducts-img-single"
                 src="${optimizedImageSrc}"
                 alt="${p.title}"
                 width="220"
                 height="220"
                 ${isAboveFold ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'}
                 onerror="this.onerror=null;this.src='${fallbackImg}'"/>
          </div>
          <div class="auctionproducts-body">
            <p class="auctionproducts-seller">${p.seller || 'Verified Seller'}${p.goodSeller ? ' · ✦' : ''}</p>
            <h2 class="auctionproducts-title">${p.title}</h2>
            <div class="auctionproducts-bid-info">
              <span class="auctionproducts-bid-label">Current Bid</span>
              <span class="auctionproducts-timer ${timeMetrics.urgent ? 'bid-timer-urgent' : ''}" data-end-time="${p.endTime || ''}">
                ${timeMetrics.text}
              </span>
            </div>
            <div class="auctionproducts-price-row">
              <span class="auctionproducts-price">₹${formattedPrice}</span>
              <span class="auctionproducts-bids-count">(${totalBidsCount} ${totalBidsCount === 1 ? 'bid' : 'bids'})</span>
            </div>
            <button type="button" class="auctionproducts-bid-btn">Place Bid</button>
            <button type="button" class="auctionproducts-fav is-active" aria-label="Remove from favorites">
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4.5 5.3 4c2-.3 3.9.7 5 2.4C11.4 4.7 13.3 3.7 15.3 4c3.3.5 5 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        `;

        card.addEventListener('click', () => { window.location.href = `detail?id=${p.id}`; });
        card.querySelector('.auctionproducts-bid-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = `detail?id=${p.id}`;
        });
        card.querySelector('.auctionproducts-fav').addEventListener('click', async (e) => {
          e.stopPropagation();
          await handleToggleLike(p.id, card);
        });

        const timerNode = card.querySelector('.auctionproducts-timer');
        if (timerNode && p.endTime) {
          cardsToUpdate.push({ node: timerNode, endTime: p.endTime });
        }

        fragment.appendChild(card);
      }

      if (index < likedProducts.length) {
        (window.requestIdleCallback || window.setTimeout)(processBatch);
      } else {
        requestAnimationFrame(() => {
          listGrid.textContent = '';
          listGrid.appendChild(fragment);
        });

        if (cardsToUpdate.length > 0) {
          countdownInterval = setInterval(() => {
            const len = cardsToUpdate.length;
            for (let k = 0; k < len; k++) {
              const item = cardsToUpdate[k];
              const updatedMetrics = getCountdownText(item.endTime);
              item.node.textContent = updatedMetrics.text;
              if (updatedMetrics.urgent) {
                item.node.classList.add('bid-timer-urgent');
              } else {
                item.node.classList.remove('bid-timer-urgent');
              }
            }
          }, 60000);
        }
      }
    }

    processBatch();
  }

  async function handleToggleLike(id, cardElement) {
    const currentFavorites = getFavorites() || {};
    const emailKey = session.email ? session.email.toLowerCase() : '';
    if (!emailKey) return;

    if (!currentFavorites[emailKey]) currentFavorites[emailKey] = [];
    const alreadyLiked = currentFavorites[emailKey].includes(id);

    if (alreadyLiked) {
      currentFavorites[emailKey] = currentFavorites[emailKey].filter(x => x !== id);
      showToast('Removed from favourites ❤️');
      if (cardElement) {
        cardElement.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.95) translateY(8px)';
      }
    } else {
      currentFavorites[emailKey].push(id);
      showToast('❤️ Added to favourites');
    }

    await saveFavorites(currentFavorites);
    setTimeout(() => { renderMyFavourites(); }, 250);
  }

  renderMyFavourites();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renderMyFavourites();
  });
}