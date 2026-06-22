export default function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';
  block.classList.add('how-it-works-container');

  // 1. Build the Top Centered Header
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'how-main-header';
  sectionHeader.innerHTML = `
    <h2>How Vaultora <span>Works</span></h2>
    <p>Your transparent gateway to elite luxury asset acquisitions.</p>
  `;
  block.appendChild(sectionHeader);

  // 2. Build the Premium SVG Toggle Control Switch
  const toggleWrapper = document.createElement('div');
  toggleWrapper.className = 'how-toggle-wrapper';
  toggleWrapper.innerHTML = `
    <span class="how-toggle-label label-bidders active">Buyers & Bidders</span>
    <button class="how-custom-switch" id="how-role-toggle" aria-label="Toggle role perspective">
      <div class="how-switch-thumb">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 11v 8A2 2 0 0 0 9 21h6a2 2 0 0 0 2-2v-8"></path>
          <path d="M9 12h6"></path>
          <path d="M12 2v9"></path>
          <path d="m19 8-7-6-7 6"></path>
        </svg>
      </div>
    </button>
    <span class="how-toggle-label label-auctioneers">Sellers & Auctioneers</span>
  `;
  block.appendChild(toggleWrapper);

  // 3. Structural Central Timeline Track
  const timelineTrack = document.createElement('div');
  timelineTrack.className = 'how-central-timeline-track';

  let bidderIndex = 1;
  let auctioneerIndex = 1;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const roleTag = cells[0].textContent.trim().toLowerCase();
    const contentBox = cells[1];

    // Cleanly isolate heading and descriptions
    const fullHeading = contentBox.querySelector('h3, p strong, strong')?.textContent || 'Step';
    const cleanedTitle = fullHeading.includes('/') ? fullHeading.split('/')[1].trim() : fullHeading.replace(/[0-9]/g, '').replace(/[^\w\s]/g, '').trim();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentBox.innerHTML;
    const headerElement = tempDiv.querySelector('h3, strong');
    if (headerElement) headerElement.remove();
    const stepDescription = tempDiv.textContent.replace(/\//g, '').trim();

    const isBidder = roleTag.includes('bidder') || roleTag.includes('buy');
    
    // Assign index based on role, then choose its side
    let currentNumStr = '';
    let sideClass = '';
    
    if (isBidder) {
      currentNumStr = String(bidderIndex++).padStart(2, '0');
      // Alternate left/right for bidders: 01 Left, 02 Right, etc.
      sideClass = (parseInt(currentNumStr) % 2 !== 0) ? 'pos-left' : 'pos-right';
    } else {
      currentNumStr = String(auctioneerIndex++).padStart(2, '0');
      // Alternate left/right for auctioneers mirror match
      sideClass = (parseInt(currentNumStr) % 2 !== 0) ? 'pos-left' : 'pos-right';
    }

    // Build the node row
    const nodeRow = document.createElement('div');
    nodeRow.className = `how-timeline-node-row ${sideClass}`;
    nodeRow.setAttribute('data-role', isBidder ? 'bidders' : 'auctioneers');
    
    // Default hidden logic
    if (!isBidder) {
      nodeRow.classList.add('is-hidden');
    }

    nodeRow.innerHTML = `
      <div class="how-central-axis-badge">
        <span class="how-center-number">${currentNumStr}</span>
      </div>
      <div class="how-timeline-content-card">
        <span class="how-role-micro-badge">${isBidder ? 'Buyer & Bidder' : 'Seller & Auctioneer'}</span>
        <h4>${cleanedTitle}</h4>
        <p>${stepDescription}</p>
      </div>
    `;

    timelineTrack.appendChild(nodeRow);
  });

  block.appendChild(timelineTrack);

  // --- INTERACTIVE SWITCH EVENT LISTENER ---
  const toggleBtn = toggleWrapper.querySelector('#how-role-toggle');
  const labelBidders = toggleWrapper.querySelector('.label-bidders');
  const labelAuctioneers = toggleWrapper.querySelector('.label-auctioneers');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = toggleBtn.classList.toggle('switched-active');
      const activeRole = isActive ? 'auctioneers' : 'bidders';

      // Toggle text labels opacity highlights
      labelBidders.classList.toggle('active', !isActive);
      labelAuctioneers.classList.toggle('active', isActive);

      // Filter roadmap timeline records
      const items = timelineTrack.querySelectorAll('.how-timeline-node-row');
      items.forEach((item) => {
        const itemRole = item.getAttribute('data-role');
        if (itemRole === activeRole) {
          item.classList.remove('is-hidden');
        } else {
          item.classList.add('is-hidden');
        }
      });
    });
  }
}