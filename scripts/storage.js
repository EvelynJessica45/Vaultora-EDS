/* =========================================================================
   Vaultora — scripts/storage.js (Synchronous Data & Business Matrix Split)
   ========================================================================= */

import { 
  loadMarketplaceData, 
  syncMarketplaceData,
  LS_PRODUCTS,
  LS_CATEGORIES,
  LS_USERS,
  LS_SESSION,
  LS_BIDS,
  LS_FAVORITES,
  LS_ORDERS
} from './aws-service.js';

import { sendOutbidNotification } from './notification-service.js';

// FIXED: Hardcoded absolute key tracking to guarantee alignment across separate blocks
const TRU_SESSION_KEY = 'Vaultora_session';

/* Strict single-layer parsing for safe variable lookups */
function lsGet(key) {
  const val = localStorage.getItem(key);
  if (!val) return null;
  try {
    const firstParse = JSON.parse(val);
    if (typeof firstParse === 'string') {
      try {
        return JSON.parse(firstParse);
      } catch (innerErr) {
        return firstParse;
      }
    }
    return firstParse;
  } catch (e) { 
    return val; 
  }
}

/* Ensure clean single-layer serialization across storage paths */
function lsSet(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
    return;
  }
  const cleanString = typeof value === 'object' ? JSON.stringify(value) : value;
  localStorage.setItem(key, cleanString);
}

export async function initializeStore() {
  window.__storeReady = (async function resolveSyncHandshake() {
    try {
      const cloudState = await loadMarketplaceData();
      for (const [key, value] of Object.entries(cloudState)) {
        // FIXED: Protect both the dynamic key and the hardcoded session key from initialization resets
        if (key === LS_SESSION || key === TRU_SESSION_KEY) continue;
        if (value !== null && value !== undefined) {
          const processedValue = typeof value === 'object' ? JSON.stringify(value) : value;
          localStorage.setItem(key, processedValue);
        }
      }
      console.log('✅ S3 Cloud text structure unpacked successfully!');
    } catch (err) {
      console.warn('⚠️ S3 unreadable (Using fallback cached storage schemas):', err.message);
      if (!localStorage.getItem(LS_USERS)) lsSet(LS_USERS, []);
      if (!localStorage.getItem(LS_PRODUCTS)) lsSet(LS_PRODUCTS, []);
      if (!localStorage.getItem(LS_BIDS)) lsSet(LS_BIDS, []);
      if (!localStorage.getItem(LS_CATEGORIES)) lsSet(LS_CATEGORIES, ["Clay & Ceramics", "Pottery", "Woodworking", "Organic Cotton", "Vintage"]);
      if (!localStorage.getItem(LS_FAVORITES)) lsSet(LS_FAVORITES, {});
      if (!localStorage.getItem(LS_ORDERS)) lsSet(LS_ORDERS, []);
    } finally {
      // FIXED: Dispatch the critical lifecycle token event so block entry points initialize safely
      document.dispatchEvent(new CustomEvent('store-ready'));
    }
  })();
  
  await window.__storeReady;
}

export function getProducts() {
  const products = lsGet(LS_PRODUCTS) || [];
  const now = Date.now();
  let changed = false;

  products.forEach(product => {
    if (product && product.auctionStatus === "active" && product.endTime && new Date(product.endTime).getTime() <= now) {
      product.auctionStatus = "inactive";
      const allBids = lsGet(LS_BIDS) || [];
      const productBids = allBids.filter(b => String(b.productId) === String(product.id));
      if (productBids.length > 0) {
        const initialPrice = Number(product.startingBid || product.price || 0);
        const validOverBids = productBids.filter(b => Number(b.amount) >= initialPrice);
        const underBids = productBids.filter(b => Number(b.amount) < initialPrice);

        if (validOverBids.length > 0) {
          validOverBids.sort((a, b) => Number(b.amount) - Number(a.amount));
          product.winnerEmail = validOverBids[0].user;
        } else {
          underBids.sort((a, b) => {
            return (initialPrice - Number(a.amount)) - (initialPrice - Number(b.amount));
          });
          product.winnerEmail = underBids[0].user;
        }
      } else {
        product.winnerEmail = null;
      }
      product.paymentStatus = "pending";
      product.paymentCompletedAt = null;
      product.declinedBy = [];
      changed = true;
    }
  });

  if (changed) lsSet(LS_PRODUCTS, products);
  return products;
}

export async function saveProducts(p) {
  lsSet(LS_PRODUCTS, p);
  await syncCloudPayload();
}

