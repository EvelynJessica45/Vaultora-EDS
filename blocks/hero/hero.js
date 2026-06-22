export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // 1. Gather picture instances safely
  const pictures = block.querySelectorAll('picture');
  const bgPicture = pictures[0] ? pictures[0].cloneNode(true) : null;
  const cardPicture = pictures[1] ? pictures[1].cloneNode(true) : null;

  // 2. Strict DOM Mapping coordinates
  const row1Col1 = rows[0]?.children[0]; 
  const row1Col2 = rows[0]?.children[1]; 
  const row2Col1 = rows[1]?.children[0]; 

  // Parse Badge info text blocks
  const leftParas = row1Col1 ? [...row1Col1.querySelectorAll('p')] : [];
  const badgeTagText = leftParas.find(p => p.querySelector('code'))?.innerText.trim() || 'NEW DROPS DAILY';
  const badgeSubText = leftParas.find(p => p.innerText.includes('products listed'))?.innerText.trim() || '25,000+ products listed';

  // Parse Card properties safely
  const cardParas = row1Col2 ? [...row1Col2.querySelectorAll('p')] : [];
  const cardStatus = cardParas.find(p => p.innerText.includes('LIVE AUCTION'))?.innerText.trim() || 'LIVE AUCTION';
  const cardTitle = row1Col2?.querySelector('strong')?.innerText.trim() || '1960s Heritage Chronograph';
  const cardPrice = cardParas.find(p => p.innerText.startsWith('$') || p.innerText.includes('2,450'))?.innerText.trim() || '$2,450';
  const cardTimer = cardParas.find(p => p.querySelector('code') && p.innerText.includes(':'))?.innerText.trim() || '02:14:09';

  // FIX: Force description text capture explicitly under the card
  let descriptionText = 'From vintage collectibles and luxury fashion to electronics and home décor; discover unique products, list your own items, or compete in live auctions.';
  if (row2Col1) {
    const customDesc = row2Col1.querySelector('p')?.innerText.trim();
    if (customDesc && !customDesc.includes('Column 1') && customDesc.length > 20) {
      descriptionText = customDesc;
    }
  }

  // Parse button links out of cell wrappers dynamically
  const actionLinks = [];
  if (row2Col1) {
    row2Col1.querySelectorAll('a').forEach(a => actionLinks.push(a.cloneNode(true)));
    if (actionLinks.length === 0) {
      row2Col1.querySelectorAll('em, p').forEach(el => {
        const txt = el.innerText.replace(/[\[\]]/g, '').trim();
        if (txt.includes('Bidding') || txt.includes('Start') || txt.includes('Item') || txt.includes('Sell')) {
          const mockBtn = document.createElement('a');
          mockBtn.href = '#';
          mockBtn.textContent = txt.replace('Button Link', '').trim();
          actionLinks.push(mockBtn);
        }
      });
    }
  }

  // Parse statistics and map to Rupees
  const statsList = [];
  rows.slice(2).forEach((row) => {
    [...row.children].forEach((cell) => {
      let strongVal = cell.querySelector('strong')?.innerHTML || '';
      const labelVal = cell.innerText.replace(cell.querySelector('strong')?.innerText || '', '').trim();
      
      if (strongVal && labelVal && !labelVal.includes('Keep this cell')) {
        // Convert $8.2M+ to ₹70Cr+ or keep internationalized Rupees notation
        if (strongVal.includes('$8.2M')) {
          strongVal = '₹70Cr+';
        }
        statsList.push({ number: strongVal, label: labelVal });
      }
    });
  });

  // --- 3. REBUILD INJECTED DOM WORKSPACE ---
  block.innerHTML = '';

  // Inject full width background canvas
  if (bgPicture) {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'hero-bg-canvas';
    bgContainer.appendChild(bgPicture);
    block.appendChild(bgContainer);
  }

  const innerContainer = document.createElement('div');
  innerContainer.className = 'hero-inner-container';

  // Ribbon Navigation header text
  const ribbon = document.createElement('div');
  ribbon.className = 'hero-top-ribbon';
  ribbon.textContent = 'BUY • SELL • BID • DISCOVER';
  innerContainer.appendChild(ribbon);

  // Responsive Grid Split Panel
  const splitGrid = document.createElement('div');
  splitGrid.className = 'hero-split-grid';

  // Assemble Left Panel with Line-by-Line Headline Breakdown
  const leftPanel = document.createElement('div');
  leftPanel.className = 'hero-left-panel';
  leftPanel.innerHTML = `
    <div class="hero-badge-wrapper">
      <span class="hero-badge-pill">${badgeTagText}</span>
      <span class="hero-badge-info">${badgeSubText}</span>
    </div>
    <h1 class="hero-main-title">
      <span class="title-line">BUY, SELL &</span>
      <span class="title-line">BID ON</span>
      <span class="title-line gold-font">Extraordinary</span>
      <span class="title-line">FINDS</span>
    </h1>
  `;
  splitGrid.appendChild(leftPanel);

  // Assemble Right Panel (Card -> Description -> Buttons -> Stats Footer)
  const rightPanel = document.createElement('div');
  rightPanel.className = 'hero-right-panel';

  const auctionCard = document.createElement('div');
  auctionCard.className = 'hero-auction-card';
  auctionCard.innerHTML = `
    <span class="card-status-pill">${cardStatus}</span>
    <div class="card-image-box"></div>
    <h3 class="card-item-title">${cardTitle}</h3>
    <div class="card-meta-flex">
      <span class="card-meta-price">${cardPrice}</span>
      <span class="card-meta-timer">${cardTimer}</span>
    </div>
  `;
  if (cardPicture) auctionCard.querySelector('.card-image-box').appendChild(cardPicture);

  const textZone = document.createElement('div');
  textZone.className = 'hero-text-zone';
  textZone.innerHTML = `<p class="hero-main-desc">${descriptionText}</p>`;

  const actionsRow = document.createElement('div');
  actionsRow.className = 'hero-actions-wrapper';
  actionLinks.forEach((btn, index) => {
    btn.className = index === 0 ? 'hero-btn primary' : 'hero-btn secondary';
    actionsRow.appendChild(btn);
  });
  
  if (actionLinks.length === 0) {
    actionsRow.innerHTML = `
      <a href="#" class="hero-btn primary">Start Bidding</a>
      <a href="#" class="hero-btn secondary">Sell an Item</a>
    `;
  }
  textZone.appendChild(actionsRow);

  // Inject metrics list inside the right text area zone beneath the buttons
  if (statsList.length > 0) {
    const statsFlexRow = document.createElement('div');
    statsFlexRow.className = 'hero-right-stats-row';
    statsList.forEach(stat => {
      const box = document.createElement('div');
      box.className = 'stat-metric-box';
      box.innerHTML = `<h3>${stat.number}</h3><p>${stat.label}</p>`;
      statsFlexRow.appendChild(box);
    });
    textZone.appendChild(statsFlexRow);
  }

  rightPanel.append(auctionCard, textZone);
  splitGrid.appendChild(rightPanel);
  innerContainer.appendChild(splitGrid);
  block.appendChild(innerContainer);
}