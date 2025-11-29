
const LS_KEY = 'audioFeedbackEnabled';

// Shared AudioContext manager: create once and attempt to resume on first user gesture
let _audioCtx = null;
let _resumeHandlerAdded = false;

// Do not create AudioContext eagerly because many browsers require a user
// gesture before constructing/resuming it. _getAudioContext now only returns
// the shared instance if already created. Creation/resume is handled by
// _ensureAudioContextResumed which will attach a user-gesture listener that
// creates and resumes the context when the user interacts.
function _getAudioContext() {
  return _audioCtx;
}

function _createAudioContext() {
  if (_audioCtx) return _audioCtx;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    _audioCtx = null;
  }
  return _audioCtx;
}

function _addResumeOnGesture(ctx, resolve) {
  if (_resumeHandlerAdded) return;
  _resumeHandlerAdded = true;
  const tryResume = () => {
    try {
      // If ctx is null, attempt to create one now (on user gesture)
      if (!ctx) ctx = _createAudioContext();
      if (!ctx || !ctx.resume) {
        // nothing we can do; clean up and resolve null
        window.removeEventListener('click', tryResume);
        window.removeEventListener('keydown', tryResume);
        window.removeEventListener('touchstart', tryResume);
        _resumeHandlerAdded = false;
        return resolve(ctx);
      }
      ctx.resume().then(() => {
        window.removeEventListener('click', tryResume);
        window.removeEventListener('keydown', tryResume);
        window.removeEventListener('touchstart', tryResume);
        _resumeHandlerAdded = false;
        resolve(ctx);
      }).catch(() => {
        // still suspended; the listeners were registered with {once:true}
        // but in case of failure we'll clear the flag so future calls can
        // re-register if needed.
        _resumeHandlerAdded = false;
        // resolve with ctx anyway; callers should handle suspended state
        resolve(ctx);
      });
    } catch (e) {
      try { window.removeEventListener('click', tryResume); } catch (er) {}
      try { window.removeEventListener('keydown', tryResume); } catch (er) {}
      try { window.removeEventListener('touchstart', tryResume); } catch (er) {}
      _resumeHandlerAdded = false;
      resolve(ctx);
    }
  };
  window.addEventListener('click', tryResume, { once: true });
  window.addEventListener('keydown', tryResume, { once: true });
  window.addEventListener('touchstart', tryResume, { once: true });
}

function _ensureAudioContextResumed() {
  return new Promise((resolve) => {
    try {
      // Try to get an existing context or create one now. If creation is
      // blocked by the browser (no user gesture), _createAudioContext may
      // return null; in that case attach a gesture listener that will
      // create/resume the context when the user interacts.
      let ctx = _getAudioContext() || _createAudioContext();
      if (!ctx) {
        _addResumeOnGesture(null, resolve);
        return;
      }
      if (ctx.state === 'running') return resolve(ctx);
      // Try to resume immediately; some browsers require a gesture and will reject.
      try {
        const p = ctx.resume && ctx.resume();
        if (p && typeof p.then === 'function') {
          p.then(() => resolve(ctx)).catch(() => {
            _addResumeOnGesture(ctx, resolve);
          });
        } else {
          _addResumeOnGesture(ctx, resolve);
        }
      } catch (e) {
        _addResumeOnGesture(ctx, resolve);
      }
    } catch (e) {
      resolve(null);
    }
  });
}

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
    _ensureAudioContextResumed().then((ctx) => {
      if (!ctx) return; // can't play audio
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = opts.type || 'sine';
        o.frequency.value = opts.freq || 880;
        // Start very quiet then ramp up briefly to avoid clicks
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        try { g.gain.linearRampToValueAtTime(0.08, now + 0.01); } catch (e) { g.gain.value = 0.08; }
        o.start(now);
        try { g.gain.exponentialRampToValueAtTime(0.00001, now + 0.18); } catch (e) { g.gain.setValueAtTime(0.00001, now + 0.18); }
        o.stop(now + 0.2);
        // Do not close the shared context — keep it for subsequent sounds.
      } catch (e) {
        // ignore per original behavior
      }
    }).catch(() => {});
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

