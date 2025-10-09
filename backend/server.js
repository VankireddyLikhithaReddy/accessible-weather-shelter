import express from "express";
import { registerRoutes } from "./route.js";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();

// CORS configuration: must be BEFORE routes
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // your React app URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // only works if origin is specific
}));

// Middleware: JSON and URL parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: Logging request and response
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      console.log(logLine);
    }
  });

  next();
});

// Register API routes
await registerRoutes(app);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", message);
  res.status(status).json({ message });
});

// Start server
const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});
