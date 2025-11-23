// src/sos/keyboardShortcut.js

export function setupSOSKeyboardShortcut(triggerSOS) {
  function handleKeydown(event) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl/Cmd + Shift + S → Emergency SOS
    if (ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      triggerSOS();
    }
  }

  window.addEventListener("keydown", handleKeydown);

  return () => {
    window.removeEventListener("keydown", handleKeydown);
  };
}
