export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const bgImg = row.querySelector('img');
  const overlayTitle = row.children[1]?.textContent || '';
  const subtitle = row.children[2]?.textContent || '';
  const linkNode = row.children[3]?.querySelector('a');
  const emailText = row.children[4]?.textContent || '';

  block.textContent = '';

  const ctaSection = document.createElement('div');
  ctaSection.className = 'about-cta-section';

  if (bgImg) {
    bgImg.className = 'about-cta-bg-image';
    ctaSection.append(bgImg);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'about-cta-backdrop';

  backdrop.innerHTML = `
    <h2 class="about-cta-title">${overlayTitle}</h2>
    <p class="about-cta-sub">${subtitle}</p>
  `;

  if (linkNode) {
    linkNode.className = 'about-cta-btn';
    backdrop.append(linkNode);
  }

  const footerLine = document.createElement('div');
  footerLine.className = 'about-cta-footer-line';
  footerLine.textContent = emailText;
  backdrop.append(footerLine);

  ctaSection.append(backdrop);
  block.append(ctaSection);
}