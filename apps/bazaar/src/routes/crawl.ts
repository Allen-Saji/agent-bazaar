import { Router, type Request, type Response } from "express";
import { upsertServiceByUrl } from "../db.js";

const router = Router();

interface WellKnownEndpoint {
  path: string;
  method?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  accepts?: Array<{
    scheme: string;
    price: string;
    network: string;
    payTo?: string;
    asset?: string;
  }>;
  tags?: string[];
}

interface WellKnownResponse {
  version?: number;
  endpoints?: WellKnownEndpoint[];
  services?: WellKnownEndpoint[];
}

function categorizeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes("search") || lower.includes("query")) return "search";
  if (lower.includes("weather")) return "weather";
  if (lower.includes("news")) return "news";
  if (lower.includes("crypto") || lower.includes("market")) return "crypto";
  if (lower.includes("image") || lower.includes("generate")) return "image";
  if (lower.includes("scrape") || lower.includes("extract")) return "scrape";
  if (lower.includes("chat") || lower.includes("summarize") || lower.includes("ai"))
    return "inference";
  if (lower.includes("sentiment") || lower.includes("analys")) return "analysis";
  if (lower.includes("format") || lower.includes("template")) return "format";
  return "data";
}

router.post("/crawl", async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: "Missing required field: url" });
    return;
  }

  const wellKnownUrl = url.replace(/\/$/, "") + "/.well-known/x402";

  let data: WellKnownResponse;
  try {
    const response = await fetch(wellKnownUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(502).json({
        error: `Failed to fetch ${wellKnownUrl}: ${response.status}`,
      });
      return;
    }

    data = (await response.json()) as WellKnownResponse;
  } catch (err) {
    res.status(502).json({
      error: `Failed to fetch ${wellKnownUrl}: ${(err as Error).message}`,
    });
    return;
  }

  const endpoints = data.endpoints || data.services || [];
  const registered: string[] = [];

  for (const ep of endpoints) {
    const accept = ep.accepts?.[0];
    if (!accept) continue;

    const baseUrl = url.replace(/\/$/, "");
    const id = upsertServiceByUrl(baseUrl, ep.path, {
      url: baseUrl,
      path: ep.path,
      method: ep.method || "POST",
      name: ep.name || ep.path.replace(/^\//, "").replace(/[-/]/g, " "),
      description: ep.description || `Service at ${ep.path}`,
      category: (ep.category || categorizeFromPath(ep.path)) as never,
      price_usd: accept.price || ep.price || "0.01",
      network: accept.network || "stellar:testnet",
      asset: accept.asset || "USDC",
      pay_to: accept.payTo || "",
      tags: ep.tags?.join(","),
      source: "crawl",
    });

    registered.push(id);
  }

  res.json({
    message: `Crawled ${wellKnownUrl}`,
    endpoints_found: endpoints.length,
    registered: registered.length,
    ids: registered,
  });
});

export default router;
