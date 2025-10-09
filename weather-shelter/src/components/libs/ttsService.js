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
      if (onEnd) onEnd();
      return;
    }

    this.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = this.speechRate;

    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice;
    }

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = () => {
      this.currentUtterance = null;
      if (onError) onError();
    };

    this.synth.speak(this.currentUtterance);
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
    this.speechRate = Math.max(0.5, Math.min(2, rate));
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
