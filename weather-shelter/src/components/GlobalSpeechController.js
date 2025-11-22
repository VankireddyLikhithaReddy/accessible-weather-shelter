import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { audioFeedback } from './libs/audioFeedback';

export default function GlobalSpeechController() {
  const [location] = useLocation();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const stopSpeech = () => {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      try { audioFeedback.playChime(); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('tts-stop')); } catch (e) {}
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopSpeech();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Stop speech when navigating between routes
  useEffect(() => {
    if (prevLocationRef.current && prevLocationRef.current !== location) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      try { audioFeedback.playChime(); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('tts-stop')); } catch (e) {}
    }
    prevLocationRef.current = location;
  }, [location]);

  return null;
}
