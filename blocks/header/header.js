export default function decorate(block) {
  console.log('VAULTORA HEADER LOADED');

  block.classList.add('vaultora-header');

  const rows = [...block.children];

  if (rows.length < 2) return;

  const contentRow = rows[1];
  const cols = [...contentRow.children];

  if (cols.length < 4) return;

  cols[0].classList.add('header-logo');
  cols[1].classList.add('header-nav');
  cols[2].classList.add('header-actions');
  cols[3].classList.add('header-profile');

  // Session
  const session =
    JSON.parse(localStorage.getItem('Vaultora_session')) || null;

  const profileCol = cols[3];

  if (session) {
    const displayName =
      session.name || session.email || 'User';

    const initial =
      displayName.charAt(0).toUpperCase();

    profileCol.innerHTML = `
      <div class="user-chip">
        <div class="user-avatar">${initial}</div>
        <span>${displayName}</span>
      </div>

      <button class="logout-btn">
        Logout
      </button>
    `;

    const logoutBtn =
      profileCol.querySelector('.logout-btn');

    logoutBtn?.addEventListener('click', () => {
      localStorage.removeItem('Vaultora_session');
      window.location.href = '/register';
    });
  }

  // Mobile menu button
  const hamburger = document.createElement('button');

  hamburger.className = 'hamburger';
  hamburger.innerHTML = '☰';

  block.appendChild(hamburger);

  hamburger.addEventListener('click', () => {
    cols[1].classList.toggle('open');
  });
}