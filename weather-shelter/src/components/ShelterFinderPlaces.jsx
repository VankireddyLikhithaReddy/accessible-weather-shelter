import React, { useState, useEffect } from 'react';
import { loadGoogleMaps } from './libs/loadGoogleMaps';
import { getUserLocation } from './libs/getUserLocation';
import { audioFeedback } from './libs/audioFeedback';
import { useTTS } from './hooks/useTTS';
import { useLocation } from 'wouter';
import { ThemeToggle } from './themeToggle';
import LogoutButton from './LogoutButton';

// Client-side shelter finder using Google Maps Places Nearby Search
// Usage: render <ShelterFinderPlaces /> somewhere (requires REACT_APP_GOOGLE_MAPS_KEY)
export default function ShelterFinderPlaces() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const { speak, isSupported } = useTTS();
  const [, setLocation] = useLocation();

  const [runtimeKey, setRuntimeKey] = useState(() => {
    try {
      return (
        (window && window.localStorage && (window.localStorage.getItem('REACT_APP_GOOGLE_MAPS_API_KEY') || window.localStorage.getItem('REACT_APP_GOOGLE_MAPS_KEY'))) || ''
      );
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    // clear error when key changes
    if (runtimeKey) setError(null);
  }, [runtimeKey]);

  // If no key yet, try fetching /env.json (created in public/) for dev convenience
  useEffect(() => {
    if (runtimeKey) return;
    const tryFetch = async () => {
      try {
        const res = await fetch('/env.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const val = data.REACT_APP_GOOGLE_MAPS_API_KEY || data.REACT_APP_GOOGLE_MAPS_KEY;
        if (val) {
          try {
            if (window && window.localStorage) {
              window.localStorage.setItem('REACT_APP_GOOGLE_MAPS_API_KEY', val);
              window.localStorage.setItem('REACT_APP_GOOGLE_MAPS_KEY', val);
            }
          } catch (e) {}
          setRuntimeKey(val);
        }
      } catch (err) {}
    };
    tryFetch();
  }, [runtimeKey]);

  const [announcement, setAnnouncement] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Announce when the user navigates to the shelters page
  const mountAnnouncedRef = React.useRef(false);
  useEffect(() => {
    if (mountAnnouncedRef.current) return;
    mountAnnouncedRef.current = true;
    const pageMsg = 'Navigated to shelters page.';
    const voiceCmds = 'Available voice commands: Find shelters; Read nearest; Read all; Open maps ; Directions to shelter; Next step; Previous step; Stop navigation.';
    const combined = `${pageMsg} ${voiceCmds}`;
    setAnnouncement(combined);
    try {
      if (isSupported) {
        speak && speak(combined);
      } else {
        try { audioFeedback.speak(combined); } catch (e) {}
      }
    } catch (e) {
      try { audioFeedback.speak(combined); } catch (err) {}
    }
  }, [isSupported, speak]);

  // findShelters accepts a flag to indicate severe-weather search behavior
  const findShelters = async (severeModeFlag = false) => {
    setError(null);
    setLoading(true);
    setResults([]);
    setShowManualLocation(false);
    const key = runtimeKey || process.env.REACT_APP_GOOGLE_MAPS_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('Missing Google Maps API key. Paste your key into the input above and press Save.');
      setLoading(false);
      return;
    }
    try {
      const google = await loadGoogleMaps(key);

      const doSearch = async (userLoc) => {
        // Build a dummy map element for the PlacesService
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);

        // Keywords tuned for severe-weather shelter search
        const baseKeywords = ['shelter', 'evacuation center', 'emergency shelter', 'storm shelter', 'homeless shelter'];
        const severeKeywords = ['emergency shelter', 'evacuation center', 'storm shelter', 'disaster relief'];
        const keywords = severeModeFlag ? severeKeywords : baseKeywords;

        const radius = severeModeFlag ? 20000 : 5000;

        const searchFor = (kw) => new Promise((resolve) => {
          const request = {
            location: new google.maps.LatLng(userLoc.lat, userLoc.lng),
            radius,
            keyword: kw,
          };
          service.nearbySearch(request, (places, status) => {
            resolve({ keyword: kw, places: status === google.maps.places.PlacesServiceStatus.OK ? (places || []) : [] , status });
          });
        });

        const responses = await Promise.all(keywords.map(k => searchFor(k)));

        // Merge and dedupe results by place_id, track matched keywords
        const mapById = new Map();
        responses.forEach((res) => {
          (res.places || []).forEach((p) => {
            const existing = mapById.get(p.place_id);
            const obj = {
              id: p.place_id,
              name: p.name,
              address: p.vicinity || p.formatted_address || '',
              lat: p.geometry && p.geometry.location && p.geometry.location.lat && p.geometry.location.lat(),
              lng: p.geometry && p.geometry.location && p.geometry.location.lng && p.geometry.location.lng(),
              types: p.types || [],
              matchedKeywords: existing ? (existing.matchedKeywords.includes(res.keyword) ? existing.matchedKeywords : [...existing.matchedKeywords, res.keyword]) : [res.keyword],
            };
            mapById.set(p.place_id, obj);
          });
        });

        let merged = Array.from(mapById.values());

        // Sort by proximity (if lat/lng available)
        if (userLoc && userLoc.lat && userLoc.lng) {
          merged.sort((a, b) => {
            const da = (!a.lat || !a.lng) ? Number.MAX_VALUE : ((a.lat - userLoc.lat) ** 2 + (a.lng - userLoc.lng) ** 2);
            const db = (!b.lat || !b.lng) ? Number.MAX_VALUE : ((b.lat - userLoc.lat) ** 2 + (b.lng - userLoc.lng) ** 2);
            return da - db;
          });
        }

        // limit results
        merged = merged.slice(0, 30);

        // Fetch extra details (phone, opening_hours) for top 6 to help during severe weather
        const detailPromises = merged.slice(0, 6).map((m) => new Promise((resolve) => {
          service.getDetails({ placeId: m.id, fields: ['formatted_phone_number', 'opening_hours', 'website'] }, (detail, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
              resolve({ id: m.id, phone: detail.formatted_phone_number, opening_hours: detail.opening_hours, website: detail.website });
            } else {
              resolve(null);
            }
          });
        }));

        const details = await Promise.all(detailPromises);
        const detailsMap = new Map();
        details.forEach(d => { if (d) detailsMap.set(d.id, d); });

        const formatted = merged.map((m) => ({
          ...m,
          phone: detailsMap.get(m.id) && detailsMap.get(m.id).phone,
          opening_hours: detailsMap.get(m.id) && detailsMap.get(m.id).opening_hours,
        }));

        setResults(formatted);
        setLoading(false);

        try { audioFeedback.playChime(); } catch (e) {}
        const announce = formatted.length === 0 ? 'No shelters found nearby.' : `Found ${formatted.length} possible shelters nearby.`;
        setAnnouncement(announce);
        if (isSupported) {
          try { speak && speak(announce); } catch (e) {}
        }

        // Auto-read the nearest result for visually impaired users
        if (formatted && formatted.length) {
          try { readNearest(formatted[0]); } catch (e) {}
        }
      };

      // Try to get precise browser location first
      try {
        const userLoc = await getUserLocation();
        await doSearch(userLoc);
      } catch (locErr) {
        // Show manual location input so user can provide an address
        console.warn('getUserLocation failed', locErr);
        setError('Position update is unavailable. Please enter a location manually.');
        setShowManualLocation(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Shelter Finder (Places) error', err);
      setError(err && err.message ? err.message : String(err));
      setLoading(false);
    }
  };

  const geocodeAndSearch = async (address, severeModeFlag = false) => {
    setError(null);
    setLoading(true);
    const key = runtimeKey || process.env.REACT_APP_GOOGLE_MAPS_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('Missing Google Maps API key.');
      setLoading(false);
      return;
    }
    try {
      const google = await loadGoogleMaps(key);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, async (resultsGeo, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !resultsGeo || !resultsGeo.length) {
          setError('Could not geocode the provided address.');
          setLoading(false);
          return;
        }
        const loc = resultsGeo[0].geometry.location;
        await (async () => {
          // reuse the searching logic by invoking findShelters but with a wrapper
          // directly call doSearch by duplicating minimal logic: create map and service then run searches
          const map = new google.maps.Map(document.createElement('div'));
          const service = new google.maps.places.PlacesService(map);

          const baseKeywords = ['shelter', 'evacuation center', 'emergency shelter', 'storm shelter', 'homeless shelter'];
          const severeKeywords = ['emergency shelter', 'evacuation center', 'storm shelter', 'disaster relief'];
          const keywords = severeModeFlag ? severeKeywords : baseKeywords;
          const radius = severeModeFlag ? 20000 : 5000;

          const searchFor = (kw) => new Promise((resolve) => {
            const request = {
              location: loc,
              radius,
              keyword: kw,
            };
            service.nearbySearch(request, (places, status) => {
              resolve({ keyword: kw, places: status === google.maps.places.PlacesServiceStatus.OK ? (places || []) : [] , status });
            });
          });

          const responses = await Promise.all(keywords.map(k => searchFor(k)));
          const mapById = new Map();
          responses.forEach((res) => {
            (res.places || []).forEach((p) => {
              const existing = mapById.get(p.place_id);
              const obj = {
                id: p.place_id,
                name: p.name,
                address: p.vicinity || p.formatted_address || '',
                lat: p.geometry && p.geometry.location && p.geometry.location.lat && p.geometry.location.lat(),
                lng: p.geometry && p.geometry.location && p.geometry.location.lng && p.geometry.location.lng(),
                types: p.types || [],
                matchedKeywords: existing ? (existing.matchedKeywords.includes(res.keyword) ? existing.matchedKeywords : [...existing.matchedKeywords, res.keyword]) : [res.keyword],
              };
              mapById.set(p.place_id, obj);
            });
          });

          let merged = Array.from(mapById.values()).slice(0,30);
          const detailPromises = merged.slice(0, 6).map((m) => new Promise((resolve) => {
            service.getDetails({ placeId: m.id, fields: ['formatted_phone_number', 'opening_hours', 'website'] }, (detail, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
                resolve({ id: m.id, phone: detail.formatted_phone_number, opening_hours: detail.opening_hours, website: detail.website });
              } else {
                resolve(null);
              }
            });
          }));
          const details = await Promise.all(detailPromises);
          const detailsMap = new Map();
          details.forEach(d => { if (d) detailsMap.set(d.id, d); });
          const formatted = merged.map((m) => ({
            ...m,
            phone: detailsMap.get(m.id) && detailsMap.get(m.id).phone,
            opening_hours: detailsMap.get(m.id) && detailsMap.get(m.id).opening_hours,
          }));
          setResults(formatted);
          setLoading(false);
          const announce = formatted.length === 0 ? 'No shelters found nearby.' : `Found ${formatted.length} possible shelters nearby. First result: ${formatted[0] && formatted[0].name}`;
          setAnnouncement(announce);
          if (isSupported) try { speak && speak(announce); } catch (e) {}
          if (formatted && formatted.length) try { readNearest(formatted[0]); } catch (e) {}
        })();
      });
    } catch (err) {
      setError('Failed to geocode address');
      setLoading(false);
    }
  };

  const saveKey = (k) => {
    try {
      if (window && window.localStorage) {
        window.localStorage.setItem('REACT_APP_GOOGLE_MAPS_API_KEY', k);
        window.localStorage.setItem('REACT_APP_GOOGLE_MAPS_KEY', k);
      }
    } catch (e) {}
    setRuntimeKey(k);
  };

  // Listen for app-level triggers (voice or weather) to automatically run the shelter search.
  useEffect(() => {
    const handler = (e) => {
      const severeFlag = !!(e && e.detail && e.detail.severe);
      findShelters(severeFlag);
    };

    window.addEventListener('voice-find-shelters', handler);
    window.addEventListener('severe-weather', handler);

    return () => {
      window.removeEventListener('voice-find-shelters', handler);
      window.removeEventListener('severe-weather', handler);
    };
  }, [runtimeKey]);

  // Listen for simple TTS/read events from global voice control
  useEffect(() => {
    const onReadNearest = () => {
      if (results && results.length) {
        readNearest(results[0]);
      } else {
        // If no results, trigger a search and then auto-read when results arrive
        setPendingNavigationIndex(null); // not a navigation request
        findShelters();
      }
    };

    const onReadAll = () => {
      if (results && results.length) {
        readAll();
      } else {
        // trigger a search and then read once results arrive
        setPendingNavigationIndex(null);
        findShelters();
        // note: once results populate, the user can re-issue the voice command
      }
    };

    const onTtsRepeat = () => onReadNearest();

    window.addEventListener('voice-read-all', onReadAll);
    window.addEventListener('voice-read-nearest', onReadNearest);
    window.addEventListener('tts-repeat', onTtsRepeat);

    return () => {
      window.removeEventListener('voice-read-all', onReadAll);
      window.removeEventListener('voice-read-nearest', onReadNearest);
      window.removeEventListener('tts-repeat', onTtsRepeat);
    };
  }, [results]);

  const readNearest = (s) => {
    if (!s) return;
    const text = `Nearest shelter: ${s.name}. ${s.address || ''}`;
    try { audioFeedback.speak(text); } catch (e) {}
  };

  const readAll = () => {
    if (!results || !results.length) {
      try { audioFeedback.speak('No shelters to read'); } catch (e) {}
      return;
    }

    let all = `Found ${results.length} shelters. `;
    results.forEach((s, i) => {
      all += `Shelter ${i + 1}: ${s.name}. ${s.address || ''}. `;
    });

    try { audioFeedback.speak(all); } catch (e) {}
  };

  // Directions / step-by-step navigation state
  const [directionsSteps, setDirectionsSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState(null);
  // When a voice command asks for directions but no results exist yet,
  // store the pending index so we can start navigation after results arrive.
  const [pendingNavigationIndex, setPendingNavigationIndex] = useState(null);
  // When a voice command asks to open maps but no results exist yet,
  // store the pending index so we can open maps after results arrive.
  const [pendingMapIndex, setPendingMapIndex] = useState(null);

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  const openExternalDirections = (place, mode = 'driving') => {
    // use user's location if available
    getUserLocation().then((loc) => {
      const origin = loc ? `${loc.lat},${loc.lng}` : '';
      const destination = place && place.lat && place.lng ? `${place.lat},${place.lng}` : encodeURIComponent(place.address || place.name || '');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
      window.open(url, '_blank');
    }).catch(() => {
      const destination = place && place.lat && place.lng ? `${place.lat},${place.lng}` : encodeURIComponent(place.address || place.name || '');
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`;
      window.open(url, '_blank');
    });
  };

  const startStepByStep = async (place) => {
    setDirectionsError(null);
    setDirectionsLoading(true);
    setDirectionsSteps([]);
    setCurrentStepIndex(0);

    try {
      const key = runtimeKey || process.env.REACT_APP_GOOGLE_MAPS_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!key) throw new Error('Missing Google Maps key');
      const google = await loadGoogleMaps(key);
      const loc = await getUserLocation();
      const directionsService = new google.maps.DirectionsService();

      const origin = loc ? new google.maps.LatLng(loc.lat, loc.lng) : null;
      const destination = (place && place.lat && place.lng) ? new google.maps.LatLng(place.lat, place.lng) : place.address || place.name;

      const request = {
        origin: origin || (place.address || place.name),
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK && status !== google.maps.DirectionsStatus.OK) {
          setDirectionsError('Could not compute directions');
          setDirectionsLoading(false);
          return;
        }

        try {
          const steps = [];
          const legs = result.routes && result.routes[0] && result.routes[0].legs;
          if (legs && legs.length) {
            legs.forEach((leg) => {
              (leg.steps || []).forEach((s) => {
                steps.push({
                  instruction: stripHtml(s.instructions),
                  distance: s.distance && s.distance.text,
                  duration: s.duration && s.duration.text,
                });
              });
            });
          }

          setDirectionsSteps(steps);
          setDirectionsLoading(false);

          if (steps.length) {
            setCurrentStepIndex(0);
            try { audioFeedback.playChime(); } catch (e) {}
            try { speak && speak(`Starting navigation. First step: ${steps[0].instruction}`); } catch (e) {}
          } else {
            setDirectionsError('No route steps available');
          }
        } catch (e) {
          setDirectionsError('Failed to parse directions');
          setDirectionsLoading(false);
        }
      });
    } catch (err) {
      setDirectionsError(err && err.message ? err.message : String(err));
      setDirectionsLoading(false);
    }
  };

  const speakCurrentStep = (idx) => {
    const step = directionsSteps && directionsSteps[idx];
    if (!step) return;
    const text = `Step ${idx + 1}: ${step.instruction}. Distance: ${step.distance || ''}. Duration: ${step.duration || ''}`;
    try { speak && speak(text); } catch (e) {}
  };

  // Listen for navigation-related voice events: get-directions, next, prev, stop
  useEffect(() => {
    const onGetDirections = (e) => {
      // Accept optional index in detail to target a specific shelter
      const idx = e && e.detail && Number.isInteger(e.detail.index) ? e.detail.index : 0;

      if (results && results.length) {
        const target = results[Math.min(idx, results.length - 1)];
        if (target) startStepByStep(target);
        return;
      }

      // No results yet: trigger a search and remember we want to navigate to index idx
      setPendingNavigationIndex(idx);
      findShelters();
    };

    const onNext = () => {
      if (!directionsSteps || !directionsSteps.length) return;
      const next = Math.min(directionsSteps.length - 1, currentStepIndex + 1);
      setCurrentStepIndex(next);
      speakCurrentStep(next);
    };

    const onPrev = () => {
      if (!directionsSteps || !directionsSteps.length) return;
      const prev = Math.max(0, currentStepIndex - 1);
      setCurrentStepIndex(prev);
      speakCurrentStep(prev);
    };

    const onStopNav = () => {
      setDirectionsSteps([]);
      setCurrentStepIndex(0);
      setDirectionsError(null);
      setPendingNavigationIndex(null);
      setPendingMapIndex(null);
      try { speak && speak('Navigation stopped'); } catch (e) {}
    };

    window.addEventListener('voice-get-directions', onGetDirections);
    const onOpenMaps = (e) => {
      const idx = e && e.detail && Number.isInteger(e.detail.index) ? e.detail.index : 0;
      if (results && results.length) {
        const target = results[Math.min(idx, results.length - 1)];
        if (target) openExternalDirections(target);
        return;
      }
      setPendingMapIndex(idx);
      findShelters();
    };
    window.addEventListener('voice-open-maps', onOpenMaps);
    window.addEventListener('voice-next-step', onNext);
    window.addEventListener('voice-prev-step', onPrev);
    window.addEventListener('voice-stop-navigation', onStopNav);

    return () => {
      window.removeEventListener('voice-get-directions', onGetDirections);
      window.removeEventListener('voice-open-maps', onOpenMaps);
      window.removeEventListener('voice-next-step', onNext);
      window.removeEventListener('voice-prev-step', onPrev);
      window.removeEventListener('voice-stop-navigation', onStopNav);
    };
  }, [results, directionsSteps, currentStepIndex]);

  // When results update, if there's a pending navigation request, start it now
  useEffect(() => {
    if (pendingNavigationIndex === null) return;
    if (!results || !results.length) return;
    const idx = Math.min(pendingNavigationIndex, results.length - 1);
    const target = results[idx];
    if (target) startStepByStep(target);
    setPendingNavigationIndex(null);
  }, [results, pendingNavigationIndex]);

    // When results update, if there's a pending request to open maps, do it now
    useEffect(() => {
      if (pendingMapIndex === null) return;
      if (!results || !results.length) return;
      const idx = Math.min(pendingMapIndex, results.length - 1);
      const target = results[idx];
      if (target) openExternalDirections(target);
      setPendingMapIndex(null);
    }, [results, pendingMapIndex]);

  // Keyboard shortcuts (global while on this page):
  // - F: Find shelters
  // - R: Read nearest shelter
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      try {
        const active = document && document.activeElement;
        const tag = active && active.tagName;
        const editable = active && active.getAttribute && active.getAttribute('contenteditable') === 'true';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
      } catch (err) {
        // ignore
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        findShelters();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (results && results.length) {
          readNearest(results[0]);
        } else {
          setPendingNavigationIndex(null);
          findShelters();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [results, runtimeKey]);

  return (
    <>
    
    <div >
      {/* Accessibility announcement for screen readers */}
      <div aria-live="polite" style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>{announcement}</div>

      {/* Navbar — same structure used in Home/MainPage for consistency */}
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
      <br></br>
       <h1>Find Nearby Shelters</h1>
      <p className="text-muted">Search shelters using Google Maps Places API.</p>
   
      <div className="d-flex justify-content-center mb-3">
        <div style={{ maxWidth: 720, width: '100%' }}>
          {!runtimeKey && !process.env.REACT_APP_GOOGLE_MAPS_KEY && (
            <div className="mb-2">
              <label className="form-label">Google Maps API Key</label>
              <input
                type="password"
                className="form-control"
                placeholder="Paste your REACT_APP_GOOGLE_MAPS_KEY here"
                value={runtimeKey}
                onChange={(e) => setRuntimeKey(e.target.value.trim())}
                aria-label="Google Maps API Key"
              />
              <div className="mt-2 d-flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => saveKey(runtimeKey)} disabled={!runtimeKey}>Save Key</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setRuntimeKey('')}>Clear</button>
              </div>
              <small className="text-muted">Key is stored locally in your browser for development only.</small>
            </div>
          )}

          {showManualLocation && (
            <div className="mb-2">
              <label className="form-label">Enter location (address or city)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Houston, TX or 1600 Pennsylvania Ave NW"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                aria-label="Manual location"
              />
              <div className="mt-2 d-flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => geocodeAndSearch(manualAddress)} disabled={!manualAddress}>Use Location</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setShowManualLocation(false); setManualAddress(''); }}>Cancel</button>
              </div>
              <small className="text-muted">If location services are unavailable, provide an address or city to search nearby shelters.</small>
            </div>
          )}

          <div className="d-flex justify-content-center">
            <button className="btn btn-primary btn-lg" onClick={findShelters} disabled={loading} data-testid="button-find-shelters-places">
              {loading ? 'Finding shelters...' : 'Find Shelters Near Me (Places)'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">{error}</div>
      )}

      <div className="d-flex justify-content-center mb-3 gap-2">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => readNearest(results[0])} disabled={!results || !results.length}>Read Nearest</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={readAll} disabled={!results || !results.length}>Read All</button>
      </div>

      {/* Voice commands help: visible to users so they know what to say */}
      <div className="card mb-3" aria-label="Voice commands">
        <div className="card-body">
          <strong>Voice Commands</strong>
          <ul className="mb-0 mt-2">
            <li><code>Find shelters</code> — Start a shelter search (also: "find shelter", "find nearest shelters").</li>
            {/* <li><code>Severe weather</code> — Run a severe-weather focused shelter search.</li> */}
            <li><code>Read nearest</code> / <code>Read nearest shelter</code> — Read the nearest shelter aloud.</li>
            <li><code>Read all</code> — Read all found shelters aloud.</li>
            <li><code>Open maps</code> — Open Google Maps directions to the nearest shelter.</li>
            <li><code>Directions to shelter</code> — Start navigation to a nearest result.</li>
            <li><code>Next</code> / <code>Next step</code> — Go to the next navigation step.</li>
            <li><code>Previous</code> / <code>Previous step</code> — Go to the previous navigation step.</li>
            <li><code>Stop navigation</code> — Stop step-by-step navigation.</li>
          </ul>
          <small className="text-muted d-block mt-2">Keyboard: Press <strong>F</strong> to find shelters, <strong>R</strong> to read nearest shelter.</small>
        </div>
      </div>

      {/* Keyboard shortcuts: F = Find, R = Read nearest */}
      { /* Add a global key handler that is active on the shelters page */ }

      <ul className="list-group">
        {results.map((r) => (
          <li key={r.id} className="list-group-item">
            <div className="fw-bold">{r.name}</div>
            <div className="small text-muted">{r.address}</div>
            <div className="text-muted small">{r.lat && r.lng ? `(${r.lat.toFixed(4)}, ${r.lng.toFixed(4)})` : ''}</div>
            {r.phone && (<div className="mt-1"><strong>Phone:</strong> <a href={`tel:${r.phone}`}>{r.phone}</a></div>)}
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={() => openExternalDirections(r)}>Directions (Maps)</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => startStepByStep(r)} disabled={directionsLoading}>Start Navigation</button>
              {r.website && <a className="btn btn-sm btn-outline-info" href={r.website} target="_blank" rel="noreferrer">Website</a>}
            </div>
            {r.matchedKeywords && <div className="mt-1 small text-muted">Matched: {r.matchedKeywords.join(', ')}</div>}
          </li>
        ))}
      </ul>

      {/* Directions step-by-step UI */}
      {directionsLoading && <div className="mt-3">Loading route...</div>}
      {directionsError && <div className="alert alert-warning mt-3">{directionsError}</div>}
      {directionsSteps && directionsSteps.length > 0 && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex align-items-center mb-2">
              <strong>Navigation</strong>
              <div className="ms-auto small text-muted">Step {currentStepIndex + 1} / {directionsSteps.length}</div>
            </div>
            <div className="mb-2">{directionsSteps[currentStepIndex] && directionsSteps[currentStepIndex].instruction}</div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { const prev = Math.max(0, currentStepIndex - 1); setCurrentStepIndex(prev); speakCurrentStep(prev); }} disabled={currentStepIndex === 0}>Prev</button>
              <button className="btn btn-sm btn-primary" onClick={() => { const next = Math.min(directionsSteps.length - 1, currentStepIndex + 1); setCurrentStepIndex(next); speakCurrentStep(next); }} disabled={currentStepIndex >= directionsSteps.length - 1}>Next</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => { setDirectionsSteps([]); setCurrentStepIndex(0); setDirectionsError(null); }}>Stop</button>
            </div>
          </div>
        </div>
      )}
    </div>
     </>
  );
}
