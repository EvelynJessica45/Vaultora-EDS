// // Change this in blocks/cards/cards.js
// export default async function decorate(block) {
//   const variants = ['mybids', 'my-bid-details', 'mylistings', 'my-listing-details', 'orders'];
//   const activeVariant = variants.find(v => block.classList.contains(v));

//   if (!activeVariant) return;

//   // Use the full relative path from the cards.js file
//   const cssPath = `${window.hlx.codeBasePath}/blocks/cards/variants/${activeVariant}.css`;
//   const link = document.createElement('link');
//   link.rel = 'stylesheet';
//   link.href = cssPath;
//   document.head.appendChild(link);

//   try {
//     // Crucial: Use a path relative to the current file (./variants/...)
//     // If that fails, AEM often requires the path to be absolute from the root
//     const module = await import(`./variants/${activeVariant}.js`);
//     if (module.default) {
//       module.default(block);
//     }
//   } catch (err) {
//     console.error(`Failed to load variant: ${activeVariant}`, err);
//     // Fallback: try an absolute path if relative import fails
//     try {
//         const altModule = await import(`${window.hlx.codeBasePath}/blocks/cards/variants/${activeVariant}.js`);
//         if (altModule.default) altModule.default(block);
//     } catch (err2) {
//         console.error("Secondary import path also failed", err2);
//     }
//   }
// }

// C:\Users\ejessica\Desktop\Vaultora-EDS\blocks\cards\cards.js

export default async function decorate(block) {
  const variants = {
    'mybids': './variants/mybids.js',
    'my-bid-details': './variants/my-bid-details.js',
    'mylistings': './variants/mylistings.js',
    'my-listing-details': './variants/my-listing-details.js',
    'orders': './variants/orders.js',
    'profile': './variants/profile.js' // Added profile variant
  };

  const variantKey = Object.keys(variants).find((key) => block.classList.contains(key));

  if (variantKey) {
    try {
      const module = await import(variants[variantKey]);
      if (typeof module.default === 'function') {
        await module.default(block);
      }
    } catch (err) {
      console.error(`Failed to load cards variant: ${variantKey}`, err);
    }
  }
}