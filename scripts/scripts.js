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

async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
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

export function decorateMain(main) {
  redirectCategoryBlocks(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  
  const preconnectHint = document.createElement('link');
  preconnectHint.rel = 'preconnect';
  preconnectHint.href = 'https://vaultora.s3.ap-south-1.amazonaws.com';
  document.head.append(preconnectHint);

  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
  } catch (e) { /* Shield trace */ }
}

async function loadLazy(doc) {
  const headerAnchor = doc.querySelector('header');
  if (headerAnchor) loadHeader(headerAnchor);

  const main = doc.querySelector('main');
  if (main) await loadSections(main);

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
  loadFonts();
}

function loadDelayed() {
  const executionDelay = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 50));
  executionDelay(() => {
    import('./aws-service.js')
      .then(async (awsModule) => {
        await awsModule.initializeAWS();
        const storageModule = await import('./storage.js');
        await storageModule.initializeStore();
      })
      .catch(err => console.warn('Delayed background layer sync deferred:', err));

    import('./delayed.js').catch((err) => console.error(err));
  }, { timeout: 3000 });
}

async function loadPage() {
  await loadEager(document);

  const deferServiceInitialization = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1));
  deferServiceInitialization(() => {
    import('./notification-service.js')
      .then(m => m.initializeEmailJS())
      .catch(err => console.warn(err));
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