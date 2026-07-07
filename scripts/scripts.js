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

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) {
    /* Silent catch pattern preserves runtime integrity context */
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = main.querySelectorAll('a[href*="/widgets/"]');
  if (!widgetLinks.length) return;

  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p &&
      p.querySelectorAll('a').length === 1 &&
      p.querySelector('a') === link &&
      p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
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
            } catch (error) {
              console.error('Fragment loading failed', error);
            }
          });
        })
        .catch((err) => console.error('Fragment module lazy-load failed', err));
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
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
    } catch {
      /* Continue processing valid targets */
    }

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
 * Universal Interceptor Strategy
 * Re-maps separate block requests straight to the consolidated 'category' bucket
 * @param {Element} main The main container element
 */
function redirectCategoryBlocks(main) {
  if (!main) return;
  
  const targetCategoryBlocks = [
    'category-immersive',
    'carousal-fashion',
    'gridelectronics',
    'carousal-wine',
    'gridgallery'
  ];

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
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    redirectCategoryBlocks(main);
    decorateMain(main);

    // OPTIMIZATION: Extract Hero Background Images immediately and push a high priority link preload
    const criticalHeroBg = main.querySelector('.hero-bg-canvas picture source, .hero-bg-canvas picture img');
    if (criticalHeroBg) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = criticalHeroBg.getAttribute('srcset') || criticalHeroBg.getAttribute('src');
      preloadLink.fetchPriority = 'high';
      document.head.append(preloadLink);
    }

    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    /* Safe container runtime preservation layout trace */
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const headerAnchor = doc.querySelector('header');
  if (headerAnchor) {
    loadHeader(headerAnchor);
  }

  const main = doc.querySelector('main');
  if (main) {
    redirectCategoryBlocks(main);
    await loadSections(main);
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) {
    element.scrollIntoView();
  }

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
  loadFonts();
}

/**
 * Loads everything that happens a lot later.
 */
function loadDelayed() {
  const executionDelay = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 50));
  executionDelay(() => {
    import('./delayed.js').catch((err) => console.error('Delayed orchestration script failed to mount', err));
  }, { timeout: 3000 });
}

/**
 * Primary Core Dynamic Orchestration Lifecycle Execution Wrapper
 */
async function loadPage() {
  // OPTIMIZATION: Render structural DOM instantly via Eager loop first to claim perfect FCP/LCP metrics
  await loadEager(document);

  // OPTIMIZATION: Run non-visual initialization steps asynchronously in the background
  const initHeavyModules = async () => {
    try {
      const awsModule = await import('./aws-service.js');
      await awsModule.initializeAWS();
      
      const storageModule = await import('./storage.js');
      await storageModule.initializeStore();
    } catch (err) {
      console.error('Critical baseline boot layer failed, falling back to cache:', err);
      try {
        const storageModule = await import('./storage.js');
        await storageModule.initializeStore();
      } catch (e) { /* Preservation fallback pass */ }
    }
  };

  // Run AWS/Store initialization asynchronously alongside the visual lifecycle load
  initHeavyModules();

  // Handle auxiliary transaction engines in a background idle execution window
  const deferServiceInitialization = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1));
  deferServiceInitialization(() => {
    import('./notification-service.js')
      .then(m => m.initializeEmailJS())
      .catch(err => console.warn('Notification service background sync deferred safely:', err));
  });

  await loadLazy(document);
  loadDelayed();
}

loadPage();