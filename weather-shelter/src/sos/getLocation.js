// src/sos/getLocation.js

/**
 * Retrieves the user's current geolocation using the browser's Geolocation API.
 * Returns a Promise that resolves with { latitude, longitude, accuracy, timestamp }.
 * This file does NOT depend on React and does NOT modify any existing code.
 */

export function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({
                error: true,
                message: "Geolocation is not supported by this browser."
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                let message = "Unable to retrieve location.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Permission denied. Please allow location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out.";
                        break;
                    default:
                        message = "An unknown error occurred.";
                }

                reject({
                    error: true,
                    message
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}
