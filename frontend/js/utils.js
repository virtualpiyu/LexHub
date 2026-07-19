/* ==========================================================================
   LexHub — Shared utilities
   ========================================================================== */

const API_BASE = 'http://localhost:8000';

/* ---------- Loader ---------- */
const LOADER_MESSAGES_DEFAULT = ['Working on it...'];
let loaderInterval = null;

function ensureLoaderEl() {
  let el = document.querySelector('.loader-overlay');
  if (!el) {
    el = document.createElement('div');
    el.className = 'loader-overlay';
    el.innerHTML = `
      <i class="fa-solid fa-scale-balanced loader-overlay__icon" aria-hidden="true"></i>
      <p class="loader-overlay__message"></p>
    `;
    document.body.appendChild(el);
  }
  return el;
}

function showLoader(messages = LOADER_MESSAGES_DEFAULT) {
  const el = ensureLoaderEl();
  const msgEl = el.querySelector('.loader-overlay__message');
  const list = Array.isArray(messages) ? messages : [messages];
  let i = 0;
  msgEl.textContent = list[0];
  el.classList.add('visible');

  clearInterval(loaderInterval);
  if (list.length > 1) {
    loaderInterval = setInterval(() => {
      i = (i + 1) % list.length;
      msgEl.textContent = list[i];
    }, 1800);
  }
}

function hideLoader() {
  const el = document.querySelector('.loader-overlay');
  if (el) el.classList.remove('visible');
  clearInterval(loaderInterval);
}

/* ---------- Toast ---------- */
function ensureToastContainer() {
  let el = document.querySelector('.toast-container');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'info') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('closing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 4000);
}

function showError(message) {
  showToast(message, 'error');
}

/* ---------- Disclaimer ---------- */
const DISCLAIMER_TEXT =
  'This is legal information only, not legal advice. Always consult a licensed Advocate for advice specific to your situation.';

function appendDisclaimer(element, text = DISCLAIMER_TEXT) {
  const box = document.createElement('div');
  box.className = 'disclaimer';
  box.innerHTML = `
    <i class="fa-solid fa-triangle-exclamation disclaimer__icon" aria-hidden="true"></i>
    <span>${text}</span>
  `;
  element.appendChild(box);
  return box;
}

/* ---------- Risk / label formatting ---------- */
function formatRiskLabel(label) {
  const map = {
    'Safe': { icon: 'fa-circle-check', color: 'var(--safe-green)', text: 'SAFE' },
    'Risky': { icon: 'fa-triangle-exclamation', color: 'var(--risky-amber)', text: 'RISKY' },
    'Potentially Illegal': { icon: 'fa-siren-on', color: 'var(--illegal-red)', text: 'POTENTIALLY ILLEGAL' }
  };
  const cfg = map[label] || { icon: 'fa-circle-question', color: 'var(--text-secondary)', text: label.toUpperCase() };
  const span = document.createElement('span');
  span.className = 'risk-badge';
  span.style.color = cfg.color;
  span.style.borderColor = cfg.color;
  span.innerHTML = `<i class="fa-solid ${cfg.icon}" aria-hidden="true"></i> ${cfg.text}`;
  return span;
}

/* ---------- File validation ---------- */
function validateFile(file, maxSizeMB = 5) {
  if (!file) return { valid: false, message: 'No file selected.' };
  if (file.type !== 'application/pdf') {
    return { valid: false, message: 'Only PDF files are supported.' };
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, message: `File must be smaller than ${maxSizeMB}MB.` };
  }
  return { valid: true, message: '' };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Misc ---------- */
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

function setupMobileNav() {
  const toggle = document.querySelector('.navbar__toggle');
  const links = document.querySelector('.navbar__links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}

document.addEventListener('DOMContentLoaded', setupMobileNav);
