import React from "react";
import { AlertTriangle, X } from "lucide-react";

export function SevereWeatherAlert({ alert, onDismiss }) {
  // Map severity to Bootstrap alert classes
  const severityColors = {
    extreme: "bg-danger text-white", // extreme: red
    severe: "bg-warning text-dark",  // severe: yellow
    moderate: "bg-info text-white",  // moderate: blue
  };

  const colorClass = severityColors[alert.severity] || severityColors.moderate;

  return (
    <div
      className={`position-sticky top-0 z-50 w-100 ${colorClass} p-4 shadow-lg`}
      role="alert"
      aria-live="assertive"
      data-testid="alert-severe-weather"
      style={{
        fontSize: "1.25rem", // larger base font size
        lineHeight: "1.6",
        fontWeight: 600,
        letterSpacing: "0.5px",
      }}
    >
      <div className="d-flex align-items-start gap-3 flex-wrap">
        <AlertTriangle
          className="flex-shrink-0 mt-1"
          style={{ width: "2.2rem", height: "2.2rem" }}
        />
        <div className="flex-grow-1 min-w-0">
          <h2
            className="mb-2"
            style={{
              fontSize: "1.75rem", // bigger headline
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {alert.headline}
          </h2>
          <p
            className="mb-0"
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
            }}
          >
            {alert.description}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-light btn-lg flex-shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          data-testid="button-dismiss-alert"
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            padding: "0.5rem 1rem",
          }}
        >
          <X style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>
    </div>
  );
}
