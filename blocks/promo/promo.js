/**
 * Decorates the promo-banner block with a high-end luxury countdown interface
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 4) return;

  // 1. Extract Config Content
  const accentText = rows[0]?.innerText?.trim();
  const headingText = rows[1]?.innerText?.trim();
  const descText = rows[2]?.innerText?.trim();
  const ctaLinkElement = rows[3]?.querySelector('a');
  const imageElement = rows[4]?.querySelector('picture') || rows[4]?.querySelector('img');

  // Create clean internal presentation structures
  const bannerContent = document.createElement('div');
  bannerContent.className = 'promo-banner-content';

  const bannerVisual = document.createElement('div');
  bannerVisual.className = 'promo-banner-visual';

  // Append editorial image layout frame
  if (imageElement) {
    bannerVisual.append(imageElement);
  }

  // 2. Build Text Copy Nodes
  if (accentText) {
    const accentNode = document.createElement('span');
    accentNode.className = 'promo-banner-accent-badge';
    accentNode.textContent = accentText;
    bannerContent.append(accentNode);
  }

  if (headingText) {
    const headingNode = document.createElement('h2');
    headingNode.className = 'promo-banner-heading';
    headingNode.textContent = headingText;
    bannerContent.append(headingNode);
  }

  if (descText) {
    const descNode = document.createElement('p');
    descNode.className = 'promo-banner-description';
    descNode.textContent = descText;
    bannerContent.append(descNode);
  }

  // 3. Inject High-End Editorial Countdown Timer Component
  const countdownContainer = document.createElement('div');
  countdownContainer.className = 'promo-banner-countdown';

  const timeUnits = [
    { label: 'Hrs', value: '11', id: 'promo-hrs' },
    { label: 'Min', value: '42', id: 'promo-min' },
    { label: 'Sec', value: '07', id: 'promo-sec' }
  ];

  timeUnits.forEach((unit) => {
    const unitWrapper = document.createElement('div');
    unitWrapper.className = 'countdown-time-unit';

    const numNode = document.createElement('span');
    numNode.className = 'countdown-number';
    numNode.id = unit.id;
    numNode.textContent = unit.value;

    const labelNode = document.createElement('span');
    labelNode.className = 'countdown-label';
    labelNode.textContent = unit.label;

    unitWrapper.append(numNode, labelNode);
    countdownContainer.append(unitWrapper);
  });

  bannerContent.append(countdownContainer);

  // 4. Style CTA Control Actions
  if (ctaLinkElement) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'promo-banner-action-row';
    
    ctaLinkElement.className = 'promo-banner-cta-btn';
    ctaLinkElement.innerHTML = `${ctaLinkElement.textContent} <span>&rarr;</span>`;
    
    ctaWrap.append(ctaLinkElement);
    bannerContent.append(ctaWrap);
  }

  // Clear existing CMS tabular raw markup nodes safely
  block.textContent = '';
  block.append(bannerContent, bannerVisual);

  // ── DYNAMIC 24-HOUR COUNTDOWN REALTIME ENGINE ──
  // Target precise end timestamp exactly 24 hours out to create real-time urgency mechanics
  const targetEndTime = Date.now() + 24 * 60 * 60 * 1000;

  function updateRealTimeClock() {
    const distance = targetEndTime - Date.now();

    if (distance < 0) {
      clearInterval(clockIntervalId);
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const hrsNode = block.querySelector('#promo-hrs');
    const minNode = block.querySelector('#promo-min');
    const secNode = block.querySelector('#promo-sec');

    if (hrsNode) hrsNode.textContent = String(hours).padStart(2, '0');
    if (minNode) minNode.textContent = String(minutes).padStart(2, '0');
    if (secNode) secNode.textContent = String(seconds).padStart(2, '0');
  }

  const clockIntervalId = setInterval(updateRealTimeClock, 1000);
  updateRealTimeClock(); // Instant setup pass execution avoiding delays
}