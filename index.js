import "dotenv/config";
import express from "express";
import cors from "cors";
import { cs_connectDB } from "./src/config/db.js";
import { cs_notFound, cs_errorHandler } from "./src/middleware/errorHandler.js";

const app = express();
const cs_port = process.env.PORT || 5000;
const cs_allowedOrigins = (process.env.CS_CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: cs_allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ name: "StudioSpace API", status: "running" });
});

app.get("/api/cs_health", async (req, res) => {
  const cs_db = await cs_connectDB();
  await cs_db.command({ ping: 1 });
  res.json({ ok: true, database: "connected" });
});

app.use(cs_notFound);
app.use(cs_errorHandler);

// Local server only — on Vercel the exported app is used as a serverless function
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
