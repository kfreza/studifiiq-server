import "dotenv/config";
import express from "express";
import cors from "cors";
import { cs_connectDB } from "./src/config/db.js";
import { cs_notFound, cs_errorHandler } from "./src/middleware/errorHandler.js";
import studioRoutes from "./src/routes/studioRoutes.js";

// app setup
const app = express();
const cs_port = process.env.PORT || 5000;
const cs_allowedOrigins = (process.env.CS_CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

// middleware
app.use(cors({ origin: cs_allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// health routes
app.get("/", (req, res) => {
  res.json({ name: "StudioSpace API", status: "running" });
});

app.get("/api/health", async (req, res) => {
  const cs_db = await cs_connectDB();
  await cs_db.command({ ping: 1 });
  res.json({ ok: true, database: "connected" });
});

// api routes
app.use("/api", studioRoutes);

// error handlers
app.use(cs_notFound);
app.use(cs_errorHandler);

// local server
if (!process.env.VERCEL) {
  cs_connectDB()
    .then(() => {
      console.log("MongoDB connected");
      app.listen(cs_port, () => console.log(`StudioSpace API running on http://localhost:${cs_port}`));
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

export default app;
