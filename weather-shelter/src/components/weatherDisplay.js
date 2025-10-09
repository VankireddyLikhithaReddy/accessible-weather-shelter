import React from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Gauge } from "lucide-react";

export function WeatherDisplay({ weather }) {
  const weatherIcons = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    snowy: CloudSnow,
    default: Cloud,
  };

  const IconComponent = weatherIcons[weather.condition.toLowerCase()] || weatherIcons.default;

  return (
    <div className="container my-4">
      {/* Location & Main Info */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold" data-testid="text-location">
          {weather.location}
        </h1>

        <div className="d-flex flex-column align-items-center gap-3">
          <IconComponent className="mb-3" style={{ width: 100, height: 100 }} aria-hidden="true" />
          <div>
            <p className="display-1 fw-bold font-monospace" data-testid="text-temperature">
              {weather.temperature}°F
            </p>
            <p className="h4 text-muted" data-testid="text-condition">
              {weather.condition}
            </p>
          </div>
        </div>

        {(weather.high || weather.low) && (
          <div className="d-flex justify-content-center gap-3 h5 mt-3">
            {weather.high && <span data-testid="text-high">H: {weather.high}°</span>}
            {weather.high && weather.low && <span className="text-muted">|</span>}
            {weather.low && <span data-testid="text-low">L: {weather.low}°</span>}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row text-center">
        <div className="col-md-4 mb-3">
          <div className="card p-3">
            <Droplets className="mb-2" style={{ width: 50, height: 50 }} aria-hidden="true" />
            <p className="h2 fw-bold font-monospace" data-testid="text-humidity">
              {weather.humidity}%
            </p>
            <p className="text-muted">Humidity</p>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card p-3">
            <Wind className="mb-2" style={{ width: 50, height: 50 }} aria-hidden="true" />
            <p className="h2 fw-bold font-monospace" data-testid="text-wind">
              {weather.windSpeed} mph
            </p>
            <p className="text-muted">Wind Speed</p>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card p-3">
            <Gauge className="mb-2" style={{ width: 50, height: 50 }} aria-hidden="true" />
            <p className="h2 fw-bold font-monospace" data-testid="text-pressure">
              {weather.pressure} mb
            </p>
            <p className="text-muted">Pressure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
