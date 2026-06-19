export default function decorate(block) {
  console.log('--- VAULTORA BLOCK DECORATION START ---');

  // Master style selector injection hook
  block.classList.add('vaultora-header');

  // Safely find the boilerplate generated wrapper rows
  const navBrand = block.querySelector('.nav-brand') || block.querySelector(':scope > div:nth-child(1)');
  const navSections = block.querySelector('.nav-sections') || block.querySelector(':scope > div:nth-child(2)');
  const navTools = block.querySelector('.nav-tools') || block.querySelector(':scope > div:nth-child(3)');

  if (navBrand) navBrand.classList.add('header-logo');
  if (navSections) navSections.classList.add('header-nav');

  if (navTools) {
    navTools.classList.add('header-actions');

    // Retrieve storage item safely
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem('Vaultora_session'));
    } catch (e) {
      console.error('Session parse failed', e);
    }

    // Isolate the Call-To-Action entry list node
    const ctaItem = navTools.querySelector('ul li:first-child') || navTools.querySelector('a') || navTools.querySelector('p');

    // Isolate or safely instantiate the profile zone wrapper
    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    // STATE 1: User is Logged Out
    if (!session) {
      if (ctaItem) ctaItem.style.display = 'none';
      profileCol.innerHTML = `
        <a href="/register" class="get-started-btn">Get Started for Free</a>
      `;
    } 
    // STATE 2: User is Logged In
    else {
      if (ctaItem) ctaItem.style.display = 'block';
      const ctaAnchor = ctaItem.querySelector('a') || ctaItem;

      if (session.role && ctaAnchor) {
        const userRole = String(session.role).toLowerCase();
        if (userRole === 'buyer') {
          ctaAnchor.textContent = 'BUY NOW';
        } else if (userRole === 'seller') {
          ctaAnchor.textContent = 'SELL NOW';
        } else if (userRole === 'both') {
          ctaAnchor.textContent = 'BUY & SELL NOW';
        }
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

  // Hamburger activation link logic
  const hamburger = block.querySelector('.nav-hamburger');
  if (hamburger && navSections) {
    hamburger.addEventListener('click', () => {
      navSections.classList.toggle('open');
    });
  }
}