import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation } from 'wouter';

export default function MainPage() {
  const [, setLocation] = useLocation();

  return (
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
            <button className="btn btn-primary mt-3" onClick={() => setLocation('/shelter')}>Find Shelters</button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4">
        <h4 className="fw-bold mb-3">Voice Commands</h4>
        <p className="text-muted">Click the Voice button in the bottom right corner and try these commands:</p>
        <div className="row">
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li><strong>"Open weather"</strong> — Navigate to weather page</li>
              <li><strong>"Open shelter"</strong> — Navigate to shelter page</li>
              <li><strong>"Go home"</strong> — Return to home page</li>
            </ul>
          </div>
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li><strong>"Search shelter"</strong> — Find nearby shelters</li>
              <li><strong>"Read"</strong> — Read nearest shelter details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
