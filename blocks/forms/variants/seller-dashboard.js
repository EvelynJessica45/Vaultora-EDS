import { decorateIcons } from '../../scripts/aem.js';
import { getProducts, saveProducts, getSession } from '../../scripts/storage.js';

const ALL_CATEGORIES = [
  'Clay & Ceramics', 'Pottery', 'Hand-blown Glass', 'Woodworking', 'Woodcarving',
  'Macramé', 'Weaving & Textiles', 'Embroidery', 'Batik', 'Block Printing',
  'Leather Craft', 'Basket Weaving', 'Paper Craft', 'Mosaic', 'Candle Making',
  'Organic Cotton', 'Natural Linen', 'Hemp Fabric', 'Handloom Sarees',
  'Sustainable Footwear', 'Upcycled Jewellery', 'Seed Jewellery', 'Vintage Clothing', 'Handknit Knitwear',
  'Organic Spices', 'Artisan Tea', 'Cold-pressed Oils', 'Natural Honey', 'Herbal Skincare', 'Ayurvedic Products', 'Beeswax Products',
  'Reclaimed Wood', 'Reclaimed Metal', 'Bamboo Products', 'Jute & Coir', 'Natural Stone', 'Recycled Glass', 'Upcycled Furniture', 'Terracotta Décor', 'Eco Candles', 'Natural Dyes',
  'Photography', 'Painting', 'Illustration', 'Sculpture', 'Digital Art', 'Printmaking', 'Calligraphy',
  'Vintage', 'Antique', 'Collectibles', 'Vintage Books', 'Vintage Maps', 'Vintage Posters', 'Heritage Coins',
  'Plants & Seeds', 'Heirloom Seeds', 'Garden Tools', 'Compost & Soil',
  'Zero-waste Kits', 'Solar & Energy', 'Upcycled Tech', 'Kids & Toys', 'Pet Products', 'Musical Instruments', 'Other',
];

/**
 * Decorates the Seller Dashboard Create Listing Block
 * @param {Element} block The seller dashboard block element
 */
