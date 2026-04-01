import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SERVICE_URLS } from "@agent-bazaar/common";

const BAZAAR_URL = process.env.BAZAAR_URL || SERVICE_URLS.BAZAAR;
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || SERVICE_URLS.ORCHESTRATOR;

const server = new Server(
  {
    name: "agent-bazaar",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "browse_bazaar",
      description:
        "Browse all registered x402 services in the AgentBazaar registry. Returns service names, descriptions, prices, categories, and health status.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "discover_services",
      description:
        "Search for services by category and/or max price. Categories: search, inference, analysis, format, data, weather, news, crypto, image, scrape.",
      inputSchema: {
        type: "object" as const,
        properties: {
          category: {
            type: "string",
            description: "Filter by category",
          },
          max_price: {
            type: "string",
            description: "Maximum price in USD (e.g. '0.05')",
          },
        },
      },
    },
    {
      name: "run_pipeline",
      description:
        "Run a multi-agent pipeline. Describe a task and the orchestrator will plan which agents to use, execute them in sequence, and return the result. Each agent call settles USDC on Stellar testnet.",
      inputSchema: {
        type: "object" as const,
        properties: {
          task: {
            type: "string",
            description: "Task description for the agent pipeline",
          },
        },
        required: ["task"],
      },
    },
    {
      name: "quote_pipeline",
      description:
        "Get a price quote for a pipeline without executing it. Shows which agents would be used and the total cost.",
      inputSchema: {
        type: "object" as const,
        properties: {
          task: {
            type: "string",
            description: "Task description to quote",
          },
        },
        required: ["task"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "browse_bazaar": {
        const res = await fetch(`${BAZAAR_URL}/catalog`);
        if (!res.ok) throw new Error(`Bazaar returned ${res.status}`);
        const services = (await res.json()) as Array<{
          name: string;
          description: string;
          category: string;
          price_usd: string;
          healthy: boolean;
          url: string;
          path: string;
          total_calls?: number;
          successful_calls?: number;
          avg_response_ms?: number;
        }>;

        let md = `# AgentBazaar Catalog (${services.length} services)\n\n`;
        md += "| Service | Category | Price | Health | Calls | Success Rate |\n";
        md += "|---------|----------|-------|--------|-------|--------------|\n";
        for (const s of services) {
          const successRate =
            (s.total_calls ?? 0) > 0
              ? `${Math.round(((s.successful_calls ?? 0) / s.total_calls!) * 100)}%`
              : "N/A";
          md += `| ${s.name} | ${s.category} | $${s.price_usd} | ${s.healthy ? "UP" : "DOWN"} | ${s.total_calls ?? 0} | ${successRate} |\n`;
        }

        return { content: [{ type: "text", text: md }] };
      }

      case "discover_services": {
        const params = new URLSearchParams();
        if (args?.category) params.set("category", args.category as string);
        if (args?.max_price) params.set("max_price", args.max_price as string);
        params.set("healthy", "true");

        const res = await fetch(`${BAZAAR_URL}/discover?${params}`);
        if (!res.ok) throw new Error(`Bazaar returned ${res.status}`);
        const services = (await res.json()) as Array<{
          name: string;
          description: string;
          category: string;
          price_usd: string;
          url: string;
          path: string;
        }>;

        if (services.length === 0) {
          return {
            content: [{ type: "text", text: "No services found matching criteria." }],
          };
        }

        let md = `Found ${services.length} services:\n\n`;
        for (const s of services) {
          md += `- **${s.name}** (${s.category}) — $${s.price_usd}\n  ${s.description}\n  \`${s.url}${s.path}\`\n\n`;
        }

        return { content: [{ type: "text", text: md }] };
      }

      case "run_pipeline": {
        const task = args?.task as string;
        if (!task) throw new Error("Missing required argument: task");

        const res = await fetch(`${ORCHESTRATOR_URL}/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: "Unknown" }))) as { error: string };
          throw new Error(err.error || `Orchestrator returned ${res.status}`);
        }

        const result = (await res.json()) as {
          task_id: string;
          steps: Array<{
            step_number: number;
            service_name: string;
            price_usd: string;
            status: string;
            duration_ms?: number;
            tx_hash?: string;
          }>;
          final_output: Record<string, unknown>;
          user_paid_usd: string;
          total_downstream_cost_usd: string;
          orchestrator_fee_usd: string;
          duration_ms: number;
        };

        let md = `# Pipeline Result\n\n`;
        md += `**Task:** ${task}\n`;
        md += `**Duration:** ${result.duration_ms}ms\n\n`;
        md += `## Steps\n\n`;
        for (const s of result.steps) {
          md += `${s.step_number}. **${s.service_name}** — $${s.price_usd} — ${s.status} (${s.duration_ms}ms)`;
          if (s.tx_hash) md += ` — [tx](https://stellar.expert/explorer/testnet/tx/${s.tx_hash})`;
          md += `\n`;
        }
        md += `\n## Cost\n`;
        md += `- Total: $${result.user_paid_usd}\n`;
        md += `- Agents: $${result.total_downstream_cost_usd}\n`;
        md += `- Margin: $${result.orchestrator_fee_usd}\n`;
        md += `\n## Output\n\`\`\`json\n${JSON.stringify(result.final_output, null, 2)}\n\`\`\`\n`;

        return { content: [{ type: "text", text: md }] };
      }

      case "quote_pipeline": {
        const task = args?.task as string;
        if (!task) throw new Error("Missing required argument: task");

        const res = await fetch(`${ORCHESTRATOR_URL}/task/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: "Unknown" }))) as { error: string };
          throw new Error(err.error || `Orchestrator returned ${res.status}`);
        }

        const quote = (await res.json()) as {
          steps: number;
          step_details: Array<{ service_name: string; price_usd: string }>;
          total_downstream_usd: string;
          orchestrator_fee_usd: string;
          user_price_usd: string;
        };

        let md = `# Pipeline Quote\n\n`;
        md += `**Task:** ${task}\n`;
        md += `**Steps:** ${quote.steps}\n\n`;
        for (const s of quote.step_details) {
          md += `- ${s.service_name}: $${s.price_usd}\n`;
        }
        md += `\n**Total cost:** $${quote.user_price_usd} (agents: $${quote.total_downstream_usd} + fee: $${quote.orchestrator_fee_usd})\n`;

        return { content: [{ type: "text", text: md }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] AgentBazaar MCP server running on stdio");
}

main().catch((err) => {
  console.error("[mcp] Fatal:", err);
  process.exit(1);
});
