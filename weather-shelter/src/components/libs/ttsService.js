export class TTSService {
  constructor() {
    this.synth = typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis
      : null;
    this.currentUtterance = null;
    this.isMuted = false;
    this.speechRate = 1;
    this.selectedVoice = null;
  }

  speak(text, onEnd, onError) {
    if (!this.synth || this.isMuted) {
      console.warn('ttsService.speak: not supported or muted');
      if (onEnd) onEnd();
      return;
    }

  // Do not cancel existing utterances immediately — canceling can race with the
  // engine in Chrome and cause 'canceled' errors. Allow speak() to queue or
  // retry on cancel instead.
    // Ensure voices are available (some browsers populate voices asynchronously)
    const ensureVoices = () => {
      return new Promise((resolve) => {
        const voices = this.getVoices() || [];
        if (voices.length) return resolve(voices);
        // wait for onvoiceschanged up to 800ms
        let resolved = false;
        const handler = () => {
          if (resolved) return;
          const vs = this.getVoices() || [];
          if (vs.length) {
            resolved = true;
            try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {}
            resolve(vs);
          }
        };
        try {
          window.speechSynthesis.onvoiceschanged = handler;
        } catch (e) {}
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {}
          resolve(this.getVoices() || []);
        }, 800);
      });
    };

    ensureVoices().then((voices) => {
      try {
  // internal retry attempts counter
  this._ttsRetryAttempts = this._ttsRetryAttempts || 0;

        const speakOnce = () => {
          try {
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance.rate = this.speechRate;
            this.currentUtterance.volume = 1; // explicit full volume

            // If a selected voice is set, prefer it. Otherwise pick a reasonable English voice.
            if (this.selectedVoice) {
              this.currentUtterance.voice = this.selectedVoice;
            } else if (voices && voices.length) {
              this.currentUtterance.voice = voices.find(v => /en/i.test(v.lang) || /en/i.test(v.name)) || voices[0];
            }

            this.currentUtterance.onend = () => {
              this.currentUtterance = null;
              this._ttsRetryAttempts = 0;
              if (onEnd) onEnd();
            };

            this.currentUtterance.onerror = (err) => {
              this.currentUtterance = null;
              // If canceled in Chrome, attempt a single quick retry to work around race/autoplay issues
              try {
                const code = err && err.error ? err.error : (err && err.type) ? err.type : null;
                if (code === 'canceled' && this._ttsRetryAttempts < 3) {
                  this._ttsRetryAttempts = (this._ttsRetryAttempts || 0) + 1;
                  console.warn('ttsService: utterance canceled, retrying attempt', this._ttsRetryAttempts);
                  // slightly longer backoff to give Chrome time to settle
                  setTimeout(() => {
                    try { speakOnce(); } catch (e) { console.error('ttsService retry failed', e); }
                  }, 500);
                  return;
                }
              } catch (e) {}
              if (onError) onError && onError(err);
              // final failure log
              if (this._ttsRetryAttempts >= 3) {
                console.error('ttsService: final failure after retries', err);
              }
            };

            this.currentUtterance.onstart = () => {
              try { console.log('ttsService: utterance onstart'); } catch (e) {}
            };

            // Debug logging to help diagnose silent TTS
            try { console.log('ttsService.speak: speaking', { text, voice: this.currentUtterance.voice && (this.currentUtterance.voice.name || this.currentUtterance.voice.lang), rate: this.currentUtterance.rate }); } catch (e) {}

            this.synth.speak(this.currentUtterance);
          } catch (e) {
            console.error('ttsService.speak inner error', e);
            if (onError) onError(e);
          }
        };

        speakOnce();
      } catch (e) {
        try { console.error('ttsService.speak error', e); } catch (err) {}
        if (onError) onError(e);
      }
    });
  }

  // Play a short test tone (louder) to verify audio output path
  testTone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      o.start(now);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      o.stop(now + 0.26);
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 500);
      console.log('ttsService.testTone played');
    } catch (e) {
      console.warn('ttsService.testTone failed', e);
    }
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) this.cancel();
  }

  setSpeechRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(1, 1));
  }

  setVoice(voice) {
    this.selectedVoice = voice;
  }

  getVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  isSpeaking() {
    return this.synth?.speaking || false;
  }

  isSupported() {
    return this.synth !== null;
  }
}

export const ttsService = new TTSService();

// expose for debugging in dev console
try {
  if (typeof window !== 'undefined') window.__ttsService = ttsService;
} catch (e) {}
