export default function decorate(block) {
  const contentElement = block.querySelector(':scope > div > div');
  if (!contentElement) return;

  const rawText = contentElement.innerHTML.trim();
  block.innerHTML = '';

  // Create the tracking canvas container
  const track = document.createElement('div');
  track.className = 'marquee-track';

  // Format your custom divider stars/icons seen in the template image
  const formattedContent = rawText.split('•').map(item => `
    <span class="marquee-item">
      <span class="marquee-dot"></span>
      ${item.trim()}
      <span class="marquee-star">✦</span>
    </span>
  `).join('');

  // Duplicate content blocks to enable an unbroken visual loop cycle
  track.innerHTML = formattedContent + formattedContent + formattedContent;
  block.appendChild(track);
}