// C:\Users\ejessica\Desktop\Vaultora-EDS\blocks\forms\forms.js
import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

export default async function decorate(block) {
  const variants = {
    'checkout': './variants/checkout.js',
    'seller-dashboard': './variants/seller-dashboard.js'
  };

  const variantKey = Object.keys(variants).find((key) => block.classList.contains(key));

  if (variantKey) {
    try {
      // Load CSS specifically for the variant
      await loadCSS(`/blocks/forms/variants/${variantKey}.css`);

      // Dynamically import the variant logic
      const module = await import(variants[variantKey]);
      
      if (typeof module.default === 'function') {
        await module.default(block);
      }
    } catch (err) {
      console.error(`Failed to load forms variant: ${variantKey}`, err);
    }
  }
}

async function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}