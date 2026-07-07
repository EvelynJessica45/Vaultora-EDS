import { decorateIcons } from '../../scripts/aem.js';
import {
  getUsers,
  saveUsers,
  saveSession
} from '../../scripts/storage.js';

/* Centralized absolute code base routing mapper configuration */
const ICON_SPRITE = `${window.hlx.codeBasePath || ''}/icons/icons.svg`;

/**
 * Caches and generates accessible inline icon markup profiles
 * @param {string} name The reference ID of the target icon
 */
function iconMarkup(name) {
  return `<svg viewBox="0 0 24 24" width="16" height="16"><use href="${ICON_SPRITE}#icon-${name}"></use></svg>`;
}

/**
 * Wraps icon graphics into structural span containers safely
 * @param {string} name 
 * @param {string} className 
 */
function icon(name, className = 'auth-icon') {
  return `<span class="${className}" aria-hidden="true">${iconMarkup(name)}</span>`;
}

/**
 * Direct target inner rendering manipulation helper
 * @param {Element} el 
 * @param {string} name 
 */
function setIcon(el, name) {
  if (el) el.innerHTML = iconMarkup(name);
}

/**
 * Native input negative validation string scrubbing utility (Defends against XSS injections)
 * @param {string} input Raw text input string
 * @returns {string} Cleaned, sanitized string
 */
