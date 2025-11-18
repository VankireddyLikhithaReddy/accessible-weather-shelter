// src/sos/triggerSOS.js
import { audioFeedback } from "../components/libs/audioFeedback";
import { getUserLocation } from "./getLocation";
import { sendSOSRequest } from "./sosApi";

let overlaySetter = null; // to update SOS UI overlay

export function registerSosOverlaySetter(setter) {
  overlaySetter = setter;
}

export async function triggerSOS(addToast) {
  try {
    // UI: show overlay
    overlaySetter && overlaySetter(true, "Sending your location...");

    addToast && addToast({ title: "SOS", body: "SOS Activated" });
    audioFeedback.playChime();
    audioFeedback.speak("Emergency SOS activated. Sending your location now.");

    // 1. Get location
    const pos = await getUserLocation();
    const { latitude, longitude, timestamp } = pos;

    // UI update
    overlaySetter && overlaySetter(true, "Location acquired. Sending emergency email...");

    // 2. Send backend email
    const result = await sendSOSRequest({ latitude, longitude, timestamp });

    if (!result.success) {
      overlaySetter && overlaySetter(true, "Failed to send email. Try calling 911.");
      audioFeedback.speak("Failed to send emergency message. Please call 911 immediately.");
      return;
    }

    // 3. Email sent!
    overlaySetter && overlaySetter(true, "SOS email sent successfully.");

    audioFeedback.speak("Your emergency location has been sent. Please call 911 now.");

    // 4. Prompt 911
    setTimeout(() => {
      window.location.href = "tel:911";
    }, 2000);

  } catch (error) {
    overlaySetter && overlaySetter(true, "Error occurred. Please call 911 immediately.");
    audioFeedback.speak("Error occurred. Please call 911 immediately.");
    console.error("SOS error:", error);
  }

  // Hide overlay after 8 seconds
  setTimeout(() => overlaySetter && overlaySetter(false, ""), 8000);
}
