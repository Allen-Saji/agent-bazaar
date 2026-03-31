import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PORTS, PRICES, NETWORK, FACILITATOR_URL } from "@agent-bazaar/common";
import { searchHandler } from "./search/handler.js";
import { summarizeHandler } from "./summarize/handler.js";
import { sentimentHandler } from "./sentiment/handler.js";
import { formatHandler } from "./format/handler.js";

// Dynamic imports for x402 — these are ESM packages
async function startServer() {
  const { paymentMiddleware } = await import("@x402/express");
  const { x402ResourceServer } = await import("@x402/express");
  const { ExactStellarScheme } = await import("@x402/stellar/exact/server");
  const { HTTPFacilitatorClient } = await import("@x402/core/server");

  const app = express();
  const PORT = process.env.PORT || PORTS.AGENTS;

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Health check (no paywall)
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "agents" });
  });

  // x402 paywall setup
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  const x402Server = new x402ResourceServer(facilitatorClient).register(
    "stellar:testnet",
    new ExactStellarScheme(),
  );

  const paywallRoutes: Record<
    string,
    { accepts: Array<{ scheme: string; price: string; network: string; payTo: string }>; description: string }
  > = {};

  const agentConfigs = [
    {
      route: "POST /search",
      price: PRICES.SEARCH,
      payTo: process.env.SEARCH_AGENT_ADDRESS,
      desc: "Web search via Serper",
    },
    {
      route: "POST /summarize",
      price: PRICES.SUMMARIZE,
      payTo: process.env.SUMMARIZE_AGENT_ADDRESS,
      desc: "Text summarization via GPT-4o-mini",
    },
    {
      route: "POST /sentiment",
      price: PRICES.SENTIMENT,
      payTo: process.env.SENTIMENT_AGENT_ADDRESS,
      desc: "Sentiment analysis via GPT-4o-mini",
    },
    {
      route: "POST /format",
      price: PRICES.FORMAT,
      payTo: process.env.FORMAT_AGENT_ADDRESS,
      desc: "Markdown report formatting",
    },
  ];

  for (const config of agentConfigs) {
    if (!config.payTo) {
      console.warn(
        `[agents] Warning: No address configured for ${config.route}, skipping paywall`,
      );
      continue;
    }

    paywallRoutes[config.route] = {
      accepts: [
        {
          scheme: "exact",
          price: config.price,
          network: NETWORK,
          payTo: config.payTo,
        },
      ],
      description: config.desc,
    };
  }

  if (Object.keys(paywallRoutes).length > 0) {
    app.use(paymentMiddleware(paywallRoutes as Parameters<typeof paymentMiddleware>[0], x402Server));
  }

  // Agent routes
  app.post("/search", searchHandler);
  app.post("/summarize", summarizeHandler);
  app.post("/sentiment", sentimentHandler);
  app.post("/format", formatHandler);

  app.listen(PORT, () => {
    console.log(`[agents] All 4 agents running on http://localhost:${PORT}`);
    console.log(
      `[agents] Routes: /search, /summarize, /sentiment, /format`,
    );
  });
}

startServer().catch((err) => {
  console.error("[agents] Failed to start:", err);
  process.exit(1);
});
