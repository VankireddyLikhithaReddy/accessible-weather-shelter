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
  const voiceFlowRef = useRef({ active: false, type: null, stage: null, data: {} });
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

      // If a voice-flow (login/register) is active, handle it here
      const flow = voiceFlowRef.current;
      if (flow && flow.active) {
        try {
          if (flow.stage === 'username') {
            // save cleaned username
            flow.data.username = transcript && transcript.trim();
            // If username wasn't captured correctly, prompt again
            if (!flow.data.username) {
              audioFeedback.playChime();
              audioFeedback.speak('I did not catch that username. Please say your username again');
              addToast({ title: 'Voice', body: 'Username not recognized — please repeat' });
              try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
              return;
            }
            flow.stage = 'password';
            audioFeedback.playChime();
            audioFeedback.speak('Please say your password now');
            addToast({ title: 'Voice', body: 'Got username — please say your password' });
            // restart recognition to capture password
            try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
            return;
          }

          if (flow.stage === 'password') {
            // capture password from transcript
            const capturedPassword = transcript && transcript.trim();
            // prefer the captured password; fall back to any previously stored
            const username = (flow.data && flow.data.username) || '';
            const password = capturedPassword || (flow.data && flow.data.password) || '';

            // If either field is missing, prompt and restart the relevant stage
            if (!username) {
              audioFeedback.playChime();
              audioFeedback.speak('Username missing, please say your username again');
              addToast({ title: 'Voice', body: 'Username missing — please repeat' });
              voiceFlowRef.current = { active: true, type: flow.type, stage: 'username', data: {} };
              try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
              return;
            }
            if (!password) {
              audioFeedback.playChime();
              audioFeedback.speak('I did not catch that password. Please say your password again');
              addToast({ title: 'Voice', body: 'Password not recognized — please repeat' });
              voiceFlowRef.current = { active: true, type: flow.type, stage: 'password', data: { username } };
              try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
              return;
            }

            const payload = { username, password };
            console.log('Voice flow payload:', payload);
            // dispatch event to front-end login/register handler
            if (flow.type === 'login') {
              window.dispatchEvent(new CustomEvent('voice-submit-login', { detail: payload }));
              audioFeedback.speak('Attempting to log you in now');
              addToast({ title: 'Voice', body: 'Submitting login' });
            } else if (flow.type === 'register') {
              window.dispatchEvent(new CustomEvent('voice-submit-register', { detail: payload }));
              audioFeedback.speak('Attempting to register your account now');
              addToast({ title: 'Voice', body: 'Submitting registration' });
            }
            // clear flow state
            voiceFlowRef.current = { active: false, type: null, stage: null, data: {} };
            setListening(false);
            return;
          }
        } catch (e) {
          console.error('Voice flow handling error', e);
          voiceFlowRef.current = { active: false, type: null, stage: null, data: {} };
          addToast({ title: 'Voice', body: 'Voice flow failed' });
        }
      }

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
      // Dispatch an event so other parts of the app can react if desired
      try { window.dispatchEvent(new CustomEvent('voice-open-sos')); } catch (e) {}
      // Use centralized SOS workflow (shows overlay, sends location, etc.)
      try { triggerSOS(addToast); } catch (e) { console.error('triggerSOS failed', e); }
      return;
    }
    // Voice-driven login/register flows
    // Start login flow when user says 'login', 'log me in', 'sign in' (but not 'sign up')
    if ((text.includes('log me in') || text === 'login' || text.includes('sign in') || text.includes('log in')) && !text.includes('sign up') && !text.includes('register')) {
      try { setLocation('/login'); } catch (e) {}
      voiceFlowRef.current = { active: true, type: 'login', stage: 'username', data: {} };
      audioFeedback.playChime();
      audioFeedback.speak('Please say your username now');
      addToast({ title: 'Voice', body: 'Voice login: say your username' });
      try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
      return;
    }

    if (text.includes('sign up') || text.includes('register') || text.includes('create account')) {
      try { setLocation('/login'); } catch (e) {}
      voiceFlowRef.current = { active: true, type: 'register', stage: 'username', data: {} };
      audioFeedback.playChime();
      audioFeedback.speak('Please say the username you want to register');
      addToast({ title: 'Voice', body: 'Voice register: say username' });
      try { recognitionRef.current && recognitionRef.current.start(); setListening(true); } catch (e) {}
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

    // Speech rate voice commands
    if (text.includes('increase speech') || text.includes('increase speech rate') || text.includes('faster voice') || text.includes('faster speech')) {
      try { window.dispatchEvent(new CustomEvent('voice-increase-speech-rate')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Increasing speech rate' });
      audioFeedback.playChime();
      audioFeedback.speak('Increasing speech rate');
      return;
    }

    if (text.includes('decrease speech') || text.includes('decrease speech rate') || text.includes('slower voice') || text.includes('slower speech')) {
      try { window.dispatchEvent(new CustomEvent('voice-decrease-speech-rate')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Decreasing speech rate' });
      audioFeedback.playChime();
      audioFeedback.speak('Decreasing speech rate');
      return;
    }

    // Set speech rate explicitly: e.g. "set speech rate to 1.3" or "speech rate 1.2"
    const srMatch = text.match(/(?:speech rate|rate) (?:to )?(\d(?:\.\d)?)/i);
    if (srMatch && srMatch[1]) {
      const val = Number(srMatch[1]);
      if (!Number.isNaN(val)) {
        try { window.dispatchEvent(new CustomEvent('voice-set-speech-rate', { detail: { rate: val } })); } catch (e) {}
        addToast({ title: 'Voice', body: `Setting speech rate to ${val}` });
        audioFeedback.playChime();
        audioFeedback.speak(`Setting speech rate to ${val}`);
        return;
      }
    }

    // Theme voice commands
    if (text.includes('dark mode') || text.includes('dark theme') || text.includes('switch to dark') || text.includes('set theme dark')) {
      try { window.dispatchEvent(new CustomEvent('voice-set-theme', { detail: { theme: 'dark' } })); } catch (e) {}
      addToast({ title: 'Voice', body: 'Switching to dark theme' });
      audioFeedback.playChime();
      audioFeedback.speak('Switching to dark theme');
      return;
    }

    if (text.includes('light mode') || text.includes('light theme') || text.includes('switch to light') || text.includes('set theme light')) {
      try { window.dispatchEvent(new CustomEvent('voice-set-theme', { detail: { theme: 'light' } })); } catch (e) {}
      addToast({ title: 'Voice', body: 'Switching to light theme' });
      audioFeedback.playChime();
      audioFeedback.speak('Switching to light theme');
      return;
    }

    if (text.includes('toggle theme') || text.includes('switch theme') || text.includes('change theme')) {
      try { window.dispatchEvent(new CustomEvent('voice-toggle-theme')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Toggling theme' });
      audioFeedback.playChime();
      audioFeedback.speak('Toggling theme');
      return;
    }

    if ((text.includes('shelter find')) || (text.includes('find shelter')) || (text.includes('search shelter'))) {
      // Navigate to shelter page first, then trigger find shelters
      try { setLocation('/shelters'); } catch (e) {}
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
      setLocation('/shelters');
      addToast({ title: 'Voice', body: 'Opening Shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Opening shelter');
      return;
    }

    if (text.includes('home') || text.includes('go home') || text === 'home') {
      setLocation('/home');
      addToast({ title: 'Voice', body: 'Going Home' });
      audioFeedback.playChime();
      audioFeedback.speak('Going home');
      return;
    }

    // Logout / sign out
    if (text.includes('logout') || text.includes('log out') || text.includes('sign out') || text.includes('sign me out')) {
      try { window.dispatchEvent(new CustomEvent('voice-logout')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Logging out' });
      audioFeedback.playChime();
      audioFeedback.speak('Logging out');
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

    // Read commands: prefer explicit "read all" before generic "read"
    if (text.includes('read all') || text.includes('read everything') || text.includes('read all shelters')) {
      try { window.dispatchEvent(new CustomEvent('voice-read-all')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Reading all shelters' });
      audioFeedback.playChime();
      audioFeedback.speak('Reading all shelters');
      return;
    }

    if (text.includes('read nearest') || text.includes('read nearest shelter') || text.includes('read the nearest')) {
      try { window.dispatchEvent(new CustomEvent('tts-repeat')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Reading nearest shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Reading nearest shelter');
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

    // Open Google Maps to the nearest (or specified) shelter
    if (text.includes('open maps') || text.includes('open map') || text.includes('open in maps') || text.includes('open google maps')) {
      // Optional: allow user to say "open maps to shelter two" — extract an index if present
      let idx = 0;
      const idxMatch = text.match(/shelter (one|two|three|four|five|\d+)/i);
      if (idxMatch && idxMatch[1]) {
        const word = idxMatch[1].toLowerCase();
        const mapWords = { one: 1, two: 2, three: 3, four: 4, five: 5 };
        idx = mapWords[word] || Number(word) || 0;
        // convert to zero-based
        if (!Number.isNaN(idx)) idx = Math.max(0, idx - 1);
      }
      try { window.dispatchEvent(new CustomEvent('voice-open-maps', { detail: { index: idx } })); } catch (e) {}
      addToast({ title: 'Voice', body: 'Opening Maps to nearest shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Opening maps to the nearest shelter');
      return;
    }

    // Navigation step controls: next / previous / stop navigation
    if (text === 'next' || text.includes('next step') || text.includes('go to next') || text.includes('advance')) {
      try { window.dispatchEvent(new CustomEvent('voice-next-step')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Next navigation step' });
      audioFeedback.playChime();
      audioFeedback.speak('Next step');
      return;
    }

    if (text === 'previous' || text.includes('previous step') || text.includes('go back') || text === 'back') {
      try { window.dispatchEvent(new CustomEvent('voice-prev-step')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Previous navigation step' });
      audioFeedback.playChime();
      audioFeedback.speak('Previous step');
      return;
    }

    if (text.includes('stop navigation') || text.includes('cancel navigation') || text.includes('end navigation')) {
      try { window.dispatchEvent(new CustomEvent('voice-stop-navigation')); } catch (e) {}
      addToast({ title: 'Voice', body: 'Stopping navigation' });
      audioFeedback.playChime();
      audioFeedback.speak('Stopping navigation');
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
