import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation } from 'wouter';
import { audioFeedback } from './libs/audioFeedback';
import { useTTS } from './hooks/useTTS';
import { ThemeToggle } from "./themeToggle";
import LogoutButton from './LogoutButton';

export default function MainPage() {
  const [, setLocation] = useLocation();
  const { isSupported } = useTTS();
  const mainSpokeRef = React.useRef(false);

  useEffect(() => {
    // Speak the main page title, description and voice command summary once when navigated to
    if (mainSpokeRef.current) return;
    mainSpokeRef.current = true;

    try { audioFeedback.playChime(); } catch (e) {}
    if (!isSupported) return;

    const textParts = [];
    textParts.push('Accessible Weather and Shelter.');
    textParts.push('Voice-controlled access to weather information and shelter locations.');
    textParts.push('Available voice commands include: Navigation. Say "Go to weather" or "Open weather" to open the Weather page. Say "Go to shelter" or "Open shelter" to open the Shelter Finder. Say "Go home" or "Home" to return to the main page.');
    textParts.push('Shelter Finder commands: Say "Search shelter" to find nearby shelters. Say "Read" or "Repeat" to read the nearest shelter. Say "Stop reading" or "Stop" to stop speech.');
    textParts.push('Font size commands: Say "Increase font" or "Make text bigger"; say "Decrease font" or "Make text smaller".');
    textParts.push('Weather commands: Say "Search for [location]" to find weather for a location. Say "Open accessibility settings" or "Open settings". Say "Announce details" to read current weather details.');

    try {
      audioFeedback.speak(textParts.join(' '));
    } catch (e) {
      try { window.speechSynthesis.cancel(); } catch (err) {}
    }

    // Allow stopping speech via tts-stop event
    const stopHandler = () => {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      try { audioFeedback.playChime(); } catch (e) {}
    };
    window.addEventListener('tts-stop', stopHandler);
    return () => window.removeEventListener('tts-stop', stopHandler);
  }, [isSupported]);

  // Stop speech with Escape key anywhere on the main page
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        try { window.speechSynthesis.cancel(); } catch (err) {}
        try { audioFeedback.playChime(); } catch (err) {}
        try { window.dispatchEvent(new CustomEvent('tts-stop')); } catch (err) {}
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>

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

    <div className="container py-5">
      <header className="text-center mb-5">
        <h1 className="fw-bold display-5">Accessible Weather & Shelter</h1>
        <p className="lead text-muted">Voice-controlled access to weather information and shelter locations</p>
      </header>

      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h3 className="fw-bold"><span role="img" aria-label="cloud">☁️</span> Weather Information</h3>
            <p className="text-muted">Get current weather conditions and forecasts</p>
            <button className="btn btn-primary mt-3" onClick={() => setLocation('/weather')}>View Weather</button>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h3 className="fw-bold"><span role="img" aria-label="home">🏠</span> Shelter Locations</h3>
            <p className="text-muted">Find nearby shelters and emergency services</p>
            <button className="btn btn-primary mt-3" onClick={() => setLocation('/shelters')}>Find Shelters</button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4">
        <h4 className="fw-bold mb-3">Voice Commands</h4>
        <p className="text-muted mb-3">Click the Voice button in the bottom right corner and try these commands:</p>
        
        <div className="row">
          <div className="col-md-6 mb-4">
            <h6 className="fw-bold text-primary"> Navigation</h6>
            <ul className="list-unstyled small">
              <li><strong>"Go to weather"</strong> / <strong>"Open weather"</strong></li>
              <li><strong>"Go to shelter"</strong> / <strong>"Open shelter"</strong></li>
              <li><strong>"Go home"</strong> / <strong>"Home"</strong></li>
             
            </ul>
          </div>
          


          <div className="col-md-6 mb-4">
            <h6 className="fw-bold text-primary">Shelter Finder</h6>
            <ul className="list-unstyled small">
              <li><strong>"Search shelter"</strong> — Find nearby shelters</li>
              <li><strong>"Read"</strong> / <strong>"Repeat"</strong> — Read nearest shelter</li>
              <li><strong>"Stop reading"</strong> / <strong>"Stop"</strong> — Stop speech</li>
            </ul>
          </div>

          <div className="col-md-6 mb-4">
            <h6 className="fw-bold text-primary">Font Size</h6>
            <ul className="list-unstyled small">
              <li><strong>"Increase font"</strong> / <strong>"Make text bigger"</strong></li>
              <li><strong>"Decrease font"</strong> / <strong>"Make text smaller"</strong></li>
            </ul>
          </div>

          <div className="col-md-6 mb-4">
            <h6 className="fw-bold text-primary"> Weather</h6>
            <ul className="list-unstyled small">
              <li><strong>"Search for [location]"</strong> — Find weather for a location</li>
               <li><strong>"Open accessibility settings"</strong> / <strong>"Open settings"</strong></li>
               <li><strong>"Announce details"</strong> / <strong>"Announce Details"</strong> — Read current weather details</li>
            </ul>
          </div>
        </div>

        <hr />
        <h6 className="fw-bold text-secondary mt-3 mb-2">Keyboard Shortcuts</h6>
        <div className="row small">
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li><kbd>1</kbd> → Weather page</li>
              <li><kbd>2</kbd> → Shelter page</li>
              <li><kbd>Ctrl/Cmd + H</kbd> → Home page</li>
            </ul>
          </div>
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li><kbd>Ctrl/Cmd + S</kbd> → Focus search</li>
              <li><kbd>Ctrl/Cmd + Shift + S</kbd> → SOS Alert</li>
              <li><kbd>F</kbd> → Find shelters (Shelter page)</li>
              <li><kbd>R</kbd> → Read shelter (Shelter page)</li>
              <li><kbd>Esc</kbd> → Stop speech (Shelter page)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}