export function getBids() { return lsGet(LS_BIDS) || []; }

export async function saveBids(newBidsArray) {
  const currentBidsInStorage = lsGet(LS_BIDS) || [];
  const sanitizedBidsArray = newBidsArray.map(bid => ({
    ...bid,
    amount: parseFloat(bid.amount) || 0
  }));
  
  if (sanitizedBidsArray.length > currentBidsInStorage.length) {
    const freshNewBid = sanitizedBidsArray[sanitizedBidsArray.length - 1];
    const pastProductBids = currentBidsInStorage
      .filter(b => b.productId === freshNewBid.productId)
      .sort((a, b) => Number(b.amount) - Number(a.amount));
      
    if (pastProductBids.length > 0) {
      const pastHighestLeader = pastProductBids[0];
      if (pastHighestLeader.user && freshNewBid.user && pastHighestLeader.user.toLowerCase() !== freshNewBid.user.toLowerCase()) {
        sendOutbidNotification(
          pastHighestLeader.user,
          freshNewBid.productName || "Auction Item",
          freshNewBid.amount,
          freshNewBid.productId
        ).catch(err => console.error("Outbid processing failure:", err));
      }
    }
  }
  
  lsSet(LS_BIDS, sanitizedBidsArray);
  await syncCloudPayload();
}

export function getUsers() { return lsGet(LS_USERS) || []; }
export async function saveUsers(u) { lsSet(LS_USERS, u); await syncCloudPayload(); }
export function getCategories() { return lsGet(LS_CATEGORIES) || []; }

/* FIXED SESSION ENGINES: Forces single absolute key write states across local pipelines */
export function getSession() { 
  return lsGet(TRU_SESSION_KEY); 
}

export function saveSession(user) { 
  lsSet(TRU_SESSION_KEY, user); 
  // Safety mirror fallback for custom dynamic background endpoints
  if (LS_SESSION && LS_SESSION !== TRU_SESSION_KEY) {
    lsSet(LS_SESSION, user);
  }
}

export function clearSession() { 
  localStorage.removeItem(TRU_SESSION_KEY); 
  if (LS_SESSION) localStorage.removeItem(LS_SESSION); 
}

export function getFavorites() { return lsGet(LS_FAVORITES) || {}; }
export async function saveFavorites(f) { lsSet(LS_FAVORITES, f); await syncCloudPayload(); }
export function getOrders() { return lsGet(LS_ORDERS) || []; }
export async function saveOrders(o) { lsSet(LS_ORDERS, o); await syncCloudPayload(); }

/* Safe, un-nested serialization payload assembly for cloud synchronization */
async function syncCloudPayload() {
  const safeParse = (key) => {
    const item = localStorage.getItem(key);
    if (!item) return [];
    try {
      const parsed = JSON.parse(item);
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return [];
    }
  };
  
  const payload = {
    Vaultora_products:   safeParse(LS_PRODUCTS),
    Vaultora_categories: localStorage.getItem(LS_CATEGORIES) ? safeParse(LS_CATEGORIES) : ["Clay & Ceramics", "Pottery", "Woodworking", "Organic Cotton", "Vintage"],
    users:               safeParse(LS_USERS),
    Vaultora_bids:       safeParse(LS_BIDS),
    vaultora_favorites:  localStorage.getItem(LS_FAVORITES) ? safeParse(LS_FAVORITES) : {},
    Vaultora_orders:     safeParse(LS_ORDERS)
  };
  await syncMarketplaceData(payload);
}

export function setupQuickAddButtons(inputId, containerElement, fallbackCurrentValueGetter) {
  if (!containerElement) return;
  const values = [100, 200, 500, 1000];
  const wrap = document.createElement('div');
  wrap.className = 'quick-bid-wrapper';
  
  values.forEach(val => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-quick-add';
    btn.textContent = `+₹${val}`;
    btn.onclick = () => {
      const inp = document.getElementById(inputId);
      if (inp) {
        let baseValue = parseFloat(inp.value);
        if (isNaN(baseValue) || baseValue <= 0) baseValue = parseFloat(fallbackCurrentValueGetter()) || 0;
        inp.value = (baseValue + val).toFixed(2);
        inp.dispatchEvent(new Event('input'));
        inp.dispatchEvent(new Event('change'));
      }
    };
    wrap.appendChild(btn);
  });
  containerElement.insertAdjacentElement('afterend', wrap);
}

window.getProducts = getProducts;
window.saveProducts = saveProducts;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getBids = getBids;
window.saveBids = saveBids;
window.setupQuickAddButtons = setupQuickAddButtons;