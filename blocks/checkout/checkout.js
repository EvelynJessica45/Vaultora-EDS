/* =========================================================================
   Vaultora — checkout.js (Streamlined Content Mapping Suite)
   ========================================================================= */

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

const PAYMENT_LOGOS = {
  gpay: `<div class="upi-option-logo" style="background:#ffffff; border:1px solid #eee;">
      <svg viewBox="0 0 28 28" width="20" height="20" aria-hidden="true">
        <circle cx="14" cy="14" r="7" fill="none" stroke-width="4" stroke-dasharray="11 33" stroke="#4285F4"/>
        <circle cx="14" cy="14" r="7" fill="none" stroke-width="4" stroke-dasharray="11 33" stroke-dashoffset="-11" stroke="#EA4335"/>
        <circle cx="14" cy="14" r="7" fill="none" stroke-width="4" stroke-dasharray="11 33" stroke-dashoffset="-22" stroke="#FBBC05"/>
        <circle cx="14" cy="14" r="7" fill="none" stroke-width="4" stroke-dasharray="11 33" stroke-dashoffset="-33" stroke="#34A853"/>
      </svg>
    </div>`,
  phonepe: `<div class="upi-option-logo" style="background:#5f259f;"><span style="color:#ffffff; font-weight:700; font-size:11px;">Pe</span></div>`,
  paytm: `<div class="upi-option-logo" style="background:linear-gradient(135deg,#00baf2,#002e6e);"><span style="color:#ffffff; font-weight:700; font-size:13px;">P</span></div>`,
  bhim: `<div class="upi-option-logo" style="background:#ffffff; border:1px solid #eee; flex-direction:column; padding:0;">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <rect y="2" width="28" height="7.3" fill="#ff9933"/>
        <rect y="9.3" width="28" height="9.4" fill="#ffffff"/>
        <rect y="18.7" width="28" height="7.3" fill="#138808"/>
        <circle cx="14" cy="14" r="3" fill="#000080"/>
      </svg>
    </div>`,
  amazonpay: `<div class="upi-option-logo" style="background:#232f3e;"><span style="color:#ff9900; font-weight:700; font-size:14px; font-style:italic;">a</span></div>`,
  mobikwik: `<div class="upi-option-logo" style="background:#e2231a;"><span style="color:#ffffff; font-weight:700; font-size:13px;">M</span></div>`,
  cred: `<div class="upi-option-logo" style="background:#0b0b0b;"><span style="color:#ffffff; font-weight:700; font-size:10px; letter-spacing:0.5px;">CRED</span></div>`
};

