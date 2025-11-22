import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { queryClient } from './components/queryClient';
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from './components/themeProvider';
import { Toaster } from './components/ui/toaster';
import { Switch, Route, useLocation } from "wouter";
import NotFound from './components/notFound';
import { useWeatherAlerts, WeatherAlertBanner } from "./components/hooks/useWeather"
import MainPage from './components/mainPage';
import WeatherPage from './components/home';
import Login from './components/Login';
import { useTTS } from './components/hooks/useTTS';
import { useToast } from './components/hooks/useToast';
import { audioFeedback } from './components/libs/audioFeedback';
import VoiceControl from './components/voicecontrols';
import GlobalAccessibilityListener from './components/GlobalAccessibilityListener';
import GlobalSpeechController from './components/GlobalSpeechController';
import { SosButton } from "./sos/SosButton";
import SheltersPage from './components/SheltersPage';
import { setupSOSKeyboardShortcut } from "./sos/keyboardShortcut";
import { triggerSOS } from "./sos/triggerSOS";

// ⭐ NEW IMPORTS
import { SosOverlay } from "./sos/SosOverlay";
import { registerSosOverlaySetter } from "./sos/triggerSOS";

import { WeatherDisplay } from './components/weatherDisplay';
import Home from './components/home';

function WeatherAlertHandler() {
  const location = "Houston";
  const { visibleAlert } = useWeatherAlerts(location);

  return (
    <>
      {visibleAlert && <WeatherAlertBanner alert={visibleAlert} />}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/shelters" component={SheltersPage} />
      <Route path="/login" component={Login} />
      <Route path="/home" component={MainPage} />
      <Route path="/weather" component={WeatherPage} />
      <Route path="/" component={Login} />
      <Route path="/:rest*" component={NotFound} />
      
    </Switch>
  );
}

function App() {
  const [, setLocation] = useLocation();
  const { speak } = useTTS();
  const { toasts, addToast } = useToast();

  // ⭐ NEW STATE FOR SOS OVERLAY
  const [sosVisible, setSosVisible] = useState(false);
  const [sosStatus, setSosStatus] = useState("");

  // ⭐ Register overlay setter ONCE
  useEffect(() => {
    registerSosOverlaySetter((visible, status) => {
      setSosVisible(visible);
      setSosStatus(status);
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key === '1') {
        setLocation('/weather');
        addToast({ title: 'Navigation', body: 'Moved to Weather page' });
        audioFeedback.playChime();
        audioFeedback.speak('Moved to Weather page');
      }

      if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key === '2') {
        setLocation('/shelters');
        addToast({ title: 'Navigation', body: 'Moved to Shelters page' });
        audioFeedback.playChime();
        audioFeedback.speak('Moved to Shelters page');
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setLocation('/home');
        audioFeedback.playChime();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setLocation('/weather');
        setTimeout(() => window.dispatchEvent(new CustomEvent('focus-search')), 150);
        addToast({ title: 'Navigation', body: 'Search focused on Weather page' });
        audioFeedback.playChime();
        audioFeedback.speak('Search focused');
      }
    };

    const notifyHandler = (e) => {
      try {
        const detail = e?.detail || {};
        const title = detail.title || 'Notification';
        const body = detail.body || '';
        addToast({ title, body });
        if (body) {
          audioFeedback.playChime();
          audioFeedback.speak(body);
        }
      } catch (err) {}
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('notify', notifyHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('notify', notifyHandler);
    };
  }, [setLocation, addToast, speak]);

  // ===============================
  // ⭐ SOS KEYBOARD SHORTCUT HOOK
  // ===============================
  useEffect(() => {
    const cleanup = setupSOSKeyboardShortcut(() => {
      triggerSOS(addToast);
      console.log("🚨 Emergency SOS triggered via keyboard shortcut");
    });
    return () => cleanup();
  }, []);

  useEffect(() => {
    const cleanup = setupSOSKeyboardShortcut(() => {
      triggerSOS(addToast);
      console.log("🚨 Emergency SOS triggered via keyboard shortcut");
    });
    return () => cleanup();
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster toasts={toasts} />

          {/* ⭐ NEW SOS OVERLAY - ALWAYS ON TOP */}
          <SosOverlay visible={sosVisible} status={sosStatus} />
            <Router />
          <VoiceControl />
          <GlobalAccessibilityListener />
          <GlobalSpeechController />
          <SosButton />   {/* ← Add this */}
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;