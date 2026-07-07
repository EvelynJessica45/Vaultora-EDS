/* =========================================================================
   Vaultora — scripts/notification-service.js (Email Transactional Layer)
   ========================================================================= */

function injectEmailScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('emailjs-sdk-script')) return resolve();
    const script = document.createElement('script');
    script.id = 'emailjs-sdk-script';
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.defer = true;
    script.onload = resolve;
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

export async function initializeEmailJS() {
  try {
    await injectEmailScript();
    if (typeof window !== 'undefined' && window.emailjs) {
      window.emailjs.init({
        publicKey: "9eRdcRMl6OK3jBlXL"
      });
      console.log("📨 Centralized Notification Engine Online.");
    }
  } catch (err) {
    console.warn("⚠️ Notification service failed initialization pass (Network offline or script blocked):", err.message || err);
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

  try {
    return await window.emailjs.send('service_ru15szl', 'template_cx0fg4b', templateParams);
  } catch (err) {
    console.error("❌ Send outbid notification failed:", err);
  }
}

export async function sendVerificationEmail(name, email, token) {
  if (!window.emailjs) return console.warn("⚠️ EmailJS SDK offline.");
  
  const verifyLink = `${window.location.origin}/verify?token=${token}`;
  const templateParams = {
    name: name,
    email: email,
    verify_link: verifyLink
  };

  try {
    return await window.emailjs.send('service_wviwj9n', 'template_7r9agem', templateParams);
  } catch (err) {
    console.error("❌ Send verification email failed:", err);
  }
}

window.sendOutbidNotification = sendOutbidNotification;
window.sendVerificationEmail = sendVerificationEmail;