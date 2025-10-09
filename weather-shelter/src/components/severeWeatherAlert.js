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
      className={`position-sticky top-0 z-50 w-100 ${colorClass} p-3`}
      role="alert"
      aria-live="assertive"
      data-testid="alert-severe-weather"
    >
      <div className="d-flex align-items-start gap-3">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1" />
        <div className="flex-grow-1 min-w-0">
          <h2 className="h5 mb-1">{alert.headline}</h2>
          <p className="mb-0">{alert.description}</p>
        </div>
        <button
          type="button"
          className="btn btn-light btn-sm flex-shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          data-testid="button-dismiss-alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
