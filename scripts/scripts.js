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
 * Re-maps 5 workspace block profiles onto the core cards asset pair bundle.
 */
function redirectCardsBlocks(main) {
  if (!main) return;
  const targetCardsBlocks = ['mybids', 'my-bid-details', 'mylistings', 'my-listing-details', 'orders'];
  
  main.querySelectorAll('div[data-block-name], div.mybids, div.my-bid-details, div.mylistings, div.my-listing-details, div.orders').forEach((block) => {
    const blockName = block.getAttribute('data-block-name');
    const matchedClass = targetCardsBlocks.find(cls => block.classList.contains(cls));
    const finalMatchName = blockName || matchedClass;

    if (finalMatchName && targetCardsBlocks.includes(finalMatchName)) {
      block.setAttribute('data-block-name', 'cards');
      block.className = 'cards block';
      block.classList.add(finalMatchName);
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
  redirectCardsBlocks(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    redirectCategoryBlocks(main);
    redirectCardsBlocks(main);
    decorateMain(main);
    doc.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }
  if (window.requestIdleCallback) window.requestIdleCallback(() => loadFonts());
  else setTimeout(loadFonts, 10);
}

async function loadLazy(doc) {
  const headerAnchor = doc.querySelector('header');
  if (headerAnchor) loadHeader(headerAnchor);
  const main = doc.querySelector('main');
  if (main) {
    redirectCategoryBlocks(main);
    redirectCardsBlocks(main);
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
    await loadBlock(footerBlock);
  }
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  window.addEventListener('pagehide', () => {
    if (window.LiveReload?.connector?.socket) {
      try { window.LiveReload.connector.socket.close(); } catch (e) {}
    }
  }, { passive: true });
}

loadPage();