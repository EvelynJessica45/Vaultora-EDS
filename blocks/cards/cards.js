import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const container = document.createElement('div');

  // --- VARIATION 1: SHOP BY CATEGORY ---
  if (block.classList.contains('categories')) {
    container.className = 'cards-categories-grid';

    [...block.children].forEach((row) => {
      const cell = row.querySelector(':scope > div');
      if (!cell) return;

      const card = document.createElement('div');
      card.className = 'category-circle-node';

      const imgBox = document.createElement('div');
      imgBox.className = 'category-img-frame';
      
      const img = cell.querySelector('img');
      if (img) {
        const pic = createOptimizedPicture(img.src, img.alt || 'Category', false, [{ width: '180' }]);
        imgBox.appendChild(pic);
      }
      card.appendChild(imgBox);

      const titleText = cell.querySelector('strong')?.textContent || '';
      if (titleText) {
        const title = document.createElement('h3');
        title.className = 'category-label';
        title.textContent = titleText;
        card.appendChild(title);
      }

      const countText = cell.textContent.replace(titleText, '').trim();
      if (countText) {
        const count = document.createElement('span');
        count.className = 'category-count';
        count.textContent = countText;
        card.appendChild(count);
      }

      container.appendChild(card);
    });

  // --- VARIATION 2: NEW ARRIVALS GRID ---
  } else {
    container.className = 'lots-grid-canvas';

    [...block.children].forEach((row) => {
      const cell = row.querySelector(':scope > div');
      if (!cell) return;

      const productCard = document.createElement('div');
      productCard.className = 'lot-item-card';

      const imgWindow = document.createElement('div');
      imgWindow.className = 'lot-card-window';
      const img = cell.querySelector('img');
      if (img) {
        const pic = createOptimizedPicture(img.src, img.alt || 'Product', false, [{ width: '300' }]);
        imgWindow.appendChild(pic);
      }
      productCard.appendChild(imgWindow);

      const details = document.createElement('div');
      details.className = 'lot-card-meta-details';

      const titleText = cell.querySelector('strong')?.textContent || '';
      if (titleText) {
        const title = document.createElement('h3');
        title.className = 'title';
        title.textContent = titleText;
        details.appendChild(title);
      }

      const priceText = cell.textContent.replace(titleText, '').trim();
      if (priceText) {
        const price = document.createElement('p');
        price.className = 'price-row';
        price.innerHTML = `<strong>${priceText}</strong>`;
        details.appendChild(price);
      }

      productCard.appendChild(details);
      container.appendChild(productCard);
    });
  }

  block.innerHTML = '';
  block.appendChild(container);
}