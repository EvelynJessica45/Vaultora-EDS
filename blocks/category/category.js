import { createOptimizedPicture } from '../../scripts/aem.js';
import renderCarousal from '../ui/ui-carousal.js';

export default async function decorate(block) {
  // Optimization 1: Use textContent for fast-path matching without forced reflows
  const blockText = block.textContent.toLowerCase();
  const classList = block.classList;

  const hasImmersiveText = blockText.includes('volume marker') || blockText.includes('main headline');
  const hasFashionText = blockText.includes("men's casual") || blockText.includes("women's linen");
  const hasElectronicsText = blockText.includes('audio & acoustics') || blockText.includes('smart living hub') || blockText.includes('audio ecosystem');
  const hasWineText = blockText.includes('grand reserves') || blockText.includes('vintage champagnes');
  const hasGalleryText = blockText.includes('fine art') || blockText.includes('haute joaillerie') || blockText.includes('masterpieces');

  const isMarquee = classList.contains('marquee') || (block.children.length === 1 && blockText.includes('•'));
  const isFashion = classList.contains('carousal-fashion') || classList.contains('carousalfashion') || hasFashionText;
  const isElectronics = !isFashion && (classList.contains('gridelectronics') || hasElectronicsText);
  const isWine = !isFashion && !isElectronics && (classList.contains('carousal-wine') || classList.contains('carousalwine') || hasWineText);
  const isGallery = !isFashion && !isElectronics && !isWine && (classList.contains('gridgallery') || hasGalleryText);
  const isImmersive = !isMarquee && !isFashion && !isElectronics && !isWine && !isGallery && 
                      (classList.contains('category-immersive') || classList.contains('immersive') || hasImmersiveText);

  if (isImmersive) classList.add('category-immersive');
  if (isElectronics) classList.add('gridelectronics');
  if (isGallery) classList.add('gridgallery');

  // Optimization 2: Yield execution to the main thread to protect initial TBT and FCP
  await new Promise((resolve) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 1);
    }
  });

  // ==========================================================================
  // MODULE 1: IMMERSIVE WATCH CANVASES ENGINE
  // ==========================================================================
  if (isImmersive) {
    block.innerHTML = '';
    const CONFIG = {
      volumeMarker: "SYSTEM INDEX // VOL. 01",
      mainHeadline: "The Curated Dimensions",
      serifSubheading: "Fine Horology, Avant-Garde High-Tech, & Precision Physicals",
      bodyDescription: "Welcome to the primary gateway of the Vaultora platform. Explore our definitive auction pillars, engineered to bridge elite craftsmanship with transparent digital provenance.",
      ctaText: "Explore Live Lots",
      s3Route: "https://vaultora.s3.ap-south-1.amazonaws.com/category-videos/Watch/",
      totalFrames: 135
    };

    const viewportShell = document.createElement('div');
    viewportShell.className = 'sticky-viewport';
    viewportShell.innerHTML = `
      <div class="video-canvas-wrap">
        <canvas></canvas>
        <div class="editorial-overlay">
          <div class="luxury-sidebar">
            <span class="hub-volume-tag">${CONFIG.volumeMarker}</span>
            <h2 class="hub-main-headline">${CONFIG.mainHeadline}</h2>
            <h3 class="hub-serif-subheading">${CONFIG.serifSubheading}</h3>
            <p class="hub-body-description">${CONFIG.bodyDescription}</p>
            <div class="cta-wrap"><a href="/auctions" class="luxury-cta-btn" aria-label="${CONFIG.ctaText}"><span>${CONFIG.ctaText}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a></div>
          </div>
          <div class="hud-watermark">VAULTORA ARCHIVE // MULTI-CATEGORY PORTAL</div>
        </div>
      </div>
    `;
    block.appendChild(viewportShell);

    const canvas = viewportShell.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: false }); // Dropping alpha reduces compositing overhead
    let targetProgress = 0, smoothProgress = 0;
    const imageBuffer = [];
    let isIntersecting = false;

    // Strict Visibility Observer: Loop freezes entirely when out of screen bounds
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && imageBuffer.length === 0) preloadFrames();
      });
    }, { rootMargin: '20% 0px' });
    observer.observe(block);

    function preloadFrames() {
      for (let i = 1; i <= CONFIG.totalFrames; i++) {
        const img = new Image();
        img.src = `${CONFIG.s3Route}frame_${i.toString().padStart(3, '0')}.png`;
        if (i === 1) img.onload = () => { if (smoothProgress === 0) drawFrame(img); };
        imageBuffer.push(img);
      }
      requestAnimationFrame(frameTick);
    }

    function drawFrame(frame) {
      if (!frame || !frame.complete) return;
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      
      const imgRatio = frame.width / frame.height;
      const canvasRatio = w / h;
      let renderW = w, renderH = h, offsetX = 0, offsetY = 0;
      
      if (canvasRatio > imgRatio) {
        renderW = w; renderH = w / imgRatio; offsetY = (h - renderH) / 2;
      } else {
        renderH = h; renderW = h * imgRatio; offsetX = (w - renderW) / 2;
      }
      ctx.drawImage(frame, offsetX, offsetY, renderW, renderH);
    }

    // FIX: ResizeObserver completely eradicates initialization dimension race conditions
    const canvasWrap = viewportShell.querySelector('.video-canvas-wrap');
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.resetTransform();
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        const currentFrameIndex = Math.min(CONFIG.totalFrames - 1, Math.floor(smoothProgress * CONFIG.totalFrames));
        let activeFrame = imageBuffer[currentFrameIndex];
        if (activeFrame && activeFrame.complete) drawFrame(activeFrame);
      }
    });
    if (canvasWrap) resizeObserver.observe(canvasWrap);

    window.addEventListener('scroll', () => {
      if (!isIntersecting) return;
      const parentSection = block.closest('.section');
      if (!parentSection) return;
      const blockRect = parentSection.getBoundingClientRect();
      const blockHeight = parentSection.offsetHeight - window.innerHeight;
      targetProgress = Math.max(0, Math.min(1, -blockRect.top / blockHeight));
    }, { passive: true });

    function frameTick() {
      if (!isIntersecting) {
        requestAnimationFrame(frameTick);
        return;
      }
      const diff = targetProgress - smoothProgress;
      if (Math.abs(diff) > 0.001) {
        smoothProgress += diff * 0.08;
        const currentFrameIndex = Math.min(CONFIG.totalFrames - 1, Math.floor(smoothProgress * CONFIG.totalFrames));
        let activeFrame = imageBuffer[currentFrameIndex];
        if (activeFrame && activeFrame.complete) drawFrame(activeFrame);
      }
      requestAnimationFrame(frameTick);
    }
  }

  // ==========================================================================
  // MODULE 2: LUXURY MARQUEE TICKER 
  // ==========================================================================
  if (isMarquee) {
    const contentElement = block.querySelector(':scope > div > div');
    if (contentElement) {
      const rawText = contentElement.innerHTML.trim();
      block.innerHTML = '';
      const track = document.createElement('div');
      track.className = 'marquee-track';
      const formattedContent = rawText.split('•').map(item => `
        <span class="marquee-item"><span class="marquee-dot"></span>${item.trim()}<span class="marquee-star">✦</span></span>
      `).join('');
      track.innerHTML = formattedContent + formattedContent;
      block.appendChild(track);
    }
  }

  // ==========================================================================
  // MODULE 3 & 5: PERSPECTIVE 3D DECK CAROUSALS
  // ==========================================================================
  if (isFashion || isWine) {
    block.classList.add('stage-active-flow');
    await renderCarousal(block, { variant: isWine ? 'wine' : 'fashion' });
  }

  // ==========================================================================
  // MODULE 4: ELECTRONICS ASYMMETRIC GRID
  // ==========================================================================
  if (isElectronics) {
    const items = [...block.children]
      .map((row) => {
        const columns = row.querySelectorAll(':scope > div');
        if (columns.length < 2) return null;
        return { 
          title: columns[0]?.textContent.trim() || 'Category', 
          meta: columns[1]?.textContent.trim() || '', 
          imgSrc: columns[2]?.querySelector('img')?.src || '' 
        };
      })
      .filter(item => item && !item.title.toLowerCase().includes('card title') && !item.title.toLowerCase().includes('column 1'));

    block.innerHTML = `
      <div class="grid-editorial-header">
        <span class="grid-pre-title">Next-Gen Ecosystem</span>
        <h2 class="grid-main-title">Best Electronics</h2>
        <span class="grid-sub-title">Premium Architecture & Design</span>
      </div>
      <div class="asymmetric-matrix"></div>
    `;

    const gridContainer = block.querySelector('.asymmetric-matrix');
    const slotClasses = ['slot-left-wing', 'slot-center-wide', 'slot-micro-one', 'slot-micro-two', 'slot-micro-three', 'slot-right-wing'];

    gridContainer.innerHTML = items.map((item, idx) => `
      <div class="tech-card ${slotClasses[idx] || 'slot-fallback'}" data-index="${idx}" role="button" tabindex="0" aria-label="Explore ${item.title}">
        ${item.imgSrc ? `<div class="card-image-layer" style="background-image: url('${item.imgSrc}');"></div>` : ''}
        <div class="card-overlay-wrapper">
          <span class="card-meta">${item.meta}</span>
          <h3>${item.title}</h3>
        </div>
      </div>
    `).join('');

    gridContainer.addEventListener('click', (e) => {
      if (e.target.closest('.tech-card')) window.location.href = `/auctions`;
    });
  }

  // ==========================================================================
  // MODULE 6: SHOWCASE GALLERY MOSAIC GRID
  // ==========================================================================
  if (isGallery) {
    const categories = [...block.children]
      .map((row) => {
        const columns = row.querySelectorAll(':scope > div');
        if (columns.length < 2) return null;
        return { 
          title: columns[0]?.textContent.trim() || 'Asset Class', 
          meta: columns[1]?.textContent.trim() || '', 
          imgSrc: columns[2]?.querySelector('img')?.src || '' 
        };
      })
      .filter(item => item && !item.title.toLowerCase().includes('card title') && !item.title.toLowerCase().includes('column 1'));

    block.innerHTML = '';
    const sidebarSection = document.createElement('div');
    sidebarSection.className = 'gallery-editorial-sidebar';
    sidebarSection.innerHTML = `
      <span class="sidebar-pre-title">Art Direction</span><h2 class="sidebar-main-title">Curated</h2><span class="sidebar-sub-title">Collections</span>
      <p class="sidebar-description">Explore rare asset classifications spanning fine art, horology, manuscripts, and historical tokens.</p>
    `;
    block.appendChild(sidebarSection);

    const spaceSlots = ['space-upper-square', 'space-mini-top-left', 'space-mini-top-right', 'space-wide-center', 'space-right-vertical', 'space-bottom-landscape'];
    const matrixMesh = document.createElement('div');
    matrixMesh.className = 'gallery-matrix-mesh';
    matrixMesh.innerHTML = categories.map((cat, index) => `
      <div class="gallery-card ${spaceSlots[index] || 'space-fallback'}" data-index="${index}" role="button" tabindex="0" aria-label="View ${cat.title}">
        ${cat.imgSrc ? `<div class="card-asset-img" style="background-image: url('${cat.imgSrc}');"></div>` : ''}
        <div class="card-text-scrim"><span class="card-category-tag">${cat.meta}</span><h3>${cat.title}</h3></div>
      </div>
    `).join('');

    block.appendChild(matrixMesh);
    matrixMesh.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-card')) window.location.href = `/auctions`;
    });
  }
}