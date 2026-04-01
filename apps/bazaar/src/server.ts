import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PORTS } from "@agent-bazaar/common";
import registerRoutes from "./routes/register.js";
import discoverRoutes from "./routes/discover.js";
import crawlRoutes from "./routes/crawl.js";
import skillCrawlRoutes from "./routes/skill-crawl.js";
import reputationRoutes from "./routes/reputation.js";
import { crawlXlm402 } from "./seed.js";
import { getDb } from "./db.js";

const app = express();
const PORT = process.env.PORT || PORTS.BAZAAR;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bazaar-registry" });
});

// Routes
app.use(registerRoutes);
app.use(discoverRoutes);
app.use(crawlRoutes);
app.use(skillCrawlRoutes);
app.use(reputationRoutes);

// Initialize DB and seed
getDb();

app.listen(PORT, async () => {
  console.log(`[bazaar] Registry running on http://localhost:${PORT}`);

  // Crawl xlm402 on startup (agents self-register now)
  try {
    await crawlXlm402();
  } catch (err) {
    console.error("[bazaar] Crawl error:", err);
  }
});

export default app;
