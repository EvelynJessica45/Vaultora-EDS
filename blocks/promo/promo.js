/**
 * Decorates the promo block with a luxury countdown interface
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Add wrapper class required by CSS selectors
  block.classList.add('promo-banner');

  const rows = [...block.children];

  // Requires:
  // 0 = badge
  // 1 = heading
  // 2 = description
  // 3 = CTA
  // 4 = image
  if (rows.length < 5) {
    console.error('Promo block requires 5 rows');
    return;
  }

  const accentText = rows[0]?.innerText?.trim();
  const headingText = rows[1]?.innerText?.trim();
  const descText = rows[2]?.innerText?.trim();
  const ctaLinkElement = rows[3]?.querySelector('a');
  const imageElement =
    rows[4]?.querySelector('picture') ||
    rows[4]?.querySelector('img');

  const bannerContent = document.createElement('div');
  bannerContent.className = 'promo-banner-content';

  const bannerVisual = document.createElement('div');
  bannerVisual.className = 'promo-banner-visual';

  if (imageElement) {
    bannerVisual.append(imageElement);
  }

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

  // Countdown
  const countdownContainer = document.createElement('div');
  countdownContainer.className = 'promo-banner-countdown';

  const timeUnits = [
    { label: 'Hrs', value: '11', id: 'promo-hrs' },
    { label: 'Min', value: '42', id: 'promo-min' },
    { label: 'Sec', value: '07', id: 'promo-sec' },
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

  // CTA
  if (ctaLinkElement) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'promo-banner-action-row';

    ctaLinkElement.classList.add('promo-banner-cta-btn');
    ctaLinkElement.innerHTML = `${ctaLinkElement.textContent} <span>&rarr;</span>`;

    ctaWrap.append(ctaLinkElement);
    bannerContent.append(ctaWrap);
  }

  // Replace authoring markup
  block.textContent = '';
  block.append(bannerContent, bannerVisual);

  // Live countdown
  const targetEndTime = Date.now() + 24 * 60 * 60 * 1000;

  function updateRealTimeClock() {
    const distance = targetEndTime - Date.now();

    if (distance < 0) {
      clearInterval(clockIntervalId);
      return;
    }

    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (distance % (1000 * 60 * 60)) /
      (1000 * 60)
    );

    const seconds = Math.floor(
      (distance % (1000 * 60)) /
      1000
    );

    block.querySelector('#promo-hrs').textContent =
      String(hours).padStart(2, '0');

    block.querySelector('#promo-min').textContent =
      String(minutes).padStart(2, '0');

    block.querySelector('#promo-sec').textContent =
      String(seconds).padStart(2, '0');
  }

  const clockIntervalId = setInterval(updateRealTimeClock, 1000);
  updateRealTimeClock();
}