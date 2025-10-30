import { weatherService } from "./services/weatherService.js";
import { getShelters } from "./services/shelterService.js";

export async function registerRoutes(app) {
  // Get current weather
  app.get("/api/weather/current/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const weatherData = await weatherService.getCurrentWeather(location);

      if (!weatherData || !weatherData.temperature) {
        return res.status(404).json({ error: "Weather data not found" });
      }

      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ error: error.message || "Failed to fetch weather data" });
    }
  });

  // Get weather forecast
  app.get("/api/weather/forecast/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const days = req.query.days ? parseInt(req.query.days, 10) : 3;

      const forecastData = await weatherService.getForecast(location, days);
      if (!forecastData || forecastData.length === 0) {
        return res.status(404).json({ error: "Forecast data not found" });
      }
      console.log("Forecast data:", forecastData);

      res.json(forecastData);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      res.status(500).json({ error: error.message || "Failed to fetch forecast data" });
    }
  });

  app.get("/api/weather/alerts/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const alerts = await weatherService.getWeatherAlerts(location);

      res.json(alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: error.message || "Failed to fetch alert data" });
    }
  });

  app.get("/api/shelters", async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat) : null;
      const lon = req.query.lon ? parseFloat(req.query.lon) : null;
      const radius = req.query.radius ? parseInt(req.query.radius, 10) : 5000;

      if (!lat || !lon) {
        return res.status(400).json({ error: "Missing required lat and lon query parameters" });
      }

      const result = await getShelters(lat, lon, radius);
      res.json({ shelters: result });
    } catch (error) {
      console.error("Error fetching shelters:", error);
      res.status(500).json({ error: error.message || "Failed to fetch shelters" });
    }
  });

  return app;
}
