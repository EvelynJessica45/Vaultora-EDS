// C:\Users\ejessica\Desktop\Vaultorad-EDS\blocks\customcards\customcards.js
import { getProducts, getBids, getSession, saveProducts, saveBids } from '../../scripts/storage.js';

export default async function decorate(block) {
  // Map variant classes to their respective files
  const variants = {
    'auction-products': './variants/auction-products.js',
    'wishlist': './variants/wishlist.js'
  };

  // Find which variant is present in the block's classList
  const variantKey = Object.keys(variants).find((key) => block.classList.contains(key));

  if (variantKey) {
    try {
      // Import the variant logic
      const module = await import(variants[variantKey]);
      
      // Execute the decorator found in the module
      if (typeof module.default === 'function') {
        await module.default(block);
      }
    } catch (err) {
      console.error(`Failed to load customcards variant: ${variantKey}`, err);
    }
  }
}