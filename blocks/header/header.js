import { createOptimizedPicture } from '../../scripts/aem.js';

(function () {
  const SESSION_KEY = 'Vaultora_session';

  const getSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && (s.email || s.name) ? s : null;
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const heartIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>`;

  const bagIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>`;

  function wireStaticNav() {
    const links = document.querySelectorAll('.header-links-container a[data-nav], .header-icon-btn[data-nav]');
    const requireAuth = (e, targetPage) => {
      e.preventDefault();
      const s = getSession();
      window.location.href = s ? targetPage : 'register.html';
    };

    links.forEach(link => {
      const navTarget = link.getAttribute('data-nav').toLowerCase().replace(/\s+/g, '');
      if (navTarget === 'home') {
        link.onclick = (e) => { e.preventDefault(); window.location.href = 'index.html'; };
      } else if (navTarget === 'about') {
        link.onclick = (e) => { e.preventDefault(); window.location.href = 'about.html'; };
      } else if (navTarget === 'mybids') {
        link.onclick = (e) => requireAuth(e, 'mybids.html');
      } else if (navTarget === 'favourites') {
        link.onclick = (e) => requireAuth(e, 'myfavourites.html');
      } else if (navTarget === 'mylisting' || navTarget === 'mylistings') {
        link.onclick = (e) => requireAuth(e, 'mylisted.html');
      }
    });
  }

  function buildRoleBadgeHTML(roleString) {
    const role = roleString ? roleString.toLowerCase() : 'buyer';
    if (role === 'buyer') return `<span class="nav-role-pill role-buyer">Buy Now</span>`;
    if (role === 'seller') return `<span class="nav-role-pill role-seller">Sell Now</span>`;
    if (role === 'both') return `<span class="nav-role-pill role-both">Buy & Sell Now</span>`;
    return '';
  }

  function initHeaderBlock() {
    const headerBlock = document.querySelector('.header');
    if (!headerBlock) return;

    const rows = headerBlock.querySelectorAll(':scope > div');
    if (rows.length < 2) return;
    const contentRow = rows[1];
    contentRow.classList.add('header-row-layout');

    const cells = contentRow.querySelectorAll(':scope > div');
    if (cells.length < 4) return;

    const logoCell = cells[0];
    const linksCell = cells[1];
    const actionsCell = cells[2];
    const profileCell = cells[3];

    logoCell.classList.add('header-logo-wrapper');
    linksCell.classList.add('header-links-container');
    actionsCell.classList.add('header-actions-container');
    profileCell.classList.add('header-profile-container');

    // 1. Image Delivery Sizing & High Discovery Priority Fix
    const rawImg = logoCell.querySelector('picture img');
    if (rawImg) {
      const optimizedPicture = createOptimizedPicture(rawImg.src, 'Vaultora Logo', false, [{ width: '150' }]);
      const optimizedImg = optimizedPicture.querySelector('img');
      if (optimizedImg) {
        optimizedImg.setAttribute('width', '140');
        optimizedImg.setAttribute('height', '57');
        optimizedImg.setAttribute('loading', 'eager');
        optimizedImg.setAttribute('fetchpriority', 'high');
      }
      logoCell.innerHTML = '';
      logoCell.appendChild(optimizedPicture);
    }

    // 2. Responsive Burger Button Generation
    if (!headerBlock.querySelector('.header-burger-trigger')) {
      const burger = document.createElement('button');
      burger.className = 'header-burger-trigger';
      burger.setAttribute('aria-label', 'Toggle Navigation Menu');
      burger.innerHTML = '<span></span><span></span><span></span>';
      burger.onclick = () => {
        headerBlock.classList.toggle('menu-expanded');
        burger.classList.toggle('active');
      };
      headerBlock.appendChild(burger);
    }

    // 3. Navigation Parsing
    const linkParagraphs = linksCell.querySelectorAll('p');
    if (linkParagraphs.length > 0) {
      let linksHTML = '';
      linkParagraphs.forEach(p => {
        const cleanText = p.textContent.replace('•', '').trim();
        if (cleanText) linksHTML += `<a href="#" data-nav="${cleanText}">${cleanText}</a>`;
      });
      linksCell.innerHTML = linksHTML;
    }

    const currentPath = window.location.pathname.split('/').pop();
    const mapPathToNav = {
      'index.html': 'Home', '': 'Home', 'about.html': 'About',
      'dashboard.html': 'Products', 'mybids.html': 'My Bids', 'mylisted.html': 'My Listing'
    };
    const activeNavKey = mapPathToNav[currentPath] || '';
    if (activeNavKey) {
      linksCell.querySelector(`a[data-nav="${activeNavKey}"]`)?.classList.add('active');
    }

    const session = getSession();
    const userRole = session && session.role ? session.role.toLowerCase() : 'buyer';
    const bidLink = linksCell.querySelector('a[data-nav="My Bids"]');
    const listingLink = linksCell.querySelector('a[data-nav="My Listing"]');

    if (!session) {
      if (bidLink) bidLink.style.display = 'none';
      if (listingLink) listingLink.style.display = 'none';
    } else {
      if (userRole === 'buyer') {
        if (bidLink) bidLink.style.display = '';
        if (listingLink) listingLink.style.display = 'none';
      } else if (userRole === 'seller') {
        if (bidLink) bidLink.style.display = 'none';
        if (listingLink) listingLink.style.display = '';
      } else {
        if (bidLink) bidLink.style.display = '';
        if (listingLink) listingLink.style.display = '';
      }
    }

    const heartLink = `<a href="myfavourites.html" class="header-icon-btn" data-nav="favourites" title="Favourites" aria-label="View Favourites">${heartIconSVG}</a>`;
    const bagLink = `<a href="orders.html" class="header-icon-btn" data-nav="orders" title="Orders" aria-label="View Orders">${bagIconSVG}</a>`;

    if (session) {
      const displayName = session.name || session.email;
      const initial = String(displayName).charAt(0).toUpperCase();
      const roleBadge = buildRoleBadgeHTML(session.role);

      actionsCell.innerHTML = `${roleBadge} ${heartLink} ${bagLink}`;
      profileCell.innerHTML = `
        <a href="profile.html" class="user-chip-premium" title="Go to profile" aria-label="View Profile">
          <div class="user-avatar-premium">${initial}</div>
          <span>${displayName}</span>
        </a>
        <button class="btn-logout-premium" id="headerLogoutBtn">Logout</button>
      `;

      const logoutBtn = document.getElementById('headerLogoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          clearSession();
          setTimeout(() => (window.location.href = 'register.html'), 200);
        };
      }
    } else {
      actionsCell.innerHTML = `
        <button class="btn-signup-premium" id="headerSignupBtn">Get Started</button>
        ${heartLink}
        ${bagLink}
      `;
      profileCell.innerHTML = '';

      const signupBtn = document.getElementById('headerSignupBtn');
      if (signupBtn) signupBtn.onclick = () => (window.location.href = 'register.html');
    }

    wireStaticNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderBlock);
  } else {
    initHeaderBlock();
  }
})();