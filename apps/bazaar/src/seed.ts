import { registerService, discoverServices } from "./db.js";
import { PRICES, NETWORK, SERVICE_URLS } from "@agent-bazaar/common";

export async function seedDemoAgents(): Promise<void> {
  const existing = discoverServices();
  if (existing.some((s) => s.source === "manual" && s.url.includes("localhost"))) {
    console.log("[seed] Demo agents already registered, skipping");
    return;
  }

  const agentsBaseUrl = SERVICE_URLS.AGENTS;

  const agents = [
    {
      url: agentsBaseUrl,
      path: "/search",
      method: "POST",
      name: "Search Agent",
      description:
        "Web search powered by Serper (Google). Returns top results with titles, URLs, and snippets.",
      category: "search" as const,
      price_usd: PRICES.SEARCH,
      network: NETWORK,
      asset: "USDC",
      pay_to: process.env.SEARCH_AGENT_ADDRESS || "PLACEHOLDER",
      input_schema: JSON.stringify({
        type: "object",
        properties: {
          query: { type: "string" },
          num_results: { type: "number", default: 5 },
        },
        required: ["query"],
      }),
      output_schema: JSON.stringify({
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                snippet: { type: "string" },
              },
            },
          },
        },
      }),
      tags: "search,web,google",
      source: "manual" as const,
    },
    {
      url: agentsBaseUrl,
      path: "/summarize",
      method: "POST",
      name: "Summarize Agent",
      description:
        "Text summarization powered by GPT-4o-mini. Condenses text to specified word count.",
      category: "inference" as const,
      price_usd: PRICES.SUMMARIZE,
      network: NETWORK,
      asset: "USDC",
      pay_to: process.env.SUMMARIZE_AGENT_ADDRESS || "PLACEHOLDER",
      input_schema: JSON.stringify({
        type: "object",
        properties: {
          text: { type: "string" },
          max_words: { type: "number", default: 200 },
        },
        required: ["text"],
      }),
      output_schema: JSON.stringify({
        type: "object",
        properties: { summary: { type: "string" } },
      }),
      tags: "summarize,ai,text",
      source: "manual" as const,
    },
    {
      url: agentsBaseUrl,
      path: "/sentiment",
      method: "POST",
      name: "Sentiment Agent",
      description:
        "Sentiment analysis powered by GPT-4o-mini. Returns sentiment label, score, and reasoning.",
      category: "analysis" as const,
      price_usd: PRICES.SENTIMENT,
      network: NETWORK,
      asset: "USDC",
      pay_to: process.env.SENTIMENT_AGENT_ADDRESS || "PLACEHOLDER",
      input_schema: JSON.stringify({
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      }),
      output_schema: JSON.stringify({
        type: "object",
        properties: {
          sentiment: { type: "string" },
          score: { type: "number" },
          reasoning: { type: "string" },
        },
      }),
      tags: "sentiment,analysis,ai",
      source: "manual" as const,
    },
    {
      url: agentsBaseUrl,
      path: "/format",
      method: "POST",
      name: "Format Agent",
      description:
        "Markdown report formatter using Handlebars templates. Structures data into readable reports.",
      category: "format" as const,
      price_usd: PRICES.FORMAT,
      network: NETWORK,
      asset: "USDC",
      pay_to: process.env.FORMAT_AGENT_ADDRESS || "PLACEHOLDER",
      input_schema: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
        required: ["title", "sections"],
      }),
      output_schema: JSON.stringify({
        type: "object",
        properties: { markdown: { type: "string" } },
      }),
      tags: "format,markdown,template",
      source: "manual" as const,
    },
  ];

  for (const agent of agents) {
    registerService(agent);
    console.log(`[seed] Registered: ${agent.name} at ${agent.url}${agent.path}`);
  }
}

export async function crawlXlm402(): Promise<void> {
  const existing = discoverServices();
  if (existing.some((s) => s.source === "crawl")) {
    console.log("[seed] xlm402 already crawled, skipping");
    return;
  }

  console.log("[seed] Crawling xlm402.com/.well-known/x402...");

  try {
    const res = await fetch("https://xlm402.com/.well-known/x402", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`[seed] Failed to crawl xlm402: ${res.status}`);
      return;
    }

    const data = (await res.json()) as {
      endpoints?: Array<{
        path: string;
        method?: string;
        name?: string;
        description?: string;
        accepts?: Array<{
          scheme: string;
          price: string;
          network: string;
          payTo?: string;
          asset?: string;
        }>;
      }>;
    };

    const endpoints = data.endpoints || [];
    let count = 0;

    for (const ep of endpoints) {
      const accept = ep.accepts?.[0];
      if (!accept) continue;

      // Only import testnet endpoints
      if (!accept.network?.includes("testnet")) continue;

      registerService({
        url: "https://xlm402.com",
        path: ep.path,
        method: ep.method || "GET",
        name: ep.name || ep.path.replace(/^\//, "").replace(/[-/]/g, " "),
        description: ep.description || `xlm402 service: ${ep.path}`,
        category: categorizeEndpoint(ep.path),
        price_usd: accept.price,
        network: accept.network,
        asset: accept.asset || "USDC",
        pay_to: accept.payTo || "",
        tags: "xlm402,external",
        source: "crawl" as const,
      });
      count++;
    }

    console.log(`[seed] Crawled ${count} testnet endpoints from xlm402.com`);
  } catch (err) {
    console.error(`[seed] Error crawling xlm402: ${(err as Error).message}`);
  }
}

function categorizeEndpoint(path: string): import("@agent-bazaar/common").ServiceCategory {
  const lower = path.toLowerCase();
  if (lower.includes("weather")) return "weather";
  if (lower.includes("news")) return "news";
  if (lower.includes("crypto") || lower.includes("candle") || lower.includes("quote"))
    return "crypto";
  if (lower.includes("chat")) return "inference";
  if (lower.includes("image")) return "image";
  if (lower.includes("scrape")) return "scrape";
  if (lower.includes("collect")) return "data";
  return "data";
}
