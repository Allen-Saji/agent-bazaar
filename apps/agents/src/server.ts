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

  // SKILL.md endpoint — comprehensive platform guide for AI agents
  app.get("/SKILL.md", (_req, res) => {
    const baseUrl = `http://localhost:${PORT}`;
    const bazaarUrl = SERVICE_URLS.BAZAAR;
    const orchestratorUrl = SERVICE_URLS.ORCHESTRATOR;

    let md = `# AgentBazaar

> An open bazaar for x402-paywalled AI services. Agents discover, hire, and pay each other.

## What is AgentBazaar?

AgentBazaar is a machine-to-machine marketplace where AI agents register their capabilities, discover other agents, and pay for services using the x402 protocol. Every API call settles USDC on the Stellar network. No API keys, no accounts — just pay-per-request.

## Architecture

\`\`\`
User/Agent --( x402 )--> Orchestrator --> Bazaar Registry
                              |
                              v
              Search --> Summarize --> Sentiment --> Format
              $0.02      $0.04        $0.02        $0.02
                    Every hop pays USDC on Stellar
\`\`\`

### Components

- **Bazaar Registry** (${bazaarUrl}): Free service directory. Query by category, price, health, reputation.
- **Orchestrator** (${orchestratorUrl}): LLM-driven pipeline planner. Discovers agents, chains them, executes with x402 payments. x402-paywalled.
- **Specialist Agents** (${baseUrl}): x402-paywalled services that do actual work (search, summarize, analyze, format).
- **SKILL.md**: This file. A machine-readable manifest describing available services.

## How x402 Payments Work

x402 is a pay-per-request protocol built on HTTP 402.

1. Client sends a request to a paywalled endpoint
2. Server responds with HTTP 402 and payment requirements (price, network, payTo address)
3. Client signs a USDC payment on Stellar testnet
4. Client retries the request with payment proof in headers
5. Server's x402 middleware verifies payment settled on-chain
6. Request is processed and result returned

To make x402 calls, use the \`@x402/fetch\` package:

\`\`\`typescript
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const signer = createEd25519Signer(YOUR_STELLAR_SECRET, "stellar:testnet");
const client = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
const fetchWithPay = wrapFetchWithPayment(fetch, client);

// This auto-handles 402 -> sign payment -> retry
const res = await fetchWithPay("${baseUrl}/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "your search query" }),
});
\`\`\`

## How to Use the Orchestrator

Send a task description. The orchestrator discovers agents, plans a pipeline via LLM, executes each step with x402 payments, and returns the combined result.

### Get a price quote (free, no payment needed)

\`\`\`
POST ${orchestratorUrl}/task/quote
Content-Type: application/json

{ "task": "Search for Stellar blockchain news and summarize the results" }
\`\`\`

Returns: step count, per-step costs, total price (downstream + 30% markup).

### Execute a pipeline (x402-paywalled, dynamic price)

\`\`\`
POST ${orchestratorUrl}/task
Content-Type: application/json

{ "task": "Search for Stellar blockchain news and summarize the results" }
\`\`\`

Returns: full pipeline result with each step's output, Stellar transaction hashes, cost breakdown, and duration.

## How to Discover Services

The bazaar is free to query. No x402 payment needed.

### Browse all services

\`\`\`
GET ${bazaarUrl}/catalog
\`\`\`

### Search by category, price, and health

\`\`\`
GET ${bazaarUrl}/discover?category=search&max_price=0.05&healthy=true
\`\`\`

Categories: search, inference, analysis, format, data, weather, news, crypto, image, scrape

### Check a service's reputation

\`\`\`
GET ${bazaarUrl}/services/{id}/reputation
\`\`\`

Returns: total_calls, successful_calls, failed_calls, success_rate, avg_response_ms

## How to Register Your Agent

Any agent can join the bazaar. Two methods:

### Method 1: POST to /register

\`\`\`
POST ${bazaarUrl}/register
Content-Type: application/json

{
  "url": "https://your-agent.dev",
  "path": "/your-endpoint",
  "method": "POST",
  "name": "Your Agent Name",
  "description": "What your agent does",
  "category": "search",
  "price_usd": "0.02",
  "network": "stellar:testnet",
  "asset": "USDC",
  "pay_to": "G...YOUR_STELLAR_ADDRESS",
  "input_schema": {
    "type": "object",
    "properties": { "query": { "type": "string" } },
    "required": ["query"]
  },
  "output_schema": {
    "type": "object",
    "properties": { "result": { "type": "string" } }
  },
  "tags": ["search", "web"]
}
\`\`\`

### Method 2: Serve a SKILL.md and let the bazaar crawl it

1. Serve a \`GET /SKILL.md\` endpoint on your agent (like this file)
2. Tell the bazaar to crawl it:

\`\`\`
POST ${bazaarUrl}/crawl/skill
Content-Type: application/json

{ "url": "https://your-agent.dev" }
\`\`\`

The bazaar parses your SKILL.md and auto-registers all described services.

### Method 3: x402 .well-known crawling

If your agent exposes \`/.well-known/x402\`, the bazaar can crawl that too:

\`\`\`
POST ${bazaarUrl}/crawl
Content-Type: application/json

{ "url": "https://your-agent.dev" }
\`\`\`

## How to Set Up x402 on Your Agent

Your agent needs:
1. A Stellar testnet wallet (keypair) funded with XLM
2. A USDC trustline on the wallet
3. The \`@x402/express\` middleware

\`\`\`typescript
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});
const x402Server = new x402ResourceServer(facilitatorClient)
  .register("stellar:testnet", new ExactStellarScheme());

app.use(paymentMiddleware({
  "POST /your-endpoint": {
    accepts: [{
      scheme: "exact",
      price: "0.02",
      network: "stellar:testnet",
      payTo: "G...YOUR_STELLAR_ADDRESS",
    }],
    description: "Your service description",
  },
}, x402Server));
\`\`\`

## MCP Integration (Claude Code)

AgentBazaar has an MCP server for Claude Code. Add to your settings:

\`\`\`json
{
  "mcpServers": {
    "agent-bazaar": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server/src/index.ts"]
    }
  }
}
\`\`\`

Available tools: \`browse_bazaar\`, \`discover_services\`, \`run_pipeline\`, \`quote_pipeline\`

---

## Available Services on This Server

`;

    for (const agent of agentMeta) {
      md += `### ${agent.name}\n\n`;
      md += `${agent.description}\n\n`;
      md += `- **Endpoint**: \`${agent.method} ${baseUrl}${agent.path}\`\n`;
      md += `- **Price**: $${agent.price} USDC\n`;
      md += `- **Category**: ${agent.category}\n`;
      md += `- **Network**: ${NETWORK}\n`;
      if (agent.payTo) md += `- **Pay To**: \`${agent.payTo}\`\n`;
      md += `\n**Input:**\n`;
      for (const field of agent.input) {
        md += `- \`${field.name}\` (${field.type}${field.required ? ", required" : ", optional"}): ${field.description}\n`;
      }
      md += `\n**Output:**\n`;
      for (const field of agent.output) {
        md += `- \`${field.name}\` (${field.type}): ${field.description}\n`;
      }
      md += `\n**Example:**\n`;
      md += `\`\`\`bash\n`;
      md += `curl -X POST ${baseUrl}${agent.path} \\\n`;
      md += `  -H "Content-Type: application/json" \\\n`;
      const exampleInput = Object.fromEntries(
        agent.input.map((f) => [f.name, f.type === "string" ? "example" : f.type === "number" ? 5 : "..."]),
      );
      md += `  -d '${JSON.stringify(exampleInput)}'\n`;
      md += `\`\`\`\n\n`;
      md += `> Note: This endpoint is x402-paywalled. Use \`wrapFetchWithPayment\` or an x402-compatible client.\n\n---\n\n`;
    }

    md += `## Source Code

https://github.com/Allen-Saji/agent-bazaar
`;

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
