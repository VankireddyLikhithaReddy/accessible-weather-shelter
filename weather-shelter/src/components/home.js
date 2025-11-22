import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from 'wouter';
import { ThemeToggle } from "./themeToggle";
import LogoutButton from './LogoutButton';
import { WeatherDisplay } from "./weatherDisplay";
import { ForecastCard } from "./ForecastCard";
import { SevereWeatherAlert } from "./severeWeatherAlert";
import { TTSControls } from "./TTSControls";
import { AccessibilitySettings } from "./accessibilitySettings";
import LocationInput from "./locationInput";
import Feedback from "./feedback";
import { MapPin, Loader2 } from "lucide-react";
import { useCurrentWeather, useWeatherForecast, useWeatherAlerts, WeatherAlertBanner } from "./hooks/useWeather";
import { useTTS } from "./hooks/useTTS";
import { useToast } from "./hooks/useToast";
import { audioFeedback } from "./libs/audioFeedback";
import "bootstrap/dist/css/bootstrap.min.css";

export function WeatherAlertHandler({ location }) {
  const { visibleAlert } = useWeatherAlerts(location);

  if (!location) return null; 

  return (
    <>
      {visibleAlert && <WeatherAlertBanner alert={visibleAlert} />}
    </>
  );
}

export default function Home() {
  const [location, setSearchLocation] = useState("Denton");
  const [autoRead, setAutoRead] = useState(false);
const { toast, addToast, removeToast } = useToast();

  const spokenAlertsRef = useRef(new Set());

  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useCurrentWeather(location);
  const { data: forecastData, isLoading: forecastLoading } = useWeatherForecast(location, 3);
  const { data: alertsData, isLoading: alertsLoading} = useWeatherAlerts(location);

  const {
    speak,
    isSpeaking,
    isMuted,
    toggleMute,
    speechRate,
    updateSpeechRate,
    voices,
    selectedVoice,
    updateVoice,
    isSupported,
  } = useTTS();
  // Prevent duplicate automatic announcements when the component mounts/re-mounts
  const lastSpokenWeatherKey = useRef(null);
if (alertsLoading) {
      console.log("Weather Alerts API Response:", alertsLoading);
    }

  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [, setLocation] = useLocation();

  const activeAlerts = useMemo(
    () => (alertsData?.filter((alert) => !dismissedAlerts.has(alert.headline)) || []),
    [alertsData, dismissedAlerts]
  );

  const handleLocationSearch = (newLocation) => {
    setSearchLocation(newLocation);
    setDismissedAlerts(new Set());
    spokenAlertsRef.current = new Set();
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSearchLocation(`${latitude},${longitude}`);
          setDismissedAlerts(new Set());
          spokenAlertsRef.current = new Set();
        },
        () => {
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };


  const speakWeatherWithForecast = useCallback(() => {
    if (!weatherData) return;

    let fullText = `Weather update for ${weatherData.location}. Current temperature ${weatherData.temperature} degrees Fahrenheit. Conditions are ${weatherData.condition}. ${weatherData.high ? `High of ${weatherData.high}` : ''}${weatherData.low ? `, low of ${weatherData.low}` : ''}. Humidity ${weatherData.humidity} percent. Wind speed ${weatherData.windSpeed} miles per hour.`;
    
    // Add 3-day forecast if available
    if (forecastData && forecastData.length > 0) {
      fullText += ' Three day forecast: ';
      forecastData.forEach((day, index) => {
        fullText += `Day ${index + 1}. ${day.date}. High ${day.high} degrees, Low ${day.low} degrees. Conditions: ${day.condition}. `;
      });
    }
    
    speak(fullText);  
  }, [weatherData, forecastData, speak]);

  useEffect(() => {
    if (activeAlerts.length > 0 && autoRead && !isMuted) {
      const alert = activeAlerts[0];
      if (!spokenAlertsRef.current.has(alert.headline)) {
        const alertText = `Severe weather alert: ${alert.headline}. ${alert.description}`;
        speak(alertText);
        spokenAlertsRef.current.add(alert.headline);
      }
    }
  }, [activeAlerts, autoRead, isMuted, speak]);

  useEffect(() => {
    if (weatherData && !weatherLoading && forecastData && !forecastLoading) {
      // build a simple key representing this specific weather+forecast payload
      const key = `${weatherData.location || ''}:${weatherData.temperature || ''}:${(forecastData && forecastData.length) || 0}`;
      // if we've already announced this exact payload, skip to avoid duplicates
      if (lastSpokenWeatherKey.current === key) return;
      lastSpokenWeatherKey.current = key;
      speakWeatherWithForecast();
    }
  }, [weatherData, weatherLoading, forecastData, forecastLoading, speakWeatherWithForecast]);
  useEffect(() => {
    const onBefore = () => { try { window.speechSynthesis.cancel(); } catch (e) {} };
    window.addEventListener("beforeunload", onBefore);

    return () => {
      try { window.removeEventListener('beforeunload', onBefore); } catch (e) {}
      try { window.speechSynthesis.cancel(); } catch (e) {}
    };
  }, []);

  // Listen for voice command to read weather with forecast
  useEffect(() => {
    const handleVoiceReadWeather = () => {
      speakWeatherWithForecast(); 
    };

    window.addEventListener('voice-read-weather', handleVoiceReadWeather);
    return () => window.removeEventListener('voice-read-weather', handleVoiceReadWeather);
  }, [speakWeatherWithForecast]);

  // Handle Escape key to stop speech on weather page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        try { window.speechSynthesis.cancel(); } catch (err) {}
        addToast({ title: 'Speech', body: 'Speech stopped' });
        try { audioFeedback.playChime(); } catch (err) {}
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  const handleDismissAlert = (headline) => {
    setDismissedAlerts((prev) => new Set(prev).add(headline));
    spokenAlertsRef.current.delete(headline);
  };

  if (weatherError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Weather Data Unavailable</h1>
          <p className="text-lg text-muted-foreground">
            Could not fetch weather data. Please try again later.
          </p>
          <button onClick={() => window.location.reload()} variant="default" size="lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {activeAlerts.map((alert) => (
        <WeatherAlertBanner
          key={alert.headline}
          alert={alert}
          onDismiss={() => handleDismissAlert(null)}
        />
      ))}

      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" aria-label="Main navigation">
        <div className="container">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setLocation('/home'); }}
            className="navbar-brand d-flex align-items-center"
          >
            <span className="h4 mb-0">Accessible Weather</span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={() => setLocation('/weather')} aria-label="Weather">Weather</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={() => setLocation('/shelters')} aria-label="Shelters">Shelters</button>
              </li>
            </ul>

            <div className="d-flex align-items-center">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <section className="space-y-6">
          <LocationInput onSearch={handleLocationSearch} />

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              variant="outline"
              size="lg"
             className="btn btn-outline-primary btn-lg"
              onClick={handleCurrentLocation}
              data-testid="button-current-location"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Use Current Location
            </button>
            <AccessibilitySettings
              autoRead={autoRead}
              onAutoReadChange={setAutoRead}
              speechRate={speechRate}
              onSpeechRateChange={updateSpeechRate}
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={updateVoice}
            />
          </div>
        </section>

        {weatherLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : weatherData ? (
          <>
            <section aria-label="Current weather">
              <WeatherDisplay weather={weatherData} />
            </section>

            {isSupported && (
              <section aria-label="Audio controls">
                <TTSControls
                  onSpeak={speakWeatherWithForecast}
                  isSpeaking={isSpeaking}
                  onToggleMute={toggleMute}
                  isMuted={isMuted}
                />
              </section>
            )}

            {forecastLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : forecastData && forecastData.length > 0 ? (
              <section aria-label="Weather forecast" className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-center">
                  3-Day Forecast
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {forecastData.map((day, index) => (
                    <ForecastCard key={index} forecast={day} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {/* <section className="text-center space-y-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            Find Emergency Shelters
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Locate nearby emergency shelters and safe locations during severe weather events.
          </p>
          <button
            variant="default"
            size="lg"
            className="min-h-16 px-12 text-xl font-semibold"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Shelter finder feature will be available in the next update.",
              });
            }}
            data-testid="button-find-shelters"
          >
            Find Shelters Near Me
          </button>
        </section> */}

        {/* <section aria-label="User feedback">
          <Feedback />
        </section> */}
      </main>

      <footer className="border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p className="text-lg">
            Accessible Weather & Shelter Finder - Designed for Everyone
          </p>
        </div>
      </footer>
    </div>
  );
}
