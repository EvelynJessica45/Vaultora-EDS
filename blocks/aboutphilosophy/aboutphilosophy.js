export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const mainImgNode = rows[0]?.querySelector('img');
  const thumbImgNode = rows[1]?.querySelector('img');
  const tagline = rows[2]?.children[1]?.textContent || '';
  const approach = rows[3]?.children[1]?.textContent || '';
  const philTitle = rows[4]?.children[1]?.textContent || '';
  const philBody = rows[5]?.children[1]?.textContent || '';

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'about-philosophy-wrapper';

  wrapper.innerHTML = `
    <div class="phil-left-meta">
      <h2 class="phil-big-header">ABOUT US</h2>
      <p class="phil-tagline">${tagline}</p>
      <p class="phil-approach">${approach}</p>
    </div>
    <div class="phil-center-gallery"></div>
    <div class="phil-right-card">
      <div class="phil-card-thumb-wrap"></div>
      <h3 class="phil-card-title">${philTitle}</h3>
      <p class="phil-card-body">${philBody}</p>
    </div>
  `;

  if (mainImgNode) wrapper.querySelector('.phil-center-gallery').append(mainImgNode);
  if (thumbImgNode) wrapper.querySelector('.phil-card-thumb-wrap').append(thumbImgNode);

  block.append(wrapper);
}