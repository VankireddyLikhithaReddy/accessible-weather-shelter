import React, { useState } from "react";
import { audioFeedback } from './libs/audioFeedback';
import { Volume2, VolumeX, Play } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export function TTSControls({ onSpeak, isSpeaking, onToggleMute, isMuted }) {
  const [weatherText] = useState("Temperature 72 degrees Fahrenheit, sunny");

  return (
    <div className="card p-3 mb-3">
      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
        
        <div className="d-flex align-items-center gap-2 w-100 w-sm-auto">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            data-testid="button-toggle-mute"
          >
            {isMuted ? <VolumeX className="me-1" /> : <Volume2 className="me-1" />}
          </button>
          <span className="fw-semibold">Audio Controls</span>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg w-100 w-sm-auto"
          onClick={() => onSpeak(weatherText)}
          disabled={isSpeaking}
          data-testid="button-speak-weather"
        >
          <Play className="me-2" />
          {isSpeaking ? "Speaking..." : "Read Weather Aloud"}
        </button>

      </div>
    </div>
  );
}
