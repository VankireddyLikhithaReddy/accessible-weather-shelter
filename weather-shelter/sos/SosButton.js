import React from "react";
import { Siren } from "lucide-react";
import { triggerSOS } from "./triggerSOS";
import { audioFeedback } from "../components/libs/audioFeedback";
import { useToast } from "../components/hooks/useToast";

export function SosButton() {
  const { addToast } = useToast();

  const handleClick = () => {
    audioFeedback.playChime();
    // audioFeedback.speak("Emergency SOS Activated");
    triggerSOS(addToast);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Emergency SOS"
      className="sos-button"
      style={{
        position: "fixed",
        right: "12px",
        bottom: "80px",
        zIndex: 3000,
        backgroundColor: "#ff3b30",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        fontSize: "14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
      }}
    >
      <Siren size={26} />
      <span style={{ fontSize: "10px", marginTop: "2px" }}>SOS</span>
    </button>
  );
}


