import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get Daily Plant Tip
  app.get("/api/tips", (req, res) => {
    const tips = [
      "Check the soil moisture before watering; most plants prefer to dry out slightly.",
      "Rotate your plants every few weeks to ensure even growth.",
      "Clean the leaves of your indoor plants to help them photosynthesize better.",
      "Group plants with similar humidity needs together.",
      "Use lukewarm water for tropical plants to avoid shocking their roots."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip: randomTip });
  });

  // Get System Stats (Mock)
  app.get("/api/stats", (req, res) => {
    res.json({
      activeUsers: 1240,
      plantsMonitored: 8500,
      aiDiagnoses: 3200,
      uptime: process.uptime()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
