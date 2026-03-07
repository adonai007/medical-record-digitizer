import "dotenv/config";
import express from "express";
import { createServer } from "http";
import medicalRecordsRouter from "./routes/medical-records.js";
import { setupVite, serveStatic } from "./vite.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", medicalRecordsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = createServer(app);

// Setup Vite or static serving
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

const PORT = parseInt(process.env.PORT || "5001");
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Medical Record Digitizer running at http://localhost:${PORT}\n`);
});
