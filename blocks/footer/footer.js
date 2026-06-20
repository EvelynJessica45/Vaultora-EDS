import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 4) return;

  const headersRow = rows[1];
  const contentRow = rows[2];
  const copyrightRow = rows[3];

  // Initialize virtual rendering workspace fragment container
  const fragment = document.createDocumentFragment();

  // 1. Decorative glowing gradient layout line accent rule
  const rule = document.createElement('div');
  rule.className = 'footer-rule';
  fragment.appendChild(rule);

  // 2. Main column grid container
  const innerContainer = document.createElement('div');
  innerContainer.className = 'footer-inner';

  if (contentRow && headersRow) {
    const columnsData = [...contentRow.children];
    const headingsData = [...headersRow.children];

    columnsData.forEach((colCell, i) => {
      if (i === 0) return; // Drop structural meta label 'Content'

      const colWrap = document.createElement('div');
      
      if (i === 1) {
        colWrap.className = 'footer-brand';
        
        // Fix image delivery: Optimize image rendering with specific edge-width limits
        const rawImg = colCell.querySelector('picture img');
        if (rawImg) {
          const optimizedPicture = createOptimizedPicture(rawImg.src, rawImg.alt || 'Vaultora Logo', false, [{ width: '250' }]);
          const optimizedImg = optimizedPicture.querySelector('img');
          if (optimizedImg) {
            optimizedImg.setAttribute('width', '160');
            optimizedImg.setAttribute('height', '108'); // Explicit dimensions to avoid any micro-CLS calculations
            optimizedImg.setAttribute('loading', 'lazy');
          }
          const logoWrap = document.createElement('div');
          logoWrap.className = 'footer-logo-wrap';
          logoWrap.appendChild(optimizedPicture);
          colWrap.appendChild(logoWrap);
        }

        // Fast text processing avoiding micro DOM loops
        const paragraphs = [...colCell.querySelectorAll('p')];
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text && !p.querySelector('picture') && !p.querySelector('span.icon')) {
            const tagline = document.createElement('p');
            tagline.className = 'footer-tagline';
            tagline.textContent = text;
            colWrap.appendChild(tagline);
          }
        });

        // Fast processing for the icons inside column 1
        const nativeIcons = [...colCell.querySelectorAll('span.icon')];
        if (nativeIcons.length > 0) {
          const socialsWrap = document.createElement('div');
          socialsWrap.className = 'footer-socials';
          
          const networks = ['instagram', 'linkedin', 'x'];
          nativeIcons.forEach((iconSpan, index) => {
            const networkName = networks[index] || 'social';
            const anchor = document.createElement('a');
            anchor.href = `#${networkName}`;
            anchor.ariaLabel = `Visit our ${networkName} page`; // Fixes screen-reader accessible name audit
            anchor.className = `footer-social-link link-${networkName}`;
            anchor.appendChild(iconSpan);
            socialsWrap.appendChild(anchor);
          });
          colWrap.appendChild(socialsWrap);
        }

      } else {
        colWrap.className = 'footer-nav-col';
        
        const titleText = headingsData[i] ? headingsData[i].textContent.trim() : '';
        if (titleText) {
          const titleDiv = document.createElement('div');
          titleDiv.className = 'footer-col-title';
          titleDiv.textContent = titleText;
          colWrap.appendChild(titleDiv);
        }

        const linksList = document.createElement('ul');
        linksList.className = 'footer-links';

        const linkParagraphs = [...colCell.querySelectorAll('p')];
        linkParagraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (!text) return;

          const listItem = document.createElement('li');
          const anchor = document.createElement('a');
          const existingAnchor = p.querySelector('a');
          
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

      innerContainer.appendChild(colWrap);
    });
  }
  fragment.appendChild(innerContainer);

  // 3. Build Bottom Strip
  if (copyrightRow && copyrightRow.children[1]) {
    const bottomBar = document.createElement('div');
    bottomBar.className = 'footer-bottom';

    const copyDiv = document.createElement('div');
    copyDiv.className = 'footer-copy';
    copyDiv.textContent = copyrightRow.children[1].textContent.split('(')[0].trim();
    
    bottomBar.appendChild(copyDiv);
    fragment.appendChild(bottomBar);
  }

  // Clear out the block content and commit the virtual fragment in one single step
  block.innerHTML = '';
  block.appendChild(fragment);
}