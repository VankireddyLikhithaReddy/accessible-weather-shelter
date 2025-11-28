// src/sos/voiceCommand.js

// List of phrases / patterns that should trigger SOS. Use word-boundary matching
// so short matches like "sos" or "help" are detected reliably.
const SOS_PATTERNS = [
  /\bsos\b/i,
  /\bsend sos\b/i,
  /\bemergency\b/i,
  /\bemergency sos\b/i,
  /\bhelp me\b/i,
  /\bi need help\b/i,
  /\bsend help\b/i,
  /\bemergency help\b/i,
  /\bcall 911\b/i,
  /\bcall nine eleven\b/i,
  /\bmayday\b/i,
];

export function detectSOSCommand(spokenText = "") {
  const text = String(spokenText || '').toLowerCase().trim();
  if (!text) return false;
  return SOS_PATTERNS.some((re) => re.test(text));
}
