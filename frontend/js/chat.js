/* ==========================================================================
   LexHub — chat.js
   ========================================================================== */

const WELCOME_MESSAGE =
  'Hello! I am LexHub. I can help you understand Indian laws in simple language. What would you like to know?';
const HISTORY_KEY = 'lexhub_chat_history';
const MAX_CHARS = 500;

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const charCounter = document.getElementById('charCounter');
const clearChatBtn = document.getElementById('clearChatBtn');

/* ---------- Rendering ---------- */
function renderBotMessage({ answer, sources }, save = true) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message--bot';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = answer;
  wrapper.appendChild(bubble);

  if (sources && sources.length) {
    const src = document.createElement('div');
    src.className = 'chat-source';
    src.innerHTML = `<i class="fa-solid fa-book" aria-hidden="true"></i> Source: ${sources.join(', ')}`;
    wrapper.appendChild(src);
  }

  appendDisclaimer(wrapper);
  chatMessages.appendChild(wrapper);
  scrollToBottom(chatMessages);

  if (save) saveMessage({ role: 'bot', answer, sources: sources || [] });
}

function renderUserMessage(text, save = true) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message--user';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  chatMessages.appendChild(wrapper);
  scrollToBottom(chatMessages);

  if (save) saveMessage({ role: 'user', text });
}

function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'chat-message chat-message--bot';
  el.id = 'typingIndicator';
  el.innerHTML = `
    <div class="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(el);
  scrollToBottom(chatMessages);
}

function hideTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

/* ---------- History (sessionStorage) ---------- */
function saveMessage(msg) {
  const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
  history.push(msg);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadHistory() {
  const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
  if (!history.length) {
    renderBotMessage({ answer: WELCOME_MESSAGE, sources: [] }, false);
    saveMessage({ role: 'bot', answer: WELCOME_MESSAGE, sources: [] });
    return;
  }
  history.forEach(msg => {
    if (msg.role === 'user') {
      renderUserMessage(msg.text, false);
    } else {
      renderBotMessage({ answer: msg.answer, sources: msg.sources }, false);
    }
  });
}

function clearHistory() {
  sessionStorage.removeItem(HISTORY_KEY);
  chatMessages.innerHTML = '';
  renderBotMessage({ answer: WELCOME_MESSAGE, sources: [] }, false);
  saveMessage({ role: 'bot', answer: WELCOME_MESSAGE, sources: [] });
}

/* ---------- API ---------- */
async function askQuestion(question) {
  showTypingIndicator();
  sendBtn.disabled = true;
  chatInput.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    hideTypingIndicator();

    if (!data.answer) {
      renderBotMessage({ answer: 'No relevant law found. Please consult a licensed Advocate.', sources: [] });
      return;
    }

    renderBotMessage({ answer: data.answer, sources: data.sources });
  } catch (err) {
    hideTypingIndicator();
    renderBotMessage({
      answer: 'Service temporarily unavailable. Please try again or call NALSA: 15100',
      sources: []
    });
  } finally {
    sendBtn.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

/* ---------- Events ---------- */
function handleSend() {
  const text = chatInput.value.trim();
  if (!text) {
    showToast('Please type a question first', 'info');
    return;
  }
  renderUserMessage(text);
  chatInput.value = '';
  updateCharCounter();
  autoResizeInput();
  askQuestion(text);
}

function updateCharCounter() {
  const len = chatInput.value.length;
  charCounter.textContent = `${len} / ${MAX_CHARS}`;
  charCounter.classList.toggle('limit-near', len > MAX_CHARS - 50);
}

function autoResizeInput() {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
}

sendBtn.addEventListener('click', handleSend);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

chatInput.addEventListener('input', () => {
  updateCharCounter();
  autoResizeInput();
});

document.querySelectorAll('.suggested-question').forEach(btn => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.textContent;
    updateCharCounter();
    autoResizeInput();
    chatInput.focus();
  });
});

clearChatBtn.addEventListener('click', clearHistory);

loadHistory();
