/* ==========================================================================
   LexHub — contract.js
   ========================================================================== */

const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const fileInfo = document.getElementById('fileInfo');
const removeFileBtn = document.getElementById('removeFileBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const riskScoreNumber = document.getElementById('riskScoreNumber');
const riskScoreLabel = document.getElementById('riskScoreLabel');
const riskBarFill = document.getElementById('riskBarFill');
const riskCounts = document.getElementById('riskCounts');
const clauseList = document.getElementById('clauseList');
const downloadReportBtn = document.getElementById('downloadReportBtn');

let selectedFile = null;
let lastResult = null;

const LOADING_MESSAGES = [
  'Reading your document...',
  'Identifying clauses...',
  'Analyzing risk levels...',
  'Generating explanations...'
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

/* ---------- Analysis ---------- */
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  showLoader(LOADING_MESSAGES);
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const res = await fetch(`${API_BASE}/api/analyze-contract`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Analysis failed');

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
function riskColorFor(level) {
  if (level === 'Low') return 'var(--safe-green)';
  if (level === 'Medium') return 'var(--risky-amber)';
  return 'var(--illegal-red)';
}

function renderResults(data) {
  const { clauses, risk_score, risk_level, total_clauses } = data;

  riskScoreNumber.textContent = risk_score;
  riskScoreNumber.style.color = riskColorFor(risk_level);
  riskScoreLabel.textContent = `${risk_level.toUpperCase()} RISK`;
  riskScoreLabel.style.color = riskColorFor(risk_level);
  riskBarFill.style.background = riskColorFor(risk_level);

  const safeCount = clauses.filter(c => c.label === 'Safe').length;
  const riskyCount = clauses.filter(c => c.label === 'Risky').length;
  const illegalCount = clauses.filter(c => c.label === 'Potentially Illegal').length;
  riskCounts.textContent = `${safeCount} Safe · ${riskyCount} Risky · ${illegalCount} Illegal · ${total_clauses} total clauses`;

  clauseList.innerHTML = '';
  clauses.forEach((clause, i) => {
    clauseList.appendChild(buildClauseCard(clause, i));
  });

  resultsSection.classList.add('visible');

  requestAnimationFrame(() => {
    riskBarFill.style.width = `${risk_score}%`;
  });

  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function buildClauseCard(clause, index) {
  const card = document.createElement('article');
  card.className = 'clause-card';
  card.style.animationDelay = `${index * 0.06}s`;

  const top = document.createElement('div');
  top.className = 'clause-card__top';
  top.appendChild(formatRiskLabel(clause.label));

  const confidence = document.createElement('span');
  confidence.className = 'clause-card__confidence';
  confidence.textContent = `${clause.confidence.toFixed(1)}% confidence`;
  top.appendChild(confidence);
  card.appendChild(top);

  const text = document.createElement('p');
  text.className = 'clause-card__text truncated';
  text.textContent = clause.clause;
  card.appendChild(text);

  const explanation = document.createElement('p');
  explanation.className = 'clause-card__explanation';
  explanation.textContent = clause.explanation;
  card.appendChild(explanation);

  const toggle = document.createElement('button');
  toggle.className = 'clause-card__toggle';
  toggle.textContent = '▼ Read full clause';
  toggle.addEventListener('click', () => {
    const isTruncated = text.classList.toggle('truncated');
    toggle.textContent = isTruncated ? '▼ Read full clause' : '▲ Collapse clause';
  });
  card.appendChild(toggle);

  return card;
}

/* ---------- Report download ---------- */
downloadReportBtn.addEventListener('click', () => {
  if (!lastResult) return;

  const { clauses, risk_score, risk_level, total_clauses } = lastResult;
  const rows = clauses.map(c => `
    <tr>
      <td>${c.label}</td>
      <td>${c.confidence.toFixed(1)}%</td>
      <td>${c.clause}</td>
      <td>${c.explanation}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html><head><title>LexHub Contract Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { color: #8a6d1f; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #f4f4f4; }
    </style>
    </head><body>
      <h1>LexHub — Contract Analysis Report</h1>
      <p><strong>Risk Score:</strong> ${risk_score} (${risk_level} Risk) · <strong>Total Clauses:</strong> ${total_clauses}</p>
      <p><em>This report is legal information only, not legal advice. Consult a licensed Advocate before signing.</em></p>
      <table>
        <thead><tr><th>Label</th><th>Confidence</th><th>Clause</th><th>Explanation</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
});
