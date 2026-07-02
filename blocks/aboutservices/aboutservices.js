export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Isolate global row elements
  const globalHeaderRow = rows[0];
  const imgNode = globalHeaderRow?.querySelector('img');
  const introText = globalHeaderRow?.children[1]?.textContent || '';

  // Wipe default structural matrix layers
  block.textContent = '';

  const container = document.createElement('div');
  container.className = 'about-services-container';

  // Left Layout Column (Our Services Title, Intro, and Image)
  const leftCol = document.createElement('div');
  leftCol.className = 'about-services-left';

  const heading = document.createElement('h2');
  heading.className = 'about-services-main-title';
  heading.textContent = 'Our Services';

  const intro = document.createElement('p');
  intro.className = 'about-services-intro';
  intro.textContent = introText;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'about-services-img-wrap';
  if (imgNode) imgWrap.append(imgNode);

  leftCol.append(heading, intro, imgWrap);

  // Right Layout Column (List looping through the remaining data rows)
  const rightCol = document.createElement('div');
  rightCol.className = 'about-services-right';

  for (let i = 1; i < rows.length; i++) {
    const title = rows[i]?.children[0]?.textContent;
    const desc = rows[i]?.children[1]?.textContent;

    if (title && desc) {
      const item = document.createElement('div');
      item.className = 'about-service-item';
      item.innerHTML = `
        <h3 class="about-service-item-title">${title}</h3>
        <p class="about-service-item-desc">${desc}</p>
      `;
      rightCol.append(item);
    }
  }

  container.append(leftCol, rightCol);
  block.append(container);
}