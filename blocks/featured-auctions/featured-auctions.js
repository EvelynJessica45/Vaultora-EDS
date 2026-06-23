/**
 * Decorates the featured-auctions block matching editorial layout conventions
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 3) return;

  // Extract Config Matrix Headers
  const titleText = rows[0]?.innerText?.trim();
  const descText = rows[1]?.innerText?.trim();
  const placeholderText = rows[2]?.innerText?.trim() || 'Search auctions...';

  // Build high-end header matching the editorial style
  const headerContainer = document.createElement('div');
  headerContainer.className = 'featured-auctions-header-editorial';

  if (titleText) {
    const title = document.createElement('h2');
    const words = titleText.split(' ');
    if (words.length > 1) {
      const lastWord = words.pop();
      title.innerHTML = `${words.join(' ')} <span>${lastWord}</span>`;
    } else {
      title.textContent = titleText;
    }
    headerContainer.append(title);
  }

  if (descText) {
    const desc = document.createElement('p');
    desc.className = 'featured-auctions-desc';
    desc.textContent = descText;
    headerContainer.append(desc);
  }

  // ── UNIFIED FILTER & SEARCH CONTROL ROW BAR ──
  const actionControlsRow = document.createElement('div');
  actionControlsRow.className = 'featured-auctions-controls-bar';

  const searchContainer = document.createElement('div');
  searchContainer.className = 'featured-auctions-search';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = placeholderText;
  searchInput.className = 'featured-auctions-input';

  const searchButton = document.createElement('button');
  searchButton.className = 'featured-auctions-search-btn';
  searchButton.setAttribute('aria-label', 'Search');
  searchButton.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  searchContainer.append(searchInput, searchButton);

  // Dynamic Horizontal Filter Quick Chips
  const filtersContainer = document.createElement('div');
  filtersContainer.className = 'featured-auctions-quick-chips';

  const filterOptions = [
    { label: 'Latest', type: 'latest' },
    { label: 'High Bids', type: 'high-bids' },
    { label: 'Low Price', type: 'low-price' },
  ];

  filterOptions.forEach((option, idx) => {
    const filterBtn = document.createElement('button');
    filterBtn.className = `filter-chip${idx === 0 ? ' is-active' : ''}`;
    filterBtn.textContent = option.label;
    filterBtn.dataset.filter = option.type;
    filtersContainer.append(filterBtn);
  });

  // Nest both components safely next to each other inside the unified engine row
  actionControlsRow.append(searchContainer, filtersContainer);
  headerContainer.append(actionControlsRow);

  // Dynamic 5-Card High-Density Processing Grid
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'featured-auctions-grid-five';

  const cardRows = rows.slice(3);
  const cardElementsArray = [];

  for (let i = 0; i < cardRows.length; i += 2) {
    const mainRow = cardRows[i];
    const metaRow = cardRows[i + 1];
    if (!mainRow) break;

    const card = document.createElement('div');
    card.className = 'featured-auctions-editorial-card';

    const imgCol = mainRow.children[0];
    const titleCol = mainRow.children[1];
    const authorCol = metaRow ? metaRow.children[0] : null;
    const priceCol = metaRow ? metaRow.children[1] : null;

    const priceText = priceCol ? priceCol.innerText.trim() : '0';
    const rawPriceNum = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    
    card.dataset.price = rawPriceNum;
    card.dataset.index = i / 2; // Serves as the tracking map for chronological author sorting ("Latest")

    // Image Arch Frame
    const imageWrap = document.createElement('div');
    imageWrap.className = 'card-image-arch-frame';
    if (imgCol && imgCol.querySelector('img')) {
      imageWrap.append(imgCol.querySelector('img'));
    }

    // Copy Content Structure
    const detailsWrap = document.createElement('div');
    detailsWrap.className = 'card-editorial-details';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-editorial-title';
    cardTitle.textContent = titleCol ? titleCol.innerText.trim() : '';

    const cardAuthor = document.createElement('p');
    cardAuthor.className = 'card-editorial-author';
    cardAuthor.textContent = authorCol ? authorCol.innerText.trim() : '';

    // Actions Integration Layout Row
    const actionRow = document.createElement('div');
    actionRow.className = 'card-editorial-action-row';

    const cardPrice = document.createElement('span');
    cardPrice.className = 'card-editorial-price';
    cardPrice.textContent = priceText;

    const actionButtons = document.createElement('div');
    actionButtons.className = 'card-editorial-buttons';

    const bidBtn = document.createElement('button');
    bidBtn.className = 'card-editorial-btn-bid';
    bidBtn.textContent = 'Bid';

    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'card-editorial-btn-fav';
    favoriteBtn.setAttribute('aria-label', 'Add to favorites');
    favoriteBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;

    actionButtons.append(bidBtn, favoriteBtn);
    actionRow.append(cardPrice, actionButtons);

    detailsWrap.append(cardTitle, cardAuthor, actionRow);
    card.append(imageWrap, detailsWrap);
    
    cardsGrid.append(card);
    cardElementsArray.push(card);
  }

  // ── CONTROL SORT OPERATION LOGICS ──
  filtersContainer.addEventListener('click', (e) => {
    const clickedChip = e.target.closest('.filter-chip');
    if (!clickedChip) return;

    filtersContainer.querySelectorAll('.filter-chip').forEach((btn) => btn.classList.remove('is-active'));
    clickedChip.classList.add('is-active');

    const mode = clickedChip.dataset.filter;

    if (mode === 'high-bids') {
      cardElementsArray.sort((a, b) => b.dataset.price - a.dataset.price);
    } else if (mode === 'low-price') {
      cardElementsArray.sort((a, b) => a.dataset.price - b.dataset.price);
    } else {
      // Default: Latest (Order authored inside the CMS layout table)
      cardElementsArray.sort((a, b) => a.dataset.index - b.dataset.index);
    }

    cardElementsArray.forEach((card) => cardsGrid.append(card));
  });

  // Swap markup structures safely
  block.textContent = '';
  block.append(headerContainer, cardsGrid);
}