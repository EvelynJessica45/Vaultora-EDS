export default function decorate(block) {
  // Read row structures directly from authored markdown table layers
  const rows = [...block.children];

  const categories = rows
    .map((row) => {
      const columns = row.querySelectorAll(':scope > div');
      const cardTitle = columns[0]?.textContent.trim() || 'Asset Class';
      const lotCounter = columns[1]?.textContent.trim() || '00 Lots Active';
      const imgElement = columns[2]?.querySelector('img');
      const imageSrc = imgElement ? imgElement.src : '';

      return { name: cardTitle, total: lotCounter, imgSrc: imageSrc };
    })
    .filter(cat => !cat.name.toLowerCase().includes('card title') && !cat.name.toLowerCase().includes('column 1'));

  // Clean initialization reset
  block.innerHTML = '';
  
  // Luxury Section Title Header Setup
// Luxury Section Title Header Setup (Refined 3-line Editorial Architecture)
  const headerSection = document.createElement('div');
  headerSection.className = 'carousel-luxury-header';
  headerSection.innerHTML = `
    <span class="carousel-pre-title">Grand Reserves Collection</span>
    <h2 class="carousel-main-title">The Finest Vintages</h2>
    <span class="carousel-sub-title">Curated Estates & Rare Spirits</span>
  `;
  block.appendChild(headerSection);

  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'perspective-slider-container';
  
  carouselContainer.innerHTML = `
    <div class="slider-track" id="wineSliderTrack">
      ${categories.map((cat, idx) => `
        <div class="perspective-card" data-index="${idx}" id="wine-slide-${idx}">
          ${cat.imgSrc ? `<div class="card-bg-image-layer" style="background-image: url('${cat.imgSrc}');"></div>` : ''}
          <div class="card-content-wrapper">
            <span class="card-index-num"></span>
            <div>
              <h3>${cat.name}</h3>
              <span class="card-lot-counter">${cat.total}</span>
            </div>
            <a href="/auctions" class="card-action-link">View Vault</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  block.appendChild(carouselContainer);

  const cards = [...carouselContainer.querySelectorAll('.perspective-card')];
  let activeIndex = Math.floor(categories.length / 2);
  let autoScrollInterval = null;

  // 7-CARD LOOP SPATIAL ENGINE
  function updateSliderPositions() {
    const total = categories.length;
    
    cards.forEach((card, i) => {
      card.className = 'perspective-card';
      
      let offset = i - activeIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      
      if (offset === 0) {
        card.classList.add('center-focus');
      } else if (offset === -1) {
        card.classList.add('left-inner');
      } else if (offset === 1) {
        card.classList.add('right-inner');
      } else if (offset === -2) {
        card.classList.add('left-mid');
      } else if (offset === 2) {
        card.classList.add('right-mid');
      } else if (offset === -3 || offset < -2) {
        card.classList.add('left-outer');
      } else if (offset === 3 || offset > 2) {
        card.classList.add('right-outer');
      }
    });
  }

  function advanceSlide() {
    activeIndex = (activeIndex + 1) % categories.length;
    updateSliderPositions();
  }

  function regressSlide() {
    activeIndex = (activeIndex - 1 + categories.length) % categories.length;
    updateSliderPositions();
  }

  // INTERACTIVE SCROLL TRACKERS
  function startTimeline() {
    stopTimeline();
    autoScrollInterval = setInterval(advanceSlide, 3800); // Progresses smoothly every 3.8s
  }

  function stopTimeline() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Bind direct click handling updates
  cards.forEach(card => {
    card.addEventListener('click', () => {
      activeIndex = parseInt(card.getAttribute('data-index'), 10);
      updateSliderPositions();
      startTimeline();
    });
  });

  // Pause scrolling safely when mouse hovers over elements
  carouselContainer.addEventListener('mouseenter', stopTimeline);
  carouselContainer.addEventListener('mouseleave', startTimeline);

  // Keyboard accessibility
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      advanceSlide();
      startTimeline();
    } else if (e.key === 'ArrowLeft') {
      regressSlide();
      startTimeline();
    }
  });

  // Init Engine
  updateSliderPositions();
  startTimeline();

  // STAGE PHASE VISIBILITY MONITOR
  function carouselVisibilityLoop() {
    let progress = 0;
    if (window.vaultoraVideoCanvas) {
      progress = window.vaultoraVideoCanvas.smoothProgress;
    } else {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    }

    if (progress >= 0.45) {
      block.classList.add('stage-active-flow');
      block.closest('.section')?.classList.add('expand-carousel-section');
    } else {
      block.classList.remove('stage-active-flow');
      block.closest('.section')?.classList.remove('expand-carousel-section');
    }
    requestAnimationFrame(carouselVisibilityLoop);
  }
  
  carouselVisibilityLoop();
}