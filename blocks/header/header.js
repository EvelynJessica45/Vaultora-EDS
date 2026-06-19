export default function decorate(block) {
  console.log('VAULTORA HEADER DECORATION STARTED');

  // Add the master styling hook
  block.classList.add('vaultora-header');

  // 1. Target the Brand section (This holds your logo img)
  const navBrand = block.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.classList.add('header-logo');
  }

  // 2. Target the main navigation sections (This holds your nav links)
  const navSections = block.querySelector('.nav-sections');
  if (navSections) {
    navSections.classList.add('header-nav');
  }

  // 3. Target the tools container (This holds your action badges & profile info)
  const navTools = block.querySelector('.nav-tools');
  if (navTools) {
    navTools.classList.add('header-actions');
    
    // Create a dedicated container for the profile session matching your design
    let profileCol = navTools.querySelector('.header-profile');
    if (!profileCol) {
      profileCol = document.createElement('div');
      profileCol.classList.add('header-profile');
      navTools.appendChild(profileCol);
    }

    // Session Management Handling
    const session = JSON.parse(localStorage.getItem('Vaultora_session')) || null;
    if (session) {
      const displayName = session.name || session.email || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      profileCol.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initial}</div>
          <span>${displayName}</span>
        </div>
        <button class="logout-btn">Logout</button>
      `;

      const logoutBtn = profileCol.querySelector('.logout-btn');
      logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('Vaultora_session');
        window.location.href = '/register';
      });
    } else {
      profileCol.innerHTML = `<a href="/register" class="login-link">Login</a>`;
    }
  }

  // 4. Hook up the Hamburger toggle
  const hamburger = block.querySelector('.nav-hamburger');
  if (hamburger && navSections) {
    hamburger.addEventListener('click', () => {
      navSections.classList.toggle('open');
    });
  }
}