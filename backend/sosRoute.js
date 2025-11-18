// backend/sosRoute.js
import { sendSOSNotification } from "./services/sosService.js";

export function registerSosRoutes(app) {
  app.post("/api/sos/send", async (req, res) => {
    try {
      const { lat, lon } = req.body;

      if (!lat || !lon) {
        return res.status(400).json({ error: "Missing lat/lon" });
      }

      console.log("📩 Received SOS request:", lat, lon);

      const result = await sendSOSNotification({ lat, lon });

      return res.json({
        success: true,
        message: "SOS email sent successfully",
        result
      });

    } catch (err) {
      console.error("❌ SOS error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to send SOS"
      });
    }
  });
}
