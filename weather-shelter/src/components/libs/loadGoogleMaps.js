// src/utils/loadGoogleMaps.js

export function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    // Already loaded?
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve(window.google);
    script.onerror = () => reject("Failed to load Google Maps script");

    document.body.appendChild(script);
  });
}
