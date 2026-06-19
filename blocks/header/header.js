export default function decorate(block) {
  console.log('--- VAULTORA BLOCK DECORATION START ---');
  block.classList.add('vaultora-header');

  // Find the row that actually has content (the one containing the logo/picture element)
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  const contentRow = rows.find(row => row.querySelector('picture, p'));

  if (!contentRow) {
    console.warn('Vaultora Header: Content row not found yet.');
    return;
  }

  // Extract columns from the correct row
  const cols = Array.from(contentRow.querySelectorAll(':scope > div'));
  if (!cols || cols.length === 0) return;

  // Map structural styling classes based on layout positions safely
  if (cols[0]) cols[0].classList.add('header-logo');
  if (cols[1]) cols[1].classList.add('header-nav');
  if (cols[2]) cols[2].classList.add('header-actions');
  if (cols[3]) cols[3].classList.add('header-extra-cell');

  // Hide the initial empty block label row from view if present
  rows.forEach(row => {
    if (row !== contentRow) {
      row.style.display = 'none';
    }
  });

  const navTools = cols[2];
  if (navTools) {
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem('Vaultora_session'));
    } catch (e) {
      console.error('Session retrieval fault', e);
    }

    const ctaItem = navTools.querySelector('p');
    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    if (!session) {
      if (ctaItem) ctaItem.style.display = 'none';
      profileCol.innerHTML = `<a href="/register" class="get-started-btn">Get Started for Free</a>`;
    } else {
      if (ctaItem) ctaItem.style.display = 'block';
      const ctaAnchor = ctaItem.querySelector('a') || ctaItem;

      if (session.role && ctaAnchor) {
        const userRole = String(session.role).toLowerCase();
        if (userRole === 'buyer') ctaAnchor.textContent = 'BUY NOW';
        else if (userRole === 'seller') ctaAnchor.textContent = 'SELL NOW';
        else if (userRole === 'both') ctaAnchor.textContent = 'BUY & SELL NOW';
      }

      const displayName = session.name || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      profileCol.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${displayName}</span>
        </div>
        <button class="logout-btn">Logout</button>
      `;

      profileCol.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('Vaultora_session');
        window.location.href = '/login';
      });
    }
  }
}