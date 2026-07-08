import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Helper to standardise accessible link element generation
 */
function createLink(text, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

/**
 * Core Navigation Block Decorator Runtime
 * @param {Element} block The header structural mount block
 */
export default async function decorate(block) {
  block.innerHTML = '';

  try {
    const resp = await fetch('/nav.plain.html');
    if (!resp.ok) throw new Error('Global navigation layout asset failed to resolve');

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('.header > div');

    if (rows.length < 2) {
      console.error('Invalid nav structure detected inside authored payload');
      return;
    }

    const contentRow = rows[1];
    const logoCell = contentRow.children[0];
    const navCell = contentRow.children[1];
    const actionsCell = contentRow.children[2];

    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement('div');
    wrapper.className = 'header-row-layout';

    /* ---------- MOBILE MENU TRIGGER ---------- */
    const burgerTrigger = document.createElement('button');
    burgerTrigger.className = 'header-burger-trigger';
    burgerTrigger.setAttribute('aria-label', 'Toggle Main Navigation Menu');
    burgerTrigger.setAttribute('aria-expanded', 'false');
    burgerTrigger.setAttribute('aria-controls', 'header-nav-list');
    
    burgerTrigger.innerHTML = `
      <span class="icon">
        <svg viewBox="0 0 24 24" width="24" height="24"><use href="${window.hlx.codeBasePath || ''}/icons/icons.svg#icon-menu"></use></svg>
      </span>
    `;
    
    // Passive event listeners significantly optimize responsiveness frames (INP) on touch screens
    burgerTrigger.addEventListener('click', () => {
      const isExpanded = block.classList.toggle('menu-expanded');
      burgerTrigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }, { passive: true });

    wrapper.appendChild(burgerTrigger);

    /* ---------- BRAND IDENTITY LOGO ---------- */
    const logoContainer = document.createElement('div');
    logoContainer.className = 'header-logo-container';

    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'header-logo-wrapper';
    logoLink.setAttribute('aria-label', 'Vaultora Homepage');

    const logoImg = logoCell.querySelector('img');
    if (logoImg) {
      const optimizedPic = createOptimizedPicture(logoImg.src, 'Vaultora Luxury Sustainable Logo', false, [{ width: '120' }]);
      const optimizedImg = optimizedPic.querySelector('img');
      if (optimizedImg) {
        optimizedImg.setAttribute('width', '120');
        optimizedImg.setAttribute('height', '42');
        optimizedImg.setAttribute('loading', 'eager');
        optimizedImg.setAttribute('fetchpriority', 'high');
      }
      logoLink.appendChild(optimizedPic);
    } else {
      logoLink.textContent = 'Vaultora';
    }

    logoContainer.appendChild(logoLink);
    wrapper.appendChild(logoContainer);

    /* ---------- NAVIGATION INTERNAL LINKS ---------- */
    const navWrapper = document.createElement('nav');
    navWrapper.className = 'header-links-container';
    navWrapper.id = 'header-nav-list';

    navCell.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.trim();
      if (!text) return;

      const slug = text.toLowerCase().replace(/\s+/g, '-');
      const href = text.toLowerCase() === 'home' ? '/' : `/${slug}`;
      navWrapper.appendChild(createLink(text, href));
    });

    /* ---------- USER SESSION EVALUATION ---------- */
    const sessionData = localStorage.getItem('Vaultora_session');
    const session = sessionData ? JSON.parse(sessionData) : null;

    if (session) {
      const role = (session.role || session.userRole || '').toLowerCase();
      if (role === 'buyer' || role === 'both') {
        navWrapper.appendChild(createLink('My Bids', '/mybids'));
      }
      if (role === 'seller' || role === 'both') {
        navWrapper.appendChild(createLink('My Listings', '/mylistings'));
      }
    }

    wrapper.appendChild(navWrapper);

    /* ---------- UTILITY ACTIONS SYSTEM ---------- */
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'header-actions-container';

    // Wishlist Button Configuration
    const wishlist = document.createElement('a');
    wishlist.href = '/wishlist';
    wishlist.className = 'header-icon-btn';
    wishlist.setAttribute('aria-label', 'View your Wishlist');
    wishlist.innerHTML = `
      <span class="icon">
        <svg viewBox="0 0 24 24" width="18" height="18"><use href="${window.hlx.codeBasePath || ''}/icons/icons.svg#icon-heart"></use></svg>
      </span>
    `;

    // Orders Button Configuration
    const orders = document.createElement('a');
    orders.href = '/orders';
    orders.className = 'header-icon-btn';
    orders.setAttribute('aria-label', 'View your Orders');
    orders.innerHTML = `
      <span class="icon">
        <svg viewBox="0 0 24 24" width="18" height="18"><use href="${window.hlx.codeBasePath || ''}/icons/icons.svg#icon-bag"></use></svg>
      </span>
    `;
    actionsWrapper.appendChild(wishlist);
    actionsWrapper.appendChild(orders);

    // Guest Authentication Handlers
    if (!session) {
      const ctaText = actionsCell ? actionsCell.textContent.trim() : 'Register';
      if (ctaText) {
        const btn = createLink(ctaText, '/register');
        btn.classList.add('btn-signup-premium');
        actionsWrapper.appendChild(btn);
      }
    }

    wrapper.appendChild(actionsWrapper);

    /* ---------- AUTHENTICATED USER INTERFACE ---------- */
    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'header-profile-container';

    if (session) {
      const profile = createLink(session.name || 'Profile', '/profile');
      profile.classList.add('user-chip-premium');
      profileWrapper.appendChild(profile);

      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.className = 'btn-logout-premium';

      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('Vaultora_session');
        window.location.reload();
      }, { passive: true });

      profileWrapper.appendChild(logoutBtn);
    }

    wrapper.appendChild(profileWrapper);
    fragment.appendChild(wrapper);
    block.appendChild(fragment);

  } catch (e) {
    console.error('Vaultora Header UI processing component execution halted', e);
  }
}