export default function decorate(block) {
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

  const text = {
    formTitle: config.formtitle || 'Shipping Address',
    formSubtitle: config.formsubtitle || 'Where should we deliver your item?',
    logisticsTitle: config.logisticstitle || 'Eco Shipping',
    logisticsSubtitle: config.logisticssubtitle || 'All options are carbon-offset certified',
    paymentTitle: config.paymenttitle || 'Payment Method',
    paymentSubtitle: config.paymentsubtitle || 'All transactions are encrypted and secure',
    summaryTitle: config.summarytitle || 'Order Summary',
    btnText: config.buttontext || 'Complete Carbon-Neutral Order',
    phName: config.placeholdername || 'Full Name',
    phAddr: config.placeholderaddress || 'Street Address'
  };

  block.innerHTML = '';

  const formPanel = document.createElement('div');
  formPanel.className = 'checkout-form-panel';
  
  const summaryPanel = document.createElement('div');
  summaryPanel.className = 'checkout-summary-panel';

  // Batch insertion to avoid layout thrashing
  const fragment = document.createDocumentFragment();
  fragment.appendChild(formPanel);
  fragment.appendChild(summaryPanel);
  block.appendChild(fragment);

  if (!document.getElementById('successOverlay')) {
    const overlayNode = document.createElement('div');
    overlayNode.id = 'successOverlay';
    overlayNode.className = 'checkout-overlay';
    overlayNode.setAttribute('role', 'dialog');
    overlayNode.setAttribute('aria-modal', 'true');
    overlayNode.innerHTML = `
      <div class="success-modal-card">
        <div class="success-ring-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg></div>
        <h2>Settlement Authorized</h2>
        <p>Your transaction clear tokens matched storage vectors successfully.</p>
        <div class="receipt-data-payload" id="successDetail"></div>
        <div class="countdown-redirect-notice">Redirecting to portfolio panel in <span id="countdownNum" style="color:#b9925a; font-weight:700;">5</span>s...</div>
      </div>
    `;
    document.body.appendChild(overlayNode);
  }

  formPanel.innerHTML = `
    <div class="trust-strip">
      <span class="trust-strip-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>256-bit Encrypted</span>
      <span class="trust-strip-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Buyer Protection</span>
      <span class="trust-strip-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Instant Confirmation</span>
    </div>
    <div class="form-card-block">
      <div class="card-header-row">
        <div class="step-badge">1</div>
        <div>
          <h2>${text.formTitle}</h2>
          <p class="card-subtitle">${text.formSubtitle}</p>
        </div>
      </div>
      <div class="form-fields-grid">
        <div class="field-group col-6"><label for="fullName">Full Name<span class="required-mark">*</span></label><input type="text" id="fullName" class="input-ctrl" placeholder="${text.phName}" required /></div>
        <div class="field-group col-6"><label for="address">Street Address<span class="required-mark">*</span></label><input type="text" id="address" class="input-ctrl" placeholder="${text.phAddr}" required /></div>
        <div class="field-group col-3"><label for="city">City<span class="required-mark">*</span></label><input type="text" id="city" class="input-ctrl" placeholder="City" required /></div>
        <div class="field-group col-3"><label for="pin">PIN Code<span class="required-mark">*</span></label><input type="text" id="pin" class="input-ctrl" placeholder="6-digit PIN" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" required /></div>
        <div class="field-group col-3"><label for="state">State<span class="required-mark">*</span></label><input type="text" id="state" class="input-ctrl" placeholder="State" required /></div>
        <div class="field-group col-3"><label for="phone">Phone<span class="required-mark">*</span></label><input type="tel" id="phone" class="input-ctrl" placeholder="+91 XXXXX XXXXX" inputmode="numeric" required /></div>
        <div class="field-group col-6"><label for="email">Email<span class="required-mark">*</span></label><input type="email" id="email" class="input-ctrl" required /></div>
      </div>
    </div>

    <div class="form-card-block">
      <div class="card-header-row">
        <div class="step-badge">2</div>
        <div>
          <h2>${text.paymentTitle}</h2>
          <p class="card-subtitle">${text.paymentSubtitle}</p>
        </div>
      </div>
      <div class="payment-tabs-menu" role="tablist">
        <button type="button" class="method-tab active" data-method="card" role="tab" aria-selected="true" aria-controls="panel-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Credit / Debit Card</button>
        <button type="button" class="method-tab" data-method="upi" role="tab" aria-selected="false" aria-controls="panel-upi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>UPI</button>
        <button type="button" class="method-tab" data-method="wallet" role="tab" aria-selected="false" aria-controls="panel-wallet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>Wallet</button>
      </div>

      <div class="method-panel" id="panel-card" role="tabpanel">
        <div class="bank-card-preview" aria-hidden="true">
          <div class="cc-chip-logo"><div class="chip-token"></div><span class="vaultora-cc-seal"></span></div>
          <div id="ccDisplayNum">•••• •••• •••• ••••</div>
          <div class="cc-holder-exp-row"><div><span style="font-size:8px; opacity:0.6; display:block;">Card Holder</span><span id="ccDisplayName">YOUR NAME</span></div><div><span style="font-size:8px; opacity:0.6; display:block;">Expires</span><span id="ccDisplayExp">MM / YY</span></div></div>
        </div>
        <div class="form-fields-grid">
          <div class="field-group col-6"><label for="cardNumber">Card Number<span class="required-mark">*</span></label><input type="text" id="cardNumber" class="input-ctrl" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric" required /></div>
          <div class="field-group col-6"><label for="cardName">Name on Card<span class="required-mark">*</span></label><input type="text" id="cardName" class="input-ctrl" placeholder="As printed on card" autocomplete="off" required /></div>
          <div class="field-group col-3"><label for="cardExpiry">Expiry Date<span class="required-mark">*</span></label><input type="text" id="cardExpiry" class="input-ctrl" placeholder="MM / YY" maxlength="7" inputmode="numeric" required /></div>
          <div class="field-group col-3"><label for="cardCvv">CVV<span class="required-mark">*</span></label><input type="password" id="cardCvv" class="input-ctrl" placeholder="•••" maxlength="4" inputmode="numeric" pattern="[0-9]*" required /></div>
        </div>
      </div>

      <div class="method-panel hidden" id="panel-upi" role="tabpanel">
        <div class="upi-logos-matrix">
          <div class="upi-option selected" data-provider="gpay" role="radio" aria-checked="true" tabindex="0">${PAYMENT_LOGOS.gpay}<span class="upi-option-label">Google Pay</span></div>
          <div class="upi-option" data-provider="phonepe" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.phonepe}<span class="upi-option-label">PhonePe</span></div>
          <div class="upi-option" data-provider="paytm" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.paytm}<span class="upi-option-label">Paytm</span></div>
          <div class="upi-option" data-provider="bhim" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.bhim}<span class="upi-option-label">BHIM</span></div>
        </div>
        <div class="field-group"><label for="upiId">Virtual Payment Address (VPA)<span class="required-mark">*</span></label><input type="text" id="upiId" class="input-ctrl" placeholder="username@upi" required /></div>
      </div>

      <div class="method-panel hidden" id="panel-wallet" role="tabpanel">
        <div class="upi-logos-matrix">
          <div class="upi-option selected" data-wallet="paytmwallet" role="radio" aria-checked="true" tabindex="0">${PAYMENT_LOGOS.paytm}<span class="upi-option-label">Paytm Wallet</span></div>
          <div class="upi-option" data-wallet="amazonpay" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.amazonpay}<span class="upi-option-label">Amazon Pay</span></div>
          <div class="upi-option" data-wallet="mobikwik" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.mobikwik}<span class="upi-option-label">Mobikwik</span></div>
          <div class="upi-option" data-wallet="cred" role="radio" aria-checked="false" tabindex="0">${PAYMENT_LOGOS.cred}<span class="upi-option-label">CRED</span></div>
        </div>
      </div>
    </div>

    <div class="form-card-block">
      <div class="card-header-row">
        <div class="step-badge">3</div>
        <div>
          <h2>${text.logisticsTitle}</h2>
          <p class="card-subtitle">${text.logisticsSubtitle}</p>
        </div>
      </div>
      <label class="option-row-label selected">
        <span class="radio-input-wrapper">
          <input type="radio" name="shipping" value="standard" checked />
          <span class="option-dot dot-gold"></span>
          <span class="option-text"><strong>EcoExpress Standard</strong><small>5–7 days · Carbon Offset</small></span>
        </span>
        <span class="option-cost">Free</span>
      </label>
      <label class="option-row-label">
        <span class="radio-input-wrapper">
          <input type="radio" name="shipping" value="express" />
          <span class="option-dot dot-gold"></span>
          <span class="option-text"><strong>EcoExpress Fast</strong><small>2–3 days · Carbon Neutral</small></span>
        </span>
        <span class="option-cost">+ ₹120</span>
      </label>
      <label class="option-row-label">
        <span class="radio-input-wrapper">
          <input type="radio" name="shipping" value="same_day" />
          <span class="option-dot dot-green"></span>
          <span class="option-text"><strong>GreenSame Day</strong><small>Today · Zero Emission Fleet</small></span>
        </span>
        <span class="option-cost">+ ₹280</span>
      </label>
      <label class="option-row-label" style="margin-top:16px; background:#faf8f5;" for="ecoPackaging">
        <span class="radio-input-wrapper">
          <span class="eco-icon" aria-hidden="true">📦</span>
          <span class="option-text"><strong>Eco Packaging</strong><small>100% compostable, plastic-free packaging</small></span>
        </span>
        <span class="toggle-switch">
          <input type="checkbox" id="ecoPackaging" checked />
          <span class="toggle-slider"></span>
        </span>
      </label>
    </div>
  `;

  summaryPanel.innerHTML = `
    <div class="form-card-block">
      <h2 style="margin-bottom:1.5rem; padding-bottom:0.6rem; border-bottom:1px dashed rgba(43,33,24,0.08);">${text.summaryTitle}</h2>
      <div class="order-summary-box">
        <div class="summary-img-frame"><img id="summaryImg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" decoding="async" alt="Product Frame" width="75" height="75" /></div>
        <div class="summary-product-details">
          <h3 id="summaryProductName">Loading item details...</h3>
          <span id="summaryCategory">—</span>
          <p id="summarySeller">—</p>
          <span class="eco-badge-pill">✓ Eco Packaging</span>
        </div>
      </div>
      
      <div class="pricing-breakdown-ledger">
        <div class="ledger-row"><span>Winning Bid</span><span id="summaryBidAmount">₹0</span></div>
        <div class="ledger-row" id="shippingLine"><span>Shipping (Carbon Offset)</span><span id="summaryShipping">Free</span></div>
        <div class="ledger-row" style="color:#1f8f4d;"><span>Eco Offset Contribution</span><span>+ ₹10</span></div>
        <div class="ledger-row grand-total"><span>Total</span><span id="summaryTotal">₹0</span></div>
      </div>

      <button type="button" class="btn-checkout-submit" id="placeOrderBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ${text.btnText}
      </button>

      <ul class="benefit-checklist">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Secured &amp; Encrypted</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>Sustainable Practice</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Instant Confirmation</li>
      </ul>
    </div>
  `;

  // Static Elements DOM Caching Strategy 
  const elSummaryProductName = document.getElementById('summaryProductName');
  const elSummaryImg = document.getElementById('summaryImg');
  const elSummaryCategory = document.getElementById('summaryCategory');
  const elSummarySeller = document.getElementById('summarySeller');
  const elSummaryBidAmount = document.getElementById('summaryBidAmount');
  const elSummaryShipping = document.getElementById('summaryShipping');
  const elSummaryTotal = document.getElementById('summaryTotal');
  const elPlaceOrderBtn = document.getElementById('placeOrderBtn');
  const elPlaceOrderBtnOriginalHTML = elPlaceOrderBtn ? elPlaceOrderBtn.innerHTML : '';
  const { mobileBar, mobileBarTotal: elMobileBarTotal, mobileBarBtn } = createMobileSummaryBar();

  function loadOrderContext() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    winningBid = parseFloat(params.get('bid')) || 0;

    const products = typeof getProducts === 'function' ? getProducts() : [];
    product = products.find(p => String(p.id) === String(productId)) || null;

    if (!product) {
      elSummaryProductName.textContent = 'Unknown Vault Item';
      updateTotals();
      return;
    }

    const imgSrc = Array.isArray(product.images) ? product.images[0] : (product.image || product.imageUrl || '');
    elSummaryImg.src = imgSrc;
    elSummaryProductName.textContent = product.title || '—';
    elSummaryCategory.textContent = product.category || '—';
    elSummarySeller.textContent = `Seller: ${product.seller || 'Vaultora Partner'}`;
    elSummaryBidAmount.textContent = `₹${winningBid.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    updateTotals();
  }

  function prefillUserDetails() {
    const session = typeof getSession === 'function' ? getSession() : {};
    if (session?.email) document.getElementById('email').value = session.email;
    if (session?.name) document.getElementById('fullName').value = session.name;
  }

  function updateTotals() {
    const total = winningBid + shippingCost + 10;
    elSummaryShipping.textContent = shippingCost === 0 ? 'Free' : `+ ₹${shippingCost.toLocaleString('en-IN')}`;
    elSummaryTotal.textContent = `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    elSummaryTotal.classList.remove('bump');
    // eslint-disable-next-line no-unused-expressions
    void elSummaryTotal.offsetWidth; // restart animation
    elSummaryTotal.classList.add('bump');
    if (elMobileBarTotal) elMobileBarTotal.textContent = elSummaryTotal.textContent;
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
      if (!/^\d{3,4}$/.test(cardCvv)) return { ok: false, msg: 'CVV must be 3 or 4 digits.' };
    }

    if (activeMethod === 'upi') {
      const upiId = (document.getElementById('upiId')?.value || '').trim();
      if (!upiId) return { ok: false, msg: 'UPI ID is required.' };
      if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) return { ok: false, msg: 'Please enter a valid UPI ID (e.g. name@bank).' };
    }

    return { ok: true };
  }

  async function executeOrderPlacement() {
    const check = validateForm();
    if (!check.ok) {
      showToast(check.msg, 'error');
      return;
    }

    if (elPlaceOrderBtn) {
      elPlaceOrderBtn.disabled = true;
      elPlaceOrderBtn.classList.add('is-loading');
      elPlaceOrderBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>Processing Secure Settlement...';
    }
    if (mobileBarBtn) {
      mobileBarBtn.disabled = true;
      mobileBarBtn.textContent = 'Processing…';
    }

    setTimeout(async () => {
      await commitOrderToStorage();
      requestAnimationFrame(triggerSuccessPopupAnimation);
      if (elPlaceOrderBtn) {
        elPlaceOrderBtn.disabled = false;
        elPlaceOrderBtn.classList.remove('is-loading');
        elPlaceOrderBtn.innerHTML = elPlaceOrderBtnOriginalHTML;
      }
      if (mobileBarBtn) {
        mobileBarBtn.disabled = false;
        mobileBarBtn.textContent = 'Checkout';
      }
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

    const sharedStorageModule = await import('../../scripts/storage.js');
    if (sharedStorageModule && typeof sharedStorageModule.syncToCloud === 'function') {
      await sharedStorageModule.syncToCloud();
    }
    
    return order;
  }

  function triggerSuccessPopupAnimation() {
    const overlay = document.getElementById('successOverlay');
    const detail  = document.getElementById('successDetail');

    if (detail) {
      detail.innerHTML = `
        <strong>Asset: ${product ? product.title : 'Vault Lot'}</strong><br>
        Cleared Funds: ₹${(winningBid + shippingCost + 10).toLocaleString('en-IN')}<br>
        Hub Destination: ${document.getElementById('city').value || '—'}, ${document.getElementById('state').value || '—'}
      `;
    }

    if (overlay) {
      overlay.classList.add('open');
      overlay.focus();
    }

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

  // Passive Optimized Event Listeners mapping Pipeline
  formPanel.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      shippingCost = SHIPPING_COSTS[e.target.value] || 0;
      updateTotals();
      const label = document.getElementById('shippingLine')?.querySelector('span');
      const labels = { standard: 'Shipping (Carbon Offset)', express: 'Shipping (Carbon Neutral)', same_day: 'Shipping (Zero Emission)' };
      if (label) label.textContent = labels[e.target.value] || 'Shipping';

      formPanel.querySelectorAll('input[name="shipping"]').forEach(r => {
        r.closest('.option-row-label')?.classList.toggle('selected', r.checked);
      });
    }, { passive: true });
  });

  formPanel.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeMethod = tab.dataset.method;
      formPanel.querySelectorAll('.method-tab').forEach(t => {
        const isCurrent = t === tab;
        t.classList.toggle('active', isCurrent);
        t.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
      formPanel.querySelectorAll('.method-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${activeMethod}`)?.classList.remove('hidden');
    });
  });

  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    document.getElementById('ccDisplayNum').textContent = e.target.value || '•••• •••• •••• ••••';
  }, { passive: true });

  document.getElementById('cardName')?.addEventListener('input', (e) => {
    document.getElementById('ccDisplayName').textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  }, { passive: true });

  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) {
      let mm = parseInt(v.slice(0, 2), 10);
      if (mm < 1) mm = 1;
      if (mm > 12) mm = 12;
      v = String(mm).padStart(2, '0') + v.slice(2);
    }
    if (v.length >= 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
    e.target.value = v;
    document.getElementById('ccDisplayExp').textContent = e.target.value || 'MM / YY';
  }, { passive: true });

  document.getElementById('cardCvv')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  }, { passive: true });

  formPanel.querySelectorAll('.upi-option').forEach(option => {
    const selectRadio = () => {
      option.parentNode.querySelectorAll('.upi-option').forEach(o => {
        o.classList.remove('selected');
        o.setAttribute('aria-checked', 'false');
      });
      option.classList.add('selected');
      option.setAttribute('aria-checked', 'true');
    };
    option.addEventListener('click', selectRadio);
    option.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectRadio(); } });
  });

  elPlaceOrderBtn?.addEventListener('click', executeOrderPlacement);
  mobileBarBtn?.addEventListener('click', () => elPlaceOrderBtn?.click());

  if ('IntersectionObserver' in window && elPlaceOrderBtn) {
    const ctaObserver = new IntersectionObserver(([entry]) => {
      mobileBar.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0 });
    ctaObserver.observe(elPlaceOrderBtn);
  }

  loadOrderContext();
  prefillUserDetails();
}

function createMobileSummaryBar() {
  let bar = document.getElementById('checkoutMobileBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'checkoutMobileBar';
    bar.className = 'checkout-mobile-bar';
    bar.innerHTML = `
      <div class="mobile-bar-total"><span>Total</span><strong id="mobileBarTotalValue">₹0</strong></div>
      <button type="button" id="mobileBarBtn">Checkout</button>
    `;
    document.body.appendChild(bar);
  }
  return {
    mobileBar: bar,
    mobileBarTotal: bar.querySelector('#mobileBarTotalValue'),
    mobileBarBtn: bar.querySelector('#mobileBarBtn')
  };
}

function showToast(msg, type = 'info') {
  let toast = document.getElementById('checkoutToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'checkoutToast';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      position:fixed; bottom:1.6rem; left:50%; transform:translateX(-50%) translateY(10px);
      background:${type === 'error' ? '#a83830' : '#1a3020'}; color:#f5f0e6; padding:.65rem 1.4rem;
      border-radius:50px; font-size:.84rem; opacity:0; pointer-events:none; transition: opacity .25s, transform .25s; z-index:9999;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 3200);
}