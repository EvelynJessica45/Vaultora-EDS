export default function decorate(block) {
  console.log('--- VAULTORA BLOCK DECORATION START ---');

  block.classList.add('vaultora-header');

  // 1. Target the columns INSIDE the first row container safely
  const row = block.querySelector(':scope > div');
  if (!row) {
    console.warn('Vaultora Header: No structural row found.');
    return;
  }

  const cols = row.querySelectorAll(':scope > div');

  // Guard against missing columns so the script doesn't crash if the document only has a logo
  if (cols && cols.length >= 3) {
    const navBrand = cols[0];
    const navSections = cols[1];
    const navTools = cols[2];

    // Inject the class hooks your CSS selectors are looking for
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
  } else {
    console.warn(`Vaultora Header: Expected 3 columns, but found ${cols ? cols.length : 0}. Check your authoring document content.`);
  }

  // 2. Wrap interaction hooks with optional chaining (?.) and explicit null checks to prevent crashes
  const hamburger = block.querySelector('.nav-hamburger');
  const navSectionsElement = block.querySelector('.header-nav');
  
  if (hamburger && navSectionsElement) {
    hamburger.addEventListener('click', () => {
      navSectionsElement.classList.toggle('open');
    });
  }
}