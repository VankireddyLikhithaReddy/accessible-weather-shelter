import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ttsService } from './libs/ttsService';
import { audioFeedback } from './libs/audioFeedback';

export default function RoutePlayer({ origin, destination, shelterName, onClose, routeId = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);
console.log(routeId)
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!origin || !destination) return;

    const fetchSteps = async () => {
      setLoading(true);
      setError(null);
      try {
        if (routeId) {
          try {
            const resp = await axios.get(`http://localhost:5000/api/routes/${routeId}/steps`, { timeout: 10000 });
            const data = resp.data || {};
            if (data.steps && data.steps.length > 0) {
              setSteps(data.steps);
              setIndex(0);
              return;
            }
          } catch (e) {
            console.warn('Could not load steps by routeId, falling back', e && e.message ? e.message : e);
          }
        }
      } catch (err) {
        console.error('Error fetching directions or stored steps', err);
        setError('Could not fetch directions');
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, [origin, destination, routeId]);

  useEffect(() => {
    return () => { ttsService.cancel(); };
  }, []);

  const speakStep = (i) => {
    if (!steps || !steps[i]) return;
    const text = `Step ${i + 1}: ${steps[i].instruction}`;
    try {
      ttsService.speak(text, () => {
        if (!mounted.current) return;
        if (playing && i < steps.length - 1) {
          setIndex((prev) => prev + 1);
          setTimeout(() => speakStep(i + 1), 250);
        } else {
          setPlaying(false);
        }
      }, () => { setPlaying(false); });
    } catch (e) {
      audioFeedback.speak(text);
    }
  };

  const onPlay = () => {
    if (!steps || steps.length === 0) return;
    setPlaying(true);
    speakStep(index);
  };

  const onPause = () => {
    ttsService.cancel();
    setPlaying(false);
  };

  const onNext = () => {
    ttsService.cancel();
    const next = Math.min(index + 1, steps.length - 1);
    setIndex(next);
    setPlaying(true);
    setTimeout(() => speakStep(next), 150);
  };

  const onPrev = () => {
    ttsService.cancel();
    const prev = Math.max(index - 1, 0);
    setIndex(prev);
    setPlaying(true);
    setTimeout(() => speakStep(prev), 150);
  };

  const handleKey = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (playing) onPause(); else onPlay();
    }
    if (e.key === 'n' || e.key === 'N') onNext();
    if (e.key === 'p' || e.key === 'P') onPrev();
    if (e.key === 'Escape') onClose && onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div role="dialog" aria-modal="true" className="route-player-modal p-4 bg-white shadow rounded">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h3 className="h5 mb-0">Directions to {shelterName || 'Destination'}</h3>
          <div className="small text-muted">From your location</div>
        </div>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { ttsService.cancel(); onClose && onClose(); }} aria-label="Close directions">Close</button>
        </div>
      </div>

      {loading && <div className="mb-2">Loading directions…</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="d-flex gap-2 mb-3">
        {playing ? (
          <button className="btn btn-danger" onClick={onPause} aria-label="Pause">Pause</button>
        ) : (
          <button className="btn btn-primary" onClick={onPlay} aria-label="Play">Play</button>
        )}
        <button className="btn btn-outline-primary" onClick={onPrev} aria-label="Previous step">Prev</button>
        <button className="btn btn-outline-primary" onClick={onNext} aria-label="Next step">Next</button>
      </div>

      <ol className="list-group list-group-numbered">
        {steps.map((s, idx) => (
          <li key={idx} className={`list-group-item ${idx === index ? 'active' : ''}`} aria-current={idx === index ? 'step' : undefined}>
            <div className="fw-bold">Step {s.order}</div>
            <div>{s.instruction}</div>
            <div className="small text-muted">{s.distanceMeters ? `${(s.distanceMeters/1000).toFixed(2)} km` : ''}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
