
import React, { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { audioFeedback } from "./libs/audioFeedback";

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
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("fontSize") || 16)
  );
  const [audioEnabled, setAudioEnabled] = useState(
    (() => {
      try {
        return audioFeedback.isEnabled();
      } catch (e) {
        return true;
      }
    })()
  );
  const triggerRef = useRef(null);
  const modalContentRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
  }, [show]);

  useEffect(() => {
    let previouslyFocused = null;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShow(false);
        return;
      }

      if (e.key === "Tab") {
        const container = modalContentRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    if (show) {
      previouslyFocused = document.activeElement;
      setTimeout(() => {
        if (closeButtonRef.current) closeButtonRef.current.focus();
        else if (modalContentRef.current) {
          const el = modalContentRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          el && el.focus();
        }
      }, 0);

      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [show]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  return (
    <>
      <button
        className="btn btn-outline-primary btn-lg"
        onClick={() => setShow(true)}
        data-testid="button-accessibility-settings"
        ref={triggerRef}
        type="button"
      >
        <Settings className="me-2" />
        Accessibility Settings
      </button>

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
            if (e.target === e.currentTarget) setShow(false);
          }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content" ref={modalContentRef}>
              <div className="modal-header">
                <h5 className="modal-title" id="accessibilitySettingsLabel">
                  Accessibility Settings
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShow(false)}
                  ref={closeButtonRef}
                ></button>
              </div>

              <div className="modal-body">
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

                <div className="mb-4">
                  <label htmlFor="fontSizeRange" className="form-label">
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="12"
                    max="24"
                    step="1"
                    id="fontSizeRange"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    data-testid="slider-font-size"
                  />
                  <small className="form-text text-muted">
                    Adjust text size for better readability
                  </small>
                </div>

                <div className="form-check form-switch mb-4 d-flex justify-content-between align-items-center">
                  <div>
                    <label htmlFor="audioFeedbackSwitch" className="form-check-label">
                      Audio Feedback
                    </label>
                    <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                      Play a short chime or spoken confirmation for shortcuts and voice commands
                    </p>
                  </div>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="audioFeedbackSwitch"
                    checked={audioEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setAudioEnabled(val);
                      audioFeedback.setEnabled(val);
                      try { localStorage.setItem('audioFeedbackEnabled', val ? 'true' : 'false'); } catch (err) {}
                    }}
                    data-testid="switch-audio-feedback"
                  />
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