import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PORTS, PRICES, NETWORK, FACILITATOR_URL, SERVICE_URLS } from "@agent-bazaar/common";
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

  // Agent metadata for SKILL.md and self-registration
  const agentMeta = [
    {
      name: "Search Agent",
      description: "Web search powered by Serper (Google). Returns top results with titles, URLs, and snippets.",
      path: "/search",
      method: "POST",
      price: PRICES.SEARCH,
      category: "search",
      payTo: process.env.SEARCH_AGENT_ADDRESS || "",
      tags: "search,web,google",
      input: [
        { name: "query", type: "string", required: true, description: "Search query" },
        { name: "num_results", type: "number", required: false, description: "Number of results (default 5)" },
      ],
      output: [
        { name: "results", type: "array", description: "[{title, url, snippet}]" },
      ],
    },
    {
      name: "Summarize Agent",
      description: "Text summarization powered by GPT-4o-mini. Condenses text to specified word count.",
      path: "/summarize",
      method: "POST",
      price: PRICES.SUMMARIZE,
      category: "inference",
      payTo: process.env.SUMMARIZE_AGENT_ADDRESS || "",
      tags: "summarize,ai,text",
      input: [
        { name: "text", type: "string", required: true, description: "Text to summarize" },
        { name: "max_words", type: "number", required: false, description: "Max words (default 200)" },
      ],
      output: [
        { name: "summary", type: "string", description: "Summarized text" },
      ],
    },
    {
      name: "Sentiment Agent",
      description: "Sentiment analysis powered by GPT-4o-mini. Returns sentiment label, score, and reasoning.",
      path: "/sentiment",
      method: "POST",
      price: PRICES.SENTIMENT,
      category: "analysis",
      payTo: process.env.SENTIMENT_AGENT_ADDRESS || "",
      tags: "sentiment,analysis,ai",
      input: [
        { name: "text", type: "string", required: true, description: "Text to analyze" },
      ],
      output: [
        { name: "sentiment", type: "string", description: "positive | negative | neutral | mixed" },
        { name: "score", type: "number", description: "Score from -1.0 to 1.0" },
        { name: "reasoning", type: "string", description: "Brief explanation" },
      ],
    },
    {
      name: "Format Agent",
      description: "Markdown report formatter using Handlebars templates. Structures data into readable reports.",
      path: "/format",
      method: "POST",
      price: PRICES.FORMAT,
      category: "format",
      payTo: process.env.FORMAT_AGENT_ADDRESS || "",
      tags: "format,markdown,template",
      input: [
        { name: "title", type: "string", required: true, description: "Report title" },
        { name: "sections", type: "array", required: true, description: "[{heading, content}]" },
      ],
      output: [
        { name: "markdown", type: "string", description: "Formatted markdown report" },
      ],
    },
  ];

  // SKILL.md endpoint — machine-readable agent discovery
  app.get("/SKILL.md", (_req, res) => {
    const baseUrl = `http://localhost:${PORT}`;
    let md = `# AgentBazaar Specialist Agents\n`;
    md += `> ${agentMeta.length} x402-paywalled AI services\n\n`;
    md += `Base URL: ${baseUrl}\n\n---\n\n`;

    for (const agent of agentMeta) {
      md += `# ${agent.name}\n`;
      md += `> ${agent.description}\n\n`;
      md += `## Endpoint\n`;
      md += `- URL: ${baseUrl}${agent.path}\n`;
      md += `- Method: ${agent.method}\n`;
      md += `- Price: $${agent.price} USDC\n`;
      md += `- Network: ${NETWORK}\n`;
      md += `- Category: ${agent.category}\n`;
      if (agent.payTo) md += `- Pay To: ${agent.payTo}\n`;
      md += `\n## Input\n`;
      for (const field of agent.input) {
        md += `- \`${field.name}\` (${field.type}${field.required ? ", required" : ", optional"}): ${field.description}\n`;
      }
      md += `\n## Output\n`;
      for (const field of agent.output) {
        md += `- \`${field.name}\` (${field.type}): ${field.description}\n`;
      }
      md += `\n---\n\n`;
    }

    res.type("text/markdown").send(md);
  });

  app.listen(PORT, () => {
    console.log(`[agents] All 4 agents running on http://localhost:${PORT}`);
    console.log(
      `[agents] Routes: /search, /summarize, /sentiment, /format, /SKILL.md`,
    );

    // Self-register with bazaar
    registerWithBazaar(agentMeta, PORT);
  });
}

async function registerWithBazaar(
  agents: Array<{ name: string; description: string; path: string; method: string; price: string; category: string; payTo: string; tags: string; input: Array<{ name: string; type: string; required?: boolean }>; output: Array<{ name: string; type: string }> }>,
  port: string | number,
): Promise<void> {
  const bazaarUrl = SERVICE_URLS.BAZAAR;
  const baseUrl = `http://localhost:${port}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      for (const agent of agents) {
        if (!agent.payTo) {
          console.log(`[agents] Skipping registration for ${agent.name} (no address)`);
          continue;
        }

        const res = await fetch(`${bazaarUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: baseUrl,
            path: agent.path,
            method: agent.method,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            price_usd: agent.price,
            network: NETWORK,
            asset: "USDC",
            pay_to: agent.payTo,
            input_schema: {
              type: "object",
              properties: Object.fromEntries(
                agent.input.map((f) => [f.name, { type: f.type }]),
              ),
              required: agent.input.filter((f) => f.required).map((f) => f.name),
            },
            output_schema: {
              type: "object",
              properties: Object.fromEntries(
                agent.output.map((f) => [f.name, { type: f.type }]),
              ),
            },
            tags: agent.tags.split(","),
          }),
        });

        if (res.ok) {
          console.log(`[agents] Registered ${agent.name} with bazaar`);
        } else {
          console.warn(`[agents] Failed to register ${agent.name}: ${res.status}`);
        }
      }
      return;
    } catch {
      if (attempt < 3) {
        console.log(`[agents] Bazaar not ready, retrying in 2s (attempt ${attempt}/3)...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn("[agents] Could not register with bazaar after 3 attempts");
      }
    }
  }
}

startServer().catch((err) => {
  console.error("[agents] Failed to start:", err);
  process.exit(1);
});
