export default function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';
  block.classList.add('how-it-works-container');

  // ── Overall two-column layout shell ──
  const layout = document.createElement('div');
  layout.className = 'how-layout';

  // ── LEFT: intro copy + role toggle ──
  const intro = document.createElement('div');
  intro.className = 'how-intro';
  intro.innerHTML = `
    <h2>How Vaultora <span>Works</span></h2>
    <p>Your transparent gateway to elite luxury asset acquisitions.</p>
    <div class="how-toggle-wrapper">
      <span class="how-toggle-label label-bidders active">Buyers</span>
      <button class="how-custom-switch" id="how-role-toggle" aria-label="Toggle role perspective">
        <div class="how-switch-thumb">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 11v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8"></path>
            <path d="M9 12h6"></path>
            <path d="M12 2v9"></path>
            <path d="m19 8-7-6-7 6"></path>
          </svg>
        </div>
      </button>
      <span class="how-toggle-label label-auctioneers">Sellers</span>
    </div>
  `;
  layout.appendChild(intro);

  // ── RIGHT: compact single-line roadmap ──
  const timelinePanel = document.createElement('div');
  timelinePanel.className = 'how-timeline-panel';

  const timelineTrack = document.createElement('div');
  timelineTrack.className = 'how-central-timeline-track';

  let bidderIndex = 1;
  let auctioneerIndex = 1;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const roleTag = cells[0].textContent.trim().toLowerCase();
    const contentBox = cells[1];

    const fullHeading = contentBox.querySelector('h3, p strong, strong')?.textContent || 'Step';
    const cleanedTitle = fullHeading.includes('/')
      ? fullHeading.split('/')[1].trim()
      : fullHeading.replace(/[0-9]/g, '').replace(/[^\w\s&]/g, '').trim();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentBox.innerHTML;
    const headerElement = tempDiv.querySelector('h3, strong');
    if (headerElement) headerElement.remove();
    const stepDescription = tempDiv.textContent.replace(/\//g, '').trim();

    const isBidder = roleTag.includes('bidder') || roleTag.includes('buy');
    const currentNumStr = isBidder
      ? String(bidderIndex++).padStart(2, '0')
      : String(auctioneerIndex++).padStart(2, '0');

    const nodeRow = document.createElement('div');
    nodeRow.className = 'how-timeline-node-row';
    nodeRow.setAttribute('data-role', isBidder ? 'bidders' : 'auctioneers');

    if (!isBidder) nodeRow.classList.add('is-hidden');

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

  timelinePanel.appendChild(timelineTrack);
  layout.appendChild(timelinePanel);
  block.appendChild(layout);

  // ── Toggle behavior ──
  const toggleBtn = intro.querySelector('#how-role-toggle');
  const labelBidders = intro.querySelector('.label-bidders');
  const labelAuctioneers = intro.querySelector('.label-auctioneers');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = toggleBtn.classList.toggle('switched-active');
      const activeRole = isActive ? 'auctioneers' : 'bidders';

      labelBidders.classList.toggle('active', !isActive);
      labelAuctioneers.classList.toggle('active', isActive);

      timelineTrack.querySelectorAll('.how-timeline-node-row').forEach((item) => {
        item.classList.toggle('is-hidden', item.getAttribute('data-role') !== activeRole);
      });
    });
  }
}