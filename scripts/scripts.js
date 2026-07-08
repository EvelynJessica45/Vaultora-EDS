import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateBlock,
  loadBlock,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';
// dsds
async function loadFonts() {
  try {
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.as = 'style';
    fontPreload.href = `${window.hlx.codeBasePath}/styles/fonts.css`;
    document.head.appendChild(fontPreload);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = `${window.hlx.codeBasePath}/styles/fonts.css`;
    fontLink.media = 'print';
    fontLink.onload = () => { fontLink.media = 'all'; };
    document.head.appendChild(fontLink);
    
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) { /* Protection pass */ }
}

function buildWidgetAutoBlocks(main) {
  const widgetLinks = main.querySelectorAll('a[href*="/widgets/"]');
  if (!widgetLinks.length) return;

  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (p && p.querySelectorAll('a').length === 1 && p.querySelector('a') === link && p.textContent.trim() === link.textContent.trim()) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

function buildAutoBlocks(main) {
  try {
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      import('../blocks/fragment/fragment.js')
        .then(({ loadFragment }) => {
          fragments.forEach(async (fragment) => {
            try {
              const { pathname } = new URL(fragment.href);
              const frag = await loadFragment(pathname);
              if (frag && frag.children.length) {
                fragment.parentElement.replaceWith(...frag.children);
              }
            } catch (error) { /* Shield trace */ }
          });
        })
        .catch((err) => console.error(err));
    }
    buildWidgetAutoBlocks(main);
  } catch (error) { /* Shield trace */ }
}

function decorateButtons(main) {
  const targets = main.querySelectorAll('p a[href]');
  if (!targets.length) return;

  targets.forEach((a) => {
    a.title = a.title || a.textContent.trim();
    const p = a.closest('p');
    const text = a.textContent.trim();

    if (a.querySelector('img') || (p && p.textContent.trim() !== text)) return;
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { return; }

    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    
    if (strong && em) {
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}
/**
 * Monolithic Profile Cards Interceptor Routing Engine
 * Re-maps 5 user workspace block profiles onto the core cards asset pair bundle.
 */
/**
 * Updated Cards Interceptor Routing Engine
 * Re-maps all profile and bidding block assets to the monolithic cards block.
 */
function redirectCardsBlocks(main) {
  if (!main) return;
  // Added 'profile' to the target array
  const targetCardsBlocks = ['mybids', 'my-bid-details', 'mylistings', 'my-listing-details', 'orders', 'profile'];
  
  main.querySelectorAll('div[data-block-name]').forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    
    if (targetCardsBlocks.includes(blockName)) {
      block.setAttribute('data-block-name', 'cards');
      block.className = 'cards block';
      block.classList.add(blockName);
    }
  });
}
// Ensure redirectCardsBlocks(main) is called in decorateMain, loadEager, and loadLazy
function redirectCustomCardsBlocks(main) {
  if (!main) return;
  // Define your variants here
  const targetCustomCardVariants = ['auction-products', 'wishlist'];
  
  main.querySelectorAll('div[data-block-name]').forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    
    // Check if the current block is one of our variant types
    if (targetCustomCardVariants.includes(blockName)) {
      // 1. Pivot routingd to the core customcards block
      block.setAttribute('data-block-name', 'customcards');
      
      // 2. Format class structures to preserve the variant identity for the JS controller
      block.className = 'customcards block';
      block.classList.add(blockName);
    }
  });
}

/**
 * Columns Interceptor Routing Engine
 * Maps column variants to the monolithic columns block bundle.
 */
function redirectColumnBlocks(main) {
  if (!main) return;
  // Add your column-based variants here
  const targetColumnVariants = ['about', 'detail'];
  
  main.querySelectorAll('div[data-block-name]').forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    
    // Check if the current block is one of our column-based variants
    if (targetColumnVariants.includes(blockName)) {
      // 1. Pivot routing to the core columns block
      block.setAttribute('data-block-name', 'columns');
      
      // 2. Preserve variant identity for the controller
      block.className = 'columns block';
      block.classList.add(blockName);
    }
  });
}

function redirectFormsBlocks(main) {
  if (!main) return;
  const targetFormVariants = ['checkout', 'seller-dashboard'];
  
  main.querySelectorAll('div[data-block-name]').forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    
    if (targetFormVariants.includes(blockName)) {
      // 1. Pivot routing to core forms block
      block.setAttribute('data-block-name', 'forms');
      
      // 2. Keep the variant identity active in classes
      block.className = 'forms block';
      block.classList.add(blockName);
    }
  });
}

function redirectCategoryBlocks(main) {
  if (!main) return;
  const targetCategoryBlocks = ['category-immersive', 'carousal-fashion', 'gridelectronics', 'carousal-wine', 'gridgallery'];
  const blocks = main.querySelectorAll('div[data-block-name]');
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    if (targetCategoryBlocks.includes(blockName)) {
      block.setAttribute('data-block-name', 'category');
      block.className = 'category block';
      block.classList.add(blockName);
    }
  });
}

