
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
    // If disabling audio, cancel any ongoing speech immediately.
    if (!enabled) {
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    } else {
      // If enabling, attempt to prime voices so subsequent speak calls succeed.
      try { if (window.speechSynthesis) window.speechSynthesis.getVoices(); } catch (e) {}
      try { playChime(); } catch (e) {}
    }
  } catch (e) {}
}

function playChime(opts = {}, force = false) {
  if (!force && !isEnabled()) return;
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

function speak(text, onEnd, onError, opts = {}) {
  // If audio disabled, don't speak
  if (!isEnabled()) return;
  try {
    if ('speechSynthesis' in window) {
      // Ensure voices are loaded (they can be populated asynchronously)
      const ensureVoices = () => new Promise((resolve) => {
        const vs = window.speechSynthesis.getVoices() || [];
        if (vs.length) return resolve(vs);
        let resolved = false;
        const handler = () => {
          if (resolved) return;
          const v2 = window.speechSynthesis.getVoices() || [];
          if (v2.length) {
            resolved = true;
            window.speechSynthesis.onvoiceschanged = null;
            resolve(v2);
          }
        };
        window.speechSynthesis.onvoiceschanged = handler;
        // fallback after a short wait
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          window.speechSynthesis.onvoiceschanged = null;
          resolve(window.speechSynthesis.getVoices() || []);
        }, 800);
      });

      ensureVoices().then((voices) => {
        try {
          // Try to resume if paused (some browsers require a user gesture)
          try { if (window.speechSynthesis && window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (e) {}

          const u = new SpeechSynthesisUtterance(String(text));

          // Determine rate and voice preference: opts override, then localStorage, then defaults
          let rate = opts.rate;
          try { if (rate == null) rate = parseFloat(localStorage.getItem('speechRate')); } catch (e) {}
          if (!rate || Number.isNaN(rate)) rate = 1;

          let preferredVoiceName = opts.voiceName || null;
          try { if (!preferredVoiceName) preferredVoiceName = localStorage.getItem('preferredVoiceName'); } catch (e) {}

          u.rate = rate;
          u.volume = 1;
          u.lang = 'en-US';

          if (voices && voices.length) {
            if (preferredVoiceName) {
              const found = voices.find(v => v.name === preferredVoiceName);
              if (found) u.voice = found;
            }
            if (!u.voice) u.voice = voices.find(v => /en/i.test(v.lang) || /en/i.test(v.name)) || voices[0];
          }

          u.onstart = () => { try { console.log('audioFeedback.speak onstart', u.voice && (u.voice.name || u.voice.lang)); } catch (e) {} };
          u.onend = () => { try { console.log('audioFeedback.speak onend'); } catch (e) {} ; try { onEnd && onEnd(); } catch (e) {} };
          u.onerror = (err) => { try { console.error('audioFeedback.speak error', err); } catch (e) {} ; try { onError && onError(err); } catch (e) {} };
          // Do not cancel other utterances aggressively; just speak this one.
          try { window.speechSynthesis.speak(u); } catch (e) { console.error('speechSynthesis.speak failed', e); }
        } catch (e) {
          try { console.error('audioFeedback.speak inner error', e); } catch (err) {}
        }
      }).catch((err) => { try { console.error('ensureVoices failed', err); } catch (e) {} });
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

