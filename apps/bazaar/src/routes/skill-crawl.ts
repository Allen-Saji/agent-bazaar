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

  // Find the "Available Services" section or similar
  // Then split by ### headings (individual agents)
  const servicesSectionMatch = markdown.match(
    /^## Available Services.*$/m,
  );
  const servicesStart = servicesSectionMatch
    ? markdown.indexOf(servicesSectionMatch[0])
    : 0;
  const servicesText = markdown.slice(servicesStart);

  // Split by ### headings
  const agentSections = servicesText.split(/^### /m).filter((s) => s.trim());

  for (const section of agentSections) {
    const lines = section.split("\n");
    const name = lines[0]?.trim();
    if (!name) continue;

    // Skip section headers that aren't agent names (e.g., "Components", "Method 1:")
    if (name.startsWith("Available Services") || name.startsWith("Component")) continue;

    // Description is the first non-empty line after the heading
    const description = lines.find(
      (l, i) => i > 0 && l.trim() && !l.startsWith("-") && !l.startsWith("*") && !l.startsWith("#") && !l.startsWith(">") && !l.startsWith("```"),
    )?.trim() || "";

    // Parse fields — supports both "- **Field**: `value`" and "- Field: value" formats
    const endpoint = extractBoldField(section, "Endpoint") || "";
    const endpointMatch = endpoint.match(/`?(\w+)\s+(https?:\/\/\S+)`?/);
    const method = endpointMatch?.[1] || extractField(section, "Method") || "POST";
    const fullUrl = endpointMatch?.[2] || extractField(section, "URL") || "";

    let url = baseUrl;
    let path = "/";
    if (fullUrl) {
      try {
        const parsed = new URL(fullUrl);
        url = `${parsed.protocol}//${parsed.host}`;
        path = parsed.pathname;
      } catch {
        // If URL parsing fails, try to extract path
        path = fullUrl.replace(baseUrl, "") || "/";
      }
    }

    // Skip if no valid endpoint found
    if (path === "/" && !fullUrl) continue;

    const priceRaw = extractBoldField(section, "Price") || extractField(section, "Price") || "";
    const price = priceRaw.replace(/[^0-9.]/g, "") || "0.01";
    const network = extractBoldField(section, "Network") || extractField(section, "Network") || "stellar:testnet";
    const category = extractBoldField(section, "Category") || extractField(section, "Category") || "data";
    const payToRaw = extractBoldField(section, "Pay To") || extractField(section, "Pay To") || "";
    const payTo = payToRaw.replace(/`/g, "").trim();

    // Parse input/output fields
    const inputFields = parseFields(section, "**Input:**");
    const outputFields = parseFields(section, "**Output:**");

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
      url,
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

function extractBoldField(text: string, field: string): string | undefined {
  // Matches "- **Field**: value" or "- **Field**: `value`"
  const regex = new RegExp(`^-\\s*\\*\\*${field}\\*\\*:\\s*(.+)$`, "m");
  return regex.exec(text)?.[1]?.trim();
}

function extractField(text: string, field: string): string | undefined {
  // Matches "- Field: value"
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
  // Stop at next section header or code block
  const nextSection = afterSection.search(/\n(\*\*\w|###|```|---)/);
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
