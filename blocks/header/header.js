import { createOptimizedPicture } from '../../scripts/aem.js';

function createLink(text, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

export default async function decorate(block) {
  block.innerHTML = '';

  try {
    const resp = await fetch('/nav.plain.html');

    if (!resp.ok) {
      throw new Error('Unable to load nav');
    }

    const html = await resp.text();

    const doc = new DOMParser().parseFromString(
      html,
      'text/html',
    );

    const rows = doc.querySelectorAll('.header > div');

    if (rows.length < 2) {
      console.error('Invalid nav structure');
      return;
    }

    const contentRow = rows[1];

    const logoCell = contentRow.children[0];
    const navCell = contentRow.children[1];
    const actionsCell = contentRow.children[2];

    const wrapper = document.createElement('div');
    wrapper.className = 'header-row-layout';

    /* ---------- LOGO ---------- */

    const logoContainer = document.createElement('div');
    logoContainer.className = 'header-logo-container';

    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'header-logo-wrapper';

    const logoImg = logoCell.querySelector('img');

    if (logoImg) {
      logoLink.append(
        createOptimizedPicture(
          logoImg.src,
          'Vaultora',
          false,
          [{ width: '180' }],
        ),
      );
    }

    logoContainer.append(logoLink);

    /* ---------- NAV ---------- */

    const navWrapper = document.createElement('nav');
    navWrapper.className = 'header-links-container';

    navCell.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.trim();

      if (!text) return;

      const slug = text
        .toLowerCase()
        .replace(/\s+/g, '-');

      const href =
        text.toLowerCase() === 'home'
          ? '/'
          : `/${slug}`;

      navWrapper.append(
        createLink(text, href),
      );
    });

    /* ---------- USER ---------- */

    const session = JSON.parse(
      localStorage.getItem('Vaultora_session') || 'null',
    );

    if (session) {
      const role = (
        session.role ||
        session.userRole ||
        ''
      ).toLowerCase();

      if (role === 'buyer' || role === 'both') {
        navWrapper.append(
          createLink('My Bids', '/mybids'),
        );
      }

      if (role === 'seller' || role === 'both') {
        navWrapper.append(
          createLink('My Listings', '/mylistings'),
        );
      }
    }

    /* ---------- ACTIONS ---------- */
/* ---------- ACTIONS ---------- */

const actionsWrapper = document.createElement('div');
actionsWrapper.className = 'header-actions-container';

/* Wishlist */

const wishlist = document.createElement('a');
wishlist.href = '/wishlist';
wishlist.className = 'header-icon-btn';

wishlist.innerHTML = `
  <img src="/icons/heart.svg" alt="Wishlist">
`;

/* Orders */

const orders = document.createElement('a');
orders.href = '/orders';
orders.className = 'header-icon-btn';

orders.innerHTML = `
  <img src="/icons/bag.svg" alt="Orders">
`;

actionsWrapper.append(
  wishlist,
  orders,
);

/* Guest CTA */

if (!session) {
  const ctaText = actionsCell.textContent.trim();

  if (ctaText) {
    const btn = createLink(
      ctaText,
      '/register',
    );

    btn.classList.add(
      'btn-signup-premium',
    );

    actionsWrapper.append(btn);
  }
}

    /* ---------- PROFILE ---------- */

  /* ---------- PROFILE ---------- */

    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'header-profile-container';

    if (session) {
      const userName = session.name || 'Profile';
      
      // Create the main wrapper link
      const profile = document.createElement('a');
      profile.href = '/profile';
      profile.className = 'user-chip-premium';

      // Create the avatar circle
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar-premium';
      // Extract the first letter of the name for the avatar
      avatar.textContent = userName.charAt(0).toUpperCase();

      // Create the name text element
      const nameText = document.createElement('span');
      nameText.className = 'user-name-text';
      nameText.textContent = userName;

      // Append avatar and name to the profile link
      profile.append(avatar);
      profileWrapper.append(profile);

      // Logout Button (Keep existing logic)
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.className = 'btn-logout-premium';
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('Vaultora_session');
        window.location.replace('/register');
      });

      profileWrapper.append(logoutBtn);
    }
    wrapper.append(
      logoContainer,
      navWrapper,
      actionsWrapper,
      profileWrapper,
    );

    block.append(wrapper);
  } catch (e) {
    console.error('Header failed', e);
  }
}