export default async function decorate(block) {
  const session = getSession();
  if (!session || !session.verified) {
    window.location.replace('register');
    return;
  }

  const rows = [...block.children];
  if (!rows || rows.length === 0) return;

  const cells = [...rows[0].children];
  const getCellLines = (cellElement) => {
    if (!cellElement) return [];
    return [...cellElement.querySelectorAll('p, li, div')]
      .map(p => p.textContent.trim())
      .filter(txt => txt !== '');
  };

  const headerConf = getCellLines(cells[0]);
  const step1Conf = getCellLines(cells[1]);
  const step23Conf = getCellLines(cells[2]);
  const step4Conf = getCellLines(cells[3]);

  block.innerHTML = '';

  const pageWrapper = document.createElement('div');
  pageWrapper.className = 'page-wrapper';

  const titleText = headerConf[2] || 'Create Auction Listing';
  const titleWords = titleText.trim().split(/\s+/);
  const titleAccentWord = titleWords.pop();
  const titleLead = titleWords.join(' ');
  const titleHTML = titleLead
    ? `${titleLead} <span class="title-accent">${titleAccentWord}</span>`
    : `<span class="title-accent">${titleAccentWord}</span>`;

  pageWrapper.innerHTML = `
    <div class="page-title-block">
      <span class="page-eyebrow">${headerConf[1] || 'Seller Studio'}</span>
      <h1>${titleHTML}</h1>
      <p>${headerConf[3] || 'List your eco-conscious piece in four simple steps'}</p>
      <div class="progress-rail" aria-hidden="true"><div class="progress-fill" id="progressFill"></div></div>
    </div>

    <nav class="step-bar" aria-label="Listing Progress">
      <div class="step-item active" data-step="0">
        <div class="step-circle"><span class="step-num">1</span><span class="step-check">✓</span></div>
        <span class="step-label">Basics</span>
      </div>
      <div class="step-line" aria-hidden="true"></div>
      <div class="step-item" data-step="1">
        <div class="step-circle"><span class="step-num">2</span><span class="step-check">✓</span></div>
        <span class="step-label">Media</span>
      </div>
      <div class="step-line" aria-hidden="true"></div>
      <div class="step-item" data-step="2">
        <div class="step-circle"><span class="step-num">3</span><span class="step-check">✓</span></div>
        <span class="step-label">Timing</span>
      </div>
      <div class="step-line" aria-hidden="true"></div>
      <div class="step-item" data-step="3">
        <div class="step-circle"><span class="step-num">4</span><span class="step-check">✓</span></div>
        <span class="step-label">Review</span>
      </div>
    </nav>

    <form id="sellerForm" novalidate>
      <div class="steps-wrapper">
        <section class="form-step active-step" data-index="0" aria-label="Step 1: Product Basics">
          <div class="form-card">
            <div class="card-header">
              <div class="card-header-num" aria-hidden="true">01</div>
              <div>
                <h3 class="card-title">${step1Conf[1] || 'Product Basics'}</h3>
                <p class="card-subtitle">${step1Conf[2] || 'Tell buyers what makes this piece special'}</p>
              </div>
            </div>

            <div class="form-row">
              <label for="title">${step1Conf[3] || 'Product Title'} <span class="req">*</span></label>
              <input type="text" id="title" placeholder="e.g. Hand-thrown Terracotta Bowl" maxlength="120" required />
            </div>

            <div class="form-row">
              <label for="description">${step1Conf[4] || 'Description'} <span class="req">*</span></label>
              <textarea id="description" rows="4" maxlength="800" placeholder="Describe the material, origin, story, and what makes it eco-conscious…" required></textarea>
              <span class="char-count"><span id="descCount">0</span> / 800 characters</span>
            </div>

            <div class="form-grid-2">
              <div class="form-row">
                <label for="condition">Condition <span class="req">*</span></label>
                <select id="condition" required>
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used – Good</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Vintage">Vintage / Antique</option>
                </select>
              </div>

              <div class="form-row">
                <label for="initialBid">${step1Conf[5] || 'Starting Bid (₹)'} <span class="req">*</span></label>
                <input type="number" id="initialBid" min="1" step="0.01" placeholder="0.00" required />
              </div>
            </div>

            <div class="form-row">
              <label for="categorySearch">Category <span class="req">*</span></label>
              <div class="cat-search-wrap">
                <input type="text" id="categorySearch" placeholder="Search categories…" autocomplete="off" />
              </div>
              <div class="category-grid" id="categoryGrid"></div>
              <input type="hidden" id="category" required />
              <p class="selected-cat-display" id="selectedCatDisplay" aria-live="polite"></p>
            </div>
          </div>
        </section>

        <section class="form-step" data-index="1" aria-label="Step 2: Product Images">
          <div class="form-card">
            <div class="card-header">
              <div class="card-header-num" aria-hidden="true">02</div>
              <div>
                <h3 class="card-title">${step23Conf[1] || 'Product Images'}</h3>
                <p class="card-subtitle">${step23Conf[2] || 'Upload up to 5 images — Maximum 5MB per file'}</p>
              </div>
            </div>

            <div class="upload-zone-wrapper">
              <label for="imageUploadInput" class="custom-file-upload">
                <span class="upload-icon">📁</span>
                <strong>Click to upload assets</strong> or drag and drop here
                <span class="upload-hint">Accepts JPEG, PNG, WEBP (Max 5 files)</span>
              </label>
              <input type="file" id="imageUploadInput" accept="image/jpeg, image/png, image/webp" multiple style="display: none;" />
            </div>

            <div id="uploadedImagesContainer" class="image-url-list" style="margin-top: 1.5rem;"></div>

            <div class="img-preview-section" id="imgPreviewSection" style="display:none">
              <p class="preview-label">Selected Main Cover Asset</p>
              <div class="img-preview-stage">
                <img id="imgPreviewMain" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Main Product Preview" width="560" height="315" loading="lazy" decoding="async"/>
              </div>
              <div class="img-thumbs-row" id="imgThumbsRow"></div>
            </div>
          </div>
        </section>

        <section class="form-step" data-index="2" aria-label="Step 3: Auction Timing">
          <div class="form-card">
            <div class="card-header">
              <div class="card-header-num" aria-hidden="true">03</div>
              <div>
                <h3 class="card-title">Auction Timing</h3>
                <p class="card-subtitle">Set when your auction closes</p>
              </div>
            </div>

            <div class="form-row">
              <label for="auctionEndTime">${step23Conf[3] || 'Auction End Date & Time'} <span class="req">*</span></label>
              <input type="datetime-local" id="auctionEndTime" required />
              <span class="hint">Must be at least 1 hour from now</span>
            </div>

            <div class="duration-chips">
              <span class="dur-label">${step23Conf[4] || 'Quick set:'}</span>
              <button type="button" class="dur-chip" data-hours="24">1 day</button>
              <button type="button" class="dur-chip" data-hours="72">3 days</button>
              <button type="button" class="dur-chip" data-hours="168">7 days</button>
              <button type="button" class="dur-chip" data-hours="336">14 days</button>
            </div>

            <div class="timing-preview" id="timingPreview" style="display:none">
              <div class="timing-preview-inner">
                <span class="timing-icon" aria-hidden="true">⏰</span>
                <div>
                  <div class="timing-label">Auction will run for</div>
                  <div class="timing-value" id="timingValue" aria-live="polite">—</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="form-step" data-index="3" aria-label="Step 4: Review Listing">
          <div class="form-card review-card">
            <div class="card-header">
              <div class="card-header-num" aria-hidden="true">04</div>
              <div>
                <h3 class="card-title">${step4Conf[1] || 'Review Listing'}</h3>
                <p class="card-subtitle">${step4Conf[2] || 'Check everything before publishing'}</p>
              </div>
            </div>

            <div class="review-layout">
              <div class="review-gallery">
                <div class="review-main-img-wrap">
                  <img id="reviewMainImg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Final Product Review Backdrop" width="560" height="420" loading="lazy" decoding="async" />
                  <div id="reviewMainPlaceholder" class="review-img-placeholder">No image added</div>
                </div>
                <div class="review-thumbs" id="reviewThumbs"></div>
              </div>

              <div class="review-details">
                <div class="review-cat-chip" id="reviewCategory">—</div>
                <h2 class="review-title" id="reviewTitle">Product Title</h2>
                <p class="review-desc" id="reviewDesc">—</p>

                <div class="review-meta-grid">
                  <div class="review-meta-item"><span class="review-meta-label">Starting Bid</span><span class="review-meta-value" id="reviewPrice">₹—</span></div>
                  <div class="review-meta-item"><span class="review-meta-label">Condition</span><span class="review-meta-value" id="reviewCondition">—</span></div>
                  <div class="review-meta-item"><span class="review-meta-label">Auction Ends</span><span class="review-meta-value" id="reviewEndTime">—</span></div>
                  <div class="review-meta-item"><span class="review-meta-label">Duration</span><span class="review-meta-value" id="reviewDuration">—</span></div>
                  <div class="review-meta-item"><span class="review-meta-label">Images</span><span class="review-meta-value" id="reviewImgCount">—</span></div>
                  <div class="review-meta-item"><span class="review-meta-label">Seller</span><span class="review-meta-value" id="reviewSeller">—</span></div>
                </div>

                <div class="review-desc-full">
                  <p class="review-desc-label">Full Description</p>
                  <p class="review-desc-text" id="reviewDescFull">—</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="actions-bar">
        <button type="button" id="prevBtn" class="btn-prev" style="display:none">← Previous</button>
        <div class="step-progress-text" id="stepProgressText">Step 1 of 4</div>
        <button type="button" id="nextBtn" class="btn-next">Continue →</button>
        <button type="submit" id="submitBtn" class="btn-submit" style="display:none">${step4Conf[3] || 'Publish Listing'}</button>
      </div>
    </form>

    <div class="custom-popup-overlay" id="customSellerPopup" role="dialog" aria-modal="true" tabindex="-1">
      <div class="custom-popup-box">
        <div class="popup-icon-wrap" id="sellerPopupIcon">ⓘ</div>
        <h2 class="popup-title" id="sellerPopupTitle">Notification</h2>
        <p class="popup-msg" id="sellerPopupMessage">Processing text details...</p>
        <button type="button" class="popup-confirm-btn" id="sellerPopupCloseBtn">Continue</button>
      </div>
    </div>
  `;

  block.appendChild(pageWrapper);
  initializeStudioEngine(pageWrapper, session);
  await decorateIcons(pageWrapper);
}

