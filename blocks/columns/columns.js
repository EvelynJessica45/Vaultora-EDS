// C:\Users\ejessica\Desktop\Vaultora-EDS\blocks\columns\columns.js

/**
 * Columns Block Controller
 * Routes to specific variants to maintain a clean codebase and avoid 404s.
 */
import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

export default async function decorate(block) {
  // Map variant classes to their respective files
  const variants = {
    'about': './variants/about.js',
    'detail': './variants/detail.js'
  };

  // Find which variant is present in the block's classList
  const variantKey = Object.keys(variants).find((key) => block.classList.contains(key));

  if (variantKey) {
    try {
      // 1. Load the corresponding CSS for the variant (Optional if already bundled)
      await loadCSS(`/blocks/columns/variants/${variantKey}.css`);

      // 2. Import the variant logic
      const module = await import(variants[variantKey]);
      
      // 3. Execute the variant's logic
      if (typeof module.default === 'function') {
        await module.default(block);
      }
    } catch (err) {
      console.error(`Failed to load columns variant: ${variantKey}`, err);
    }
  } else {
    // Fallback: If no variant, run standard columns decoration logic if needed
    console.log('Standard columns block initialized.');
  }
}

/**
 * Helper to load CSS programmatically
 */
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