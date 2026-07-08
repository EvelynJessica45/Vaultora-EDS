import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

/**
 * Hardcoded Universal Layout Decorator for Vaultora Footer
 * Bypasses side-sloading external fragments to solve duplicate instances.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // Prevent duplicate execution lifecycles on the same DOM element node
  if (block.hasAttribute('data-footer-decorated')) return;
  block.setAttribute('data-footer-decorated', 'true');

  block.classList.add('footer');

  // ── 1. INJECT HARDCODED INLINE CSS STYLES SHEET ──
  const styleId = 'vaultora-footer-injected-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      footer, .footer-container, .footer-wrapper {
        background-color: var(--nav-forest-dark, #2e362a) !important;
        display: block !important;
        width: 100% !important;
        clear: both;
      }
      .footer {
        color: #ffffff; 
        font-family: 'DM Sans', sans-serif;
        background-color: var(--nav-forest-dark, #2e362a) !important;
        display: block !important;
        width: 100%;
        box-sizing: border-box;
      }
      .footer .footer-rule {
        height: 3px;
        background: linear-gradient(
          to right,
          transparent,
          rgba(185, 146, 90, 0.2) 20%,
          rgba(185, 146, 90, 0.5) 50%,
          rgba(185, 146, 90, 0.2) 80%,
          transparent
        );
      }
      .footer .footer-inner {
        max-width: 1240px;
        margin: 0 auto;
        padding: 4rem 2rem 2.5rem;
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr 1fr; 
        gap: 2.5rem 2rem;
        align-items: start;
      }
      .footer .footer-brand {
        display: flex;
        flex-direction: column;
      }
      .footer .footer-logo-wrap {
        display: inline-block;
        margin-bottom: 16px;
        width: 140px;
        height: auto;
      }
      .footer .footer-logo-wrap img {
        display: block;
        height: auto;
        width: 120px;
        max-width: 100%;
        opacity: .95;
      }
      .footer .footer-tagline {
        font-size: .85rem;
        line-height: 1.7; 
        color: #e0e6dc; 
        max-width: 240px;
        margin: 0 0 20px 0;
      }
      .footer .footer-socials {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      .footer .footer-social-link {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--nav-text-gold, #b9925a); 
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s;
        box-sizing: border-box;
      }
      .footer .footer-social-link span.icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
      }
      .footer .footer-social-link span.icon img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: invert(95%) sepia(11%) saturate(542%) hue-rotate(323deg) brightness(95%) contrast(89%);
        opacity: 0.85;
      }
      .footer .footer-social-link:hover {
        border-color: #ffffff;
        transform: translateY(-2px);
      }
      .footer .footer-col-title {
        font-size: .75rem;
        font-weight: 600;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--nav-text-gold, #b9925a);
        margin-bottom: 16px;
      }
      .footer .footer-links {
        list-style: none;
        padding-left: 0; 
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .footer .footer-links li {
        list-style: none;
      }
      .footer .footer-links a {
        font-size: .88rem;
        color: #ffffff; 
        text-decoration: none;
        transition: color .18s;
        display: inline-block;
        line-height: 1.5; 
      }
      .footer .footer-links a:hover {
        color: var(--nav-text-gold, #b9925a);
      }
      .footer .footer-bottom {
        max-width: 1240px;
        margin: 0 auto;
        padding: 20px 2rem 28px;
        border-top: 1px solid rgba(255, 255, 255, .15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .footer .footer-copy {
        font-size: .78rem;
        color: #cbd4c5;
      }

      @media (max-width: 920px) {
        .footer .footer-inner {
          grid-template-columns: 1fr 1fr;
          padding: 3rem 2rem;
        }
        .footer .footer-brand {
          grid-column: 1 / -1;
        }
      }
      @media (max-width: 580px) {
        .footer .footer-inner {
          grid-template-columns: 1fr;
          padding: 2.5rem 1.5rem;
          gap: 2rem;
        }
        .footer .footer-bottom {
          flex-direction: column;
          align-items: flex-start;
          padding: 1.5rem;
          gap: 10px;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // ── 2. HARDCODED STRUCTURE CONFIG DATA ──
  const footerData = {
    brand: {
      logoSrc: '/media_122fd104a0d60ef7f35a206cc31029a4c277acceb.png', // Fallback context path
      tagline: 'Luxury sustainable auctions for the conscious collector.',
      socials: [
        { network: 'instagram', url: '#instagram' },
        { network: 'linkedin', url: '#linkedin' },
        { network: 'x', url: '#x' }
      ]
    },
    navigation: [
      {
        title: 'MARKETPLACE',
        links: [
          { text: 'Browse Auctions', url: '#browse-auctions' },
          { text: 'List an Item', url: '#list-an-item' },
          { text: 'My Bids', url: '#my-bids' },
          { text: 'Favorites', url: '#favorites' },
          { text: 'My Listing', url: '#my-listing' }
        ]
      },
      {
        title: 'ACCOUNT',
        links: [
          { text: 'Profile', url: '#profile' },
          { text: 'Login/Sign Up', url: '#login/sign-up' }
        ]
      },
      {
        title: 'ABOUT',
        links: [
          { text: 'About Vaultora', url: '#about-vaultora' },
          { text: 'How It Works', url: '#how-it-works' },
          { text: 'FAQ', url: '#faq' },
          { text: 'Contact Us', url: '#contact-us' }
        ]
      }
    ],
    copyright: '© 2026 Vaultora. All rights reserved.'
  };

  // Check if document contains author upload media paths to prevent broken links in development
  const localImg = document.querySelector('main .footer block picture img, footer picture img');
  if (localImg && localImg.src) {
    footerData.brand.logoSrc = localImg.src;
  }

  // ── 3. DOM TRANSFORMATION & BUILD ──
  const fragment = document.createDocumentFragment();

  // Top Rule line
  const rule = document.createElement('div');
  rule.className = 'footer-rule';
  fragment.appendChild(rule);

  // Columns Matrix grid canvas
  const innerContainer = document.createElement('div');
  innerContainer.className = 'footer-inner';

  // Construct Brand Section Column
  const brandCol = document.createElement('div');
  brandCol.className = 'footer-brand';

  const logoWrap = document.createElement('div');
  logoWrap.className = 'footer-logo-wrap';
  const optimizedPicture = createOptimizedPicture(footerData.brand.logoSrc, 'Vaultora Logo', false, [{ width: '250' }]);
  logoWrap.appendChild(optimizedPicture);
  brandCol.appendChild(logoWrap);

  const tagline = document.createElement('p');
  tagline.className = 'footer-tagline';
  tagline.textContent = footerData.brand.tagline;
  brandCol.appendChild(tagline);

  // Icon injection parsing context
  const socialsWrap = document.createElement('div');
  socialsWrap.className = 'footer-socials';
  footerData.brand.socials.forEach((social) => {
    const anchor = document.createElement('a');
    anchor.href = social.url;
    anchor.ariaLabel = `Visit our ${social.network} page`;
    anchor.className = `footer-social-link link-${social.network}`;
    
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon icon-${social.network}`;
    
    const iconImg = document.createElement('img');
    iconImg.setAttribute('data-icon-name', social.network);
    iconImg.src = `/icons/${social.network}.svg`;
    iconImg.alt = '';
    iconImg.setAttribute('loading', 'lazy');
    iconImg.setAttribute('width', '16');
    iconImg.setAttribute('height', '16');

    iconSpan.appendChild(iconImg);
    anchor.appendChild(iconSpan);
    socialsWrap.appendChild(anchor);
  });
  brandCol.appendChild(socialsWrap);
  innerContainer.appendChild(brandCol);

  // Construct Links Columns
  footerData.navigation.forEach((nav) => {
    const navCol = document.createElement('div');
    navCol.className = 'footer-nav-col';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'footer-col-title';
    titleDiv.textContent = nav.title;
    navCol.appendChild(titleDiv);

    const linksList = document.createElement('ul');
    linksList.className = 'footer-links';

    nav.links.forEach((link) => {
      const listItem = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.textContent = link.text;
      listItem.appendChild(anchor);
      linksList.appendChild(listItem);
    });

    navCol.appendChild(linksList);
    innerContainer.appendChild(navCol);
  });

  fragment.appendChild(innerContainer);

  // Construct Copyright bottom bar
  const bottomBar = document.createElement('div');
  bottomBar.className = 'footer-bottom';
  const copyDiv = document.createElement('div');
  copyDiv.className = 'footer-copy';
  copyDiv.textContent = footerData.copyright;
  bottomBar.appendChild(copyDiv);
  fragment.appendChild(bottomBar);

  // Flush remaining runtime nodes and append the structured dynamic asset safely
  block.innerHTML = '';
  block.appendChild(fragment);
  
  // Final verification formatting step for SVG standard vector graphics resolution
  decorateIcons(block);
}