/**
 * Diagnostic 3D Deck Carousal Layout Engine
 */
export default async function renderCarousal(block, config = {}) {
  console.log('--- [CAROUSAL ENGINE TRIGGERED] ---');
  console.log('Target Block Element:', block);
  console.log('Block ClassList:', [...block.classList]);
  console.log('Passed Configuration:', config);

  const rows = [...block.children];
  console.log(`Raw markdown rows found: ${rows.length}`);

  const isWine = config.variant === 'wine' || block.classList.contains('wine') || block.classList.contains('carousalwine');
  const isFashion = config.variant === 'fashion' || block.classList.contains('fashion') || block.classList.contains('carousalfashion');

  console.log(`Variant Analysis -> isWine: ${isWine}, isFashion: ${isFashion}`);

  if (!isWine && !isFashion) {
    console.warn('⚠️ WARNING: Neither wine nor fashion variants were matched by class names! Styling skins will fail.');
  }

  const authoredConfig = {};
  rows.forEach((row) => {
    const key = row.children[0]?.textContent?.trim().toLowerCase();
    const val = row.children[1]?.textContent?.trim();
    if (key && val && row.children.length === 2) {
      authoredConfig[key] = val;
    }
  });

  const categories = rows
    .map((row) => {
      const columns = row.querySelectorAll(':scope > div');
      if (columns.length < 2) return null;
      
      const title = columns[0]?.textContent.trim() || '';
      const meta = columns[1]?.textContent.trim() || '';
      const imgElement = columns[2]?.querySelector('img');
      const imgSrc = imgElement ? imgElement.src : '';

      return { title, meta, imgSrc };
    })
    .filter(cat => cat && 
      !cat.title.toLowerCase().includes('card title') && 
      !cat.title.toLowerCase().includes('column 1') &&
      !['variant', 'pretitle', 'maintitle', 'subtitle'].includes(cat.title.toLowerCase())
    );

  console.log('Parsed Categories Data Array:', categories);

  block.innerHTML = '';

  const preTitle = config.preTitle || authoredConfig.pretitle || (isWine ? 'Grand Reserves Collection' : 'Inspirational Style');
  const mainTitle = config.mainTitle || authoredConfig.maintitle || (isWine ? 'The Finest Vintages' : 'Best Fashion');
  const subTitle = config.subTitle || authoredConfig.subtitle || (isWine ? 'Curated Estates & Rare Spirits' : "Men's & Women's Collections");
  const ctaText = isWine ? 'View Vault' : 'Explore';
  const ctaHref = isWine ? '/auctions' : '/shop';

  const headerSection = document.createElement('div');
  headerSection.className = isWine ? 'carousel-luxury-header' : 'carousel-editorial-header';
  headerSection.innerHTML = `
    <span class="carousel-pre-title">${preTitle}</span>
    <h2 class="carousel-main-title">${mainTitle}</h2>
    <span class="carousel-sub-title">${subTitle}</span>
    ${isWine ? '<div class="carousel-title-divider"></div>' : ''}
  `;
  block.appendChild(headerSection);

  const carousalContainer = document.createElement('div');
  carousalContainer.className = 'perspective-slider-container';
  
  carousalContainer.innerHTML = `
    <div class="slider-track" id="${isWine ? 'wineSliderTrack' : 'fashionSliderTrack'}">
      ${categories.map((cat, idx) => `
        <div class="perspective-card" data-index="${idx}" id="${isWine ? 'wine-slide' : 'fashion-slide'}-${idx}">
          ${cat.imgSrc ? `<div class="card-bg-image-layer" style="background-image: url('${cat.imgSrc}');"></div>` : ''}
          <div class="card-content-wrapper">
            ${isWine ? `<span class="card-index-num"></span>` : `<div></div>`}
            <div>
              <h3>${cat.title}</h3>
              <span class="${isWine ? 'card-lot-counter' : 'card-item-count'}">${cat.meta}</span>
            </div>
            <a href="${ctaHref}" class="${isWine ? 'card-action-link' : 'card-action-discover'}">${ctaText}</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  block.appendChild(carousalContainer);

  const cards = [...carousalContainer.querySelectorAll('.perspective-card')];
  console.log(`Generated HTML 3D perspective cards: ${cards.length}`);

  let activeIndex = Math.floor(categories.length / 2);
  let autoScrollInterval = null;
  const scrollSpeed = parseInt(config.autoScrollMs || authoredConfig.autoscrollms || 3800, 10);

  function updateSpatialClasses() {
    const total = categories.length;
    cards.forEach((card, i) => {
      card.className = 'perspective-card';
      
      let offset = i - activeIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      
      if (offset === 0) card.classList.add('center-focus');
      else if (offset === -1) card.classList.add('left-inner');
      else if (offset === 1) card.classList.add('right-inner');
      else if (offset === -2) card.classList.add('left-mid');
      else if (offset === 2) card.classList.add('right-mid');
      else if (offset === -3 || offset < -2) card.classList.add('left-outer');
      else if (offset === 3 || offset > 2) card.classList.add('right-outer');
    });
  }

  function advanceSlide() {
    activeIndex = (activeIndex + 1) % categories.length;
    updateSpatialClasses();
  }

  function regressSlide() {
    activeIndex = (activeIndex - 1 + categories.length) % categories.length;
    updateSpatialClasses();
  }

  function startTimeline() {
    stopTimeline();
    autoScrollInterval = setInterval(advanceSlide, scrollSpeed);
  }

  function stopTimeline() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      activeIndex = parseInt(card.getAttribute('data-index'), 10);
      updateSpatialClasses();
      startTimeline();
    });
  });

  carousalContainer.addEventListener('mouseenter', stopTimeline);
  carousalContainer.addEventListener('mouseleave', startTimeline);

  updateSpatialClasses();
  startTimeline();

  function scrollVisibilityMonitor() {
    let scrollProgress = 0;
    if (window.vaultoraVideoCanvas) {
      scrollProgress = window.vaultoraVideoCanvas.smoothProgress;
    } else {
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
    }

    if (scrollProgress >= 0.45) {
      block.classList.add('stage-active-flow');
      block.closest('.section')?.classList.add('expand-carousel-section');
    } else {
      block.classList.remove('stage-active-flow');
      block.closest('.section')?.classList.remove('expand-carousel-section');
    }
    requestAnimationFrame(scrollVisibilityMonitor);
  }
  
  scrollVisibilityMonitor();
  console.log('--- [ENGINE RENDER COMPLETE] ---');
}