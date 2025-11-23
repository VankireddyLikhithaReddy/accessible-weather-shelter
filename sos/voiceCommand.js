// src/sos/voiceCommand.js

// List of phrases that should trigger SOS
const SOS_PHRASES = [
  "send sos",
  "emergency sos",
  "help me",
  "send help",
  "emergency help"
];

export function detectSOSCommand(spokenText = "") {
  const text = spokenText.toLowerCase().trim();

  return SOS_PHRASES.some((phrase) => text.includes(phrase));
}

