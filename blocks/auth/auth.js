import { decorateIcons } from '../../scripts/aem.js';
import {
  getUsers,
  saveUsers,
  saveSession
} from '../../scripts/storage.js';

/**
 * Icons live in one external sprite (/icons/icons.svg) instead of an icon
 * font or inline-per-instance SVG markup. One small cached request serves
 * every icon on the page (vs. a font-CDN request before), and each <use>
 * still inherits color via currentColor exactly like the old inline icons
 * did, so per-context coloring (error red, valid green, etc.) still works.
 */
const ICON_SPRITE = '/icons/icons.svg';

function iconMarkup(name) {
  return `<svg viewBox="0 0 24 24"><use href="${ICON_SPRITE}#icon-${name}"></use></svg>`;
}

function icon(name, className = 'auth-icon') {
  return `<span class="${className}" aria-hidden="true">${iconMarkup(name)}</span>`;
}

function setIcon(el, name) {
  if (el) el.innerHTML = iconMarkup(name);
}

/**
 * Fonts are now self-hosted (see the @font-face rules in auth.css) instead
 * of pulled from fonts.googleapis.com, so there's no external font origin
 * left at all — no DNS lookup, no render-blocking cross-origin request,
 * and cache lifetime is fully under this site's control. All that's left
 * to do from JS is hint the browser to fetch the two above-the-fold
 * weights (heading + body) a little earlier.
 */
function preloadFonts() {
  if (document.querySelector('link[data-auth-fonts]')) return;

  [
    { href: '/fonts/cormorant-garamond-700.woff2' },
    { href: '/fonts/dm-sans-400.woff2' },
  ].forEach(({ href }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.dataset.authFonts = 'true';
    document.head.appendChild(link);
  });
}

/**
 * EmailJS is only needed when the person actually submits the register
 * form or requests a password reset — most visitors never do either on a
 * given page load. Loading it eagerly on every decorate() call was costing
 * unused JS + main-thread time on every single visit. It's now fetched
 * once, on demand, and cached via emailJsPromise so repeat calls are free.
 */
