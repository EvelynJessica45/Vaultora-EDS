/*
 * auctionfilters.js
 * Consolidated Dynamic Control Station: Automatically extracts Category tabs, 
 * Price ranges, and Seller metrics directly from live cloud database products.
 * Drop down filters normalized to match auctionproducts array listening tracks.
 */

import { getProducts } from '../../scripts/storage.js';

const FILTER_EVENT = 'auctionfilters:change';
const SEARCH_SORT_EVENT = 'auctionlisting:state-change';

let currentCategory = 'all';
let minPriceValue = 0;
let maxPriceValue = 50000000;

function formatRupees(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function buildCheckboxGroup(name, options, { allLabel } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'auctionfilters-checkgroup';
  const list = document.createElement('div');
  list.className = 'auctionfilters-checklist';
  const state = new Set();

  const makeRow = (value, isAll = false) => {
    const row = document.createElement('label');
    row.className = 'auctionfilters-check-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.value = value;
    if (isAll) input.checked = true;

    const span = document.createElement('span');
    span.textContent = value;
    row.append(input, span);
    return { row, input };
  };

  let allInput = null;
  if (allLabel) {
    const { row, input } = makeRow(allLabel, true);
    row.classList.add('auctionfilters-check-row--all');
    allInput = input;
    list.append(row);
  }

  const optionInputs = [];
  options.forEach((opt) => {
    const { row, input } = makeRow(opt);
    list.append(row);
    optionInputs.push(input);
  });

  function emit() {
    document.dispatchEvent(new CustomEvent(FILTER_EVENT, {
      detail: { group: name, values: Array.from(state) },
    }));
  }

  if (allInput) {
    allInput.addEventListener('change', () => {
      if (allInput.checked) {
        optionInputs.forEach((inp) => { inp.checked = false; });
        state.clear();
        emit();
      } else {
        allInput.checked = true;
      }
    });
  }

  optionInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        state.add(input.value);
        if (allInput) allInput.checked = false;
      } else {
        state.delete(input.value);
        if (allInput && state.size === 0) allInput.checked = true;
      }
      emit();
    });
  });

  wrap.append(list);
  return wrap;
}

