export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const jayImg = rows[0]?.querySelector('img');
  const jayMeta = rows[1]?.children[1]?.innerHTML || '';
  const davidImg = rows[2]?.querySelector('img');
  const davidMeta = rows[3]?.children[1]?.innerHTML || '';
  const centerTeaserImg = rows[4]?.querySelector('img');
  const teaserText = rows[5]?.children[1]?.textContent || '';

  block.textContent = '';

  const teamContainer = document.createElement('div');
  teamContainer.className = 'about-team-container';

  teamContainer.innerHTML = `
    <div class="team-principals-card">
      <div class="principal-photo-box">${jayImg ? jayImg.outerHTML : ''}</div>
      <div class="principal-meta">${jayMeta}</div>
    </div>
    
    <div class="team-center-hub">
      <div class="hub-title-capsule">MEET THE PRINCIPALS</div>
      <div class="hub-teaser-gallery">${centerTeaserImg ? centerTeaserImg.outerHTML : ''}</div>
      <p class="hub-teaser-text">${teaserText}</p>
    </div>

    <div class="team-principals-card">
      <div class="principal-photo-box">${davidImg ? davidImg.outerHTML : ''}</div>
      <div class="principal-meta text-right">${davidMeta}</div>
    </div>
  `;

  block.append(teamContainer);
}