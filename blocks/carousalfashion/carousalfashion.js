export default function decorate(block) {
  // Read row structures compiled from your authored markdown table element matrix
  const rows = [...block.children];

  const categories = rows
    .map((row) => {
      const columns = row.querySelectorAll(':scope > div');
      const categoryTitle = columns[0]?.textContent.trim() || 'Collection';
      const itemCount = columns[1]?.textContent.trim() || 'View All';
      const imgElement = columns[2]?.querySelector('img');
      const imageSrc = imgElement ? imgElement.src : '';

      return { title: categoryTitle, meta: itemCount, imgSrc: imageSrc };
    })
    // Cleans out common template helper row descriptions safely
    .filter(cat => !cat.title.toLowerCase().includes('card title') && !cat.title.toLowerCase().includes('column 1'));

  // Reset block DOM container frame
  block.innerHTML = '';
  
  // Render Editorial Layout Header Component
  const headerSection = document.createElement('div');
  headerSection.className = 'carousel-editorial-header';
  headerSection.innerHTML = `
    <span class="carousel-pre-title">Inspirational Style</span>
    <h2 class="carousel-main-title">Best Fashion</h2>
    <span class="carousel-sub-title">Men's & Women's Collections</span>
  `;
  block.appendChild(headerSection);

  // Render 3D Deck Container Pipeline
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'perspective-slider-container';
  
  carouselContainer.innerHTML = `
    <div class="slider-track" id="fashionSliderTrack">
      ${categories.map((cat, idx) => `
        <div class="perspective-card" data-index="${idx}" id="fashion-slide-${idx}">
          ${cat.imgSrc ? `<div class="card-bg-image-layer" style="background-image: url('${cat.imgSrc}');"></div>` : ''}
          <div class="card-content-wrapper">
            <div></div>
            <div>
              <h3>${cat.title}</h3>
              <span class="card-item-count">${cat.meta}</span>
            </div>
            <a href="/shop" class="card-action-discover">Explore</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  block.appendChild(carouselContainer);

  const cards = [...carouselContainer.querySelectorAll('.perspective-card')];
  let activeIndex = Math.floor(categories.length / 2);
  let autoScrollInterval = null;

  // 7-CHANNEL MATRIX TRANSFORM CONTROLLER
  function updateSpatialClasses() {
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
    updateSpatialClasses();
  }

  function regressSlide() {
    activeIndex = (activeIndex - 1 + categories.length) % categories.length;
    updateSpatialClasses();
  }

  // INTERACTIVE AUTO-SCROLL LOOPS
  function startTimeline() {
    stopTimeline();
    autoScrollInterval = setInterval(advanceSlide, 3800);
  }

  function stopTimeline() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Click & Interaction Bindings
  cards.forEach(card => {
    card.addEventListener('click', () => {
      activeIndex = parseInt(card.getAttribute('data-index'), 10);
      updateSpatialClasses();
      startTimeline();
    });
  });

  // Pause on hover
  carouselContainer.addEventListener('mouseenter', stopTimeline);
  carouselContainer.addEventListener('mouseleave', startTimeline);

  // Keyboard navigation mappings
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
  updateSpatialClasses();
  startTimeline();

  // STAGE ACTIVE VIEWPORT BOUNDING LOOP MONITOR
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
}