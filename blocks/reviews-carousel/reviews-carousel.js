/**
 * Decorates the reviews-carousel block with an elegant auto-advancing slider engine
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // 1. Build an Editorial Header Title Layout dynamically
  const headerContainer = document.createElement('div');
  headerContainer.className = 'reviews-carousel-header';
  headerContainer.innerHTML = `
    <h2>What Our Collectors <span>Are Saying</span></h2>
    <p>Real experiences from trusted sellers and buyers worldwide</p>
  `;

  // Create primary architectural containers
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'reviews-carousel-track-wrapper';

  const carouselTrack = document.createElement('div');
  carouselTrack.className = 'reviews-carousel-track';

  // Process rows into unified semantic slides
  rows.forEach((row) => {
    if (row.children.length < 3) return;

    const slide = document.createElement('div');
    slide.className = 'reviews-carousel-slide';

    const imgCol = row.children[0];
    const userCol = row.children[1];
    const reviewCol = row.children[2];

    // Profile Avatar Ring Frame
    const avatarFrame = document.createElement('div');
    avatarFrame.className = 'review-avatar-frame';
    const originalImg = imgCol.querySelector('img, picture');
    if (originalImg) {
      avatarFrame.append(originalImg);
    } else {
      avatarFrame.classList.add('avatar-placeholder');
    }

    // User Identity Metadata
    const identityBox = document.createElement('div');
    identityBox.className = 'review-identity-box';
    
    const nameNode = document.createElement('h4');
    nameNode.className = 'review-user-name';
    nameNode.textContent = userCol.querySelector('strong') ? userCol.querySelector('strong').innerText : userCol.innerText;
    
    const roleNode = document.createElement('span');
    roleNode.className = 'review-user-role';
    roleNode.textContent = userCol.querySelector('em') ? userCol.querySelector('em').innerText : 'Verified User';

    identityBox.append(nameNode, roleNode);

    // Profile Metadata Header Row
    const profileRow = document.createElement('div');
    profileRow.className = 'review-profile-header-row';
    profileRow.append(avatarFrame, identityBox);

    // Stars & Text Content Layer
    const ratingNode = document.createElement('div');
    ratingNode.className = 'review-stars-row';
    ratingNode.innerHTML = '&#9733;&#9733;&#9733;&#9733;&#9733;';

    const commentNode = document.createElement('p');
    commentNode.className = 'review-comment-text';
    commentNode.textContent = reviewCol.innerText.replace(/[★\s]/g, '').length > 0 
      ? reviewCol.innerText.replace(/[★\u2605]/g, '').trim() 
      : reviewCol.innerText;

    slide.append(profileRow, ratingNode, commentNode);
    carouselTrack.append(slide);
  });

  carouselWrapper.append(carouselTrack);

  // Clear raw layout DOM elements safely
  block.textContent = '';
  block.append(headerContainer, carouselWrapper);

  // ── AUTO-ADVANCE SLIDER LOOP ENGINE ──
  let currentIndex = 0;
  let autoScrollTimer = null;
  const slideIntervalDuration = 3500; // Time interval per slide transitions (3.5s)
  
  function getCardsInView() {
    if (window.innerWidth >= 900) return 3;
    if (window.innerWidth >= 600) return 2;
    return 1;
  }

  function updateCarouselPosition() {
    const totalSlides = carouselTrack.children.length;
    const cardsInView = getCardsInView();
    const maxIndex = totalSlides - cardsInView;

    // Loop cycle boundaries wrap-around
    if (currentIndex > maxIndex) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIndex;

    const firstSlide = carouselTrack.children[0];
    const slideWidth = firstSlide ? firstSlide.getBoundingClientRect().width : 0;
    const gap = 20; 
    
    const moveOffset = currentIndex * (slideWidth + gap);
    carouselTrack.style.transform = `translateX(-${moveOffset}px)`;
  }

  function startAutoCycle() {
    if (autoScrollTimer) return;
    autoScrollTimer = setInterval(() => {
      currentIndex += 1;
      updateCarouselPosition();
    }, slideIntervalDuration);
  }

  function stopAutoCycle() {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }

  // Smart Interactions: Pause on user cursor hover to make text readable
  block.addEventListener('mouseenter', stopAutoCycle);
  block.addEventListener('mouseleave', startAutoCycle);

  // Handle mobile window size tracking recalibrations
  let resizeDebounceTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounceTimeout);
    resizeDebounceTimeout = setTimeout(() => {
      updateCarouselPosition();
    }, 100);
  });

  // Init sequence execution passes
  setTimeout(() => {
    updateCarouselPosition();
    startAutoCycle();
  }, 400);
}