import React, { useState } from "react";
const SAMPLE_SHELTERS = [
  { id: 1, name: "City Hall Shelter", lat: 51.5079, lon: -0.0877, info: "0.5 miles — Open 24/7" },
  { id: 2, name: "Central High Gym", lat: 51.5090, lon: -0.0850, info: "1.2 miles — Capacity 150" },
  { id: 3, name: "Community Center", lat: 51.5033, lon: -0.1195, info: "2.0 miles — Pet-friendly" },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 3958.8; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ShelterFinder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const findShelters = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation not supported. Please allow location or enter a nearby city.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const withDist = SAMPLE_SHELTERS.map((s) => ({
          ...s,
          distance: haversineDistance(latitude, longitude, s.lat, s.lon),
        }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        setResults(withDist);
        setLoading(false);
      },
      (err) => {
        setError("Unable to retrieve location. Check browser permissions.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <section aria-label="Find Emergency Shelters" className="text-center space-y-4 py-8">
      <h2 className="text-2xl md:text-3xl font-bold">Find Emergency Shelters</h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Locate nearby emergency shelters and safe locations during severe weather events.
      </p>

      <div className="d-flex justify-content-center">
        <button
          type="button"
          className="btn btn-primary btn-lg min-h-16 px-4 text-xl font-semibold"
          onClick={findShelters}
          aria-controls="shelter-results"
          aria-expanded={results ? "true" : "false"}
          data-testid="button-find-shelters"
        >
          {loading ? "Finding shelters..." : "Find Shelters Near Me"}
        </button>
      </div>

      <div aria-live="polite" className="mt-4">
        {error && (
          <div className="alert alert-warning" role="status">
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div id="shelter-results" className="mt-3" role="region" aria-label="Nearby shelters">
            <ul className="list-group list-group-flush" role="list">
              {results.map((s) => (
                <li key={s.id} role="listitem" className="list-group-item d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto text-start">
                    <div className="fw-bold">{s.name}</div>
                    <div className="small text-muted">{s.info}</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold">{s.distance.toFixed(1)} mi</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm mt-2"
                    >
                      Directions
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
