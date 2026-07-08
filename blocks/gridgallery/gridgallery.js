export default function decorate(block) {
  // Extract all content rows mapped in document data tables
  const rows = [...block.children];

  const categories = rows
    .map((row) => {
      const columns = row.querySelectorAll(':scope > div');
      const headline = columns[0]?.textContent.trim() || 'Asset Class';
      const description = columns[1]?.textContent.trim() || 'Curated Selection';
      const imgNode = columns[2]?.querySelector('img');
      const imageSrc = imgNode ? imgNode.src : '';

      return { title: headline, meta: description, imgSrc: imageSrc };
    })
    .filter(item => !item.title.toLowerCase().includes('card title') && !item.title.toLowerCase().includes('column 1'));

  // Flush base authoring element elements safely
  block.innerHTML = '';

  // 1. Build Left Hand Editorial Typography Column (Direct match to image_6e213e.png)
  const sidebarSection = document.createElement('div');
  sidebarSection.className = 'gallery-editorial-sidebar';
  sidebarSection.innerHTML = `
    <span class="sidebar-pre-title">Art Direction</span>
    <h2 class="sidebar-main-title">Curated</h2>
    <span class="sidebar-sub-title">Collections</span>
    <p class="sidebar-description">
      Explore rare asset classifications spanning contemporary fine art, exquisite high horology, heritage archival manuscripts, and historical diamonds.
    </p>
    <p class="sidebar-description">
      Each item carries verified provenance records, curated exclusively for discerning collectors worldwide.
    </p>
  `;
  block.appendChild(sidebarSection);

  // 2. Define grid position class structures mapping exactly to the 11 layout slots
  const spaceSlots = [
    'space-upper-square',                   
    'space-mini-top-left micro-text-scale',  
    'space-mini-top-right micro-text-scale', 
    'space-wide-center',                    
    'space-right-vertical',                 
    'space-bottom-landscape',               
    'space-mid-right-vert-one micro-text-scale', 
    'space-mid-right-vert-two micro-text-scale', 
    'space-bottom-right-base',              
    'space-bottom-micro-one micro-text-scale',  
    'space-bottom-micro-two micro-text-scale'   
  ];

  // 3. Assemble and Inject the Asymmetric Grid Deck Track
  const matrixMesh = document.createElement('div');
  matrixMesh.className = 'gallery-matrix-mesh';

  matrixMesh.innerHTML = categories.map((cat, index) => {
    const slotClass = spaceSlots[index] || 'space-fallback';
    
    return `
      <div class="gallery-card ${slotClass}" data-index="${index}">
        ${cat.imgSrc ? `<div class="card-asset-img" style="background-image: url('${cat.imgSrc}');"></div>` : ''}
        <div class="card-text-scrim">
          <span class="card-category-tag">${cat.meta}</span>
          <h3>${cat.title}</h3>
        </div>
      </div>
    `;
  }).join('');

  block.appendChild(matrixMesh);

  // Attach direct interactive link routers to categories entries
  matrixMesh.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetIndex = card.getAttribute('data-index');
      const slug = categories[targetIndex].title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.location.href = `/collections/${slug}`;
    });
  });
}