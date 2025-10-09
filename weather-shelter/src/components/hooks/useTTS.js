import { useState, useEffect, useCallback } from "react";
import { ttsService } from "../libs/ttsService";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    if (ttsService.isSupported()) {
      const loadVoices = () => {
        const availableVoices = ttsService.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const speak = useCallback((text) => {
    setIsSpeaking(true);
    ttsService.speak(
      text,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  }, []);

  const cancel = useCallback(() => {
    ttsService.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    ttsService.setMuted(newMuted);
  }, [isMuted]);

  const updateSpeechRate = useCallback((rate) => {
    setSpeechRate(rate);
    ttsService.setSpeechRate(rate);
  }, []);

  const updateVoice = useCallback((voice) => {
    setSelectedVoice(voice);
    ttsService.setVoice(voice);
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
    isSupported: ttsService.isSupported(),
  };
}