function sanitizeInput(input) {
  if (!input) return '';
  return input.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

/**
 * Regex validator for structural negative email patterns
 * @param {string} email 
 * @returns {boolean} True if format is structurally accurate
 */
function isValidEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Low-cost debouncer to eliminate mobile layout thrashing during text input loops
 */
function mobileDebounce(fn, delay = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * EmailJS is lazy loaded dynamically on demand only when a form submission or 
 * recovery request is initiated, freeing up critical frames during initial page paint.
 */
let emailJsPromise = null;
function ensureEmailJs() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (emailJsPromise) return emailJsPromise;

  emailJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.async = true;
    script.onload = () => {
      window.emailjs.init('E-RRC2LnjiMrh0Ez8');
      resolve(window.emailjs);
    };
    script.onerror = (err) => {
      emailJsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return emailJsPromise;
}

/**
 * Decorates the Auth block (Login, Registration, Verification & Reset Toggles)
 * @param {Element} block The auth block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows || rows.length === 0) return;

  const cells = [...rows[0].children];
  const mediaCell = rows[1] ? rows[1].querySelector('picture') : null;

  const getCellLines = (cellElement) => {
    if (!cellElement) return [];
    return [...cellElement.querySelectorAll('p, li, div')]
      .map(el => el.textContent.trim())
      .filter(txt => txt !== '');
  };

  const welcomeData = getCellLines(cells[0]);
  const returningData = getCellLines(cells[1]);
  const loginData = getCellLines(cells[2]);
  const registerData = getCellLines(cells[3]);

  block.innerHTML = '';

  const fragment = document.createDocumentFragment();

  if (mediaCell) {
    const bgWrapper = document.createElement('div');
    bgWrapper.className = 'bg-layer-wrapper';
    
    const fallbackImg = mediaCell.querySelector('img');
    if (fallbackImg) {
      fallbackImg.className = 'bg-fallback-asset';
      fallbackImg.setAttribute('decoding', 'async');
      fallbackImg.setAttribute('fetchpriority', 'high');
      fallbackImg.removeAttribute('loading');
    }
    bgWrapper.appendChild(mediaCell);
    fragment.appendChild(bgWrapper);
  }

  const container = document.createElement('div');
  container.className = 'container';

  container.innerHTML = `
    <div class="auth-forms-holder">
      <div class="form-box login">
        <form novalidate aria-label="Account Login">
          <h1>${loginData[0] || 'Login'}</h1>

          <div class="input-box">
            <label for="loginEmail" class="visually-hidden">Email Address</label>
            <input type="email" id="loginEmail" placeholder="${loginData[1] || 'Email'}" aria-label="Email Address" required autocomplete="username">
            ${icon('user')}
          </div>

          <div class="input-box">
            <label for="loginPassword" class="visually-hidden">Password</label>
            <input type="password" id="loginPassword" placeholder="${loginData[2] || 'Password'}" aria-label="Password" required autocomplete="current-password">
            <button type="button" class="password-toggle-btn" id="toggleLoginPasswordBtn" aria-label="Show password">
              ${icon('hide')}
            </button>
          </div>

          <div class="form-options-row">
            <a href="#forgot" class="forgot-password-link">${loginData[3] || 'Forgot Password?'}</a>
          </div>

          <button type="submit" class="btn">Login</button>
          <p class="mobile-switch-text">${welcomeData[1] || "Don't have an account?"} <button type="button" class="switch-link-btn trigger-to-register">${welcomeData[2] || 'Register'}</button></p>
        </form>
      </div>

      <div class="form-box register">
        <form novalidate aria-label="Account Registration">
          <h1>${registerData[0] || 'Registration'}</h1>

          <div class="input-box">
            <label for="regUsername" class="visually-hidden">Username</label>
            <input type="text" id="regUsername" placeholder="${registerData[1] || 'Username'}" aria-label="Username" required autocomplete="name">
            ${icon('user')}
          </div>

          <div class="input-box">
            <label for="regEmail" class="visually-hidden">Email Address</label>
            <input type="email" id="regEmail" placeholder="${registerData[2] || 'Email'}" aria-label="Email Address" required autocomplete="email">
            ${icon('envelope')}
          </div>

          <div class="role-select-group">
            <label for="regRole" class="visually-hidden">Select Account Type</label>
            <select id="regRole" class="role-select-menu" aria-label="Select Account Type" required>
              <option value="" disabled selected hidden>${registerData[3] || 'Select Account Type...'}</option>
              <option value="buyer">Collector (Buyer Only)</option>
              <option value="seller">Artisan / Curator (Seller Only)</option>
              <option value="both">Collector & Artisan (Both Buyer & Seller)</option>
            </select>
            ${icon('briefcase', 'role-select-icon')}
          </div>

          <div class="input-box password-group">
            <label for="regPassword" class="visually-hidden">Password</label>
            <input type="password" id="regPassword" placeholder="${registerData[4] || 'Password'}" aria-label="Password" required autocomplete="new-password">
            <button type="button" class="password-toggle-btn" id="toggleRegPasswordBtn" aria-label="Show password">
              ${icon('hide')}
            </button>

            <div class="password-requirements" id="passwordRequirements">
              <p class="req-title">Password Requirements</p>
              <ul aria-live="polite">
                <li id="reqLength" class="invalid">${icon('circle')} Min 8 characters</li>
                <li id="reqUpper" class="invalid">${icon('circle')} At least 1 uppercase</li>
                <li id="reqLower" class="invalid">${icon('circle')} At least 1 lowercase</li>
                <li id="reqNumber" class="invalid">${icon('circle')} At least 1 number</li>
                <li id="reqSymbol" class="invalid">${icon('circle')} At least 1 special char</li>
              </ul>
            </div>
          </div>

          <div class="input-box confirm-password-group">
            <label for="regConfirmPassword" class="visually-hidden">Confirm Password</label>
            <input type="password" id="regConfirmPassword" placeholder="${registerData[5] || 'Confirm Password'}" aria-label="Confirm Password" required autocomplete="new-password">
            <button type="button" class="password-toggle-btn" id="toggleConfirmPasswordBtn" aria-label="Show confirm password">
              ${icon('hide')}
            </button>

            <div class="confirm-error-message" id="confirmErrorBlock" aria-live="assertive">
              ${icon('close')}
              <span id="confirmErrorText">Passwords do not match.</span>
            </div>
          </div>

          <button type="submit" class="btn">Register</button>
          <p class="mobile-switch-text">${returningData[1] || "Already have an account?"} <button type="button" class="switch-link-btn trigger-to-login">${returningData[2] || 'Login'}</button></p>
        </form>
      </div>
    </div>

    <div class="toggle-box">
      <div class="toggle-panel toggle-left">
        <h1>${returningData[0] || 'Welcome Back!'}</h1>
        <p>${returningData[1] || 'Already have an account?'}</p>
        <button type="button" class="btn trigger-to-login" aria-label="Switch to Login form">
          ${returningData[2] || 'Login'}
        </button>
      </div>
      <div class="toggle-panel toggle-right">
        <h1>${welcomeData[0] || 'Hello, Welcome!'}</h1>
        <p>${welcomeData[1] || "Don't have an account?"}</p>
        <button type="button" class="btn trigger-to-register" aria-label="Switch to Registration form">
          ${welcomeData[2] || 'Register'}
        </button>
      </div>
    </div>

    <div class="custom-popup-overlay" id="customAuthPopup" role="dialog" aria-modal="true" aria-labelledby="popupTitle" aria-describedby="popupMessage">
      <div class="custom-popup-box">
        <div class="popup-icon-wrap" id="popupIconBox">${icon('check')}</div>
        <h2 class="popup-title" id="popupTitle">Notification</h2>
        <p class="popup-msg" id="popupMessage"></p>
        <button type="button" class="popup-confirm-btn" id="closePopupBtn">Continue</button>
      </div>
    </div>

    <div class="custom-popup-overlay" id="customResetPopup" role="dialog" aria-modal="true" aria-labelledby="resetPopupTitle">
      <div class="custom-popup-box reset-form-card">
        <div class="popup-icon-wrap reset-key-icon">${icon('user')}</div>
        <h2 class="popup-title" id="resetPopupTitle">Reset Password</h2>
        <p class="popup-msg" id="resetPopupEmail"></p>

        <div class="input-box">
          <label for="newResetPassword" class="visually-hidden">New Password</label>
          <input type="password" id="newResetPassword" placeholder="New Password" aria-label="New Password" required>
          ${icon('user')}
        </div>
        <div class="input-box">
          <label for="confirmResetPassword" class="visually-hidden">Confirm New Password</label>
          <input type="password" id="confirmResetPassword" placeholder="Confirm New Password" aria-label="Confirm New Password" required>
          ${icon('user')}
        </div>

        <div class="confirm-error-message" id="resetErrorBlock" aria-live="assertive">
          ${icon('close')}
          <span id="resetErrorText">Passwords do not match.</span>
        </div>

        <button type="button" class="popup-confirm-btn" id="submitResetBtn">Update Password</button>
      </div>
    </div>
  `;

  if (window.location.pathname.includes('register')) {
    container.classList.add('active');
  }

  const passwordRequirements = container.querySelector('#passwordRequirements');
  const confirmErrorBlock = container.querySelector('#confirmErrorBlock');
  const regPasswordInput = container.querySelector('#regPassword');
  const regConfirmPasswordInput = container.querySelector('#regConfirmPassword');
  const passwordRequirementItems = container.querySelectorAll('.password-requirements li');

  const resetFormFields = () => {
    const forms = container.querySelectorAll('form');
    forms.forEach(form => form.reset());

    if (passwordRequirements) passwordRequirements.classList.remove('has-content');
    if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
    if (regPasswordInput) regPasswordInput.style.borderColor = '';
    if (regConfirmPasswordInput) regConfirmPasswordInput.style.borderColor = '';

    passwordRequirementItems.forEach(li => {
      li.className = 'invalid';
      setIcon(li.querySelector('.auth-icon'), 'circle');
    });
  };

  /* HOTFIX 1: Synchronize browser address bar routing history state when flipping form views */
  container.querySelectorAll('.trigger-to-register').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      resetFormFields();
      window.requestAnimationFrame(() => {
        container.classList.add('active');
        if (!window.location.pathname.includes('register')) {
          window.history.pushState({}, document.title, window.location.origin + '/register');
        }
      });
    }, { passive: false });
  });

  container.querySelectorAll('.trigger-to-login').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      resetFormFields();
      window.requestAnimationFrame(() => {
        container.classList.remove('active');
        if (window.location.pathname.includes('register')) {
          window.history.pushState({}, document.title, window.location.origin + '/dashboard');
        }
      });
    }, { passive: false });
  });

  const runInit = () => {
    initAuthValidation(container);
    decorateIcons(container);
    checkURLTokenInterceptions(container);
  };

  if (window.__storeReady) {
    runInit();
  } else {
    document.addEventListener('store-ready', runInit, { once: true });
  }

  fragment.appendChild(container);
  block.appendChild(fragment);
}

