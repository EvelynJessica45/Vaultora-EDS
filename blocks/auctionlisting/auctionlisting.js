/*
 * auctionlisting.js
 * Clean header text querying console block. Integrates with storage layers,
 * features quick input clear tracking links, and a state-aware toggle button.
 */

function getFieldMap(block) {
  const map = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = cells[0].textContent.trim().toLowerCase();
    const value = cells[1];
    map[label] = value.textContent.trim();
  });
  return map;
}

const STATE_EVENT = 'auctionlisting:state-change';

function renderAccentedTitle(h1, title) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    h1.textContent = title;
    return;
  }
  const lastWord = words.pop();
  h1.append(`${words.join(' ')} `);
  const span = document.createElement('span');
  span.className = 'gold-word';
  span.textContent = lastWord;
  h1.append(span);
}

export default function decorate(block) {
  const fields = getFieldMap(block);
  const title = fields.title || 'Product Listings';
  const subtitle = fields.subtitle || '';
  const searchPlaceholder = fields['search placeholder'] || 'Search luxury auctions...';

  block.textContent = '';

  const header = document.createElement('div');
  header.className = 'auctionlisting-header';

  const titleRow = document.createElement('div');
  titleRow.className = 'auctionlisting-title-row';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'auctionlisting-title-wrap';

  const h1 = document.createElement('h1');
  h1.className = 'auctionlisting-title';
  renderAccentedTitle(h1, title);
  titleWrap.append(h1);

  if (subtitle) {
    const sub = document.createElement('p');
    sub.className = 'auctionlisting-subtitle';
    sub.id = 'pageSubtitle';
    sub.textContent = subtitle;
    titleWrap.append(sub);
  }

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'auctionlisting-actions-container';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'auctionlisting-search';
  searchWrap.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"></circle>
      <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    </svg>
  `;
  
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.id = 'searchInput';
  searchInput.placeholder = searchPlaceholder;
  searchInput.setAttribute('aria-label', searchPlaceholder);
  searchInput.className = 'auctionlisting-search-input';
  
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
//   clearBtn.id = 'clearSearchBtn';
  clearBtn.className = 'btn-clear-search';
  clearBtn.innerHTML = '&#x2715;';
  
  searchWrap.append(searchInput, clearBtn);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'auctionlisting-toggle-filters-btn';
  toggleBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
    <span class="btn-label-text">Hide Filters</span>
  `;

  actionsContainer.append(searchWrap, toggleBtn);
  titleRow.append(titleWrap, actionsContainer);

  const metaRow = document.createElement('div');
  metaRow.className = 'auctionlisting-meta-row';

  const results = document.createElement('div');
  results.className = 'auctionlisting-results';
  metaRow.append(results);

  header.append(titleRow, metaRow);
  block.append(header);

  // Hooking up the Clear button interaction pass
  const toggleClearBtnVisibility = () => {
    clearBtn.classList.toggle('visible', searchInput.value.length > 0);
  };

  const dispatchState = () => {
    document.dispatchEvent(new CustomEvent(STATE_EVENT, {
      detail: { search: searchInput.value.trim().toLowerCase() },
    }));
  };

  toggleBtn.addEventListener('click', () => {
    const container = block.closest('.section');
    const label = toggleBtn.querySelector('.btn-label-text');
    if (container) {
      container.classList.toggle('sidebar-closed');
      const isClosed = container.classList.contains('sidebar-closed');
      label.textContent = isClosed ? 'Show Filters' : 'Hide Filters';
      toggleBtn.classList.toggle('is-inactive', isClosed);
    }
  });

  let debounceId;
  searchInput.addEventListener('input', () => {
    toggleClearBtnVisibility();
    clearTimeout(debounceId);
    debounceId = setTimeout(dispatchState, 200);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    toggleClearBtnVisibility();
    dispatchState();
    searchInput.focus();
  });
  
  // Listen for local state clean alerts from category shifts
  document.addEventListener(STATE_EVENT, (e) => {
     if(e.detail.search === '') {
        searchInput.value = '';
        toggleClearBtnVisibility();
     }
  });
}