import { useState, useEffect, useCallback } from "react";
import { audioFeedback } from "../libs/audioFeedback";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    // Populate available voices from the browser SpeechSynthesis API
    const ensureVoices = () => new Promise((resolve) => {
      const vs = window.speechSynthesis.getVoices() || [];
      if (vs.length) return resolve(vs);
      let resolved = false;
      const handler = () => {
        if (resolved) return;
        const v2 = window.speechSynthesis.getVoices() || [];
        if (v2.length) {
          resolved = true;
          try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {}
          resolve(v2);
        }
      };
      try { window.speechSynthesis.onvoiceschanged = handler; } catch (e) {}
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {}
        resolve(window.speechSynthesis.getVoices() || []);
      }, 800);
    });

    ensureVoices().then((availableVoices) => {
      setVoices(availableVoices);
      // Load persisted preferences if present
      let persistedRate = null;
      let persistedVoiceName = null;
      try { persistedRate = parseFloat(localStorage.getItem('speechRate')); } catch (e) {}
      try { persistedVoiceName = localStorage.getItem('preferredVoiceName'); } catch (e) {}

      if (persistedRate && !Number.isNaN(persistedRate)) {
        setSpeechRate(persistedRate);
      }

      if (persistedVoiceName) {
        const found = availableVoices.find(v => v.name === persistedVoiceName);
        if (found) setSelectedVoice(found);
      }

      if (!selectedVoice && availableVoices && availableVoices.length && !persistedVoiceName) {
        const preferred = availableVoices.find(v => /en/i.test(v.lang) || /en/i.test(v.name)) || availableVoices[0];
        setSelectedVoice(preferred);
      }
    }).catch(() => {});
  }, []);

  const speak = useCallback((text) => {
    setIsSpeaking(true);
    audioFeedback.speak(text, () => setIsSpeaking(false), () => setIsSpeaking(false));
  }, []);

  const cancel = useCallback(() => {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try { audioFeedback.setEnabled(!newMuted); } catch (e) {}
  }, [isMuted]);

  const updateSpeechRate = useCallback((rate) => {
    setSpeechRate(rate);
    try { localStorage.setItem('speechRate', String(rate)); } catch (e) {}
  }, []);

  const updateVoice = useCallback((voice) => {
    setSelectedVoice(voice);
    try { if (voice && voice.name) localStorage.setItem('preferredVoiceName', voice.name); } catch (e) {}
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isMuted,
    toggleMute,
    speechRate,
    updateSpeechRate,
    voices,
    selectedVoice,
    updateVoice,
    isSupported: typeof window !== 'undefined' && !!window.speechSynthesis,
  };
}
