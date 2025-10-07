import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AccessibleWeatherApp() {
  const [themeLight, setThemeLight] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '1') setActive('weather');
      if (e.key === '2') setActive('shelter');
      if (e.key.toLowerCase() === 's') setActive('settings');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const themeClass = themeLight ? 'bg-light text-dark' : 'bg-dark text-light';
  const cardBg = themeLight ? 'bg-white' : 'bg-secondary text-light';

  return (
    <div
      className={`min-vh-100 ${themeClass} d-flex flex-column align-items-center justify-content-start py-5`}
      style={{
        background: themeLight
          ? 'linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%)'
          : 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        transition: 'background 0.4s ease-in-out'
      }}
    >
      {/* Header */}
      <header className="container mb-5 text-center">
        <h1 className="fw-bold display-5 mb-3">🌤️ Accessible Weather & Shelter Finder</h1>
        <p className="lead text-muted">
          Stay safe and informed — real-time weather and nearby shelters, designed for everyone.
        </p>
        <div className="form-check form-switch d-inline-flex align-items-center gap-2">
          <input
            className="form-check-input"
            type="checkbox"
            checked={!themeLight}
            onChange={() => setThemeLight(!themeLight)}
            id="themeSwitch"
          />
          <label className="form-check-label fw-semibold" htmlFor="themeSwitch">
            {themeLight ? 'Light Mode' : 'Dark Mode'}
          </label>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="container mb-5">
        <div className="row justify-content-center g-4">
          <div className="col-md-4">
            <button
              onClick={() => setActive('weather')}
              className={`btn btn-lg w-100 py-4 shadow-sm ${
                active === 'weather' ? 'btn-primary' : 'btn-outline-primary'
              }`}
            >
              ☁️ <br />
              <span className="fw-semibold fs-5">Check Weather</span>
              <div className="small">(Press 1)</div>
            </button>
          </div>

          <div className="col-md-4">
            <button
              onClick={() => setActive('shelter')}
              className={`btn btn-lg w-100 py-4 shadow-sm ${
                active === 'shelter' ? 'btn-success' : 'btn-outline-success'
              }`}
            >
              🏠 <br />
              <span className="fw-semibold fs-5">Find Shelter</span>
              <div className="small">(Press 2)</div>
            </button>
          </div>

          <div className="col-md-4">
            <button
              onClick={() => setActive('settings')}
              className={`btn btn-lg w-100 py-4 shadow-sm ${
                active === 'settings' ? 'btn-warning text-dark' : 'btn-outline-warning'
              }`}
            >
              ⚙️ <br />
              <span className="fw-semibold fs-5">Accessibility Settings</span>
              <div className="small">(Press S)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Section */}
      <div className="container mb-4">
        {active === 'weather' && (
          <div className={`card ${cardBg} shadow-lg p-4 text-center`}>
            <h3 className="fw-bold mb-2">Weather Results</h3>
            <p className="text-muted mb-0">
              Current temperature: <strong>24°C</strong> <br />
              Condition: <strong>Partly Cloudy</strong> <br />
              Severe alerts: <em>None</em>
            </p>
          </div>
        )}

        {active === 'shelter' && (
          <div className={`card ${cardBg} shadow-lg p-4 text-center`}>
            <h3 className="fw-bold mb-2">Nearby Shelters</h3>
            <p className="text-muted mb-0">
              1️⃣ City Hall Shelter — 0.5 miles <br />
              2️⃣ Central High Gym — 1.2 miles <br />
              3️⃣ Community Center — 2.0 miles
            </p>
          </div>
        )}

        {active === 'settings' && (
          <div className={`card ${cardBg} shadow-lg p-4`}>
            <h3 className="fw-bold mb-3 text-center">Accessibility Settings</h3>
            <form className="px-3">
              <div className="form-check mb-2">
                <input type="checkbox" id="contrast" className="form-check-input" />
                <label htmlFor="contrast" className="form-check-label">
                  Enable high contrast mode
                </label>
              </div>
              <div className="form-check mb-2">
                <input type="checkbox" id="tts" className="form-check-input" />
                <label htmlFor="tts" className="form-check-label">
                  Enable text-to-speech alerts
                </label>
              </div>
              <div className="form-check mb-2">
                <input type="checkbox" id="largeText" className="form-check-input" />
                <label htmlFor="largeText" className="form-check-label">
                  Increase text size
                </label>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Accessibility Features Card */}
      <div className={`card ${cardBg} shadow-sm mt-4 p-4`} style={{ maxWidth: '800px' }}>
        <h4 className="fw-bold mb-3 text-center">Accessibility Features</h4>
        <ul className="list-group list-group-flush">
          <li className="list-group-item bg-transparent">✔️ High contrast theme toggle</li>
          <li className="list-group-item bg-transparent">✔️ Large, clear buttons</li>
          <li className="list-group-item bg-transparent">✔️ Keyboard navigation (1, 2, S)</li>
          <li className="list-group-item bg-transparent">✔️ Screen reader compatibility</li>
          <li className="list-group-item bg-transparent">✔️ Voice and tone options</li>
        </ul>
      </div>

      {/* Footer */}
      <footer className="mt-5 text-muted small text-center">
        © 2025 Accessible Weather — Keyboard: 1=Weather, 2=Shelter, S=Settings
      </footer>
    </div>
  );
}