let emailJsPromise = null;
function ensureEmailJs() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (emailJsPromise) return emailJsPromise;

  emailJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
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
              ${icon('error-circle')}
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
        <div class="popup-icon-wrap" id="popupIconBox">${icon('check-circle')}</div>
        <h3 class="popup-title" id="popupTitle">Notification</h3>
        <p class="popup-msg" id="popupMessage"></p>
        <button type="button" class="popup-confirm-btn" id="closePopupBtn">Continue</button>
      </div>
    </div>

    <div class="custom-popup-overlay" id="customResetPopup" role="dialog" aria-modal="true" aria-labelledby="resetPopupTitle">
      <div class="custom-popup-box reset-form-card">
        <div class="popup-icon-wrap reset-key-icon">${icon('key')}</div>
        <h3 class="popup-title" id="resetPopupTitle">Reset Password</h3>
        <p class="popup-msg" id="resetPopupEmail"></p>

        <div class="input-box">
          <label for="newResetPassword" class="visually-hidden">New Password</label>
          <input type="password" id="newResetPassword" placeholder="New Password" aria-label="New Password" required>
          ${icon('lock-alt')}
        </div>
        <div class="input-box">
          <label for="confirmResetPassword" class="visually-hidden">Confirm New Password</label>
          <input type="password" id="confirmResetPassword" placeholder="Confirm New Password" aria-label="Confirm New Password" required>
          ${icon('lock-open-alt')}
        </div>

        <div class="confirm-error-message" id="resetErrorBlock" aria-live="assertive">
          ${icon('error-circle')}
          <span id="resetErrorText">Passwords do not match.</span>
        </div>

        <button type="button" class="popup-confirm-btn" id="submitResetBtn">Update Password</button>
      </div>
    </div>
  `;

  if (window.location.pathname.includes('register')) {
    container.classList.add('active');
  }

  preloadFonts();

  const resetFormFields = () => {
    const forms = container.querySelectorAll('form');
    forms.forEach(form => form.reset());

    const reqBox = container.querySelector('#passwordRequirements');
    if (reqBox) reqBox.classList.remove('has-content');

    const errBlock = container.querySelector('#confirmErrorBlock');
    if (errBlock) errBlock.classList.remove('is-visible');

    const p1 = container.querySelector('#regPassword');
    const p2 = container.querySelector('#regConfirmPassword');
    if (p1) p1.style.borderColor = '';
    if (p2) p2.style.borderColor = '';

    container.querySelectorAll('.password-requirements li').forEach(li => {
      li.className = 'invalid';
      setIcon(li.querySelector('.auth-icon'), 'circle');
    });
  };

  container.querySelectorAll('.trigger-to-register').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      resetFormFields();
      container.classList.add('active');
    });
  });

  container.querySelectorAll('.trigger-to-login').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      resetFormFields();
      container.classList.remove('active');
    });
  });

  await (window.__storeReady || Promise.resolve());
  initAuthValidation(container);
  decorateIcons(container);
  block.appendChild(container);
  checkURLTokenInterceptions(container);
}

// Complete initialization and intercept token modules mapped accurately from source configurations
function initAuthValidation(container) {
  const loginPasswordInput = container.querySelector("#loginPassword");

  function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function getNextId(users) {
    if (users.length === 0) return 1;
    return Math.max(...users.map(u => u.userId)) + 1;
  }

  function showCustomModal(title, message, isError = false) {
    return new Promise((resolve) => {
      const overlay = container.querySelector('#customAuthPopup');
      const iconBox = container.querySelector('#popupIconBox');
      const titleEl = container.querySelector('#popupTitle');
      const msgEl = container.querySelector('#popupMessage');
      const closeBtn = container.querySelector('#closePopupBtn');

      titleEl.textContent = title;
      msgEl.textContent = message;
      iconBox.className = isError ? "popup-icon-wrap error-state" : "popup-icon-wrap";
      iconBox.innerHTML = icon(isError ? 'error-circle' : 'check-circle');

      overlay.classList.add('show');
      closeBtn.onclick = () => {
        overlay.classList.remove('show');
        resolve();
      };
    });
  }

  const wireEyeToggle = (inputSelector, buttonSelector) => {
    const input = container.querySelector(inputSelector);
    const btn = container.querySelector(buttonSelector);
    const iconWrap = btn ? btn.querySelector('.auth-icon') : null;

    if (!input || !btn || !iconWrap) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      setIcon(iconWrap, isHidden ? 'show' : 'hide');
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  };

  wireEyeToggle("#loginPassword", "#toggleLoginPasswordBtn");
  wireEyeToggle("#regPassword", "#toggleRegPasswordBtn");
  wireEyeToggle("#regConfirmPassword", "#toggleConfirmPasswordBtn");

  const forgotLink = container.querySelector('.forgot-password-link');
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const emailInput = container.querySelector('#loginEmail').value.trim();
    if (!emailInput) {
      showCustomModal('Reset Terminated', 'Please specify your targeted account profile email context space first.', true);
      return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === emailInput.toLowerCase());

    if (userIndex === -1) {
      await showCustomModal('Dispatch Completed', `If that account exists, a recovery validation link has been dispatched to your inbox.`);
      return;
    }

    const resetToken = generateToken();
    users[userIndex].resetToken = resetToken;
    await saveUsers(users);

    const baseHref = window.location.href.split('#')[0].split('?')[0];
    const resetLink = `${baseHref}?resetToken=${resetToken}`;

    try {
      const emailjs = await ensureEmailJs();
      await emailjs.send('service_wviwj9n', 'template_2bn0bqb', {
        name: users[userIndex].name,
        email: emailInput,
        verify_link: resetLink
      });
      await showCustomModal('Dispatch Completed', `A password recovery link has been safely routed to ${emailInput}. Check your inbox folder context.`);
    } catch (err) {
      console.error('Forgot transmission error:', err);
      await showCustomModal('Network Interruption', 'Failed to safely bridge routing networks.', true);
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

  password?.addEventListener('input', () => {
    const value = password.value;
    reqBox.classList.toggle('has-content', value.length > 0);

    Object.keys(reqs).forEach(key => {
      const rule = reqs[key];
      const isValid = rule.regex.test(value);
      if (rule.el) {
        rule.el.className = isValid ? 'valid' : 'invalid';
        setIcon(rule.el.querySelector('.auth-icon'), isValid ? 'check-circle' : 'circle');
      }
    });
    if (confirmPassword.value.length > 0) validatePasswordMatch();
  });

  function validatePasswordMatch() {
    if (confirmPassword.value.length === 0) {
      confirmErrorBlock.classList.remove('is-visible');
      confirmPassword.style.borderColor = '';
      return true;
    }
    if (password.value !== confirmPassword.value) {
      confirmPassword.style.borderColor = '#d64545';
      confirmErrorText.textContent = "Passwords do not match.";
      confirmErrorBlock.classList.add('is-visible');
      return false;
    } else {
      confirmPassword.style.borderColor = '#46513f';
      confirmErrorBlock.classList.remove('is-visible');
      return true;
    }
  }

  confirmPassword?.addEventListener('input', validatePasswordMatch);

  const registerForm = container.querySelector('.form-box.register form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#regUsername').value.trim();
    const email = container.querySelector('#regEmail').value.trim();
    const pwd = password.value;
    const role = container.querySelector('#regRole').value;

    if (!name || !email || !pwd || !role) {
      showCustomModal('Execution Error', 'All registration inputs are required.', true);
      return;
    }

    const isLengthValid = /.{8,}/.test(pwd);
    const isUpperValid  = /[A-Z]/.test(pwd);
    const isLowerValid  = /[a-z]/.test(pwd);
    const isNumberValid = /[0-9]/.test(pwd);
    const isSymbolValid = /[^A-Za-z0-9]/.test(pwd);

    if (!isLengthValid || !isUpperValid || !isLowerValid || !isNumberValid || !isSymbolValid) {
      password.style.borderColor = '#d64545';
      showCustomModal('Weak Password', 'Please update your entry to satisfy all highlighted cryptographic rules.', true);
      return;
    }

    if (!validatePasswordMatch()) { confirmPassword.focus(); return; }

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      showCustomModal('Account Conflict', 'An account with this email address already exists.', true);
      return;
    }

    const token = generateToken();
    const baseHref = window.location.href.split('#')[0].split('?')[0];
    const verifyLink = `${baseHref}?token=${token}`;

    const newUser = {
      userId: getNextId(users),
      name,
      email,
      password: pwd,
      verified: false,
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
        verify_link: verifyLink
      });
      await showCustomModal('Registration Placed', `Verification dispatch sent to ${email}. Please confirm via your inbox folder panel.`);
    } catch (err) {
      console.error('Registration transmission error:', err);
      await showCustomModal('Network Interruption', 'Profile initialized, but transaction dispatch failed to route.', true);
    }

    container.classList.remove('active');
    registerForm.reset();
    reqBox?.classList.remove('has-content');
    if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
    confirmPassword.style.borderColor = '';
    password.style.borderColor = '';
  });

  const loginForm = container.querySelector('.form-box.login form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#loginEmail').value.trim();
    const pwd = loginPasswordInput ? loginPasswordInput.value : '';

    if (!email || !pwd) {
      showCustomModal('Execution Error', 'All credential entries are required fields.', true);
      return;
    }

    const users = getUsers();
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pwd);

    if (!match) {
      if (loginPasswordInput) {
        loginPasswordInput.style.borderColor = '#d64545';
        loginPasswordInput.value = '';
        loginPasswordInput.placeholder = 'Invalid email or password';
      }

      showCustomModal('Authentication Failure', 'The credentials provided do not match our database records.', true);

      setTimeout(() => {
        if (loginPasswordInput) {
          loginPasswordInput.style.borderColor = '';
          loginPasswordInput.placeholder = 'Password';
        }
      }, 3000);
      return;
    }

    if (!match.verified) {
      showCustomModal('Verification Required', 'Please complete validation checks via the inbox linkage verification mail first.', true);
      return;
    }

    const sessionPayload = {
      name: match.name,
      email: match.email,
      verified: match.verified,
      avatarUrl: match.avatarUrl || "",
      role: match.role || "buyer"
    };

    saveSession(sessionPayload);
    await showCustomModal('Welcome Back', `Welcome back, ${match.name}! Redirecting to your dashboard workspace...`);

    setTimeout(() => {
      window.location.href = sessionPayload.role === 'seller' ? '../seller-dashboard.html' : '../dashboard.html';
    }, 3000);
  });
}

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

      titleEl.textContent = title;
      msgEl.textContent = message;
      iconBox.className = isError ? "popup-icon-wrap error-state" : "popup-icon-wrap";
      iconBox.innerHTML = icon(isError ? 'error-circle' : 'check-circle');

      overlay.classList.add('show');
      closeBtn.onclick = () => {
        overlay.classList.remove('show');
        resolve();
      };
    });
  };

  const users = getUsers();

  if (verifyToken) {
    const user = users.find(u => u.token === verifyToken);
    if (!user) {
      await showModal('Invalid Link', 'This verification token was not found or has already expired.', true);
    } else if (user.verified) {
      await showModal('Already Verified', `Your account configuration is already active. Go ahead and log in, ${user.name}!`);
    } else {
      user.verified = true;
      await saveUsers(users);
      await showModal('Email Verified!', `Welcome to Vaultora, ${user.name}! Your account registration has been successfully activated. You can now log in.`);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (resetToken) {
    const user = users.find(u => u.resetToken === resetToken);
    if (!user) {
      await showModal('Invalid Token', 'This password recovery linkage verification has expired.', true);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const resetOverlay = container.querySelector('#customResetPopup');
    const emailLabel = container.querySelector('#resetPopupEmail');
    const pwdInput = container.querySelector('#newResetPassword');
    const confirmInput = container.querySelector('#confirmResetPassword');
    const errorBlock = container.querySelector('#resetErrorBlock');
    const submitBtn = container.querySelector('#submitResetBtn');

    emailLabel.textContent = `Account Profile: ${user.email}`;
    resetOverlay.classList.add('show');

    submitBtn.onclick = async () => {
      const p1 = pwdInput.value.trim();
      const p2 = confirmInput.value.trim();

      if (p1.length < 8) {
        pwdInput.style.borderColor = '#d64545';
        errorBlock.querySelector('span').textContent = "Password must be at least 8 characters.";
        errorBlock.classList.add('is-visible');
        return;
      }

      if (p1 !== p2) {
        confirmInput.style.borderColor = '#d64545';
        errorBlock.querySelector('span').textContent = "Passwords do not match.";
        errorBlock.classList.add('is-visible');
        return;
      }

      user.password = p1;
      delete user.resetToken;
      await saveUsers(users);

      resetOverlay.classList.remove('show');
      await showModal('Update Successful', 'Your profile password structure has been updated. Please log in using your new credentials.');
      window.history.replaceState({}, document.title, window.location.pathname);
    };
  }
}