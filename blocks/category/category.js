export default function decorate(block) {
  const CONFIG = {
    volumeMarker: "SYSTEM INDEX // VOL. 01",
    mainHeadline: "The Curated Dimensions",
    serifSubheading: "Fine Horology, Avant-Garde High-Tech, & Precision Physicals",
    bodyDescription: "Welcome to the primary gateway of the Vaultora platform. Explore our definitive auction pillars, engineered to bridge elite craftsmanship with transparent digital provenance. Scroll down to dynamically reveal our active classification architectures.",
    ctaText: "Explore Live Lots",
    s3Route: "https://vaultora.s3.ap-south-1.amazonaws.com/category-videos/Watch/",
    totalFrames: 135
  };

  block.innerHTML = '';
  const parentContainer = document.createElement('div');
  parentContainer.className = 'sticky-viewport';
  
  parentContainer.innerHTML = `
    <div class="video-canvas-wrap">
      <canvas></canvas>
      <div class="editorial-overlay">
        
        <div class="luxury-sidebar">
          <span class="hub-volume-tag">${CONFIG.volumeMarker}</span>
          <h2 class="hub-main-headline">${CONFIG.mainHeadline}</h2>
          <h3 class="hub-serif-subheading">${CONFIG.serifSubheading}</h3>
          <p class="hub-body-description">${CONFIG.bodyDescription}</p>
          
          <div class="cta-wrap">
            <a href="/auctions" class="luxury-cta-btn">
              <span>${CONFIG.ctaText}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="canvas-viewport-spacer"></div>
        <div class="hud-watermark">VAULTORA ARCHIVE // MULTI-CATEGORY PORTAL</div>
      </div>
    </div>
  `;

  block.appendChild(parentContainer);

  const canvas = parentContainer.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let targetProgress = 0, smoothProgress = 0;

  const imageBuffer = [];
  for (let i = 1; i <= CONFIG.totalFrames; i++) {
    const img = new Image();
    img.src = `${CONFIG.s3Route}frame_${i.toString().padStart(3, '0')}.png`;
    if (i === 1) {
      img.onload = () => { if (smoothProgress === 0) renderFrame(img); };
    }
    imageBuffer.push(img);
  }

  function renderFrame(frame) {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const imgRatio = frame.width / frame.height;
    const canvasRatio = w / h;
    let renderW = w, renderH = h, offsetX = 0, offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = w;
      renderH = w / imgRatio;
      offsetY = (h - renderH) / 2;
    } else {
      renderH = h;
      renderW = h * imgRatio;
      offsetX = (w - renderW) / 2;
    }
    ctx.drawImage(frame, offsetX, offsetY, renderW, renderH);
  }

  function resizeCanvas() {
    const canvasWrap = parentContainer.querySelector('.video-canvas-wrap');
    if (!canvasWrap) return;
    const rect = canvasWrap.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    let currentFrame = imageBuffer[Math.min(CONFIG.totalFrames - 1, Math.floor(smoothProgress * CONFIG.totalFrames))];
    if (currentFrame && currentFrame.complete) renderFrame(currentFrame);
  }
  
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 150);

  window.addEventListener('scroll', () => {
    const blockRect = block.getBoundingClientRect();
    const blockHeight = block.offsetHeight - window.innerHeight;
    const scrolled = -blockRect.top;
    targetProgress = Math.max(0, Math.min(1, scrolled / blockHeight));
  });

  function frameTick() {
    const currentFrameIndex = Math.min(CONFIG.totalFrames - 1, Math.floor(smoothProgress * CONFIG.totalFrames));
    smoothProgress += (targetProgress - smoothProgress) * 0.08;
    const nextFrameIndex = Math.min(CONFIG.totalFrames - 1, Math.floor(smoothProgress * CONFIG.totalFrames));

    if (currentFrameIndex !== nextFrameIndex || smoothProgress === 0) {
      let activeFrame = imageBuffer[nextFrameIndex];
      if (activeFrame && activeFrame.complete) renderFrame(activeFrame);
    }
    requestAnimationFrame(frameTick);
  }
  requestAnimationFrame(frameTick);
}