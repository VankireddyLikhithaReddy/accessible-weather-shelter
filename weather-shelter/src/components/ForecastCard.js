import React from "react";
import { Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";

export function ForecastCard({ forecast }) {
  const weatherIcons = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    snowy: CloudSnow,
    default: Cloud,
  };

  const IconComponent = weatherIcons[forecast.condition.toLowerCase()] || weatherIcons.default;

  return (
    <div
      className="card text-center p-3"
      data-testid={`card-forecast-${forecast.day}`}
      style={{ minWidth: "150px" }}
    >
      <div className="card-body">
        <h3 className="card-title h5">{forecast.day}</h3>
        <IconComponent className="h-6 w-6 mx-auto my-2" aria-hidden="true" />
        <p className="card-text">{forecast.condition}</p>
        <div className="d-flex justify-content-center gap-2 fw-bold">
          <span data-testid={`text-high-${forecast.day}`}>{forecast.high}°</span>
          <span>/</span>
          <span data-testid={`text-low-${forecast.day}`}>{forecast.low}°</span>
        </div>
      </div>
    </div>
  );
}
