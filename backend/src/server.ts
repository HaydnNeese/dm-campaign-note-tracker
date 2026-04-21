import express from "express";
import path from "path";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import campaignRoutes from "./routes/campaigns";
import entityRoutes from "./routes/entities";
import noteRoutes from "./routes/notes";
import uploadRoutes from "./routes/uploads";
import sessionAiRoutes from "./routes/sessionAi";

const app = express();

// ─── Global middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Serve uploaded images as static files ───────────────────
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ─── Health check ────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Routes ──────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/campaigns", entityRoutes);   // nested: /campaigns/:campaignId/entities
app.use("/", noteRoutes);              // mixed: /campaigns/:campaignId/notes + /notes/:id
app.use("/uploads", uploadRoutes);     // POST /uploads/image
app.use("/notes", sessionAiRoutes);    // AI: /notes/:id/process-session, /notes/:id/generate-recap

// ─── Error handler (must be last) ────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`🎲 DND Tracker API running on port ${config.port}`);
});

export default app;