function initializeStudioEngine(container, session) {
  const stepEls = container.querySelectorAll('.form-step');
  const stepItems = container.querySelectorAll('.step-item');
  const stepLines = container.querySelectorAll('.step-line');
  let currentStep = 0;
  const TOTAL = stepEls.length;

  const nextBtn = container.querySelector('#nextBtn');
  const prevBtn = container.querySelector('#prevBtn');
  const submitBtn = container.querySelector('#submitBtn');
  const progressTxt = container.querySelector('#stepProgressText');
  const dtInput = container.querySelector('#auctionEndTime');

  // Dynamic Elements Caching Strategy
  const progressFill = container.querySelector('#progressFill');
  const descCountEl = container.querySelector('#descCount');
  const charCountWrapper = descCountEl?.closest('.char-count');
  const catHidden = container.querySelector('#category');
  const catDisplay = container.querySelector('#selectedCatDisplay');
  const catGrid = container.querySelector('#categoryGrid');
  const catSearch = container.querySelector('#categorySearch');

  let loadedImageAssets = []; 
  let mainCoverIndex = 0;

  const showSellerModal = (title, message, isError = false) => {
    return new Promise((resolve) => {
      const overlay = container.querySelector('#customSellerPopup');
      const iconBox = container.querySelector('#sellerPopupIcon');
      const titleEl = container.querySelector('#sellerPopupTitle');
      const msgEl = container.querySelector('#sellerPopupMessage');
      const closeBtn = container.querySelector('#sellerPopupCloseBtn');

      titleEl.textContent = title;
      msgEl.textContent = message;
      iconBox.className = isError ? "popup-icon-wrap error-state" : "popup-icon-wrap";
      iconBox.textContent = isError ? "✕" : "✓";

      requestAnimationFrame(() => {
        overlay.classList.add('show');
        closeBtn.focus();
      });

      closeBtn.onclick = () => {
        overlay.classList.remove('show');
        resolve();
      };
    });
  };

  function updateRoadmapUI(idx) {
    stepEls.forEach((s, i) => s.classList.toggle('active-step', i === idx));
    
    stepItems.forEach((item, i) => {
      item.classList.remove('active', 'done');
      if (i < idx) {
        item.classList.add('done');
      } else if (i === idx) {
        item.classList.add('active');
      }
    });

    stepLines.forEach((line, i) => {
      line.classList.toggle('filled', i < idx);
    });

    if (progressFill) {
      progressFill.style.transform = `scaleX(${(idx + 1) / TOTAL})`;
    }

    prevBtn.style.display = idx === 0 ? 'none' : 'inline-flex';
    nextBtn.style.display = idx === TOTAL - 1 ? 'none' : 'inline-flex';
    submitBtn.style.display = idx === TOTAL - 1 ? 'inline-flex' : 'none';
    progressTxt.textContent = `Step ${idx + 1} of ${TOTAL}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const validateCurrentStep = (idx) => {
    if (idx === 0) {
      const title = container.querySelector('#title').value.trim();
      const descVal = container.querySelector('#description').value.trim();
      const cat = catHidden.value;
      const cond = container.querySelector('#condition').value;
      const bid = container.querySelector('#initialBid').value;

      if (!title) { showSellerModal('Validation Alert', 'Please provide a valid product title.', true); return false; }
      if (!descVal) { showSellerModal('Validation Alert', 'Please offer a full narrative product description.', true); return false; }
      if (!cat) { showSellerModal('Validation Alert', 'Please pick a category classification from the choice grid.', true); return false; }
      if (!cond) { showSellerModal('Validation Alert', 'Please designate item wear/condition variables.', true); return false; }
      if (!bid || Number(bid) <= 0) { showSellerModal('Validation Alert', 'Starting bid value parameter metrics must be greater than zero.', true); return false; }
    }
    if (idx === 1) {
      if (loadedImageAssets.length === 0) {
        showSellerModal('Media Error', 'Please upload at least one clear photograph of your item asset to continue.', true);
        return false;
      }
    }
    if (idx === 2) {
      if (!dtInput.value) {
        showSellerModal('Timing Error', 'Please specify a target auction termination date.', true);
        return false;
      }
      if (new Date(dtInput.value).getTime() <= Date.now()) {
        showSellerModal('Timing Error', 'The target timestamp parameters must belong to a future deadline layout.', true);
        return false;
      }
    }
    return true;
  };

  stepItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (index < currentStep) {
        currentStep = index;
        updateRoadmapUI(currentStep);
      } else if (index > currentStep) {
        for (let checkIdx = currentStep; checkIdx < index; checkIdx++) {
          if (!validateCurrentStep(checkIdx)) return;
        }
        currentStep = index;
        updateRoadmapUI(currentStep);
        if (currentStep === TOTAL - 1) populateReviewSummary();
      }
    });
  });

  const desc = container.querySelector('#description');
  desc?.addEventListener('input', () => {
    const count = desc.value.length;
    descCountEl.textContent = count;
    charCountWrapper?.classList.toggle('near-limit', count > 700);
  }, { passive: true });

  nextBtn?.addEventListener('click', () => {
    if (!validateCurrentStep(currentStep)) return;
    currentStep++;
    updateRoadmapUI(currentStep);
    if (currentStep === TOTAL - 1) populateReviewSummary();
  });

  prevBtn?.addEventListener('click', () => {
    currentStep--;
    updateRoadmapUI(currentStep);
  });

  function buildGrid(filter = '') {
    if (!catGrid) return;
    catGrid.innerHTML = '';
    
    // Batch elements into a document fragment to mitigate structural layout blocks
    const fragment = document.createDocumentFragment();
    ALL_CATEGORIES.filter(c => c.toLowerCase().includes(filter.toLowerCase())).forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-chip' + (cat === catHidden.value ? ' selected' : '');
      btn.textContent = cat;
      btn.onclick = () => {
        catHidden.value = cat;
        if (catDisplay) catDisplay.textContent = cat;
        catGrid.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
      };
      fragment.appendChild(btn);
    });
    catGrid.appendChild(fragment);
  }
  
  buildGrid();
  catSearch?.addEventListener('input', () => buildGrid(catSearch.value), { passive: true });

  const durationChips = container.querySelectorAll('.dur-chip');
  if (durationChips.length && dtInput) {
    durationChips.forEach(chip => {
      chip.addEventListener('click', () => {
        durationChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        const hours = parseInt(chip.getAttribute('data-hours'), 10);
        const targetDate = new Date(Date.now() + hours * 60 * 60 * 1000);
        targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
        dtInput.value = targetDate.toISOString().slice(0, 16);
        calculateTimingPreview();
      });
    });
    dtInput.addEventListener('change', () => {
      durationChips.forEach(c => c.classList.remove('active'));
      calculateTimingPreview();
    });
  }

  function calculateTimingPreview() {
    const previewWrapper = container.querySelector('#timingPreview');
    const valueText = container.querySelector('#timingValue');
    if (!dtInput.value || !previewWrapper || !valueText) return;
    
    const deltaMs = new Date(dtInput.value).getTime() - Date.now();
    if (deltaMs <= 0) {
      valueText.textContent = "Expired Parameters";
      previewWrapper.style.display = 'block';
      return;
    }
    
    const totalMinutes = Math.floor(deltaMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const h = totalHours % 24;
    const m = totalMinutes % 60;

    let resStr = "";
    if (days > 0) resStr += `${days}d `;
    if (h > 0 || days > 0) resStr += `${h}h `;
    resStr += `${m}m`;

    valueText.textContent = resStr;
    previewWrapper.style.display = 'block';
  }

  const uploadZone = container.querySelector('.custom-file-upload');
  const fileInput = container.querySelector('#imageUploadInput');

  if (uploadZone && fileInput) {
    ['dragenter', 'dragover'].forEach(n => uploadZone.addEventListener(n, () => uploadZone.style.borderColor = '#46513f', { passive: true }));
    ['dragleave', 'drop'].forEach(n => uploadZone.addEventListener(n, () => uploadZone.style.borderColor = '#cfc0a0', { passive: true }));
    
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) handleFilesAppend(Array.from(e.dataTransfer.files));
    });
    fileInput.addEventListener('change', () => handleFilesAppend(Array.from(fileInput.files)), { passive: true });
  }

  function handleFilesAppend(files) {
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (loadedImageAssets.length + valid.length > 5) {
      showSellerModal('Limit Encountered', 'Maximum of 5 photographs are allowed per listing.', true);
      return;
    }
    valid.forEach(f => loadedImageAssets.push({ rawFile: f, previewUrl: URL.createObjectURL(f), name: f.name }));
    renderMediaLists();
  }

  function renderMediaLists() {
    const uploadedImagesContainer = container.querySelector('#uploadedImagesContainer');
    const imgPreviewSection = container.querySelector('#imgPreviewSection');
    if (!uploadedImagesContainer) return;

    uploadedImagesContainer.innerHTML = '';
    if (!loadedImageAssets.length) { imgPreviewSection.style.display = 'none'; return; }
    imgPreviewSection.style.display = 'block';

    const frag = document.createDocumentFragment();
    loadedImageAssets.forEach((asset, idx) => {
      const isMain = idx === mainCoverIndex;
      const row = document.createElement('div');
      row.className = 'uploaded-image-row';
      row.innerHTML = `
        <div class="uploaded-info-side">
          <img class="url-preview-thumb loaded" src="${asset.previewUrl}" alt="Preview Asset Thumbnail" width="44" height="44" decoding="async">
          <span class="uploaded-filename">${asset.name} ${isMain ? '★ (Cover)' : ''}</span>
        </div>
        <button type="button" class="cat-chip ${isMain ? 'selected' : ''}" style="font-size:11px;">Set Cover</button>
      `;
      
      row.querySelector('button').onclick = () => { mainCoverIndex = idx; renderMediaLists(); };
      frag.appendChild(row);
    });
    uploadedImagesContainer.appendChild(frag);

    container.querySelector('#imgPreviewMain').src = loadedImageAssets[mainCoverIndex].previewUrl;
  }

  function populateReviewSummary() {
    container.querySelector('#reviewTitle').textContent = container.querySelector('#title').value;
    container.querySelector('#reviewCategory').textContent = catHidden.value;
    container.querySelector('#reviewCondition').textContent = container.querySelector('#condition').value;
    container.querySelector('#reviewPrice').textContent = `₹${parseFloat(container.querySelector('#initialBid').value || 0).toLocaleString('en-IN')}`;
    container.querySelector('#reviewDescFull').textContent = desc.value;
    container.querySelector('#reviewDesc').textContent = desc.value.substring(0, 120) + '...';
    container.querySelector('#reviewSeller').textContent = session?.name || 'Seller Studio';
    container.querySelector('#reviewMainImg').src = loadedImageAssets[mainCoverIndex]?.previewUrl || '';
    container.querySelector('#reviewMainPlaceholder').style.display = loadedImageAssets.length ? 'none' : 'block';

    const thumbsContainer = container.querySelector('#reviewThumbs');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = '';
      const thumbFrag = document.createDocumentFragment();
      loadedImageAssets.forEach((asset, idx) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'rev-thumb' + (idx === mainCoverIndex ? ' active' : '');
        thumbDiv.innerHTML = `<img src="${asset.previewUrl}" alt="Gallery Miniature Specimen" width="44" height="44" decoding="async">`;
        thumbDiv.onclick = () => {
          thumbsContainer.querySelectorAll('.rev-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
          container.querySelector('#reviewMainImg').src = asset.previewUrl;
        };
        thumbFrag.appendChild(thumbDiv);
      });
      thumbsContainer.appendChild(thumbFrag);
    }
  }

  container.querySelector('#sellerForm').onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing listing assets...';

    const products = getProducts();
    const mockUploadedLinks = loadedImageAssets.map((asset, i) => `https://vaultora.s3.ap-south-1.amazonaws.com/asset_data/p_mock_${i}.webp`);

    const newProduct = {
      id: `p${Date.now()}`,
      title: container.querySelector('#title').value.trim(),
      category: catHidden.value,
      description: desc.value.trim(),
      image: mockUploadedLinks[mainCoverIndex] || mockUploadedLinks[0],
      images: mockUploadedLinks,
      condition: container.querySelector('#condition').value,
      price: parseFloat(container.querySelector('#initialBid').value),
      currentBid: parseFloat(container.querySelector('#initialBid').value),
      bids: 0,
      seller: session.name,
      sellerEmail: session.email.toLowerCase(),
      endTime: new Date(dtInput.value).toISOString(),
      createdAt: new Date().toISOString(),
      auctionStatus: 'active'
    };

    products.push(newProduct);
    await saveProducts(products);
    
    await showSellerModal('Asset Published', 'Your listing has been populated into the alternative asset registry pools.');
    window.location.href = 'dashboard';
  };
}