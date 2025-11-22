import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { audioFeedback } from "./libs/audioFeedback";
import { attachDistancesToShelters } from "./libs/distance";
import { useTTS } from "./hooks/useTTS";
import RoutePlayer from './routePlayer';
import { useLocation } from 'wouter';
import { ThemeToggle } from "./themeToggle";
import LogoutButton from './LogoutButton';
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
  const [userLocation, setUserLocation] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const watchRef = React.useRef(null);
  const { speak, cancel, isSpeaking, isSupported } = useTTS();
  const [, setLocation] = useLocation();

  // Speak once when the Shelter page is opened
  const spokeOnMountRef = useRef(false);
  useEffect(() => {
    if (spokeOnMountRef.current) return;
    spokeOnMountRef.current = true;
    try { audioFeedback.playChime(); } catch (e) {}
    try { speak && speak('Opened Shelter Finder'); } catch (e) {}
  }, [speak]);

  const findShelters = () => {
    setError(null);
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser. Please allow location or enter a nearby city.");
      setLoading(false);
      audioFeedback.speak("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });

        try {
          if (navigator.geolocation && !watchRef.current) {
            const id = navigator.geolocation.watchPosition(
              (wp) => {
                const { latitude: lat2, longitude: lon2 } = wp.coords;
                setUserLocation({ latitude: lat2, longitude: lon2 });
                setResults((prev) => (prev ? attachDistancesToShelters(prev, lat2, lon2) : prev));
              },
              (werr) => {
                console.warn('watchPosition error', werr);
              },
              { maximumAge: 5000, timeout: 20000, enableHighAccuracy: true }
            );
            watchRef.current = id;
          }
        } catch (e) {
        }

        try {
          const resp = await axios.get(`http://localhost:5000/api/shelters`, {
            params: { lat: latitude, lon: longitude, radius: 5000 },
            timeout: 10000,
          });

          const shelters = (resp.data && resp.data.shelters) || [];
          if (!shelters || shelters.length === 0) {
            const msg = 'No shelters available nearby.';
            setError(msg);
            try { window.dispatchEvent(new CustomEvent('notify', { detail: { title: 'Shelter Finder', body: msg } })); } catch (e) {}
            audioFeedback.playChime();
            // audioFeedback.speak(msg);
            setResults([]);
            setLoading(false);
            return;
          }
          const mapped = attachDistancesToShelters(shelters, latitude, longitude).slice(0, 10);
          setResults(mapped);
          setLoading(false);
          audioFeedback.playChime();
          // After a manual search completes, read all shelters returned by backend
          try {
            readAllShelters(mapped);
          } catch (e) {}
        } catch (err) {
          console.error('Shelter API error', err && err.message ? err.message : err);
          const withDist = SAMPLE_SHELTERS.map((s) => ({
            ...s,
            distance: haversineDistance(latitude, longitude, s.lat, s.lon),
          }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

          setResults(withDist);
          setError('Could not fetch nearby shelters from server — showing local examples.');
          setLoading(false);
          audioFeedback.playChime();
          // Read sample/fallback shelters so user still hears results when server fails
          try { readAllShelters(withDist); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('notify', { detail: { title: 'Shelter Finder', body: 'Could not fetch shelters from server — showing local examples.' } })); } catch (e) {}
        }
      },
      (err) => {
        console.error('Geolocation error', err);
        if (err && err.code === 1) {
          setError('Location access denied. Please enable location permissions in your browser.');
          audioFeedback.speak('Location access denied');
          try { window.dispatchEvent(new CustomEvent('notify', { detail: { title: 'Shelter Finder', body: 'Location access denied. Please enable location permissions.' } })); } catch (e) {}
        } else if (err && err.code === 2) {
          setError('Location unavailable. Try again or enter a nearby city.');
          audioFeedback.speak('Location unavailable');
          try { window.dispatchEvent(new CustomEvent('notify', { detail: { title: 'Shelter Finder', body: 'Location unavailable. Try again or enter a nearby city.' } })); } catch (e) {}
        } else {
          setError('Unable to retrieve location. Check browser permissions.');
          audioFeedback.speak('Unable to retrieve location');
          try { window.dispatchEvent(new CustomEvent('notify', { detail: { title: 'Shelter Finder', body: 'Unable to retrieve location. Check browser permissions.' } })); } catch (e) {}
        }
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const readNearest = (shelter) => {
    if (!shelter) return;
    const name = shelter.name || 'Unnamed shelter';
    const parts = [];
    if (shelter.info) parts.push(shelter.info);
    if (shelter.capacity) parts.push(`Capacity ${shelter.capacity}`);
    if (shelter.address) parts.push(`Address: ${shelter.address}`);
    if (shelter.phone) parts.push(`Phone: ${shelter.phone}`);
    if (shelter.accessibility && typeof shelter.accessibility === 'object') {
      const acc = Object.entries(shelter.accessibility)
        .filter(([, v]) => !!v)
        .map(([k]) => k.replace(/_/g, ' '))
        .join(', ');
      if (acc) parts.push(`Accessibility: ${acc}`);
    }

    const miles = shelter.distanceMiles ?? shelter.distance ?? (shelter.distanceMeters ? (shelter.distanceMeters / 1609.34) : null);
    const distText = miles != null ? `${miles.toFixed(1)} miles` : 'distance unavailable';

    const details = parts.length > 0 ? parts.join('. ') + '.' : '';
    const text = `Nearest shelter: ${name}. ${details} Distance: ${distText}.`;

    audioFeedback.speak(text);
  };

  // Read all shelters. If `list` is provided, use it (useful immediately after fetch);
  // otherwise fall back to current `results` state.
  const readAllShelters = (list) => {
    const listToRead = Array.isArray(list) ? list : results;
    if (!listToRead || !listToRead.length) {
      audioFeedback.speak('No shelters found');
      return;
    }

    let allText = `Found ${listToRead.length} shelters. `;
    listToRead.forEach((shelter, index) => {
      const name = shelter.name || 'Unnamed shelter';
      const parts = [];
      if (shelter.info) parts.push(shelter.info);
      if (shelter.capacity) parts.push(`Capacity ${shelter.capacity}`);
      if (shelter.address) parts.push(`Address: ${shelter.address}`);
      if (shelter.phone) parts.push(`Phone: ${shelter.phone}`);
      if (shelter.accessibility && typeof shelter.accessibility === 'object') {
        const acc = Object.entries(shelter.accessibility)
          .filter(([, v]) => !!v)
          .map(([k]) => k.replace(/_/g, ' '))
          .join(', ');
        if (acc) parts.push(`Accessibility: ${acc}`);
      }

      const miles = shelter.distanceMiles ?? shelter.distance ?? (shelter.distanceMeters ? (shelter.distanceMeters / 1609.34) : null);
      const distText = miles != null ? `${miles.toFixed(1)} miles` : 'distance unavailable';

      const details = parts.length > 0 ? parts.join('. ') + '.' : '';
      allText += `Shelter ${index + 1}. ${name}. ${details} Distance: ${distText}. `;
    });

    audioFeedback.speak(allText);
  };

  React.useEffect(() => {
    if (!results || !results.length) return;

    const keyHandler = (e) => {
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        // Pressing 'R' via keyboard should read ALL shelters
        readAllShelters();
      }

      if (e.key === 'Escape') {
        cancel();
        audioFeedback.playChime();
      }
    };

    const ttsRepeatHandler = () => readNearest(results[0]);
    const ttsStopHandler = () => { cancel(); audioFeedback.playChime(); };

    window.addEventListener('keydown', keyHandler);
    window.addEventListener('tts-repeat', ttsRepeatHandler);
    window.addEventListener('tts-stop', ttsStopHandler);

    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('tts-repeat', ttsRepeatHandler);
      window.removeEventListener('tts-stop', ttsStopHandler);
    };
  }, [results, speak, cancel]);

  React.useEffect(() => {
    return () => {
      try {
        if (watchRef.current && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchRef.current);
        }
      } catch (e) {}
    };
  }, []);

  // Auto-trigger removed: users must trigger "Find Shelters" manually via the
  // button, keyboard shortcut (F) or voice command. This prevents unsolicited
  // searches and automatic announcements when the page opens.


  React.useEffect(() => {
    const handler = () => {
      try {
        audioFeedback.playChime();
      } catch (e) {}
      const btn = document.querySelector('[data-testid="button-find-shelters"]');
      if (btn) btn.click();
      else findShelters();
    };

    window.addEventListener('voice-find-shelters', handler);
    return () => window.removeEventListener('voice-find-shelters', handler);
  }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        try {
          audioFeedback.playChime();
          audioFeedback.speak('Finding shelters near you');
        } catch (err) {}
        const btn = document.querySelector('[data-testid="button-find-shelters"]');
        if (btn) btn.click();
        else findShelters();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    const handler = () => {
      if (results && results.length > 0) {
        // Get the nearest shelter (first in results)
        const nearestShelter = results[0];
        
        // Find and click the directions button for the nearest shelter
        const directionsBtn = document.querySelector(`button[aria-label="Get directions to ${nearestShelter.name}"]`);
        if (directionsBtn) {
          directionsBtn.click();
        }
      }
    };

    window.addEventListener('voice-get-directions', handler);
    return () => window.removeEventListener('voice-get-directions', handler);
  }, [results]);

  React.useEffect(() => {
    const handler = () => {
      readAllShelters();
    };

    window.addEventListener('voice-read-all-shelters', handler);
    return () => window.removeEventListener('voice-read-all-shelters', handler);
  }, [results]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" aria-label="Main navigation">
        <div className="container">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setLocation('/home'); }}
            className="navbar-brand d-flex align-items-center"
          >
            <span className="h4 mb-0">Accessible Weather</span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={() => setLocation('/weather')} aria-label="Weather">Weather</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={() => setLocation('/shelters')} aria-label="Shelters">Shelters</button>
              </li>
            </ul>

            <div className="d-flex align-items-center">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

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

      <div className="text-center mt-2">
        <div className="small text-muted">Keyboard shortcut: press <kbd>F</kbd> to find shelters near you</div>
      </div>

      <div aria-live="polite" className="mt-4">
        {error && (
          <div className="alert alert-warning" role="status">
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div id="shelter-results" className="mt-3" role="region" aria-label="Nearby shelters">
              <div className="d-flex justify-content-center mb-3 gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => readNearest(results[0])}
                  aria-label="Read nearest shelter"
                  disabled={!isSupported}
                >
                  Read Nearest Shelter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => { cancel(); audioFeedback.playChime(); }}
                  aria-label="Stop speech"
                >
                  Stop Speech
                </button>
              </div>
            <ul className="list-group list-group-flush" role="list">
              {results.map((s) => (
                <li key={s.id} role="listitem" className="list-group-item d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto text-start">
                    <div className="fw-bold">{s.name}</div>
                    <div className="small text-muted">{s.info}</div>
                  </div>
                  <div className="text-end">
                    {(() => {
                      const miles = s.distanceMiles ?? s.distance ?? (s.distanceMeters ? (s.distanceMeters / 1609.34) : null);
                      return <div className="fw-semibold">{miles != null ? `${miles.toFixed(1)} mi` : '—'}</div>;
                    })()}
                    <div className="d-flex flex-column align-items-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm mt-2 mb-1"
                        onClick={() => {
                          const selectShelterWithRoute = async (shelter, explicitUserLoc = null) => {
                            setSelectedShelter(shelter);
                            setSelectedRouteId(null);
                            const olat = explicitUserLoc?.latitude ?? explicitUserLoc?.lat ?? userLocation?.latitude ?? userLocation?.lat ?? null;
                            const olon = explicitUserLoc?.longitude ?? explicitUserLoc?.lon ?? userLocation?.longitude ?? userLocation?.lon ?? null;
                            const dlat = shelter.lat ?? shelter.latitude ?? shelter.location?.coordinates?.[1] ?? null;
                            const dlon = shelter.lon ?? shelter.longitude ?? shelter.location?.coordinates?.[0] ?? null;
                            try {
                              const destName = shelter.name || shelter.title || shelter.name_long || null;
                              if (destName) {
                                try {
                                  const respSearch = await axios.get('http://localhost:5000/api/routes/search', { params: { destName }, timeout: 6000 });
                                  const listSearch = (respSearch.data && respSearch.data.routes) || [];
                                  if (listSearch.length > 0 && listSearch[0].route && listSearch[0].route._id) {
                                    setSelectedRouteId(listSearch[0].route._id);
                                    return;
                                  }
                                } catch (es) {
                                  console.warn('Route search by destination name failed', es && es.message ? es.message : es);
                                }
                              }

                            } catch (errAll) {
                              console.warn('Route lookup overall failed', errAll && errAll.message ? errAll.message : errAll);
                            }
                          };

                          if (!userLocation || (!userLocation.latitude && !userLocation.lat)) {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((p) => {
                                const loc = { latitude: p.coords.latitude, longitude: p.coords.longitude };
                                setUserLocation(loc);
                                selectShelterWithRoute(s, loc);
                              }, (err) => {
                                setError('Unable to get current location for directions.');
                                selectShelterWithRoute(s, null); 
                              }, { timeout: 10000 });
                            } else {
                              setError('Geolocation not available; cannot get current location.');
                              selectShelterWithRoute(s, null);
                            }
                          } else {
                            selectShelterWithRoute(s, null);
                          }
                        }}
                        aria-label={`Get directions to ${s.name}`}
                      >
                        Directions
                      </button>
                      <a
                        href={s.lat && s.lon ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm mt-1"
                      >
                        Open in Maps
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {selectedShelter && (() => {
        const origin = {
          lat: userLocation?.latitude ?? userLocation?.lat ?? userLocation?.lat ?? null,
          lon: userLocation?.longitude ?? userLocation?.lon ?? userLocation?.lon ?? null,
        };

        const destLat = selectedShelter.lat ?? selectedShelter.latitude ?? selectedShelter.location?.coordinates?.[1] ?? null;
        const destLon = selectedShelter.lon ?? selectedShelter.longitude ?? selectedShelter.location?.coordinates?.[0] ?? null;

        return (
          <div className="fixed-top d-flex justify-content-center pt-5">
            <div className="container" style={{ maxWidth: 720 }}>
                      <RoutePlayer
                        origin={origin}
                        destination={{ lat: destLat, lon: destLon }}
                        shelterName={selectedShelter.name}
                        routeId={selectedRouteId}
                        onClose={() => { setSelectedShelter(null); setSelectedRouteId(null); }}
                      />
            </div>
          </div>
        );
      })()}
    </section>
    </div>
  );
}
