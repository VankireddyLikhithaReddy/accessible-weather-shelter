import { weatherService } from "./services/weatherService.js";
import { getShelters } from "./services/shelterService.js";
import { Route } from './models/Route.js';
import { getDirections } from './services/directionsService.js';
import mongoose from 'mongoose';
//import { sendSOSMail } from "./services/sosService.js";

export async function registerRoutes(app) {
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

  app.get('/api/routes', async (req, res) => {
    try {
      const routes = await Route.find().select('-__v').lean();
      res.json({ routes });
    } catch (err) {
      console.error('Error fetching routes', err);
      res.status(500).json({ error: err.message || 'Failed to fetch routes' });
    }
  });

  app.get('/api/shelters/:id/routes', async (req, res) => {
    try {
      const sid = req.params.id;
      if (!sid) return res.status(400).json({ error: 'Missing shelter id' });
      const q = { $or: [{ 'origin.shelterId': sid }, { 'destination.shelterId': sid }] };
      const routes = await Route.find(q).select('name origin destination steps totalDistanceMeters estimatedTimeSeconds').lean();
      const result = routes.map((r) => ({ route: { _id: r._id, name: r.name, origin: r.origin, destination: r.destination, totalDistanceMeters: r.totalDistanceMeters, estimatedTimeSeconds: r.estimatedTimeSeconds }, steps: (r.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0)) }));
      return res.json({ routes: result });
    } catch (err) {
      console.error('Error fetching routes for shelter', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch routes for shelter' });
    }
  });

  app.get('/api/shelters/:id/steps', async (req, res) => {
    try {
      const sid = req.params.id;
      if (!sid) return res.status(400).json({ error: 'Missing shelter id' });
      const routes = await Route.find({ $or: [{ 'origin.shelterId': sid }, { 'destination.shelterId': sid }] }).select('name origin destination steps totalDistanceMeters estimatedTimeSeconds').lean();
      const result = routes.map((r) => ({ route: { _id: r._id, name: r.name, origin: r.origin, destination: r.destination, totalDistanceMeters: r.totalDistanceMeters, estimatedTimeSeconds: r.estimatedTimeSeconds }, steps: (r.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0)) }));
      return res.json({ routes: result });
    } catch (err) {
      console.error('Error fetching route steps for shelter', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch route steps for shelter' });
    }
  });

  app.get('/api/routes/search', async (req, res) => {
    try {
      const destName = req.query.destName ? String(req.query.destName).trim() : null;
      if (!destName) return res.status(400).json({ error: 'Missing destName query parameter' });

      const esc = destName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `(?:→|->)\\s*${esc}$`;
      const regex = new RegExp(pattern, 'i');

      const routes = await Route.find({ name: { $regex: regex } }).select('name origin destination steps totalDistanceMeters estimatedTimeSeconds').lean();
      const result = routes.map((r) => ({ route: { _id: r._id, name: r.name, origin: r.origin, destination: r.destination, totalDistanceMeters: r.totalDistanceMeters, estimatedTimeSeconds: r.estimatedTimeSeconds }, steps: (r.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0)) }));
      return res.json({ routes: result });
    } catch (err) {
      console.error('Error searching routes by destination name', err);
      return res.status(500).json({ error: err.message || 'Failed to search routes' });
    }
  });

  app.get('/api/routes/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const route = await Route.findById(id).lean();
      if (!route) return res.status(404).json({ error: 'Route not found' });
      res.json(route);
    } catch (err) {
      console.error('Error fetching route', err);
      res.status(500).json({ error: err.message || 'Failed to fetch route' });
    }
  });
  
  app.get('/api/routes/:id/steps', async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Missing route id' });
      const route = await Route.findById(id).select('name origin destination steps totalDistanceMeters estimatedTimeSeconds').lean();
      if (!route) return res.status(404).json({ error: 'Route not found' });
      const steps = (route.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      return res.json({ route: { _id: route._id, name: route.name, origin: route.origin, destination: route.destination, totalDistanceMeters: route.totalDistanceMeters, estimatedTimeSeconds: route.estimatedTimeSeconds }, steps });
    } catch (err) {
      console.error('Error fetching route steps', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch route steps' });
    }
  });

  app.get('/api/routes/steps', async (req, res) => {
    try {
      const olat = req.query.olat ? parseFloat(req.query.olat) : null;
      const olon = req.query.olon ? parseFloat(req.query.olon) : null;
      const dlat = req.query.dlat ? parseFloat(req.query.dlat) : null;
      const dlon = req.query.dlon ? parseFloat(req.query.dlon) : null;
      const radius = req.query.radius ? parseFloat(req.query.radius) : 1000; 

      if ((olat == null || olon == null) && (dlat == null || dlon == null)) {
        return res.status(400).json({ error: 'Provide origin (olat,olon) or destination (dlat,dlon) coordinates' });
      }

      const all = await Route.find().select('name origin destination steps totalDistanceMeters estimatedTimeSeconds').lean();

      const haversineMeters = (lat1, lon1, lat2, lon2) => {
        if ([lat1, lon1, lat2, lon2].some((v) => v == null || Number.isNaN(Number(v)))) return Infinity;
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const matches = all.filter((r) => {
        try {
          const o = r.origin || {};
          const d = r.destination || {};
          let ok = false;
          if (olat != null && olon != null && o.lat != null && o.lon != null) {
            const dist = haversineMeters(olat, olon, o.lat, o.lon);
            if (dist <= radius) ok = true;
          }
          if (dlat != null && dlon != null && d.lat != null && d.lon != null) {
            const dist2 = haversineMeters(dlat, dlon, d.lat, d.lon);
            if (dist2 <= radius) ok = true;
          }
          return ok;
        } catch (e) {
          return false;
        }
      });

      const result = matches.map((r) => ({
        route: { _id: r._id, name: r.name, origin: r.origin, destination: r.destination, totalDistanceMeters: r.totalDistanceMeters, estimatedTimeSeconds: r.estimatedTimeSeconds },
        steps: (r.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));

      return res.json({ routes: result });
    } catch (err) {
      console.error('Error fetching routes by coords', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch routes' });
    }
  });
  // app.get('/api/directions', async (req, res) => {
  //   try {
  //     const olat = req.query.olat ? parseFloat(req.query.olat) : null;
  //     const olon = req.query.olon ? parseFloat(req.query.olon) : null;
  //     const dlat = req.query.dlat ? parseFloat(req.query.dlat) : null;
  //     const dlon = req.query.dlon ? parseFloat(req.query.dlon) : null;
  //     const mode = req.query.mode || 'walking';

  //     if (olat == null || olon == null || dlat == null || dlon == null) {
  //       return res.status(400).json({ error: 'Missing origin or destination coordinates' });
  //     }

  //     const result = await getDirections({ lat: olat, lon: olon }, { lat: dlat, lon: dlon }, mode);
  //     res.json(result);
  //   } catch (err) {
  //     console.error('Error computing directions', err);
  //     res.status(500).json({ error: err.message || 'Failed to compute directions' });
  //   }
  // });

  // EMERGENCY SOS EMAIL ENDPOINT
  app.post("/api/sos/send-email", async (req, res) => {
    try {
      const { latitude, longitude, timestamp } = req.body;

      if (!latitude || !longitude || !timestamp) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (latitude, longitude, timestamp)",
        });
      }

      const result = await sendSOSMail({ latitude, longitude, timestamp });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in SOS endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send SOS email",
      });
    }
  });
  return app;
}
