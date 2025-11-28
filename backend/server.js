import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { registerRoutes } from "./route.js";
import { registerSosRoutes } from "./sosRoute.js";
import app from "./app.js";
dotenv.config();

async function start() {
  await connectDB();
  await registerRoutes(app);
  await registerSosRoutes(app);

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
