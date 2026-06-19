export default function decorate(block) {
  console.log('VAULTORA HEADER DECORATION');

  // Master hook on the block element container wrapper
  block.classList.add('vaultora-header');

  const navBrand = block.querySelector('.nav-brand');
  const navSections = block.querySelector('.nav-sections');
  const navTools = block.querySelector('.nav-tools');

  if (navBrand) navBrand.classList.add('header-logo');
  if (navSections) navSections.classList.add('header-nav');

  if (navTools) {
    navTools.classList.add('header-actions');

    const session = JSON.parse(localStorage.getItem('Vaultora_session')) || null;
    const ctaItem = navTools.querySelector('ul li:first-child') || navTools.querySelector('a');

    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    if (!session) {
      if (ctaItem) ctaItem.style.display = 'none';
      profileCol.innerHTML = `
        <a href="/register" class="get-started-btn">Get Started for Free</a>
      `;
    } else {
      if (ctaItem) ctaItem.style.display = 'block';
      const ctaAnchor = ctaItem.querySelector('a') || ctaItem;

      if (session.role && ctaAnchor) {
        const userRole = session.role.toLowerCase();
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

  // Hamburger handling
  const hamburger = block.querySelector('.nav-hamburger');
  if (hamburger && navSections) {
    hamburger.addEventListener('click', () => {
      navSections.classList.toggle('open');
    });
  }
}