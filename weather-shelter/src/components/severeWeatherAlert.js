import React from "react";
import { AlertTriangle, X } from "lucide-react";

export function SevereWeatherAlert({ alert, onDismiss }) {
  // Map severity to gradient colors
  const severityColors = {
    extreme: "linear-gradient(90deg, #8b0000, #ff0000)", // dark red to bright red
    severe: "linear-gradient(90deg, #ffcc00, #ff9900)",  // yellow to orange
    moderate: "linear-gradient(90deg, #3399ff, #66ccff)", // blue shades
  };

  const bgGradient = severityColors[alert.severity] || severityColors.moderate;

  return (
    <div
      className="position-sticky top-0 z-50 w-100 p-4 shadow-lg"
      role="alert"
      aria-live="assertive"
      data-testid="alert-severe-weather"
      style={{
        background: bgGradient,
        color: "#ffffff",
        borderRadius: "12px",
        fontSize: "1.25rem",
        lineHeight: "1.6",
        fontWeight: 600,
        letterSpacing: "0.5px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
        margin: "16px",
        padding: "1.25rem 1.5rem",
        animation: "pulseAlert 2s infinite",
      }}
    >
      <div className="d-flex align-items-start gap-3 flex-wrap">
        <AlertTriangle
          className="flex-shrink-0 mt-1"
          style={{ width: "2.5rem", height: "2.5rem" }}
        />
        <div className="flex-grow-1 min-w-0">
          <h2
            className="mb-2"
            style={{
              fontSize: "1.85rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {alert.headline}
          </h2>
          <p
            className="mb-0"
            style={{
              fontSize: "1.3rem",
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
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          <X style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>

      <style>
        {`
          @keyframes pulseAlert {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
