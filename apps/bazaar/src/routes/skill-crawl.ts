import { Router, type Request, type Response } from "express";
import { upsertServiceByUrl } from "../db.js";

const router = Router();

interface ParsedAgent {
  name: string;
  description: string;
  url: string;
  path: string;
  method: string;
  price: string;
  network: string;
  category: string;
  payTo: string;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  tags: string;
}

function parseSkillMd(markdown: string, baseUrl: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];
  // Split by top-level headings (# Name), skip the first section (header)
  const sections = markdown.split(/^# /m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split("\n");
    const name = lines[0]?.trim();
    if (!name) continue;

    // Skip if this is a header section (contains "Base URL")
    if (section.includes("Base URL:")) continue;

    const description =
      lines.find((l) => l.startsWith("> "))?.replace(/^>\s*/, "") || "";

    // Parse endpoint section
    const url =
      extractField(section, "URL") || baseUrl;
    const path = new URL(url).pathname || "/";
    const method = extractField(section, "Method") || "POST";
    const price = extractField(section, "Price")?.replace(/[^0-9.]/g, "") || "0.01";
    const network = extractField(section, "Network") || "stellar:testnet";
    const category = extractField(section, "Category") || "data";
    const payTo = extractField(section, "Pay To") || "";

    // Parse input fields
    const inputFields = parseFields(section, "## Input");
    const outputFields = parseFields(section, "## Output");

    const inputSchema = inputFields.length > 0
      ? {
          type: "object",
          properties: Object.fromEntries(
            inputFields.map((f) => [f.name, { type: f.type }]),
          ),
          required: inputFields.filter((f) => f.required).map((f) => f.name),
        }
      : null;

    const outputSchema = outputFields.length > 0
      ? {
          type: "object",
          properties: Object.fromEntries(
            outputFields.map((f) => [f.name, { type: f.type }]),
          ),
        }
      : null;

    agents.push({
      name,
      description,
      url: url.replace(path, ""),
      path,
      method,
      price,
      network,
      category,
      payTo,
      inputSchema,
      outputSchema,
      tags: category,
    });
  }

  return agents;
}

function extractField(text: string, field: string): string | undefined {
  const regex = new RegExp(`^-\\s*${field}:\\s*(.+)$`, "m");
  return regex.exec(text)?.[1]?.trim();
}

function parseFields(
  text: string,
  sectionHeader: string,
): Array<{ name: string; type: string; required: boolean }> {
  const sectionIdx = text.indexOf(sectionHeader);
  if (sectionIdx === -1) return [];

  const afterSection = text.slice(sectionIdx + sectionHeader.length);
  const nextSection = afterSection.indexOf("\n## ");
  const block = nextSection > -1 ? afterSection.slice(0, nextSection) : afterSection;

  const fields: Array<{ name: string; type: string; required: boolean }> = [];
  const fieldRegex = /^-\s*`(\w+)`\s*\((\w+)(?:,\s*(required|optional))?\)/gm;
  let match;
  while ((match = fieldRegex.exec(block)) !== null) {
    fields.push({
      name: match[1],
      type: match[2],
      required: match[3] === "required",
    });
  }
  return fields;
}

router.post("/crawl/skill", async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: "Missing required field: url" });
    return;
  }

  const skillUrl = url.replace(/\/$/, "") + "/SKILL.md";

  let markdown: string;
  try {
    const response = await fetch(skillUrl, {
      headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(502).json({
        error: `Failed to fetch ${skillUrl}: ${response.status}`,
      });
      return;
    }

    markdown = await response.text();
  } catch (err) {
    res.status(502).json({
      error: `Failed to fetch ${skillUrl}: ${(err as Error).message}`,
    });
    return;
  }

  const agents = parseSkillMd(markdown, url.replace(/\/$/, ""));
  const registered: string[] = [];

  for (const agent of agents) {
    const id = upsertServiceByUrl(agent.url, agent.path, {
      url: agent.url,
      path: agent.path,
      method: agent.method,
      name: agent.name,
      description: agent.description,
      category: agent.category as never,
      price_usd: agent.price,
      network: agent.network,
      asset: "USDC",
      pay_to: agent.payTo,
      input_schema: agent.inputSchema ? JSON.stringify(agent.inputSchema) : undefined,
      output_schema: agent.outputSchema ? JSON.stringify(agent.outputSchema) : undefined,
      tags: agent.tags,
      source: "crawl",
    });
    registered.push(id);
  }

  res.json({
    message: `Crawled ${skillUrl}`,
    agents_found: agents.length,
    registered: registered.length,
    ids: registered,
  });
});

export default router;