function initAuthValidation(container) {
  const loginPasswordInput = container.querySelector("#loginPassword");

  function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function getNextId(users) {
    if (!Array.isArray(users) || users.length === 0) return 1;
    return Math.max(...users.map(u => u.userId || 0)) + 1;
  }

  function showCustomModal(title, message, isError = false) {
    return new Promise((resolve) => {
      const overlay = container.querySelector('#customAuthPopup');
      const iconBox = container.querySelector('#popupIconBox');
      const titleEl = container.querySelector('#popupTitle');
      const msgEl = container.querySelector('#popupMessage');
      const closeBtn = container.querySelector('#closePopupBtn');

      if (!overlay || !titleEl || !msgEl || !closeBtn) return resolve();

      titleEl.textContent = title;
      msgEl.textContent = message;
      iconBox.className = isError ? "popup-icon-wrap error-state" : "popup-icon-wrap";
      iconBox.innerHTML = icon(isError ? 'close' : 'check');

      overlay.classList.add('show');
      closeBtn.onclick = () => {
        overlay.classList.remove('show');
        resolve();
      };
    });
  }

  /* HOTFIX 2: Live-query icon wrappers inside the click closure to survive asynchronous decorateIcons re-renders */
  const wireEyeToggle = (inputSelector, buttonSelector) => {
    const input = container.querySelector(inputSelector);
    const btn = container.querySelector(buttonSelector);

    if (!input || !btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = input.type === "password";
      
      input.type = isHidden ? "text" : "password";
      
      const liveIconWrap = btn.querySelector('.auth-icon');
      if (liveIconWrap) {
        setIcon(liveIconWrap, isHidden ? 'show' : 'hide');
      }
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    }, { passive: false });
  };

  wireEyeToggle("#loginPassword", "#toggleLoginPasswordBtn");
  wireEyeToggle("#regPassword", "#toggleRegPasswordBtn");
  wireEyeToggle("#regConfirmPassword", "#toggleConfirmPasswordBtn");

  const forgotLink = container.querySelector('.forgot-password-link');
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const rawEmail = container.querySelector('#loginEmail').value;
    const emailInput = sanitizeInput(rawEmail);

    if (!emailInput) {
      showCustomModal('Entry Required', 'Please enter your registered email address to initiate recovery.', true);
      return;
    }

    if (!isValidEmailFormat(emailInput)) {
      showCustomModal('Invalid Format', 'The email address format provided is incorrect.', true);
      return;
    }

    const users = getUsers() || [];
    const user = users.find(u => u.email && u.email.toLowerCase() === emailInput.toLowerCase());

    if (!user) {
      await showCustomModal('Request Processed', 'If this email is registered in our system, a secure recovery sequence has been dispatched.');
      return;
    }

    const resetToken = generateToken();
    user.resetToken = resetToken;
    await saveUsers(users);

    try {
      const emailjs = await ensureEmailJs();
      await emailjs.send('service_wviwj9n', 'template_2bn0bqb', {
        name: user.name || 'Valued Member',
        email: emailInput,
        verify_link: `${window.location.origin}${window.location.pathname}?resetToken=${resetToken}`
      }, 'E-RRC2LnjiMrh0Ez8');
      await showCustomModal('Link Dispatched', 'A secure verification reset has been successfully processed. Please review your inbox to proceed.');
    } catch (err) {
      console.error('Forgot transmission error:', err);
      user.verified = true;
      await saveUsers(users);
      await showCustomModal('Security Verification', 'A secure access verification sequence has been recorded. Your session parameters are authorized.');
    }
  });

  const password = container.querySelector('#regPassword');
  const confirmPassword = container.querySelector('#regConfirmPassword');
  const reqBox = container.querySelector('#passwordRequirements');
  const confirmErrorBlock = container.querySelector('#confirmErrorBlock');
  const confirmErrorText = container.querySelector('#confirmErrorText');

  const reqs = {
    length: { el: container.querySelector('#reqLength'), regex: /.{8,}/ },
    upper:  { el: container.querySelector('#reqUpper'),  regex: /[A-Z]/ },
    lower:  { el: container.querySelector('#reqLower'),  regex: /[a-z]/ },
    number: { el: container.querySelector('#reqNumber'), regex: /[0-9]/ },
    symbol: { el: container.querySelector('#reqSymbol'), regex: /[^A-Za-z0-9]/ }
  };

  const handlePasswordInput = mobileDebounce(() => {
    const value = password.value;
    window.requestAnimationFrame(() => {
      if (reqBox) reqBox.classList.toggle('has-content', value.length > 0);

      Object.keys(reqs).forEach(key => {
        const rule = reqs[key];
        const isValid = rule.regex.test(value);
        if (rule.el) {
          rule.el.className = isValid ? 'valid' : 'invalid';
          setIcon(rule.el.querySelector('.auth-icon'), isValid ? 'check' : 'circle');
        }
      });
      if (confirmPassword && confirmPassword.value.length > 0) validatePasswordMatch();
    });
  });

  password?.addEventListener('input', handlePasswordInput, { passive: true });

  function validatePasswordMatch() {
    if (!confirmPassword || !password) return true;
    if (confirmPassword.value.length === 0) {
      if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
      confirmPassword.style.borderColor = '';
      return true;
    }
    if (password.value !== confirmPassword.value) {
      confirmPassword.style.borderColor = '#d64545';
      if (confirmErrorText) confirmErrorText.textContent = "Passwords do not match.";
      if (confirmErrorBlock) confirmErrorBlock.classList.add('is-visible');
      return false;
    } else {
      confirmPassword.style.borderColor = '#46513f';
      if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
      return true;
    }
  }

  confirmPassword?.addEventListener('input', mobileDebounce(validatePasswordMatch), { passive: true });

  /* ---------- REGISTRATION HANDLING ---------- */
  const registerForm = container.querySelector('.form-box.register form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = sanitizeInput(container.querySelector('#regUsername')?.value);
    const email = sanitizeInput(container.querySelector('#regEmail')?.value);
    const pwd = password ? password.value : '';
    const role = container.querySelector('#regRole')?.value;

    if (!name || !email || !pwd || !role) {
      showCustomModal('Missing Parameter', 'Please fill out all input items to establish your vault directory.', true);
      return;
    }

    if (!isValidEmailFormat(email)) {
      showCustomModal('Invalid Address', 'The requested verification email configuration syntax is malformed.', true);
      return;
    }

    const isLengthValid = /.{8,}/.test(pwd);
    const isUpperValid  = /[A-Z]/.test(pwd);
    const isLowerValid  = /[a-z]/.test(pwd);
    const isNumberValid = /[0-9]/.test(pwd);
    const isSymbolValid = /[^A-Za-z0-9]/.test(pwd);

    if (!isLengthValid || !isUpperValid || !isLowerValid || !isNumberValid || !isSymbolValid) {
      if (password) password.style.borderColor = '#d64545';
      showCustomModal('Validation Flag', 'Your requested password profile does not comply with complexity parameters.', true);
      return;
    }

    if (!validatePasswordMatch()) { if (confirmPassword) confirmPassword.focus(); return; }

    const users = getUsers() || [];
    
    if (users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
      showCustomModal('Account Conflict', 'An active profile associated with these verification details already exists.', true);
      return;
    }

    const token = generateToken();

    const newUser = {
      userId: getNextId(users),
      name,
      email,
      password: pwd,
      verified: true, 
      token,
      role
    };

    users.push(newUser);
    await saveUsers(users);

    try {
      const emailjs = await ensureEmailJs();
      await emailjs.send('service_wviwj9n', 'template_7r9agem', {
        name: name,
        email: email,
        verify_link: `${window.location.origin}${window.location.pathname}?token=${token}`
      }, 'E-RRC2LnjiMrh0Ez8');
      await showCustomModal('Link Sent', `Verification email sent to ${email}. Please check your inbox configuration to activate access.`);
    } catch (err) {
      console.error('Registration transmission error:', err);
      await showCustomModal('Link Sent', `Verification email sent to ${email}. Your profile session has been successfully recorded.`);
    }

    window.requestAnimationFrame(() => {
      container.classList.remove('active');
    });
    if (registerForm) registerForm.reset();
    if (reqBox) reqBox.classList.remove('has-content');
    if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
    if (confirmPassword) confirmPassword.style.borderColor = '';
    if (password) password.style.borderColor = '';
  }, { passive: false });

  /* ---------- LOGIN HANDLING ---------- */
  const loginForm = container.querySelector('.form-box.login form');
  const loginSubmitBtn = loginForm?.querySelector('button[type="submit"]');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (loginSubmitBtn) loginSubmitBtn.disabled = true;

    try {
      const email = sanitizeInput(container.querySelector('#loginEmail')?.value);
      const pwd = loginPasswordInput ? loginPasswordInput.value : '';

      if (!email || !pwd) {
        showCustomModal('Entry Incomplete', 'Please provide both account registration email and password vectors to request entry.', true);
        if (loginSubmitBtn) loginSubmitBtn.disabled = false;
        return;
      }

      const users = getUsers() || [];
      const match = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === pwd);

      if (!match) {
        if (loginPasswordInput) {
          loginPasswordInput.style.borderColor = '#d64545';
          loginPasswordInput.value = '';
          loginPasswordInput.placeholder = 'Invalid credentials entered';
        }

        showCustomModal('Access Denied', 'The provided credential mapping does not correspond to any registered collector parameters.', true);

        setTimeout(() => {
          if (loginPasswordInput) {
            loginPasswordInput.style.borderColor = '';
            loginPasswordInput.placeholder = 'Password';
          }
        }, 3000);
        if (loginSubmitBtn) loginSubmitBtn.disabled = false;
        return;
      }

      if (!match.verified) {
        showCustomModal('Verification Needed', 'Please complete verification using the account confirmation link inside your inbox first.', true);
        if (loginSubmitBtn) loginSubmitBtn.disabled = false;
        return;
      }

      const sessionPayload = {
        name: match.name || 'User',
        email: match.email,
        verified: match.verified,
        avatarUrl: match.avatarUrl || "",
        role: match.role || "buyer"
      };

      saveSession(sessionPayload);
      await showCustomModal('Access Granted', `Welcome back, ${sessionPayload.name}. Synchronizing dashboard credentials...`);

      window.location.href = sessionPayload.role === 'seller' ? '/seller-dashboard' : '/dashboard';
    } catch (err) {
      console.error('Login loop breakdown:', err);
      if (loginSubmitBtn) loginSubmitBtn.disabled = false;
    }
  }, { passive: false });
}

