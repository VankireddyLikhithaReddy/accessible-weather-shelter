// src/sos/sosApi.js

export async function sendSOSRequest({ latitude, longitude }) {
  const response = await fetch("http://localhost:5000/api/sos/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: latitude,
      lon: longitude
    })
  });

  return response.json();
}


