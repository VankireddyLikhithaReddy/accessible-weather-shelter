import React, { useEffect } from 'react';
import { audioFeedback } from './libs/audioFeedback';
import { useTTS } from './hooks/useTTS';
import { useTheme } from './themeProvider';

export default function GlobalAccessibilityListener() {
  const { updateSpeechRate, speechRate, speak } = useTTS();
  const { toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    // initialize from localStorage (if present)
    try {
      const stored = Number(localStorage.getItem('fontSize'));
      if (stored && !Number.isNaN(stored)) {
        document.documentElement.style.fontSize = `${stored}px`;
      }
    } catch (e) {}

    const increase = () => {
      try {
        const prev = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
        const next = Math.min(24, prev + 2);
        document.documentElement.style.fontSize = `${next}px`;
        try { localStorage.setItem('fontSize', next); } catch (e) {}
        try { audioFeedback.playChime(); } catch (e) {}
      } catch (e) {}
    };

    const decrease = () => {
      try {
        const prev = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
        const next = Math.max(12, prev - 2);
        document.documentElement.style.fontSize = `${next}px`;
        try { localStorage.setItem('fontSize', next); } catch (e) {}
        try { audioFeedback.playChime(); } catch (e) {}
      } catch (e) {}
    };

    const setHandler = (e) => {
      try {
        const v = e && e.detail && Number(e.detail.size);
        if (!v || Number.isNaN(v)) return;
        const clamped = Math.max(12, Math.min(24, v));
        document.documentElement.style.fontSize = `${clamped}px`;
        try { localStorage.setItem('fontSize', clamped); } catch (err) {}
        try { audioFeedback.playChime(); } catch (err) {}
      } catch (err) {}
    };

    // Speech rate handlers
    const increaseSpeech = () => {
      try {
        const next = Math.min(2.0, (speechRate || 1) + 0.1);
        updateSpeechRate(Number(next.toFixed(1)));
        try { audioFeedback.playChime(); } catch (e) {}
        try { speak && speak(`Speech rate set to ${next.toFixed(1)} times`); } catch (e) {}
      } catch (e) {}
    };

    const decreaseSpeech = () => {
      try {
        const next = Math.max(0.5, (speechRate || 1) - 0.1);
        updateSpeechRate(Number(next.toFixed(1)));
        try { audioFeedback.playChime(); } catch (e) {}
        try { speak && speak(`Speech rate set to ${next.toFixed(1)} times`); } catch (e) {}
      } catch (e) {}
    };

    const setSpeech = (e) => {
      try {
        const v = e && e.detail && Number(e.detail.rate);
        if (!v || Number.isNaN(v)) return;
        const clamped = Math.max(0.5, Math.min(2.0, v));
        updateSpeechRate(Number(clamped.toFixed(1)));
        try { audioFeedback.playChime(); } catch (err) {}
        try { speak && speak(`Speech rate set to ${clamped.toFixed(1)} times`); } catch (err) {}
      } catch (err) {}
    };

    // Theme handlers
    const onToggleTheme = () => {
      try { toggleTheme(); } catch (e) {}
      try { audioFeedback.playChime(); } catch (e) {}
    };

    const onSetTheme = (e) => {
      try {
        const t = e && e.detail && (e.detail.theme || '').toLowerCase();
        if (t === 'dark' || t === 'light') {
          try { setTheme(t); } catch (ee) {}
          try { audioFeedback.playChime(); } catch (err) {}
        }
      } catch (err) {}
    };

    window.addEventListener('voice-increase-font', increase);
    window.addEventListener('voice-decrease-font', decrease);
    window.addEventListener('voice-set-font-size', setHandler);

    window.addEventListener('voice-increase-speech-rate', increaseSpeech);
    window.addEventListener('voice-decrease-speech-rate', decreaseSpeech);
    window.addEventListener('voice-set-speech-rate', setSpeech);

    window.addEventListener('voice-toggle-theme', onToggleTheme);
    window.addEventListener('voice-set-theme', onSetTheme);

    return () => {
      window.removeEventListener('voice-increase-font', increase);
      window.removeEventListener('voice-decrease-font', decrease);
      window.removeEventListener('voice-set-font-size', setHandler);

      window.removeEventListener('voice-increase-speech-rate', increaseSpeech);
      window.removeEventListener('voice-decrease-speech-rate', decreaseSpeech);
      window.removeEventListener('voice-set-speech-rate', setSpeech);

      window.removeEventListener('voice-toggle-theme', onToggleTheme);
      window.removeEventListener('voice-set-theme', onSetTheme);
    };
  }, [speechRate, updateSpeechRate, speak, toggleTheme, setTheme]);

  return null;
}
