/* ==========================================================================
   LexHub — summarizer.js
   ========================================================================== */

const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const fileInfo = document.getElementById('fileInfo');
const removeFileBtn = document.getElementById('removeFileBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const docTypeBadge = document.getElementById('docTypeBadge');
const summaryBody = document.getElementById('summaryBody');
const actionList = document.getElementById('actionList');
const summaryDisclaimer = document.getElementById('summaryDisclaimer');
const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');

let selectedFile = null;
let lastResult = null;

const LOADING_MESSAGES = [
  'Reading your document...',
  'Understanding the content...',
  'Writing a plain-English summary...',
  'Preparing next steps...'
];

/* ---------- File selection ---------- */
function setFile(file) {
  const { valid, message } = validateFile(file, 5);
  if (!valid) {
    showError(message);
    return;
  }
  selectedFile = file;
  fileInfo.textContent = `${file.name} · ${formatFileSize(file.size)}`;
  filePreview.classList.add('visible');
  analyzeBtn.disabled = false;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  filePreview.classList.remove('visible');
  analyzeBtn.disabled = true;
}

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});
removeFileBtn.addEventListener('click', clearFile);

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

/* ---------- Summarize ---------- */
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  showLoader(LOADING_MESSAGES);
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const res = await fetch(`${API_BASE}/api/summarize`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Summarization failed');

    const data = await res.json();
    lastResult = data;
    renderResults(data);
  } catch (err) {
    showError('Service temporarily unavailable. Please try again or call NALSA: 15100');
  } finally {
    hideLoader();
    analyzeBtn.disabled = false;
  }
});

/* ---------- Rendering ---------- */
function renderResults(data) {
  const { summary, document_type, action_items, disclaimer } = data;

  docTypeBadge.textContent = document_type;

  summaryBody.innerHTML = '';
  summary.split('\n').filter(Boolean).forEach(paragraph => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    p.style.marginBottom = '12px';
    summaryBody.appendChild(p);
  });

  actionList.innerHTML = '';
  action_items.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'action-item';
    item.innerHTML = `
      <span class="action-item__icon">${i + 1}</span>
      <span>${step}</span>
    `;
    actionList.appendChild(item);
  });

  summaryDisclaimer.innerHTML = `
    <i class="fa-solid fa-triangle-exclamation disclaimer__icon" aria-hidden="true"></i>
    <span>${disclaimer}</span>
  `;

  resultsSection.classList.add('visible');
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Download ---------- */
downloadSummaryBtn.addEventListener('click', () => {
  if (!lastResult) return;

  const { summary, document_type, action_items, disclaimer } = lastResult;
  const steps = action_items.map(s => `<li>${s}</li>`).join('');

  const html = `
    <!DOCTYPE html>
    <html><head><title>LexHub Document Summary</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { color: #8a6d1f; }
      .badge { display:inline-block; border:1px solid #8a6d1f; color:#8a6d1f; padding:2px 10px; border-radius:999px; font-size:12px; margin-bottom:12px; }
    </style>
    </head><body>
      <h1>LexHub — Document Summary</h1>
      <span class="badge">${document_type}</span>
      <p>${summary.replace(/\n/g, '<br>')}</p>
      <h2>What You Should Do Next</h2>
      <ol>${steps}</ol>
      <p><em>${disclaimer}</em></p>
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
});
