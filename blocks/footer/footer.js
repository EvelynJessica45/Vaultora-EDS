import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

/**
 * Universal layout decorator for the footer block
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  let rows = [...block.children];

  // ── HOOD RENDERING RUNTIME CHECK ──
  if (!rows || rows.length === 0 || (rows.length === 1 && !rows[0].textContent.trim())) {
    try {
      const resp = await fetch('/footer.plain.html');
      if (!resp.ok) throw new Error('Global layout configuration asset not resolved');
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const originWrapper = doc.querySelector('body > div');
      rows = originWrapper ? [...originWrapper.children] : [];
    } catch (e) {
      console.error('Asynchronous navigation layout extraction pass failed:', e);
      return;
    }
  }

  // ── FILTER OUT CONFIGURATION ROWS ──
  rows = rows.filter(row => {
    const text = row.innerText?.toLowerCase().trim() || '';
    return !text.startsWith('col width');
  });

  // Identify distinct rows matching your authored matrix map fingerprint strings
  let contentRow = rows.find(row => row.innerText?.toLowerCase().includes('luxury sustainable') || row.innerText?.toLowerCase().includes('browse auctions'));
  let headersRow = rows.find(row => row.innerText?.toLowerCase().includes('marketplace') || row.innerText?.toLowerCase().includes('account'));
  let copyrightRow = rows.find(row => row.innerText?.toLowerCase().includes('copyright') || row.innerText?.toLowerCase().includes('©'));

  // ── ROBUST FALLBACK SYSTEM ──
  if (!contentRow && rows.length > 0) {
    if (rows.length >= 3) {
      contentRow = rows[0];
      headersRow = headersRow || rows[1];
      copyrightRow = copyrightRow || rows[2];
    } else if (rows.length === 2) {
      contentRow = rows[0];
      copyrightRow = copyrightRow || rows[1];
    } else {
      contentRow = rows[0];
    }
  }

  if (!contentRow) {
    console.warn('Footer execution halted: Unable to trace valid content rows.');
    return;
  }

  // Ensure asset icon text blocks match up with span element transformations completely
  decorateIcons(contentRow);

  const fragment = document.createDocumentFragment();

  // Top layout split line rule
  const rule = document.createElement('div');
  rule.className = 'footer-rule';
  fragment.appendChild(rule);

  // Main columns layout grid canvas container
  const innerContainer = document.createElement('div');
  innerContainer.className = 'footer-inner';

  // Extract column elements, stripping out row label text ("Content" and "Headers")
  const columnsData = [...contentRow.children].filter(cell => {
    const txt = cell.innerText?.toLowerCase().trim();
    return txt !== 'content';
  });
  
  const headingsData = headersRow ? [...headersRow.children].filter(cell => {
    const txt = cell.innerText?.toLowerCase().trim();
    return txt !== 'headers';
  }) : [];

  columnsData.forEach((colCell, i) => {
    const colWrap = document.createElement('div');
    
    // Column Index 0: Brand Identity Column
    if (i === 0 || colCell.querySelector('img, picture') || colCell.innerText?.toLowerCase().includes('luxury sustainable')) {
      colWrap.className = 'footer-brand';
      
      // Extract, optimize, and safely translate the brand logo graphic image
      const rawImg = colCell.querySelector('picture img, img');
      if (rawImg) {
        const optimizedPicture = createOptimizedPicture(rawImg.src, 'Vaultora Logo', false, [{ width: '250' }]);
        const optimizedImg = optimizedPicture.querySelector('img');
        if (optimizedImg) {
          optimizedImg.setAttribute('width', '140');
          optimizedImg.setAttribute('height', '95'); 
          optimizedImg.setAttribute('loading', 'lazy');
        }
        const logoWrap = document.createElement('div');
        logoWrap.className = 'footer-logo-wrap';
        logoWrap.appendChild(optimizedPicture);
        colWrap.appendChild(logoWrap);
      }

      // Appending description paragraphs
      colCell.querySelectorAll('p').forEach((p) => {
        const text = p.textContent.trim();
        if (text && !p.querySelector('picture') && !p.querySelector('span.icon')) {
          const tagline = document.createElement('p');
          tagline.className = 'footer-tagline';
          tagline.textContent = text;
          colWrap.appendChild(tagline);
        }
      });

      // Render social navigation interaction icons cleanly
      const nativeIcons = [...colCell.querySelectorAll('span.icon')];
      if (nativeIcons.length > 0) {
        const socialsWrap = document.createElement('div');
        socialsWrap.className = 'footer-socials';
        
        const networks = ['instagram', 'linkedin', 'x'];
        nativeIcons.forEach((iconSpan, index) => {
          const networkName = networks[index] || 'social';
          const anchor = document.createElement('a');
          anchor.href = `#${networkName}`;
          anchor.ariaLabel = `Visit our ${networkName} page`; 
          anchor.className = `footer-social-link link-${networkName}`;
          anchor.appendChild(iconSpan);
          socialsWrap.appendChild(anchor);
        });
        colWrap.appendChild(socialsWrap);
      }

    } else {
      // Columns 1, 2, 3: Link Navigation Columns
      colWrap.className = 'footer-nav-col';
      
      // Fixed: Match the current link column index directly with headingsData[i]
      const titleText = headingsData[i] ? headingsData[i].textContent.trim() : '';
      if (titleText) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'footer-col-title';
        titleDiv.textContent = titleText;
        colWrap.appendChild(titleDiv);
      }

      const linksList = document.createElement('ul');
      linksList.className = 'footer-links';

      colCell.querySelectorAll('p, a, li').forEach((item) => {
        const text = item.textContent.trim();
        if (!text) return;

        const listItem = document.createElement('li');
        const anchor = document.createElement('a');
        const existingAnchor = item.querySelector('a') || (item.tagName === 'A' ? item : null);
        
        if (existingAnchor) {
          anchor.href = existingAnchor.href;
          anchor.textContent = existingAnchor.textContent;
        } else {
          anchor.href = `#${text.toLowerCase().replace(/\s+/g, '-')}`;
          anchor.textContent = text;
        }

        listItem.appendChild(anchor);
        linksList.appendChild(listItem);
      });

      colWrap.appendChild(linksList);
    }

    if (colWrap.hasChildNodes()) {
      innerContainer.appendChild(colWrap);
    }
  });

  fragment.appendChild(innerContainer);

  // 3. Extract and project the bottom legal strip copyright row cleanly
  if (copyrightRow) {
    const targetCell = copyrightRow.children[1] || copyrightRow.children[0];
    if (targetCell) {
      const bottomBar = document.createElement('div');
      bottomBar.className = 'footer-bottom';

      const copyDiv = document.createElement('div');
      copyDiv.className = 'footer-copy';
      copyDiv.textContent = targetCell.textContent.trim();
      
      bottomBar.appendChild(copyDiv);
      fragment.appendChild(bottomBar);
    }
  }

  // Clear unstyled nodes and mount the dynamic block document fragments safely
  block.innerHTML = '';
  block.appendChild(fragment);
}