/**
 * Monolithic Dashboard Interceptor Routing Engine
 * Re-maps 5 profile block assets to the core dashboard bundle automatically
 */
function redirectDashboardBlocks(main) {
  if (!main) return;
  const targetDashboardBlocks = ['mybids', 'my-bid-details', 'mylistings', 'my-listing-details', 'orders'];
  const blocks = main.querySelectorAll('div[data-block-name]');
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    if (targetDashboardBlocks.includes(blockName)) {
      // 1. Pivot asset routing pipelines cleanly to point to blocks/dashboard/
      block.setAttribute('data-block-name', 'dashboard');
      
      // 2. Format class structures safely to avoid style accumulation loops
      block.className = 'dashboard block';
      
      // 3. Keep original layout signature identity hook active
      block.classList.add(blockName);
    }
  });
}

export function decorateMain(main) {
  // Execute universal mapping overrides before document decoration fires
  redirectCategoryBlocks(main);
  redirectDashboardBlocks(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  
  const clearRobotsBlocks = () => {
    const metas = Array.from(doc.querySelectorAll('meta[name="robots"]'));
    metas.forEach(el => el.remove());
    
    const targetMeta = doc.createElement('meta');
    targetMeta.name = 'robots';
    targetMeta.content = 'index, follow, max-image-preview:large';
    doc.head.appendChild(targetMeta);

    if (!doc.querySelector('meta[name="description"]')) {
      const metaDesc = doc.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = 'Review and manage your real-time active, won, or historical bids on our consolidated premium luxury auction ecosystem dashboard.';
      doc.head.appendChild(metaDesc);
    }
  };
  clearRobotsBlocks();

  const preconnectHint = doc.createElement('link');
  preconnectHint.rel = 'preconnect';
  preconnectHint.href = 'https://vaultora.s3.ap-south-1.amazonaws.com';
  preconnectHint.crossOrigin = 'anonymous';
  doc.head.append(preconnectHint);

  const dnsPrefetchHint = doc.createElement('link');
  dnsPrefetchHint.rel = 'dns-prefetch';
  dnsPrefetchHint.href = 'https://vaultora.s3.ap-south-1.amazonaws.com';
  doc.head.append(dnsPrefetchHint);

  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    // Intercept early gate variants before LCP section rendering loop cycles
    redirectCategoryBlocks(main);
    redirectDashboardBlocks(main);
    
    decorateMain(main);
    const criticalHeroBg = main.querySelector('.hero-bg-canvas picture source, .hero-bg-canvas picture img');
    if (criticalHeroBg) {
      const preloadLink = doc.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = criticalHeroBg.getAttribute('srcset') || criticalHeroBg.getAttribute('src');
      preloadLink.fetchPriority = 'high';
      doc.head.append(preloadLink);
    }
    doc.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }
  
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => loadFonts());
  } else {
    setTimeout(loadFonts, 10);
  }
}

async function loadLazy(doc) {
  const headerAnchor = doc.querySelector('header');
  if (headerAnchor) loadHeader(headerAnchor);

  const main = doc.querySelector('main');
  if (main) {
    // Pipeline asset tracking recovery pass
    redirectCategoryBlocks(main);
    redirectDashboardBlocks(main);
    await loadSections(main);
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  const footerAnchor = doc.querySelector('footer');
  if (footerAnchor) {
    footerAnchor.innerHTML = '';
    const footerBlock = buildBlock('footer', '');
    footerAnchor.append(footerBlock);
    decorateBlock(footerBlock);
    footerAnchor.classList.add('footer-container');
    footerBlock.parentElement.classList.add('footer-wrapper');
    await loadBlock(footerBlock);
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
}

function loadDelayed() {
  const executionDelay = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 60));
  executionDelay(() => {
    import('./storage.js')
      .then((storageModule) => storageModule.initializeStore())
      .catch(err => console.warn('Delayed background layer sync deferred:', err));

    import('./delayed.js').catch((err) => console.error(err));
  }, { timeout: 3000 });
}

async function loadPage() {
  await loadEager(document);

  const deferServiceInitialization = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 250));
  deferServiceInitialization(() => {
    import('./notification-service.js')
      .then(m => m.initializeEmailJS())
      .catch(err => console.warn('Deferred notification initialization skipped:', err));
  });

  await loadLazy(document);
  loadDelayed();

  window.addEventListener('pagehide', () => {
    if (window.LiveReload?.connector?.socket) {
      try { window.LiveReload.connector.socket.close(); } catch (e) {}
    }
  }, { passive: true });
}

loadPage();