export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Helper functions to pull layout matrix content ddcleanly from column 2 safely
  const getPayload = (row) => row?.children[1];
  const getText = (row) => row?.children[1]?.textContent?.trim() || '';
  const getHTML = (row) => row?.children[1]?.innerHTML || '';

  // -------------------------------------------------------------
  // 1. PHILOSOPHY VARIANT: Luxury Specialties (4 Cards Layout)
  // -------------------------------------------------------------
  if (block.classList.contains('philosophy')) {
    const tagline = getText(rows[2]);
    const approach = getText(rows[3]);
    const titleText = getText(rows[4]);

    block.textContent = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'about-philosophy-wrapper';
wrapper.innerHTML = `
      <div class="phil-left-meta">
        <span class="editorial-badge">${tagline || 'OUR SPECIALTIES'}</span>
        <h2 class="phil-big-header">${titleText || 'What You Can Find on Vaultora'}</h2>
        <p class="phil-approach">${approach || 'We explicitly specialize in high-caliber, exceptionally preserved luxury niches.'}</p>
      </div>
      <div class="phil-center-gallery">
        <div class="luxury-specialty-card">
          <h4 class="specialty-card-title">Luxury Timepieces</h4>
          <p class="specialty-card-body">Mechanical masterpieces, vintage references, and highly limited independent watches sourced directly from verified global collectors.</p>
        </div>
        <div class="luxury-specialty-card">
          <h4 class="specialty-card-title">Premium Tech Gear</h4>
          <p class="specialty-card-body">Rare prototypes, custom-engineered and high-performance digital systems built using elite hardware components.</p>
        </div>
      </div>
      <div class="phil-right-card">
        <div class="luxury-specialty-card">
          <h4 class="specialty-card-title">High-Fidelity Audio</h4>
          <p class="specialty-card-body">Audiophile headphones, boutique tube amplifiers, and meticulously maintained analog setups optimized for pristine acoustic clarity.</p>
        </div>
        <div class="luxury-specialty-card">
          <h4 class="specialty-card-title">Heritage Objects</h4>
          <p class="specialty-card-body">Exceptional design collectibles, luxury travel goods, and architectural items looking for a sustainable second lifecycle.</p>
        </div>
      </div>
    `;
    block.append(wrapper);
    return;
  }

  // -------------------------------------------------------------
  // 2. SERVICES VARIANT: Toggle-Based Interactive FAQ
  // -------------------------------------------------------------
  if (block.classList.contains('services')) {
    block.textContent = '';
    const container = document.createElement('div');
    container.className = 'about-services-container';

    container.innerHTML = `
      <div class="center-header-block">
        <span class="editorial-badge">FAQ</span>
        <h2>Frequently Asked Questions</h2>
        <div class="editorial-center-line"></div>
      </div>
      <div class="faq-accordion-box">
        <div class="faq-row-item">
          <button class="faq-trigger-header" type="button" aria-expanded="false">
            <span>Are all products on your site real?</span>
            <span class="faq-toggle-cross" aria-hidden="true"></span>
          </button>
          <div class="faq-content-slider">
            <p class="faq-prose-text">Yes, 100%. Our expert team visually checks, runs tests, and confirms the background story of every single item before it goes up for bid on our platform. We do not allow fake or unverified goods.</p>
          </div>
        </div>
        <div class="faq-row-item">
          <button class="faq-trigger-header" type="button" aria-expanded="false">
            <span>How do I pay if I win an auction?</span>
            <span class="faq-toggle-cross" aria-hidden="true"></span>
          </button>
          <div class="faq-content-slider">
            <p class="faq-prose-text">You can pay quickly and safely using credit cards, bank transfers, or approved digital wallets. Your payment goes straight into a safe hold until you receive the product and verify its condition.</p>
          </div>
        </div>
        <div class="faq-row-item">
          <button class="faq-trigger-header" type="button" aria-expanded="false">
            <span>What happens if the item is broken or fake?</span>
            <span class="faq-toggle-cross" aria-hidden="true"></span>
          </button>
          <div class="faq-content-slider">
            <p class="faq-prose-text">We hold your funds safely for 3 days after arrival. If the item doesn't match the description or has issues, contact our support team immediately. We will check the problem and issue a full refund if needed.</p>
          </div>
        </div>
        <div class="faq-row-item">
          <button class="faq-trigger-header" type="button" aria-expanded="false">
            <span>How does proxy bidding work?</span>
            <span class="faq-toggle-cross" aria-hidden="true"></span>
          </button>
          <div class="faq-content-slider">
            <p class="faq-prose-text">You just type in the maximum price you're willing to pay. Our system will automatically place small bids for you to keep you in the lead, but it will stop instantly if the bidding passes your set limit.</p>
          </div>
        </div>
        <div class="faq-row-item">
          <button class="faq-trigger-header" type="button" aria-expanded="false">
            <span>How much does shipping cost?</span>
            <span class="faq-toggle-cross" aria-hidden="true"></span>
          </button>
          <div class="faq-content-slider">
            <p class="faq-prose-text">Shipping charges depend on your address and the size of the item. The final delivery price is clearly shown on your checkout breakdown screen before you finalize your payment.</p>
          </div>
        </div>
      </div>
    `;

    const accordionRows = container.querySelectorAll('.faq-row-item');
    accordionRows.forEach(row => {
      const triggerBtn = row.querySelector('.faq-trigger-header');
      const slider = row.querySelector('.faq-content-slider');
      if (!triggerBtn || !slider) return;

      triggerBtn.addEventListener('click', () => {
        const isExpanded = triggerBtn.getAttribute('aria-expanded') === 'true';
        
        accordionRows.forEach(comp => {
          comp.querySelector('.faq-trigger-header')?.setAttribute('aria-expanded', 'false');
          comp.querySelector('.faq-content-slider').style.maxHeight = null;
        });

        if (!isExpanded) {
          triggerBtn.setAttribute('aria-expanded', 'true');
          slider.style.maxHeight = `${slider.scrollHeight}px`;
        } else {
          triggerBtn.setAttribute('aria-expanded', 'false');
          slider.style.maxHeight = null;
        }
      });
    });

    block.append(container);
    return;
  }

  // -------------------------------------------------------------
  // 3. TEAM VARIANT: Clean Global Network Grid
  // -------------------------------------------------------------
  if (block.classList.contains('team')) {
    block.textContent = '';
    const teamContainer = document.createElement('div');
    teamContainer.className = 'about-team-container';
    
    teamContainer.innerHTML = `
      <div class="team-center-hub">
        <span class="editorial-badge">THE EXECUTIVE DIRECTORS</span>
        <h2 class="hub-title-capsule">Meet the Team</h2>
        <p class="hub-teaser-text">Our global network board matches state-of-the-art cryptography verification nodes with unmatched appraisal provenance logistics.</p>
      </div>
      <div class="team-principals-luxury-grid">
        <div class="team-principals-card">
          <div class="principal-photo-box"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80" alt="Evelyn Jessica" /></div>
          <div class="principal-meta">
            <strong>Evelyn Jessica</strong><br /><span>Founder & Vision Lead</span>
            <p class="principal-bio-text">Manages our platform's design ideas and coordinates global business strategy.</p>
          </div>
        </div>
        <div class="team-principals-card">
          <div class="principal-photo-box"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80" alt="Dharun S" /></div>
          <div class="principal-meta">
            <strong>Dharun S</strong><br /><span>Co-Founder & Systems</span>
            <p class="principal-bio-text">Builds and protects our high-speed product verification network systems.</p>
          </div>
        </div>
        <div class="team-principals-card">
          <div class="principal-photo-box"><img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80" alt="Gururaj S" /></div>
          <div class="principal-meta">
            <strong>Gururaj S</strong><br /><span>Chief Logistics Officer</span>
            <p class="principal-bio-text">Oversees our worldwide packing paths and eco-friendly delivery rules.</p>
          </div>
        </div>
        <div class="team-principals-card">
          <div class="principal-photo-box"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80" alt="Marcus Vance" /></div>
          <div class="principal-meta">
            <strong>Marcus Vance</strong><br /><span>Head of Appraisal</span>
            <p class="principal-bio-text">Leads item evaluation, history matching, and luxury art authentications.</p>
          </div>
        </div>
        <div class="team-principals-card">
          <div class="principal-photo-box"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80" alt="Helena Rostova" /></div>
          <div class="principal-meta">
            <strong>Helena Rostova</strong><br /><span>Compliance Counsel</span>
            <p class="principal-bio-text">Handles user safety rules, payment security protection, and legal checks.</p>
          </div>
        </div>
      </div>
    `;
    block.append(teamContainer);
    return;
  }

  // -------------------------------------------------------------
  // 4. CTA VARIANT: Initiate Your Partnership Onboarding Desk
  // -------------------------------------------------------------
  if (block.classList.contains('cta')) {
    block.textContent = '';
    const ctaSection = document.createElement('div');
    ctaSection.className = 'about-cta-section';

    const backdrop = document.createElement('div');
    backdrop.className = 'about-cta-backdrop';
    backdrop.innerHTML = `
      <span class="editorial-badge text-gold">CONCIERGE CONNECTIONS</span>
      <h2 class="about-cta-title">Initiate Your Partnership</h2>
      <p class="about-cta-sub">Connect directly with our support concierge onboarding desk to consign fine collectors' pieces or list tech portfolios safely.</p>
      <a href="mailto:concierge@vaultora.com" class="about-cta-btn">Transmit Inquiry</a>
    `;

    ctaSection.append(backdrop);
    block.append(ctaSection);
    return;
  }

  // -------------------------------------------------------------
  // 5. DEFAULT HERO VARIANT
  // -------------------------------------------------------------
  const imgContainer = rows[0]?.querySelector('div');
  const labelText    = getText(rows[1]) || 'PREMIUM AUCTION MARKETPLACE';
  const titleText    = getHTML(rows[2]) || 'About Vaultora';
  const descText     = getText(rows[3]);
  const btn1         = rows[4]?.querySelector('a');
  const btn2         = rows[5]?.querySelector('a');

  block.textContent = '';

  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'about-hero-container';

  const textSide = document.createElement('div');
  textSide.className = 'about-hero-text-side';

  const label = document.createElement('span');
  label.className = 'about-hero-label';
  label.textContent = labelText;

  const title = document.createElement('h1');
  title.className = 'about-hero-title';
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
  
  const visualFrame = document.createElement('div');
  visualFrame.className = 'hero-visual-frame';
  visualFrame.innerHTML = `<div class="hero-accent-orange-pop"></div>`;
  
  const nativeImg = imgContainer?.querySelector('img');
  if (nativeImg) {
    visualFrame.append(nativeImg);
  } else {
    const placeholder = document.createElement('img');
    placeholder.src = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80';
    placeholder.alt = 'Vaultora Luxury Terminal';
    visualFrame.append(placeholder);
  }
  
  imageSide.append(visualFrame);
  layoutContainer.append(textSide, imageSide);
  block.append(layoutContainer);
}