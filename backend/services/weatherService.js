import fetch from "node-fetch";
import 'dotenv/config';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE = "https://api.weatherapi.com/v1";
console.log("Using WEATHER_API_KEY:", WEATHER_API_KEY ? "Yes" : "No");

class WeatherService {
  async getCurrentWeather(location) {
    if (!WEATHER_API_KEY) {
      throw new Error("WEATHER_API_KEY is not configured");
    }

    const url = `${WEATHER_API_BASE}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      location: `${data.location.name}, ${data.location.region}`,
      region: data.location.region,
      country: data.location.country,
      temperature: Math.round(data.current.temp_f),
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_mph),
      pressure: Math.round(data.current.pressure_mb),
      iconUrl: data.current.condition.icon,
    };
  }

  async getForecast(location, days = 3) {
    if (!WEATHER_API_KEY) {
      throw new Error("WEATHER_API_KEY is not configured");
    }

    const url = `${WEATHER_API_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=${days}&aqi=no&alerts=no`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.forecast.forecastday.map((day, index) => {
      const date = new Date(day.date);
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = index === 0 ? "Today" : dayNames[date.getDay()];

      return {
        date: day.date,
        day: dayName,
        condition: day.day.condition.text,
        high: Math.round(day.day.maxtemp_f),
        low: Math.round(day.day.mintemp_f),
        iconUrl: day.day.condition.icon,
      };
    });
  }

  async getWeatherAlerts(location) {
    if (!WEATHER_API_KEY) {
      throw new Error("WEATHER_API_KEY is not configured");
    }

    const url = `${WEATHER_API_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=1&aqi=no&alerts=yes`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.alerts || !data.alerts.alert || data.alerts.alert.length === 0) {
      return [];
    }

    return data.alerts.alert.map((alert) => ({
      headline: alert.headline || alert.event,
      severity: this.mapSeverity(alert.severity),
      description: alert.desc || alert.instruction || "Please take necessary precautions.",
      urgency: alert.urgency,
      event: alert.event,
    }));
  }

  mapSeverity(severity) {
    const severityMap = {
      Extreme: "extreme",
      Severe: "severe",
      Moderate: "moderate",
      Minor: "moderate",
    };
    return severityMap[severity] || "moderate";
  }
}

export const weatherService = new WeatherService();
