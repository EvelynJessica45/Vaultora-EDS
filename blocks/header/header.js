export default function decorate(block) {
  console.log('--- VAULTORA STRUCTURAL INJECTION START ---');

  // Force the master header hook class onto the main block container
  block.classList.add('vaultora-header');

  // Map elements strictly by order since AEM strips custom class strings on fallback
  const rows = block.querySelectorAll(':scope > div');

  if (rows && rows.length >= 3) {
    const navBrand = rows[0];
    const navSections = rows[1];
    const navTools = rows[2];

    // Explicitly inject the class hooks that header.css is searching for
    navBrand.classList.add('header-logo');
    navSections.classList.add('header-nav');
    navTools.classList.add('header-actions');

    // Safe session tracking parsing loop
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem('Vaultora_session'));
    } catch (e) {
      console.error('Session retrieval fault', e);
    }

    const ctaItem = navTools.querySelector('ul li:first-child') || navTools.querySelector('a') || navTools.querySelector('p');

    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    // Auth State Mapping Logic
    if (!session) {
      if (ctaItem) ctaItem.style.display = 'none';
      profileCol.innerHTML = `
        <a href="/register" class="get-started-btn">Get Started for Free</a>
      `;
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