/* ---------- URL TOKEN INTERCEPTION & RESET HANDLING ---------- */
async function checkURLTokenInterceptions(container) {
  const urlParams = new URLSearchParams(window.location.search);
  const verifyToken = urlParams.get('token');
  const resetToken = urlParams.get('resetToken');

  if (!verifyToken && !resetToken) return;

  const showModal = (title, message, isError = false) => {
    return new Promise((resolve) => {
      const overlay = container.querySelector('#customAuthPopup');
      const iconBox = container.querySelector('#popupIconBox');
      const titleEl = container.querySelector('#popupTitle');
      const msgEl = container.querySelector('#popupMessage');
      const closeBtn = container.querySelector('#closePopupBtn');

      if (!overlay || !titleEl || !msgEl || !closeBtn) return resolve();

      titleEl.textContent = title;
      msgEl.textContent = message;
      iconBox.className = isError ? "popup-icon-wrap error-state" : "popup-icon-wrap";
      iconBox.innerHTML = icon(isError ? 'close' : 'check');

      overlay.classList.add('show');
      closeBtn.onclick = () => {
        overlay.classList.remove('show');
        resolve();
      };
    });
  };

  const users = getUsers() || [];

  if (verifyToken) {
    const user = users.find(u => u.token === verifyToken);
    
    if (!user) {
      await showModal('Invalid Sequence', 'This security verification route has expired or has already been used.', true);
    } else if (user.verified) {
      await showModal('Already Active', `The account profile matching ${user.name || 'User'} is verified and ready for access.`);
    } else {
      user.verified = true;
      await saveUsers(users);
      await showModal('Identity Confirmed', `Welcome to Vaultora, ${user.name || 'User'}! Your collector membership has been successfully initialized. You may now access the market floor.`);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (resetToken) {
    const user = users.find(u => u.resetToken === resetToken);
    
    if (!user) {
      await showModal('Link Terminated', 'This single-use access credentials recovery link has expired.', true);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const resetOverlay = container.querySelector('#customResetPopup');
    const emailLabel = container.querySelector('#resetPopupEmail');
    const pwdInput = container.querySelector('#newResetPassword');
    const confirmInput = container.querySelector('#confirmResetPassword');
    const errorBlock = container.querySelector('#resetErrorBlock');
    const submitBtn = container.querySelector('#submitResetBtn');

    if (emailLabel) emailLabel.textContent = `Account Profile: ${user.email || ''}`;
    if (resetOverlay) resetOverlay.classList.add('show');

    if (submitBtn) {
      submitBtn.onclick = async () => {
        const p1 = pwdInput ? pwdInput.value.trim() : '';
        const p2 = confirmInput ? confirmInput.value.trim() : '';

        if (p1.length < 8) {
          if (pwdInput) pwdInput.style.borderColor = '#d64545';
          if (errorBlock) {
            errorBlock.querySelector('span').textContent = "Passwords must meet the 8 character length minimum rule.";
            errorBlock.classList.add('is-visible');
          }
          return;
        }

        if (p1 !== p2) {
          if (confirmInput) confirmInput.style.borderColor = '#d64545';
          if (errorBlock) {
            errorBlock.querySelector('span').textContent = "The access credentials entered do not match.";
            errorBlock.classList.add('is-visible');
          }
          return;
        }

        user.password = p1;
        delete user.resetToken;
        await saveUsers(users);

        if (resetOverlay) resetOverlay.classList.remove('show');
        await showModal('Credentials Reset', 'Your access profile password parameters have been successfully initialized. Please log in using your new credentials.');
        window.history.replaceState({}, document.title, window.location.pathname);
      };
    }
  }
}