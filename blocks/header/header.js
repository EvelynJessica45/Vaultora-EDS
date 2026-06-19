export default function decorate(block) {
  console.log('VAULTORA DYNAMIC ROLE-BASED HEADER LOADED');

  block.classList.add('vaultora-header');

  const navBrand = block.querySelector('.nav-brand');
  const navSections = block.querySelector('.nav-sections');
  const navTools = block.querySelector('.nav-tools');

  if (navBrand) navBrand.classList.add('header-logo');
  if (navSections) navSections.classList.add('header-nav');

  if (navTools) {
    navTools.classList.add('header-actions');

    // Fetch the active session object matching the database schema structure
    const session = JSON.parse(localStorage.getItem('Vaultora_session')) || null;

    // Isolate the "Buy and Sell Now" list container node
    const ctaItem = navTools.querySelector('ul li:first-child') || navTools.querySelector('a');

    // Isolate or build the clean user profile placeholder container matching the design layout
    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    // CONDITIONAL REQUIREMENT: Before sign-in, completely hide the CTA block wrapper
    if (!session) {
      if (ctaItem) ctaItem.style.display = 'none';

      // Render the standard logged-out Get Started interaction button
      profileCol.innerHTML = `
        <a href="/register" class="get-started-btn">Get Started for Free</a>
      `;
    } else {
      // AFTER SIGN-IN: Make sure the action node element is visible
      if (ctaItem) ctaItem.style.display = 'block';

      // Fetch target text node anchor inside the element layout
      const ctaAnchor = ctaItem.querySelector('a') || ctaItem;

      // Conditional evaluations mapping roles strictly from your database definition properties
      if (session.role && ctaAnchor) {
        const userRole = session.role.toLowerCase();

        if (userRole === 'buyer') {
          ctaAnchor.textContent = 'BUY NOW';
        } else if (userRole === 'seller') {
          ctaAnchor.textContent = 'SELL NOW';
        } else if (userRole === 'both') {
          ctaAnchor.textContent = 'BUY & SELL NOW';
        }
      }

      // Render dynamic logged-in state matching the structure profile parameters
      const displayName = session.name || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      profileCol.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${displayName}</span>
        </div>
        <button class="logout-btn">Logout</button>
      `;

      // Active logging session termination behavior
      profileCol.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('Vaultora_session');
        window.location.href = '/login';
      });
    }
  }

  // Mobile navigation button logic wrapper
  const hamburger = block.querySelector('.nav-hamburger');
  if (hamburger && navSections) {
    hamburger.addEventListener('click', () => {
      navSections.classList.toggle('open');
    });
  }
}