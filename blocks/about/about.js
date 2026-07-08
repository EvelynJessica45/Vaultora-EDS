export default function decorate(block) {
  // 1. Convert Franklin's flat auto-generated div array into a scannable collection
  const rows = [...block.children];
  if (!rows.length) return;

  // 2. Isolate values from the structural cells safely
  const imgContainer = rows[0]?.querySelector('div');
  const labelText    = rows[1]?.textContent || '';
  const titleText    = rows[2]?.innerHTML || '';
  const descText     = rows[3]?.textContent || '';
  const btn1         = rows[4]?.querySelector('a');
  const btn2         = rows[5]?.querySelector('a');

  // 3. Wipe out the default flat unstyled rows
  block.textContent = '';

  // 4. Rebuild cleanly using our CSS hook names
  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'about-hero-container';

  const textSide = document.createElement('div');
  textSide.className = 'about-hero-text-side';

  const label = document.createElement('span');
  label.className = 'about-hero-label';
  label.textContent = labelText;

  const title = document.createElement('h1');
  title.className = 'about-hero-title';
  // If your document text matches 'About Vaultora', we wrap 'Vaultora' in an em tag for your gold italic font
  title.innerHTML = titleText.replace('Vaultora', '<em>Vaultora</em>');

  const desc = document.createElement('p');
  desc.className = 'about-hero-desc';
  desc.textContent = descText;

  const actions = document.createElement('div');
  actions.className = 'about-hero-actions';

  if (btn1) {
    btn1.className = 'btn-about-primary';
    actions.append(btn1);
  }
  if (btn2) {
    btn2.className = 'btn-about-secondary';
    actions.append(btn2);
  }

  textSide.append(label, title, desc, actions);

  const imageSide = document.createElement('div');
  imageSide.className = 'about-hero-image-side';
  if (imgContainer && imgContainer.querySelector('img')) {
    imageSide.append(imgContainer.querySelector('img'));
  }

  layoutContainer.append(textSide, imageSide);
  block.append(layoutContainer);
}