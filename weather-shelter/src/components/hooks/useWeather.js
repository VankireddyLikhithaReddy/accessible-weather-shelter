import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

// ----------------------
// Current Weather Hook
// ----------------------
export function useCurrentWeather(location) {
  return useQuery({
    queryKey: ["/api/weather/current", location],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/weather/current/${encodeURIComponent(location)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch current weather");
      }
      return response.json();
    },
    enabled: !!location,
  });
}

// ----------------------
// Forecast Hook
// ----------------------
export function useWeatherForecast(location, days = 3) {
  return useQuery({
    queryKey: ["/api/weather/forecast", location, days],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/weather/forecast/${encodeURIComponent(location)}?days=${days}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch forecast");
      }
      return response.json();
    },
    enabled: !!location,
  });
}

// ----------------------
// Alerts Hook with Audio + Visual Banner
// ----------------------
export function useWeatherAlerts(location) {
  const lastAlertRef = useRef(null);
  const [visibleAlert, setVisibleAlert] = useState(null);

  const query = useQuery({
    queryKey: ["/api/weather/alerts", location],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/weather/alerts/${encodeURIComponent(location)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      console.log("Weather Alerts:", data);
      return data;
    },
    enabled: !!location,
    refetchInterval: 60000, // refetch every 1 minute
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      const latestAlert = query.data[0];
      const alertId = latestAlert.headline || latestAlert.event;

      if (lastAlertRef.current !== alertId) {
        lastAlertRef.current = alertId;

        // Show banner for low-vision users
        setVisibleAlert({
          headline: latestAlert.headline,
          description: latestAlert.description,
          severity: latestAlert.severity,
        });

        // Announce via TTS for blind users
        const message = `⚠️ Severe weather alert for ${location}. ${latestAlert.headline}. ${latestAlert.description}. Please stay safe.`;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);

        console.log("🔊 Announcing weather alert:", message);

        // Auto-hide after 60 seconds
        setTimeout(() => setVisibleAlert(null), 60000);
      }
    }
  }, [query.data, location]);

  return { ...query, visibleAlert };
}

// ----------------------
// Inline Alert Banner Component
// ----------------------
export function WeatherAlertBanner({ alert }) {
  if (!alert) return null;

  const severityColors = {
    severe: "#ff0000", // bright red
    extreme: "#8b0000", // dark red
    moderate: "#ff9900", // orange
  };

  const bgColor = severityColors[alert.severity] || "#ffcc00";

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: "#ffffff",
        padding: "24px 16px",
        textAlign: "center",
        fontSize: "1.8rem",
        fontWeight: "bold",
        borderRadius: "10px",
        margin: "16px 0",
        boxShadow: "0px 0px 12px rgba(0,0,0,0.6)",
        animation: "alertPulse 2s infinite",
      }}
      aria-live="assertive"
    >
      ⚠️ {alert.headline || "Severe Weather Alert"} <br />
      <span style={{ fontSize: "1.3rem", fontWeight: "600" }}>
        {alert.description}
      </span>

      <style>
        {`
          @keyframes alertPulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
