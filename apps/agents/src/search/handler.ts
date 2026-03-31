import type { Request, Response } from "express";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperResult[];
}

export async function searchHandler(req: Request, res: Response): Promise<void> {
  const { query, num_results = 5 } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "Missing required field: query" });
    return;
  }

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Search service not configured" });
    return;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: Math.min(num_results, 10),
    }),
  });

  if (!response.ok) {
    res.status(502).json({
      error: `Search API error: ${response.status}`,
    });
    return;
  }

  const data = (await response.json()) as SerperResponse;

  const results = (data.organic || []).slice(0, num_results).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
  }));

  res.json({ results });
}
