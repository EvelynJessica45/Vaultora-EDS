/* =========================================================================
   Vaultora — profile.js (Premium Lifecycle Suite)
   ========================================================================= */

import { getProducts, getBids, getSession, getUsers, saveSession, saveUsers } from '../../scripts/storage.js';

let globalBidsArray  = [];
let bidsShownCount   = 4;
const BIDS_STEP      = 4;
let selectedAvatarFile = null;

const DEMO_BIDS = [
  { productId:'d1', productName:'Hand-woven Basket',     amount:18000, timestamp: Date.now() - 86400000*1, _img:'https://images.unsplash.com/photo-1563804447971-6e113ab80713?w=300', _seller:'EcoWeave Co.' },
  { productId:'d2', productName:'Upcycled Jade Pendant', amount:15000, timestamp: Date.now() - 86400000*2, _img:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300', _seller:'GreenGem Studio' },
  { productId:'d3', productName:'Natural Diamond Ring',  amount:18000, timestamp: Date.now() - 86400000*3, _img:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300', _seller:'Earth Jewels' },
  { productId:'d4', productName:'Reclaimed Wood Bowl',   amount:4500,  timestamp: Date.now() - 86400000*4, _img:'https://images.unsplash.com/photo-1582736317408-b9dd8c3c6a1e?w=300', _seller:'Artisan Woods' }
];

function safeText(v) { return (!v) ? '—' : String(v); }

function showToast(msg, ok = true) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = ok ? '#1a3020' : '#a34c37';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function formatDate(ts) {
  try { return ts ? new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }
  catch { return '—'; }
}

function formatPrice(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function getOptimizedImageUrl(url, width = 300) {
  if (!url) return '';
  if (url.includes('localhost') || url.includes('hlx.page') || url.includes('hlx.live')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&format=webply&optimize=medium`;
  }
  if (url.includes('images.unsplash.com')) {
    return url.split('?')[0] + `?w=${width}&auto=format&fit=crop&q=75`;
  }
  return url;
}

function applyAvatar(url) {
  const imgElement = document.getElementById('largeAvatar');
  const initElement = document.getElementById('avatarInitial');
  if (!imgElement) return;
  
  if (url) {
    imgElement.src = getOptimizedImageUrl(encodeURI(url), 120);
    imgElement.style.display = 'block';
    if (initElement) initElement.style.display = 'none';
  } else {
    imgElement.src = '';
    imgElement.style.display = 'none';
    if (initElement) initElement.style.display = 'block';
  }
}

/* Fix SEO 61 Defect: Inject Document Metadata programmatically via Block Lifecycle Entry */
function injectRequiredMetadata() {
  if (!document.querySelector('meta[name="description"]')) {
    const descMeta = document.createElement('meta');
    descMeta.name = "description";
    descMeta.content = "Vaultora premium user workspace ledger panel overviewing collection portfolios and current active inventory assets.";
    document.head.appendChild(descMeta);
  }
}

export default function decorate(block) {
  // Execute metadata injection instantaneously
  injectRequiredMetadata();

  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session && window.location.hostname !== 'localhost') {
    window.location.replace('register');
    return;
  }
  
  block.innerHTML = '';
  
  const leftPanel = document.createElement('div');
  leftPanel.className = 'profile-identity-panel';
  
  const rightPanel = document.createElement('div');
  rightPanel.className = 'profile-ledger-panel';
  
  block.appendChild(leftPanel);
  block.appendChild(rightPanel);

  if (!document.getElementById('toast')) {
    const toastNode = document.createElement('div');
    toastNode.id = 'toast';
    toastNode.className = 'profile-toast';
    document.body.appendChild(toastNode);
  }

  const activeSession = typeof getSession === 'function' ? getSession() : { name: "Local Dev Test", email: "dev@vaultora.local" };
  const usersList = typeof getUsers === 'function' ? getUsers() : [];
  const foundUser = usersList.find(x => x.email?.toLowerCase() === String(activeSession?.email || '').toLowerCase());
  const initialAvatarUrl = foundUser?.avatarUrl || foundUser?.imageProfile || '';
  const initialOptimizedAvatar = initialAvatarUrl ? getOptimizedImageUrl(initialAvatarUrl, 120) : '';

  leftPanel.innerHTML = `
    <div class="avatar-circle-wrapper">
      <img id="largeAvatar" alt="Profile Display Avatar Image Asset" width="120" height="120" 
        ${initialOptimizedAvatar ? `src="${initialOptimizedAvatar}" style="display:block;" fetchpriority="high"` : 'style="display:none;" decoding="async"'}>
      <div id="avatarInitial" aria-hidden="true" ${initialOptimizedAvatar ? 'style="display:none;"' : ''}>-</div>
    </div>
    <div class="avatar-control-row">
      <button type="button" class="btn-avatar-action" id="btnEditAvatar" aria-haspopup="dialog" aria-expanded="false">Update</button>
      <button type="button" class="btn-avatar-action" id="btnRemoveAvatar">Remove</button>
    </div>
    
    <div id="uploadFlowContainer" role="dialog" aria-label="Avatar Configuration Dialog">
      <div class="avatar-dropzone" id="avatarDropZone" tabindex="0" role="button" aria-describedby="avatarFileLabel">
        Drop file or click to choose local image asset.
        <div id="avatarFileLabel" style="font-size:10px; color:#b9925a; margin-top:6px; font-weight:600;">No file staged</div>
      </div>
      <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" aria-hidden="true" />
      <input type="text" id="avatarUrlInput" class="url-input-field" placeholder="Or enter remote absolute asset URL..." aria-label="Remote Image Asset Absolute URL Pointer" />
      <div class="flow-action-row">
        <button type="button" class="btn-flow-control" id="btnCancelAvatarFlow">Cancel</button>
        <button type="button" class="btn-flow-control" id="btnSaveAvatar" disabled>Commit Photo</button>
      </div>
    </div>

    <h2 id="uName">—</h2>
    <span class="user-email-label" id="uEmail">—</span>
    <span class="verification-badge" id="uVerified">—</span>
  `;

  rightPanel.innerHTML = `
    <div class="stats-ticker-tape">
      <div class="stat-ticker-card"><h3 id="statListings">0</h3><p>Active Inventory</p></div>
      <div class="stat-ticker-card"><h3 id="statWinningBids">0</h3><p>Ceilings Won</p></div>
      <div class="stat-ticker-card"><h3 id="statBids">0</h3><p>Offers Logged</p></div>
    </div>
    
    <div class="dashboard-section-card">
      <div class="card-header-row">
        <h2>Curated Bidding Activity Track</h2>
      </div>
      <div class="auction-grid" id="profileBids"></div>
      <div class="pagination-wrap">
        <button type="button" class="btn-pagination" id="btnShowLessBids" style="display:none;">Show Less ↑</button>
        <button type="button" class="btn-pagination" id="btnShowMoreBids" style="display:none;">Show More ↓</button>
      </div>
    </div>
  `;

  const nodes = {
    uName: document.getElementById('uName'),
    uEmail: document.getElementById('uEmail'),
    uVerified: document.getElementById('uVerified'),
    avatarInitial: document.getElementById('avatarInitial'),
    profileBids: document.getElementById('profileBids'),
    btnShowMoreBids: document.getElementById('btnShowMoreBids'),
    btnShowLessBids: document.getElementById('btnShowLessBids'),
    uploadFlowContainer: document.getElementById('uploadFlowContainer'),
    avatarFileInput: document.getElementById('avatarFileInput'),
    avatarUrlInput: document.getElementById('avatarUrlInput'),
    avatarFileLabel: document.getElementById('avatarFileLabel'),
    btnSaveAvatar: document.getElementById('btnSaveAvatar'),
    btnEditAvatar: document.getElementById('btnEditAvatar'),
    statListings: document.getElementById('statListings'),
    statWinningBids: document.getElementById('statWinningBids'),
    statBids: document.getElementById('statBids')
  };

  function initUser() {
    const name = foundUser?.name ?? activeSession?.name ?? 'Vaultora Member';
    const verified = foundUser?.verified ?? true;

    if (nodes.uName) nodes.uName.textContent = safeText(name);
    if (nodes.uEmail) nodes.uEmail.textContent = safeText(activeSession?.email);
    if (nodes.uVerified) nodes.uVerified.textContent = verified ? '✓ Certified Member' : 'Unverified Profile';
    if (nodes.avatarInitial && name) nodes.avatarInitial.textContent = name.charAt(0).toUpperCase();

    return { email: activeSession?.email, name };
  }

  function renderBids() {
    if (!nodes.profileBids) return;

    const source   = globalBidsArray.length > 0 ? globalBidsArray : DEMO_BIDS;
    const slice    = source.slice(0, bidsShownCount);
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const productMap = new Map(products.map(p => [String(p.id), p]));

    nodes.profileBids.innerHTML = slice.map(bid => {
      const p      = productMap.get(String(bid.productId));
      const rawImg = bid._img || p?.images?.[0] || p?.img || p?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300';
      const img    = getOptimizedImageUrl(rawImg, 105); // Downscale structural thumbnails exactly to match 105px display size footprint perfectly
      const title  = bid.productName || p?.title || 'Asset Class item';
      const seller = bid._seller || p?.seller || p?.sellerEmail || 'Vaultora Partner';
      const price  = formatPrice(bid.amount);
      const date   = formatDate(bid.timestamp);

      return `
        <div class="auction-card">
          <img src="${img}" class="auction-card-img" alt="${title}" width="70" height="70" decoding="async" loading="lazy"/>
          <div class="auction-card-body">
            <div class="auction-card-title">${title}</div>
            <div class="auction-card-seller">${seller}</div>
            <div class="auction-card-meta">
              <span class="auction-card-price">${price}</span>
              <span class="auction-card-time">${date}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    const total = source.length;
    if (nodes.btnShowMoreBids) nodes.btnShowMoreBids.style.display = bidsShownCount < total ? 'inline-block' : 'none';
    if (nodes.btnShowLessBids) nodes.btnShowLessBids.style.display = bidsShownCount > 4     ? 'inline-block' : 'none';
  }

  function closeUploadFlow() {
    if (nodes.uploadFlowContainer) nodes.uploadFlowContainer.classList.remove('active');
    if (nodes.btnEditAvatar) nodes.btnEditAvatar.setAttribute('aria-expanded', 'false');
    selectedAvatarFile = null;
    if (nodes.avatarFileInput) nodes.avatarFileInput.value = '';
    if (nodes.avatarUrlInput) nodes.avatarUrlInput.value = '';
    if (nodes.avatarFileLabel) nodes.avatarFileLabel.textContent = 'No file staged';
    if (nodes.btnSaveAvatar) nodes.btnSaveAvatar.disabled = true;
  }

  function openUploadFlow() {
    if (nodes.uploadFlowContainer) nodes.uploadFlowContainer.classList.add('active');
    if (nodes.btnEditAvatar) nodes.btnEditAvatar.setAttribute('aria-expanded', 'true');
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files[0];
    if (!file) {
      selectedAvatarFile = null;
      if (nodes.avatarFileLabel) nodes.avatarFileLabel.textContent = 'No file staged';
      if (nodes.btnSaveAvatar) nodes.btnSaveAvatar.disabled = !nodes.avatarUrlInput?.value.trim();
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Staged file must resolve to a valid binary image configuration.', false);
      return;
    }
    selectedAvatarFile = file;
    if (nodes.avatarFileLabel) {
      nodes.avatarFileLabel.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
    if (nodes.btnSaveAvatar) nodes.btnSaveAvatar.disabled = false;
  }

  async function downscaleAndCompressBlob(file, maxDimension = 240) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
        } else {
          if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.82);
      };
    });
  }

  async function commitProfilePhotoChange() {
    const enteredUrl = nodes.avatarUrlInput?.value?.trim();
    const email = activeSession?.email;
    if (!email) { showToast('Active profile auth tokens not found.', false); return; }

    const users = typeof getUsers === 'function' ? getUsers() : [];
    const idx = users.findIndex(x => x.email?.toLowerCase() === String(email).toLowerCase());
    
    if (nodes.btnSaveAvatar) { 
      nodes.btnSaveAvatar.disabled = true; 
      nodes.btnSaveAvatar.textContent = 'Syncing...'; 
    }

    try {
      let targetImageUrl = "";
      if (selectedAvatarFile) {
        const processedBlob = await downscaleAndCompressBlob(selectedAvatarFile, 240);
        
        if (typeof AWS !== 'undefined' && AWS.config?.credentials) {
          await AWS.config.credentials.getPromise();
        }
        const s3Key = `asset_data/user_profile_${Date.now()}.webp`;
        
        const uploadParams = {
          Bucket: typeof BUCKET_NAME !== 'undefined' ? BUCKET_NAME : 'vaultora',
          Key: s3Key,
          Body: processedBlob,
          ContentType: 'image/webp'
        };

        const s3Instance = new AWS.S3();
        const uploadResult = await s3Instance.upload(uploadParams).promise();
        targetImageUrl = uploadResult.Location;
      } else if (enteredUrl) {
        targetImageUrl = enteredUrl;
      } else {
        showToast('Supply an image file asset object map parameter.', false);
        if (nodes.btnSaveAvatar) { 
          nodes.btnSaveAvatar.disabled = false; 
          nodes.btnSaveAvatar.textContent = 'Commit Photo'; 
        }
        return;
      }

      if (idx !== -1) {
        users[idx].avatarUrl = targetImageUrl;
        users[idx].imageProfile = targetImageUrl;
      }
      if (activeSession) {
        activeSession.avatarUrl = targetImageUrl;
        activeSession.imageProfile = targetImageUrl;
      }

      if (typeof saveSession === 'function') saveSession(activeSession);
      if (typeof saveUsers === 'function') await saveUsers(users);

      applyAvatar(targetImageUrl);
      closeUploadFlow();
      showToast('Profile visual maps committed successfully!', true);
    } catch (err) {
      console.error(err);
      showToast('Network file sync timeout fallback triggered.', false);
    } finally {
      if (nodes.btnSaveAvatar) { nodes.btnSaveAvatar.textContent = 'Commit Photo'; }
    }
  }

  async function removeProfilePhoto() {
    const email = activeSession?.email;
    const users = typeof getUsers === 'function' ? getUsers() : [];
    const idx = users.findIndex(x => x.email?.toLowerCase() === String(email || '').toLowerCase());

    if (idx !== -1) {
      users[idx].avatarUrl = "";
      users[idx].imageProfile = "";
    }
    if (activeSession) {
      activeSession.avatarUrl = "";
      activeSession.imageProfile = "";
    }
    if (typeof saveSession === 'function') saveSession(activeSession);
    if (typeof saveUsers === 'function') await saveUsers(users);
    
    applyAvatar("");
    showToast('Asset profile maps wiped cleanly.', true);
    closeUploadFlow();
  }

  nodes.btnEditAvatar?.addEventListener('click', openUploadFlow);
  document.getElementById('btnRemoveAvatar')?.addEventListener('click', removeProfilePhoto);
  document.getElementById('btnCancelAvatarFlow')?.addEventListener('click', closeUploadFlow);
  
  const dropZone = document.getElementById('avatarDropZone');
  if (dropZone && nodes.avatarFileInput) {
    dropZone.addEventListener('click', () => nodes.avatarFileInput.click());
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nodes.avatarFileInput.click();
      }
    });
  }

  nodes.avatarFileInput?.addEventListener('change', handleAvatarFileChange);
  nodes.avatarUrlInput?.addEventListener('input', () => {
    if (nodes.btnSaveAvatar) nodes.btnSaveAvatar.disabled = !(selectedAvatarFile || nodes.avatarUrlInput.value.trim());
  });

  nodes.btnSaveAvatar?.addEventListener('click', commitProfilePhotoChange);
  nodes.btnShowMoreBids?.addEventListener('click', () => { bidsShownCount += BIDS_STEP; renderBids(); });
  nodes.btnShowLessBids?.addEventListener('click', () => { bidsShownCount = Math.max(4, bidsShownCount - BIDS_STEP); renderBids(); });

  const userSetup = initUser();
  const email = userSetup.email;
  const name = userSetup.name;

  // Fix Layout Recalculation Thrashing: Encapsulate all database lookups within requestAnimationFrame blocks
  window.requestAnimationFrame(() => {
    const allProducts = typeof getProducts === 'function' ? getProducts() : [];
    const allBids     = typeof getBids     === 'function' ? getBids()     : [];

    const myBids = allBids.filter(b => b?.user && email && b.user.toLowerCase() === email.toLowerCase());
    const uniqueBidMap = new Map();
    myBids.forEach(b => {
      const existing = uniqueBidMap.get(b.productId);
      if (!existing || Number(b.amount) > Number(existing.amount)) {
        uniqueBidMap.set(b.productId, b);
      }
    });

    globalBidsArray = [...uniqueBidMap.values()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const myListings = allProducts.filter(p => {
      if (p?.sellerEmail && email) return p.sellerEmail.toLowerCase() === email.toLowerCase();
      if (p?.seller && name) return p.seller === name;
      return false;
    });

    const winningBids = allProducts.filter(p => {
      const productBids = allBids.filter(b => String(b.productId) === String(p.id));
      if (!productBids.length) return false;
      const topBid = productBids.reduce((max, b) => (b.amount > max.amount ? b : max), productBids[0]);
      return topBid.user && email && topBid.user.toLowerCase() === email.toLowerCase();
    });

    if (nodes.statListings) nodes.statListings.textContent = String(myListings.length);
    if (nodes.statWinningBids) nodes.statWinningBids.textContent = String(winningBids.length);
    if (nodes.statBids) nodes.statBids.textContent = String(globalBidsArray.length);

    // Yield control over to micro-task render queues seamlessly
    setTimeout(() => {
      renderBids();
    }, 0);
  });
}