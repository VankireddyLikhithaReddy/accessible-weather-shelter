import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function WeatherTTS() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch weather data from your Node backend
  const getWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/weather');
      const data = await res.json();
      setWeather(data.current);
      setForecast(data.forecast);
      speakText(`Current weather: ${data.current}. Forecast: ${data.forecast}`);
    } catch (err) {
      console.error('Error fetching weather:', err);
      speakText('Sorry, I could not fetch the weather right now.');
    } finally {
      setLoading(false);
    }
  };

  // Browser-based TTS using Web Speech API
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1; // Adjust speaking speed
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-Speech not supported in this browser.');
    }
  };

  return (
    <div className="container mt-5 p-4 border rounded shadow-sm bg-light">
      <h3 className="fw-bold mb-4 text-center">Accessible Weather (TTS Enabled)</h3>

      <div className="text-center mb-4">
        <button
          onClick={getWeather}
          className="btn btn-primary btn-lg px-5 py-3"
          disabled={loading}
        >
          {loading ? 'Fetching weather...' : '🔊 Get Weather & Speak'}
        </button>
      </div>

      {weather && (
        <div className="text-center">
          <h5 className="fw-bold">Current Weather</h5>
          <p>{weather}</p>
          <h6 className="fw-bold mt-3">Forecast</h6>
          <p>{forecast}</p>
        </div>
      )}
    </div>
  );
}
