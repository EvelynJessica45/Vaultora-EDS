/**
 * Decorates the contact-connect block with a minimalist premium layout and interactive form actions
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 4) return;

  // 1. Extract Config parameters from the AEM authored table rows
  const headlineText = rows[0]?.children[1]?.innerText?.trim() || "Let's Connect";
  const descText = rows[1]?.children[1]?.innerText?.trim() || "";
  const infoHTML = rows[2]?.children[1]?.innerHTML || "";
  const formSubmitText = rows[4]?.children[1]?.innerText?.trim() || "Send Message";

  // Create Left Column: Information Pane
  const infoColumn = document.createElement('div');
  infoColumn.className = 'connect-info-column';

  const titleNode = document.createElement('h2');
  // Dynamic editorial string styling: italicize the second word for consistency
  const words = headlineText.split(' ');
  if (words.length > 1) {
    const lastWord = words.pop();
    titleNode.innerHTML = `${words.join(' ')} <span>${lastWord}</span>`;
  } else {
    titleNode.textContent = headlineText;
  }

  const descNode = document.createElement('p');
  descNode.className = 'connect-description';
  descNode.textContent = descText;

  const metadataNode = document.createElement('div');
  metadataNode.className = 'connect-metadata-pane';
  metadataNode.innerHTML = infoHTML;

  infoColumn.append(titleNode, descNode, metadataNode);

  // 2. Create Right Column: Minimalist Forms Pane
  const formColumn = document.createElement('div');
  formColumn.className = 'connect-form-column';

  const formNode = document.createElement('form');
  formNode.className = 'connect-editorial-form';
  formNode.setAttribute('novalidate', 'true');

  formNode.innerHTML = `
    <div class="form-group-row">
      <div class="form-input-field">
        <label for="connect-name">Your Full Name</label>
        <input type="text" id="connect-name" placeholder="E.g., Eleanor Vance" required />
        <span class="field-error-message">Please provide your name.</span>
      </div>
    </div>
    <div class="form-group-row">
      <div class="form-input-field">
        <label for="connect-email">Secure Email Address</label>
        <input type="email" id="connect-email" placeholder="name@domain.com" required />
        <span class="field-error-message">Please enter a valid secure email address.</span>
      </div>
    </div>
    <div class="form-group-row">
      <div class="form-input-field">
        <label for="connect-message">Inquiry Specifications</label>
        <textarea id="connect-message" rows="4" placeholder="Detail your collection provenance or asset inquiry..." required></textarea>
        <span class="field-error-message">Please enter your message details.</span>
      </div>
    </div>
    <div class="form-action-wrapper">
      <button type="submit" class="form-submit-btn">${formSubmitText} <span>&rarr;</span></button>
    </div>
    <div class="form-submission-toast hidden"></div>
  `;

  formColumn.append(formNode);

  // Clear original raw CMS tabular nodes safely
  block.textContent = '';
  block.append(infoColumn, formColumn);

  // ── FORM INTERACTIVE VALIDATION INTERFACES ──
  formNode.addEventListener('submit', (e) => {
    e.preventDefault();
    let isFormValid = true;

    // Run clean high-end interactive input validity passes
    const inputFields = formNode.querySelectorAll('input[required], textarea[required]');
    inputFields.forEach((field) => {
      const parentGroup = field.closest('.form-input-field');
      
      if (!field.value.trim() || (field.type === 'email' && !field.value.includes('@'))) {
        parentGroup.classList.add('has-error');
        isFormValid = false;
      } else {
        parentGroup.classList.remove('has-error');
      }
    });

    const toastNode = formNode.querySelector('.form-submission-toast');
    if (isFormValid) {
      toastNode.className = 'form-submission-toast is-success';
      toastNode.textContent = 'Inquiry transmitted successfully. Our curation desk will connect shortly.';
      formNode.reset();
    } else {
      toastNode.className = 'form-submission-toast is-error';
      toastNode.textContent = 'Transmission halted. Please correct marked fields above.';
    }
  });

  // Clear errors dynamically on raw keystroke focus updates
  formNode.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('input', () => {
      const parentGroup = input.closest('.form-input-field');
      if (parentGroup.classList.contains('has-error')) {
        parentGroup.classList.remove('has-error');
      }
    });
  });
}