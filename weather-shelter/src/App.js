import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import { queryClient } from './components/queryClient';
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from './components/themeProvider';
import { Toaster } from './components/ui/toaster';
import { Switch, Route, useLocation } from "wouter";
import NotFound from './components/notFound';
import { useWeatherAlerts, WeatherAlertBanner } from "./components/hooks/useWeather"
import ShelterFinder from './components/shelterFinder';
import AccessibleWeatherApp from './components/weather';
import { useTTS } from './components/hooks/useTTS';
import { useToast } from './components/hooks/useToast';
import { audioFeedback } from './components/libs/audioFeedback';
import VoiceControl from './components/voiceControl';
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
      <Route path="/shelter" component={ShelterFinder} />
      <Route path="/weather" component={Home} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}
function App() {
  const [, setLocation] = useLocation();
  const { speak } = useTTS();
  const { toasts, addToast } = useToast();

  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key === '1') {
        setLocation('/weather');
        addToast({ title: 'Navigation', body: 'Moved to Weather page' });
        audioFeedback.playChime();
        audioFeedback.speak('Moved to Weather page');
      }

      if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key === '2') {
        setLocation('/shelter');
        addToast({ title: 'Navigation', body: 'Moved to Shelter page' });
        audioFeedback.playChime();
        audioFeedback.speak('Moved to Shelter page');
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setLocation('/');
        audioFeedback.playChime();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setLocation('/');
        setTimeout(() => window.dispatchEvent(new CustomEvent('focus-search')) , 150);
        addToast({ title: 'Navigation', body: 'Focused Search' });
        audioFeedback.playChime();
        audioFeedback.speak('Search focused');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setLocation, addToast, speak]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster toasts={toasts} />
          <Router />
          <VoiceControl />
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;