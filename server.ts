import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import API handlers (same ones used by Vercel serverless)
import chatHandler from "./api/chat.ts";
import ttsHandler from "./api/tts.ts";
import transcribeHandler from "./api/transcribe.ts";
import healthHandler from "./api/health.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse json body up to 25MB for image and audio attachments
app.use(express.json({ limit: "25mb" }));

// Mount API endpoints
app.all("/api/health", healthHandler);
app.all("/api/chat", chatHandler);
app.all("/api/tts", ttsHandler);
app.all("/api/transcribe", transcribeHandler);

// Setup Vite development server or serve static build
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`ChatGPT O'zbekcha server running on http://0.0.0.0:${port}`);
  });
}

startServer();
