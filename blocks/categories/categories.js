export default function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';
  block.classList.add('categories-lumora-container');

  // Create the centered luxury title header layout
  const headerRow = document.createElement('div');
  headerRow.className = 'categories-header-flex';
  headerRow.innerHTML = `
    <h2>Shop by <span>Category</span></h2>
    <a href="#" class="categories-browse-all" role="button">Browse all <span>→</span></a>
  `;
  block.appendChild(headerRow);

  // Structural 6-column grid track mesh container
  const trackMesh = document.createElement('div');
  trackMesh.className = 'categories-circle-track';

  rows.forEach((row, index) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const imgCell = cells[0];
    const textCell = cells[1];

    // Read the optimized picture markup from the authoring document grid matrix
    const originalPicture = imgCell.querySelector('picture');
    const titleText = textCell.querySelector('strong')?.innerText.trim() || 'Category';
    const countText = textCell.innerText.replace(titleText, '').replace(/\n/g, '').trim() || 'Explore';

    const itemNode = document.createElement('div');
    itemNode.className = 'category-lumora-node';
    
    // Safety Threshold: Flag everything after the 6th element to be hidden on page load
    if (index >= 6) {
      itemNode.classList.add('is-hidden');
    }

    // Circular card frame layout construction shell
    const circleBox = document.createElement('div');
    circleBox.className = 'category-circle-avatar';
    if (originalPicture) {
      circleBox.appendChild(originalPicture.cloneNode(true));
    } else {
      circleBox.classList.add('fallback-placeholder-bg');
    }

    // Text labels content typography alignment stack
    const labelStack = document.createElement('div');
    labelStack.className = 'category-node-labels';
    labelStack.innerHTML = `
      <h3>${titleText}</h3>
      <p>${countText}</p>
    `;

    itemNode.append(circleBox, labelStack);
    
    // Standard platform search path category navigation fallback hooks
    itemNode.onclick = () => {
      window.location.href = `/auctions?category=${encodeURIComponent(titleText.toLowerCase())}`;
    };

    trackMesh.appendChild(itemNode);
  });

  block.appendChild(trackMesh);

  // --- DYNAMIC TOGGLE REVEAL PROCESSOR ---
  const browseBtn = headerRow.querySelector('.categories-browse-all');
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const hiddenNodes = trackMesh.querySelectorAll('.category-lumora-node');
      const isExpanding = browseBtn.classList.toggle('expanded');

      hiddenNodes.forEach((node, idx) => {
        if (idx >= 6) {
          node.classList.toggle('is-hidden', !isExpanding);
        }
      });

      // Swap button strings dynamically on active state transition cycles
      if (isExpanding) {
        browseBtn.innerHTML = 'Show Less <span>↑</span>';
      } else {
        browseBtn.innerHTML = 'Browse all <span>→</span>';
      }
    });
  }
}