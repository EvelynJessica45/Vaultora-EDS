export default function decorate(block) {
  console.log('VAULTORA HEADER LOADED');

  block.classList.add('vaultora-header');

  const rows = [...block.children];

  // Safeguard: Ensure the table has both a header row and a content row
  if (rows.length < 2) return;

  const contentRow = rows[1];
  const cols = [...contentRow.children];

  // Safeguard: Ensure the content row contains all 4 functional columns
  if (cols.length < 4) return;

  // Map elements to their respective styling classes
  cols[0].classList.add('header-logo');
  cols[1].classList.add('header-nav');
  cols[2].classList.add('header-actions');
  cols[3].classList.add('header-profile');

  // Session Management (Handles showing the user's name if logged in)
  const session = JSON.parse(localStorage.getItem('Vaultora_session')) || null;
  const profileCol = cols[3];

  if (session) {
    const displayName = session.name || session.email || 'User';
    const initial = displayName.charAt(0).toUpperCase();

    // Render logged-in state matching the design
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
    // Fallback: What to show if the user is not logged in
    profileCol.innerHTML = `<a href="/register" class="login-link">Login</a>`;
  }

  // Mobile Menu Layout (Hamburger Linkage)
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = '☰';
  block.appendChild(hamburger);

  hamburger.addEventListener('click', () => {
    cols[1].classList.toggle('open');
  });
}