export default function decorate(block) {
  const dbProducts = getProducts() || [];

  const categories = [...new Set(dbProducts.map(p => p.category).filter(Boolean))].sort();

  block.textContent = '';

  const panel = document.createElement('div');
  panel.className = 'auctionfilters-panel';

  const headingRow = document.createElement('div');
  headingRow.className = 'auctionfilters-header-row';

  const heading = document.createElement('div');
  heading.className = 'auctionfilters-heading';
  heading.textContent = 'Filters & Sorting';
  headingRow.append(heading);
  panel.append(headingRow);

  // ── SORT SECTION ──
  const sortSection = document.createElement('div');
  sortSection.className = 'auctionfilters-section auctionfilters-sort-section';
  
  const sortLabel = document.createElement('div');
  sortLabel.className = 'auctionfilters-section-label';
  sortLabel.textContent = 'Sort Order';

  const sortSelectWrap = document.createElement('div');
  sortSelectWrap.className = 'auctionfilters-select-wrapper';

  const sortSelect = document.createElement('select');
  sortSelect.className = 'auctionfilters-sort-dropdown';
  
  const sortOptions = ['default', 'price_asc', 'price_desc', 'bids_desc', 'bids_asc', 'ending_soon'];
  const sortLabels = {
    'default': 'Newest Additions',
    'price_asc': 'Price: Low to High',
    'price_desc': 'Price: High to Low',
    'bids_desc': 'Most Bids',
    'bids_asc': 'Least Bids',
    'ending_soon': 'Ending Soon'
  };

  sortOptions.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = sortLabels[opt];
    sortSelect.append(option);
  });

  sortSelect.addEventListener('change', () => {
    document.dispatchEvent(new CustomEvent(FILTER_EVENT, {
      detail: { group: 'sort', value: sortSelect.value }
    }));
  });

  sortSelectWrap.append(sortSelect);
  sortSection.append(sortLabel, sortSelectWrap);
  panel.append(sortSection);

  // ── PRICE RANGE DUAL SLIDER SYSTEM ──
  const rangeSection = document.createElement('div');
  rangeSection.className = 'auctionfilters-section';
  
  const rangeTitle = document.createElement('div');
  rangeTitle.className = 'auctionfilters-section-label';
  rangeTitle.textContent = 'Price Range (₹)';

  const pillRow = document.createElement('div');
  pillRow.className = 'auctionfilters-range-pills';
  const minPill = document.createElement('span');
  minPill.className = 'auctionfilters-range-pill';
  const maxPill = document.createElement('span');
  maxPill.className = 'auctionfilters-range-pill';
  pillRow.append(minPill, maxPill);

  const track = document.createElement('div');
  track.className = 'auctionfilters-slider-track';
  track.id = 'sliderTrack';

  const minInput = document.createElement('input');
  minInput.type = 'range';
  minInput.min = '0';
  minInput.max = '50000000';
  minInput.value = '0';
  minInput.className = 'auctionfilters-slider auctionfilters-slider--min';

  const maxInput = document.createElement('input');
  maxInput.type = 'range';
  maxInput.min = '0';
  maxInput.max = '50000000';
  maxInput.value = '50000000';
  maxInput.className = 'auctionfilters-slider auctionfilters-slider--max';
  track.append(minInput, maxInput);

  const inputRow = document.createElement('div');
  inputRow.className = 'auctionfilters-range-inputs';
  const minField = document.createElement('input');
  minField.type = 'number';
  minField.className = 'auctionfilters-range-numinput';
  minField.value = '0';
  
  const toLabel = document.createElement('span');
  toLabel.className = 'auctionfilters-range-to';
  toLabel.textContent = 'to';
  
  const maxField = document.createElement('input');
  maxField.type = 'number';
  maxField.className = 'auctionfilters-range-numinput';
  maxField.value = '50000000';
  inputRow.append(minField, toLabel, maxField);

  const updateSliderTrack = () => {
    const minPercent = (minInput.value / minInput.max) * 100;
    const maxPercent = (maxInput.value / maxInput.max) * 100;
    track.style.background = `linear-gradient(to right, var(--nav-circle-bg) ${minPercent}%, var(--nav-text-gold) ${minPercent}%, var(--nav-text-gold) ${maxPercent}%, var(--nav-circle-bg) ${maxPercent}%)`;
    
    minPill.textContent = formatRupees(minInput.value);
    maxPill.textContent = formatRupees(maxInput.value);
    
    minPriceValue = parseFloat(minInput.value);
    maxPriceValue = parseFloat(maxInput.value);

    document.dispatchEvent(new CustomEvent(FILTER_EVENT, { 
      detail: { group: 'bid', min: minPriceValue, max: maxPriceValue } 
    }));
  };

  minInput.addEventListener('input', () => {
    if (parseInt(maxInput.value) - parseInt(minInput.value) < 10) minInput.value = parseInt(maxInput.value) - 10;
    minField.value = minInput.value;
    updateSliderTrack();
  });

  maxInput.addEventListener('input', () => {
    if (parseInt(maxInput.value) - parseInt(minInput.value) < 10) maxInput.value = parseInt(minInput.value) + 10;
    maxField.value = maxInput.value;
    updateSliderTrack();
  });

  minField.addEventListener('change', () => {
    let val = Math.max(0, Math.min(parseFloat(minField.value) || 0, maxPriceValue - 10));
    minField.value = val;
    minInput.value = val;
    updateSliderTrack();
  });

  maxField.addEventListener('change', () => {
    let val = Math.min(50000000, Math.max(parseFloat(maxField.value) || 50000000, minPriceValue + 10));
    maxField.value = val;
    maxInput.value = val;
    updateSliderTrack();
  });

  rangeSection.append(rangeTitle, pillRow, track, inputRow);
  panel.append(rangeSection);
  setTimeout(updateSliderTrack, 50);

  // ── DYNAMIC CATEGORIES CHECKBOXES ──
  if (categories.length) {
    const section = document.createElement('div');
    section.className = 'auctionfilters-section';
    const label = document.createElement('div');
    label.className = 'auctionfilters-section-label';
    label.textContent = 'Category';
    section.append(label, buildCheckboxGroup('category', categories, { allLabel: 'All Categories' }));
    panel.append(section);
  }

  // ── SELLER QUALITY TRUST MODULE ──
  const sellerSection = document.createElement('div');
  sellerSection.className = 'auctionfilters-section';
  const sellerLabel = document.createElement('div');
  sellerLabel.className = 'auctionfilters-section-label';
  sellerLabel.textContent = 'Seller Status';
  
  const sWrap = document.createElement('div');
  sWrap.className = 'auctionfilters-checklist';
  sWrap.innerHTML = `
    <label class="auctionfilters-check-row"><input type="radio" name="sellerFilter" value="all" checked /><span>All Sellers</span></label>
    <label class="auctionfilters-check-row"><input type="radio" name="sellerFilter" value="good" /><span>✦ Premium Verified</span></label>
  `;
  sWrap.querySelectorAll('input').forEach(rad => {
    rad.addEventListener('change', () => {
      document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { group: 'seller', value: rad.value } }));
    });
  });
  sellerSection.append(sellerLabel, sWrap);
  panel.append(sellerSection);

  // ── FIXED RESET FUNCTION ──
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'auctionfilters-reset';
  resetBtn.textContent = 'Reset Filters';
  resetBtn.addEventListener('click', () => {
    // 1. Alert the products block to clear out active states[cite: 15]
    document.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { reset: true } }));
    
    // 2. Clear out inputs in place rather than deleting the DOM nodes
    sortSelect.value = 'default';
    minInput.value = '0';
    maxInput.value = '50000000';
    minField.value = '0';
    maxField.value = '50000000';
    sWrap.querySelector('input[value="all"]').checked = true;

    // Uncheck categories and check "All"
    panel.querySelectorAll('input[name="category"]').forEach(inp => inp.checked = false);
    const allCatInp = panel.querySelector('.auctionfilters-check-row--all input');
    if (allCatInp) allCatInp.checked = true;

    // Reset layout backgrounds
    updateSliderTrack();
  });
  panel.append(resetBtn);

  block.append(panel);

  // ── FIXED DYNAMIC SEARCH INPUT EVENT HOOKS ──
  document.addEventListener(SEARCH_SORT_EVENT, (e) => {
    if (e.detail.search && e.detail.search.trim() !== '') {
      panel.querySelectorAll('input[name="category"]').forEach((input) => {
        input.checked = false;
      });
      
      const allCategoriesInput = panel.querySelector('.auctionfilters-check-row--all input');
      if (allCategoriesInput) {
        allCategoriesInput.checked = true;
      }
    }
  });
}