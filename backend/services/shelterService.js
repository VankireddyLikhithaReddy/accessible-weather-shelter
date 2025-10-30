import axios from 'axios';
import mongoose from 'mongoose';
import { Shelter } from '../models/Shelter.js';

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export const getShelters = async (lat, lon, radius = 5000) => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    try {
      const results = await Shelter.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
            distanceField: 'distanceMeters',
            spherical: true,
            maxDistance: parseInt(radius, 10),
          },
        },
        { $limit: 50 },
      ]).exec();

      return results.map((r) => ({
        id: r._id,
        name: r.name,
        address: r.address,
        lat: r.location?.coordinates?.[1],
        lon: r.location?.coordinates?.[0],
        distanceMeters: r.distanceMeters,
        info: r.info,
      }));
    } catch (err) {
      console.error('MongoDB shelters query failed, falling back to places/mock', err && err.message ? err.message : err);
    }
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY;

  if (googleKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
      const params = {
        key: googleKey,
        location: `${lat},${lon}`,
        radius: radius,
        keyword: 'shelter|community center|evacuation center',
      };

      const resp = await axios.get(url, { params });
      const data = resp.data;
      if (!data || !data.results) return [];

      const mapped = data.results.map((r, idx) => {
        const placeLat = r.geometry?.location?.lat;
        const placeLon = r.geometry?.location?.lng;
        const distanceMeters = placeLat && placeLon ? haversineMeters(lat, lon, placeLat, placeLon) : null;
        return {
          id: r.place_id || `g-${idx}`,
          name: r.name,
          address: r.vicinity || r.formatted_address || '',
          lat: placeLat,
          lon: placeLon,
          distanceMeters,
          info: r.types ? r.types.join(', ') : '',
        };
      });

      return mapped.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    } catch (err) {
      console.error('Google Places error, falling back to mock shelters', err && err.message ? err.message : err);
    }
  }

  const mapped = MOCK_SHELTERS.map((s) => ({
    ...s,
    distanceMeters: haversineMeters(lat, lon, s.lat, s.lon),
  }))
    .filter((s) => s.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return mapped;
};
