export default function decorate(block) {
  // Create a massive bright red banner at the top of the body instantly
  const testBanner = document.createElement('div');
  testBanner.style.cssText = 'background: red !important; color: white !important; font-size: 30px !important; text-align: center !important; padding: 20px !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; z-index: 99999 !important; font-weight: bold !important;';
  testBanner.textContent = '🔥 GITHUB HEADER.JS IS CONNECTED AND RUNNING! 🔥';
  
  document.body.prepend(testBanner);
  console.log('⚡ CONNECTIVITY SUCCESS: header.js executed inside the DOM.');
}