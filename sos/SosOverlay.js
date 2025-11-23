// src/sos/SosOverlay.js
import React from "react";

export function SosOverlay({ visible, status }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.5rem",
      zIndex: 5000
    }}>
      <div style={{ marginBottom: 20 }}>🚨 Emergency SOS Activated</div>
      <div>{status}</div>
    </div>
  );
}


