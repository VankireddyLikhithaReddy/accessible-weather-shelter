import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export function AccessibilitySettings({
  autoRead,
  onAutoReadChange,
  speechRate,
  onSpeechRateChange,
  voices,
  selectedVoice,
  onVoiceChange,
}) {
  const [show, setShow] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
  }, [show]);

  return (
    <>
      {/* Trigger Button */}
      <button
        className="btn btn-outline-primary btn-lg"
        onClick={() => setShow(true)}
        data-testid="button-accessibility-settings"
      >
        <Settings className="me-2" />
        Accessibility Settings
      </button>

      {/* Modal */}
      {show && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="accessibilitySettingsLabel"
          aria-modal="true"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
          }}
          onClick={(e) => {
            // Close only when clicking the backdrop (outside modal content)
            if (e.target === e.currentTarget) setShow(false);
          }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="accessibilitySettingsLabel">
                  Accessibility Settings
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShow(false)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Auto-Read Toggle */}
                <div className="form-check form-switch mb-4 d-flex justify-content-between align-items-center">
                  <div>
                    <label htmlFor="autoReadSwitch" className="form-check-label">
                      Auto-Read Weather
                    </label>
                    <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                      Automatically read weather updates when data changes
                    </p>
                  </div>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoReadSwitch"
                    checked={autoRead}
                    onChange={(e) => onAutoReadChange(e.target.checked)}
                    data-testid="switch-auto-read"
                  />
                </div>

                {/* Speech Rate Slider */}
                <div className="mb-4">
                  <label htmlFor="speechRateRange" className="form-label">
                    Speech Rate: {speechRate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    id="speechRateRange"
                    value={speechRate}
                    onChange={(e) =>
                      onSpeechRateChange(parseFloat(e.target.value))
                    }
                    data-testid="slider-speech-rate"
                  />
                  <small className="form-text text-muted">
                    Adjust how fast the text is spoken
                  </small>
                </div>

                {/* Voice Selection */}
                <div className="mb-4">
                  <label htmlFor="voiceSelect" className="form-label">
                    Voice Selection
                  </label>
                  <select
                    className="form-select"
                    id="voiceSelect"
                    value={selectedVoice?.name || "default"}
                    onChange={(e) => {
                      const voice =
                        voices.find((v) => v.name === e.target.value) || null;
                      onVoiceChange(voice);
                    }}
                    data-testid="select-voice"
                  >
                    <option value="default">Default Voice</option>
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShow(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
