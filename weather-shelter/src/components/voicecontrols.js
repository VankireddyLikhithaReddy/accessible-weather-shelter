import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTTS } from './hooks/useTTS';
import { useToast } from './hooks/useToast';
import { audioFeedback } from './libs/audioFeedback';
// 🚨 NEW IMPORT
import { detectSOSCommand } from "../sos/voiceCommand";
import { triggerSOS } from "../sos/triggerSOS";
export default function VoiceControl() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [, setLocation] = useLocation();
  const { speak } = useTTS();
  const { addToast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({ title: 'Voice Control', body: 'Speech Recognition not supported in this browser.' });
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      handleCommand(transcript);
    };

    // If the user begins speaking while TTS is playing, cancel TTS immediately
    recog.onspeechstart = () => {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      try { audioFeedback.playChime(); } catch (e) {}
    };

    recog.onerror = (e) => {
      console.error('Speech recognition error', e);
      addToast({ title: 'Voice Control', body: 'Speech recognition error' });
      speak && speak('Speech recognition error');
    };

    recog.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
    return () => {
      recog.abort && recog.abort();
      recognitionRef.current = null;
    };
  }, [addToast, speak, setLocation]);

  const handleCommand = (text) => {
    if (!text) {
      addToast({ title: 'Voice', body: 'Command not recognized' });
      audioFeedback.playChime();
      audioFeedback.speak('Command not recognized');
      return;
    }
    // 🚨 NEW CODE — EMERGENCY SOS VOICE COMMAND
    if (detectSOSCommand(text)) {
      console.log("🚨 Emergency SOS triggered by voice command");
      // Temporary now — full workflow added in Task #94
      // 🚨 Use centralized SOS workflow
      triggerSOS(addToast);
      return;
    }
    console.log("Voice command text:", text);

    if (text.includes('weather') || text.includes('open weather') || text.includes('go to weather')) {
      setLocation('/weather');
      addToast({ title: 'Voice', body: 'Opening Weather' });
      audioFeedback.playChime();
      audioFeedback.speak('Opening weather');
      return;
    }

    // Font size voice commands
    if (text.includes('increase font') || text.includes('increase font size') || text.includes('make text bigger') || text.includes('larger font') || text.includes('bigger text')) {
      try { window.dispatchEvent(new CustomEvent('voice-increase-font')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Increasing font size' });
      audioFeedback.playChime();
      audioFeedback.speak('Increasing font size');
      return;
    }

    if (text.includes('decrease font') || text.includes('decrease font size') || text.includes('make text smaller') || text.includes('smaller font') || text.includes('smaller text')) {
      try { window.dispatchEvent(new CustomEvent('voice-decrease-font')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Decreasing font size' });
      audioFeedback.playChime();
      audioFeedback.speak('Decreasing font size');
      return;
    }

    if ((text.includes('shelter find')) || (text.includes('find shelter')) || (text.includes('search shelter'))) {
      // Navigate to shelter page first, then trigger find shelters
      try { setLocation('/shelter'); } catch (e) {}
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('voice-find-shelters')); } catch (e) {}
      }, 150);
      addToast({ title: 'Voice', body: 'Finding shelters near you' });
      audioFeedback.playChime();
      audioFeedback.speak('Finding shelters near you');
      return;
    }
console.log("Voice command text:", text);
    if (text.includes('open shelter') || text.includes('open shelters') || text.includes('go to shelter') || text.includes('go to shelters')) {
      setLocation('/shelter');
      addToast({ title: 'Voice', body: 'Opening Shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Opening shelter');
      return;
    }

    if (text.includes('home') || text.includes('go home') || text === 'home') {
      setLocation('/');
      addToast({ title: 'Voice', body: 'Going Home' });
      audioFeedback.playChime();
      audioFeedback.speak('Going home');
      return;
    }

    // Accessibility settings (modal on weather page)
    if (text.includes('accessibility') || text.includes('accessibility settings') || text.includes('open accessibility') || text.includes('open accessibility settings') || text.includes('open settings')) {
      try { setLocation('/weather'); } catch (e) {}
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('voice-open-accessibility')); } catch (e) {}
      }, 100);
      addToast({ title: 'Voice', body: 'Opening Accessibility Settings' });
      audioFeedback.playChime();
      // audioFeedback.speak('Opening accessibility settings');
      return;
    }

    const searchMatch = text.match(/search (for )?(.*)/i);
    if (searchMatch && searchMatch[2]) {
      const query = searchMatch[2].trim();
      // Navigate to weather page first, then dispatch search event
      try { setLocation('/weather'); } catch (e) {}
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('voice-search', { detail: { query } })); } catch (e) {}
      }, 150);
      addToast({ title: 'Voice', body: `Searching for ${query}` });
      audioFeedback.playChime();
      audioFeedback.speak(`Searching for ${query}`);
      return;
    }

    if (text.includes('announce details') || text.includes('announce weather')) {
      try { window.dispatchEvent(new CustomEvent('voice-read-weather')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Reading weather details' });
      audioFeedback.playChime();
      audioFeedback.speak('Reading weather details');
      return;
    }

    if (text.includes('read') || text.includes('repeat')) {
      window.dispatchEvent(new CustomEvent('tts-repeat'));
      addToast({ title: 'Voice', body: 'Reading nearest shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Reading nearest shelter');
      return;
    }

    if (text.includes('directions') || text.includes('get directions') || text.includes('navigate')) {
      try { window.dispatchEvent(new CustomEvent('voice-get-directions')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Getting directions to nearest shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Getting directions to the nearest shelter');
      return;
    }

    if (text.includes('stop reading') || text.includes('stop') || text.includes('cancel')) {
      window.dispatchEvent(new CustomEvent('tts-stop'));
      addToast({ title: 'Voice', body: 'Stopping speech' });
      audioFeedback.playChime();
      audioFeedback.speak('Stopping speech');
      return;
    }

    addToast({ title: 'Voice', body: 'Command not recognized' });
    audioFeedback.playChime();
    audioFeedback.speak('Command not recognized');
  };

  // Toggle listening with Spacebar (press once to start, press again to stop).
  // Ignore when focus is on input/textarea or contentEditable to avoid interfering with typing.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const active = document.activeElement;
      const tag = active && active.tagName && active.tagName.toUpperCase();
      const isEditable = active && (active.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || active.getAttribute('role') === 'textbox');
      if (isEditable) return;

      e.preventDefault();
      // Toggle listening state
      toggleListening();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [/* no deps intentionally so it uses latest toggleListening via closure */]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addToast({ title: 'Voice', body: 'Speech Recognition not available' });
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      addToast({ title: 'Voice', body: 'Stopped listening' });
      audioFeedback.playChime();
      audioFeedback.speak('Stopped listening');
    } else {
      try {
        // Cancel any ongoing TTS before starting recognition so speech stops immediately
        try { window.speechSynthesis.cancel(); } catch (e) {}
        try { audioFeedback.playChime(); } catch (e) {}
        recognitionRef.current.start();
        setListening(true);
        addToast({ title: 'Voice', body: 'Listening for commands' });
        audioFeedback.playChime();
        audioFeedback.speak('Listening for commands');
      } catch (err) {
        console.error('start error', err);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 2000 }}>
      <button
        type="button"
        className="btn btn-outline-primary btn-lg d-flex align-items-center"
        onClick={toggleListening}
        aria-pressed={listening}
        aria-label={listening ? 'Stop voice commands' : 'Start voice commands'}
        data-testid="button-voice-control"
      >
        {listening ? <Mic className="me-2" /> : <MicOff className="me-2" />}
        {listening ? 'Listening...' : 'Voice'}
      </button>
    </div>
  );
}
