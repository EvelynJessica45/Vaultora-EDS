export default function decorate(block) {
  // Read row nodes out from authored Markdown data tables
  const rows = [...block.children];

  const items = rows
    .map((row) => {
      const columns = row.querySelectorAll(':scope > div');
      const title = columns[0]?.textContent.trim() || 'Category';
      const meta = columns[1]?.textContent.trim() || 'Discover';
      const imgElement = columns[2]?.querySelector('img');
      const imageSrc = imgElement ? imgElement.src : '';

      // FIX: Explicitly returning the values inside the mapping block
      return { title: title, meta: meta, imgSrc: imageSrc };
    })
    // Cleans out common template helper row descriptions safely
    .filter(item => !item.title.toLowerCase().includes('card title') && !item.title.toLowerCase().includes('column 1'));

  // Clear component outer layout container
  block.innerHTML = '';

  // Render Premium Electronics Heading Blocks
  const headerSection = document.createElement('div');
  headerSection.className = 'grid-editorial-header';
  headerSection.innerHTML = `
    <span class="grid-pre-title">Next-Gen Ecosystem</span>
    <h2 class="grid-main-title">Best Electronics</h2>
    <span class="grid-sub-title">Premium Architecture & Design</span>
  `;
  block.appendChild(headerSection);

  // Define slot layouts mapping cleanly to image_6db785.png layout configurations
  const slotClasses = [
    'slot-left-wing',         // Card 1
    'slot-center-wide',       // Card 2
    'slot-micro-one micro-scale',   // Card 3
    'slot-micro-two micro-scale',   // Card 4
    'slot-micro-three micro-scale', // Card 5
    'slot-right-wing'         // Card 6
  ];

  // Render Asymmetric Grid Platform Container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'asymmetric-matrix';

  gridContainer.innerHTML = items.map((item, idx) => {
    const slotClass = slotClasses[idx] || 'slot-fallback';
    
    return `
      <div class="tech-card ${slotClass}" data-index="${idx}">
        ${item.imgSrc ? `<div class="card-image-layer" style="background-image: url('${item.imgSrc}');"></div>` : ''}
        <div class="card-overlay-wrapper">
          <span class="card-meta">${item.meta}</span>
          <h3>${item.title}</h3>
        </div>
      </div>
    `;
  }).join('');

  block.appendChild(gridContainer);

  // Bind smooth click tracking endpoints across cards for direct category exploration
  gridContainer.querySelectorAll('.tech-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      const targetUrl = `/electronics/${items[idx].title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      window.location.href = targetUrl;
    });
  });
}