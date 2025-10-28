// voiceControl.js
window.addEventListener('DOMContentLoaded', () => {
  const findShelterBtn = document.getElementById('find‐nearest-shelter-btn');
  if (!findShelterBtn) {
    console.warn('Find nearest shelter button not found');
    return;
  }

  // Check for SpeechRecognition support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechSynthesis = window.speechSynthesis;
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // Define synonyms or phrases to trigger
  const triggers = [
    /find nearest shelter/i,
    /shelters near me/i,
    /show nearest shelters/i,
    /display nearest shelters/i,
    /safe areas near me/i
  ];

  // Function to speak feedback
  function speak(text) {
    if (!SpeechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    SpeechSynthesis.speak(utter);
  }

  // Start listening when user chooses (you might have a toggle or hotkey)
  const startVoiceBtn = document.getElementById('start-voice-cmd-btn');
  if (startVoiceBtn) {
    startVoiceBtn.addEventListener('click', () => {
      speak('Listening for command');
      recognition.start();
    });
  } else {
    // Alternatively auto-start
    recognition.start();
    speak('Voice command enabled. Say “Find nearest shelter” when ready.');
  }

  recognition.addEventListener('result', (event) => {
    const spoken = event.results[0][0].transcript.trim();
    console.log('Voice command heard:', spoken);

    // See if spoken phrase matches any trigger
    const matched = triggers.some(regex => regex.test(spoken));
    if (matched) {
      speak('Finding nearest shelters now');
      // Activate the existing button’s click handler
      findShelterBtn.click();
    } else {
      speak('Command not recognised. Please say “Find nearest shelter” or similar.');
    }
  });

  recognition.addEventListener('error', (event) => {
    console.error('Speech recognition error:', event.error);
    speak('Sorry, voice command failed. Please try again.');
  });

  recognition.addEventListener('end', () => {
    // Optionally restart listening for continuous use
    // recognition.start();
  });
});
