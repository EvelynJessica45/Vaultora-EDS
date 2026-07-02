/* =========================================================================
   Vaultora — checkout.js (Streamlined Content Mapping Suite)
   ========================================================================= */

// REMOVED syncToCloud from the direct named imports list to prevent compilation SyntaxErrors
import { getProducts, getSession, saveProducts, saveOrders, getOrders, getBids, saveBids } from '../../scripts/storage.js';

let product      = null;
let winningBid   = 0;
let shippingCost = 0;
let activeMethod = 'card';

const SHIPPING_COSTS = {
  standard: 0,
  express:  120,
  same_day: 280
};

export default function decorate(block) {
  // Extract authored key-value configurations out from the table cells
  const rows = [...block.children];
  const config = {};
  
  rows.forEach(row => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = cols[1].textContent.trim();
      config[key] = val;
    }
  });

  // Fallback defaults if authoring entries are left empty
  const text = {
    formTitle: config.formtitle || 'Delivery Directives',
    logisticsTitle: config.logisticstitle || 'Logistics Tier Selection',
    paymentTitle: config.paymenttitle || 'Payment Settlement Engine',
    summaryTitle: config.summarytitle || 'Order Escrow Summary',
    btnText: config.buttontext || 'Authorize Safe Settlement',
    phName: config.placeholdername || 'Full Name',
    phAddr: config.placeholderaddress || 'Street Address'
  };

  // Clear authoring table elements from the DOM view safely
  block.innerHTML = '';

  // Generate responsive grid core panel nodes
  const formPanel = document.createElement('div');
  formPanel.className = 'checkout-form-panel';
  
  const summaryPanel = document.createElement('div');
  summaryPanel.className = 'checkout-summary-panel';

  block.appendChild(formPanel);
  block.appendChild(summaryPanel);

  // Generate overlay toast message nodes globally if absent
  if (!document.getElementById('successOverlay')) {
    const overlayNode = document.createElement('div');
    overlayNode.id = 'successOverlay';
    overlayNode.className = 'checkout-overlay';
    overlayNode.innerHTML = `
      <div class="success-modal-card">
        <div class="success-ring-icon">✓</div>
        <h2>Settlement Authorized</h2>
        <p>Your transaction clear tokens matched storage vectors successfully.</p>
        <div class="receipt-data-payload" id="successDetail"></div>
        <div class="countdown-redirect-notice">Redirecting to portfolio panel in <span id="countdownNum" style="color:#b9925a; font-weight:700;">5</span>s...</div>
      </div>
    `;
    document.body.appendChild(overlayNode);
  }

  // Inject structural input fields using data from the authoring table
  formPanel.innerHTML = `
    <div class="form-card-block">
      <h2>${text.formTitle}</h2>
      <div class="form-fields-grid">
        <div class="field-group col-6"><label>Recipient Full Name</label><input type="text" id="fullName" class="input-ctrl" placeholder="${text.phName}" /></div>
        <div class="field-group col-6"><label>Street Address</label><input type="text" id="address" class="input-ctrl" placeholder="${text.phAddr}" /></div>
        <div class="field-group col-3"><label>City / Hub</label><input type="text" id="city" class="input-ctrl" /></div>
        <div class="field-group col-3"><label>State / Region</label><input type="text" id="state" class="input-ctrl" /></div>
        <div class="field-group col-3"><label>Postal PIN Code</label><input type="text" id="pin" class="input-ctrl" maxlength="6" /></div>
        <div class="field-group col-3"><label>Phone Contact</label><input type="tel" id="phone" class="input-ctrl" /></div>
        <div class="field-group col-6"><label>Notification Email</label><input type="email" id="email" class="input-ctrl" /></div>
      </div>
    </div>

    <div class="form-card-block">
      <h2>${text.logisticsTitle}</h2>
      <label class="option-row-label">
        <span class="radio-input-wrapper"><input type="radio" name="shipping" value="standard" checked /> Standard Courier (Carbon Offset)</span>
        <span class="option-cost">Free</span>
      </label>
      <label class="option-row-label">
        <span class="radio-input-wrapper"><input type="radio" name="shipping" value="express" /> Premium Express (Carbon Neutral)</span>
        <span class="option-cost">+ ₹120</span>
      </label>
      <label class="option-row-label">
        <span class="radio-input-wrapper"><input type="radio" name="shipping" value="same_day" /> Priority Vault Link (Zero Emission)</span>
        <span class="option-cost">+ ₹280</span>
      </label>
      <label class="option-row-label" style="margin-top:16px; background:#faf8f5;">
        <span class="radio-input-wrapper" style="font-weight:500;"><input type="checkbox" id="ecoPackaging" checked /> Request Sustainable Crate Protection</span>
        <span class="option-cost" style="font-size:11px; color:#b9925a;">Included</span>
      </label>
    </div>

    <div class="form-card-block">
      <h2>${text.paymentTitle}</h2>
      <div class="payment-tabs-menu">
        <button type="button" class="method-tab active" data-method="card">Credit Card</button>
        <button type="button" class="method-tab" data-method="upi">UPI Network</button>
        <button type="button" class="method-tab" data-method="wallet">Digital Wallet</button>
      </div>

      <div class="method-panel" id="panel-card">
        <div class="bank-card-preview">
          <div class="cc-chip-logo"><div class="chip-token"></div><span class="vaultora-cc-seal">Vaultora Elite</span></div>
          <div id="ccDisplayNum">•••• •••• •••• ••••</div>
          <div class="cc-holder-exp-row"><div><span style="font-size:8px; opacity:0.6; display:block;">Card Holder</span><span id="ccDisplayName">YOUR NAME</span></div><div><span style="font-size:8px; opacity:0.6; display:block;">Valid Thru</span><span id="ccDisplayExp">MM / YY</span></div></div>
        </div>
        <div class="form-fields-grid">
          <div class="field-group col-6"><label>Card Number</label><input type="text" id="cardNumber" class="input-ctrl" placeholder="0000 0000 0000 0000" maxlength="19" /></div>
          <div class="field-group col-6"><label>Name on Card</label><input type="text" id="cardName" class="input-ctrl" placeholder="EXACTLY AS PRINTED" autocomplete="off" /></div>
          <div class="field-group col-3"><label>Expiration String</label><input type="text" id="cardExpiry" class="input-ctrl" placeholder="MM / YY" maxlength="7" /></div>
          <div class="field-group col-3"><label>Security CVV</label><input type="password" id="cardCvv" class="input-ctrl" placeholder="•••" maxlength="4" /></div>
        </div>
      </div>

      <div class="method-panel hidden" id="panel-upi">
        <div class="upi-logos-matrix">
          <div class="upi-option selected" data-provider="gpay">Google Pay</div>
          <div class="upi-option" data-provider="phonepe">PhonePe</div>
          <div class="upi-option" data-provider="paytm">Paytm VPA</div>
        </div>
        <div class="field-group"><label>Virtual Payment Address (VPA)</label><input type="text" id="upiId" class="input-ctrl" placeholder="username@upi" /></div>
      </div>

      <div class="method-panel hidden" id="panel-wallet">
        <div class="upi-logos-matrix" style="grid-template-columns: repeat(2, 1fr);">
          <div class="upi-option" data-wallet="hdfc">PayZapp Premium</div>
          <div class="upi-option" data-wallet="cred">CRED Cash Balance</div>
        </div>
      </div>
    </div>
  `;

  // Inject dynamic receipt frame elements into the Right Sidebar
  summaryPanel.innerHTML = `
    <div class="form-card-block">
      <h2>${text.summaryTitle}</h2>
      <div class="order-summary-box">
        <div class="summary-img-frame"><img id="summaryImg" src="" alt="Escrow Lot Asset" /></div>
        <div class="summary-product-details">
          <h3 id="summaryProductName">Loading Asset Verification...</h3>
          <span id="summaryCategory">—</span>
          <p id="summarySeller">—</p>
        </div>
      </div>
      
      <div class="pricing-breakdown-ledger">
        <div class="ledger-row"><span>Acquisition Value</span><span id="summaryBidAmount">₹0</span></div>
        <div class="ledger-row" id="shippingLine"><span>Shipping (Carbon Offset)</span><span id="summaryShipping">Free</span></div>
        <div class="ledger-row"><span>Logistical Eco Offset Fee</span><span>+ ₹10</span></div>
        <div class="ledger-row grand-total"><span>Total Settlement</span><span id="summaryTotal">₹0</span></div>
      </div>

      <button type="button" class="btn-checkout-submit" id="placeOrderBtn">${text.btnText}</button>
    </div>
  `;

  /* ── EVENT LISTENER & PROCESSING LOGIC BINDINGS ── */

  function loadOrderContext() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const bidAmt = parseFloat(params.get('bid')) || 0;
    winningBid = bidAmt;

    const products = typeof getProducts === 'function' ? getProducts() : [];
    product = products.find(p => String(p.id) === String(productId)) || null;

    if (!product) {
      document.getElementById('summaryProductName').textContent = 'Unknown Vault Item';
      updateTotals();
      return;
    }

    const imgSrc = Array.isArray(product.images) ? product.images[0] : (product.image || product.imageUrl || '');
    document.getElementById('summaryImg').src = imgSrc;
    document.getElementById('summaryProductName').textContent = product.title || '—';
    document.getElementById('summaryCategory').textContent = product.category || '—';
    document.getElementById('summarySeller').textContent = `Seller: ${product.seller || 'Vaultora Partner'}`;
    document.getElementById('summaryBidAmount').textContent = `₹${winningBid.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    updateTotals();
  }

  function prefillUserDetails() {
    const session = typeof getSession === 'function' ? getSession() : {};
    if (session?.email) document.getElementById('email').value = session.email;
    if (session?.name) document.getElementById('fullName').value = session.name;
  }

  function updateTotals() {
    const total = winningBid + shippingCost + 10;
    document.getElementById('summaryShipping').textContent = shippingCost === 0 ? 'Free' : `+ ₹${shippingCost.toLocaleString('en-IN')}`;
    document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  }

  function validateForm() {
    const required = ['fullName', 'address', 'city', 'pin', 'state', 'phone', 'email'];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        if (el) el.focus();
        return { ok: false, msg: `Please fulfill the validation field: ${id}.` };
      }
    }

    if (activeMethod === 'card') {
      const cardNum = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '');
      const cardName = (document.getElementById('cardName')?.value || '').trim();
      const cardExp = (document.getElementById('cardExpiry')?.value || '').trim();
      const cardCvv = (document.getElementById('cardCvv')?.value || '').trim();

      if (cardNum.length < 16) return { ok: false, msg: 'Please provide a valid 16-digit card number.' };
      if (!cardName) return { ok: false, msg: 'Cardholder name is required.' };
      if (cardExp.length < 5) return { ok: false, msg: 'Please complete the expiry date (MM / YY).' };
      
      const expParts = cardExp.split('/');
      const expMonth = parseInt(expParts[0]?.trim(), 10);
      const expYear = parseInt('20' + expParts[1]?.trim(), 10);

      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) return { ok: false, msg: 'Invalid expiration month.' };

      if (expYear < 2026 || (expYear === 2026 && expMonth < 7)) {
        return { ok: false, msg: 'Transaction Rejected: Staged credit card has expired.' };
      }
      if (!/^\d{3,4}$/.test(cardCvv)) return { ok: false, msg: 'CVV security code must resolve to 3 or 4 integers.' };
    }

    return { ok: true };
  }

  async function executeOrderPlacement() {
    const check = validateForm();
    if (!check.ok) {
      showToast(check.msg, 'error');
      return;
    }

    const btn = document.getElementById('placeOrderBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Processing Secure Settlement...';
    }

    setTimeout(async () => {
      await commitOrderToStorage();
      triggerSuccessPopupAnimation();
      if (btn) btn.disabled = false;
    }, 1500);
  }

  async function commitOrderToStorage() {
    const activeSession = typeof getSession === 'function' ? getSession() : {};
    const shippingEl = document.querySelector('input[name="shipping"]:checked');
    const ecoEl      = document.getElementById('ecoPackaging');

    const order = {
      id: `order_${Date.now()}`,
      productId: product ? String(product.id) : null,
      productTitle: product ? product.title : 'Unknown Asset',
      buyerEmail: activeSession.email || document.getElementById('email').value,
      buyerName: document.getElementById('fullName').value,
      shippingAddress: {
        name: document.getElementById('fullName').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        pin: document.getElementById('pin').value,
        state: document.getElementById('state').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
      },
      paymentMethod: activeMethod,
      shippingOption: shippingEl ? shippingEl.value : 'standard',
      ecoPackaging: ecoEl ? ecoEl.checked : true,
      winningBid: winningBid,
      shippingCost: shippingCost,
      ecoOffset: 10,
      total: winningBid + shippingCost + 10,
      status: 'paid',
      paidAt: new Date().toISOString()
    };

    const currentOrders = typeof getOrders === 'function' ? getOrders() : JSON.parse(localStorage.getItem('Vaultora_orders') || '[]');
    currentOrders.push(order);
    if (typeof saveOrders === 'function') saveOrders(currentOrders);
    else localStorage.setItem('Vaultora_orders', JSON.stringify(currentOrders));

    if (product) {
      const products = typeof getProducts === 'function' ? getProducts() : JSON.parse(localStorage.getItem('Vaultora_products') || '[]');
      const idx = products.findIndex(p => String(p.id) === String(product.id));
      if (idx !== -1) {
        products[idx].auctionStatus = 'inactive'; 
        products[idx].status = 'sold';
        products[idx].paymentStatus = 'completed'; 
        products[idx].winnerEmail = (activeSession.email || document.getElementById('email').value).toLowerCase();
        
        if (typeof saveProducts === 'function') await saveProducts(products);
        else localStorage.setItem('Vaultora_products', JSON.stringify(products));
      }
    }

    const bids = typeof getBids === 'function' ? getBids() : JSON.parse(localStorage.getItem('Vaultora_bids') || '[]');
    const buyerMail = (activeSession.email || document.getElementById('email').value).toLowerCase();
    const bidIdx = bids.findIndex(b => String(b.productId) === String(product?.id) && ((b.bidderEmail && b.bidderEmail.toLowerCase() === buyerMail) || (b.user && b.user.toLowerCase() === buyerMail)));
    
    if (bidIdx !== -1) {
      bids[bidIdx].paymentStatus = 'completed';
      bids[bidIdx].orderId = order.id;
      if (typeof saveBids === 'function') await saveBids(bids);
      else localStorage.setItem('Vaultora_bids', JSON.stringify(bids));
    }

    // FIX: Dynamic structural check instead of a blind call to bypass compilation failures
    const sharedStorageModule = await import('../../scripts/storage.js');
    if (sharedStorageModule && typeof sharedStorageModule.syncToCloud === 'function') {
      await sharedStorageModule.syncToCloud();
    }
    
    return order;
  }

  function triggerSuccessPopupAnimation() {
    const overlay = document.getElementById('successOverlay');
    const detail  = document.getElementById('successDetail');
    const activeSession = typeof getSession === 'function' ? getSession() : {};

    if (detail) {
      detail.innerHTML = `
        <strong>Asset: ${product ? product.title : 'Vault Lot'}</strong><br>
        Cleared Funds: ₹${(winningBid + shippingCost + 10).toLocaleString('en-IN')}<br>
        Hub Destination: ${document.getElementById('city').value || '—'}, ${document.getElementById('state').value || '—'}
      `;
    }

    if (overlay) overlay.classList.add('open');

    let secs = 5;
    const numEl = document.getElementById('countdownNum');
    const timer = setInterval(() => {
      secs--;
      if (numEl) numEl.textContent = String(secs);
      if (secs <= 0) {
        clearInterval(timer);
        window.location.href = 'dashboard';
      }
    }, 1000);
  }

  // Event Listeners Initialization mapping
  formPanel.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      shippingCost = SHIPPING_COSTS[e.target.value] || 0;
      updateTotals();
      const label = document.getElementById('shippingLine')?.querySelector('span');
      const labels = { standard: 'Shipping (Carbon Offset)', express: 'Shipping (Carbon Neutral)', same_day: 'Shipping (Zero Emission)' };
      if (label) label.textContent = labels[e.target.value] || 'Shipping';
    });
  });

  formPanel.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeMethod = tab.dataset.method;
      formPanel.querySelectorAll('.method-tab').forEach(t => t.classList.toggle('active', t === tab));
      formPanel.querySelectorAll('.method-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${activeMethod}`)?.classList.remove('hidden');
    });
  });

  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    document.getElementById('ccDisplayNum').textContent = e.target.value || '•••• •••• •••• ••••';
  });

  document.getElementById('cardName')?.addEventListener('input', (e) => {
    document.getElementById('ccDisplayName').textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  });

  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
    e.target.value = v;
    document.getElementById('ccDisplayExp').textContent = e.target.value || 'MM / YY';
  });

  formPanel.querySelectorAll('.upi-option').forEach(option => {
    option.addEventListener('click', () => {
      option.parentNode.querySelectorAll('.upi-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
    });
  });

  document.getElementById('placeOrderBtn')?.addEventListener('click', executeOrderPlacement);

  // Kickstart processing updates
  loadOrderContext();
  prefillUserDetails();
}

// Global Micro Toast Fallback Logic
function showToast(msg, type = 'info') {
  let toast = document.getElementById('checkoutToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'checkoutToast';
    toast.style.cssText = `
      position:fixed; bottom:1.6rem; left:50%; transform:translateX(-50%) translateY(10px);
      background:${type === 'error' ? '#a83830' : '#1a3020'}; color:#f5f0e6; padding:.65rem 1.4rem;
      border-radius:50px; font-size:.84rem; opacity:0; pointer-events:none; transition: all .25s; z-index:9999;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 3200);
}