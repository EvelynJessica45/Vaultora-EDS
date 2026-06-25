/* =========================================================================
   Vaultora — scripts/notification-service.js (Email Transactional Layer)
   ========================================================================= */

function injectEmailScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('emailjs-sdk-script')) return resolve();
    const script = document.createElement('script');
    script.id = 'emailjs-sdk-script';
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function initializeEmailJS() {
  try {
    await injectEmailScript();
    if (window.emailjs) {
      window.emailjs.init({
        publicKey: "9eRdcRMl6OK3jBlXL"
      });
      console.log("📨 Centralized Notification Engine Online.");
    }
  } catch (err) {
    console.error("❌ Notification service failed initialization pass:", err);
  }
}

export async function sendOutbidNotification(previousBidderEmail, productName, newAmount, productId) {
  if (!window.emailjs) return console.warn("⚠️ EmailJS SDK unavailable.");
  
  const rebidUrl = `${window.location.origin}/my-bid-details?id=${encodeURIComponent(productId)}`;
  const templateParams = {
    to_email: previousBidderEmail,
    product_name: productName,
    current_highest_bid: Number(newAmount).toFixed(2),
    rebid_url: rebidUrl
  };

  return window.emailjs.send('service_ru15szl', 'template_cx0fg4b', templateParams);
}
      //test

export async function sendVerificationEmail(name, email, token) {
  if (!window.emailjs) return console.warn("⚠️ EmailJS SDK offline.");
  
  const verifyLink = `${window.location.origin}/verify?token=${token}`;
  const templateParams = {
    name: name,
    email: email,
    verify_link: verifyLink
  };

  return window.emailjs.send('service_wviwj9n', 'template_7r9agem', templateParams);
}

window.sendOutbidNotification = sendOutbidNotification;
window.sendVerificationEmail = sendVerificationEmail;