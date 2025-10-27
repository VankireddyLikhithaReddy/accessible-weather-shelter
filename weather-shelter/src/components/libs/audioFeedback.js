
const LS_KEY = 'audioFeedbackEnabled';

function isEnabled() {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === null) return true; 
    return v === 'true';
  } catch (e) {
    return true;
  }
}

function setEnabled(enabled) {
  try {
    localStorage.setItem(LS_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

function playChime(opts = {}) {
  if (!isEnabled()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.value = opts.freq || 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.08, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.00001, now + 0.18);
    o.stop(now + 0.2);
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 300);
  } catch (e) {
  }
}

function speak(text) {
  if (!isEnabled()) return;
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
  }
}

export const audioFeedback = {
  isEnabled,
  setEnabled,
  playChime,
  speak,
};

