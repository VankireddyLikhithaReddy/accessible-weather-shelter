import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTTS } from './hooks/useTTS';
import { useToast } from './hooks/useToast';
import { audioFeedback } from './libs/audioFeedback';

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

    if (text.includes('weather') || text.includes('open weather') || text.includes('go to weather')) {
      setLocation('/weather');
      addToast({ title: 'Voice', body: 'Opening Weather' });
      audioFeedback.playChime();
      audioFeedback.speak('Opening weather');
      return;
    }

    if ((text.includes('search shelter'))) {
      try {
        window.dispatchEvent(new CustomEvent('voice-find-shelters'));
      } catch (e) {}
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
      setLocation('/');
      addToast({ title: 'Voice', body: 'Going Home' });
      audioFeedback.playChime();
      audioFeedback.speak('Going home');
      return;
    }

    const searchMatch = text.match(/search (for )?(.*)/i);
    if (searchMatch && searchMatch[2]) {
      const query = searchMatch[2].trim();
      window.dispatchEvent(new CustomEvent('voice-search', { detail: { query } }));
      addToast({ title: 'Voice', body: `Searching for ${query}` });
      audioFeedback.playChime();
      audioFeedback.speak(`Searching for ${query}`);
      return;
    }

    if (text.includes('read') || text.includes('repeat')) {
      window.dispatchEvent(new CustomEvent('tts-repeat'));
      addToast({ title: 'Voice', body: 'Reading nearest shelter' });
      audioFeedback.playChime();
      audioFeedback.speak('Reading nearest shelter');
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
