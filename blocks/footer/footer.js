import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  
  const headersRow = rows[1];
  const contentRow = rows[2];
  const copyrightRow = rows[3];

  block.innerHTML = '';

  // 1. Decorative glowing gradient layout line accent rule
  const rule = document.createElement('div');
  rule.className = 'footer-rule';
  block.appendChild(rule);

  // 2. Main grid inner canvas viewport container wrapper
  const innerContainer = document.createElement('div');
  innerContainer.className = 'footer-inner';

  if (contentRow && headersRow) {
    const columnsData = [...contentRow.children];
    const headingsData = [...headersRow.children];

    columnsData.forEach((colCell, i) => {
      if (i === 0) return; // Drop structural text labels line 'Content'

      const colWrap = document.createElement('div');
      
      if (i === 1) {
        // --- COLUMN 1: Brand Space (Logo Image Graphic & Bio Paragraph Metadata) ---
        colWrap.className = 'footer-brand';
        
        const pictureElement = colCell.querySelector('picture');
        if (pictureElement) {
          const logoWrap = document.createElement('div');
          logoWrap.className = 'footer-logo-wrap';
          logoWrap.appendChild(pictureElement);
          colWrap.appendChild(logoWrap);
        }

        const textParagraphs = colCell.querySelectorAll('p');
        textParagraphs.forEach((p) => {
          if (p.textContent.includes('(')) {
            const socialsWrap = document.createElement('div');
            socialsWrap.className = 'footer-socials';
            
            ['instagram', 'linkedin', 'x'].forEach((network) => {
              const anchor = document.createElement('a');
              anchor.href = `#${network}`;
              anchor.className = `footer-social-link link-${network}`;
              anchor.innerHTML = `<span class="icon icon-${network}"></span>`;
              socialsWrap.appendChild(anchor);
            });
            colWrap.appendChild(socialsWrap);
          } else if (!p.querySelector('picture')) {
            p.className = 'footer-tagline';
            colWrap.appendChild(p);
          }
        });

      } else {
        // --- COLUMNS 2, 3 & 4: Stacking Navigation Target Iterators ---
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

        const linkParagraphs = colCell.querySelectorAll('p');
        linkParagraphs.forEach((p) => {
          const listItem = document.createElement('li');
          const anchor = document.createElement('a');
          
          const existingAnchor = p.querySelector('a');
          if (existingAnchor) {
            anchor.href = existingAnchor.href;
            anchor.textContent = existingAnchor.textContent;
          } else {
            anchor.href = `#${p.textContent.toLowerCase().replace(/\s+/g, '-')}`;
            anchor.textContent = p.textContent.trim();
          }

          listItem.appendChild(anchor);
          linksList.appendChild(listItem);
        });

        colWrap.appendChild(linksList);
      }

      innerContainer.appendChild(colWrap);
    });
  }
  block.appendChild(innerContainer);

  // 3. Bottom Strip (Copyright & Legal Elements Grouping)
  if (copyrightRow) {
    const bottomBar = document.createElement('div');
    bottomBar.className = 'footer-bottom';

    const copyDiv = document.createElement('div');
    copyDiv.className = 'footer-copy';
    
    const rawText = copyrightRow.children[1] ? copyrightRow.children[1].textContent : '';
    copyDiv.textContent = rawText.split('(')[0].trim(); 
    bottomBar.appendChild(copyDiv);

    block.appendChild(bottomBar);
  }
}