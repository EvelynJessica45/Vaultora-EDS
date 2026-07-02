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

function applyAvatar(url) {
  const el   = document.getElementById('largeAvatar');
  const init = document.getElementById('avatarInitial');
  if (!el) return;
  if (url) {
    el.style.backgroundImage = `url('${encodeURI(url)}')`;
    if (init) init.style.display = 'none';
  } else {
    el.style.backgroundImage = 'none';
    if (init) init.style.display = '';
  }
}

export default function decorate(block) {
  // Guard Execution Checks
  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session && window.location.hostname !== 'localhost') {
    window.location.replace('register');
    return;
  }
  
  // Clean dynamic init
  block.innerHTML = '';
  
  // Scaffolding Layout Framework Panels
  const leftPanel = document.createElement('div');
  leftPanel.className = 'profile-identity-panel';
  
  const rightPanel = document.createElement('div');
  rightPanel.className = 'profile-ledger-panel';
  
  block.appendChild(leftPanel);
  block.appendChild(rightPanel);

  // Generate Profile Toast Element Container Box
  if (!document.getElementById('toast')) {
    const toastNode = document.createElement('div');
    toastNode.id = 'toast';
    toastNode.className = 'profile-toast';
    document.body.appendChild(toastNode);
  }

  // Draw Left Profile Identity Card Frame
  leftPanel.innerHTML = `
    <div class="avatar-circle-wrapper">
      <div id="largeAvatar"></div>
      <div id="avatarInitial">-</div>
    </div>
    <div class="avatar-control-row">
      <button type="button" class="btn-avatar-action" id="btnEditAvatar">Update</button>
      <button type="button" class="btn-avatar-action" id="btnRemoveAvatar">Remove</button>
    </div>
    
    <div id="uploadFlowContainer">
      <div class="avatar-dropzone" id="avatarDropZone">
        Drop file or click to choose local image asset.
        <div id="avatarFileLabel" style="font-size:10px; color:#b9925a; margin-top:6px; font-weight:600;">No file staged</div>
      </div>
      <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" />
      <input type="text" id="avatarUrlInput" class="url-input-field" placeholder="Or enter remote absolute asset URL..." />
      <div class="flow-action-row">
        <button type="button" class="btn-flow-control" id="btnCancelAvatarFlow">Cancel</button>
        <button type="button" class="btn-flow-control" id="btnSaveAvatar" disabled>Commit Photo</button>
      </div>
    </div>

    <h2 id="uName">—</h2>
    <span class="user-email-label" id="uEmail">—</span>
    <span class="verification-badge" id="uVerified">—</span>
  `;

  // Draw Right Performance Dashboard Tracks Framework
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

  function initUser() {
    const activeSession = typeof getSession === 'function' ? getSession() : { name: "Local Dev Test", email: "dev@vaultora.local" };
    const email = activeSession?.email;
    const users = typeof getUsers === 'function' ? getUsers() : [];
    const u = users.find(x => x.email?.toLowerCase() === String(email || '').toLowerCase());

    const name = u?.name ?? activeSession?.name ?? 'Vaultora Member';
    const verified = u?.verified ?? true;
    const avatarUrl = u?.avatarUrl || u?.imageProfile || '';

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = safeText(val); };
    set('uName', name);
    set('uEmail', email);
    set('uVerified', verified ? '✓ Certified Member' : 'Unverified Profile');

    const initEl = document.getElementById('avatarInitial');
    if (initEl && name) initEl.textContent = name.charAt(0).toUpperCase();

    applyAvatar(avatarUrl);
    return { u, email, name };
  }

  function renderBids() {
    const container = document.getElementById('profileBids');
    const btnMore   = document.getElementById('btnShowMoreBids');
    const btnLess   = document.getElementById('btnShowLessBids');
    if (!container) return;

    const source   = globalBidsArray.length > 0 ? globalBidsArray : DEMO_BIDS;
    const slice    = source.slice(0, bidsShownCount);
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const productMap = new Map(products.map(p => [String(p.id), p]));

    container.innerHTML = slice.map(bid => {
      const p      = productMap.get(String(bid.productId));
      const img    = bid._img || p?.images?.[0] || p?.img || p?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300';
      const title  = bid.productName || p?.title || 'Asset Class item';
      const seller = bid._seller || p?.seller || p?.sellerEmail || 'Vaultora Partner';
      const price  = formatPrice(bid.amount);
      const date   = formatDate(bid.timestamp);

      return `
        <div class="auction-card">
          <img src="${img}" class="auction-card-img" alt="${title}" loading="lazy"/>
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
    if (btnMore) btnMore.style.display = bidsShownCount < total ? 'inline-block' : 'none';
    if (btnLess) btnLess.style.display = bidsShownCount > 4     ? 'inline-block' : 'none';
  }

  function closeUploadFlow() {
    const flowContainer = document.getElementById('uploadFlowContainer');
    if (flowContainer) flowContainer.classList.remove('active');
    selectedAvatarFile = null;
    const fileInput = document.getElementById('avatarFileInput');
    if (fileInput) fileInput.value = '';
    const urlInput = document.getElementById('avatarUrlInput');
    if (urlInput) urlInput.value = '';
    document.getElementById('avatarFileLabel').textContent = 'No file staged';
    document.getElementById('btnSaveAvatar').disabled = true;
  }

  function openUploadFlow() {
    const flowContainer = document.getElementById('uploadFlowContainer');
    if (flowContainer) flowContainer.classList.add('active');
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files[0];
    const labelEl = document.getElementById('avatarFileLabel');
    const uploadBtn = document.getElementById('btnSaveAvatar');

    if (!file) {
      selectedAvatarFile = null;
      labelEl.textContent = 'No file staged';
      uploadBtn.disabled = !document.getElementById('avatarUrlInput').value.trim();
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Staged file must resolve to a valid binary image configuration.', false);
      return;
    }

    selectedAvatarFile = file;
    labelEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    uploadBtn.disabled = false;
  }

  async function commitProfilePhotoChange() {
    const uploadBtn = document.getElementById('btnSaveAvatar');
    const urlInput = document.getElementById('avatarUrlInput');
    const enteredUrl = urlInput?.value?.trim();

    const activeSession = typeof getSession === 'function' ? getSession() : { email: "dev@vaultora.local" };
    const email = activeSession?.email;
    if (!email) { showToast('Active profile auth tokens not found.', false); return; }

    const users = typeof getUsers === 'function' ? getUsers() : [];
    const idx = users.findIndex(x => x.email?.toLowerCase() === String(email).toLowerCase());
    
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Syncing...'; }

    try {
      let targetImageUrl = "";

      if (selectedAvatarFile) {
        if (typeof AWS !== 'undefined' && AWS.config?.credentials) {
          await AWS.config.credentials.getPromise();
        }
        const ext = selectedAvatarFile.name.split('.').pop();
        const s3Key = `asset_data/user_profile_${Date.now()}.${ext}`;
        
        const uploadParams = {
          Bucket: typeof BUCKET_NAME !== 'undefined' ? BUCKET_NAME : 'vaultora',
          Key: s3Key,
          Body: selectedAvatarFile,
          ContentType: selectedAvatarFile.type
        };

        const s3Instance = new AWS.S3();
        const uploadResult = await s3Instance.upload(uploadParams).promise();
        targetImageUrl = uploadResult.Location;
      } else if (enteredUrl) {
        targetImageUrl = enteredUrl;
      } else {
        showToast('Supply an image file asset object map parameter.', false);
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = 'Commit Photo'; }
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
      if (uploadBtn) { uploadBtn.textContent = 'Commit Photo'; }
    }
  }

  async function removeProfilePhoto() {
    const activeSession = typeof getSession === 'function' ? getSession() : { email: "dev@vaultora.local" };
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

  // Bind Listeners
  document.getElementById('btnEditAvatar')?.addEventListener('click', openUploadFlow);
  document.getElementById('btnRemoveAvatar')?.addEventListener('click', removeProfilePhoto);
  document.getElementById('btnCancelAvatarFlow')?.addEventListener('click', closeUploadFlow);
  
  const dropZone = document.getElementById('avatarDropZone');
  const fileInput = document.getElementById('avatarFileInput');
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
  }

  fileInput?.addEventListener('change', handleAvatarFileChange);
  
  const urlInput = document.getElementById('avatarUrlInput');
  urlInput?.addEventListener('input', () => {
    const saveBtn = document.getElementById('btnSaveAvatar');
    if (saveBtn) saveBtn.disabled = !(selectedAvatarFile || urlInput.value.trim());
  });

  document.getElementById('btnSaveAvatar')?.addEventListener('click', commitProfilePhotoChange);
  document.getElementById('btnShowMoreBids')?.addEventListener('click', () => { bidsShownCount += BIDS_STEP; renderBids(); });
  document.getElementById('btnShowLessBids')?.addEventListener('click', () => { bidsShownCount = Math.max(4, bidsShownCount - BIDS_STEP); renderBids(); });

  // Load Operational Framework Computations
  const userSetup = initUser();
  const email = userSetup.email;
  const name = userSetup.name;

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

  const setNum = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
  setNum('statListings',    myListings.length);
  setNum('statWinningBids', winningBids.length);
  setNum('statBids',        globalBidsArray.length);

  // Render initialization content view maps
  renderBids();
}