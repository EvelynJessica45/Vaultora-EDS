import { decorateIcons } from '../../scripts/aem.js';
import { 
  getUsers, 
  saveUsers, 
  saveSession 
} from '../../scripts/storage.js';
import { sendVerificationEmail } from '../../scripts/notification-service.js';

/**
 * Decorates the Auth block (Login & Registration Toggle)
 * @param {Element} block The auth block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows || rows.length === 0) return;

  const cells = [...rows[0].children];
  
  const getCellLines = (cellElement) => {
    if (!cellElement) return [];
    return [...cellElement.querySelectorAll('p, li, div')]
      .map(p => p.textContent.trim())
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
        <form novalidate>
          <h1>${loginData[0] || 'Login'}</h1>
          
          <div class="input-box">
            <input type="email" id="loginEmail" placeholder="${loginData[1] || 'Email'}" required autocomplete="username">
            <i class='bx bx-user'></i>
          </div>
          
          <div class="input-box">
            <input type="password" id="loginPassword" placeholder="${loginData[2] || 'Password'}" required autocomplete="current-password">
            <button type="button" class="password-toggle-btn" id="toggleLoginPasswordBtn" aria-label="Show password">
              <i class='bx bx-hide' id="loginPasswordIcon"></i>
            </button>
          </div>
          
          <div class="form-options-row" style="text-align: right; margin-bottom: 6px; width: 100%;">
            <a href="#forgot" class="forgot-password-link" style="font-size: 11px; color: #9c8772; text-decoration: none;">${loginData[3] || 'Forgot Password?'}</a>
          </div>
          
          <button type="submit" class="btn">Login</button>
          <p class="mobile-switch-text">${welcomeData[1] || "Don't have an account?"} <span class="switch-link-btn trigger-to-register">${welcomeData[2] || 'Register'}</span></p>
        </form>
      </div>

      <div class="form-box register">
        <form novalidate>
          <h1>${registerData[0] || 'Registration'}</h1>
          
          <div class="input-box">
            <input type="text" id="regUsername" placeholder="${registerData[1] || 'Username'}" required autocomplete="name">
            <i class='bx bx-user'></i>
          </div>
          
          <div class="input-box">
            <input type="email" id="regEmail" placeholder="${registerData[2] || 'Email'}" required autocomplete="email">
            <i class='bx bx-envelope'></i>
          </div>
          
          <div class="role-select-group">
            <select id="regRole" class="role-select-menu" required>
              <option value="" disabled selected hidden>${registerData[3] || 'Select Account Type...'}</option>
              <option value="buyer">Collector (Buyer)</option>
              <option value="seller">Artisan / Curator (Seller)</option>
            </select>
            <i class='bx bx-briefcase' style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #b59d84; pointer-events: none; font-size: 16px;"></i>
          </div>
          
          <div class="input-box password-group">
            <input type="password" id="regPassword" placeholder="${registerData[4] || 'Password'}" required autocomplete="new-password">
            <button type="button" class="password-toggle-btn" id="toggleRegPasswordBtn" aria-label="Show password">
              <i class='bx bx-hide' id="regPasswordIcon"></i>
            </button>
            
            <div class="password-requirements" id="passwordRequirements">
              <p class="req-title">Password Requirements</p>
              <ul>
                <li id="reqLength" class="invalid"><i class="bx bx-circle"></i> Min 8 characters</li>
                <li id="reqUpper" class="invalid"><i class="bx bx-circle"></i> At least 1 uppercase</li>
                <li id="reqLower" class="invalid"><i class="bx bx-circle"></i> At least 1 lowercase</li>
                <li id="reqNumber" class="invalid"><i class="bx bx-circle"></i> At least 1 number</li>
                <li id="reqSymbol" class="invalid"><i class="bx bx-circle"></i> At least 1 special char</li>
              </ul>
            </div>
          </div>
          
          <div class="input-box confirm-password-group">
            <input type="password" id="regConfirmPassword" placeholder="${registerData[5] || 'Confirm Password'}" required autocomplete="new-password">
            <button type="button" class="password-toggle-btn" id="toggleConfirmPasswordBtn" aria-label="Show confirm password">
              <i class='bx bx-hide' id="confirmPasswordIcon"></i>
            </button>
            
            <div class="confirm-error-message" id="confirmErrorBlock">
              <i class="bx bx-error-circle" style="color:#d64545; font-size:12px;"></i>
              <span id="confirmErrorText">Passwords do not match.</span>
            </div>
          </div>
          
          <button type="submit" class="btn">Register</button>
          <p class="mobile-switch-text">${returningData[1] || "Already have an account?"} <span class="switch-link-btn trigger-to-login">${returningData[2] || 'Login'}</span></p>
        </form>
      </div>
    </div>

    <div class="toggle-box">
      <div class="toggle-panel toggle-left">
        <h1>${returningData[0] || 'Welcome Back!'}</h1>
        <p>${returningData[1] || 'Already have an account?'}</p>
        <button type="button" class="btn trigger-to-login">${returningData[2] || 'Login'}</button>
      </div>
      <div class="toggle-panel toggle-right">
        <h1>${welcomeData[0] || 'Hello, Welcome!'}</h1>
        <p>${welcomeData[1] || "Don't have an account?"}</p>
        <button type="button" class="btn trigger-to-register">${welcomeData[2] || 'Register'}</button>
      </div>
    </div>

    <div class="custom-popup-overlay" id="customAuthPopup">
      <div class="custom-popup-box">
        <div class="popup-icon-wrap" id="popupIconBox"><i class='bx bx-check-circle'></i></div>
        <h3 class="popup-title" id="popupTitle">Notification</h3>
        <p class="popup-msg" id="popupMessage"></p>
        <button type="button" class="popup-confirm-btn" id="closePopupBtn">Continue</button>
      </div>
    </div>
  `;

  if (window.location.pathname.includes('register')) {
    container.classList.add('active');
  }

  if (!document.querySelector('link[href*="boxicons"]')) {
    const bxLink = document.createElement('link');
    bxLink.rel = 'stylesheet';
    bxLink.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
    document.head.appendChild(bxLink);
  }

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
    
    const reqItems = container.querySelectorAll('.password-requirements li');
    reqItems.forEach(li => {
      li.className = 'invalid';
      const icon = li.querySelector('i');
      if (icon) icon.className = 'bx bx-circle';
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
}

function initAuthValidation(container) {
  // Explicitly query login input handles in the localized scope
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

      if (isError) {
        iconBox.className = "popup-icon-wrap error-state";
        iconBox.innerHTML = "<i class='bx bx-error-circle'></i>";
      } else {
        iconBox.className = "popup-icon-wrap";
        iconBox.innerHTML = "<i class='bx bx-check-circle'></i>";
      }

      overlay.classList.add('show');
      function handleClosure() {
        overlay.classList.remove('show');
        closeBtn.removeEventListener('click', handleClosure);
        resolve();
      }
      closeBtn.addEventListener('click', handleClosure);
    });
  }

  // ── WIRE HARNESS FOR INDEPENDENT FIELD VISIBILITY HANDLES ──
  const wireEyeToggle = (inputSelector, buttonSelector, iconSelector) => {
    const input = container.querySelector(inputSelector);
    const btn = container.querySelector(buttonSelector);
    const icon = container.querySelector(iconSelector);

    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      icon.classList.toggle("bx-hide", !isHidden);
      icon.classList.toggle("bx-show", isHidden);
    });
  };

  wireEyeToggle("#loginPassword", "#toggleLoginPasswordBtn", "#loginPasswordIcon");
  wireEyeToggle("#regPassword", "#toggleRegPasswordBtn", "#regPasswordIcon");
  wireEyeToggle("#regConfirmPassword", "#toggleConfirmPasswordBtn", "#confirmPasswordIcon");

  // ── WIRE FORGOT PASSWORD INTERACTION ──
  const forgotLink = container.querySelector('.forgot-password-link');
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const emailInput = container.querySelector('#loginEmail').value.trim();
    if (!emailInput) {
      showCustomModal('Reset Terminated', 'Please specify your targeted account profile email context space first.', true);
      return;
    }
    const users = getUsers();
    const match = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    if (!match) {
      showCustomModal('Account Missing', 'No matching credentials context exist on our secure nodes.', true);
      return;
    }
    await showCustomModal('Dispatch Sent', `A dedicated password token link was issued successfully to ${emailInput}.`);
  });

  // ── REALTIME DATA GRAPH ENGINE VALIDATORS ──
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
        const iconElement = rule.el.querySelector('i');
        if (iconElement) {
          iconElement.className = isValid ? 'bx bx-check-circle' : 'bx bx-circle';
        }
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

  // ── REGISTRATION FORM SUBMISSION SUB-SYSTEM ──
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
      await sendVerificationEmail(name, email, token);
      await showCustomModal('Registration Placed', `Verification dispatch sent to ${email}. Please confirm via your inbox folder panel.`);
    } catch (err) {
      console.error('Email tracking system interruption:', err);
      await showCustomModal('Network Interruption', 'Profile initialized, but transaction dispatch failed to route.', true);
    }

    container.classList.remove('active');
    registerForm.reset();
    reqBox?.classList.remove('has-content');
    if (confirmErrorBlock) confirmErrorBlock.classList.remove('is-visible');
    confirmPassword.style.borderColor = '';
    password.style.borderColor = '';
  });

  // ── USER PROFILE AUTHENTICATION PIPELINE LAYER ──
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
    await showCustomModal('Welcome Back', `Welcome back, ${match.name}!`);
    
    window.location.href = sessionPayload.role === 'seller' ? 'seller-dashboard' : 'dashboard';
  });
}